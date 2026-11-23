package com.burpeepacer.app.model

import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

/**
 * Pure scheduling rules shared by the dashboard, calendar and streak. Mirrors iOS `AppViewModel`
 * (`workoutStreak`, `dayState`, `nextScheduledLabel`, `workoutLabel`) and web `workoutStreak.ts`.
 * Weekdays use the web/iOS numbering: Sunday = 1 … Saturday = 7.
 */
object Schedule {

    /** Workout name for a weekday. Mirrors web `getWorkoutLabelForWeekday`. */
    fun workoutLabel(track: ProgramTrack, weekday: Int): String {
        if (track != ProgramTrack.ADVANCED) return "Beginner Burpees"
        return when (weekday) {
            2 -> "Navy Seals"
            4 -> "5-Count Pushups"
            6 -> "Hybrid"
            else -> "Workout"
        }
    }

    /** Next scheduled session after [today], e.g. "Wednesday · 5-Count Pushups"; null if no days are chosen. */
    fun nextScheduledLabel(
        track: ProgramTrack,
        workoutDays: Set<Int>,
        today: LocalDate,
        locale: Locale = Locale.getDefault()
    ): String? {
        for (offset in 1..7) {
            val date = today.plusDays(offset.toLong())
            if (date.workoutWeekday() in workoutDays) {
                val name = date.dayOfWeek.getDisplayName(TextStyle.FULL, locale)
                return "$name · ${workoutLabel(track, date.workoutWeekday())}"
            }
        }
        return null
    }

    /**
     * Consecutive scheduled workout days completed, counting back from [today].
     * Rest days are skipped; today does not break the streak until it has passed.
     */
    fun workoutStreak(logs: List<WorkoutLog>, workoutDays: Set<Int>, today: LocalDate): Int {
        val completed = logs.filter { it.completed }.map { it.date.take(10) }.toSet()
        val limit = today.minusMonths(12)
        var cursor = today
        var streak = 0
        while (!cursor.isBefore(limit)) {
            if (cursor.workoutWeekday() in workoutDays) {
                if (cursor.toString() in completed) {
                    streak += 1
                } else if (cursor != today) {
                    break
                }
            }
            cursor = cursor.minusDays(1)
        }
        return streak
    }

    fun dayState(date: LocalDate, sessions: List<WorkoutSession>, workoutDays: Set<Int>, today: LocalDate): DayState {
        if (date.workoutWeekday() !in workoutDays) return DayState.Rest
        if (date.isAfter(today)) return DayState.Scheduled
        val onDate = sessions.filter { it.date.toLocalDate() == date }
        onDate.firstOrNull()?.let { return DayState.Completed(it.repsCompleted, it.levelID, it.workoutMode) }
        if (date.isBefore(today)) return DayState.Missed
        return DayState.Scheduled
    }

    /** Full month grid, Sunday-first, from the Sunday on/before the 1st to the Saturday on/after the last day. */
    fun calendarGrid(month: LocalDate): List<LocalDate> {
        val first = month.withDayOfMonth(1)
        val last = month.withDayOfMonth(month.lengthOfMonth())
        val start = first.minusDays((first.dayOfWeek.value % 7).toLong())
        val end = last.plusDays(((6 - last.dayOfWeek.value % 7)).toLong())
        return generateSequence(start) { it.plusDays(1) }.takeWhile { !it.isAfter(end) }.toList()
    }

    /** Completed sessions at the current level; the web counts these toward "X of N sessions completed". */
    fun qualifyingSessions(sessions: List<WorkoutSession>, levelId: String): Int =
        sessions.count { it.levelID == levelId }
}
