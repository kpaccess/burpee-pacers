//
//  WatchRootView.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

struct WatchRootView: View {
    @Environment(WatchSessionManager.self) var session

    var body: some View {
        if session.showSummary {
            WatchSummaryView()
        } else if session.phase == "active" || session.phase == "prepare" || session.phase == "paused" {
            WatchWorkoutView()
        } else {
            WatchIdleView()
        }
    }
}
