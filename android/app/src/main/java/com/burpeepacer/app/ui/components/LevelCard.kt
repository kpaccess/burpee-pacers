package com.burpeepacer.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.burpeepacer.app.model.Finisher
import com.burpeepacer.app.model.Level

/** Current level, progress toward moving up, and the Start button (workout days) or rest-day card. */
@Composable
fun LevelCard(
    level: Level,
    nextLevel: Level?,
    levels: List<Level>,
    qualifyingSessions: Int,
    qualifyingRequired: Int,
    isWorkoutDay: Boolean,
    workoutStreak: Int,
    nextScheduledLabel: String?,
    finisher: Finisher,
    onChangeLevel: (String) -> Unit,
    onStartWorkout: () -> Unit
) {
    var showLevelPicker by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "CURRENT LEVEL",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary
                )
                Text(
                    text = level.displayName,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = level.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.secondary
                )
                TextButton(onClick = { showLevelPicker = true }, contentPadding = PaddingValues(0.dp)) {
                    Text("Change Level", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                }

                // Web/iOS don't auto-advance: recommend repeating a level before moving up.
                val shown = qualifyingSessions.coerceAtMost(qualifyingRequired)
                Text(
                    text = "$shown of $qualifyingRequired sessions completed",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                LinearProgressIndicator(
                    progress = { shown.toFloat() / qualifyingRequired.coerceAtLeast(1) },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.tertiary
                )
                Text(
                    text = nextLevel?.let { "Next: ${it.displayName} — ${it.description}" }
                        ?: "You've reached the top of this training track.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary
                )

                if (isWorkoutDay) {
                    Button(
                        onClick = onStartWorkout,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("START WORKOUT", fontWeight = FontWeight.Bold)
                    }
                } else {
                    RestDayCard(streak = workoutStreak, nextScheduledLabel = nextScheduledLabel)
                }
            }
        }

        FinisherCard(finisher)
    }

    if (showLevelPicker) {
        LevelPickerDialog(
            levels = levels,
            currentLevelId = level.id,
            onSelect = {
                onChangeLevel(it)
                showLevelPicker = false
            },
            onDismiss = { showLevelPicker = false }
        )
    }
}

@Composable
private fun LevelPickerDialog(
    levels: List<Level>,
    currentLevelId: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Level") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(levels, key = { it.id }) { lvl ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(lvl.id) }
                            .padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(lvl.displayName, fontWeight = FontWeight.Bold)
                            Text(
                                lvl.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }
                        if (lvl.id == currentLevelId) {
                            Icon(Icons.Default.CheckCircle, contentDescription = "Current", tint = MaterialTheme.colorScheme.tertiary)
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

/** Shown instead of the Start button when today isn't a workout day (mirrors the web/iOS rest-day card). */
@Composable
fun RestDayCard(streak: Int, nextScheduledLabel: String?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFF3366).copy(alpha = 0.10f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                "YOU'RE ON TRACK",
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 2.sp,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                "$streak-day streak, safe and sound",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                "Rest is part of the plan. Recharge today and come back stronger.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
            Surface(
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Text(
                    "Next up · ${nextScheduledLabel ?: "Choose your next workout day"}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
fun FinisherCard(finisher: Finisher) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "TODAY'S STRENGTH FINISHER",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = finisher.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Column {
                    Text("WORKOUT", fontSize = 10.sp, color = Color(0xFFA1A1AA))
                    Text(finisher.sets, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 14.sp)
                }
                Column {
                    Text("FOCUS", fontSize = 10.sp, color = Color(0xFFA1A1AA))
                    Text(finisher.focus, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 14.sp)
                }
            }
            Text(
                text = "Complete this after your burpees to maintain muscle and bone density.",
                fontSize = 11.sp,
                color = Color(0xFF71717A)
            )
        }
    }
}

/** Weekday picker (Sun…Sat). At least one day must stay selected. Weekdays use Sunday = 1 … Saturday = 7. */
@Composable
fun WorkoutDaysCard(
    selectedDays: Set<Int>,
    onToggle: (Int) -> Unit
) {
    val labels = listOf("S", "M", "T", "W", "T", "F", "S")
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                "WORKOUT DAYS",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.secondary
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                labels.forEachIndexed { index, label ->
                    val weekday = index + 1
                    FilterChip(
                        selected = weekday in selectedDays,
                        onClick = { onToggle(weekday) },
                        label = { Text(label) }
                    )
                }
            }
            Text(
                "Rest at least 48 hours between sessions when you can.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}

/** "48-Hour Rest Rule" reminder, same copy as iOS. */
@Composable
fun RestRuleCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF59E0B).copy(alpha = 0.10f))
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("48-Hour Rest Rule", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text(
                "Always rest at least 48 hours between sessions for optimal recovery and muscle growth.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}
