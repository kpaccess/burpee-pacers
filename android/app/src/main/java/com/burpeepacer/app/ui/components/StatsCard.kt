package com.burpeepacer.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.burpeepacer.app.model.AgeBracket
import com.burpeepacer.app.model.Equipment
import com.burpeepacer.app.model.ProgramTrack
import com.burpeepacer.app.model.UserProfile

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatsCard(
    profile: UserProfile,
    daysToMilestone: Long,
    isMilestoneReached: Boolean,
    onWeightChange: (Double) -> Unit,
    onUnitToggle: () -> Unit,
    onTrackChange: (ProgramTrack) -> Unit,
    onAgeBracketChange: (AgeBracket) -> Unit,
    onEquipmentChange: (Equipment) -> Unit,
    onWeightedTrainingToggle: () -> Unit = {}
) {
    var showWeightDialog by remember { mutableStateOf(false) }
    var weightInput by remember { mutableStateOf(profile.weightDisplay.toString()) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = profile.startDate.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Text(
                        text = "START DATE",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { 
                        weightInput = "%.1f".format(profile.weightDisplay)
                        showWeightDialog = true 
                    }
                ) {
                    Text(
                        text = "%.1f".format(profile.weightDisplay),
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        onClick = onUnitToggle,
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                    ) {
                        Text(
                            if (profile.useKilograms) "kg" else "lbs",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Milestone countdown
            if (!isMilestoneReached && daysToMilestone > 0) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🚩", fontSize = 14.sp)
                    Text(
                        text = "$daysToMilestone days until 6-month check-in",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFF59E0B),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(16.dp))

            // Protein & Track
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "${profile.proteinTarget.toInt()}g",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "DAILY PROTEIN",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    SingleChoiceSegmentedButtonRow {
                        SegmentedButton(
                            selected = profile.currentTrack == ProgramTrack.BEGINNER,
                            onClick = { onTrackChange(ProgramTrack.BEGINNER) },
                            shape = RoundedCornerShape(topStart = 8.dp, bottomStart = 8.dp)
                        ) {
                            Text("Beginner")
                        }
                        SegmentedButton(
                            selected = profile.currentTrack == ProgramTrack.ADVANCED,
                            onClick = { onTrackChange(ProgramTrack.ADVANCED) },
                            shape = RoundedCornerShape(topEnd = 8.dp, bottomEnd = 8.dp)
                        ) {
                            Text("Advanced")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(16.dp))

            // Age & Equipment Selection
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Age Bracket
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Age Bracket", style = MaterialTheme.typography.bodyMedium)
                    SingleChoiceSegmentedButtonRow {
                        AgeBracket.values().forEachIndexed { index, bracket ->
                            SegmentedButton(
                                selected = profile.ageBracket == bracket,
                                onClick = { onAgeBracketChange(bracket) },
                                shape = when (index) {
                                    0 -> RoundedCornerShape(topStart = 8.dp, bottomStart = 8.dp)
                                    AgeBracket.values().size - 1 -> RoundedCornerShape(topEnd = 8.dp, bottomEnd = 8.dp)
                                    else -> RoundedCornerShape(0.dp)
                                }
                            ) {
                                Text(bracket.displayName, fontSize = 10.sp)
                            }
                        }
                    }
                }

                // Equipment
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Equipment", style = MaterialTheme.typography.bodyMedium)
                    SingleChoiceSegmentedButtonRow {
                        Equipment.values().forEachIndexed { index, equipment ->
                            SegmentedButton(
                                selected = profile.equipment == equipment,
                                onClick = { onEquipmentChange(equipment) },
                                shape = when (index) {
                                    0 -> RoundedCornerShape(topStart = 8.dp, bottomStart = 8.dp)
                                    Equipment.values().size - 1 -> RoundedCornerShape(topEnd = 8.dp, bottomEnd = 8.dp)
                                    else -> RoundedCornerShape(0.dp)
                                }
                            ) {
                                Text(equipment.displayName, fontSize = 10.sp)
                            }
                        }
                    }
                }

                // Weighted Training toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Weighted Training", style = MaterialTheme.typography.bodyMedium)
                    Switch(
                        checked = profile.weightedTrainingEnabled,
                        onCheckedChange = { onWeightedTrainingToggle() },
                        colors = SwitchDefaults.colors(
                            checkedTrackColor = Color(0xFFFF9800)
                        )
                    )
                }
            }
        }
    }

    if (showWeightDialog) {
        AlertDialog(
            onDismissRequest = { showWeightDialog = false },
            title = { Text("Update Weight") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = weightInput,
                        onValueChange = { weightInput = it },
                        label = { Text("Weight (${if (profile.useKilograms) "kg" else "lbs"})") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                            keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal
                        )
                    )
                    Text(
                        "Used to calculate your daily protein target.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val value = weightInput.toDoubleOrNull()
                    if (value != null && value > 0) {
                        val weightKg = if (profile.useKilograms) value else value / 2.20462
                        onWeightChange(weightKg)
                        showWeightDialog = false
                    }
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showWeightDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
