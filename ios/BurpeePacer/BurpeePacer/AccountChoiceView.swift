//
//  AccountChoiceView.swift
//  BurpeePacer
//
//  Shown once, right after a brand-new Sign in with Apple that used Hide My Email.
//  Apple only gave us a private relay address, so we can't tell whether this person
//  already has a BurpeePacers account. Existing Google users connect it here in one step;
//  new users continue.
//

import SwiftUI

struct AccountChoiceView: View {
    @Bindable var firebase: FirebaseService

    @State private var isConnecting = false
    @State private var isContinuing = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image("AppLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .clipShape(RoundedRectangle(cornerRadius: 18))

                VStack(spacing: 8) {
                    Text("Already have an account?")
                        .font(.title2)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    Text("You signed in with Apple and chose Hide My Email. If you've used BurpeePacers with Google before, connect it to keep your workouts.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if let error = firebase.authError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                VStack(spacing: 12) {
                    Button {
                        Task {
                            isConnecting = true
                            await firebase.connectAppleToExistingGoogleAccount()
                            isConnecting = false
                        }
                    } label: {
                        Group {
                            if isConnecting {
                                ProgressView().tint(.white)
                            } else {
                                Text("Yes, connect my Google account")
                                    .fontWeight(.bold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        Task {
                            isContinuing = true
                            await firebase.continueAsNewAppleUser()
                            isContinuing = false
                        }
                    } label: {
                        Group {
                            if isContinuing {
                                ProgressView().tint(.white)
                            } else {
                                Text("No, I'm new here")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .disabled(isConnecting || isContinuing)

                Spacer()
            }
            .padding(32)
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    AccountChoiceView(firebase: FirebaseService())
}
