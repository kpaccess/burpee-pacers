package com.burpeepacer.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Intent
import androidx.compose.ui.platform.LocalContext
import com.burpeepacer.app.model.FinisherDatabase
import com.burpeepacer.app.model.LevelDatabase
import com.burpeepacer.app.ui.components.*
import com.burpeepacer.app.viewmodel.AppViewModel

@Composable
fun DashboardScreen(
    viewModel: AppViewModel,
    onStartWorkout: () -> Unit,
    onLogout: () -> Unit
) {
    val userProfile by viewModel.userProfile.collectAsState()
    val currentLevel by viewModel.currentLevel.collectAsState()
    val statusText by viewModel.programStatusText.collectAsState("")
    val hasProAccess by viewModel.hasProAccess.collectAsState(false)
    val nextLevel by viewModel.nextLevel.collectAsState(null)
    val qualifyingSessions by viewModel.currentLevelQualifyingSessions.collectAsState(0)
    val streak by viewModel.workoutStreak.collectAsState(0)
    val nextScheduledLabel by viewModel.nextScheduledLabel.collectAsState(null)
    val finisher by viewModel.todayFinisher.collectAsState(
        FinisherDatabase.getFinisher(java.time.LocalDate.now().dayOfWeek, userProfile.ageBracket, userProfile.equipment)
    )
    val context = LocalContext.current
    val weightedDay by viewModel.todayWeightedDay.collectAsState(null)
    val daysToMilestone by viewModel.daysToMilestone.collectAsState(0L)
    val isMilestoneReached by viewModel.isMilestoneReached.collectAsState(false)

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            DashboardHeader(
                statusText = statusText,
                hasProAccess = hasProAccess,
                onReset = { viewModel.clearData() },
                onLogout = {
                    viewModel.setLoggedIn(false)
                    onLogout()
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            if (viewModel.isLaunchAccessEnabled) {
                item { LaunchAccessCard() }
            } else if (!hasProAccess) {
                item { RestrictedAccessCard() }
            }

            item {
                StatsCard(
                    profile = userProfile,
                    daysToMilestone = daysToMilestone,
                    isMilestoneReached = isMilestoneReached,
                    onWeightChange = { viewModel.updateWeight(it) },
                    onUnitToggle = { viewModel.toggleWeightUnit() },
                    onTrackChange = { viewModel.updateTrack(it) },
                    onAgeBracketChange = { viewModel.updateAgeBracket(it) },
                    onEquipmentChange = { viewModel.updateEquipment(it) },
                    onWeightedTrainingToggle = { viewModel.toggleWeightedTraining() }
                )
            }

            item {
                WorkoutDaysCard(
                    selectedDays = userProfile.workoutDays,
                    onToggle = { viewModel.toggleWorkoutDay(it) }
                )
            }

            item {
                LevelCard(
                    level = currentLevel,
                    nextLevel = nextLevel,
                    levels = LevelDatabase.getLevels(userProfile.currentTrack),
                    qualifyingSessions = qualifyingSessions,
                    qualifyingRequired = viewModel.qualifyingSessionsRequired,
                    isWorkoutDay = viewModel.isWorkoutDay(),
                    workoutStreak = streak,
                    nextScheduledLabel = nextScheduledLabel,
                    finisher = finisher,
                    onChangeLevel = { viewModel.updateLevel(it) },
                    onStartWorkout = onStartWorkout
                )
            }

            item {
                CalendarSection(
                    viewModel = viewModel
                )
            }

            weightedDay?.let { day ->
                item {
                    WeightedTrainingCard(day = day)
                }
            }

            item {
                ProgressPhotosSection(
                    daysSinceStart = userProfile.daysSinceStart,
                    day1PhotoUri = userProfile.day1PhotoUri?.let { android.net.Uri.parse(it) },
                    sixMonthPhotoUri = userProfile.sixMonthPhotoUri?.let { android.net.Uri.parse(it) },
                    onDay1PhotoSelected = { viewModel.updateDay1Photo(it.toString()) },
                    onSixMonthPhotoSelected = { viewModel.updateSixMonthPhoto(it.toString()) }
                )
            }

            item {
                Button(
                    onClick = {
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "BurpeePacers workout history.csv")
                            putExtra(Intent.EXTRA_TEXT, viewModel.exportCSV())
                        }
                        context.startActivity(Intent.createChooser(send, "Export Workout Data"))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Export History (CSV)", color = MaterialTheme.colorScheme.onSurface)
                }
            }

            item {
                RecoveryGuidelines()
            }

            item {
                RestRuleCard()
            }
            
            item {
                Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}

@Composable
fun DashboardHeader(
    statusText: String,
    hasProAccess: Boolean,
    onReset: () -> Unit,
    onLogout: () -> Unit
) {
    var showResetDialog by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )
                if (hasProAccess) {
                    Surface(
                        color = Color(0xFFFACC15), // Gold
                        shape = RoundedCornerShape(4.dp),
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Text(
                            "PRO",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.Black,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }
            }
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box {
                IconButton(onClick = { showMenu = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = MaterialTheme.colorScheme.secondary)
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Reset Program") },
                        onClick = { 
                            showMenu = false
                            showResetDialog = true 
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Sign Out") },
                        onClick = { 
                            showMenu = false
                            onLogout()
                        }
                    )
                }
            }
        }
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = { Text("Reset Program?") },
            text = { Text("This will clear all your progress and history. This action cannot be undone.") },
            confirmButton = {
                TextButton(onClick = { 
                    onReset()
                    showResetDialog = false 
                }) {
                    Text("Reset", color = MaterialTheme.colorScheme.primary)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

/** Shown while the shared config has launch access on (same message as iOS). */
@Composable
fun LaunchAccessCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF3B82F6).copy(alpha = 0.08f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("LAUNCH ACCESS ACTIVE", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 2.sp, color = Color(0xFF3B82F6))
            Text("Full access follows the web launch settings", style = MaterialTheme.typography.titleSmall)
            Text(
                "During launch, Android access is open to match the web app.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}

@Composable
fun RestrictedAccessCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.08f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("ACCOUNT ACCESS REQUIRED", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 2.sp, color = Color(0xFFEF4444))
            Text("Your BurpeePacers account does not currently have full access.", style = MaterialTheme.typography.titleSmall)
            Text(
                "Access is managed by your BurpeePacers account status so Android stays aligned with the web app.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}
