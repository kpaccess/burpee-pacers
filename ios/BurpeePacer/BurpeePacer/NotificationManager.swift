//
//  NotificationManager.swift
//  BurpeePacer
//
//  Schedules weekly workout reminders on Mon / Wed / Fri.
//  Content is personalised by track and current level.
//

import UserNotifications
import Foundation

final class NotificationManager {
    static let shared = NotificationManager()
    private init() {}

    private let center = UNUserNotificationCenter.current()
    private let idsByWeekday: [Int: String] = [
        2: "reminder_mon", 4: "reminder_wed", 6: "reminder_fri"
    ]

    // MARK: - Persisted preferences (UserDefaults)

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "remindersEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "remindersEnabled") }
    }

    var reminderHour: Int {
        get { UserDefaults.standard.object(forKey: "reminderHour") != nil
                ? UserDefaults.standard.integer(forKey: "reminderHour") : 8 }
        set { UserDefaults.standard.set(newValue, forKey: "reminderHour") }
    }

    var reminderMinute: Int {
        get { UserDefaults.standard.integer(forKey: "reminderMinute") }
        set { UserDefaults.standard.set(newValue, forKey: "reminderMinute") }
    }

    // MARK: - Permission

    func requestPermission() async -> Bool {
        (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    func authorizationStatus() async -> UNAuthorizationStatus {
        await center.notificationSettings().authorizationStatus
    }

    // MARK: - Scheduling

    func scheduleReminders(track: ProgramTrack, levelDisplayName: String, workoutDays: [Int] = [2, 4, 6]) {
        cancelReminders()

        let allItems: [(weekday: Int, title: String, body: String)]
        switch track {
        case .beginner:
            allItems = [
                (2, "Workout Day! 💪", "Time for your burpee session — \(levelDisplayName)"),
                (4, "Workout Day! 💪", "Time for your burpee session — \(levelDisplayName)"),
                (6, "Workout Day! 💪", "Time for your burpee session — \(levelDisplayName)"),
            ]
        case .advanced:
            allItems = [
                (2, "Navy Seals Day! 💪", "Full range burpees today — \(levelDisplayName)"),
                (4, "5-Count Pushups Day! 💪", "Strict pushup burpees today — \(levelDisplayName)"),
                (6, "Hybrid Day! 💪", "Navy Seals + 5-Count Pushups today — \(levelDisplayName)"),
            ]
        }

        for item in allItems where workoutDays.contains(item.weekday) {
            let content = UNMutableNotificationContent()
            content.title = item.title
            content.body  = item.body
            content.sound = .default

            var comps = DateComponents()
            comps.weekday = item.weekday
            comps.hour    = reminderHour
            comps.minute  = reminderMinute

            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let id = idsByWeekday[item.weekday]!
            center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
        }
    }

    func cancelReminders() {
        center.removePendingNotificationRequests(withIdentifiers: Array(idsByWeekday.values))
    }

    func rescheduleIfEnabled(track: ProgramTrack, levelDisplayName: String, workoutDays: [Int] = [2, 4, 6]) {
        guard isEnabled else { return }
        scheduleReminders(track: track, levelDisplayName: levelDisplayName, workoutDays: workoutDays)
    }
}
