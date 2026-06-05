//
//  WatchSummaryView.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

struct WatchSummaryView: View {
    @Environment(WatchSessionManager.self) var session

    private var formattedDuration: String {
        let s = max(0, Int(session.summaryDuration))
        return String(format: "%02d:%02d", s / 60, s % 60)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(.green)

                Text("Done!")
                    .font(.headline)
                    .fontWeight(.black)

                VStack(spacing: 6) {
                    statRow(label: "Reps", value: "\(session.summaryReps)")
                    statRow(label: "Time", value: formattedDuration)
                    if session.summaryCalories > 0 {
                        statRow(label: "Calories", value: "\(Int(session.summaryCalories)) kcal")
                    }
                }
                .padding(.vertical, 4)

                Button("Done") {
                    session.dismissSummary()
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            }
            .padding()
        }
    }

    private func statRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 4)
    }
}
