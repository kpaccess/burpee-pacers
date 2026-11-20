package com.burpeepacer.app.model

import com.burpeepacer.app.TestConfig
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File

class ProgramCatalogTest {
    @Before fun setUp() = TestConfig.load()

    @Test fun beginnerLevelsMatchSharedConfig() {
        val levels = ProgramCatalog.levels(ProgramTrack.BEGINNER)
        assertEquals(listOf("B1", "B2", "B3", "B4", "B5", "B6"), levels.map { it.id })
        assertEquals(listOf(20, 30, 40, 55, 70, 90), levels.map { it.sixCountsGoal })
        assertTrue(levels.all { it.sealsGoal == 0 })
    }

    @Test fun advancedLevelsMatchSharedConfig() {
        val levels = ProgramCatalog.levels(ProgramTrack.ADVANCED)
        assertEquals("F", levels.first().id)
        assertEquals("U", levels.last().id)
        val elite = levels.first { it.id == "E" }
        assertEquals(80, elite.sealsGoal)
        assertEquals(120, elite.sixCountsGoal)
        assertEquals(150, levels.last().sealsGoal)
        assertEquals(240, levels.last().sixCountsGoal)
    }

    @Test fun androidBundleMatchesIosBundle() {
        // iOS bundles the live web config; Android must carry exactly the same file.
        val ios = File("../../ios/BurpeePacer/program-config.json")
        if (ios.exists()) {
            assertEquals(ios.readText(), File("src/main/assets/program-config.json").readText())
        }
    }

    @Test fun modesAndDefaultsFollowConfig() {
        assertEquals(listOf(WorkoutMode.FIVE_COUNT), ProgramCatalog.availableModes(ProgramTrack.BEGINNER))
        assertEquals(
            listOf(WorkoutMode.NAVY_SEALS, WorkoutMode.FIVE_COUNT, WorkoutMode.HYBRID),
            ProgramCatalog.availableModes(ProgramTrack.ADVANCED)
        )
        // Weekdays: Sunday = 1. Mon = 2 → N, Wed = 4 → C, Fri = 6 → H.
        assertEquals(WorkoutMode.NAVY_SEALS, ProgramCatalog.defaultMode(ProgramTrack.ADVANCED, 2))
        assertEquals(WorkoutMode.FIVE_COUNT, ProgramCatalog.defaultMode(ProgramTrack.ADVANCED, 4))
        assertEquals(WorkoutMode.HYBRID, ProgramCatalog.defaultMode(ProgramTrack.ADVANCED, 6))
        assertEquals(WorkoutMode.FIVE_COUNT, ProgramCatalog.defaultMode(ProgramTrack.BEGINNER, 6))
    }

    @Test fun launchAccessAndProgressionRules() {
        assertTrue(ProgramCatalog.launchAccessEnabled)
        assertEquals(3, ProgramCatalog.qualifyingSessionsRequired)
    }

    @Test fun hybridGoalsAreHalfRoundedUp() {
        val level = Level("X", ProgramTrack.ADVANCED, "X", "", 15, 41)
        assertEquals(8, level.hybridPhaseGoal(0))
        assertEquals(21, level.hybridPhaseGoal(1))
        assertEquals(listOf("Navy Seals", "5-Count Pushups"), level.hybridPhaseLabels)
    }
}
