package com.burpeepacer.app.model

import java.time.DayOfWeek

/** Post-workout strength finisher. Content mirrors iOS `FinisherDatabase.swift`. */
data class Finisher(
    val name: String,
    val sets: String,
    val focus: String
)

object FinisherDatabase {
    /** Always returns a finisher; non-Mon/Wed/Fri days get "Active Recovery" (as on iOS). */
    fun getFinisher(day: DayOfWeek, age: AgeBracket, equipment: Equipment): Finisher = when (age) {
        AgeBracket.FIFTIES_PLUS -> fiftiesPlus(day, equipment)
        AgeBracket.FORTIES -> forties(day)
        AgeBracket.THIRTIES -> thirties(day, equipment)
    }

    private fun fiftiesPlus(day: DayOfWeek, equipment: Equipment) = when (day) {
        DayOfWeek.MONDAY -> Finisher("DB Overhead Press", "3 sets of 10-12 reps", "Shoulder Health & Mobility")
        DayOfWeek.WEDNESDAY -> Finisher("DB Goblet Squats", "3 sets of 12-15 reps", "Bone Density & Hip Integrity")
        DayOfWeek.FRIDAY ->
            if (equipment == Equipment.FULL_GYM)
                Finisher("Assisted Pullups", "3 sets to near failure", "Posture & Spinal Decompression")
            else
                Finisher("One-Arm DB Rows", "3 sets of 10 reps per side", "Upper Back & Grip Strength")
        else -> restDay()
    }

    private fun forties(day: DayOfWeek) = when (day) {
        DayOfWeek.MONDAY -> Finisher("DB Floor Press", "3 sets of 10 reps", "Chest & Tricep Power")
        DayOfWeek.WEDNESDAY -> Finisher("DB Alternating Lunges", "3 sets of 10 reps per leg", "Balance & Knee Stability")
        DayOfWeek.FRIDAY -> Finisher("DB Renegade Rows", "3 sets of 8 reps per side", "Core Stability & Lat Strength")
        else -> restDay()
    }

    private fun thirties(day: DayOfWeek, equipment: Equipment) = when (day) {
        DayOfWeek.MONDAY -> Finisher("DB Thrusters", "4 sets of 12 reps", "Explosive Full-Body Power")
        DayOfWeek.WEDNESDAY -> Finisher("DB Bulgarian Split Squats", "3 sets of 10 reps per leg", "Max Leg Hypertrophy")
        DayOfWeek.FRIDAY ->
            if (equipment == Equipment.FULL_GYM)
                Finisher("Weighted Pullups", "3 sets of 5-8 reps", "Absolute Back Strength")
            else
                Finisher("DB Gorilla Rows", "4 sets of 12 reps", "Back Volume & Thickness")
        else -> restDay()
    }

    private fun restDay() = Finisher("Active Recovery", "20 min walk or stretching", "Joint Health & Blood Flow")
}
