//
//  FirebaseService.swift
//  BurpeePacer
//
//  Handles Firebase Auth + Firestore sync.
//  Mirrors the web app's Firestore schema (users/{uid}).
//

import Foundation
import FirebaseAuth
import FirebaseCore
import FirebaseFirestore
import GoogleSignIn
import AuthenticationServices
import CryptoKit

// MARK: - Firestore Schema Types (mirror web types/index.ts)

struct FirestoreWorkoutLog {
    var date: String          // "YYYY-MM-DD"
    var completed: Bool
    var levelCompleted: String?   // e.g. "1C(N)", "B3(C)"
    var workoutType: String?      // "with_pushups" | "no_pushups"
    var repsCompleted: Int?
    var notes: String?
}

struct FirestoreUserData {
    var startDate: String         // "YYYY-MM-DD"
    var startWeight: Double       // in lbs
    var workoutTier: String?      // "beginner" | "advanced"
    var currentLevelId: String?
    var isPro: Bool?
    var isAdmin: Bool?
    var startPictureUrl: String?
    var workoutLogs: [FirestoreWorkoutLog]
    var workoutDays: [Int]?
    var ageBracket: String?
    var equipment: String?
}

// MARK: - FirebaseService

@Observable
class FirebaseService {

    // Published state
    var currentUser: User?       = nil
    var userData: FirestoreUserData? = nil
    var isLoading: Bool          = true
    var authError: String?       = nil

    private var authHandle: AuthStateDidChangeListenerHandle?
    private var snapshotListener: ListenerRegistration?
    private let db = Firestore.firestore()
    private var currentListenerUID: String? = nil

    init() {
        authHandle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            guard let self else { return }
            self.currentUser = user
            self.attachListener(uid: user?.uid)
        }
    }

    deinit {
        if let h = authHandle { Auth.auth().removeStateDidChangeListener(h) }
        snapshotListener?.remove()
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async {
        authError = nil
        do {
            try await Auth.auth().signIn(withEmail: email, password: password)
        } catch let error as NSError {
            authError = friendlyAuthError(error, isSignUp: false)
        }
    }

    func signUp(email: String, password: String) async {
        authError = nil
        do {
            try await Auth.auth().createUser(withEmail: email, password: password)
        } catch let error as NSError {
            authError = friendlyAuthError(error, isSignUp: true)
        }
    }

    private func friendlyAuthError(_ error: NSError, isSignUp: Bool) -> String {
        guard error.domain == AuthErrorDomain else { return error.localizedDescription }
        switch AuthErrorCode(rawValue: error.code) {
        case .userNotFound:
            return "No account found with that email. Please sign up first."
        case .wrongPassword, .invalidCredential:
            return "Incorrect email or password. Please try again."
        case .emailAlreadyInUse:
            return "An account with this email already exists. Try signing in instead."
        case .weakPassword:
            return "Password must be at least 6 characters."
        case .invalidEmail:
            return "Please enter a valid email address."
        case .networkError:
            return "Network error. Check your connection and try again."
        case .tooManyRequests:
            return "Too many attempts. Please wait a moment and try again."
        default:
            return isSignUp ? "Sign up failed. Please try again." : "Sign in failed. Please try again."
        }
    }

    @MainActor
    func signInWithGoogle() async {
        authError = nil
        guard let clientID = FirebaseApp.app()?.options.clientID else { return }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)

        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root  = scene.windows.first?.rootViewController else {
            authError = "Cannot find root view controller"
            return
        }

        do {
            let result     = try await GIDSignIn.sharedInstance.signIn(withPresenting: root)
            guard let idToken = result.user.idToken?.tokenString else {
                authError = "Missing Google ID token"
                return
            }
            let credential = GoogleAuthProvider.credential(
                withIDToken: idToken,
                accessToken: result.user.accessToken.tokenString
            )
            try await Auth.auth().signIn(with: credential)
        } catch {
            authError = error.localizedDescription
        }
    }

    /// Handles the Firebase sign-in after Apple authorization is successful.
    func handleAppleSignIn(idToken: String, rawNonce: String, fullName: PersonNameComponents?) async {
        authError = nil
        let credential = OAuthProvider.appleCredential(withIDToken: idToken, rawNonce: rawNonce, fullName: fullName)
        
        do {
            let result = try await Auth.auth().signIn(with: credential)
            
            // On first sign-in, Apple provides the name. We should save it to Firestore.
            if let fullName = fullName {
                let uid = result.user.uid
                let name = [fullName.givenName, fullName.familyName]
                    .compactMap { $0 }
                    .joined(separator: " ")
                
                if !name.isEmpty {
                    try? await db.collection("users").document(uid).setData(["displayName": name], merge: true)
                }
            }
        } catch {
            authError = error.localizedDescription
        }
    }

    func signOut() {
        try? Auth.auth().signOut()
        userData = nil
        currentListenerUID = nil
    }

    /// Deletes the user's account. Handles the 'requires recent login' error by asking for re-authentication.
    func deleteAccount() async -> (success: Bool, requiresReauth: Bool) {
        guard let user = Auth.auth().currentUser else { return (false, false) }
        let uid = user.uid
        
        do {
            // 1. Delete Auth account first. This will fail if a recent login is required.
            try await user.delete()
            
            // 2. Delete Firestore data only after auth deletion succeeds.
            try? await db.collection("users").document(uid).delete()
            
            // 3. Clear local state
            signOut()
            return (true, false)
        } catch {
            let nsError = error as NSError
            if nsError.domain == AuthErrorDomain && nsError.code == AuthErrorCode.requiresRecentLogin.rawValue {
                return (false, true)
            }
            authError = error.localizedDescription
            return (false, false)
        }
    }

    func updateLevel(_ levelID: String) async {
        guard let uid = currentUser?.uid else { return }
        try? await db.collection("users").document(uid)
            .updateData(["currentLevelId": levelID])
    }

    // MARK: - Firestore Listener

    func attachListener(uid: String?) {
        if uid == currentListenerUID && snapshotListener != nil {
            return
        }
        
        snapshotListener?.remove()
        snapshotListener = nil
        currentListenerUID = uid

        guard let uid else {
            userData  = nil
            isLoading = false
            return
        }

        isLoading = true
        snapshotListener = db.collection("users").document(uid)
            .addSnapshotListener { [weak self] snap, err in
                guard let self else { return }
                if let err {
                    self.authError = err.localizedDescription
                    self.isLoading = false
                    return
                }
                guard let snap, snap.exists, let data = snap.data() else {
                    self.initializeNewUserProfile(uid: uid)
                    return
                }
                self.userData  = Self.parse(data)
                self.isLoading = false
            }
    }

    private func initializeNewUserProfile(uid: String) {
        // workoutTier intentionally omitted — user picks during onboarding
        let defaultData: [String: Any] = [
            "startDate": Self.dateKey(Date()),
            "startWeight": 165.0,
            "workoutLogs": []
        ]
        Task {
            try? await db.collection("users").document(uid).setData(defaultData, merge: true)
        }
    }

    func updateWorkoutDays(_ days: [Int]) async {
        guard let uid = currentUser?.uid else { return }
        try? await db.collection("users").document(uid)
            .updateData(["workoutDays": days])
    }

    func updateStartWeight(_ weightLbs: Double) async {
        guard let uid = currentUser?.uid else { return }
        try? await db.collection("users").document(uid)
            .updateData(["startWeight": weightLbs])
    }

    func updateTrack(_ tier: String) async {
        guard let uid = currentUser?.uid else { return }
        let levelId = tier == "advanced" ? "1B" : "B1"
        try? await db.collection("users").document(uid)
            .setData(["workoutTier": tier, "currentLevelId": levelId], merge: true)
    }

    func updatePersonalization(age: AgeBracket, equipment: Equipment) async {
        guard let uid = currentUser?.uid else { return }
        try? await db.collection("users").document(uid)
            .setData([
                "ageBracket": age.rawValue,
                "equipment": equipment.rawValue
            ], merge: true)
    }

    // MARK: - Save Workout Log

    func saveWorkoutLog(
        date: Date,
        levelID: String,
        mode: WorkoutMode,
        repsCompleted: Int,
        completed: Bool
    ) async {
        guard let uid = currentUser?.uid, let data = userData else { return }

        let dateKey   = Self.dateKey(date)
        let isBeginnerLevel = levelID.hasPrefix("B")
        let levelCompleted  = "\(levelID)(\(mode.rawValue))"
        let workoutType     = isBeginnerLevel ? "no_pushups" : "with_pushups"

        let newLog = FirestoreWorkoutLog(
            date:           dateKey,
            completed:      completed,
            levelCompleted: levelCompleted,
            workoutType:    workoutType,
            repsCompleted:  repsCompleted > 0 ? repsCompleted : nil
        )

        var logs = data.workoutLogs
        if let idx = logs.firstIndex(where: { $0.date == dateKey }) {
            logs[idx] = newLog
        } else {
            logs.append(newLog)
        }

        // Mirror web workoutStats computation
        let workoutsCompleted = logs.filter { $0.completed }.count
        let timerVerified     = logs.filter { $0.completed && $0.repsCompleted != nil }.count

        let logsPayload: [[String: Any]] = logs.map { l in
            var d: [String: Any] = ["date": l.date, "completed": l.completed]
            if let lc = l.levelCompleted  { d["levelCompleted"] = lc }
            if let wt = l.workoutType     { d["workoutType"]    = wt }
            if let rc = l.repsCompleted   { d["repsCompleted"]  = rc }
            if let n  = l.notes           { d["notes"]          = n  }
            return d
        }

        let statsPayload: [String: Any] = [
            "workoutsCompleted": workoutsCompleted,
            "timerVerified":     timerVerified
        ]

        try? await db.collection("users").document(uid)
            .updateData(["workoutLogs": logsPayload, "workoutStats": statsPayload])
    }

    // MARK: - Helpers: Firestore → Swift models

    static func parse(_ data: [String: Any]) -> FirestoreUserData {
        var logs: [FirestoreWorkoutLog] = []
        if let raw = data["workoutLogs"] as? [[String: Any]] {
            logs = raw.compactMap { r in
                guard let date      = r["date"]      as? String,
                      let completed = r["completed"] as? Bool else { return nil }
                return FirestoreWorkoutLog(
                    date:           date,
                    completed:      completed,
                    levelCompleted: r["levelCompleted"] as? String,
                    workoutType:    r["workoutType"]    as? String,
                    repsCompleted:  r["repsCompleted"]  as? Int,
                    notes:          r["notes"]          as? String
                )
            }
        }

        // Web has a typo variant "startPictureURl" — handle both
        let pictureUrl = data["startPictureUrl"] as? String
                      ?? data["startPictureURl"] as? String

        return FirestoreUserData(
            startDate:       data["startDate"]      as? String ?? "",
            startWeight:     (data["startWeight"] as? Double) ?? Double(data["startWeight"] as? Int ?? 0),
            workoutTier:     data["workoutTier"]    as? String,
            currentLevelId:  data["currentLevelId"] as? String,
            isPro:           data["isPro"]           as? Bool,
            isAdmin:         data["isAdmin"]         as? Bool,
            startPictureUrl: pictureUrl,
            workoutLogs:     logs,
            workoutDays:     data["workoutDays"]    as? [Int],
            ageBracket:      data["ageBracket"]     as? String,
            equipment:       data["equipment"]      as? String
        )
    }

    /// Converts Firestore workoutLogs to WorkoutSession objects for the calendar
    static func sessions(from logs: [FirestoreWorkoutLog]) -> [WorkoutSession] {
        logs.compactMap { log in
            guard log.completed, let date = Self.date(from: log.date) else { return nil }
            let (levelID, mode) = parseLevelCompleted(log.levelCompleted)
            return WorkoutSession(
                date:          date,
                levelID:       levelID,
                workoutMode:   mode,
                repsCompleted: log.repsCompleted ?? 0,
                targetReps:    0,
                completed:     true
            )
        }
    }

    // MARK: - Helpers: date keys

    static func dateKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale     = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }

    static func date(from key: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale     = Locale(identifier: "en_US_POSIX")
        return f.date(from: key)
    }

    // MARK: - Helpers: parse "1C(N)" → ("1C", .navySeals)

    static func parseLevelCompleted(_ lc: String?) -> (String, WorkoutMode) {
        guard let lc, !lc.isEmpty else { return ("", .fiveCount) }
        // Pattern: anything followed by (N), (C), or (H)
        let pattern = #"^(.+)\(([NCH])\)$"#
        if let regex = try? NSRegularExpression(pattern: pattern),
           let match = regex.firstMatch(in: lc, range: NSRange(lc.startIndex..., in: lc)),
           let levelRange = Range(match.range(at: 1), in: lc),
           let modeRange  = Range(match.range(at: 2), in: lc) {
            let levelID  = String(lc[levelRange])
            let modeChar = String(lc[modeRange])
            let mode: WorkoutMode = modeChar == "N" ? .navySeals
                                  : modeChar == "H" ? .hybrid
                                  : .fiveCount
            return (levelID, mode)
        }
        return (lc, .fiveCount)
    }

    // MARK: - Apple Sign In Nonce Helper

    static func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [UInt8] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._".utf8)
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            let chunk = Int(Double(remainingLength).rounded(.up))
            var randomBytes = [UInt8](repeating: 0, count: chunk)
            let status = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
            if status == errSecSuccess {
                for byte in randomBytes {
                    if remainingLength == 0 { break }
                    if byte < charset.count {
                        result.append(Character(UnicodeScalar(charset[Int(byte)])))
                        remainingLength -= 1
                    }
                }
            } else {
                fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(status)")
            }
        }
        return result
    }

    static func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()

        return hashString
    }
}
