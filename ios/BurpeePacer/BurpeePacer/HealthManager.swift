//
//  HealthManager.swift
//  BurpeePacer
//
//  HKWorkoutSession on iOS requires iOS 26+. For iOS 17 targets the Watch
//  owns the HKWorkoutSession (see WatchSessionManager). This stub lets
//  SessionTimerViewModel compile unchanged.
//

import Foundation

final class HealthManager {
    static let shared = HealthManager()
    private init() {}

    var session: Any? { nil }

    func requestAuthorization() async {}
    func startWorkout() async {}
    func pauseWorkout() {}
    func resumeWorkout() {}
    func endWorkout() async {}
}
