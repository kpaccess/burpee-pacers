//
//  BurpeePacerWatchApp.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

@main
struct BurpeePacerWatchApp: App {

    private let sessionManager = WatchSessionManager.shared

    var body: some Scene {
        WindowGroup {
            WatchRootView()
                .environment(sessionManager)
                .task { await sessionManager.requestAuthorization() }
        }
    }
}
