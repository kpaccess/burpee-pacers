package com.burpeepacer.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.burpeepacer.app.model.*
import com.google.gson.Gson
import com.google.gson.JsonParser
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class DataRepository(private val context: Context) {
    private val gson = Gson()

    companion object {
        private val START_DATE = stringPreferencesKey("start_date")
        private val CURRENT_WEIGHT = doublePreferencesKey("current_weight")
        private val USE_KILOGRAMS = booleanPreferencesKey("use_kilograms")
        private val CURRENT_TRACK = stringPreferencesKey("current_track")
        private val CURRENT_LEVEL_ID = stringPreferencesKey("current_level_id")
        private val AGE_BRACKET = stringPreferencesKey("age_bracket")
        private val EQUIPMENT = stringPreferencesKey("equipment")
        private val IS_PRO = booleanPreferencesKey("is_pro")
        private val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        private val WEIGHTED_TRAINING_ENABLED = booleanPreferencesKey("weighted_training_enabled")
        private val WORKOUT_DAYS = stringSetPreferencesKey("workout_days")
        private val DAY1_PHOTO_URI = stringPreferencesKey("day1_photo_uri")
        private val SIX_MONTH_PHOTO_URI = stringPreferencesKey("six_month_photo_uri")

        /** Firestore-shaped logs (one per day). Replaces the legacy [WORKOUT_HISTORY] session list. */
        private val WORKOUT_LOGS = stringPreferencesKey("workout_logs")

        /** Legacy key: JSON of reflectively-serialised `WorkoutSession`s. Read once for migration, then ignored. */
        private val WORKOUT_HISTORY = stringPreferencesKey("workout_history")

        private inline fun <reified T : Enum<T>> enumOrDefault(name: String?, default: T): T =
            enumValues<T>().firstOrNull { it.name == name } ?: default
    }

    val userProfileFlow: Flow<UserProfile> = context.dataStore.data.map { preferences ->
        val track = enumOrDefault(preferences[CURRENT_TRACK], ProgramTrack.BEGINNER)
        val levelIds = ProgramCatalog.levels(track).map { it.id }
        val storedLevel = preferences[CURRENT_LEVEL_ID]
        UserProfile(
            startDate = runCatching { LocalDate.parse(preferences[START_DATE]) }.getOrDefault(LocalDate.now()),
            currentWeight = preferences[CURRENT_WEIGHT] ?: 75.0,
            useKilograms = preferences[USE_KILOGRAMS] ?: true,
            currentTrack = track,
            // An unknown level id (e.g. from an older build) falls back to the track's first level, as on iOS.
            currentLevelID = storedLevel?.takeIf { it in levelIds } ?: ProgramCatalog.startingLevel(track).id,
            ageBracket = enumOrDefault(preferences[AGE_BRACKET], AgeBracket.FIFTIES_PLUS),
            equipment = enumOrDefault(preferences[EQUIPMENT], Equipment.DUMBBELLS_ONLY),
            isPro = preferences[IS_PRO] ?: false,
            isLoggedIn = preferences[IS_LOGGED_IN] ?: false,
            day1PhotoUri = preferences[DAY1_PHOTO_URI]?.takeIf { it.isNotBlank() },
            sixMonthPhotoUri = preferences[SIX_MONTH_PHOTO_URI]?.takeIf { it.isNotBlank() },
            weightedTrainingEnabled = preferences[WEIGHTED_TRAINING_ENABLED] ?: false,
            workoutDays = preferences[WORKOUT_DAYS]
                ?.mapNotNull { it.toIntOrNull() }?.filter { it in 1..7 }?.toSet()
                ?.takeIf { it.isNotEmpty() }
                ?: UserProfile.DEFAULT_WORKOUT_DAYS
        )
    }

    val workoutLogsFlow: Flow<List<WorkoutLog>> = context.dataStore.data.map { readLogs(it) }

    suspend fun updateUserProfile(profile: UserProfile) {
        context.dataStore.edit { preferences ->
            preferences[START_DATE] = profile.startDate.toString()
            preferences[CURRENT_WEIGHT] = profile.currentWeight
            preferences[USE_KILOGRAMS] = profile.useKilograms
            preferences[CURRENT_TRACK] = profile.currentTrack.name
            preferences[CURRENT_LEVEL_ID] = profile.currentLevelID
            preferences[AGE_BRACKET] = profile.ageBracket.name
            preferences[EQUIPMENT] = profile.equipment.name
            preferences[IS_PRO] = profile.isPro
            preferences[IS_LOGGED_IN] = profile.isLoggedIn
            preferences[DAY1_PHOTO_URI] = profile.day1PhotoUri ?: ""
            preferences[SIX_MONTH_PHOTO_URI] = profile.sixMonthPhotoUri ?: ""
            preferences[WEIGHTED_TRAINING_ENABLED] = profile.weightedTrainingEnabled
            preferences[WORKOUT_DAYS] = profile.workoutDays.map { it.toString() }.toSet()
        }
    }

    /** Saves one log per day (a later log for the same day replaces the earlier one) and returns all logs. */
    suspend fun saveWorkoutLog(log: WorkoutLog): List<WorkoutLog> {
        var saved: List<WorkoutLog> = emptyList()
        context.dataStore.edit { preferences ->
            saved = readLogs(preferences).upsert(log)
            preferences[WORKOUT_LOGS] = gson.toJson(saved)
        }
        return saved
    }

    suspend fun setLoggedIn(loggedIn: Boolean) {
        context.dataStore.edit { it[IS_LOGGED_IN] = loggedIn }
    }

    /**
     * Mirrors the signed-in user's Firestore profile into local storage. Weight and photos stay
     * local (the web's `startWeight` is a different value from Android's current weight).
     */
    suspend fun applyRemote(remote: RemoteProfile) {
        context.dataStore.edit { p ->
            remote.startDate?.let { p[START_DATE] = it.toString() }
            val track = remote.track
            if (track != null) {
                p[CURRENT_TRACK] = track.name
                p[CURRENT_LEVEL_ID] = remote.levelId ?: ProgramCatalog.startingLevel(track).id
            }
            p[WORKOUT_DAYS] = remote.workoutDays.map { it.toString() }.toSet()
            remote.ageBracket?.let { p[AGE_BRACKET] = it.name }
            remote.equipment?.let { p[EQUIPMENT] = it.name }
            p[IS_PRO] = remote.hasProAccess
            p[WORKOUT_LOGS] = gson.toJson(remote.logs)
            p[IS_LOGGED_IN] = true
        }
    }

    suspend fun clearHistory() {
        context.dataStore.edit { preferences ->
            preferences[WORKOUT_LOGS] = "[]"
            preferences.remove(WORKOUT_HISTORY)
            preferences[START_DATE] = LocalDate.now().toString()
            preferences[CURRENT_TRACK] = ProgramTrack.BEGINNER.name
            preferences[CURRENT_LEVEL_ID] = ProgramCatalog.startingLevel(ProgramTrack.BEGINNER).id
            preferences[AGE_BRACKET] = AgeBracket.FIFTIES_PLUS.name
            preferences[EQUIPMENT] = Equipment.DUMBBELLS_ONLY.name
            preferences[IS_PRO] = false
            preferences[IS_LOGGED_IN] = false
            preferences[DAY1_PHOTO_URI] = ""
            preferences[SIX_MONTH_PHOTO_URI] = ""
            preferences[WORKOUT_DAYS] = UserProfile.DEFAULT_WORKOUT_DAYS.map { it.toString() }.toSet()
        }
    }

    private fun readLogs(preferences: Preferences): List<WorkoutLog> {
        val json = preferences[WORKOUT_LOGS]
        if (json != null) {
            val type = object : TypeToken<List<WorkoutLog>>() {}.type
            return runCatching { gson.fromJson<List<WorkoutLog>>(json, type) }.getOrNull().orEmpty()
        }
        return migrateLegacyHistory(preferences[WORKOUT_HISTORY])
    }

    /**
     * Best-effort conversion of the old reflectively-serialised session list
     * (`date` was a nested `LocalDateTime` object) into per-day logs. Failure yields no logs.
     */
    private fun migrateLegacyHistory(json: String?): List<WorkoutLog> {
        if (json.isNullOrBlank()) return emptyList()
        return runCatching {
            JsonParser.parseString(json).asJsonArray.mapNotNull { element ->
                val obj = element.asJsonObject
                if (!obj.get("completed").asBoolean) return@mapNotNull null
                val date = obj.getAsJsonObject("date").getAsJsonObject("date")
                val day = LocalDate.of(date.get("year").asInt, date.get("month").asInt, date.get("day").asInt)
                val mode = enumOrDefault(obj.get("workoutMode")?.asString, WorkoutMode.FIVE_COUNT)
                val levelId = obj.get("levelID").asString
                WorkoutLog(
                    date = day.toString(),
                    completed = true,
                    levelCompleted = WorkoutLog.levelCompleted(levelId, mode),
                    workoutType = if (levelId.startsWith("B")) "no_pushups" else "with_pushups",
                    repsCompleted = obj.get("repsCompleted").asInt.takeIf { it > 0 }
                )
            }.fold(emptyList<WorkoutLog>()) { acc, log -> acc.upsert(log) }
        }.getOrDefault(emptyList())
    }
}
