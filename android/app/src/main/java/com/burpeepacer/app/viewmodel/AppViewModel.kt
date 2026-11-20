package com.burpeepacer.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.burpeepacer.app.data.CloudSync
import com.burpeepacer.app.data.DataRepository
import com.burpeepacer.app.data.RemoteDoc
import com.burpeepacer.app.data.RemoteMapping
import com.burpeepacer.app.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class AppViewModel(
    private val repository: DataRepository,
    private val cloud: CloudSync
) : ViewModel() {

    private val _authError = MutableStateFlow<String?>(null)
    /** Last sign-in problem, shown on the landing screen. */
    val authError = _authError.asStateFlow()

    private val _isSigningIn = MutableStateFlow(false)
    val isSigningIn = _isSigningIn.asStateFlow()

    private val _syncError = MutableStateFlow<String?>(null)
    /** Set when a change couldn't be saved to the account, so it doesn't fail silently. */
    val syncError = _syncError.asStateFlow()

    private val _needsTrackChoice = MutableStateFlow(false)
    /** True for a new account that hasn't picked Beginner or Advanced yet (web/iOS onboarding). */
    val needsTrackChoice = _needsTrackChoice.asStateFlow()

    /** Only push logs once the account's own logs have loaded, so they are never overwritten by an empty local list. */
    private var remoteLoaded = false

    init {
        viewModelScope.launch {
            cloud.uidFlow.collectLatest { uid ->
                remoteLoaded = false
                if (uid == null) {
                    _needsTrackChoice.value = false
                    repository.setLoggedIn(false)
                    return@collectLatest
                }
                repository.setLoggedIn(true)
                cloud.userDocument(uid).collect { doc ->
                    when (doc) {
                        is RemoteDoc.Data -> {
                            val remote = RemoteMapping.parse(doc.fields)
                            _needsTrackChoice.value = remote.track == null
                            repository.applyRemote(remote)
                            remoteLoaded = true
                        }
                        RemoteDoc.Missing -> {
                            runCatching {
                                cloud.createProfile(
                                    RemoteMapping.newUserDocument(LocalDate.now(), cloud.email, cloud.displayName, cloud.providerIds)
                                )
                            }.onFailure { _syncError.value = "Couldn't create your account data: ${it.localizedMessage}" }
                            _needsTrackChoice.value = true
                        }
                        is RemoteDoc.Error -> _syncError.value = doc.message
                    }
                }
            }
        }
    }

    // ── Account ─────────────────────────────────────────────────────────────────

    val isSignInAvailable: Boolean get() = cloud.isConfigured

    fun googleSignInIntent() = cloud.googleSignInIntent()

    fun signInWithGoogle(idToken: String?) {
        if (idToken == null) {
            _authError.value = "Google didn't return a sign-in token. Please try again."
            return
        }
        viewModelScope.launch {
            _isSigningIn.value = true
            _authError.value = null
            runCatching { cloud.signInWithGoogleIdToken(idToken) }
                .onFailure { _authError.value = "Sign-in failed: ${it.localizedMessage}" }
            _isSigningIn.value = false
        }
    }

    fun reportAuthError(message: String) { _authError.value = message }

    fun dismissSyncError() { _syncError.value = null }

    /** Signs out and clears the local copy; the data stays safe in the account. */
    fun signOut() {
        viewModelScope.launch {
            runCatching { cloud.signOut() }
            repository.clearHistory()
        }
    }

    private fun pushToAccount(fields: Map<String, Any>) {
        if (cloud.currentUid == null) return
        viewModelScope.launch {
            runCatching { cloud.update(fields) }
                .onFailure { _syncError.value = "Your change couldn't be saved to your account: ${it.localizedMessage}" }
        }
    }

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

    /** True once today has a completed log, whether it was saved on this device or synced from the web. */
    val hasCompletedToday: Flow<Boolean> = workoutSessions.map { sessions ->
        val today = LocalDate.now()
        sessions.any { it.date.toLocalDate() == today }
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
    fun updateTrack(track: ProgramTrack) {
        val levelId = ProgramCatalog.startingLevel(track).id
        updateProfile { it.copy(currentTrack = track, currentLevelID = levelId) }
        _needsTrackChoice.value = false
        pushToAccount(mapOf("workoutTier" to track.storageValue, "currentLevelId" to levelId))
    }

    fun updateLevel(levelID: String) {
        updateProfile { it.copy(currentLevelID = levelID) }
        pushToAccount(mapOf("currentLevelId" to levelID))
    }

    fun updateAgeBracket(ageBracket: AgeBracket) {
        updateProfile { it.copy(ageBracket = ageBracket) }
        pushToAccount(mapOf("ageBracket" to ageBracket.displayName))
    }

    fun updateEquipment(equipment: Equipment) {
        updateProfile { it.copy(equipment = equipment) }
        pushToAccount(mapOf("equipment" to equipment.displayName))
    }

    fun toggleWeightedTraining() = updateProfile { it.copy(weightedTrainingEnabled = !it.weightedTrainingEnabled) }

    /** Toggles one weekday; at least one workout day must stay selected (as on web). */
    fun toggleWorkoutDay(weekday: Int) {
        val days = userProfile.value.workoutDays
        val newDays = when {
            weekday in days && days.size == 1 -> return
            weekday in days -> days - weekday
            else -> days + weekday
        }
        updateProfile { it.copy(workoutDays = newDays) }
        pushToAccount(mapOf("workoutDays" to newDays.sorted()))
    }

    fun updateDay1Photo(uri: String) = updateProfile { it.copy(day1PhotoUri = uri) }

    fun updateSixMonthPhoto(uri: String) = updateProfile { it.copy(sixMonthPhotoUri = uri) }

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
            val logs = repository.saveWorkoutLog(WorkoutLog.fromSession(session))
            if (cloud.currentUid == null) return@launch
            if (!remoteLoaded) {
                _syncError.value = "Your workout is saved on this phone but couldn't be added to your account yet. Check your connection and finish another workout, or mark the day on the web calendar."
                return@launch
            }
            runCatching { cloud.update(RemoteMapping.logsPayload(logs)) }
                .onFailure { _syncError.value = "Your workout couldn't be saved to your account: ${it.localizedMessage}" }
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
