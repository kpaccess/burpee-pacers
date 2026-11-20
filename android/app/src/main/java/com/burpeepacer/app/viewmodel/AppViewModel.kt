package com.burpeepacer.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.burpeepacer.app.data.DataRepository
import com.burpeepacer.app.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class AppViewModel(private val repository: DataRepository) : ViewModel() {

    val userProfile = repository.userProfileFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000),
        UserProfile(
            LocalDate.now(), 75.0, true, ProgramTrack.BEGINNER,
            ProgramCatalog.startingLevel(ProgramTrack.BEGINNER).id
        )
    )

    /** One log per day, in the web/iOS Firestore `workoutLogs` shape. */
    val workoutLogs = repository.workoutLogsFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    /** Completed workouts only (as on iOS). */
    val workoutSessions: StateFlow<List<WorkoutSession>> = workoutLogs
        .map { logs -> logs.mapNotNull { it.toSession() } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentLevel: StateFlow<Level> = userProfile.map { profile ->
        val levels = LevelDatabase.getLevels(profile.currentTrack)
        levels.find { it.id == profile.currentLevelID } ?: levels[0]
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), LevelDatabase.beginnerLevels[0])

    /** The level after the current one, or null at the top of the track. */
    val nextLevel: Flow<Level?> = currentLevel.map { level ->
        val levels = LevelDatabase.getLevels(level.track)
        levels.getOrNull(levels.indexOfFirst { it.id == level.id } + 1)
    }

    /** Completed sessions at the current level, for the "X of N sessions completed" progress. */
    val currentLevelQualifyingSessions: Flow<Int> = combine(currentLevel, workoutSessions) { level, sessions ->
        Schedule.qualifyingSessions(sessions, level.id)
    }

    val qualifyingSessionsRequired: Int get() = ProgramCatalog.qualifyingSessionsRequired

    val isLaunchAccessEnabled: Boolean get() = ProgramCatalog.launchAccessEnabled

    /** Access follows the shared program config and account state (iOS `hasProAccess`). */
    val hasProAccess: Flow<Boolean> = userProfile.map { isLaunchAccessEnabled || it.isPro }

    val milestoneDate: Flow<LocalDate> = userProfile.map { it.startDate.plusMonths(6) }

    val daysToMilestone: Flow<Long> = milestoneDate.map {
        java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), it)
    }

    val isMilestoneReached: Flow<Boolean> = daysToMilestone.map { it < 0 }

    val programStatusText: Flow<String> = userProfile.map { profile ->
        val days = java.time.temporal.ChronoUnit.DAYS.between(profile.startDate, LocalDate.now())
        "Day ${maxOf(1, days + 1)} • BurpeePacers Program"
    }

    val todayFinisher: Flow<Finisher> = userProfile.map { profile ->
        FinisherDatabase.getFinisher(LocalDate.now().dayOfWeek, profile.ageBracket, profile.equipment)
    }

    val todayWeightedDay: Flow<WeightedTrainingDay?> = userProfile.map { profile ->
        if (profile.weightedTrainingEnabled) WeightedTrainingPlan.today() else null
    }

    // ── Schedule ────────────────────────────────────────────────────────────────

    fun isWorkoutDay(date: LocalDate = LocalDate.now()): Boolean =
        date.workoutWeekday() in userProfile.value.workoutDays

    val workoutStreak: Flow<Int> = combine(workoutLogs, userProfile) { logs, profile ->
        Schedule.workoutStreak(logs, profile.workoutDays, LocalDate.now())
    }

    val nextScheduledLabel: Flow<String?> = userProfile.map {
        Schedule.nextScheduledLabel(it.currentTrack, it.workoutDays, LocalDate.now())
    }

    /** Mon→N, Wed→C, Fri→H for Advanced, 5-count for Beginner (from the shared program config). */
    fun defaultMode(date: LocalDate = LocalDate.now()): WorkoutMode =
        ProgramCatalog.defaultMode(userProfile.value.currentTrack, date.workoutWeekday())

    // ── Updates ─────────────────────────────────────────────────────────────────

    fun updateWeight(weight: Double) = updateProfile { it.copy(currentWeight = weight) }

    fun toggleWeightUnit() = updateProfile { it.copy(useKilograms = !it.useKilograms) }

    /** Switching tracks resets the level to the track's starting level; history is kept (as on iOS). */
    fun updateTrack(track: ProgramTrack) = updateProfile {
        it.copy(currentTrack = track, currentLevelID = ProgramCatalog.startingLevel(track).id)
    }

    fun updateLevel(levelID: String) = updateProfile { it.copy(currentLevelID = levelID) }

    fun updateAgeBracket(ageBracket: AgeBracket) = updateProfile { it.copy(ageBracket = ageBracket) }

    fun updateEquipment(equipment: Equipment) = updateProfile { it.copy(equipment = equipment) }

    fun toggleWeightedTraining() = updateProfile { it.copy(weightedTrainingEnabled = !it.weightedTrainingEnabled) }

    /** Toggles one weekday; at least one workout day must stay selected (as on web). */
    fun toggleWorkoutDay(weekday: Int) = updateProfile { profile ->
        val days = profile.workoutDays
        when {
            weekday in days && days.size == 1 -> profile
            weekday in days -> profile.copy(workoutDays = days - weekday)
            else -> profile.copy(workoutDays = days + weekday)
        }
    }

    fun updateDay1Photo(uri: String) = updateProfile { it.copy(day1PhotoUri = uri) }

    fun updateSixMonthPhoto(uri: String) = updateProfile { it.copy(sixMonthPhotoUri = uri) }

    fun setLoggedIn(loggedIn: Boolean) = updateProfile { it.copy(isLoggedIn = loggedIn) }

    private fun updateProfile(transform: (UserProfile) -> UserProfile) {
        viewModelScope.launch {
            repository.updateUserProfile(transform(userProfile.value))
        }
    }

    /**
     * Saves the finished (or abandoned) session as the day's log. Levels never advance automatically:
     * like web and iOS, the user picks their level once they have completed it enough times.
     */
    fun addSession(session: WorkoutSession) {
        viewModelScope.launch {
            repository.saveWorkoutLog(WorkoutLog.fromSession(session))
        }
    }

    fun clearData() {
        viewModelScope.launch {
            repository.clearHistory()
        }
    }

    // ── Calendar ────────────────────────────────────────────────────────────────

    fun getDayState(date: LocalDate): DayState =
        Schedule.dayState(date, workoutSessions.value, userProfile.value.workoutDays, LocalDate.now())

    fun generateCalendarDays(month: LocalDate): List<CalendarDay> =
        Schedule.calendarGrid(month).map { CalendarDay(date = it, state = getDayState(it)) }

    // ── Export ──────────────────────────────────────────────────────────────────

    fun exportCSV(): String {
        val sb = StringBuilder("Date,Level,Mode,Reps Completed,Completed\n")
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE
        workoutSessions.value.sortedBy { it.date }.forEach { s ->
            sb.append("${s.date.toLocalDate().format(formatter)},")
            sb.append("${s.levelID},")
            sb.append("${s.workoutMode.shortName},")
            sb.append("${s.repsCompleted},")
            sb.append(if (s.completed) "Yes" else "No")
            sb.append("\n")
        }
        return sb.toString()
    }
}
