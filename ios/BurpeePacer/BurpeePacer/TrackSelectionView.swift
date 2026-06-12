//
//  TrackSelectionView.swift
//  BurpeePacer
//
//  Used for both initial onboarding (currentTrack = nil) and switching tracks from settings.
//

import SwiftUI

struct TrackSelectionView: View {
    /// nil during first-time onboarding; set when switching from settings.
    let currentTrack: ProgramTrack?
    let onSelect: (String) -> Void
    /// Non-nil when presented as a dismissable sheet (settings switch).
    var onDismiss: (() -> Void)? = nil

    @State private var pendingTrack: ProgramTrack? = nil
    @State private var showConfirm = false

    private var isOnboarding: Bool { currentTrack == nil }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                header
                trackCard(.beginner)
                trackCard(.advanced)
                Spacer(minLength: 32)
            }
            .padding(.horizontal)
            .padding(.top, isOnboarding ? 48 : 16)
        }
        .background(Color(UIColor.systemBackground))
        .overlay(alignment: .topTrailing) {
            if let onDismiss {
                Button("Cancel", action: onDismiss)
                    .font(.body)
                    .padding([.top, .trailing], 16)
            }
        }
        .alert("Switch to \(pendingTrack?.rawValue ?? "") Track?",
               isPresented: $showConfirm,
               presenting: pendingTrack) { track in
            Button("Switch", role: .destructive) {
                onSelect(track == .beginner ? "beginner" : "advanced")
            }
            Button("Cancel", role: .cancel) {}
        } message: { track in
            Text("Your level resets to the \(track.rawValue) starting point. Your workout history is kept.")
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 10) {
            if isOnboarding {
                Image("AppLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 72, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
            }
            Text(isOnboarding ? "Choose Your Program" : "Switch Program")
                .font(.title)
                .fontWeight(.black)
            Text(isOnboarding
                 ? "Pick the track that matches your fitness level. You can switch anytime from Account Settings."
                 : "Switching resets your level to the starting point for the new track. Your workout history stays.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)
        }
    }

    // MARK: - Track Card

    private func trackCard(_ track: ProgramTrack) -> some View {
        let isCurrent = track == currentTrack
        let isBeginner = track == .beginner

        let icon     = isBeginner ? "figure.walk" : "figure.strengthtraining.traditional"
        let color: Color = isBeginner ? .blue : .red
        let subtitle = isBeginner
            ? "Burpees (no pushups)"
            : "Navy Seals · 5-Count Pushups · Hybrid"
        let bullets: [String] = isBeginner
            ? ["Levels B1–B6 (20–110 burpees)", "20-minute timed sessions", "Free during launch"]
            : ["Levels Foundation–Elite (up to 120/300 reps)", "Three workout modes per session", "Free during launch"]

        return Button {
            guard !isCurrent else { return }
            if isOnboarding {
                onSelect(track == .beginner ? "beginner" : "advanced")
            } else {
                pendingTrack = track
                showConfirm = true
            }
        } label: {
            VStack(alignment: .leading, spacing: 14) {
                // Title row
                HStack(spacing: 12) {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundStyle(color)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(track.rawValue)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text(subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if isCurrent {
                        Text("Current")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(color)
                            .clipShape(Capsule())
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Divider()

                // Bullet points
                ForEach(bullets, id: \.self) { bullet in
                    Label(bullet, systemImage: "checkmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(UIColor.secondarySystemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(isCurrent ? color : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
        .opacity(isCurrent ? 0.65 : 1.0)
    }
}

#Preview("Onboarding") {
    TrackSelectionView(currentTrack: nil, onSelect: { _ in })
        .preferredColorScheme(.dark)
}

#Preview("Switching") {
    TrackSelectionView(
        currentTrack: .beginner,
        onSelect: { _ in },
        onDismiss: {}
    )
    .preferredColorScheme(.dark)
}
