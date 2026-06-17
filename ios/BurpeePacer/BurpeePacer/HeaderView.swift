//
//  HeaderView.swift
//  BurpeePacer
//

import SwiftUI

struct HeaderView: View {
    let statusText: String
    let email: String?
    let isPro: Bool
    let storeKit: StoreKitManager
    let track: ProgramTrack
    let levelDisplayName: String
    let onSignOut: () -> Void
    var onTrackSwitch: ((String) -> Void)? = nil
    var workoutDays: [Int] = [2, 4, 6]
    var onWorkoutDaysChange: (([Int]) -> Void)? = nil
    var onDeleteAccount: (() async -> (success: Bool, requiresReauth: Bool))? = nil
    var isAppleLinked: Bool = false
    var accountID: String? = nil
    var connectedSignIns: [String] = []
    var onConnectApple: ((String, String, PersonNameComponents?) async -> String?)? = nil
    @Binding var ageBracket: AgeBracket
    @Binding var equipment: Equipment

    @State private var showingSettings = false

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("BURPEE PACERS")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .tracking(2)

                Text(statusText)
                    .font(.title2)
                    .fontWeight(.bold)
            }

            Spacer()

            Button(action: { showingSettings = true }) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(.secondary)

                    if isPro {
                        Circle()
                            .fill(Color.yellow)
                            .frame(width: 10, height: 10)
                            .offset(x: 2, y: -2)
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .sheet(isPresented: $showingSettings) {
            AccountSettingsView(
                email: email,
                isPro: isPro,
                storeKit: storeKit,
                track: track,
                levelDisplayName: levelDisplayName,
                workoutDays: workoutDays,
                ageBracket: $ageBracket,
                equipment: $equipment,
                onSignOut: onSignOut,
                onTrackSwitch: onTrackSwitch,
                onWorkoutDaysChange: onWorkoutDaysChange,
                onDeleteAccount: onDeleteAccount,
                isAppleLinked: isAppleLinked,
                accountID: accountID,
                connectedSignIns: connectedSignIns,
                onConnectApple: onConnectApple
            )
        }
    }
}

#Preview {
    HeaderView(
        statusText: "Day 30 • BurpeePacers Program",
        email: "user@gmail.com",
        isPro: true,
        storeKit: StoreKitManager(),
        track: .advanced,
        levelDisplayName: "Level 1",
        onSignOut: {},
        ageBracket: .constant(.fiftiesPlus),
        equipment: .constant(.fullGym)
    )
    .padding()
    .background(Color(UIColor.systemBackground))
}
