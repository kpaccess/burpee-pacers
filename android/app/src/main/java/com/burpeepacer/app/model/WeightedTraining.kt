package com.burpeepacer.app.model

import java.time.DayOfWeek
import java.time.LocalDate

data class WeightedExercise(
    val name: String,
    val sets: Int,
    val reps: String,
    val note: String? = null
)

data class WeightedTrainingDay(
    val title: String,
    val focus: String,
    val exercises: List<WeightedExercise>
)

object WeightedTrainingPlan {
    fun today(): WeightedTrainingDay? = forDay(LocalDate.now().dayOfWeek)

    fun forDay(day: DayOfWeek): WeightedTrainingDay? = when (day) {
        DayOfWeek.MONDAY    -> day1
        DayOfWeek.WEDNESDAY -> day2
        DayOfWeek.FRIDAY    -> day3
        else                -> null
    }

    val day1 = WeightedTrainingDay(
        title = "Day 1 — Pulling + Biceps",
        focus = "Biceps · Back · Forearms",
        exercises = listOf(
            WeightedExercise("Chin-ups (supinated grip)", 4, "Max",    "Best bicep builder — aim 6–10"),
            WeightedExercise("Barbell or Dumbbell Row",   3, "8–10",   "2-sec hold at top"),
            WeightedExercise("Barbell Curl",              3, "10–12",  "Strict form, no swing"),
            WeightedExercise("Hammer Curl",               2, "12",     "Forearm + brachialis"),
        )
    )

    val day2 = WeightedTrainingDay(
        title = "Day 2 — Pushing + Shoulders",
        focus = "Shoulders · Chest · Triceps",
        exercises = listOf(
            WeightedExercise("Overhead Press",           4, "8–10",  "Barbell or dumbbell"),
            WeightedExercise("Incline Dumbbell Press",   3, "10–12", "Upper chest focus"),
            WeightedExercise("Lateral Raise",            3, "12–15", "Light weight, controlled"),
            WeightedExercise("Tricep Dips or Pushdowns", 3, "10–12"),
        )
    )

    val day3 = WeightedTrainingDay(
        title = "Day 3 — Legs + Core",
        focus = "Legs · Glutes · Core",
        exercises = listOf(
            WeightedExercise("Goblet Squat",      4, "10–12",  "Or barbell squat"),
            WeightedExercise("Romanian Deadlift", 3, "10",     "Hinge at hips, hamstring focus"),
            WeightedExercise("Walking Lunges",    3, "12/leg"),
            WeightedExercise("Plank",             3, "30–45s"),
        )
    )
}
