//
//  StatsOverviewCard.swift
//  BurpeePacer
//
//  Stats pulled from Firestore via AppViewModel.
//

import SwiftUI

struct StatsOverviewCard: View {
    @Bindable var viewModel: AppViewModel
    @State private var showingWeightEditor = false
    @State private var weightInput = ""
    @State private var weightError: String?

    var body: some View {
        VStack(spacing: 20) {

            // Start Date
            statsRow(icon: "calendar", title: "Start Date", value: formatDate(viewModel.startDate))

            Divider()

            Button {
                weightInput = editWeightValue
                weightError = nil
                showingWeightEditor = true
            } label: {
                statsRow(
                    icon: "figure.arms.open",
                    title: "Start Weight",
                    value: weightDisplay,
                    trailingIcon: "pencil"
                )
            }
            .buttonStyle(.plain)

            Divider()

            // Protein Target
            HStack {
                Image(systemName: "fork.knife")
                    .font(.title3)
                    .foregroundStyle(.red)
                    .frame(width: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Daily Protein Target")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 4) {
                        Text("~\(viewModel.proteinTargetGrams)g/day")
                            .font(.headline)
                        Text("(1.5g × kg)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }

            Divider()

            // Active Track
            HStack {
                Image(systemName: "figure.run")
                    .font(.title3)
                    .foregroundStyle(.red)
                    .frame(width: 32)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Active Track")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(viewModel.currentTrack == .advanced ? "Advanced" : "Beginner")
                        .font(.headline)
                }

                Spacer()
            }

            // Milestone countdown
            if !viewModel.isMilestoneReached && viewModel.daysToMilestone > 0 {
                Divider()
                HStack {
                    Image(systemName: "flag.fill")
                        .font(.title3)
                        .foregroundStyle(.orange)
                        .frame(width: 32)
                    Text("\(viewModel.daysToMilestone) days until 6-month check-in")
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                    Spacer()
                }
            }

            // Weight unit toggle (local preference)
            Divider()
            HStack {
                Text("Weight unit")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Button(action: { viewModel.useKilograms.toggle() }) {
                    Text(viewModel.useKilograms ? "kg" : "lbs")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.red.opacity(0.2))
                        .foregroundStyle(.red)
                        .clipShape(Capsule())
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .sheet(isPresented: $showingWeightEditor) {
            NavigationStack {
                Form {
                    Section {
                        TextField("Start weight", text: $weightInput)
                            .keyboardType(.decimalPad)
                    } header: {
                        Text("Start Weight")
                    } footer: {
                        Text("Used to calculate your daily protein target. Stored in pounds to match the web app.")
                    }

                    if let weightError {
                        Section {
                            Text(weightError)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }
                }
                .navigationTitle("Edit Start Weight")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            showingWeightEditor = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            saveWeight()
                        }
                    }
                }
            }
            .presentationDetents([.medium])
        }
    }

    private var weightDisplay: String {
        viewModel.useKilograms
            ? String(format: "%.1f kg (%.0f lbs)", viewModel.startWeightLbs / 2.20462, viewModel.startWeightLbs)
            : String(format: "%.0f lbs (%.1f kg)", viewModel.startWeightLbs, viewModel.startWeightLbs / 2.20462)
    }

    private var editWeightValue: String {
        viewModel.useKilograms
            ? String(format: "%.1f", viewModel.startWeightLbs / 2.20462)
            : String(format: "%.0f", viewModel.startWeightLbs)
    }

    private func saveWeight() {
        let normalized = weightInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let value = Double(normalized), value > 0 else {
            weightError = "Enter a valid weight."
            return
        }

        let weightLbs = viewModel.useKilograms ? value * 2.20462 : value
        guard weightLbs >= 50, weightLbs <= 700 else {
            weightError = "Enter a realistic body weight."
            return
        }

        viewModel.updateStartWeight(weightLbs)
        showingWeightEditor = false
    }

    private func statsRow(
        icon: String,
        title: String,
        value: String,
        trailingIcon: String? = nil
    ) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.red)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).foregroundStyle(.secondary)
                Text(value).font(.headline)
            }
            Spacer()
            if let trailingIcon {
                Image(systemName: trailingIcon)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }
}

#Preview {
    StatsOverviewCard(viewModel: AppViewModel())
        .padding()
        .background(Color(UIColor.systemBackground))
}
