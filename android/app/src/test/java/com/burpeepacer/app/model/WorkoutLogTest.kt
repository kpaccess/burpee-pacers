package com.burpeepacer.app.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime

class WorkoutLogTest {
    @Test fun parsesLevelCompletedLikeIos() {
        assertEquals("1C" to WorkoutMode.NAVY_SEALS, WorkoutLog.parseLevelCompleted("1C(N)"))
        assertEquals("B3" to WorkoutMode.FIVE_COUNT, WorkoutLog.parseLevelCompleted("B3(C)"))
        assertEquals("F" to WorkoutMode.HYBRID, WorkoutLog.parseLevelCompleted("F(H)"))
        assertEquals("" to WorkoutMode.FIVE_COUNT, WorkoutLog.parseLevelCompleted(null))
        assertEquals("legacy" to WorkoutMode.FIVE_COUNT, WorkoutLog.parseLevelCompleted("legacy"))
    }

    @Test fun sessionToLogUsesFirestoreShape() {
        val session = WorkoutSession(
            date = LocalDateTime.of(2026, 11, 20, 7, 30), levelID = "B2",
            workoutMode = WorkoutMode.FIVE_COUNT, repsCompleted = 30, targetReps = 30, completed = true
        )
        val log = WorkoutLog.fromSession(session)
        assertEquals("2026-11-20", log.date)
        assertEquals("B2(C)", log.levelCompleted)
        assertEquals("no_pushups", log.workoutType)
        assertEquals(30, log.repsCompleted)
        assertEquals(LocalDate.of(2026, 11, 20), log.toSession()!!.date.toLocalDate())
    }

    @Test fun zeroRepsAreNotStoredAndIncompleteLogsAreNotSessions() {
        val log = WorkoutLog("2026-11-20", completed = false, levelCompleted = "1(N)", repsCompleted = null)
        assertNull(log.toSession())
        val session = WorkoutSession(
            date = LocalDateTime.now(), levelID = "1", workoutMode = WorkoutMode.NAVY_SEALS,
            repsCompleted = 0, targetReps = 20, completed = false
        )
        assertNull(WorkoutLog.fromSession(session).repsCompleted)
    }

    @Test fun oneLogPerDayAndCompletedIsNeverDowngraded() {
        val done = WorkoutLog("2026-11-20", true, "1(N)", "with_pushups", 20)
        val partial = WorkoutLog("2026-11-20", false, "1(N)", "with_pushups", 5)
        assertEquals(listOf(done), listOf(done).upsert(partial))
        assertEquals(listOf(done), listOf(partial).upsert(done))
        val other = WorkoutLog("2026-11-22", true, "1(C)", "with_pushups", 50)
        assertEquals(2, listOf(done).upsert(other).size)
    }
}
