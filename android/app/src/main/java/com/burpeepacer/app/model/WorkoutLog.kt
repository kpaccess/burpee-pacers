package com.burpeepacer.app.model

import com.google.gson.annotations.SerializedName
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * One workout per calendar day, in the same shape as the web/iOS Firestore `workoutLogs[]` entries
 * so a future Firestore sync can upload these as-is.
 */
data class WorkoutLog(
    @SerializedName("date") val date: String,                 // "YYYY-MM-DD"
    @SerializedName("completed") val completed: Boolean,
    @SerializedName("levelCompleted") val levelCompleted: String? = null, // e.g. "1(N)", "B3(C)"
    @SerializedName("workoutType") val workoutType: String? = null,       // "with_pushups" | "no_pushups"
    @SerializedName("repsCompleted") val repsCompleted: Int? = null,
    @SerializedName("notes") val notes: String? = null
) {
    companion object {
        private val LEVEL_MODE = Regex("^(.+)\\(([NCH])\\)$")

        fun levelCompleted(levelId: String, mode: WorkoutMode) = "$levelId(${mode.shortName})"

        /** Parses "1C(N)" into ("1C", NAVY_SEALS). Anything unparseable falls back to 5-count (as on iOS). */
        fun parseLevelCompleted(value: String?): Pair<String, WorkoutMode> {
            if (value.isNullOrEmpty()) return "" to WorkoutMode.FIVE_COUNT
            val match = LEVEL_MODE.matchEntire(value) ?: return value to WorkoutMode.FIVE_COUNT
            val mode = WorkoutMode.fromShortName(match.groupValues[2]) ?: WorkoutMode.FIVE_COUNT
            return match.groupValues[1] to mode
        }

        fun fromSession(session: WorkoutSession): WorkoutLog = WorkoutLog(
            date = session.date.toLocalDate().toString(),
            completed = session.completed,
            levelCompleted = levelCompleted(session.levelID, session.workoutMode),
            workoutType = if (session.levelID.startsWith("B")) "no_pushups" else "with_pushups",
            repsCompleted = session.repsCompleted.takeIf { it > 0 }
        )
    }

    /** Completed logs become sessions; incomplete ones never count (matches iOS `sessions(from:)`). */
    fun toSession(): WorkoutSession? {
        if (!completed) return null
        val day = runCatching { LocalDate.parse(date.take(10)) }.getOrNull() ?: return null
        val (levelId, mode) = parseLevelCompleted(levelCompleted)
        return WorkoutSession(
            date = LocalDateTime.of(day, java.time.LocalTime.NOON),
            levelID = levelId,
            workoutMode = mode,
            repsCompleted = repsCompleted ?: 0,
            targetReps = 0,
            completed = true
        )
    }
}

/** Adds [log] for its date, replacing an existing log for the same day unless that would downgrade a completed one. */
fun List<WorkoutLog>.upsert(log: WorkoutLog): List<WorkoutLog> {
    val existing = firstOrNull { it.date == log.date }
    if (existing != null && existing.completed && !log.completed) return this
    return filterNot { it.date == log.date } + log
}
