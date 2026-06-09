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
import com.burpeepacer.app.model.ProgramTrack
import com.burpeepacer.app.model.WeightedTrainingDay
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
    val finisher by viewModel.todayFinisher.collectAsState(null)
    val weightedDay by viewModel.todayWeightedDay.collectAsState(null)
    val daysToMilestone by viewModel.daysToMilestone.collectAsState(0L)
    val isMilestoneReached by viewModel.isMilestoneReached.collectAsState(false)

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            DashboardHeader(
                statusText = statusText,
                isPro = userProfile.isPro,
                onReset = { viewModel.clearData() },
                onUpgrade = { viewModel.setPro(true) },
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
                LevelCard(
                    level = currentLevel,
                    finisher = finisher,
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
                        val csv = viewModel.exportCSV()
                        // In a real app, you'd trigger a Share Intent here
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
                Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}

@Composable
fun DashboardHeader(
    statusText: String,
    isPro: Boolean,
    onReset: () -> Unit,
    onUpgrade: () -> Unit,
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
                if (isPro) {
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
            if (!isPro) {
                TextButton(onClick = onUpgrade) {
                    Text("UPGRADE", color = Color(0xFFFACC15), fontWeight = FontWeight.Bold)
                }
            }
            
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
