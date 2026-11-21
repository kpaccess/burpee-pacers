package com.burpeepacer.app.util

import com.burpeepacer.app.TestConfig
import com.burpeepacer.app.model.WorkoutMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class WorkoutPaceTest {
    @Before fun setUp() = TestConfig.load()

    @Test fun sessionLengthsMatchWeb() {
        assertEquals(10, WorkoutPace.PREPARE_SECONDS)
        assertEquals(1200, WorkoutPace.totalSeconds(WorkoutMode.NAVY_SEALS))
        assertEquals(1200, WorkoutPace.totalSeconds(WorkoutMode.FIVE_COUNT))
        assertEquals(1215, WorkoutPace.totalSeconds(WorkoutMode.HYBRID)) // 10 + 15 s rest + 10 min
    }

    @Test fun hybridTimelineHasARestBetweenPhases() {
        val mode = WorkoutMode.HYBRID
        assertEquals(0, WorkoutPace.position(0.0, mode).phaseIndex)
        assertFalse(WorkoutPace.position(599.9, mode).isResting)

        val resting = WorkoutPace.position(600.0, mode)
        assertTrue(resting.isResting)
        assertEquals(15, resting.restSecondsLeft)
        assertEquals(1, WorkoutPace.position(614.5, mode).restSecondsLeft)

        val phase2 = WorkoutPace.position(615.0, mode)
        assertFalse(phase2.isResting)
        assertEquals(1, phase2.phaseIndex)
        assertEquals(0.0, phase2.phaseElapsedSeconds, 1e-9)
        assertEquals(600, phase2.phaseSecondsLeft)

        val end = WorkoutPace.position(1215.0, mode)
        assertEquals(0, end.phaseSecondsLeft)
    }

    @Test fun nonHybridUsesTheFullTwentyMinutes() {
        val pos = WorkoutPace.position(300.0, WorkoutMode.FIVE_COUNT)
        assertEquals(0, pos.phaseIndex)
        assertEquals(900, pos.phaseSecondsLeft)
        assertFalse(pos.isResting)
    }

    @Test fun expectedRepsFollowTargetPace() {
        // 200 reps in 1200 s → one every 6 s.
        assertEquals(0, WorkoutPace.expectedReps(5.9, 1200, 200))
        assertEquals(1, WorkoutPace.expectedReps(6.0, 1200, 200))
        assertEquals(200, WorkoutPace.expectedReps(1200.0, 1200, 200))
        assertEquals(0, WorkoutPace.expectedReps(100.0, 1200, 0))
    }

    @Test fun secondsToNextRepRoundsUpAndStopsAtGoal() {
        assertEquals(4, WorkoutPace.secondsToNextRep(0, 2.0, 1200, 200))
        assertEquals(6, WorkoutPace.secondsToNextRep(1, 6.0, 1200, 200))
        assertEquals(0, WorkoutPace.secondsToNextRep(0, 7.0, 1200, 200))
        assertNull(WorkoutPace.secondsToNextRep(200, 1199.0, 1200, 200))
        assertNull(WorkoutPace.secondsToNextRep(0, 1.0, 1200, 0))
    }

    @Test fun paceGuideTextUsesIosWording() {
        assertEquals("Next rep in 4s", WorkoutPace.paceGuideText(0, 2.0, 1200, 200))
        assertEquals("Next rep in 6s", WorkoutPace.paceGuideText(1, 6.0, 1200, 200))
        assertEquals("REP NOW!", WorkoutPace.paceGuideText(0, 7.0, 1200, 200))
        assertEquals("Ahead by 1 rep", WorkoutPace.paceGuideText(2, 6.0, 1200, 200))
        assertEquals("Ahead by 3 reps", WorkoutPace.paceGuideText(4, 6.0, 1200, 200))
        assertNull(WorkoutPace.paceGuideText(0, 6.0, 1200, 0))
    }

    @Test fun formatTimePadsMinutesAndSeconds() {
        assertEquals("20:00", WorkoutPace.formatTime(1200))
        assertEquals("00:05", WorkoutPace.formatTime(5))
    }
}
