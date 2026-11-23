package com.burpeepacer.app.viewmodel

import com.burpeepacer.app.TestConfig
import com.burpeepacer.app.model.Level
import com.burpeepacer.app.model.ProgramCatalog
import com.burpeepacer.app.model.ProgramTrack
import com.burpeepacer.app.model.WorkoutMode
import com.burpeepacer.app.util.WorkoutSounds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class WorkoutViewModelTest {

    private class RecordingSounds : WorkoutSounds {
        val events = mutableListOf<String>()
        override fun playCountdownBeep() { events += "countdown" }
        override fun playStartWhistle() { events += "start" }
        override fun playRepTrigger() { events += "rep" }
        override fun playRepWarning() { events += "warning" }
        override fun playRestStart() { events += "rest" }
        override fun playPhaseTransition() { events += "phase2" }
        override fun playFinishWhistle() { events += "finish" }
        override fun release() {}
    }

    // 100 / 200 goals: 5-count = one rep every 6 s; hybrid = 50 reps then 100 reps over 10 min each.
    private val level = Level("T1", ProgramTrack.ADVANCED, "Test Level", "Test", 100, 200)
    private lateinit var sounds: RecordingSounds

    @Before fun setUp() {
        TestConfig.load()
        sounds = RecordingSounds()
    }

    private fun vm(mode: WorkoutMode) = WorkoutViewModel(level, mode, sounds)

    @Test fun startsIdleWithFullTime() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        assertTrue(vm.isIdle)
        assertEquals(1200L, vm.timeRemaining.value)
        assertNull(vm.repPaceGuideText)
        assertEquals(200, vm.currentPhaseGoal)
    }

    @Test fun catchesUpRepsAfterABackgroundGap() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.onTick(600.0) // app was backgrounded for 10 minutes
        assertEquals(100, vm.currentReps.value)
    }

    @Test fun repsAheadOfPaceAreKept() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        repeat(5) { vm.incrementRep() }
        vm.onTick(12.0) // pace says 2 reps
        assertEquals(5, vm.currentReps.value)
    }

    @Test fun hybridSessionIncludesTheRest() {
        val vm = vm(WorkoutMode.HYBRID)
        assertEquals(1215L, vm.timeRemaining.value)
        assertEquals(50, vm.currentPhaseGoal)
    }

    @Test fun autoCountsRepsAtTargetPace() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.onTick(5.9)
        assertEquals(0, vm.currentReps.value)
        vm.onTick(6.0)
        assertEquals(1, vm.currentReps.value)
        assertEquals(1194L, vm.timeRemaining.value)
    }

    @Test fun hybridRestResetsRepsForPhaseTwo() {
        val vm = vm(WorkoutMode.HYBRID)
        vm.onTick(599.9)
        assertEquals(49, vm.currentReps.value) // 12 s per rep; the 50th lands exactly at 600 s
        assertEquals(0, vm.hybridPhaseIndex)

        vm.onTick(600.0) // phase 1 done → rest
        assertTrue(vm.isResting)
        assertEquals(15, vm.restSecondsLeft)
        assertTrue("rest" in sounds.events)
        assertEquals(50, vm.currentReps.value) // phase-1 count stays visible during rest

        vm.onTick(615.0) // rest over → phase 2
        assertFalse(vm.isResting)
        assertEquals(1, vm.hybridPhaseIndex)
        assertEquals(0, vm.currentReps.value)
        assertEquals(100, vm.currentPhaseGoal)
        assertTrue("phase2" in sounds.events)
    }

    @Test fun warnsOncePerSecondFromFourSecondsOut() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.onTick(2.0) // 4 s to rep 1
        vm.onTick(2.0)
        assertEquals(1, sounds.events.count { it == "warning" }) // same second → no repeat
        vm.onTick(3.0) // 3 s out
        assertEquals(2, sounds.events.count { it == "warning" })
    }

    @Test fun modeCanOnlyChangeBeforeStart() {
        val vm = vm(WorkoutMode.NAVY_SEALS)
        vm.setMode(WorkoutMode.HYBRID)
        assertEquals(WorkoutMode.HYBRID, vm.mode)
        assertEquals(1215L, vm.timeRemaining.value)
        vm.setMode(WorkoutMode.FIVE_COUNT)
        assertEquals(1200L, vm.timeRemaining.value)
    }

    @Test fun beginnerLevelsOnlyAllowFiveCount() {
        val beginner = ProgramCatalog.startingLevel(ProgramTrack.BEGINNER)
        val vm = WorkoutViewModel(beginner, WorkoutMode.FIVE_COUNT, sounds)
        vm.setMode(WorkoutMode.HYBRID)
        assertEquals(WorkoutMode.FIVE_COUNT, vm.mode)
    }

    @Test fun finishingMarksFinishedAndSessionCompletedAtGoal() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.onTick(1200.0)
        assertTrue(vm.isFinished.value)
        assertEquals(0L, vm.timeRemaining.value)
        assertTrue("finish" in sounds.events)
        val session = vm.createSession()
        assertEquals(200, session.repsCompleted)
        assertTrue(session.completed)
        assertEquals("T1", session.levelID)
    }

    @Test fun finishingShortOfGoalStillCountsAsCompleted() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.onTick(1200.0)
        repeat(30) { vm.decrementRep() }
        val session = vm.createSession()
        assertTrue(session.repsCompleted < session.targetReps)
        assertTrue(session.completed)
    }

    @Test fun manualAdjustmentNeverGoesBelowZero() {
        val vm = vm(WorkoutMode.FIVE_COUNT)
        vm.decrementRep()
        assertEquals(0, vm.currentReps.value)
        vm.incrementRep()
        assertEquals(1, vm.currentReps.value)
    }
}
