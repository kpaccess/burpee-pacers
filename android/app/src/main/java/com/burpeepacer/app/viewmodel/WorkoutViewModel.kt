package com.burpeepacer.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.burpeepacer.app.model.Level
import com.burpeepacer.app.model.WorkoutMode
import com.burpeepacer.app.model.WorkoutSession
import com.burpeepacer.app.util.WorkoutPace
import com.burpeepacer.app.util.WorkoutSoundManager
import com.burpeepacer.app.util.WorkoutSounds
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import kotlin.math.min

/**
 * Live workout timer. Behaviour follows the web timer and iOS `SessionTimerViewModel`:
 * 10 s prepare countdown, 20 min session (Hybrid: 10 + 15 s rest + 10), auto-counted reps at target
 * pace with manual +/- adjustment, and warning beeps at 4-3-2-1 seconds before each rep.
 */
class WorkoutViewModel(
    val level: Level,
    initialWorkoutMode: WorkoutMode,
    private val sounds: WorkoutSounds = WorkoutSoundManager(),
    private val nowMillis: () -> Long = { System.nanoTime() / 1_000_000 }
) : ViewModel() {

    private val _workoutMode = MutableStateFlow(initialWorkoutMode)
    val workoutMode: StateFlow<WorkoutMode> = _workoutMode.asStateFlow()

    private val _timeRemaining = MutableStateFlow(WorkoutPace.totalSeconds(initialWorkoutMode).toLong())
    /** Seconds left in the whole session. */
    val timeRemaining: StateFlow<Long> = _timeRemaining.asStateFlow()

    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

    private val _isFinished = MutableStateFlow(false)
    val isFinished: StateFlow<Boolean> = _isFinished.asStateFlow()

    private val _currentReps = MutableStateFlow(0)
    val currentReps: StateFlow<Int> = _currentReps.asStateFlow()

    private val _countdownRemaining = MutableStateFlow<Int?>(null)
    val countdownRemaining: StateFlow<Int?> = _countdownRemaining.asStateFlow()

    private val _isNearRepBoundary = MutableStateFlow(false)
    val isNearRepBoundary: StateFlow<Boolean> = _isNearRepBoundary.asStateFlow()

    private val _position = MutableStateFlow(WorkoutPace.position(0.0, initialWorkoutMode))
    /** Phase / rest position derived from elapsed time; drives the Hybrid UI. */
    val position: StateFlow<WorkoutPace.Position> = _position.asStateFlow()

    private var _hasEverStarted = false
    val hasEverStarted: Boolean get() = _hasEverStarted

    private var timerJob: Job? = null
    private var countdownJob: Job? = null
    private var runStartedAtMs = 0L
    private var elapsedBeforeRunSeconds = 0.0
    private var lastPhaseIndex = 0
    private var wasResting = false
    private var lastWarnedSecond = -1

    val mode: WorkoutMode get() = _workoutMode.value
    val isHybrid: Boolean get() = mode == WorkoutMode.HYBRID
    val totalSeconds: Int get() = WorkoutPace.totalSeconds(mode)

    val isIdle: Boolean get() = !_hasEverStarted && _countdownRemaining.value == null

    val hybridPhaseIndex: Int get() = _position.value.phaseIndex
    val isResting: Boolean get() = _position.value.isResting
    val restSecondsLeft: Int get() = _position.value.restSecondsLeft

    /** Label for the phase that is active (or, while resting, the one coming next). */
    val hybridPhaseLabel: String
        get() = if (isHybrid) level.hybridPhaseLabels[if (isResting) 1 else hybridPhaseIndex] else "Burpees"

    /** Seconds left in the current phase (the whole session for non-hybrid modes). */
    val currentPhaseTimeRemaining: Long get() = _position.value.phaseSecondsLeft.toLong()

    val currentPhaseGoal: Int
        get() = if (isHybrid) level.hybridPhaseGoal(hybridPhaseIndex) else level.getGoal(mode)

    val isCompleted: Boolean get() = _currentReps.value >= currentPhaseGoal

    /** Rep-based progress 0→1 (drives the rep ring). */
    val progress: Float
        get() {
            val goal = currentPhaseGoal
            return if (goal > 0) (_currentReps.value.toFloat() / goal).coerceIn(0f, 1f) else 0f
        }

    /** Time-based progress 0→1 within the current phase (drives the timer ring). */
    val timeProgress: Float
        get() {
            val pos = _position.value
            return (pos.phaseElapsedSeconds / pos.phaseDurationSeconds).toFloat().coerceIn(0f, 1f)
        }

    /** The rep you are currently on (1-based while running), so the display opens at 1 rather than 0. */
    val currentDisplayRep: Int
        get() = if (_isRunning.value || _countdownRemaining.value != null) {
            min(_currentReps.value + 1, currentPhaseGoal)
        } else {
            _currentReps.value
        }

    private val secondsToNextRep: Int?
        get() {
            if (isResting) return null
            val pos = _position.value
            return WorkoutPace.secondsToNextRep(
                _currentReps.value, pos.phaseElapsedSeconds, pos.phaseDurationSeconds, currentPhaseGoal
            )
        }

    val repPaceGuideText: String?
        get() {
            if (!_isRunning.value) return null
            val pos = _position.value
            if (pos.isResting) return "Rest — ${level.hybridPhaseLabels[1]} in ${pos.restSecondsLeft}s"
            return WorkoutPace.paceGuideText(
                _currentReps.value, pos.phaseElapsedSeconds, pos.phaseDurationSeconds, currentPhaseGoal
            )
        }

    /** Changes the workout type. Only allowed before the workout starts; resets the timer (as on iOS). */
    fun setMode(newMode: WorkoutMode) {
        if (!isIdle || newMode == mode || newMode !in level.availableModes) return
        _workoutMode.value = newMode
        resetTimer()
    }

    fun startTimer() {
        if (_isRunning.value || _countdownRemaining.value != null || _timeRemaining.value <= 0) return
        if (_hasEverStarted) launchTimer() else beginCountdown()
    }

    private fun beginCountdown() {
        _hasEverStarted = true
        countdownJob = viewModelScope.launch {
            for (i in WorkoutPace.PREPARE_SECONDS downTo 1) {
                _countdownRemaining.value = i
                sounds.playCountdownBeep()
                delay(1000)
            }
            _countdownRemaining.value = 0
            sounds.playStartWhistle()
            delay(600)
            _countdownRemaining.value = null
            launchTimer()
        }
    }

    private fun launchTimer() {
        _isRunning.value = true
        _isFinished.value = false
        runStartedAtMs = nowMillis()
        lastWarnedSecond = -1

        timerJob = viewModelScope.launch {
            while (isActive) {
                val elapsed = elapsedBeforeRunSeconds + (nowMillis() - runStartedAtMs) / 1000.0
                onTick(elapsed)
                if (elapsed >= totalSeconds) break
                delay(100)
            }
        }
    }

    /** Advances the timer to [elapsedSeconds]; one call per 100 ms tick. Visible for testing. */
    internal fun onTick(elapsedSeconds: Double) {
        val total = totalSeconds
        val clamped = min(elapsedSeconds, total.toDouble())
        val pos = WorkoutPace.position(clamped, mode)
        _position.value = pos
        _timeRemaining.value = (total - kotlin.math.floor(clamped).toLong()).coerceAtLeast(0)

        handlePhaseChanges(pos)

        autoCountRep(pos)
        if (!pos.isResting) {
            updateWarning()
        } else {
            _isNearRepBoundary.value = false
        }

        if (elapsedSeconds >= total) finish()
    }

    private fun handlePhaseChanges(pos: WorkoutPace.Position) {
        if (!isHybrid) return
        if (pos.isResting && !wasResting) {
            // Phase 1 is over: rest cue, and show the full first-phase count while resting.
            wasResting = true
            sounds.playRestStart()
        }
        if (!pos.isResting && pos.phaseIndex == 1 && lastPhaseIndex == 0) {
            // Rest is over: phase 2 starts from zero.
            _currentReps.value = 0
            lastWarnedSecond = -1
            sounds.playPhaseTransition()
        }
        lastPhaseIndex = pos.phaseIndex
    }

    /**
     * Brings the rep counter up to target pace. Like the web timer, the pace is derived from elapsed time,
     * so reps missed while the app was in the background are caught up on the next tick. Taps that put the
     * user ahead of pace are kept. While resting between Hybrid phases the first phase shows its full goal.
     */
    private fun autoCountRep(pos: WorkoutPace.Position) {
        val goal = currentPhaseGoal
        val expected = if (pos.isResting) goal
        else WorkoutPace.expectedReps(pos.phaseElapsedSeconds, pos.phaseDurationSeconds, goal)
        if (expected > _currentReps.value) {
            _currentReps.value = expected
            if (!pos.isResting) sounds.playRepTrigger()
        }
    }

    /** Beeps once per second at 4-3-2-1 before each rep boundary (same as iOS). */
    private fun updateWarning() {
        val secs = secondsToNextRep
        _isNearRepBoundary.value = secs != null && secs <= 4
        if (secs != null && secs in 1..4 && secs != lastWarnedSecond) {
            lastWarnedSecond = secs
            sounds.playRepWarning()
        }
    }

    private fun finish() {
        pauseTimer()
        _timeRemaining.value = 0
        _isNearRepBoundary.value = false
        _isFinished.value = true
        sounds.playFinishWhistle()
    }

    fun pauseTimer() {
        if (!_isRunning.value) return
        elapsedBeforeRunSeconds += (nowMillis() - runStartedAtMs) / 1000.0
        _isRunning.value = false
        timerJob?.cancel()
        timerJob = null
        lastWarnedSecond = -1
    }

    fun resetTimer() {
        timerJob?.cancel()
        timerJob = null
        countdownJob?.cancel()
        countdownJob = null
        _isRunning.value = false
        _hasEverStarted = false
        _isFinished.value = false
        _isNearRepBoundary.value = false
        _countdownRemaining.value = null
        _currentReps.value = 0
        elapsedBeforeRunSeconds = 0.0
        lastPhaseIndex = 0
        wasResting = false
        lastWarnedSecond = -1
        _timeRemaining.value = totalSeconds.toLong()
        _position.value = WorkoutPace.position(0.0, mode)
    }

    fun incrementRep() {
        _currentReps.value++
    }

    fun decrementRep() {
        if (_currentReps.value > 0) _currentReps.value--
    }

    /** Hybrid sessions log the final phase's count and goal, as iOS does. */
    fun createSession(): WorkoutSession {
        return WorkoutSession(
            date = LocalDateTime.now(),
            levelID = level.id,
            workoutMode = mode,
            repsCompleted = _currentReps.value,
            targetReps = currentPhaseGoal,
            completed = _currentReps.value >= currentPhaseGoal
        )
    }

    fun formatTime(seconds: Long): String = WorkoutPace.formatTime(seconds)

    override fun onCleared() {
        super.onCleared()
        sounds.release()
    }
}
