//
//  WeightedTrainingCard.swift
//  BurpeePacer
//

import SwiftUI

struct WeightedTrainingCard: View {
    let day: WeightedTrainingDay
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "dumbbell.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.orange)
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.title)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                        Text(day.focus)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(14)
            }
            .buttonStyle(.plain)

            if expanded {
                Divider()
                    .padding(.horizontal, 14)

                VStack(spacing: 0) {
                    ForEach(Array(day.exercises.enumerated()), id: \.element.id) { index, exercise in
                        exerciseRow(exercise, isLast: index == day.exercises.count - 1)
                    }
                }
                .padding(.bottom, 8)
            }
        }
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func exerciseRow(_ exercise: WeightedExercise, isLast: Bool) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 12) {
                Text("\(exercise.sets)×")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.orange)
                    .frame(width: 28, alignment: .leading)

                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(exercise.name)
                            .font(.subheadline)
                        Spacer()
                        Text(exercise.reps)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    if let note = exercise.note {
                        Text(note)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)

            if !isLast {
                Divider()
                    .padding(.leading, 54)
            }
        }
    }
}
