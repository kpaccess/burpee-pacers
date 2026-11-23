package com.burpeepacer.app.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlin.math.ceil

enum class ProgramTrack(val displayName: String, val storageValue: String) {
    BEGINNER("Beginner", "beginner"),
    ADVANCED("Advanced", "advanced");

    companion object {
        /** Parses the Firestore/web `workoutTier` value; anything unknown is Beginner (as on iOS). */
        fun fromStorageValue(value: String?): ProgramTrack =
            if (value == ADVANCED.storageValue) ADVANCED else BEGINNER
    }
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

    companion object {
        fun fromShortName(value: String?): WorkoutMode? = values().firstOrNull { it.shortName == value }
    }

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
    val sixCountsGoal: Int
) {
    val availableModes: List<WorkoutMode>
        get() = ProgramCatalog.availableModes(track)

    fun getGoal(mode: WorkoutMode): Int {
        return when (mode) {
            WorkoutMode.NAVY_SEALS -> sealsGoal
            WorkoutMode.FIVE_COUNT -> sixCountsGoal
            WorkoutMode.HYBRID -> sixCountsGoal // total session target placeholder
        }
    }

    /** Half the full goal, rounded up. Mirrors web `getHybridPhaseGoal` and iOS `hybridPhaseGoal`. */
    fun hybridPhaseGoal(phase: Int): Int {
        val g = if (phase == 0) sealsGoal else sixCountsGoal
        return ceil(g.toDouble() / 2).toInt()
    }

    val hybridPhaseLabels: List<String>
        get() = ProgramCatalog.hybridPhaseLabels
}

/** Levels come from the shared program config (see [ProgramCatalog]); never hard-code goals here. */
object LevelDatabase {
    val beginnerLevels: List<Level> get() = ProgramCatalog.levels(ProgramTrack.BEGINNER)
    val advancedLevels: List<Level> get() = ProgramCatalog.levels(ProgramTrack.ADVANCED)

    fun getLevels(track: ProgramTrack): List<Level> = ProgramCatalog.levels(track)
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
    var ageBracket: AgeBracket = AgeBracket.FIFTIES_PLUS,
    var equipment: Equipment = Equipment.DUMBBELLS_ONLY,
    var isPro: Boolean = false,
    var isLoggedIn: Boolean = false,
    var day1PhotoUri: String? = null,
    var sixMonthPhotoUri: String? = null,
    var weightedTrainingEnabled: Boolean = false,
    /** Photos uploaded from the web (Firebase Storage URLs); a photo picked on this phone takes priority. */
    var remoteDay1PhotoUrl: String? = null,
    var remoteSixMonthPhotoUrl: String? = null,
    /** Chosen weekly workout days, iOS/web weekday numbers: Sunday = 1 … Saturday = 7. */
    var workoutDays: Set<Int> = DEFAULT_WORKOUT_DAYS
) {
    val weightDisplay: Double
        get() = if (useKilograms) currentWeight else currentWeight * 2.20462

    val proteinTarget: Double
        get() = currentWeight * 1.5

    val daysSinceStart: Long
        get() = ChronoUnit.DAYS.between(startDate, LocalDate.now())

    companion object {
        /** Monday, Wednesday, Friday. */
        val DEFAULT_WORKOUT_DAYS: Set<Int> = setOf(2, 4, 6)
    }
}

/** Weekday number used by web/iOS: Sunday = 1 … Saturday = 7. */
fun LocalDate.workoutWeekday(): Int = dayOfWeek.value % 7 + 1

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
)

enum class WeightUnit(val label: String) {
    KILOGRAMS("kg"),
    POUNDS("lbs")
}
