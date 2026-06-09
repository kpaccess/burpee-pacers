//
//  HealthManager.swift
//  BurpeePacer
//
//  HKWorkoutSession on iOS requires iOS 26+. For iOS 17 targets the Watch
//  owns the HKWorkoutSession (see WatchSessionManager). This stub lets
//  SessionTimerViewModel compile unchanged.
//

import Foundation
import HealthKit

final class HealthManager {
    static let shared = HealthManager()
    private let healthStore = HKHealthStore()

    private init() {}

    var session: Any? { nil }

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let share: Set<HKSampleType> = [HKQuantityType.workoutType()]
        try? await healthStore.requestAuthorization(toShare: share, read: [])
    }

    func startWorkout() async {
        startWatchApp()
    }

    func startWatchApp() {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .functionalStrengthTraining
        configuration.locationType = .indoor

        healthStore.startWatchApp(with: configuration) { success, error in
            if !success {
                print("HealthManager: Failed to start watch app: \(String(describing: error))")
            } else {
                print("HealthManager: Successfully requested watch app start")
            }
        }
    }

    func pauseWorkout() {}
    func resumeWorkout() {}
    func endWorkout() async {}
}

