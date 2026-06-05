//
//  WatchSessionManager.swift
//  BurpeePacerWatch Watch App
//

import Foundation
import WatchConnectivity
import HealthKit

@Observable
final class WatchSessionManager: NSObject {

    static let shared = WatchSessionManager()

    // MARK: - Workout Display State (mirrored from iPhone)

    var phase: String = "idle"          // "idle" | "prepare" | "active" | "finished"
    var secondsLeft: Int = 1200
    var totalSeconds: Int = 1200
    var prepareSecondsLeft: Int = 5
    var currentRep: Int = 0
    var totalReps: Int = 0
    var isActive: Bool = false
    var modeLabel: String = ""
    var hybridPhaseIndex: Int = 0

    // MARK: - Live HealthKit Metrics

    var heartRate: Double = 0
    var activeCalories: Double = 0

    // MARK: - Post-workout Summary

    var summaryReps: Int = 0
    var summaryDuration: TimeInterval = 0
    var summaryCalories: Double = 0
    var showSummary: Bool = false

    // MARK: - HealthKit

    private let healthStore = HKHealthStore()
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var workoutStartDate: Date?

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // MARK: - Commands to iPhone

    func sendCommand(_ action: String) {
        guard WCSession.default.activationState == .activated else { return }
        let message = ["action": action]
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil)
        }
    }

    func tapStart()        { sendCommand("start") }
    func tapPause()        { sendCommand("pause") }
    func tapReset()        { sendCommand("reset") }
    func tapIncrementRep() { sendCommand("incrementRep") }
    func tapDecrementRep() { sendCommand("decrementRep") }

    func dismissSummary() {
        showSummary = false
        phase = "idle"
        heartRate = 0
        activeCalories = 0
        currentRep = 0
        totalReps = 0
        secondsLeft = 1200
    }

    // MARK: - HealthKit Authorization

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let share: Set<HKSampleType> = [HKQuantityType.workoutType()]
        let read: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        try? await healthStore.requestAuthorization(toShare: share, read: read)
    }

    // MARK: - HealthKit Session Lifecycle

    private func startHealthKitWorkout() async {
        let config = HKWorkoutConfiguration()
        config.activityType = .functionalStrengthTraining
        config.locationType = .indoor

        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
            let builder = session.associatedWorkoutBuilder()
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore,
                                                          workoutConfiguration: config)
            builder.delegate = self
            session.delegate = self

            workoutSession = session
            workoutBuilder = builder
            workoutStartDate = Date()

            session.startActivity(with: workoutStartDate!)
            try await builder.beginCollection(at: workoutStartDate!)
        } catch {
            print("HealthKit workout start failed: \(error)")
        }
    }

    private func endHealthKitWorkout() async {
        guard let session = workoutSession, let builder = workoutBuilder else { return }
        session.end()
        do {
            try await builder.endCollection(at: Date())
            _ = try await builder.finishWorkout()
        } catch {
            print("HealthKit workout end failed: \(error)")
        }
        workoutSession = nil
        workoutBuilder = nil
    }

    // MARK: - Apply State from iPhone

    private func apply(_ dict: [String: Any]) {
        let newPhase   = dict["phase"]    as? String ?? "idle"
        let newIsActive = dict["isActive"] as? Bool   ?? false
        let wasActive  = isActive

        phase             = newPhase
        secondsLeft       = dict["secondsLeft"]       as? Int    ?? 1200
        totalSeconds      = dict["totalSeconds"]      as? Int    ?? 1200
        prepareSecondsLeft = dict["prepareSecondsLeft"] as? Int  ?? 5
        currentRep        = dict["currentRep"]        as? Int    ?? 0
        totalReps         = dict["totalReps"]         as? Int    ?? 0
        isActive          = newIsActive
        modeLabel         = dict["modeLabel"]         as? String ?? ""
        hybridPhaseIndex  = dict["hybridPhaseIndex"]  as? Int    ?? 0

        if newIsActive && !wasActive {
            Task { await startHealthKitWorkout() }
        }

        if !newIsActive && wasActive {
            summaryReps     = currentRep
            summaryDuration = TimeInterval(totalSeconds - secondsLeft)
            summaryCalories = activeCalories
            showSummary     = true
            Task { await endHealthKitWorkout() }
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchSessionManager: WCSessionDelegate {
    func session(_ session: WCSession,
                 activationDidCompleteWith state: WCSessionActivationState,
                 error: Error?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async { self.apply(message) }
    }

    func session(_ session: WCSession,
                 didReceiveApplicationContext context: [String: Any]) {
        DispatchQueue.main.async { self.apply(context) }
    }
}

// MARK: - HKWorkoutSessionDelegate

extension WatchSessionManager: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession,
                        didChangeTo toState: HKWorkoutSessionState,
                        from fromState: HKWorkoutSessionState,
                        date: Date) {}
    func workoutSession(_ workoutSession: HKWorkoutSession,
                        didFailWithError error: Error) {
        print("HKWorkoutSession error: \(error)")
    }
}

// MARK: - HKLiveWorkoutBuilderDelegate

extension WatchSessionManager: HKLiveWorkoutBuilderDelegate {
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder,
                        didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let qty = type as? HKQuantityType else { continue }
            let stats = workoutBuilder.statistics(for: qty)
            DispatchQueue.main.async {
                switch qty {
                case HKQuantityType.quantityType(forIdentifier: .heartRate):
                    let bpm = HKUnit.count().unitDivided(by: .minute())
                    self.heartRate = stats?.mostRecentQuantity()?.doubleValue(for: bpm) ?? self.heartRate
                case HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned):
                    self.activeCalories = stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? self.activeCalories
                default:
                    break
                }
            }
        }
    }
}
