package com.burpeepacer.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.burpeepacer.app.model.*
import com.burpeepacer.app.util.WorkoutSoundManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.LocalDateTime
import java.util.*
import kotlin.math.ceil
import kotlin.math.floor

class WorkoutViewModel(
    val level: Level,
    val initialWorkoutMode: WorkoutMode
) : ViewModel() {

    private val soundManager = WorkoutSoundManager()

    private val _workoutMode = MutableStateFlow(initialWorkoutMode)
    val workoutMode = _workoutMode.asStateFlow()

    private val _timeRemaining = MutableStateFlow(20 * 60L) // in seconds
    val timeRemaining = _timeRemaining.asStateFlow()

    private val _isRunning = MutableStateFlow(false)
    val isRunning = _isRunning.asStateFlow()

    private val _isFinished = MutableStateFlow(false)
    val isFinished = _isFinished.asStateFlow()

    private val _currentReps = MutableStateFlow(0)
    val currentReps = _currentReps.asStateFlow()

    private val _countdownRemaining = MutableStateFlow<Int?>(null)
    val countdownRemaining = _countdownRemaining.asStateFlow()

    private val _isNearRepBoundary = MutableStateFlow(false)
    val isNearRepBoundary = _isNearRepBoundary.asStateFlow()

    private var _hasEverStarted = false
    val hasEverStarted: Boolean get() = _hasEverStarted

    private var timerJob: Job? = null
    private var startTime: Long = 0
    private var pausedTimeRemaining: Long = 20 * 60L
    private var hybridTransitioned = false
    private var lastWarningRep = -1

    val isIdle: Boolean get() = !_hasEverStarted && _countdownRemaining.value == null

    val isCompleted: Boolean get() = _currentReps.value >= currentPhaseGoal

    val repPaceGuideText: String?
        get() {
            if (!_isRunning.value) return null
            val goal = currentPhaseGoal
            if (goal <= 0) return null
            val phaseDuration = if (isHybrid) 600f else 20 * 60f
            val intervalSeconds = phaseDuration / goal
            val phaseElapsed = phaseDuration - currentPhaseTimeRemaining
            val nextRepAt = (_currentReps.value + 1) * intervalSeconds
            val secondsToNext = (nextRepAt - phaseElapsed).toInt()
            return if (secondsToNext >= 0) "Next rep in ${secondsToNext}s" else null
        }

    // Hybrid logic
    val isHybrid: Boolean get() = _workoutMode.value == WorkoutMode.HYBRID
    
    val hybridPhaseLabel: String
        get() = if (isHybrid) level.hybridPhaseLabels[hybridPhaseIndex] else "Burpees"

    val hybridPhaseIndex: Int
        get() = if (isHybrid && _timeRemaining.value <= 600) 1 else 0

    val currentPhaseTimeRemaining: Long
        get() = if (isHybrid) {
            if (_timeRemaining.value > 600) _timeRemaining.value - 600 else _timeRemaining.value
        } else {
            _timeRemaining.value
        }

    val currentPhaseGoal: Int
        get() = if (isHybrid) level.hybridPhaseGoal(hybridPhaseIndex) else level.getGoal(_workoutMode.value)

    val progress: Float
        get() {
            val goal = currentPhaseGoal
            return if (goal > 0) (_currentReps.value.toFloat() / goal).coerceIn(0f, 1f) else 0f
        }

    val timeProgress: Float
        get() {
            val total = if (isHybrid) 600f else 20 * 60f
            val elapsed = total - currentPhaseTimeRemaining
            return (elapsed / total).coerceIn(0f, 1f)
        }

    fun startTimer() {
        if (_isRunning.value || _countdownRemaining.value != null || _timeRemaining.value <= 0) return
        
        if (_hasEverStarted) {
            launchTimer()
        } else {
            beginCountdown()
        }
    }

    private fun beginCountdown() {
        _hasEverStarted = true
        viewModelScope.launch {
            for (i in 5 downTo 1) {
                _countdownRemaining.value = i
                soundManager.playCountdownBeep()
                delay(1000)
            }
            _countdownRemaining.value = 0
            soundManager.playStartWhistle()
            delay(600)
            _countdownRemaining.value = null
            launchTimer()
        }
    }

    private fun launchTimer() {
        _isRunning.value = true
        _isFinished.value = false
        startTime = System.currentTimeMillis()
        
        timerJob = viewModelScope.launch {
            while (isActive && _timeRemaining.value > 0) {
                val elapsed = (System.currentTimeMillis() - startTime) / 1000
                _timeRemaining.value = maxOf(0, pausedTimeRemaining - elapsed)
                
                updateAutoRep()
                checkHybridTransition()
                
                if (_timeRemaining.value <= 0) {
                    pauseTimer()
                    _isFinished.value = true
                    soundManager.playFinishWhistle()
                    break
                }
                delay(100)
            }
        }
    }

    private fun updateAutoRep() {
        val goal = currentPhaseGoal
        if (goal > 0 && _isRunning.value) {
            val phaseDuration = if (isHybrid) 600f else 20 * 60f
            val intervalSeconds = phaseDuration / goal
            if (intervalSeconds > 0) {
                val phaseElapsed = phaseDuration - currentPhaseTimeRemaining
                val nextRep = _currentReps.value + 1
                
                // Pacer logic: Warning 4 seconds before
                if (nextRep <= goal) {
                    val nextRepAt = nextRep * intervalSeconds
                    val secondsToNext = nextRepAt - phaseElapsed
                    
                    _isNearRepBoundary.value = secondsToNext <= 4.0
                    
                    if (nextRep != lastWarningRep && secondsToNext <= 4.0) {
                        soundManager.playRepWarning()
                        lastWarningRep = nextRep
                    }
                } else {
                    _isNearRepBoundary.value = false
                }

                if (nextRep <= goal) {
                    val nextRepAt = nextRep * intervalSeconds
                    if (phaseElapsed >= nextRepAt) {
                        _currentReps.value = nextRep
                        soundManager.playRepTrigger()
                    }
                }
            } else {
                _isNearRepBoundary.value = false
            }
        } else {
            _isNearRepBoundary.value = false
        }
    }

    private fun checkHybridTransition() {
        if (isHybrid && !hybridTransitioned && _timeRemaining.value <= 600) {
            hybridTransitioned = true
            _currentReps.value = 0
            lastWarningRep = -1
            soundManager.playPhaseTransition()
        }
    }

    fun pauseTimer() {
        if (!_isRunning.value) return
        _isRunning.value = false
        pausedTimeRemaining = _timeRemaining.value
        timerJob?.cancel()
        timerJob = null
    }

    fun resetTimer() {
        pauseTimer()
        _hasEverStarted = false
        _isFinished.value = false
        _isNearRepBoundary.value = false
        _countdownRemaining.value = null
        hybridTransitioned = false
        _currentReps.value = 0
        lastWarningRep = -1
        _timeRemaining.value = 20 * 60L
        pausedTimeRemaining = 20 * 60L
    }

    fun incrementRep() {
        _currentReps.value++
    }

    fun decrementRep() {
        if (_currentReps.value > 0) _currentReps.value--
    }

    fun createSession(): WorkoutSession {
        return WorkoutSession(
            date = LocalDateTime.now(),
            levelID = level.id,
            workoutMode = _workoutMode.value,
            repsCompleted = _currentReps.value,
            targetReps = currentPhaseGoal,
            completed = _currentReps.value >= currentPhaseGoal
        )
    }

    fun formatTime(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return "%02d:%02d".format(mins, secs)
    }

    override fun onCleared() {
        super.onCleared()
        soundManager.release()
    }
}
