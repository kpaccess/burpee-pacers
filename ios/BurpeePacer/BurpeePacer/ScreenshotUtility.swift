//
//  ScreenshotUtility.swift
//  BurpeePacer
//
//  A utility to populate the app with realistic data for App Store screenshots.
//

import Foundation
import SwiftUI

#if DEBUG
extension AppViewModel {
    /// Creates a preview-ready ViewModel with rich mock data.
    static var screenshotPreview: AppViewModel {
        let vm = AppViewModel(firebase: MockFirebaseService())
        return vm
    }
}

/// A mock version of FirebaseService that returns static data for screenshots.
class MockFirebaseService: FirebaseService {
    override init() {
        super.init()
        self.currentUser = nil 
        self.isLoading = false
        
        // Populate with 4 weeks of realistic data
        let calendar = Calendar.current
        var logs: [FirestoreWorkoutLog] = []
        
        // Start 30 days ago
        let startDate = calendar.date(byAdding: .day, value: -30, to: Date())!
        let startDateKey = FirebaseService.dateKey(startDate)
        
        for i in 0..<30 {
            guard let date = calendar.date(byAdding: .day, value: i, to: startDate) else { continue }
            let weekday = calendar.component(.weekday, from: date)
            
            // Log workouts on Mon/Wed/Fri (2, 4, 6)
            if [2, 4, 6].contains(weekday) && date < calendar.startOfDay(for: Date()) {
                // Randomly miss a few to look realistic
                if i == 5 || i == 12 { continue }
                
                let isCompleted = true
                let levelID = i < 15 ? "B1" : "B2"
                let mode = "fiveCount"
                
                logs.append(FirestoreWorkoutLog(
                    date: FirebaseService.dateKey(date),
                    completed: isCompleted,
                    levelCompleted: "\(levelID)(\(mode))",
                    workoutType: "no_pushups",
                    repsCompleted: isCompleted ? (levelID == "B1" ? 20 : 40) : 15
                ))
            }
        }
        
        self.userData = FirestoreUserData(
            startDate: startDateKey,
            startWeight: 182.5,
            workoutTier: "beginner",
            currentLevelId: "B3",
            isPro: false,
            isAdmin: false,
            startPictureUrl: nil,
            workoutLogs: logs,
            workoutDays: [2, 4, 6],
            ageBracket: "thirties",
            equipment: "dumbbellsOnly"
        )
    }
    
    override func updateLevel(_ levelID: String) async {}
    override func updateWorkoutDays(_ days: [Int]) async {}
    override func updateStartWeight(_ weightLbs: Double) async {}
    override func updateTrack(_ tier: String) async {}
    override func updatePersonalization(age: AgeBracket, equipment: Equipment) async {}
    override func saveWorkoutLog(date: Date, levelID: String, mode: WorkoutMode, repsCompleted: Int, completed: Bool) async {}
    
    // Prevent the base class listener from clearing our mock data
    override func attachListener(uid: String?) {
        self.isLoading = false
    }
}

struct ScreenshotContainer<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            content
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Previews for App Store Screenshots

#Preview("1. Dashboard - Progress") {
    ScreenshotContainer {
        DashboardView(viewModel: .screenshotPreview)
    }
    .previewDevice("iPhone 11 Pro Max")
}

#Preview("2. Active Timer") {
    let vm = SessionTimerViewModel(
        level: LevelDatabase.beginnerLevels[2], // B3: 55 reps
        workoutMode: .fiveCount
    )
    
    ScreenshotContainer {
        SessionTimerView(viewModel: vm)
            .onAppear {
                vm.timeRemaining = 12 * 60 + 45 // 12:45 remaining
                vm.currentReps = 21
                vm.isRunning = true // This will show the pace chip
            }
    }
    .previewDevice("iPhone 11 Pro Max")
}

#Preview("3. Level Selection") {
    ScreenshotContainer {
        // We can use a modified Dashboard to show the picker
        DashboardView(viewModel: .screenshotPreview)
            .overlay {
                // Just a hint that this is the screen to capture with the picker open
                Text("Capture with 'Choose Level' sheet open")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.3))
                    .padding(.top, 400)
            }
    }
    .previewDevice("iPhone 11 Pro Max")
}

#Preview("4. Strength Finisher") {
    ScreenshotContainer {
        ScrollView {
            VStack(spacing: 20) {
                let vm = AppViewModel.screenshotPreview
                StatsOverviewCard(viewModel: vm)
                
                // Focusing on the Finisher Card
                let finisher = FinisherDatabase.finisher(for: .thirties, equipment: .dumbbellsOnly)
                VStack(alignment: .leading, spacing: 12) {
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
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                
                RecoveryDisclosureGroup()
            }
            .padding()
        }
    }
    .previewDevice("iPhone 11 Pro Max")
}

#Preview("5. Progress & Stats") {
    ScreenshotContainer {
        ScrollView {
            VStack(spacing: 20) {
                StatsOverviewCard(viewModel: .screenshotPreview)
                
                ProgressPhotosSection(
                    daysSinceStart: 25,
                    remoteDay1Url: nil
                )
            }
            .padding()
        }
    }
    .previewDevice("iPhone 11 Pro Max")
}

#Preview("6. Advanced - Hybrid Mode") {
    let vm = SessionTimerViewModel(
        level: LevelDatabase.advancedLevels[2], // A3
        workoutMode: .hybrid
    )
    
    ScreenshotContainer {
        SessionTimerView(viewModel: vm)
            .onAppear {
                vm.timeRemaining = 8 * 60 + 15 // Phase 2 (Hybrid transitions at 10:00)
                vm.currentReps = 12
                vm.isRunning = true
            }
    }
    .previewDevice("iPhone 11 Pro Max")
}
#endif

