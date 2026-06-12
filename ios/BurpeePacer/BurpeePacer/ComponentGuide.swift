//
//  ComponentGuide.swift
//  BurpeePacer
//
//  Component usage examples and reference
//

import SwiftUI

/*
 
 COMPONENT QUICK REFERENCE GUIDE
 ================================
 
 ## 1. SessionTimerView
 
 Usage:
 ```swift
 SessionTimerView(level: currentLevel) { session in
     // Handle completed session
     viewModel.addSession(session)
 }
 ```
 
 Features:
 - 20-minute countdown timer
 - Rep counter with +/- controls
 - Progress ring visualization
 - Tutorial video link
 - Play/Pause/Reset controls
 
 
 ## 2. DashboardView
 
 Usage:
 ```swift
 DashboardView(viewModel: $appViewModel)
 ```
 
 Contains:
 - HeaderView
 - StatsOverviewCard
 - Current level card
 - RecoveryDisclosureGroup
 - WorkoutCalendarGridView
 - ProgressPhotosSection
 - Export button
 - Rest reminder
 
 
 ## 3. HeaderView
 
 Usage:
 ```swift
 HeaderView(statusText: "Day 30 • Busy People Program") {
     // Handle reset
 }
 ```
 
 
 ## 4. StatsOverviewCard
 
 Usage:
 ```swift
 StatsOverviewCard(profile: $userProfile)
 ```
 
 Features:
 - Start date display
 - Weight tracking (kg/lbs toggle)
 - Auto-calculated protein target
 - Track selector (Beginner/Advanced)
 
 
 ## 5. WorkoutCalendarGridView
 
 Usage:
 ```swift
 WorkoutCalendarGridView(viewModel: $appViewModel)
 ```
 
 Features:
 - Monthly grid layout
 - Mon/Wed/Fri workout days
 - Completion badges
 - Missed workout indicators
 - Month navigation
 
 
 ## 6. RecoveryDisclosureGroup
 
 Usage:
 ```swift
 RecoveryDisclosureGroup()
 ```
 
 Content:
 - Warm-up routine (5 min)
 - Cool-down routine (5-10 min)
 - Recovery guidelines
 
 
 ## 7. ProgressPhotosSection
 
 Usage:
 ```swift
 ProgressPhotosSection(daysSinceStart: viewModel.daysSinceStart)
 ```
 
 Features:
 - Day 1 baseline photo
 - 6-month milestone photo (locked until 180 days)
 - PhotosPicker integration
 - Persistent storage
 
 
 ## DATA MODELS
 
 ### UserProfile
 ```swift
 struct UserProfile {
     var startDate: Date
     var currentWeight: Double      // in kg
     var useKilograms: Bool
     var currentTrack: ProgramTrack
     var currentLevelID: String
 }
 ```
 
 ### WorkoutSession
 ```swift
 struct WorkoutSession {
     let id: UUID
     let date: Date
     let levelID: String
     let repsCompleted: Int
     let targetReps: Int
     let completed: Bool
 }
 ```
 
 ### Level
 ```swift
 struct Level {
     let id: String           // "B1", "A3", etc.
     let track: ProgramTrack
     let displayName: String
     let targetReps: Int
 }
 ```
 
 
 ## VIEW MODEL METHODS
 
 ### AppViewModel
 
 Profile Management:
 - `updateWeight(_ weight: Double)`
 - `toggleWeightUnit()`
 - `switchTrack(to: ProgramTrack)`
 - `advanceToNextLevel()`
 - `resetProgram()`
 
 Session Management:
 - `addSession(_ session: WorkoutSession)`
 - `sessionsForDate(_ date: Date) -> [WorkoutSession]`
 - `dayState(for date: Date) -> DayState`
 
 Calendar:
 - `generateCalendarDays(for month: Date) -> [CalendarDay]`
 
 Export:
 - `exportCSV() -> String`
 
 
 ### SessionTimerViewModel
 
 Timer Controls:
 - `startTimer()`
 - `pauseTimer()`
 - `resetTimer()`
 
 Rep Management:
 - `incrementRep()`
 - `decrementRep()`
 
 Session Creation:
 - `createSession() -> WorkoutSession`
 
 Computed Properties:
 - `formattedTime: String`        // "MM:SS"
 - `progress: Double`             // 0.0 to 1.0
 - `progressText: String`         // "X / Y"
 - `canStart: Bool`
 - `isCompleted: Bool`
 
 
 ## COLOR SYSTEM
 
 Primary:
 - Background: Color(UIColor.systemBackground)
 - Cards: Color(UIColor.secondarySystemBackground)
 
 Accents:
 - Action/Alert: Color.red
 - Success: Color.green
 - Warning: Color.orange
 
 
 ## ANIMATION GUIDELINES
 
 Use smooth, native animations:
 ```swift
 .animation(.default, value: someValue)
 .animation(.spring(response: 0.3, dampingFraction: 0.6), value: reps)
 .animation(.easeInOut(duration: 0.2), value: isRunning)
 ```
 
 
 ## PERSISTENCE
 
 UserDefaults Keys:
 - "userProfile" → UserProfile JSON
 - "workoutSessions" → [WorkoutSession] JSON
 - "day1Photo" → Image Data
 - "sixMonthPhoto" → Image Data
 
 
 ## SF SYMBOLS USED
 
 - arrow.counterclockwise.circle.fill
 - calendar
 - figure.arms.open
 - figure.run
 - figure.strengthtraining.traditional
 - flame.fill
 - fork.knife
 - heart.fill
 - heart.text.square.fill
 - lock.fill
 - minus.circle.fill
 - pause.fill
 - photo.badge.plus
 - photo.on.rectangle.angled
 - play.circle.fill
 - play.rectangle.fill
 - plus.circle.fill
 - square.and.arrow.up
 - timer
 - wind
 - xmark
 
 */
