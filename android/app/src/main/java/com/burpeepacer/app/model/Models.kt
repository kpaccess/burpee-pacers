package com.burpeepacer.app.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlin.math.ceil

enum class ProgramTrack(val displayName: String) {
    BEGINNER("Beginner"),
    ADVANCED("Advanced")
}

enum class AgeBracket(val displayName: String) {
    THIRTIES("30s"),
    FORTIES("40s"),
    FIFTIES_PLUS("50+")
}

enum class Equipment(val displayName: String) {
    DUMBBELLS_ONLY("Dumbbells Only"),
    FULL_GYM("Full Gym Access")
}

enum class WorkoutMode(val shortName: String) {
    NAVY_SEALS("N"),
    FIVE_COUNT("C"),
    HYBRID("H");

    fun getDisplayName(track: ProgramTrack): String {
        return when (this) {
            NAVY_SEALS -> "Navy Seals"
            FIVE_COUNT -> if (track == ProgramTrack.BEGINNER) "Burpee without pushups" else "5-Count Pushups"
            HYBRID -> "Hybrid"
        }
    }
}

data class Level(
    val id: String,
    val track: ProgramTrack,
    val displayName: String,
    val description: String,
    val sealsGoal: Int,
    val sixCountsGoal: Int,
    val tutorialURL: String
) {
    val availableModes: List<WorkoutMode>
        get() = if (track == ProgramTrack.BEGINNER) listOf(WorkoutMode.FIVE_COUNT) 
                else listOf(WorkoutMode.NAVY_SEALS, WorkoutMode.FIVE_COUNT, WorkoutMode.HYBRID)

    fun getGoal(mode: WorkoutMode): Int {
        return when (mode) {
            WorkoutMode.NAVY_SEALS -> sealsGoal
            WorkoutMode.FIVE_COUNT -> sixCountsGoal
            WorkoutMode.HYBRID -> sixCountsGoal // total session target placeholder
        }
    }

    fun hybridPhaseGoal(phase: Int): Int {
        val g = if (phase == 0) sealsGoal else sixCountsGoal
        return ceil(g.toDouble() / 2).toInt()
    }

    val hybridPhaseLabels: List<String> = listOf("Navy Seals", "5-Count Pushups")
}

object LevelDatabase {
    private const val BEGINNER_URL = "https://www.youtube.com/watch?v=TU8QYVW0gDU"
    private const val ADVANCED_URL = "https://www.youtube.com/watch?v=4dF1DOWzf20"

    val beginnerLevels = listOf(
        Level("B1", ProgramTrack.BEGINNER, "Beginner 1", "20 burpees (no pushups) in 20 min.", 0, 20, BEGINNER_URL),
        Level("B2", ProgramTrack.BEGINNER, "Beginner 2", "40 burpees (no pushups) in 20 min.", 0, 40, BEGINNER_URL),
        Level("B3", ProgramTrack.BEGINNER, "Beginner 3", "55 burpees (no pushups) in 20 min.", 0, 55, BEGINNER_URL),
        Level("B4", ProgramTrack.BEGINNER, "Beginner 4", "70 burpees (no pushups) in 20 min.", 0, 70, BEGINNER_URL),
        Level("B5", ProgramTrack.BEGINNER, "Beginner 5", "90 burpees (no pushups) in 20 min.", 0, 90, BEGINNER_URL),
        Level("B6", ProgramTrack.BEGINNER, "Beginner 6", "110 burpees (no pushups) in 20 min.", 0, 110, BEGINNER_URL)
    )

    val advancedLevels = listOf(
        Level("1B", ProgramTrack.ADVANCED, "Level 1B", "20 Navy Seals in 20 min, 50 5-count pushups in 20 min.", 20, 50, ADVANCED_URL),
        Level("1C", ProgramTrack.ADVANCED, "Level 1C", "40 Navy Seals in 20 min, 100 5-count pushups in 20 min.", 40, 100, ADVANCED_URL),
        Level("1D", ProgramTrack.ADVANCED, "Level 1D", "60 Navy Seals in 20 min, 150 5-count pushups in 20 min.", 60, 150, ADVANCED_URL),
        Level("2", ProgramTrack.ADVANCED, "Level 2", "80 Navy Seals in 20 min, 200 5-count pushups in 20 min.", 80, 200, ADVANCED_URL),
        Level("3", ProgramTrack.ADVANCED, "Level 3", "100 Navy Seals in 20 min, 250 5-count pushups in 20 min.", 100, 250, ADVANCED_URL),
        Level("4", ProgramTrack.ADVANCED, "Level 4", "120 Navy Seals in 20 min, 275 5-count pushups in 20 min.", 120, 275, ADVANCED_URL),
        Level("grad", ProgramTrack.ADVANCED, "Graduation", "150 Navy Seals in 20 min, 325 5-count pushups in 20 min.", 150, 325, ADVANCED_URL)
    )

    fun getLevels(track: ProgramTrack): List<Level> {
        return if (track == ProgramTrack.BEGINNER) beginnerLevels else advancedLevels
    }
}

data class WorkoutSession(
    val id: UUID = UUID.randomUUID(),
    val date: LocalDateTime,
    val levelID: String,
    val workoutMode: WorkoutMode = WorkoutMode.FIVE_COUNT,
    val repsCompleted: Int,
    val targetReps: Int,
    val completed: Boolean
)

data class UserProfile(
    var startDate: LocalDate,
    var currentWeight: Double, // in kg
    var useKilograms: Boolean,
    var currentTrack: ProgramTrack,
    var currentLevelID: String,
    var ageBracket: AgeBracket = AgeBracket.THIRTIES,
    var equipment: Equipment = Equipment.DUMBBELLS_ONLY,
    var isPro: Boolean = false,
    var isLoggedIn: Boolean = false,
    var day1PhotoUri: String? = null,
    var sixMonthPhotoUri: String? = null,
    var weightedTrainingEnabled: Boolean = false
) {
    val weightDisplay: Double
        get() = if (useKilograms) currentWeight else currentWeight * 2.20462

    val proteinTarget: Double
        get() = currentWeight * 1.5

    val daysSinceStart: Long
        get() = ChronoUnit.DAYS.between(startDate, LocalDate.now())
}

sealed class DayState {
    object Rest : DayState()
    object Scheduled : DayState()
    data class Completed(val reps: Int, val levelCode: String, val workoutMode: WorkoutMode) : DayState()
    object Missed : DayState()
}

data class CalendarDay(
    val id: UUID = UUID.randomUUID(),
    val date: LocalDate,
    val state: DayState
) {
    val isWorkoutDay: Boolean
        get() {
            val dayOfWeek = date.dayOfWeek.value // 1 (Mon) to 7 (Sun)
            return dayOfWeek == 1 || dayOfWeek == 3 || dayOfWeek == 5
        }
}

enum class WeightUnit(val label: String) {
    KILOGRAMS("kg"),
    POUNDS("lbs")
}
