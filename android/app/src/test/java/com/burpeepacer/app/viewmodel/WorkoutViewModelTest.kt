package com.burpeepacer.app.viewmodel

import com.burpeepacer.app.model.Level
import com.burpeepacer.app.model.ProgramTrack
import com.burpeepacer.app.model.WorkoutMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.lang.reflect.Field

class WorkoutViewModelTest {

    private val testLevel = Level(
        id = "T1",
        track = ProgramTrack.ADVANCED,
        displayName = "Test Level",
        description = "Test",
        sealsGoal = 100,
        sixCountsGoal = 200,
        tutorialURL = ""
    )

    @Test
    fun testRepPaceGuideText() {
        val viewModel = WorkoutViewModel(testLevel, WorkoutMode.FIVE_COUNT)
        
        // Initial state: not running
        assertNull(viewModel.repPaceGuideText)

        // Set running and time remaining using reflection since they are private MutableStateFlows
        // Alternatively, I could just test the logic if I extracted it, but let's try to set the state.
        
        setPrivateField(viewModel, "_isRunning", kotlinx.coroutines.flow.MutableStateFlow(true))
        
        // Goal is 200 reps in 1200 seconds (20 mins). Interval = 6s.
        // If currentReps = 0, next rep is at 6s.
        // If timeRemaining = 1198 (2s elapsed), next rep in 4s.
        
        setPrivateField(viewModel, "_timeRemaining", kotlinx.coroutines.flow.MutableStateFlow(1198L))
        assertEquals("Next rep in 4s", viewModel.repPaceGuideText)

        // If timeRemaining = 1194 (6s elapsed), next rep (rep 2) is at 12s. next rep in 6s.
        setPrivateField(viewModel, "_currentReps", kotlinx.coroutines.flow.MutableStateFlow(1))
        setPrivateField(viewModel, "_timeRemaining", kotlinx.coroutines.flow.MutableStateFlow(1194L))
        assertEquals("Next rep in 6s", viewModel.repPaceGuideText)
    }

    private fun setPrivateField(obj: Any, fieldName: String, value: Any) {
        val field: Field = obj.javaClass.getDeclaredField(fieldName)
        field.isAccessible = true
        field.set(obj, value)
    }
}
