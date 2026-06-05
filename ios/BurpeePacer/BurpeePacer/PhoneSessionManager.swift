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

    var asDictionary: [String: Any] {
        [
            "phase":              phase,
            "secondsLeft":        secondsLeft,
            "totalSeconds":       totalSeconds,
            "prepareSecondsLeft": prepareSecondsLeft,
            "currentRep":         currentRep,
            "totalReps":          totalReps,
            "isActive":           isActive,
            "mode":               mode,
            "modeLabel":          modeLabel,
            "hybridPhaseIndex":   hybridPhaseIndex,
            "track":              track,
        ]
    }
}

final class PhoneSessionManager: NSObject {

    static let shared = PhoneSessionManager()
    var onWatchCommand: ((String) -> Void)?

    private override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func push(_ state: WorkoutState) {
        guard WCSession.default.activationState == .activated else { return }
        let payload = state.asDictionary
        try? WCSession.default.updateApplicationContext(payload)
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(payload, replyHandler: nil)
        }
    }
}

extension PhoneSessionManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }

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
