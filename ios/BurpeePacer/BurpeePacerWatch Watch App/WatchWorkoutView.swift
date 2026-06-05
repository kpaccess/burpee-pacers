//
//  WatchWorkoutView.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

struct WatchWorkoutView: View {
    @Environment(WatchSessionManager.self) var session

    private var timeProgress: Double {
        guard session.totalSeconds > 0 else { return 0 }
        let elapsed = session.totalSeconds - session.secondsLeft
        return min(1.0, max(0, Double(elapsed) / Double(session.totalSeconds)))
    }

    private var formattedTime: String {
        let s = max(0, session.secondsLeft)
        return String(format: "%02d:%02d", s / 60, s % 60)
    }

    var body: some View {
        if session.phase == "prepare" {
            prepareView
        } else {
            activeView
        }
    }

    private var prepareView: some View {
        VStack(spacing: 6) {
            Text("Get Ready")
                .font(.headline)
                .foregroundStyle(.orange)
            Text("\(session.prepareSecondsLeft)")
                .font(.system(size: 52, weight: .black, design: .rounded))
                .foregroundStyle(.white)
            Text(session.modeLabel)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var activeView: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 6)
            Circle()
                .trim(from: 0, to: timeProgress)
                .stroke(Color.red, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: timeProgress)

            VStack(spacing: 2) {
                Text(session.modeLabel)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                Text(formattedTime)
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                Text("\(session.currentRep) / \(session.totalReps)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.red)

                if session.heartRate > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(.red)
                        Text("\(Int(session.heartRate))")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(12)
        .safeAreaInset(edge: .bottom) {
            controlBar
        }
    }

    private var controlBar: some View {
        HStack(spacing: 12) {
            Button(action: session.tapDecrementRep) {
                Image(systemName: "minus")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 36, height: 36)
                    .background(Color.white.opacity(0.15))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Button(action: session.isActive ? session.tapPause : session.tapStart) {
                Image(systemName: session.isActive ? "pause.fill" : "play.fill")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 36, height: 36)
                    .background(Color.orange.opacity(0.8))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Button(action: session.tapIncrementRep) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 36, height: 36)
                    .background(Color.red.opacity(0.8))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.bottom, 4)
    }
}
