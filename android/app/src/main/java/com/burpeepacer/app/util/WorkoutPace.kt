package com.burpeepacer.app.util

import com.burpeepacer.app.model.ProgramCatalog
import com.burpeepacer.app.model.WorkoutMode
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * Pure timer/pacing maths, kept free of Android and coroutines so it can be unit tested.
 *
 * Matches the web timer (`accurateWorkoutTimer.ts`) and iOS `SessionTimerViewModel`:
 *  - a session is 20 minutes; Hybrid is two 10-minute phases with a 15 s rest between them
 *    (web adds the rest, so a Hybrid session is 20:15 in total);
 *  - the rep interval is `phaseDuration / phaseGoal`.
 */
object WorkoutPace {
    const val PREPARE_SECONDS = 10
    const val SESSION_SECONDS = 20 * 60
    private const val REP_EPSILON = 1e-9

    val hybridPhaseSeconds: Int get() = ProgramCatalog.hybridPhaseDurationMinutes * 60
    val hybridRestSeconds: Int get() = ProgramCatalog.HYBRID_PHASE_REST_SECONDS

    fun totalSeconds(mode: WorkoutMode): Int =
        if (mode == WorkoutMode.HYBRID) SESSION_SECONDS + hybridRestSeconds else SESSION_SECONDS

    /** Where the timer is, given [elapsedSeconds] of workout time (prepare countdown excluded). */
    data class Position(
        /** 0 for the first phase (and for non-hybrid modes), 1 for the second Hybrid phase. */
        val phaseIndex: Int,
        /** True during the inter-phase rest (Hybrid only). */
        val isResting: Boolean,
        val restSecondsLeft: Int,
        val phaseDurationSeconds: Int,
        /** Seconds elapsed inside the active phase (the full phase length while resting). */
        val phaseElapsedSeconds: Double
    ) {
        val phaseSecondsLeft: Int
            get() = max(0, phaseDurationSeconds - floor(phaseElapsedSeconds).toInt())
    }

    fun position(elapsedSeconds: Double, mode: WorkoutMode): Position {
        val elapsed = max(0.0, elapsedSeconds)
        if (mode != WorkoutMode.HYBRID) {
            return Position(0, false, 0, SESSION_SECONDS, min(elapsed, SESSION_SECONDS.toDouble()))
        }
        val phase = hybridPhaseSeconds
        val restEnd = phase + hybridRestSeconds
        return when {
            elapsed < phase -> Position(0, false, 0, phase, elapsed)
            elapsed < restEnd -> Position(
                0, true, max(0, ceil(restEnd - elapsed).toInt()), phase, phase.toDouble()
            )
            else -> Position(1, false, 0, phase, min(elapsed - restEnd, phase.toDouble()))
        }
    }

    /** Seconds between reps at the target pace, or 0 when the goal is 0. */
    fun repIntervalSeconds(phaseDurationSeconds: Int, goal: Int): Double =
        if (goal > 0) phaseDurationSeconds.toDouble() / goal else 0.0

    /** Reps that should be done by now at target pace. */
    fun expectedReps(phaseElapsedSeconds: Double, phaseDurationSeconds: Int, goal: Int): Int {
        val interval = repIntervalSeconds(phaseDurationSeconds, goal)
        if (interval <= 0) return 0
        return min(goal, floor(phaseElapsedSeconds / interval + REP_EPSILON).toInt())
    }

    /** Seconds until the next rep boundary for someone on [currentReps]; null once the final rep is reached. */
    fun secondsToNextRep(
        currentReps: Int,
        phaseElapsedSeconds: Double,
        phaseDurationSeconds: Int,
        goal: Int
    ): Int? {
        val interval = repIntervalSeconds(phaseDurationSeconds, goal)
        if (interval <= 0) return null
        val nextRep = currentReps + 1
        if (nextRep > goal) return null
        val remaining = nextRep * interval - phaseElapsedSeconds
        return if (remaining > 0) ceil(remaining).toInt() else 0
    }

    /** "Ahead by N reps", "REP NOW!" or "Next rep in Ns" — same wording as iOS. */
    fun paceGuideText(
        currentReps: Int,
        phaseElapsedSeconds: Double,
        phaseDurationSeconds: Int,
        goal: Int
    ): String? {
        if (goal <= 0) return null
        val expected = expectedReps(phaseElapsedSeconds, phaseDurationSeconds, goal)
        if (currentReps > expected) {
            val ahead = currentReps - expected
            return if (ahead == 1) "Ahead by 1 rep" else "Ahead by $ahead reps"
        }
        val secs = secondsToNextRep(currentReps, phaseElapsedSeconds, phaseDurationSeconds, goal) ?: return null
        return if (secs == 0) "REP NOW!" else "Next rep in ${secs}s"
    }

    fun formatTime(seconds: Long): String = "%02d:%02d".format(seconds / 60, seconds % 60)
}
