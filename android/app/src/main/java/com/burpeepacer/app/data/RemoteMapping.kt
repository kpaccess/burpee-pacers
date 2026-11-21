package com.burpeepacer.app.data

import com.burpeepacer.app.model.*
import java.time.LocalDate

/** The parts of a Firestore `users/{uid}` document that Android reads, already validated. */
data class RemoteProfile(
    val startDate: LocalDate?,
    /** Null until the user has picked a track (web/iOS onboarding sets `workoutTier`). */
    val track: ProgramTrack?,
    val levelId: String?,
    val workoutDays: Set<Int>,
    val ageBracket: AgeBracket?,
    val equipment: Equipment?,
    val hasProAccess: Boolean,
    val logs: List<WorkoutLog>,
    /** Firebase Storage download URLs uploaded from the web app. */
    val day1PhotoUrl: String?,
    val sixMonthPhotoUrl: String?
)

/** Translates between Firestore documents and Android models; pure so it can be unit-tested. */
object RemoteMapping {

    fun parse(doc: Map<String, Any?>): RemoteProfile {
        val tier = doc["workoutTier"] as? String
        val track = tier?.let { ProgramTrack.fromStorageValue(it) }
        val levelIds = track?.let { t -> ProgramCatalog.levels(t).map { it.id } }.orEmpty()
        val days = (doc["workoutDays"] as? List<*>)
            ?.mapNotNull { (it as? Number)?.toInt() }
            ?.filter { it in 1..7 }
            ?.toSet()
            ?.takeIf { it.isNotEmpty() }
            ?: UserProfile.DEFAULT_WORKOUT_DAYS
        return RemoteProfile(
            startDate = (doc["startDate"] as? String)?.let { runCatching { LocalDate.parse(it.take(10)) }.getOrNull() },
            track = track,
            levelId = (doc["currentLevelId"] as? String)?.takeIf { it in levelIds },
            workoutDays = days,
            ageBracket = AgeBracket.values().firstOrNull { it.displayName == doc["ageBracket"] },
            equipment = Equipment.values().firstOrNull { it.displayName == doc["equipment"] },
            hasProAccess = doc["isPro"] == true || doc["isAdmin"] == true,
            logs = parseLogs(doc["workoutLogs"]),
            // The web has a typo variant "startPictureURl"; accept both, as iOS does.
            day1PhotoUrl = ((doc["startPictureUrl"] as? String) ?: (doc["startPictureURl"] as? String))?.takeIf { it.isNotBlank() },
            sixMonthPhotoUrl = (doc["endPictureUrl"] as? String)?.takeIf { it.isNotBlank() }
        )
    }

    fun parseLogs(raw: Any?): List<WorkoutLog> =
        (raw as? List<*>).orEmpty().mapNotNull { entry ->
            val map = entry as? Map<*, *> ?: return@mapNotNull null
            val date = map["date"] as? String ?: return@mapNotNull null
            val completed = map["completed"] as? Boolean ?: return@mapNotNull null
            WorkoutLog(
                date = date,
                completed = completed,
                levelCompleted = map["levelCompleted"] as? String,
                workoutType = map["workoutType"] as? String,
                repsCompleted = (map["repsCompleted"] as? Number)?.toInt(),
                notes = map["notes"] as? String
            )
        }

    /** `workoutLogs` array plus `workoutStats`, computed the way the web and iOS do. */
    fun logsPayload(logs: List<WorkoutLog>): Map<String, Any> = mapOf(
        "workoutLogs" to logs.map { log ->
            buildMap<String, Any> {
                put("date", log.date)
                put("completed", log.completed)
                log.levelCompleted?.let { put("levelCompleted", it) }
                log.workoutType?.let { put("workoutType", it) }
                log.repsCompleted?.let { put("repsCompleted", it) }
                log.notes?.let { put("notes", it) }
            }
        },
        "workoutStats" to mapOf(
            "workoutsCompleted" to logs.count { it.completed },
            "timerVerified" to logs.count { it.completed && it.repsCompleted != null }
        )
    )

    /** What iOS creates for a first-time user; the track is left out so the user picks it. */
    fun newUserDocument(today: LocalDate, email: String?, displayName: String?, providerIds: List<String>): Map<String, Any> =
        buildMap {
            put("startDate", today.toString())
            put("startWeight", 165.0)
            put("workoutLogs", emptyList<Any>())
            put("authProviderIds", providerIds)
            email?.trim()?.takeIf { it.isNotEmpty() }?.let {
                put("email", it)
                put("emailLowercase", it.lowercase())
            }
            displayName?.takeIf { it.isNotBlank() }?.let { put("displayName", it) }
        }
}
