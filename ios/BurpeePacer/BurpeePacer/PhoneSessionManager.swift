//
//  File.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import Foundation
import WatchConnectivity

struct WorkoutState {
    var phase: String
    var secondsLeft: Int
    var totalSeconds: Int
    var prepareSecondsLeft: Int = 10
    var currentRep: Int = 0
    var totalReps: Int = 0
    var isActive: Bool = false
    var mode: String
    var modeLabel: String
    var hybridPhaseIndex: Int = 0
    var track: String
    var countdownToNextRep: Int = 0   // 4/3/2/1 when approaching next rep, else 0
    var endEpoch: Double = 0          // wall-clock time when the timer hits 0 (0 when not running)

    var asDictionary: [String: Any] {
        [
            "phase":               phase,
            "endEpoch":            endEpoch,
            "secondsLeft":         secondsLeft,
            "totalSeconds":        totalSeconds,
            "prepareSecondsLeft":  prepareSecondsLeft,
            "currentRep":          currentRep,
            "totalReps":           totalReps,
            "isActive":            isActive,
            "mode":                mode,
            "modeLabel":           modeLabel,
            "hybridPhaseIndex":    hybridPhaseIndex,
            "track":               track,
            "countdownToNextRep":  countdownToNextRep,
        ]
    }
}

final class PhoneSessionManager: NSObject {

    static let shared = PhoneSessionManager()
    var onWatchCommand: ((String) -> Void)?
    var onWatchReachable: (() -> Void)?

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    private var lastContextKey = ""

    func push(_ state: WorkoutState) {
        guard WCSession.default.activationState == .activated else { return }
        let payload = state.asDictionary
        let reachable = WCSession.default.isReachable
        if reachable {
            WCSession.default.sendMessage(payload, replyHandler: nil)
        }
        // The application context is the wake-up fallback. Rewriting it every
        // second gets throttled by WatchConnectivity and adds latency, so only
        // refresh it on meaningful state changes — or on every push when the
        // Watch is unreachable and context is the only delivery channel.
        let contextKey = "\(state.phase)|\(state.currentRep)|\(state.hybridPhaseIndex)|\(state.isActive)|\(state.mode)"
        if !reachable || contextKey != lastContextKey {
            lastContextKey = contextKey
            try? WCSession.default.updateApplicationContext(payload)
        }
    }
}

extension PhoneSessionManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }

    func sessionReachabilityDidChange(_ session: WCSession) {
        if session.isReachable {
            DispatchQueue.main.async { self.onWatchReachable?() }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let action = message["action"] as? String else { return }
        DispatchQueue.main.async { self.onWatchCommand?(action) }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any],
                 replyHandler: @escaping ([String: Any]) -> Void) {
        guard let action = message["action"] as? String else { return }
        DispatchQueue.main.async { self.onWatchCommand?(action) }
        replyHandler(["status": "ok"])
    }
}
