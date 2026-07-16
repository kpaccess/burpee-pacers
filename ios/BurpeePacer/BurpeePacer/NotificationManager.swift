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
        for weekday in workoutDays where idsByWeekday[weekday] != nil {
            let item = ProgramCatalog.reminderContent(
                for: track,
                weekday: weekday,
                levelDisplayName: levelDisplayName
            )
            let content = UNMutableNotificationContent()
            content.title = item.title
            content.body  = item.body
            content.sound = .default

            var comps = DateComponents()
            comps.weekday = weekday
            comps.hour    = reminderHour
            comps.minute  = reminderMinute

            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let id = idsByWeekday[weekday]!
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
