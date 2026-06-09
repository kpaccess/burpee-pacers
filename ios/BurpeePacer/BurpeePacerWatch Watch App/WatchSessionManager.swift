//
//  WatchSessionManager.swift
//  BurpeePacerWatch Watch App
//

import Foundation
import WatchConnectivity
import HealthKit
import WatchKit

@Observable
final class WatchSessionManager: NSObject {

    static let shared = WatchSessionManager()

    // MARK: - Workout Display State (mirrored from iPhone)

    var phase: String = "idle"          // "idle" | "prepare" | "active" | "paused" | "finished"
    var secondsLeft: Int = 1200
    var totalSeconds: Int = 1200
    var prepareSecondsLeft: Int = 10
    var currentRep: Int = 0
    var totalReps: Int = 0
    var isActive: Bool = false
    var modeLabel: String = ""
    var hybridPhaseIndex: Int = 0

    private var lastCountdownToNextRep: Int = 0
    private var localTimer: Timer?

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
        lastCountdownToNextRep = 0
        stopLocalTimer()
    }

    private func startLocalTimer() {
        localTimer?.invalidate()
        localTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self, self.phase == "active", self.secondsLeft > 0 else { return }
            self.secondsLeft -= 1
        }
    }

    private func stopLocalTimer() {
        localTimer?.invalidate()
        localTimer = nil
    }

    // MARK: - Authorization

    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let share: Set<HKSampleType> = [HKQuantityType.workoutType()]
        let read: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
        ]
        try? await healthStore.requestAuthorization(toShare: share, read: read)
    }

    // MARK: - HealthKit Session Lifecycle

    func startHealthKitWorkout() async {
        guard workoutSession == nil else { return }
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

            let startDate = Date()
            session.startActivity(with: startDate)
            try await builder.beginCollection(at: startDate)
        } catch {
            print("WatchSessionManager: HK start failed: \(error)")
        }
    }

    private func endHealthKitWorkout() async {
        guard let session = workoutSession, let builder = workoutBuilder else { return }
        workoutSession = nil
        workoutBuilder = nil
        session.end()
        do {
            try await builder.endCollection(at: Date())
            _ = try await builder.finishWorkout()
        } catch {
            print("WatchSessionManager: HK end failed: \(error)")
        }
    }

    // MARK: - Apply UI State from iPhone (WatchConnectivity)

    private func apply(_ dict: [String: Any]) {
        let newPhase    = dict["phase"]    as? String ?? "idle"
        let newIsActive = dict["isActive"] as? Bool   ?? false
        let wasActive   = isActive

        phase              = newPhase
        secondsLeft        = dict["secondsLeft"]        as? Int    ?? 1200
        totalSeconds       = dict["totalSeconds"]       as? Int    ?? 1200
        prepareSecondsLeft = dict["prepareSecondsLeft"] as? Int    ?? 10
        currentRep         = dict["currentRep"]         as? Int    ?? 0
        totalReps          = dict["totalReps"]          as? Int    ?? 0
        isActive           = newIsActive
        modeLabel          = dict["modeLabel"]          as? String ?? ""
        hybridPhaseIndex   = dict["hybridPhaseIndex"]   as? Int    ?? 0

        let newCountdown = dict["countdownToNextRep"] as? Int ?? 0
        if newCountdown > 0 && newCountdown != lastCountdownToNextRep {
            WKInterfaceDevice.current().play(.notification)
            WatchSoundManager.shared.playCountdownBeep()
        }
        lastCountdownToNextRep = newCountdown

        switch newPhase {
        case "active":
            if !wasActive {
                WKInterfaceDevice.current().play(.start)
                startLocalTimer()
                if workoutSession == nil {
                    Task { await startHealthKitWorkout() }
                } else if workoutSession?.state == .paused {
                    workoutSession?.resume()
                }
            }
        case "paused":
            stopLocalTimer()
            if wasActive { workoutSession?.pause() }
        case "finished":
            stopLocalTimer()
            summaryReps     = currentRep
            summaryDuration = TimeInterval(totalSeconds - secondsLeft)
            summaryCalories = activeCalories
            showSummary     = true
            if workoutSession != nil {
                Task { await endHealthKitWorkout() }
            }
        case "idle":
            stopLocalTimer()
            if workoutSession != nil {
                Task { await endHealthKitWorkout() }
            }
        default:
            break
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchSessionManager: WCSessionDelegate {
    func session(_ session: WCSession,
                 activationDidCompleteWith state: WCSessionActivationState,
                 error: Error?) {
        guard state == .activated else { return }
        // Apply any context the iPhone pushed while the Watch app was closed.
        let ctx = WCSession.default.receivedApplicationContext
        if !ctx.isEmpty {
            DispatchQueue.main.async { self.apply(ctx) }
        }
    }

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
        print("WatchSessionManager: HKWorkoutSession error: \(error)")
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
