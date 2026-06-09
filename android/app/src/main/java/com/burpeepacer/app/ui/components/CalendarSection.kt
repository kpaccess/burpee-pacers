package com.burpeepacer.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawWithContent
import com.burpeepacer.app.model.CalendarDay
import com.burpeepacer.app.model.DayState
import com.burpeepacer.app.viewmodel.AppViewModel
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.*

@Composable
fun CalendarSection(
    viewModel: AppViewModel
) {
    var currentMonth by remember { mutableStateOf(LocalDate.now().withDayOfMonth(1)) }
    val days = remember(currentMonth) { viewModel.generateCalendarDays(currentMonth) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${currentMonth.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} ${currentMonth.year}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
            
            Row {
                IconButton(onClick = { currentMonth = currentMonth.minusMonths(1) }) {
                    Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Previous Month")
                }
                IconButton(onClick = { currentMonth = currentMonth.plusMonths(1) }) {
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Next Month")
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Weekday Headers
        Row(modifier = Modifier.fillMaxWidth()) {
            val weekdays = listOf("S", "M", "T", "W", "T", "F", "S")
            weekdays.forEach { day ->
                Text(
                    text = day,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Grid
        val rows = days.chunked(7)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            rows.forEach { row ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    row.forEach { day ->
                        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                            CalendarDayItem(day = day, isCurrentMonth = day.date.month == currentMonth.month)
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        CalendarLegend()
    }
}

@Composable
fun CalendarDayItem(day: CalendarDay, isCurrentMonth: Boolean) {
    val isToday = day.date == LocalDate.now()
    val opacity = if (isCurrentMonth) 1f else 0.3f

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .padding(4.dp)
            .alpha(opacity)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(
                    when (day.state) {
                        is DayState.Completed -> MaterialTheme.colorScheme.tertiary.copy(alpha = 0.2f)
                        DayState.Missed -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                        else -> Color.Transparent
                    }
                )
                .border(
                    width = if (isToday) 2.dp else 0.dp,
                    color = if (isToday) MaterialTheme.colorScheme.primary else Color.Transparent,
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = day.date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = when (day.state) {
                    is DayState.Completed -> MaterialTheme.colorScheme.tertiary
                    DayState.Missed -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onBackground
                },
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal
            )
        }
        
        if (day.state is DayState.Completed) {
            Text(
                text = (day.state as DayState.Completed).levelCode,
                fontSize = 8.sp,
                color = MaterialTheme.colorScheme.tertiary,
                fontWeight = FontWeight.Bold
            )
        } else if (day.state == DayState.Scheduled) {
            Box(
                modifier = Modifier
                    .padding(top = 2.dp)
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondary)
            )
        }
    }
}

@Composable
fun CalendarLegend() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LegendItem(color = MaterialTheme.colorScheme.tertiary, label = "Done")
        LegendItem(color = MaterialTheme.colorScheme.primary, label = "Missed")
        LegendItem(color = MaterialTheme.colorScheme.secondary, label = "Target")
    }
}

@Composable
fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
    }
}

private fun Modifier.alpha(alpha: Float): Modifier = this.then(
    Modifier.drawWithContent {
        drawContent()
        drawRect(Color.Black.copy(alpha = 1f - alpha), blendMode = androidx.compose.ui.graphics.BlendMode.DstIn)
    }
)

// Helper since Modifier.alpha is standard but I'll use a simpler one if needed.
// Actually Modifier.alpha is available in androidx.compose.ui.draw.alpha
