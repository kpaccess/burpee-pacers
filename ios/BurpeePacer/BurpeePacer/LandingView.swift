//
//  LandingView.swift
//  BurpeePacer
//

import SwiftUI

struct LandingView: View {
    var onGetStarted: (Bool) -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo + name
                VStack(spacing: 12) {
                    Image("AppLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 90, height: 90)
                        .clipShape(RoundedRectangle(cornerRadius: 22))

                    Text("BurpeePacers")
                        .font(.largeTitle)
                        .fontWeight(.black)
                        .foregroundStyle(.red)

                    Text("20 minutes. Real results.")
                        .font(.title3)
                        .foregroundStyle(.white.opacity(0.85))
                }

                Spacer()

                // Feature bullets
                VStack(alignment: .leading, spacing: 16) {
                    featureRow(icon: "timer", text: "Structured 20-min burpee sessions")
                    featureRow(icon: "chart.line.uptrend.xyaxis", text: "Track reps and progress over time")
                    featureRow(icon: "person.2.fill", text: "Beginner and Advanced tracks")
                    featureRow(icon: "gift.fill", text: "Free during launch")
                }
                .padding(.horizontal, 40)

                Spacer()

                // CTA
                Button(action: { onGetStarted(true) }) {
                    Text("Get Started")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 32)

                HStack(spacing: 20) {
                    Button(action: { onGetStarted(true) }) {
                        HStack(spacing: 4) {
                            Text("New here?")
                                .foregroundStyle(.secondary)
                            Text("Sign up")
                                .fontWeight(.semibold)
                                .foregroundStyle(.red)
                        }
                        .font(.subheadline)
                    }

                    Text("·")
                        .foregroundStyle(.secondary)
                        .font(.subheadline)

                    Button(action: { onGetStarted(false) }) {
                        HStack(spacing: 4) {
                            Text("Already a member?")
                                .foregroundStyle(.secondary)
                            Text("Sign in")
                                .fontWeight(.semibold)
                                .foregroundStyle(.red)
                        }
                        .font(.subheadline)
                    }
                }
                .padding(.top, 12)
                .padding(.bottom, 40)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.red)
                .frame(width: 28)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.8))
        }
    }
}

#Preview {
    LandingView(onGetStarted: { _ in })
}
