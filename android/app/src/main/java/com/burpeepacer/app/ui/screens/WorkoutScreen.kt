package com.burpeepacer.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.burpeepacer.app.ui.components.ProgressRing
import com.burpeepacer.app.viewmodel.AppViewModel
import com.burpeepacer.app.viewmodel.WorkoutViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.burpeepacer.app.model.WorkoutMode
import com.burpeepacer.app.model.ProgramTrack
import java.time.LocalDate

@Composable
fun WorkoutScreen(
    appViewModel: AppViewModel,
    onClose: () -> Unit
) {
    val currentLevel by appViewModel.currentLevel.collectAsState()
    val userProfile by appViewModel.userProfile.collectAsState()
    
    val workoutViewModel: WorkoutViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val dayOfWeek = LocalDate.now().dayOfWeek.value
                val defaultMode = if (userProfile.currentTrack == ProgramTrack.ADVANCED) {
                    when (dayOfWeek) {
                        1 -> WorkoutMode.NAVY_SEALS
                        3 -> WorkoutMode.FIVE_COUNT
                        5 -> WorkoutMode.HYBRID
                        else -> WorkoutMode.NAVY_SEALS
                    }
                } else {
                    WorkoutMode.FIVE_COUNT
                }
                
                return WorkoutViewModel(currentLevel, defaultMode) as T
            }
        }
    )

    val timeRemaining by workoutViewModel.timeRemaining.collectAsState()
    val isRunning by workoutViewModel.isRunning.collectAsState()
    val isFinished by workoutViewModel.isFinished.collectAsState()
    val currentReps by workoutViewModel.currentReps.collectAsState()
    val countdown by workoutViewModel.countdownRemaining.collectAsState()
    val currentMode by workoutViewModel.workoutMode.collectAsState()
    val isNearRepBoundary by workoutViewModel.isNearRepBoundary.collectAsState()
    val isIdle = workoutViewModel.isIdle

    var showWarmupPrompt by remember { mutableStateOf(false) }
    var warmupChecked by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = Color(0xFF09090B),
            topBar = {
                WorkoutHeader(
                    levelName = "${currentLevel.displayName} (${currentMode.getDisplayName(userProfile.currentTrack)})",
                    onClose = {
                        if (workoutViewModel.hasEverStarted) {
                            appViewModel.addSession(workoutViewModel.createSession())
                        }
                        onClose()
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Mode Picker (Advanced only)
                if (userProfile.currentTrack == ProgramTrack.ADVANCED) {
                    WorkoutModePicker(
                        selectedMode = currentMode,
                        availableModes = currentLevel.availableModes,
                        enabled = !isRunning && countdown == null && !workoutViewModel.hasEverStarted,
                        onModeSelected = { /* workoutViewModel.setMode(it) - need to add this to VM if wanted, but currently fixed in factory */ }
                    )
                }

                // Hybrid Phase Header
                if (workoutViewModel.isHybrid) {
                    HybridPhaseHeader(
                        phaseIndex = workoutViewModel.hybridPhaseIndex,
                        phaseLabels = currentLevel.hybridPhaseLabels,
                        phaseGoals = listOf(currentLevel.sealsGoal / 2 + (currentLevel.sealsGoal % 2), currentLevel.sixCountsGoal / 2 + (currentLevel.sixCountsGoal % 2)),
                        totalRemaining = workoutViewModel.formatTime(timeRemaining)
                    )
                }

                // Timer & Progress Ring
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .clickable {
                            if (isRunning) workoutViewModel.incrementRep()
                            else if (isIdle) {
                                if (!warmupChecked) showWarmupPrompt = true
                                else workoutViewModel.startTimer()
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    ProgressRing(
                        progress = workoutViewModel.progress,
                        timeProgress = workoutViewModel.timeProgress,
                        color = if (isNearRepBoundary) Color.Red else if (timeRemaining < 60) Color(0xFFDC2626) else Color(0xFF4ADE80)
                    )

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = workoutViewModel.formatTime(workoutViewModel.currentPhaseTimeRemaining),
                            fontSize = 52.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (timeRemaining < 60) Color(0xFFDC2626) else Color.White
                        )
                        Text(
                            text = if (workoutViewModel.isHybrid) "PHASE ${workoutViewModel.hybridPhaseIndex + 1} · ${workoutViewModel.hybridPhaseLabel.uppercase()}" else "TIME REMAINING",
                            fontSize = 10.sp,
                            color = Color(0xFFA1A1AA),
                            fontWeight = FontWeight.Medium,
                            letterSpacing = 1.sp
                        )
                    }
                }

                // Pacer Chip
                if (isRunning) {
                    PacerChip(
                        text = workoutViewModel.repPaceGuideText,
                        isNearBoundary = isNearRepBoundary
                    )
                }

                // Rep Counter
                RepCounterSection(
                    currentReps = currentReps,
                    goal = workoutViewModel.currentPhaseGoal,
                    isCompleted = workoutViewModel.isCompleted,
                    onIncrement = { workoutViewModel.incrementRep() },
                    onDecrement = { workoutViewModel.decrementRep() }
                )

                // Controls
                if (showWarmupPrompt) {
                    WarmupPrompt(
                        onStart = {
                            warmupChecked = true
                            showWarmupPrompt = false
                            workoutViewModel.startTimer()
                        },
                        onShowGuidelines = { /* Navigation to guidelines */ }
                    )
                } else if (isFinished) {
                    CooldownBanner(
                        onSave = {
                            appViewModel.addSession(workoutViewModel.createSession())
                            onClose()
                        },
                        onShowGuidelines = { /* Navigation to guidelines */ }
                    )
                } else {
                    WorkoutControls(
                        isRunning = isRunning,
                        canStart = !isFinished,
                        onStart = {
                            if (!warmupChecked) showWarmupPrompt = true
                            else workoutViewModel.startTimer()
                        },
                        onPause = { workoutViewModel.pauseTimer() },
                        onReset = {
                            warmupChecked = false
                            showWarmupPrompt = false
                            workoutViewModel.resetTimer()
                        }
                    )
                }

                // Tutorial Link
                TutorialLink(
                    url = currentLevel.tutorialURL,
                    isBeginner = userProfile.currentTrack == ProgramTrack.BEGINNER
                )

                Spacer(modifier = Modifier.weight(1f))
            }
        }

        // Countdown Overlay
        if (countdown != null) {
            CountdownOverlay(countdown!!)
        }
    }
}

@Composable
fun WorkoutModePicker(
    selectedMode: WorkoutMode,
    availableModes: List<WorkoutMode>,
    enabled: Boolean,
    onModeSelected: (WorkoutMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFF27272A))
            .padding(4.dp)
    ) {
        availableModes.forEach { mode ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (selectedMode == mode) Color(0xFF52525B) else Color.Transparent)
                    .clickable(enabled = enabled) { onModeSelected(mode) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = mode.getDisplayName(ProgramTrack.ADVANCED),
                    color = if (selectedMode == mode) Color.White else Color(0xFFA1A1AA),
                    fontSize = 12.sp,
                    fontWeight = if (selectedMode == mode) FontWeight.Bold else FontWeight.Normal
                )
            }
        }
    }
}

@Composable
fun HybridPhaseHeader(
    phaseIndex: Int,
    phaseLabels: List<String>,
    phaseGoals: List<Int>,
    totalRemaining: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            PhaseChip(index = 0, label = phaseLabels[0], goal = phaseGoals[0], isActive = phaseIndex == 0)
            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color(0xFFA1A1AA), modifier = Modifier.size(12.dp))
            PhaseChip(index = 1, label = phaseLabels[1], goal = phaseGoals[1], isActive = phaseIndex == 1)
        }
        Text(
            text = "Total remaining: $totalRemaining",
            fontSize = 12.sp,
            color = Color(0xFFA1A1AA)
        )
    }
}

@Composable
fun PhaseChip(index: Int, label: String, goal: Int, isActive: Boolean) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isActive) Color(0xFFDC2626) else Color(0xFF27272A))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Phase ${index + 1}", fontSize = 10.sp, color = if (isActive) Color.White else Color(0xFFA1A1AA))
        Text("$label · $goal reps", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (isActive) Color.White else Color(0xFFA1A1AA))
    }
}

@Composable
fun PacerChip(text: String?, isNearBoundary: Boolean) {
    if (text == null) return
    
    Surface(
        color = if (isNearBoundary) Color.Red else Color(0xFF27272A),
        shape = CircleShape,
        modifier = Modifier.padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = if (isNearBoundary) Icons.Default.Refresh else Icons.Default.PlayArrow,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = Color.White
            )
            Text(
                text = text,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun RepCounterSection(
    currentReps: Int,
    goal: Int,
    isCompleted: Boolean,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
    ) {
        Column(
            modifier = Modifier
                .padding(vertical = 20.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Rep Progress Circle
            Box(contentAlignment = Alignment.Center) {
                // Background Circle
Canvas(modifier = Modifier.size(160.dp)) {
                    drawArc(
                        color = Color(0xFF27272A),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
                // Foreground Progress
                Canvas(modifier = Modifier.size(160.dp)) {
                    drawArc(
                        color = if (isCompleted) Color(0xFF22C55E) else Color(0xFFDC2626),
                        startAngle = -90f,
                        sweepAngle = (currentReps.toFloat() / goal.coerceAtLeast(1) * 360f).coerceAtMost(360f),
                        useCenter = false,
                        style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = currentReps.toString(),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isCompleted) Color(0xFF22C55E) else Color.White
                    )
                    Text(
                        text = "/ $goal",
                        fontSize = 18.sp,
                        color = Color(0xFFA1A1AA),
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onDecrement, enabled = currentReps > 0) {
                    Icon(Icons.Default.Refresh, contentDescription = null, tint = if (currentReps > 0) Color.Red else Color(0xFF3F3F46), modifier = Modifier.size(36.dp))
                }

                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color.Red)
                        .clickable { onIncrement() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
                }

                IconButton(onClick = onIncrement) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Green, modifier = Modifier.size(36.dp))
                }
            }

            Text("TAP TO LOG REP", fontSize = 10.sp, color = Color(0xFFA1A1AA), letterSpacing = 1.sp)
        }
    }
}

@Composable
fun WorkoutControls(
    isRunning: Boolean,
    canStart: Boolean,
    onStart: () -> Unit,
    onPause: () -> Unit,
    onReset: () -> Unit
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        if (isRunning) {
            Button(
                onClick = onPause,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(16.dp)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("PAUSE", fontWeight = FontWeight.Bold)
            }
        } else if (canStart) {
            Button(
                onClick = onStart,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(16.dp)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("START", fontWeight = FontWeight.Bold)
            }
        }

        Button(
            onClick = onReset,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF27272A)),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(16.dp)
        ) {
            Icon(Icons.Default.Refresh, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("RESET", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun WarmupPrompt(onStart: () -> Unit, onShowGuidelines: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFFF59E0B), RoundedCornerShape(12.dp))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Did you warm up?", color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
        Button(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Yes, Start Workout", fontWeight = FontWeight.Bold)
        }
        OutlinedButton(
            onClick = onShowGuidelines,
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(1.dp, Color(0xFFF59E0B)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Show Warm-up", color = Color(0xFFF59E0B))
        }
    }
}

@Composable
fun CooldownBanner(onSave: () -> Unit, onShowGuidelines: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Color(0xFF22C55E), RoundedCornerShape(12.dp))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Great job. Cool down for 5–10 min.", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Save Workout", fontWeight = FontWeight.Bold)
        }
        OutlinedButton(
            onClick = onShowGuidelines,
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(1.dp, Color(0xFF22C55E)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Show Cool-down", color = Color(0xFF22C55E))
        }
    }
}

@Composable
fun TutorialLink(url: String, isBeginner: Boolean) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* Intent to open URL */ },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(if (isBeginner) "Open Beginner Video" else "Open Tutorials", color = Color.White, fontWeight = FontWeight.Bold)
                Text("Learn proper form", color = Color(0xFFA1A1AA), fontSize = 12.sp)
            }
            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color(0xFFA1A1AA), modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
fun CountdownOverlay(value: Int) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = if (value > 0) value.toString() else "GO!",
                fontSize = 120.sp,
                fontWeight = FontWeight.Black,
                color = if (value > 0) Color.White else Color.Yellow
            )
            if (value > 0) {
                Text(
                    text = "GET READY",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp
                )
            }
        }
    }
}

@Composable
fun WorkoutHeader(
    levelName: String,
    onClose: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Workout Session",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFA1A1AA)
            )
            Text(
                text = levelName,
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }

        IconButton(onClick = onClose) {
            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFFA1A1AA))
        }
    }
}
