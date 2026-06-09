package com.burpeepacer.app.ui.components

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

@Composable
fun ProgressPhotosSection(
    daysSinceStart: Long,
    day1PhotoUri: Uri?,
    sixMonthPhotoUri: Uri?,
    onDay1PhotoSelected: (Uri) -> Unit,
    onSixMonthPhotoSelected: (Uri) -> Unit
) {
    val isSixMonthUnlocked = daysSinceStart >= 180
    val context = LocalContext.current

    val day1Launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri -> uri?.let { onDay1PhotoSelected(it) } }
    )

    val sixMonthLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri -> uri?.let { onSixMonthPhotoSelected(it) } }
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF18181B))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("🖼️", fontSize = 20.sp)
                Text(
                    text = "Progress Photos",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                // Day 1 Photo
                PhotoBox(
                    title = "Day 1 Baseline",
                    uri = day1PhotoUri,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        day1Launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }
                )

                // 6-Month Photo
                PhotoBox(
                    title = "6-Month Check-in",
                    uri = sixMonthPhotoUri,
                    modifier = Modifier.weight(1f),
                    isLocked = !isSixMonthUnlocked,
                    daysRemaining = 180 - daysSinceStart,
                    onClick = {
                        if (isSixMonthUnlocked) {
                            sixMonthLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun PhotoBox(
    title: String,
    uri: Uri?,
    modifier: Modifier = Modifier,
    isLocked: Boolean = false,
    daysRemaining: Long = 0,
    onClick: () -> Unit
) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (isLocked) Color(0xFF27272A) else Color(0xFF3F3F46))
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            if (isLocked) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFFA1A1AA), modifier = Modifier.size(32.dp))
                    Text("Locked", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFA1A1AA))
                    Text("$daysRemaining days to go", fontSize = 10.sp, color = Color(0xFFA1A1AA))
                }
            } else if (uri != null) {
                AsyncImage(
                    model = uri,
                    contentDescription = title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = Color(0xFFA1A1AA), modifier = Modifier.size(32.dp))
                    Text("Add Photo", fontSize = 12.sp, color = Color(0xFFA1A1AA))
                }
            }
        }
        Text(title, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
    }
}
