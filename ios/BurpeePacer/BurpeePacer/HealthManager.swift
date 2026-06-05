//
//  HealthManager.swift
//  BurpeePacer
//
//  HealthKit workout sessions run on the Apple Watch (WatchSessionManager).
//  This class exists as a no-op stub so SessionTimerViewModel compiles
//  unchanged on iOS.
//

import Foundation
import HealthKit

final class HealthManager {
    static let shared = HealthManager()
    private init() {}

    // Stub — Watch owns the HKWorkoutSession
    var session: Any? { nil }

    func startWorkout() async {}
    func pauseWorkout() {}
    func resumeWorkout() {}
    func endWorkout() async {}
}
