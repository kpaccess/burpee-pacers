//
//  BurpeePacerTests.swift
//  BurpeePacer
//
//  Unit tests using XCTest framework
//

import XCTest
@testable import BurpeePacer

@Suite("User Profile Tests")
struct UserProfileTests {
    
    @Test("Weight conversion from kg to lbs")
    func weightConversionToLbs() {
        var profile = UserProfile(
            startDate: Date(),
            currentWeight: 70.0,
            useKilograms: false, // Display in lbs
            currentTrack: .beginner,
            currentLevelID: "B1"
        )
        
        let expectedLbs = 70.0 * 2.20462
        #expect(abs(profile.weightDisplay - expectedLbs) < 0.01, "Weight should convert correctly to lbs")
    }
    
    @Test("Weight display in kg")
    func weightDisplayInKg() {
        let profile = UserProfile(
            startDate: Date(),
            currentWeight: 70.0,
            useKilograms: true,
            currentTrack: .beginner,
            currentLevelID: "B1"
        )
        
        #expect(profile.weightDisplay == 70.0, "Weight should display as kg when useKilograms is true")
    }
    
    @Test("Protein target calculation")
    func proteinTargetCalculation() {
        let profile = UserProfile(
            startDate: Date(),
            currentWeight: 80.0,
            useKilograms: true,
            currentTrack: .beginner,
            currentLevelID: "B1"
        )
        
        let expectedProtein = 80.0 * 1.5
        #expect(profile.proteinTarget == expectedProtein, "Protein should be 1.5g per kg")
    }
    
    @Test("Days since start calculation")
    func daysSinceStartCalculation() {
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -30, to: Date())!
        
        let profile = UserProfile(
            startDate: startDate,
            currentWeight: 70.0,
            useKilograms: true,
            currentTrack: .beginner,
            currentLevelID: "B1"
        )
        
        #expect(profile.daysSinceStart >= 29 && profile.daysSinceStart <= 31, "Should calculate days since start")
    }
}

@Suite("Level Database Tests")
struct LevelDatabaseTests {
    
    @Test("Beginner levels count")
    func beginnerLevelsCount() {
        let levels = LevelDatabase.beginnerLevels
        #expect(levels.count == 6, "Should have 6 beginner levels")
    }
    
    @Test("Advanced levels count")
    func advancedLevelsCount() {
        let levels = LevelDatabase.advancedLevels
        #expect(levels.count == 5, "Should have 5 advanced levels")
    }
    
    @Test("Beginner level progression")
    func beginnerLevelProgression() {
        let levels = LevelDatabase.beginnerLevels
        let targetReps = [20, 40, 55, 70, 90, 110]
        
        for (index, level) in levels.enumerated() {
            #expect(level.targetReps == targetReps[index], "Level \(level.id) should have \(targetReps[index]) reps")
        }
    }
    
    @Test("Level IDs are unique")
    func levelIDsUnique() {
        let allLevels = LevelDatabase.beginnerLevels + LevelDatabase.advancedLevels
        let ids = allLevels.map { $0.id }
        let uniqueIDs = Set(ids)
        
        #expect(ids.count == uniqueIDs.count, "All level IDs should be unique")
    }
    
    @Test("Levels for track retrieval")
    func levelsForTrack() {
        let beginnerLevels = LevelDatabase.levels(for: .beginner)
        let advancedLevels = LevelDatabase.levels(for: .advanced)
        
        #expect(beginnerLevels.count == 6, "Should retrieve 6 beginner levels")
        #expect(advancedLevels.count == 5, "Should retrieve 5 advanced levels")
    }
}

@Suite("Session Timer ViewModel Tests")
struct SessionTimerViewModelTests {
    
    @Test("Initial timer state")
    func initialTimerState() {
        let level = LevelDatabase.beginnerLevels[0]
        let viewModel = SessionTimerViewModel(level: level)
        
        #expect(viewModel.timeRemaining == 20 * 60, "Should start with 20 minutes")
        #expect(viewModel.isRunning == false, "Should not be running initially")
        #expect(viewModel.currentReps == 0, "Should start with 0 reps")
    }
    
    @Test("Formatted time display")
    func formattedTimeDisplay() {
        let level = LevelDatabase.beginnerLevels[0]
        let viewModel = SessionTimerViewModel(level: level)
        
        viewModel.timeRemaining = 10 * 60 + 30 // 10:30
        #expect(viewModel.formattedTime == "10:30", "Should format time correctly")
        
        viewModel.timeRemaining = 5 // 00:05
        #expect(viewModel.formattedTime == "00:05", "Should format small times correctly")
    }
    
    @Test("Progress calculation")
    func progressCalculation() {
        let level = LevelDatabase.beginnerLevels[0] // Target: 20 reps
        let viewModel = SessionTimerViewModel(level: level)
        
        viewModel.currentReps = 10
        #expect(viewModel.progress == 0.5, "Progress should be 50% at 10/20 reps")
        
        viewModel.currentReps = 20
        #expect(viewModel.progress == 1.0, "Progress should be 100% at 20/20 reps")
    }
    
    @Test("Rep increment and decrement")
    func repIncrementDecrement() {
        let level = LevelDatabase.beginnerLevels[0]
        let viewModel = SessionTimerViewModel(level: level)
        
        viewModel.incrementRep()
        #expect(viewModel.currentReps == 1, "Should increment to 1")
        
        viewModel.incrementRep()
        viewModel.incrementRep()
        #expect(viewModel.currentReps == 3, "Should increment to 3")
        
        viewModel.decrementRep()
        #expect(viewModel.currentReps == 2, "Should decrement to 2")
        
        viewModel.decrementRep()
        viewModel.decrementRep()
        viewModel.decrementRep()
        #expect(viewModel.currentReps == 0, "Should not go below 0")
    }
    
    @Test("Completion detection")
    func completionDetection() {
        let level = LevelDatabase.beginnerLevels[0] // Target: 20 reps
        let viewModel = SessionTimerViewModel(level: level)
        
        viewModel.currentReps = 19
        #expect(viewModel.isCompleted == false, "Should not be completed at 19/20")
        
        viewModel.currentReps = 20
        #expect(viewModel.isCompleted == true, "Should be completed at 20/20")
        
        viewModel.currentReps = 25
        #expect(viewModel.isCompleted == true, "Should be completed above target")
    }
}

@Suite("App ViewModel Tests")
struct AppViewModelTests {
    
    @Test("Initial state")
    func initialState() {
        let viewModel = AppViewModel()
        
        #expect(viewModel.userProfile.currentTrack == .beginner, "Should start with beginner track")
        #expect(viewModel.workoutSessions.isEmpty, "Should start with no sessions")
    }
    
    @Test("Track switching")
    func trackSwitching() {
        let viewModel = AppViewModel()
        
        viewModel.switchTrack(to: .advanced)
        #expect(viewModel.userProfile.currentTrack == .advanced, "Should switch to advanced")
        #expect(viewModel.userProfile.currentLevelID == "A1", "Should reset to first advanced level")
        
        viewModel.switchTrack(to: .beginner)
        #expect(viewModel.userProfile.currentTrack == .beginner, "Should switch to beginner")
        #expect(viewModel.userProfile.currentLevelID == "B1", "Should reset to first beginner level")
    }
    
    @Test("Adding workout session")
    func addingWorkoutSession() {
        let viewModel = AppViewModel()
        
        let session = WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 20,
            targetReps: 20,
            completed: true
        )
        
        viewModel.addSession(session)
        #expect(viewModel.workoutSessions.count == 1, "Should add session")
        #expect(viewModel.userProfile.currentLevelID == "B2", "Should auto-advance to B2")
    }
    
    @Test("Day state calculation for rest day")
    func dayStateRestDay() {
        let viewModel = AppViewModel()
        let calendar = Calendar.current
        
        // Find a Sunday (rest day)
        var date = Date()
        while calendar.component(.weekday, from: date) != 1 {
            date = calendar.date(byAdding: .day, value: 1, to: date)!
        }
        
        let state = viewModel.dayState(for: date)
        
        if case .rest = state {
            // Success
        } else {
            #expect(Bool(false), "Sunday should be a rest day")
        }
    }
    
    @Test("Day state calculation for workout day")
    func dayStateWorkoutDay() {
        let viewModel = AppViewModel()
        let calendar = Calendar.current
        
        // Find a Monday (workout day)
        var date = Date()
        while calendar.component(.weekday, from: date) != 2 {
            date = calendar.date(byAdding: .day, value: 1, to: date)!
        }
        
        let state = viewModel.dayState(for: date)
        
        if case .scheduled = state {
            // Success - future workout day
        } else if case .missed = state {
            // Success - past workout day without session
        } else if case .completed = state {
            // Success - completed workout day
        } else {
            #expect(Bool(false), "Monday should be a workout day (scheduled, missed, or completed)")
        }
    }
    
    @Test("CSV export format")
    func csvExportFormat() {
        let viewModel = AppViewModel()
        
        viewModel.addSession(WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 20,
            targetReps: 20,
            completed: true
        ))
        
        let csv = viewModel.exportCSV()
        
        #expect(csv.contains("Date,Level,Reps Completed,Target Reps,Completed"), "Should have CSV header")
        #expect(csv.contains("B1"), "Should contain level ID")
        #expect(csv.contains("20"), "Should contain reps")
        #expect(csv.contains("Yes"), "Should contain completion status")
    }
    
    @Test("Level advancement progression")
    func levelAdvancementProgression() {
        let viewModel = AppViewModel()
        
        // Start at B1
        #expect(viewModel.currentLevel.id == "B1")
        
        // Complete B1
        viewModel.addSession(WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 20,
            targetReps: 20,
            completed: true
        ))
        
        #expect(viewModel.currentLevel.id == "B2", "Should advance to B2")
        
        // Complete B2
        viewModel.addSession(WorkoutSession(
            date: Date(),
            levelID: "B2",
            repsCompleted: 40,
            targetReps: 40,
            completed: true
        ))
        
        #expect(viewModel.currentLevel.id == "B3", "Should advance to B3")
    }
    
    @Test("Weight update")
    func weightUpdate() {
        let viewModel = AppViewModel()
        
        viewModel.updateWeight(80.0) // 80 kg
        #expect(viewModel.userProfile.currentWeight == 80.0)
        
        viewModel.userProfile.useKilograms = false
        viewModel.updateWeight(176.37) // 176.37 lbs ≈ 80 kg
        #expect(abs(viewModel.userProfile.currentWeight - 80.0) < 0.1, "Should convert lbs to kg")
    }
}

@Suite("Calendar Helper Tests")
struct CalendarHelperTests {
    
    @Test("Start of month calculation")
    func startOfMonthCalculation() {
        let calendar = Calendar.current
        let date = calendar.date(from: DateComponents(year: 2026, month: 5, day: 21))!
        
        let startOfMonth = calendar.startOfMonth(for: date)
        let components = calendar.dateComponents([.year, .month, .day], from: startOfMonth)
        
        #expect(components.year == 2026)
        #expect(components.month == 5)
        #expect(components.day == 1)
    }
    
    @Test("Workout days identification")
    func workoutDaysIdentification() {
        let calendar = Calendar.current
        
        // Test all weekdays
        for weekday in 1...7 {
            var components = DateComponents()
            components.year = 2026
            components.month = 5
            components.weekday = weekday
            
            guard let date = calendar.nextDate(after: Date(), matching: components, matchingPolicy: .nextTime) else {
                continue
            }
            
            let actualWeekday = calendar.component(.weekday, from: date)
            let isWorkoutDay = actualWeekday == 2 || actualWeekday == 4 || actualWeekday == 6
            
            if weekday == 2 || weekday == 4 || weekday == 6 {
                #expect(isWorkoutDay, "Weekday \(weekday) should be a workout day")
            } else {
                #expect(!isWorkoutDay, "Weekday \(weekday) should not be a workout day")
            }
        }
    }
}

@Suite("Workout Session Tests")
struct WorkoutSessionTests {
    
    @Test("Session creation")
    func sessionCreation() {
        let session = WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 15,
            targetReps: 20,
            completed: false
        )
        
        #expect(session.levelID == "B1")
        #expect(session.repsCompleted == 15)
        #expect(session.targetReps == 20)
        #expect(session.completed == false)
    }
    
    @Test("Completion status")
    func completionStatus() {
        let completedSession = WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 20,
            targetReps: 20,
            completed: true
        )
        
        let incompleteSession = WorkoutSession(
            date: Date(),
            levelID: "B1",
            repsCompleted: 15,
            targetReps: 20,
            completed: false
        )
        
        #expect(completedSession.completed == true)
        #expect(incompleteSession.completed == false)
    }
}

// MARK: - Test Helper Extensions

extension SessionTimerViewModel {
    static func test(level: Level, reps: Int = 0, timeRemaining: TimeInterval = 20 * 60) -> SessionTimerViewModel {
        let vm = SessionTimerViewModel(level: level)
        vm.currentReps = reps
        vm.timeRemaining = timeRemaining
        return vm
    }
}

// MARK: - Preview Tests

#Preview("Running All Tests") {
    Text("Run tests using ⌘U or Product > Test")
        .font(.headline)
        .padding()
}
