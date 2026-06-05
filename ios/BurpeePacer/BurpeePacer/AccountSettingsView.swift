//
//  AccountSettingsView.swift
//  BurpeePacer
//

import SwiftUI
import UserNotifications
import StoreKit

struct AccountSettingsView: View {
    let email: String?
    let isPro: Bool
    let storeKit: StoreKitManager
    let track: ProgramTrack
    let levelDisplayName: String
    let workoutDays: [Int]
    @Binding var ageBracket: AgeBracket
    @Binding var equipment: Equipment
    let onSignOut: () -> Void
    var onTrackSwitch: ((String) -> Void)? = nil
    var onWorkoutDaysChange: (([Int]) -> Void)? = nil
    var onDeleteAccount: (() async -> (success: Bool, requiresReauth: Bool))? = nil

    @State private var selectedDays: Set<Int> = [2, 4, 6]
    @State private var showingTrackPicker = false
    @State private var remindersEnabled: Bool = NotificationManager.shared.isEnabled
    @State private var reminderTime: Date = {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        comps.hour   = NotificationManager.shared.reminderHour
        comps.minute = NotificationManager.shared.reminderMinute
        return Calendar.current.date(from: comps) ?? Date()
    }()
    @State private var notificationsDenied = false
    @State private var showingDeleteConfirmation = false
    @State private var showingReauthAlert = false
    @State private var isDeleting = false
    @State private var isRestoring = false
    @State private var isPurchasing = false
    @State private var purchaseError: String? = nil

    init(email: String?,
         isPro: Bool,
         storeKit: StoreKitManager,
         track: ProgramTrack,
         levelDisplayName: String,
         workoutDays: [Int] = [2, 4, 6],
         ageBracket: Binding<AgeBracket>,
         equipment: Binding<Equipment>,
         onSignOut: @escaping () -> Void,
         onTrackSwitch: ((String) -> Void)? = nil,
         onWorkoutDaysChange: (([Int]) -> Void)? = nil,
         onDeleteAccount: (() async -> (success: Bool, requiresReauth: Bool))? = nil) {
        self.email = email
        self.isPro = isPro
        self.storeKit = storeKit
        self.track = track
        self.levelDisplayName = levelDisplayName
        self.workoutDays = workoutDays
        self._ageBracket = ageBracket
        self._equipment = equipment
        self.onSignOut = onSignOut
        self.onTrackSwitch = onTrackSwitch
        self.onWorkoutDaysChange = onWorkoutDaysChange
        self.onDeleteAccount = onDeleteAccount
        _selectedDays = State(initialValue: Set(workoutDays))
    }

    // MARK: - Workout labels for the reminder preview

    private var mondayWorkout: String {
        track == .advanced ? "Navy Seals" : "Burpees"
    }
    private var wednesdayWorkout: String {
        track == .advanced ? "5-Count Pushups" : "Burpees"
    }
    private var fridayWorkout: String {
        track == .advanced ? "Hybrid (Navy Seals + 5-Count)" : "Burpees"
    }

    private func workoutLabel(for weekday: Int) -> String {
        switch (track, weekday) {
        case (.advanced, 2): return "Navy Seals"
        case (.advanced, 4): return "5-Count Pushups"
        case (.advanced, 6): return "Hybrid"
        default:             return "Burpees"
        }
    }

    // MARK: - Notification helpers

    private func handleReminderToggle(_ enabled: Bool) async {
        NotificationManager.shared.isEnabled = enabled
        if enabled {
            let status = await NotificationManager.shared.authorizationStatus()
            switch status {
            case .notDetermined:
                let granted = await NotificationManager.shared.requestPermission()
                if granted {
                    NotificationManager.shared.scheduleReminders(
                        track: track, levelDisplayName: levelDisplayName,
                        workoutDays: Array(selectedDays).sorted())
                } else {
                    NotificationManager.shared.isEnabled = false
                    remindersEnabled = false
                    notificationsDenied = true
                }
            case .denied:
                NotificationManager.shared.isEnabled = false
                remindersEnabled = false
                notificationsDenied = true
            default:
                NotificationManager.shared.scheduleReminders(
                    track: track, levelDisplayName: levelDisplayName,
                    workoutDays: Array(selectedDays).sorted())
            }
        } else {
            NotificationManager.shared.cancelReminders()
        }
    }

    var body: some View {
        NavigationStack {
            List {
                // Account section
                Section("Account") {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(email ?? "Unknown")
                                .font(.subheadline)
                            Text("Account Status: \(isPro ? "Pro" : "Standard")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Purchases section
                Section("Purchases") {
                    if !storeKit.hasPro {
                        if storeKit.isLoading {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundStyle(.yellow)
                                Text("Loading...")
                                    .foregroundStyle(.secondary)
                                Spacer()
                                ProgressView()
                            }
                        } else if let product = storeKit.products.first {
                            Button {
                                Task {
                                    isPurchasing = true
                                    purchaseError = nil
                                    do {
                                        _ = try await storeKit.purchase(product)
                                    } catch {
                                        purchaseError = error.localizedDescription
                                    }
                                    isPurchasing = false
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .foregroundStyle(.yellow)
                                    if isPurchasing {
                                        Text("Processing...")
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        ProgressView()
                                    } else {
                                        Text("Upgrade to Pro – \(product.displayPrice)")
                                            .foregroundStyle(.primary)
                                    }
                                }
                            }
                            .disabled(isPurchasing)
                        } else {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundStyle(.orange)
                                Text("Unable to load purchase options. Check your connection and try again.")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        if let error = purchaseError {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }

                    Button {
                        Task {
                            isRestoring = true
                            await storeKit.restorePurchases()
                            isRestoring = false
                        }
                    } label: {
                        HStack {
                            Image(systemName: "arrow.clockwise.circle")
                            if isRestoring {
                                Text("Restoring...")
                                ProgressView()
                                    .padding(.leading, 4)
                            } else {
                                Text("Restore Purchases")
                            }
                        }
                    }
                    .disabled(isRestoring)
                }

                // Legal section
                Section("Legal") {
                    Link(destination: AppConstants.termsOfServiceURL) {
                        Label("Terms of Use", systemImage: "doc.text")
                            .foregroundStyle(.primary)
                    }
                    Link(destination: AppConstants.privacyPolicyURL) {
                        Label("Privacy Policy", systemImage: "lock.shield")
                            .foregroundStyle(.primary)
                    }
                }

                // Program section
                Section("Program") {
                    HStack {
                        Image(systemName: track == .beginner ? "figure.walk" : "figure.strengthtraining.traditional")
                            .font(.title2)
                            .foregroundStyle(track == .beginner ? .blue : .red)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(track.rawValue) Track")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text(levelDisplayName)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("Active")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(track == .beginner ? Color.blue : Color.red)
                            .clipShape(Capsule())
                    }
                    .padding(.vertical, 4)

                    if onTrackSwitch != nil {
                        Button {
                            showingTrackPicker = true
                        } label: {
                            HStack {
                                Image(systemName: "arrow.left.arrow.right.circle")
                                    .foregroundStyle(.red)
                                Text("Switch Track")
                                    .foregroundStyle(.primary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // Personalization section
                Section("Personalization") {
                    Picker("Age Bracket", selection: $ageBracket) {
                        ForEach(AgeBracket.allCases, id: \.self) { bracket in
                            Text(bracket.displayName).tag(bracket)
                        }
                    }
                    
                    Picker("Equipment", selection: $equipment) {
                        ForEach(Equipment.allCases, id: \.self) { item in
                            Text(item.displayName).tag(item)
                        }
                    }
                }

                // Workout Schedule section
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 10) {
                            ForEach([(2, "MON"), (4, "WED"), (6, "FRI")], id: \.0) { (weekday, abbrev) in
                                let isOn = selectedDays.contains(weekday)
                                let canToggleOff = selectedDays.count > 1
                                Button {
                                    if isOn && canToggleOff {
                                        selectedDays.remove(weekday)
                                    } else if !isOn {
                                        selectedDays.insert(weekday)
                                    }
                                    onWorkoutDaysChange?(Array(selectedDays).sorted())
                                } label: {
                                    VStack(spacing: 4) {
                                        Text(abbrev)
                                            .font(.caption)
                                            .fontWeight(.bold)
                                        Text(workoutLabel(for: weekday))
                                            .font(.system(size: 9))
                                            .lineLimit(1)
                                            .minimumScaleFactor(0.7)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .foregroundStyle(isOn ? .white : .secondary)
                                    .background(isOn ? Color.red : Color(UIColor.tertiarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .opacity(isOn || canToggleOff ? 1 : 0.4)
                                }
                                .buttonStyle(.plain)
                                .disabled(isOn && !canToggleOff)
                            }
                        }
                        Text("Tap to toggle. At least 1 day required.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Workout Schedule")
                }

                // Reminders
                Section {
                    Toggle(isOn: $remindersEnabled) {
                        Label("Workout Reminders", systemImage: "bell.fill")
                    }
                    .tint(.red)
                    .onChange(of: remindersEnabled) { _, enabled in
                        Task { await handleReminderToggle(enabled) }
                    }

                    if remindersEnabled && !notificationsDenied {
                        DatePicker(
                            "Reminder Time",
                            selection: $reminderTime,
                            displayedComponents: .hourAndMinute
                        )
                        .onChange(of: reminderTime) { _, time in
                            let comps = Calendar.current.dateComponents([.hour, .minute], from: time)
                            NotificationManager.shared.reminderHour   = comps.hour   ?? 8
                            NotificationManager.shared.reminderMinute = comps.minute ?? 0
                            NotificationManager.shared.scheduleReminders(
                                track: track, levelDisplayName: levelDisplayName,
                                workoutDays: Array(selectedDays).sorted())
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Label("Mon · \(mondayWorkout)", systemImage: "circle.fill")
                                .font(.caption).foregroundStyle(.secondary)
                            Label("Wed · \(wednesdayWorkout)", systemImage: "circle.fill")
                                .font(.caption).foregroundStyle(.secondary)
                            Label("Fri · \(fridayWorkout)", systemImage: "circle.fill")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 2)
                    }

                    if notificationsDenied {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                            Text("Notifications are disabled. Enable them in Settings.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Button("Open Settings") {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.red)
                    }
                } header: {
                    Text("Reminders")
                } footer: {
                    if remindersEnabled && !notificationsDenied {
                        Text("You'll be reminded on workout days (Mon, Wed, Fri) at the selected time.")
                    }
                }

                // Danger Zone
                Section {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        HStack {
                            Label("Delete Account", systemImage: "trash")
                            if isDeleting {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }
                    .disabled(isDeleting)
                    .alert("Delete Account?", isPresented: $showingDeleteConfirmation) {
                        Button("Cancel", role: .cancel) { }
                        Button("Delete Permanently", role: .destructive) {
                            Task {
                                isDeleting = true
                                let result = await onDeleteAccount?()
                                isDeleting = false
                                
                                if result?.requiresReauth == true {
                                    showingReauthAlert = true
                                }
                            }
                        }
                    } message: {
                        Text("This action cannot be undone. All your workout data will be permanently deleted.")
                    }
                    .alert("Recent Login Required", isPresented: $showingReauthAlert) {
                        Button("OK") {
                            onSignOut()
                        }
                    } message: {
                        Text("For your security, please sign out and sign back in to confirm your identity before deleting your account.")
                    }
                } header: {
                    Text("Danger Zone")
                } footer: {
                    Text("Account deletion is permanent and removes all stored data.")
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        onSignOut()
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingTrackPicker) {
                TrackSelectionView(
                    currentTrack: track,
                    onSelect: { tier in
                        onTrackSwitch?(tier)
                        showingTrackPicker = false
                    },
                    onDismiss: { showingTrackPicker = false }
                )
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
            }
            .task {
                let status = await NotificationManager.shared.authorizationStatus()
                if status == .denied && remindersEnabled {
                    notificationsDenied = true
                    remindersEnabled = false
                    NotificationManager.shared.isEnabled = false
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

#Preview {
    AccountSettingsView(
        email: "user@gmail.com",
        isPro: false,
        storeKit: StoreKitManager(),
        track: .advanced,
        levelDisplayName: "Level 1C",
        workoutDays: [2, 4, 6],
        ageBracket: .constant(.fiftiesPlus),
        equipment: .constant(.fullGym),
        onSignOut: {}
    )
}
