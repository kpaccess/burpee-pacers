//
//  SignInView.swift
//  BurpeePacer
//

import SwiftUI
import GoogleSignInSwift
import AuthenticationServices

struct SignInView: View {
    @Bindable var firebase: FirebaseService
    var startWithSignUp: Bool = false

    @State private var email    = ""
    @State private var password = ""
    @State private var isEmailLoading  = false
    @State private var isGoogleLoading = false
    @State private var isAppleLoading  = false
    @State private var isSignUp: Bool
    
    @State private var currentNonce: String?

    init(firebase: FirebaseService, startWithSignUp: Bool = false) {
        self.firebase = firebase
        self.startWithSignUp = startWithSignUp
        self._isSignUp = State(initialValue: startWithSignUp)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    VStack(spacing: 8) {
                        Image("AppLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 90, height: 90)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        Text("BurpeePacers")
                            .font(.largeTitle)
                            .fontWeight(.black)
                            .foregroundStyle(.red)
                        Text(isSignUp ? "Create an account to sync your workouts" : "Sign in to sync your workouts")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(isSignUp ? "Choose an email and strong password" : "Existing Gmail users: sign in with Google first, then connect Apple in Account settings")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.top, 16)

                    // Apple Sign-In
                    SignInWithAppleButton(.signIn) { request in
                        let nonce = FirebaseService.randomNonceString()
                        currentNonce = nonce
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = FirebaseService.sha256(nonce)
                    } onCompletion: { result in
                        Task { @MainActor in
                            isAppleLoading = true
                            switch result {
                            case .success(let authorization):
                                if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                                   let appleIDToken = appleIDCredential.identityToken,
                                   let idTokenString = String(data: appleIDToken, encoding: .utf8),
                                   let nonce = currentNonce {
                                    await firebase.handleAppleSignIn(
                                        idToken: idTokenString,
                                        rawNonce: nonce,
                                        fullName: appleIDCredential.fullName,
                                        email: appleIDCredential.email
                                    )
                                }
                            case .failure(let error):
                                // Don't show error if user cancelled
                                let nsError = error as NSError
                                if nsError.domain == ASAuthorizationError.errorDomain && nsError.code == ASAuthorizationError.canceled.rawValue {
                                    // User cancelled, do nothing
                                } else {
                                    firebase.authError = error.localizedDescription
                                }
                            }
                            isAppleLoading = false
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .signInWithAppleButtonStyle(.white)
                    .disabled(isEmailLoading || isGoogleLoading || isAppleLoading)
                    .overlay {
                        if isAppleLoading {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.black.opacity(0.4))
                            ProgressView().tint(.white)
                        }
                    }

                    // Google Sign-In
                    GoogleSignInButton(scheme: .dark, style: .wide) {
                        Task {
                            isGoogleLoading = true
                            await firebase.signInWithGoogle()
                            isGoogleLoading = false
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .disabled(isEmailLoading || isGoogleLoading || isAppleLoading)
                    .overlay {
                        if isGoogleLoading {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.black.opacity(0.4))
                            ProgressView().tint(.white)
                        }
                    }

                    // Divider
                    HStack {
                        Rectangle().fill(Color.white.opacity(0.15)).frame(height: 1)
                        Text("or").font(.caption).foregroundStyle(.secondary)
                        Rectangle().fill(Color.white.opacity(0.15)).frame(height: 1)
                    }

                    // Email / Password
                    VStack(spacing: 12) {
                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .padding()
                            .background(Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))

                        SecureField("Password", text: $password)
                            .padding()
                            .background(Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if let error = firebase.authError {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    Button {
                        Task {
                            isEmailLoading = true
                            if isSignUp {
                                await firebase.signUp(email: email, password: password)
                            } else {
                                await firebase.signIn(email: email, password: password)
                            }
                            isEmailLoading = false
                        }
                    } label: {
                        Group {
                            if isEmailLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(isSignUp ? "Sign Up" : "Sign In")
                                    .fontWeight(.bold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(email.isEmpty || password.isEmpty || isEmailLoading || isGoogleLoading || isAppleLoading)

                    // Sign In / Sign Up Toggle Link
                    Button {
                        withAnimation {
                            isSignUp.toggle()
                            firebase.authError = nil
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(isSignUp ? "Already have an account?" : "Don't have an account?")
                                .foregroundStyle(.secondary)
                            Text(isSignUp ? "Sign in" : "Sign up")
                                .fontWeight(.bold)
                                .foregroundStyle(.red)
                        }
                        .font(.subheadline)
                    }
                    .padding(.top, 8)

                    // Legal Links
                    VStack(spacing: 4) {
                        Text("By signing in, you agree to our")
                            .foregroundStyle(.tertiary)
                        HStack(spacing: 4) {
                            Link("Terms of Use", destination: AppConstants.termsOfServiceURL)
                            Text("&")
                            Link("Privacy Policy", destination: AppConstants.privacyPolicyURL)
                        }
                        .fontWeight(.semibold)
                    }
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.top, 16)
                }
                .padding(32)
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    SignInView(firebase: FirebaseService())
}
