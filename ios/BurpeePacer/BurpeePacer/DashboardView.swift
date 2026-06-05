//
//  DashboardView.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI
import FirebaseAuth
import StoreKit

struct DashboardView: View {
    @Bindable var viewModel: AppViewModel
    @State private var showingExportSheet = false
    @State private var showingLevelPicker = false
    @State private var selectedMode: WorkoutMode = .fiveCount
    @State private var timerViewModel: SessionTimerViewModel?

    private func refreshDefaultMode() {
        selectedMode = viewModel.defaultMode()
    }

    private var selectedModeDisplayName: String {
        selectedMode.displayName(for: viewModel.currentTrack)
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    HeaderView(
                        statusText: viewModel.programStatusText,
                        email: viewModel.firebase.currentUser?.email,
                        isPro: viewModel.hasProAccess,
                        storeKit: viewModel.storeKit,
                        track: viewModel.currentTrack,
                        levelDisplayName: viewModel.currentLevel.displayName,
                        onSignOut: { viewModel.firebase.signOut() },
                        onTrackSwitch: { viewModel.updateTrack($0) },
                        workoutDays: viewModel.workoutDays,
                        onWorkoutDaysChange: { viewModel.updateWorkoutDays($0) },
                        onDeleteAccount: { await viewModel.firebase.deleteAccount() },
                        ageBracket: $viewModel.ageBracket,
                        equipment: $viewModel.equipment
                    )

                    if !viewModel.storeKit.hasPro {
                        trialStatusCard
                    }

                    // Stats Overview
                    StatsOverviewCard(viewModel: viewModel)
                    
                    // Current Level & Start Workout
                    currentLevelCard

                    // Personalized Finisher Card
                    finisherCard

                    // Recovery Info
                    RecoveryDisclosureGroup()

                    // Friday section removed - replaced by dynamic Finisher Card above

                    // Calendar
                    WorkoutCalendarGridView(viewModel: viewModel)
                    
                    // Progress Photos
                    ProgressPhotosSection(
                        daysSinceStart: Calendar.current.dateComponents([.day], from: viewModel.startDate, to: Date()).day ?? 0,
                        remoteDay1Url: viewModel.startPictureUrl
                    )
                    
                    // Export Data
                    exportDataButton
                    
                    // Rest Day Reminder
                    restDayReminder
                }
                .padding()
            }
            .background(Color(UIColor.systemBackground))
            .navigationTitle("BurpeePacers")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $timerViewModel) { timerVM in
                NavigationStack {
                    SessionTimerView(viewModel: timerVM) { session in
                        viewModel.addSession(session)
                        timerViewModel = nil
                    }
                    .navigationTitle(viewModel.currentLevel.displayName)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Close") {
                                timerViewModel = nil
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showingExportSheet) {
                ShareSheet(items: [exportCSVFile()])
            }
            .sheet(isPresented: $showingLevelPicker) {
                levelPickerSheet
            }
        }
    }
    
    // MARK: - Trial / Upgrade Card
    
    private var trialStatusCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.isInsideTrialPeriod ? "TRIAL ACTIVE" : "TRIAL EXPIRED")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(viewModel.isInsideTrialPeriod ? .blue : .red)
                        .tracking(2)
                    
                    Text(viewModel.isInsideTrialPeriod ? "\(viewModel.trialDaysRemaining) Days Remaining" : "Unlock Full Access")
                        .font(.headline)
                    
                    Text(viewModel.isInsideTrialPeriod 
                         ? "You have full access to all features during your 60-day trial."
                         : "Your trial has ended. Upgrade to Pro for lifetime access.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: viewModel.isInsideTrialPeriod ? "clock.fill" : "lock.fill")
                    .font(.title)
                    .foregroundStyle(viewModel.isInsideTrialPeriod ? .blue : .red)
            }
            
            Button {
                Task {
                    if let product = viewModel.storeKit.products.first {
                        _ = try? await viewModel.storeKit.purchase(product)
                    }
                }
            } label: {
                Group {
                    if viewModel.storeKit.isLoading {
                        ProgressView().tint(viewModel.isInsideTrialPeriod ? .blue : .white)
                    } else {
                        Text(viewModel.storeKit.products.first?.displayPrice ?? "Upgrade to Pro")
                            .fontWeight(.bold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(viewModel.isInsideTrialPeriod ? Color.blue.opacity(0.15) : Color.red)
                .foregroundStyle(viewModel.isInsideTrialPeriod ? .blue : .white)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(viewModel.isInsideTrialPeriod ? Color.blue : Color.clear, lineWidth: 1)
                )
            }
            .disabled(viewModel.storeKit.isLoading)

            HStack(spacing: 8) {
                Link("Terms of Use", destination: AppConstants.termsOfServiceURL)
                Text("·")
                Link("Privacy Policy", destination: AppConstants.privacyPolicyURL)
            }
            .font(.caption2)
            .foregroundStyle(.tertiary)
        }
        .padding()
        .background(viewModel.isInsideTrialPeriod ? Color.blue.opacity(0.05) : Color.red.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(viewModel.isInsideTrialPeriod ? Color.blue.opacity(0.2) : Color.red.opacity(0.2), lineWidth: 1)
        )
    }
    
    // MARK: - Current Level Card
    
    private var finisherCard: some View {
        let finisher = FinisherDatabase.finisher(for: viewModel.ageBracket, equipment: viewModel.equipment)
        
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TODAY'S STRENGTH FINISHER")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .tracking(2)
                    
                    Text(finisher.title)
                        .font(.title3)
                        .fontWeight(.bold)
                }
                Spacer()
                Image(systemName: finisher.iconName)
                    .font(.title)
                    .foregroundStyle(.red.gradient)
            }
            
            Divider().background(Color.white.opacity(0.1))
            
            HStack(spacing: 16) {
                VStack(alignment: .leading) {
                    Text("WORKOUT")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(finisher.setsAndReps)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                VStack(alignment: .leading) {
                    Text("FOCUS")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(finisher.focus)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
            }
            
            Text("Complete this after your burpees to maintain muscle and bone density.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.top, 4)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private var currentLevelCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CURRENT LEVEL")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .tracking(2)
                    
                    Text(viewModel.currentLevel.displayName)
                        .font(.title)
                        .fontWeight(.bold)

                    Text(viewModel.currentLevel.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Button {
                        showingLevelPicker = true
                    } label: {
                        Label("Change Level", systemImage: "arrow.left.arrow.right")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                Image(systemName: "figure.strengthtraining.traditional")
                    .font(.system(size: 50))
                    .foregroundStyle(.red.gradient)
            }
            
            // Mode picker — advanced users only
            if viewModel.currentTrack == .advanced {
                VStack(alignment: .leading, spacing: 6) {
                    Text("WORKOUT TYPE")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .tracking(1.5)

                    Picker("Workout Type", selection: $selectedMode) {
                        ForEach(viewModel.currentLevel.availableModes, id: \.self) { mode in
                            Text(mode.displayName).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }

            Button(action: {
                timerViewModel = SessionTimerViewModel(level: viewModel.currentLevel, workoutMode: selectedMode)
            }) {
                HStack {
                    Image(systemName: "play.circle.fill")
                        .font(.title2)
                    Text("Start \(selectedModeDisplayName)")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red.gradient)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .onAppear { refreshDefaultMode() }
    }
    
    // MARK: - Export Data Button
    
    private var exportDataButton: some View {
        Button(action: {
            showingExportSheet = true
        }) {
            HStack {
                Image(systemName: "square.and.arrow.up")
                    .font(.title3)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Export Workout Data")
                        .font(.headline)
                    Text("Download as CSV file")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Rest Day Reminder
    
    private var restDayReminder: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("48-Hour Rest Rule")
                    .font(.headline)
                Text("Always rest at least 48 hours between sessions for optimal recovery and muscle growth.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    // MARK: - Level Picker Sheet

    private var levelPickerSheet: some View {
        NavigationStack {
            List(LevelDatabase.levels(for: viewModel.currentTrack)) { level in
                Button {
                    viewModel.updateLevel(level.id)
                    showingLevelPicker = false
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(level.displayName)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text(level.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if level.id == viewModel.currentLevelID {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.red)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Choose Level")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showingLevelPicker = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    // MARK: - Export Helper
    
    private func exportCSVFile() -> URL {
        let csv = viewModel.exportCSV()
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("burpee_pacer_export.csv")
        
        try? csv.write(to: tempURL, atomically: true, encoding: .utf8)
        return tempURL
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {
        // No update needed
    }
}

#Preview {
    @Previewable @State var viewModel = AppViewModel()

    DashboardView(viewModel: viewModel)
}
