//
//  BurpeePacerWatchApp.swift
//  BurpeePacerWatch Watch App
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI
import HealthKit
import WatchKit

class WatchAppDelegate: NSObject, WKApplicationDelegate {
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
        // Watch app is now in the foreground. WatchConnectivity will deliver
        // the current workout state; WatchSessionManager.apply() starts the
        // HKWorkoutSession when phase transitions to "active".
    }
}

@main
struct BurpeePacerWatchApp: App {
    @WKApplicationDelegateAdaptor(WatchAppDelegate.self) var appDelegate
    private let sessionManager = WatchSessionManager.shared

    var body: some Scene {
        WindowGroup {
            WatchRootView()
                .environment(sessionManager)
                .task { await sessionManager.requestAuthorization() }
        }
    }
}
