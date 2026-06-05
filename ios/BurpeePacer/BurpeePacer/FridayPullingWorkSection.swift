//
//  FridayPullingWorkSection.swift
//  BurpeePacer
//
//  Visible only on Fridays for Advanced Track users.
//  Locked until the Hybrid workout is logged for today.
//

import SwiftUI

private struct PullingExercise {
    let name: String
    let sets: String
    let reps: String
    let benefit: String
    let videoURL: URL
    let videoLabel: String
    let formCues: [String]
}

private struct PullingOption {
    let title: String
    let subtitle: String
    let exercises: [PullingExercise]
}

private let pullingWorkOptions: [PullingOption] = [
    PullingOption(
        title: "Option A: At Home",
        subtitle: "Best for users with dumbbells, kettlebells, or resistance bands.",
        exercises: [
            PullingExercise(
                name: "Dumbbell Rows",
                sets: "3 sets", reps: "10–15 reps",
                benefit: "Builds upper back strength",
                videoURL: URL(string: "https://www.youtube.com/watch?v=roCP6wCXPqo")!,
                videoLabel: "How to Perfect Your Dumbbell Row",
                formCues: [
                    "Rest one knee and hand on a bench for support",
                    "Keep your back flat — pull elbow straight to hip",
                    "Squeeze your shoulder blade at the top, lower slowly",
                ]
            ),
            PullingExercise(
                name: "Kettlebell Rows",
                sets: "3 sets", reps: "10–15 reps",
                benefit: "Balances pushing muscles",
                videoURL: URL(string: "https://www.youtube.com/watch?v=IyQAMOV0WAc")!,
                videoLabel: "How to Perform the Kettlebell Row",
                formCues: [
                    "Hinge at hips, keep back flat and neutral",
                    "Pull kettlebell to your hip, elbow close to body",
                    "Squeeze shoulder blade at the top, lower with control",
                ]
            ),
            PullingExercise(
                name: "Band Pull-Aparts",
                sets: "2 sets", reps: "15–20 reps",
                benefit: "Protects shoulders",
                videoURL: URL(string: "https://www.youtube.com/watch?v=LoBBo1dtY6I")!,
                videoLabel: "Band Pull-Aparts for Shoulder Stability",
                formCues: [
                    "Hold the band at shoulder height, arms straight",
                    "Pull band apart until it touches your chest",
                    "Keep arms straight throughout — control the return",
                ]
            ),
        ]
    ),
    PullingOption(
        title: "Option B: At Gym",
        subtitle: "Best for users with access to machines and cables.",
        exercises: [
            PullingExercise(
                name: "Lat Pulldown",
                sets: "3 sets", reps: "10–15 reps",
                benefit: "Builds upper back strength",
                videoURL: URL(string: "https://www.youtube.com/watch?v=CAwf7n6Luuc")!,
                videoLabel: "How To: Lat Pulldown | 3 Golden Rules",
                formCues: [
                    "Sit tall, lean back slightly (15–20°)",
                    "Pull bar to your upper chest, drive elbows down",
                    "Full stretch at the top, squeeze your lats at the bottom",
                ]
            ),
            PullingExercise(
                name: "Seated Row",
                sets: "3 sets", reps: "10–15 reps",
                benefit: "Improves posture",
                videoURL: URL(string: "https://www.youtube.com/watch?v=EU7bOadUsNI")!,
                videoLabel: "Seated Cable Row — Proper Form & Technique",
                formCues: [
                    "Sit tall, keep your back straight throughout",
                    "Pull the handle to your lower chest or belly button",
                    "Squeeze shoulder blades together at the end position",
                ]
            ),
            PullingExercise(
                name: "Face Pulls",
                sets: "2 sets", reps: "15–20 reps",
                benefit: "Reduces injury risk",
                videoURL: URL(string: "https://www.youtube.com/watch?v=eIq5CB9JfKE")!,
                videoLabel: "Stop Doing Face Pulls Like This",
                formCues: [
                    "Set cable at face height or slightly above",
                    "Pull rope to your face, hands splitting apart",
                    "Rotate wrists outward at the end — hold 1 second",
                ]
            ),
        ]
    ),
]

struct FridayPullingWorkSection: View {
    @Bindable var viewModel: AppViewModel
    @State private var selectedOptionIndex = 0
    @State private var expandedExercise: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerRow

            if viewModel.isTodayHybridDone {
                Text("Add pulling work to balance your shoulders and improve posture.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Picker("Location", selection: $selectedOptionIndex) {
                    ForEach(pullingWorkOptions.indices, id: \.self) { i in
                        Text(i == 0 ? "At Home" : "At Gym").tag(i)
                    }
                }
                .pickerStyle(.segmented)

                let option = pullingWorkOptions[selectedOptionIndex]
                Text(option.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                ForEach(option.exercises, id: \.name) { exercise in
                    exerciseCard(exercise)
                }
            } else {
                lockedBanner
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var headerRow: some View {
        HStack {
            Image(systemName: "dumbbell.fill")
                .font(.title3)
                .foregroundStyle(.orange)
            Text("Friday Pulling Work")
                .font(.headline)
                .fontWeight(.bold)
            Spacer()
            Image(systemName: viewModel.isTodayHybridDone ? "lock.open.fill" : "lock.fill")
                .foregroundStyle(viewModel.isTodayHybridDone ? .green : .secondary)
        }
    }

    private var lockedBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "lock.fill")
                .foregroundStyle(.secondary)
            Text("Complete your Hybrid workout above to unlock Friday Pulling Work.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(UIColor.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    @ViewBuilder
    private func exerciseCard(_ exercise: PullingExercise) -> some View {
        let isExpanded = expandedExercise == exercise.name

        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    expandedExercise = isExpanded ? nil : exercise.name
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(exercise.name)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                        HStack(spacing: 8) {
                            Text(exercise.sets)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("·")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(exercise.reps)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("·")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(exercise.benefit)
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
            }
            .buttonStyle(.plain)

            if isExpanded {
                Divider()
                    .padding(.horizontal, 12)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Form Cues")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .tracking(1)

                    ForEach(exercise.formCues, id: \.self) { cue in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundStyle(.orange)
                                .padding(.top, 1)
                            Text(cue)
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                    }

                    Link(destination: exercise.videoURL) {
                        HStack(spacing: 6) {
                            Image(systemName: "play.rectangle.fill")
                                .font(.caption)
                            Text(exercise.videoLabel)
                                .font(.caption)
                                .underline()
                        }
                        .foregroundStyle(.orange)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Color(UIColor.tertiarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

#Preview {
    @Previewable @State var viewModel = AppViewModel()
    FridayPullingWorkSection(viewModel: viewModel)
        .padding()
        .background(Color(UIColor.systemBackground))
}
