package com.burpeepacer.app.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.Locale

class ScheduleTest {
    private val mwf = setOf(2, 4, 6)
    // 2026-11-20 is a Friday.
    private val friday = LocalDate.of(2026, 11, 20)

    private fun log(date: LocalDate, completed: Boolean = true) =
        WorkoutLog(date.toString(), completed, "1(N)", "with_pushups", 20)

    @Test fun weekdayNumberingMatchesWebAndIos() {
        assertEquals(6, friday.workoutWeekday())
        assertEquals(1, LocalDate.of(2026, 11, 22).workoutWeekday()) // Sunday
        assertEquals(2, LocalDate.of(2026, 11, 16).workoutWeekday()) // Monday
        assertEquals(7, LocalDate.of(2026, 11, 21).workoutWeekday()) // Saturday
    }

    @Test fun streakCountsScheduledDaysAndSkipsRestDays() {
        val logs = listOf(log(friday), log(friday.minusDays(2)), log(friday.minusDays(4)))
        assertEquals(3, Schedule.workoutStreak(logs, mwf, friday))
    }

    @Test fun todayDoesNotBreakStreakUntilItHasPassed() {
        val logs = listOf(log(friday.minusDays(2)), log(friday.minusDays(4)))
        assertEquals(2, Schedule.workoutStreak(logs, mwf, friday))
    }

    @Test fun missedScheduledDayBreaksStreak() {
        val logs = listOf(log(friday), log(friday.minusDays(4)))
        assertEquals(1, Schedule.workoutStreak(logs, mwf, friday))
    }

    @Test fun incompleteLogsDoNotCount() {
        assertEquals(0, Schedule.workoutStreak(listOf(log(friday, completed = false)), mwf, friday.plusDays(1)))
    }

    @Test fun nextScheduledLabelUsesTrackWorkoutNames() {
        val saturday = friday.plusDays(1)
        assertEquals("Monday · Navy Seals", Schedule.nextScheduledLabel(ProgramTrack.ADVANCED, mwf, saturday, Locale.US))
        assertEquals("Monday · Beginner Burpees", Schedule.nextScheduledLabel(ProgramTrack.BEGINNER, mwf, saturday, Locale.US))
        assertEquals("Wednesday · 5-Count Pushups", Schedule.nextScheduledLabel(ProgramTrack.ADVANCED, mwf, friday.minusDays(4), Locale.US))
        assertNull(Schedule.nextScheduledLabel(ProgramTrack.ADVANCED, emptySet(), friday, Locale.US))
    }

    @Test fun dayStates() {
        val done = WorkoutSession(
            date = LocalDateTime.of(friday.minusDays(2), java.time.LocalTime.NOON),
            levelID = "1", workoutMode = WorkoutMode.NAVY_SEALS, repsCompleted = 20, targetReps = 20, completed = true
        )
        val sessions = listOf(done)
        assertEquals(DayState.Rest, Schedule.dayState(friday.plusDays(1), sessions, mwf, friday)) // Saturday
        assertEquals(DayState.Scheduled, Schedule.dayState(friday.plusDays(3), sessions, mwf, friday)) // Monday
        assertEquals(DayState.Scheduled, Schedule.dayState(friday, sessions, mwf, friday)) // today, not done yet
        assertEquals(DayState.Missed, Schedule.dayState(friday.minusDays(4), sessions, mwf, friday)) // Monday
        assertEquals(DayState.Completed(20, "1", WorkoutMode.NAVY_SEALS), Schedule.dayState(friday.minusDays(2), sessions, mwf, friday))
    }

    @Test fun customWorkoutDaysChangeTheCalendar() {
        val tuesdays = setOf(3)
        assertEquals(DayState.Rest, Schedule.dayState(LocalDate.of(2026, 11, 16), emptyList(), tuesdays, friday)) // Monday
        assertEquals(DayState.Missed, Schedule.dayState(LocalDate.of(2026, 11, 17), emptyList(), tuesdays, friday)) // Tuesday
    }

    @Test fun calendarGridIsSundayToSaturdayWeeks() {
        val grid = Schedule.calendarGrid(LocalDate.of(2026, 11, 10))
        assertEquals(0, grid.size % 7)
        assertEquals(java.time.DayOfWeek.SUNDAY, grid.first().dayOfWeek)
        assertEquals(java.time.DayOfWeek.SATURDAY, grid.last().dayOfWeek)
        assertTrue(grid.contains(LocalDate.of(2026, 11, 1)) && grid.contains(LocalDate.of(2026, 11, 30)))
        assertEquals(LocalDate.of(2026, 11, 1), grid.first()) // Nov 1 2026 is a Sunday
        assertEquals(LocalDate.of(2026, 12, 5), grid.last())
    }

    @Test fun qualifyingSessionsCountCompletedSessionsAtThatLevel() {
        fun s(level: String) = WorkoutSession(
            date = LocalDateTime.now(), levelID = level, repsCompleted = 1, targetReps = 1, completed = true
        )
        assertEquals(2, Schedule.qualifyingSessions(listOf(s("1"), s("1"), s("2")), "1"))
    }
}
