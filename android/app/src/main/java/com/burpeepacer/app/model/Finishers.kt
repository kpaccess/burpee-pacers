package com.burpeepacer.app.model

import java.time.DayOfWeek

data class Finisher(
    val name: String,
    val sets: String,
    val description: String
)

object FinisherDatabase {
    fun getFinisher(day: DayOfWeek, age: AgeBracket, equipment: Equipment): Finisher? {
        return when (day) {
            DayOfWeek.MONDAY -> getMondayFinisher(age)
            DayOfWeek.WEDNESDAY -> getWednesdayFinisher(age)
            DayOfWeek.FRIDAY -> getFridayFinisher(age, equipment)
            else -> null
        }
    }

    private fun getMondayFinisher(age: AgeBracket) = when (age) {
        AgeBracket.THIRTIES -> Finisher("DB Thrusters", "4x12", "Squat and press the dumbbells overhead")
        AgeBracket.FORTIES -> Finisher("DB Floor Press", "3x10", "Press dumbbells while lying on the floor")
        AgeBracket.FIFTIES_PLUS -> Finisher("DB Overhead Press", "3x10-12", "Strict overhead press with dumbbells")
    }

    private fun getWednesdayFinisher(age: AgeBracket) = when (age) {
        AgeBracket.THIRTIES -> Finisher("DB Bulgarian Split Squats", "3x10/side", "One foot elevated, squat with dumbbells")
        AgeBracket.FORTIES -> Finisher("DB Alternating Lunges", "3x10/side", "Step forward and alternate legs")
        AgeBracket.FIFTIES_PLUS -> Finisher("DB Goblet Squats", "3x12-15", "Hold one dumbbell at chest height and squat")
    }

    private fun getFridayFinisher(age: AgeBracket, equipment: Equipment) = when (age) {
        AgeBracket.THIRTIES -> if (equipment == Equipment.FULL_GYM) 
            Finisher("Weighted Pullups", "3x8", "Pullups with added weight") 
            else Finisher("DB Gorilla Rows", "3x10", "Hinged over, row dumbbells while alternating")
        AgeBracket.FORTIES -> Finisher("DB Renegade Rows", "3x8/side", "Row dumbbells from a plank position")
        AgeBracket.FIFTIES_PLUS -> if (equipment == Equipment.FULL_GYM) 
            Finisher("Assisted Pullups", "3x10", "Pullups with machine or band assistance") 
            else Finisher("One-Arm DB Rows", "3x12/side", "Row one dumbbell while supporting with other hand")
    }
}
