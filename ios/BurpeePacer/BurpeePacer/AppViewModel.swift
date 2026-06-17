//
//  AppViewModel.swift
//  BurpeePacer
//
//  Drives the UI from Firestore data (via FirebaseService).
//  UserDefaults is only used for the weight-unit preference.
//

import Foundation
import SwiftUI
import FirebaseAuth

@Observable
class AppViewModel {

    // MARK: - Firebase (source of truth)

    var firebase: FirebaseService
    var storeKit = StoreKitManager()
    
    /// Local latch to prevent UI jumping while Firestore updates.
    var isUpdatingTrack = false

    // MARK: - Local-only preference

    var useKilograms: Bool {
        get { UserDefaults.standard.bool(forKey: "useKilograms") }
        set { UserDefaults.standard.set(newValue, forKey: "useKilograms") }
    }

    var weightedTrainingEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "weightedTrainingEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "weightedTrainingEnabled") }
    }

    // MARK: - Derived from Firestore

    /// The user's start date parsed from Firestore "startDate" field.
    var startDate: Date {
        guard let raw = firebase.userData?.startDate,
              let d   = FirebaseService.date(from: raw) else {
            return Date()
        }
        return d
    }

    /// Start weight in lbs (as stored in Firestore).
    var startWeightLbs: Double {
        firebase.userData?.startWeight ?? 0
    }

    /// True when the signed-in user hasn't chosen a track yet (first login).
    var needsTrackSelection: Bool {
        if isUpdatingTrack { return false }
        guard firebase.currentUser != nil, !firebase.isLoading else { return false }
        let tier = firebase.userData?.workoutTier
        return tier == nil || tier?.isEmpty == true
    }

    var currentTrack: ProgramTrack {
        switch firebase.userData?.workoutTier {
        case "advanced": return .advanced
        default:         return .beginner
        }
    }

    var currentLevelID: String {
        firebase.userData?.currentLevelId ?? (currentTrack == .beginner ? "B1" : "F")
    }

    var currentLevel: Level {
        let levels = LevelDatabase.levels(for: currentTrack)
        return levels.first { $0.id == currentLevelID } ?? levels[0]
    }

    var startPictureUrl: String? {
        firebase.userData?.startPictureUrl
    }

    var ageBracket: AgeBracket {
        get {
            if let raw = firebase.userData?.ageBracket {
                return AgeBracket(rawValue: raw) ?? .fiftiesPlus
            }
            return .fiftiesPlus
        }
        set {
            updatePersonalization(age: newValue, equipment: equipment)
        }
    }

    var equipment: Equipment {
        get {
            if let raw = firebase.userData?.equipment {
                return Equipment(rawValue: raw) ?? .dumbbellsOnly
            }
            return .dumbbellsOnly
        }
        set {
            updatePersonalization(age: ageBracket, equipment: newValue)
        }
    }

    func updatePersonalization(age: AgeBracket, equipment: Equipment) {
        Task { await firebase.updatePersonalization(age: age, equipment: equipment) }
    }

    /// Emails that get free Pro access (e.g., developers, early testers).
    private let allowlistEmails = [
        "kpaccess@gmail.com",
        "krishnapradhan88@gmail.com"
    ]

    /// Users get full access for the first 60 days.
    var isInsideTrialPeriod: Bool {
        let daysSinceStart = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
        return daysSinceStart < 60
    }

    var trialDaysRemaining: Int {
        let daysSinceStart = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
        return max(0, 60 - daysSinceStart)
    }

    /// Access is granted if: 
    /// 1. User is in the 60-day trial
    /// 2. User purchased Pro (StoreKit)
    /// 3. User is an Admin (Firestore)
    /// 4. User is in the Email Allowlist
    var hasProAccess: Bool {
        // 1. Allowlist check
        if let email = firebase.currentUser?.email?.lowercased(),
           allowlistEmails.contains(email) {
            return true
        }

        // 2. Admin check
        if firebase.userData?.isAdmin == true {
            return true
        }

        // 3. Purchase check
        if storeKit.hasPro {
            return true
        }

        // 4. Trial check
        return isInsideTrialPeriod
    }

    var workoutDays: [Int] {
        firebase.userData?.workoutDays ?? [2, 4, 6]
    }

    /// Completed workout sessions derived from Firestore workoutLogs.
    var workoutSessions: [WorkoutSession] {
        FirebaseService.sessions(from: firebase.userData?.workoutLogs ?? [])
    }

    // MARK: - Status text (matches web "Day X • BurpeePacers Program")

    var programStatusText: String {
        let days = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
        return "Day \(max(1, days + 1)) • BurpeePacers Program"
    }

    // MARK: - Protein target

    var proteinTargetGrams: Int {
        let weightKg = startWeightLbs / 2.20462
        return Int((weightKg * 1.5).rounded())
    }

    // MARK: - Milestone (6-month check-in)

    var milestoneDate: Date {
        Calendar.current.date(byAdding: .month, value: 6, to: startDate) ?? startDate
    }

    var daysToMilestone: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: milestoneDate).day ?? 0
    }

    var isMilestoneReached: Bool {
        Date() > milestoneDate
    }

    // MARK: - Init

    init(firebase: FirebaseService = FirebaseService()) {
        self.firebase = firebase
    }

    // MARK: - Default timer mode (Mon→N, Wed→C, Fri→H)

    func defaultMode(for date: Date = Date()) -> WorkoutMode {
        guard currentTrack == .advanced else { return .fiveCount }
        switch Calendar.current.component(.weekday, from: date) {
        case 2: return .navySeals
        case 4: return .fiveCount
        case 6: return .hybrid
        default: return .navySeals
        }
    }

    // MARK: - Session management

    /// Called when the timer finishes. Saves to Firestore and mirrors web workoutStats.
    func addSession(_ session: WorkoutSession) {
        Task {
            await firebase.saveWorkoutLog(
                date:          session.date,
                levelID:       currentLevelID,
                mode:          session.workoutMode,
                repsCompleted: session.repsCompleted,
                completed:     session.completed
            )
        }
    }

    func updateWorkoutDays(_ days: [Int]) {
        Task { await firebase.updateWorkoutDays(days) }
        NotificationManager.shared.rescheduleIfEnabled(
            track: currentTrack, levelDisplayName: currentLevel.displayName, workoutDays: days)
    }

    func updateStartWeight(_ weightLbs: Double) {
        Task { await firebase.updateStartWeight(weightLbs) }
    }

    func updateTrack(_ tier: String) {
        isUpdatingTrack = true
        Task {
            await firebase.updateTrack(tier)
            // We rely on the Firestore listener to update userData and trigger a re-render.
            // Resetting here could cause a flicker if the listener hasn't fired yet.
            // But if it fails, we should reset.
            try? await Task.sleep(for: .seconds(2))
            await MainActor.run { self.isUpdatingTrack = false }
        }
        NotificationManager.shared.rescheduleIfEnabled(
            track: tier == "advanced" ? .advanced : .beginner,
            levelDisplayName: tier == "advanced" ? "Foundation" : "Beginner 1",
            workoutDays: workoutDays)
    }

    func updateLevel(_ levelID: String) {
        Task { await firebase.updateLevel(levelID) }
        if let level = LevelDatabase.levels(for: currentTrack).first(where: { $0.id == levelID }) {
            NotificationManager.shared.rescheduleIfEnabled(
                track: currentTrack, levelDisplayName: level.displayName, workoutDays: workoutDays)
        }
    }

    func sessionsForDate(_ date: Date) -> [WorkoutSession] {
        let calendar = Calendar.current
        return workoutSessions.filter { calendar.isDate($0.date, inSameDayAs: date) }
    }

    var isTodayHybridDone: Bool {
        sessionsForDate(Date()).contains { $0.workoutMode == .hybrid && $0.completed }
    }

    // MARK: - Day state for calendar

    func dayState(for date: Date) -> DayState {
        let calendar = Calendar.current
        let weekday  = calendar.component(.weekday, from: date)

        guard workoutDays.contains(weekday) else { return .rest }

        if date > Date() { return .scheduled }

        let sessions = sessionsForDate(date)
        if let session = sessions.first {
            return .completed(reps: session.repsCompleted, levelCode: session.levelID, workoutMode: session.workoutMode)
        }

        if date < calendar.startOfDay(for: Date()) { return .missed }

        return .scheduled
    }

    // MARK: - Calendar generation (full grid: startOfWeek → endOfWeek of last day)

    func generateCalendarDays(for month: Date) -> [CalendarDay] {
        let cal = Calendar.current

        guard let monthStart = cal.date(
                from: cal.dateComponents([.year, .month], from: month)),
              let monthEnd = cal.date(
                byAdding: DateComponents(month: 1, day: -1), to: monthStart)
        else { return [] }

        // First Sunday on or before the 1st of the month
        let gridStart = cal.date(
            from: cal.dateComponents(
                [.yearForWeekOfYear, .weekOfYear], from: monthStart)) ?? monthStart

        // Last Saturday on or after the last day of the month
        let lastWeekStart = cal.date(
            from: cal.dateComponents(
                [.yearForWeekOfYear, .weekOfYear], from: monthEnd)) ?? monthEnd
        let gridEnd = cal.date(byAdding: .day, value: 6, to: lastWeekStart) ?? monthEnd

        var days: [CalendarDay] = []
        var cursor = gridStart
        while cursor <= gridEnd {
            days.append(CalendarDay(date: cursor, state: dayState(for: cursor)))
            cursor = cal.date(byAdding: .day, value: 1, to: cursor) ?? cursor
        }
        return days
    }

    // MARK: - CSV export

    func exportCSV() -> String {
        var csv = "Date,Level,Mode,Reps Completed,Completed\n"
        let fmt = DateFormatter()
        fmt.dateStyle = .short
        for s in workoutSessions.sorted(by: { $0.date < $1.date }) {
            csv += "\(fmt.string(from: s.date)),"
            csv += "\(s.levelID),"
            csv += "\(s.workoutMode.rawValue),"
            csv += "\(s.repsCompleted),"
            csv += "\(s.completed ? "Yes" : "No")\n"
        }
        return csv
    }
}

// MARK: - Calendar Extension

extension Calendar {
    func startOfMonth(for date: Date) -> Date {
        let comps = dateComponents([.year, .month], from: date)
        return self.date(from: comps) ?? date
    }
}
