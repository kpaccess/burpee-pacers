//
//  WeightedTrainingModels.swift
//  BurpeePacer
//

import Foundation

struct WeightedExercise: Identifiable {
    let id = UUID()
    let name: String
    let sets: Int
    let reps: String
    let note: String?
}

struct WeightedTrainingDay: Identifiable {
    let id = UUID()
    let title: String
    let focus: String
    let exercises: [WeightedExercise]
}

enum WeightedTrainingPlan {
    /// Returns today's weighted training day, aligned to the burpee schedule.
    /// Mon (weekday 2) → Day 1, Wed (4) → Day 2, Fri (6) → Day 3.
    static func today() -> WeightedTrainingDay? {
        let weekday = Calendar.current.component(.weekday, from: Date())
        switch weekday {
        case 2: return day1
        case 4: return day2
        case 6: return day3
        default: return nil
        }
    }

    static let day1 = WeightedTrainingDay(
        title: "Day 1 — Pulling + Biceps",
        focus: "Biceps · Back · Forearms",
        exercises: [
            WeightedExercise(name: "Chin-ups (supinated grip)", sets: 4, reps: "Max", note: "Best bicep builder — aim 6–10"),
            WeightedExercise(name: "Barbell or Dumbbell Row",    sets: 3, reps: "8–10", note: "2-sec hold at top"),
            WeightedExercise(name: "Barbell Curl",               sets: 3, reps: "10–12", note: "Strict form, no swing"),
            WeightedExercise(name: "Hammer Curl",                sets: 2, reps: "12",    note: "Forearm + brachialis"),
        ]
    )

    static let day2 = WeightedTrainingDay(
        title: "Day 2 — Pushing + Shoulders",
        focus: "Shoulders · Chest · Triceps",
        exercises: [
            WeightedExercise(name: "Overhead Press",           sets: 4, reps: "8–10",  note: "Barbell or dumbbell"),
            WeightedExercise(name: "Incline Dumbbell Press",   sets: 3, reps: "10–12", note: "Upper chest focus"),
            WeightedExercise(name: "Lateral Raise",            sets: 3, reps: "12–15", note: "Light weight, controlled"),
            WeightedExercise(name: "Tricep Dips or Pushdowns", sets: 3, reps: "10–12", note: nil),
        ]
    )

    static let day3 = WeightedTrainingDay(
        title: "Day 3 — Legs + Core",
        focus: "Legs · Glutes · Core",
        exercises: [
            WeightedExercise(name: "Goblet Squat",       sets: 4, reps: "10–12",  note: "Or barbell squat"),
            WeightedExercise(name: "Romanian Deadlift",  sets: 3, reps: "10",     note: "Hinge at hips, hamstring focus"),
            WeightedExercise(name: "Walking Lunges",     sets: 3, reps: "12/leg", note: nil),
            WeightedExercise(name: "Plank",              sets: 3, reps: "30–45s", note: nil),
        ]
    )
}
