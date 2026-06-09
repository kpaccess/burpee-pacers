//
//  SessionTimerViewModel.swift
//  BurpeePacer
//

import Foundation
import Combine
import SwiftUI

@Observable
class SessionTimerViewModel: Identifiable {
    let id = UUID()

    // MARK: - Configuration

    var level: Level
    var workoutMode: WorkoutMode {
        didSet {
            guard workoutMode != oldValue else { return }
            resetTimer()
        }
    }

    // MARK: - Timer State

    var timeRemaining: TimeInterval = 20 * 60
    var isRunning = false
    var currentReps = 0
    var countdownRemaining: Int? = nil
    private(set) var hasEverStarted = false

    // MARK: - Private

    private var timerCancellable: AnyCancellable?
    private var startTime: Date?
    private var pausedTime: TimeInterval = 20 * 60
    private var hybridTransitioned = false
    private var lastWarnedSecond: Int = -1
    private var lastPushedSecond: Int = -1

    // MARK: - Init

    init(level: Level, workoutMode: WorkoutMode) {
        self.level = level
        self.workoutMode = workoutMode
        setupWatchCommands()
    }

    private func setupWatchCommands() {
        PhoneSessionManager.shared.onWatchCommand = { [weak self] action in
            guard let self else { return }
            switch action {
            case "start":        self.startTimer()
            case "pause":        self.pauseTimer()
            case "reset":        self.resetTimer()
            case "incrementRep": self.incrementRep(fromWatch: true)
            case "decrementRep": self.decrementRep()
            default: break
            }
        }
        // When Watch connects, push state immediately and try to bring Watch app
        // to foreground (covers the case where Watch app was backgrounded).
        PhoneSessionManager.shared.onWatchReachable = { [weak self] in
            self?.pushWatchState()
            HealthManager.shared.startWatchApp()
        }
    }

    // MARK: - Watch State Push

    private var watchPhase: String {
        if isCountingDown        { return "prepare" }
        if isRunning             { return "active" }
        if timeRemaining <= 0    { return "finished" }
        if hasEverStarted        { return "paused" }
        return "idle"
    }

    private var watchModeLabel: String {
        switch workoutMode {
        case .navySeals: return "Navy Seals"
        case .fiveCount: return level.track == .beginner ? "Burpees" : "5-Count Pushups"
        case .hybrid:    return hybridPhaseIndex == 0 ? "Navy Seals" : "5-Count Pushups"
        }
    }

    func pushWatchState() {
        let countdown = secondsToNextRep.flatMap { (1...4).contains($0) ? $0 : nil } ?? 0
        let state = WorkoutState(
            phase: watchPhase,
            secondsLeft: Int(timeRemaining),
            totalSeconds: 20 * 60,
            prepareSecondsLeft: countdownRemaining ?? 0,
            currentRep: currentDisplayRep,
            totalReps: currentPhaseGoal,
            isActive: isRunning,
            mode: workoutMode.rawValue,
            modeLabel: watchModeLabel,
            hybridPhaseIndex: hybridPhaseIndex,
            track: level.track.rawValue,
            countdownToNextRep: countdown
        )
        PhoneSessionManager.shared.push(state)
    }

    // MARK: - Hybrid Computed Properties

    var isHybrid: Bool { workoutMode == .hybrid }

    /// 0 = first 10 min (Navy Seals), 1 = last 10 min (5-Count Pushups)
    var hybridPhaseIndex: Int {
        isHybrid && timeRemaining <= 600 ? 1 : 0
    }

    var hybridPhaseLabel: String {
        level.hybridPhaseLabels[hybridPhaseIndex]
    }

    /// Time remaining within the current hybrid phase (counts 600→0 per phase)
    var currentPhaseTimeRemaining: TimeInterval {
        guard isHybrid else { return timeRemaining }
        return timeRemaining > 600 ? timeRemaining - 600 : timeRemaining
    }

    var currentPhaseGoal: Int {
        guard isHybrid else { return level.goal(for: workoutMode) }
        return level.hybridPhaseGoal(phase: hybridPhaseIndex)
    }

    // MARK: - Computed Properties

    var formattedTime: String {
        formatted(currentPhaseTimeRemaining)
    }

    var formattedTotalRemaining: String {
        formatted(timeRemaining)
    }

    /// Rep-based progress 0→1 (drives the rep ring).
    var progress: Double {
        let goal = currentPhaseGoal
        guard goal > 0 else { return 0 }
        return min(1.0, Double(currentReps) / Double(goal))
    }

    /// Time-based progress 0→1 within the current phase (drives the timer ring).
    var timeProgress: Double {
        let total: TimeInterval = isHybrid ? 600 : 20 * 60
        let elapsed = total - currentPhaseTimeRemaining
        return min(1.0, max(0, elapsed / total))
    }

    /// Seconds until the next rep boundary at the target pace.
    /// Returns nil when not running, goal is 0, or final rep already done.
    var secondsToNextRep: Int? {
        let goal = currentPhaseGoal
        guard goal > 0, isRunning else { return nil }

        let phaseDuration: TimeInterval = isHybrid ? 600 : 20 * 60
        let intervalSeconds = phaseDuration / Double(goal)
        guard intervalSeconds > 0 else { return nil }

        let phaseElapsed = phaseDuration - currentPhaseTimeRemaining
        let nextRep = currentReps + 1
        guard nextRep <= goal else { return nil }

        let nextRepAt = Double(nextRep) * intervalSeconds
        let remaining = nextRepAt - phaseElapsed
        return remaining > 0 ? Int(ceil(remaining)) : 0
    }

    var repPaceGuideText: String? {
        let goal = currentPhaseGoal
        guard goal > 0, isRunning else { return nil }

        let phaseDuration: TimeInterval = isHybrid ? 600 : 20 * 60
        let intervalSeconds = phaseDuration / Double(goal)
        guard intervalSeconds > 0 else { return nil }

        let phaseElapsed = phaseDuration - currentPhaseTimeRemaining
        let expectedCompleted = min(goal, Int(floor(phaseElapsed / intervalSeconds)))
        if currentReps > expectedCompleted {
            let aheadBy = currentReps - expectedCompleted
            return aheadBy == 1 ? "Ahead by 1 rep" : "Ahead by \(aheadBy) reps"
        }

        guard let secs = secondsToNextRep else { return nil }
        return secs == 0 ? "REP NOW!" : "Next rep in \(secs)s"
    }

    /// True when the next rep boundary is 4 seconds or fewer away.
    var isNearRepBoundary: Bool {
        guard let secs = secondsToNextRep else { return false }
        return secs <= 4
    }

    var progressText: String { "\(currentReps) / \(currentPhaseGoal)" }

    /// Shows the rep you're currently on (1-based) while running, so the display
    /// opens at "1" instead of "0". When idle or finished, shows completed count.
    var currentDisplayRep: Int {
        guard isRunning || isCountingDown else { return currentReps }
        return min(currentReps + 1, currentPhaseGoal)
    }

    var canStart: Bool { !isRunning && !isCountingDown && timeRemaining > 0 }

    var isCountingDown: Bool { countdownRemaining != nil }

    var isCompleted: Bool { currentReps >= currentPhaseGoal }

    var isFinished: Bool { timeRemaining <= 0 && !isRunning }

    /// True only before the timer has ever been started (or after a reset).
    var isIdle: Bool { !hasEverStarted && !isCountingDown }

    // MARK: - Timer Controls

    func startTimer() {
        guard canStart else { return }
        if hasEverStarted {
            launchTimer()
        } else {
            beginCountdown()
        }
    }

    func pauseTimer() {
        guard isRunning else { return }
        isRunning = false
        pausedTime = timeRemaining
        if isHybrid && timeRemaining <= 600 { hybridTransitioned = true }
        timerCancellable?.cancel()
        timerCancellable = nil
        startTime = nil
        lastWarnedSecond = -1
        HealthManager.shared.pauseWorkout()
        pushWatchState()
    }

    func resetTimer() {
        isRunning = false
        countdownRemaining = nil
        hybridTransitioned = false
        hasEverStarted = false
        currentReps = 0
        timeRemaining = 20 * 60
        pausedTime = 20 * 60
        timerCancellable?.cancel()
        timerCancellable = nil
        startTime = nil
        lastWarnedSecond = -1
        lastPushedSecond = -1
        Task { await HealthManager.shared.endWorkout() }
        pushWatchState()
    }

    func incrementRep(fromWatch: Bool = false) {
        currentReps += 1
        pushWatchState()
    }

    func decrementRep() {
        if currentReps > 0 { currentReps -= 1 }
        pushWatchState()
    }

    // MARK: - Session Result

    func createSession() -> WorkoutSession {
        WorkoutSession(
            date: Date(),
            levelID: level.id,
            workoutMode: workoutMode,
            repsCompleted: currentReps,
            targetReps: currentPhaseGoal,
            completed: currentReps >= currentPhaseGoal
        )
    }

    // MARK: - Countdown

    private func beginCountdown() {
        hasEverStarted = true
        countdownRemaining = 5
        tickCountdown()
        Task {
            await HealthManager.shared.requestAuthorization()
            HealthManager.shared.startWatchApp()
        }
    }

    private func tickCountdown() {
        guard let remaining = countdownRemaining else { return }
        if remaining > 0 {
            WorkoutSoundManager.shared.playPrepCountdown()
            pushWatchState()
        } else {
            WorkoutSoundManager.shared.playWorkStart()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                self?.countdownRemaining = nil
                self?.launchTimer()
            }
            return
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self, self.isCountingDown else { return }
            self.countdownRemaining = (self.countdownRemaining ?? 1) - 1
            self.tickCountdown()
        }
    }

    func launchTimer() {
        isRunning = true
        startTime = Date()
        lastWarnedSecond = -1
        if HealthManager.shared.session == nil {
            Task { await HealthManager.shared.startWorkout() }
        } else {
            HealthManager.shared.resumeWorkout()
        }
        pushWatchState()

        timerCancellable = Timer.publish(every: 0.1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in self?.updateTimer() }
    }

    // MARK: - Tick

    private func updateTimer() {
        guard let startTime else { return }
        let elapsed = Date().timeIntervalSince(startTime)
        timeRemaining = max(0, pausedTime - elapsed)

        // Auto-increment rep counter when a pace interval finishes
        let goal = currentPhaseGoal
        if goal > 0 && isRunning {
            let phaseDuration: TimeInterval = isHybrid ? 600 : 20 * 60
            let intervalSeconds = phaseDuration / Double(goal)
            if intervalSeconds > 0 {
                let phaseElapsed = phaseDuration - currentPhaseTimeRemaining
                let nextRep = currentReps + 1
                if nextRep <= goal {
                    let nextRepAt = Double(nextRep) * intervalSeconds
                    if phaseElapsed >= nextRepAt {
                        currentReps += 1
                        WorkoutSoundManager.shared.playWorkStart()
                    }
                }
            }
        }

        // Hybrid phase 0→1 crossover
        if isHybrid && !hybridTransitioned && timeRemaining <= 600 {
            hybridTransitioned = true
            currentReps = 0
            lastWarnedSecond = -1
            WorkoutSoundManager.shared.playWorkStart()
        }

        // Rep-boundary warning beeps: play once per second at 4-3-2-1
        if let secs = secondsToNextRep, (1...4).contains(secs), secs != lastWarnedSecond {
            lastWarnedSecond = secs
            WorkoutSoundManager.shared.playHalfway()
        }

        if timeRemaining <= 0 {
            pauseTimer()
            timeRemaining = 0
            WorkoutSoundManager.shared.playRestStart()
            Task { await HealthManager.shared.endWorkout() }
            pushWatchState()
            return
        }

        // Push to Watch once per second to avoid flooding WatchConnectivity
        let currentSecond = Int(timeRemaining)
        if currentSecond != lastPushedSecond {
            lastPushedSecond = currentSecond
            pushWatchState()
        }
    }

    // MARK: - Helper

    private func formatted(_ t: TimeInterval) -> String {
        let s = max(0, Int(t))
        return String(format: "%02d:%02d", s / 60, s % 60)
    }
}
