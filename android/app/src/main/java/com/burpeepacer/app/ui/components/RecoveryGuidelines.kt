package com.burpeepacer.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class Exercise(
    val id: Int,
    val name: String,
    val duration: String,
    val description: String,
    val color: Color
)

@Composable
fun RecoveryGuidelines() {
    var expanded by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableStateOf(0) } // 0 for Warm-up, 1 for Cool-down

    val warmupExercises = listOf(
        Exercise(1, "Arm Circles", "30 sec each direction", "Start small, gradually widen the circles", Color(0xFF4ADE80)),
        Exercise(2, "Shoulder Rolls", "10 reps forward, 10 backward", "Roll shoulders fully — up, back, down, forward", Color(0xFF4ADE80)),
        Exercise(3, "Hip Circles", "10 reps each direction", "Hands on hips, draw wide circles with your pelvis", Color(0xFF4ADE80)),
        Exercise(4, "Bodyweight Squats", "10 reps", "Slow and controlled — feel your hips and knees open up", Color(0xFF4ADE80)),
        Exercise(5, "Step-Back Walkouts", "8 reps", "Step back, walk hands out to plank, walk back, stand up", Color(0xFF4ADE80)),
        Exercise(6, "Light Jogging / Marching in Place", "1–2 minutes", "Raise your knees, swing your arms — get your heart rate up", Color(0xFF4ADE80))
    )

    val cooldownExercises = listOf(
        Exercise(1, "Slow Walking", "2–3 minutes", "Keep moving — don't sit down immediately after a workout", Color(0xFF60A5FA)),
        Exercise(2, "Chest Stretch", "30 sec each side", "Clasp hands behind back, open chest, look slightly up", Color(0xFF60A5FA)),
        Exercise(3, "Shoulder Stretch", "30 sec each side", "Pull arm across chest, keep shoulder relaxed and down", Color(0xFF60A5FA)),
        Exercise(4, "Child's Pose", "60 seconds", "Arms extended forward, breathe deeply into your lower back", Color(0xFF60A5FA)),
        Exercise(5, "Hip Flexor Stretch", "30 sec each side", "Kneel on one knee, push hips forward — feel the front of your hip", Color(0xFF60A5FA)),
        Exercise(6, "Deep Breathing", "5 slow breaths", "In for 4 counts, hold 2, out for 6 — activate your rest response", Color(0xFF60A5FA))
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "📇", // Placeholder for the icon in screenshot
                        fontSize = 20.sp,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text(
                        text = "Warm-up, Cool-down & Recovery",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF60A5FA)
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = Color.White
                )
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Text(
                        text = "A 5-minute warm-up reduces injury risk. A 5–10 minute cool-down speeds recovery. Build the habit — it compounds over 6 months.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA1A1AA),
                        lineHeight = 18.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Custom Tab Switcher
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFF27272A))
                            .padding(4.dp)
                    ) {
                        TabItem(
                            text = "Warm-up (5–8 min)",
                            isSelected = selectedTab == 0,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedTab = 0 }
                        )
                        TabItem(
                            text = "Cool-down (5–10 min)",
                            isSelected = selectedTab == 1,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedTab = 1 }
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    val exercises = if (selectedTab == 0) warmupExercises else cooldownExercises
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        exercises.forEach { exercise ->
                            ExerciseItem(exercise)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Recovery Tip
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "RECOVERY TIP (OPTIONAL)",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFA1A1AA)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "A warm Epsom salt bath (1–2 cups in warm water, 15–20 minutes) can help relax muscles after a session.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFD1D5DB)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TabItem(text: String, isSelected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) Color(0xFF52525B) else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = if (isSelected) Color.White else Color(0xFFA1A1AA),
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )
    }
}

@Composable
fun ExerciseItem(exercise: Exercise) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF27272A))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Text(
                text = "${exercise.id}.",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = exercise.color,
                modifier = Modifier.width(28.dp)
            )
            Column {
                Text(
                    text = exercise.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = exercise.duration,
                    style = MaterialTheme.typography.labelSmall,
                    color = exercise.color
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = exercise.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFA1A1AA),
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }
        }
    }
}
