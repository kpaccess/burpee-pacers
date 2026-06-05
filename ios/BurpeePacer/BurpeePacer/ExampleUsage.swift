//
//  ExampleUsage.swift
//  BurpeePacer
//
//  Example implementations and customization patterns
//

import SwiftUI

// MARK: - Example 1: Standalone Timer Usage

struct StandaloneTimerExample: View {
    @State private var showTimer = false
    
    var body: some View {
        Button("Start Level B1 Workout") {
            showTimer = true
        }
        .sheet(isPresented: $showTimer) {
            SessionTimerView(viewModel: SessionTimerViewModel(level: LevelDatabase.beginnerLevels[0], workoutMode: .fiveCount)) { session in
                print("Completed: \(session.repsCompleted) reps")
                showTimer = false
            }
        }
    }
}

// MARK: - Example 2: Custom Level Creation

struct CustomLevelExample: View {
    let customLevel = Level(
        id: "CUSTOM1",
        track: .beginner,
        displayName: "Custom Challenge",
        description: "50 burpees in 20 min.",
        sealsGoal: 0,
        sixCountsGoal: 50,
        tutorialURL: "https://www.youtube.com/watch?v=custom"
    )

    var body: some View {
        SessionTimerView(viewModel: SessionTimerViewModel(level: customLevel, workoutMode: .fiveCount))
    }
}

// MARK: - Example 3: Programmatic Level Advancement

extension AppViewModel {
    func completeWorkout(reps: Int) {
        let mode = defaultMode()
        let session = WorkoutSession(
            date: Date(),
            levelID: currentLevel.id,
            workoutMode: mode,
            repsCompleted: reps,
            targetReps: currentLevel.goal(for: mode),
            completed: reps >= currentLevel.goal(for: mode)
        )
        
        addSession(session)
        
        // Auto-advance is handled in addSession
        // But you can also manually control it:
        if session.completed {
            print("Level completed! Advancing to next level.")
        } else {
            print("Keep trying! You'll get there.")
        }
    }
}

// MARK: - Example 4: Custom Calendar Filtering

extension AppViewModel {
    func completedWorkoutsThisMonth() -> Int {
        let calendar = Calendar.current
        let now = Date()
        
        return workoutSessions.filter { session in
            calendar.isDate(session.date, equalTo: now, toGranularity: .month) &&
            session.completed
        }.count
    }
    
    func totalRepsThisWeek() -> Int {
        let calendar = Calendar.current
        let now = Date()
        
        return workoutSessions.filter { session in
            calendar.isDate(session.date, equalTo: now, toGranularity: .weekOfYear)
        }.reduce(0) { $0 + $1.repsCompleted }
    }
    
    func currentStreak() -> Int {
        let calendar = Calendar.current
        var streak = 0
        var currentDate = calendar.startOfDay(for: Date())
        
        while true {
            let weekday = calendar.component(.weekday, from: currentDate)
            
            // Check workout days only
            if weekday == 2 || weekday == 4 || weekday == 6 {
                let sessions = sessionsForDate(currentDate)
                if sessions.isEmpty || !sessions.contains(where: { $0.completed }) {
                    break
                }
                streak += 1
            }
            
            guard let previousDate = calendar.date(byAdding: .day, value: -1, to: currentDate) else {
                break
            }
            currentDate = previousDate
            
            if streak > 100 { break } // Safety limit
        }
        
        return streak
    }
}

// MARK: - Example 5: Custom Stats View

struct CustomStatsView: View {
    @Bindable var viewModel: AppViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            statRow(
                title: "Completed This Month",
                value: "\(viewModel.completedWorkoutsThisMonth())",
                icon: "checkmark.circle.fill",
                color: .green
            )
            
            statRow(
                title: "Total Reps This Week",
                value: "\(viewModel.totalRepsThisWeek())",
                icon: "flame.fill",
                color: .orange
            )
            
            statRow(
                title: "Current Streak",
                value: "\(viewModel.currentStreak()) days",
                icon: "bolt.fill",
                color: .yellow
            )
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private func statRow(title: String, value: String, icon: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(color)
            
            Text(title)
                .font(.subheadline)
            
            Spacer()
            
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
        }
    }
}

// MARK: - Example 6: Adding Notifications

import UserNotifications

extension AppViewModel {
    func scheduleWorkoutReminders() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            guard granted else { return }
            
            // Clear existing notifications
            UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
            
            // Schedule for Mon/Wed/Fri at 6 PM
            let workoutDays = [2, 4, 6] // Monday, Wednesday, Friday
            
            for day in workoutDays {
                let content = UNMutableNotificationContent()
                content.title = "Time for Burpees!"
                content.body = "Your \(self.currentLevel.displayName) workout awaits. \(self.currentLevel.description)"
                content.sound = .default
                
                var dateComponents = DateComponents()
                dateComponents.weekday = day
                dateComponents.hour = 18 // 6 PM
                dateComponents.minute = 0
                
                let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
                let request = UNNotificationRequest(identifier: "workout-\(day)", content: content, trigger: trigger)
                
                UNUserNotificationCenter.current().add(request)
            }
        }
    }
}

// MARK: - Example 7: Enhanced Export with Attachments

import UniformTypeIdentifiers

extension AppViewModel {
    func exportDetailedReport() -> URL {
        var report = "BURPEE PACER - DETAILED REPORT\n"
        report += "================================\n\n"
        
        let daysSinceStart = Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
        let weightDisplay = useKilograms ? startWeightLbs / 2.20462 : startWeightLbs

        report += "Profile Information:\n"
        report += "-------------------\n"
        report += "Start Date: \(formatDate(startDate))\n"
        report += "Days Active: \(daysSinceStart)\n"
        report += "Current Weight: \(String(format: "%.1f", weightDisplay)) \(useKilograms ? "kg" : "lbs")\n"
        report += "Daily Protein Target: \(proteinTargetGrams)g\n"
        report += "Active Track: \(currentTrack.rawValue)\n"
        report += "Current Level: \(currentLevel.displayName)\n\n"
        
        report += "Workout History:\n"
        report += "---------------\n"
        report += "Total Sessions: \(workoutSessions.count)\n"
        report += "Completed: \(workoutSessions.filter { $0.completed }.count)\n"
        report += "Total Reps: \(workoutSessions.reduce(0) { $0 + $1.repsCompleted })\n\n"
        
        report += "Session Details:\n"
        report += "Date,Level,Reps,Target,Completed\n"
        
        for session in workoutSessions.sorted(by: { $0.date < $1.date }) {
            report += "\(formatDate(session.date)),\(session.levelID),\(session.repsCompleted),\(session.targetReps),\(session.completed ? "✓" : "✗")\n"
        }
        
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("burpee_pacer_detailed_report.txt")
        
        try? report.write(to: tempURL, atomically: true, encoding: .utf8)
        return tempURL
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Example 8: Custom Color Theme

struct CustomTheme {
    static let darkBackground = Color(hex: "#09090b")
    static let cardBackground = Color(hex: "#1c1c1e")
    static let accentRed = Color(hex: "#ef4444")
    static let accentGreen = Color(hex: "#22c55e")
    static let accentOrange = Color(hex: "#f97316")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Example 9: Widget Extension (Placeholder)

/*
 To create a widget for BurpeePacer:
 
 1. Add a Widget Extension target
 2. Use TimelineProvider to update stats
 3. Show current level and next workout day
 
 struct BurpeePacerWidget: Widget {
     let kind: String = "BurpeePacerWidget"
     
     var body: some WidgetConfiguration {
         StaticConfiguration(kind: kind, provider: Provider()) { entry in
             BurpeePacerWidgetView(entry: entry)
         }
         .configurationDisplayName("Burpee Pacer")
         .description("Track your burpee progress")
         .supportedFamilies([.systemSmall, .systemMedium])
     }
 }
 */

// MARK: - Example 10: Testing Utilities

#if DEBUG
extension AppViewModel {
    static var preview: AppViewModel {
        AppViewModel()
    }
    
    func populateTestData() {
        var date = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let levels = LevelDatabase.beginnerLevels

        while date <= Date() {
            let weekday = Calendar.current.component(.weekday, from: date)

            if weekday == 2 || weekday == 4 || weekday == 6 {
                let level = levels.randomElement()!
                let target = level.sixCountsGoal
                let completed = Bool.random()
                let reps = completed ? target : Int.random(in: max(0, target - 10)...(target - 1))

                addSession(WorkoutSession(
                    date: date,
                    levelID: level.id,
                    workoutMode: .fiveCount,
                    repsCompleted: reps,
                    targetReps: target,
                    completed: completed
                ))
            }

            date = Calendar.current.date(byAdding: .day, value: 1, to: date)!
        }
    }
}
#endif

// MARK: - Previews with Test Data

#if DEBUG
#Preview("Dashboard with Data") {
    @Previewable @State var viewModel = AppViewModel.preview
    
    DashboardView(viewModel: viewModel)
}

#Preview("Custom Stats") {
    @Previewable @State var viewModel = AppViewModel.preview

    CustomStatsView(viewModel: viewModel)
        .padding()
}
#endif
