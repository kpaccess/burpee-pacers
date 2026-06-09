package com.burpeepacer.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.burpeepacer.app.data.DataRepository
import com.burpeepacer.app.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class AppViewModel(private val repository: DataRepository) : ViewModel() {

    val userProfile = repository.userProfileFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), 
        UserProfile(LocalDate.now(), 75.0, true, ProgramTrack.BEGINNER, "B1")
    )

    val workoutHistory = repository.workoutHistoryFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val currentLevel: StateFlow<Level> = userProfile.map { profile ->
        val levels = LevelDatabase.getLevels(profile.currentTrack)
        levels.find { it.id == profile.currentLevelID } ?: levels[0]
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), LevelDatabase.beginnerLevels[0])

    val milestoneDate: Flow<LocalDate> = userProfile.map { it.startDate.plusMonths(6) }
    
    val daysToMilestone: Flow<Long> = milestoneDate.map { 
        java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), it) 
    }

    val isMilestoneReached: Flow<Boolean> = daysToMilestone.map { it <= 0 }

    val programStatusText: Flow<String> = userProfile.map { profile ->
        val days = java.time.temporal.ChronoUnit.DAYS.between(profile.startDate, LocalDate.now())
        "Day ${maxOf(1, days + 1)} • Busy People Program"
    }

    val todayFinisher: Flow<Finisher?> = userProfile.map { profile ->
        FinisherDatabase.getFinisher(LocalDate.now().dayOfWeek, profile.ageBracket, profile.equipment)
    }

    val todayWeightedDay: Flow<com.burpeepacer.app.model.WeightedTrainingDay?> = userProfile.map { profile ->
        if (profile.weightedTrainingEnabled) com.burpeepacer.app.model.WeightedTrainingPlan.today() else null
    }

    fun updateWeight(weight: Double) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(currentWeight = weight))
        }
    }

    fun toggleWeightUnit() {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(useKilograms = !current.useKilograms))
        }
    }

    fun updateTrack(track: ProgramTrack) {
        viewModelScope.launch {
            val current = userProfile.value
            val levelId = if (track == ProgramTrack.BEGINNER) "B1" else "1B"
            repository.updateUserProfile(current.copy(currentTrack = track, currentLevelID = levelId))
        }
    }

    fun updateLevel(levelID: String) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(currentLevelID = levelID))
        }
    }

    fun updateAgeBracket(ageBracket: AgeBracket) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(ageBracket = ageBracket))
        }
    }

    fun updateEquipment(equipment: Equipment) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(equipment = equipment))
        }
    }

    fun toggleWeightedTraining() {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(weightedTrainingEnabled = !current.weightedTrainingEnabled))
        }
    }

    fun updateDay1Photo(uri: String) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(day1PhotoUri = uri))
        }
    }

    fun updateSixMonthPhoto(uri: String) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(sixMonthPhotoUri = uri))
        }
    }

    fun setLoggedIn(loggedIn: Boolean) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(isLoggedIn = loggedIn))
        }
    }

    fun setPro(isPro: Boolean) {
        viewModelScope.launch {
            val current = userProfile.value
            repository.updateUserProfile(current.copy(isPro = isPro))
        }
    }

    fun addSession(session: WorkoutSession) {
        viewModelScope.launch {
            repository.saveWorkoutSession(session)
            // Check for level advancement
            val level = currentLevel.value
            if (session.completed && session.repsCompleted >= level.getGoal(session.workoutMode)) {
                advanceLevel()
            }
        }
    }

    private suspend fun advanceLevel() {
        val profile = userProfile.value
        val levels = LevelDatabase.getLevels(profile.currentTrack)
        val currentIndex = levels.indexOfFirst { it.id == profile.currentLevelID }
        if (currentIndex != -1 && currentIndex < levels.size - 1) {
            val nextLevel = levels[currentIndex + 1]
            repository.updateUserProfile(profile.copy(currentLevelID = nextLevel.id))
        }
    }

    fun clearData() {
        viewModelScope.launch {
            repository.clearHistory()
        }
    }

    fun getDayState(date: LocalDate): DayState {
        val sessions = workoutHistory.value.filter { it.date.toLocalDate() == date }
        
        // Workout days: Mon, Wed, Fri (1, 3, 5)
        val dayOfWeek = date.dayOfWeek.value
        val isWorkoutDay = dayOfWeek == 1 || dayOfWeek == 3 || dayOfWeek == 5

        if (!isWorkoutDay) return DayState.Rest
        if (date.isAfter(LocalDate.now())) return DayState.Scheduled
        
        if (sessions.isNotEmpty()) {
            val bestSession = sessions.maxByOrNull { it.repsCompleted }!!
            return DayState.Completed(bestSession.repsCompleted, bestSession.levelID, bestSession.workoutMode)
        }

        if (date.isBefore(LocalDate.now())) return DayState.Missed
        
        return DayState.Scheduled
    }

    fun generateCalendarDays(month: LocalDate): List<CalendarDay> {
        val firstDayOfMonth = month.withDayOfMonth(1)
        val lastDayOfMonth = month.withDayOfMonth(month.lengthOfMonth())
        
        // Find the start of the grid (Sunday before or on the 1st)
        // In java.time, Monday is 1, Sunday is 7.
        // We want Sunday (7) to be index 0 of the grid.
        var startOfGrid = firstDayOfMonth
        while (startOfGrid.dayOfWeek.value != 7) {
            startOfGrid = startOfGrid.minusDays(1)
        }
        
        // End of grid (Saturday after or on the last day)
        var endOfGrid = lastDayOfMonth
        while (endOfGrid.dayOfWeek.value != 6) {
            endOfGrid = endOfGrid.plusDays(1)
        }
        
        val days = mutableListOf<CalendarDay>()
        var current = startOfGrid
        while (!current.isAfter(endOfGrid)) {
            days.add(CalendarDay(date = current, state = getDayState(current)))
            current = current.plusDays(1)
        }
        return days
    }

    fun exportCSV(): String {
        val sb = StringBuilder()
        sb.append("Date,Level,Mode,Reps Completed,Completed\n")
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
        workoutHistory.value.sortedBy { it.date }.forEach { s ->
            sb.append("${s.date.format(formatter)},")
            sb.append("${s.levelID},")
            sb.append("${s.workoutMode.name},")
            sb.append("${s.repsCompleted},")
            sb.append(if (s.completed) "Yes" else "No")
            sb.append("\n")
        }
        return sb.toString()
    }
}
