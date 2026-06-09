package com.burpeepacer.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.burpeepacer.app.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.util.*

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
        private val WORKOUT_HISTORY = stringPreferencesKey("workout_history")
        private val DAY1_PHOTO_URI = stringPreferencesKey("day1_photo_uri")
        private val SIX_MONTH_PHOTO_URI = stringPreferencesKey("six_month_photo_uri")
    }

    val userProfileFlow: Flow<UserProfile> = context.dataStore.data.map { preferences ->
        UserProfile(
            startDate = LocalDate.parse(preferences[START_DATE] ?: LocalDate.now().toString()),
            currentWeight = preferences[CURRENT_WEIGHT] ?: 75.0,
            useKilograms = preferences[USE_KILOGRAMS] ?: true,
            currentTrack = ProgramTrack.valueOf(preferences[CURRENT_TRACK] ?: ProgramTrack.BEGINNER.name),
            currentLevelID = preferences[CURRENT_LEVEL_ID] ?: "B1",
            ageBracket = AgeBracket.valueOf(preferences[AGE_BRACKET] ?: AgeBracket.THIRTIES.name),
            equipment = Equipment.valueOf(preferences[EQUIPMENT] ?: Equipment.DUMBBELLS_ONLY.name),
            isPro = preferences[IS_PRO] ?: false,
            isLoggedIn = preferences[IS_LOGGED_IN] ?: false,
            day1PhotoUri = preferences[DAY1_PHOTO_URI],
            sixMonthPhotoUri = preferences[SIX_MONTH_PHOTO_URI],
            weightedTrainingEnabled = preferences[WEIGHTED_TRAINING_ENABLED] ?: false
        )
    }

    val workoutHistoryFlow: Flow<List<WorkoutSession>> = context.dataStore.data.map { preferences ->
        val json = preferences[WORKOUT_HISTORY] ?: "[]"
        val type = object : TypeToken<List<WorkoutSession>>() {}.type
        gson.fromJson(json, type)
    }

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
        }
    }

    suspend fun saveWorkoutSession(session: WorkoutSession) {
        context.dataStore.edit { preferences ->
            val currentHistoryJson = preferences[WORKOUT_HISTORY] ?: "[]"
            val type = object : TypeToken<MutableList<WorkoutSession>>() {}.type
            val history: MutableList<WorkoutSession> = gson.fromJson(currentHistoryJson, type)
            history.add(session)
            preferences[WORKOUT_HISTORY] = gson.toJson(history)
        }
    }

    suspend fun clearHistory() {
        context.dataStore.edit { preferences ->
            preferences[WORKOUT_HISTORY] = "[]"
            preferences[START_DATE] = LocalDate.now().toString()
            preferences[CURRENT_LEVEL_ID] = "B1"
            preferences[CURRENT_TRACK] = ProgramTrack.BEGINNER.name
            preferences[AGE_BRACKET] = AgeBracket.THIRTIES.name
            preferences[EQUIPMENT] = Equipment.DUMBBELLS_ONLY.name
            preferences[IS_PRO] = false
            preferences[IS_LOGGED_IN] = false
            preferences[DAY1_PHOTO_URI] = ""
            preferences[SIX_MONTH_PHOTO_URI] = ""
        }
    }
}
