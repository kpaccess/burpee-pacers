//
//  Models.swift
//  BurpeePacer
//

import Foundation
import SwiftUI

// MARK: - Program Track

enum ProgramTrack: String, Codable, CaseIterable {
    case beginner = "Beginner"
    case advanced = "Advanced"
}

// MARK: - Personalization Enums

enum AgeBracket: String, Codable, CaseIterable {
    case thirties = "30s"
    case forties  = "40s"
    case fiftiesPlus = "50+"

    var displayName: String { self.rawValue }
}

enum Equipment: String, Codable, CaseIterable {
    case dumbbellsOnly = "Dumbbells Only"
    case fullGym = "Full Gym Access"

    var displayName: String { self.rawValue }
}

// MARK: - Level

enum WorkoutMode: String, Codable, CaseIterable {
    case navySeals = "N"
    case fiveCount = "C"
    case hybrid    = "H"

    var displayName: String {
        switch self {
        case .navySeals: return "Navy Seals"
        case .fiveCount: return "5-Count Pushups"
        case .hybrid:    return "Hybrid"
        }
    }

    func displayName(for track: ProgramTrack) -> String {
        track == .beginner && self == .fiveCount ? "Burpee without pushups" : displayName
    }

    var shortName: String {
        switch self {
        case .navySeals: return "N"
        case .fiveCount: return "C"
        case .hybrid:    return "H"
        }
    }
}

// MARK: - Level Definition

struct Level: Identifiable, Codable {
    let id: String
    let track: ProgramTrack
    let displayName: String
    let description: String
    let sealsGoal: Int       // Navy Seals target (0 for beginner)
    let sixCountsGoal: Int   // 5-Count pushups / burpees target
    let tutorialURL: String

    var availableModes: [WorkoutMode] {
        track == .beginner ? [.fiveCount] : [.navySeals, .fiveCount, .hybrid]
    }

    func goal(for mode: WorkoutMode) -> Int {
        switch mode {
        case .navySeals: return sealsGoal
        case .fiveCount: return sixCountsGoal
        case .hybrid:    return sixCountsGoal // total session target
        }
    }

    // Half the full goal, rounded up — mirrors web app Math.ceil(goal / 2)
    func hybridPhaseGoal(phase: Int) -> Int {
        let g = phase == 0 ? sealsGoal : sixCountsGoal
        return Int(ceil(Double(g) / 2))
    }

    var hybridPhaseLabels: [String] { ["Navy Seals", "5-Count Pushups"] }
}

// MARK: - Level Database

struct LevelDatabase {
    private static let beginnerURL = "https://www.youtube.com/watch?v=TU8QYVW0gDU"
    private static let advancedURL = "https://www.youtube.com/watch?v=4dF1DOWzf20"

    static let beginnerLevels: [Level] = [
        Level(id: "B1", track: .beginner, displayName: "Beginner 1",
              description: "20 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 20, tutorialURL: beginnerURL),
        Level(id: "B2", track: .beginner, displayName: "Beginner 2",
              description: "40 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 40, tutorialURL: beginnerURL),
        Level(id: "B3", track: .beginner, displayName: "Beginner 3",
              description: "55 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 55, tutorialURL: beginnerURL),
        Level(id: "B4", track: .beginner, displayName: "Beginner 4",
              description: "70 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 70, tutorialURL: beginnerURL),
        Level(id: "B5", track: .beginner, displayName: "Beginner 5",
              description: "90 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 90, tutorialURL: beginnerURL),
        Level(id: "B6", track: .beginner, displayName: "Beginner 6",
              description: "110 burpees (no pushups) in 20 min.",
              sealsGoal: 0, sixCountsGoal: 110, tutorialURL: beginnerURL),
    ]

    static let advancedLevels: [Level] = [
        Level(id: "1B", track: .advanced, displayName: "Level 1B",
              description: "20 Navy Seals in 20 min, 50 5-count pushups in 20 min.",
              sealsGoal: 20, sixCountsGoal: 50, tutorialURL: advancedURL),
        Level(id: "1C", track: .advanced, displayName: "Level 1C",
              description: "40 Navy Seals in 20 min, 100 5-count pushups in 20 min.",
              sealsGoal: 40, sixCountsGoal: 100, tutorialURL: advancedURL),
        Level(id: "1D", track: .advanced, displayName: "Level 1D",
              description: "60 Navy Seals in 20 min, 150 5-count pushups in 20 min.",
              sealsGoal: 60, sixCountsGoal: 150, tutorialURL: advancedURL),
        Level(id: "2", track: .advanced, displayName: "Level 2",
              description: "80 Navy Seals in 20 min, 200 5-count pushups in 20 min.",
              sealsGoal: 80, sixCountsGoal: 200, tutorialURL: advancedURL),
        Level(id: "3", track: .advanced, displayName: "Level 3",
              description: "100 Navy Seals in 20 min, 250 5-count pushups in 20 min.",
              sealsGoal: 100, sixCountsGoal: 250, tutorialURL: advancedURL),
        Level(id: "4", track: .advanced, displayName: "Level 4",
              description: "120 Navy Seals in 20 min, 275 5-count pushups in 20 min.",
              sealsGoal: 120, sixCountsGoal: 275, tutorialURL: advancedURL),
        Level(id: "grad", track: .advanced, displayName: "Graduation",
              description: "150 Navy Seals in 20 min, 325 5-count pushups in 20 min.",
              sealsGoal: 150, sixCountsGoal: 325, tutorialURL: advancedURL),
    ]

    static func levels(for track: ProgramTrack) -> [Level] {
        track == .beginner ? beginnerLevels : advancedLevels
    }
}

// MARK: - Workout Session

struct WorkoutSession: Identifiable, Codable {
    let id: UUID
    let date: Date
    let levelID: String
    let workoutMode: WorkoutMode
    let repsCompleted: Int
    let targetReps: Int
    let completed: Bool

    init(id: UUID = UUID(), date: Date, levelID: String,
         workoutMode: WorkoutMode = .fiveCount,
         repsCompleted: Int, targetReps: Int, completed: Bool) {
        self.id = id
        self.date = date
        self.levelID = levelID
        self.workoutMode = workoutMode
        self.repsCompleted = repsCompleted
        self.targetReps = targetReps
        self.completed = completed
    }
}

// MARK: - User Profile

struct UserProfile: Codable {
    var startDate: Date
    var currentWeight: Double // in kg
    var useKilograms: Bool
    var currentTrack: ProgramTrack
    var currentLevelID: String

    var weightDisplay: Double {
        useKilograms ? currentWeight : currentWeight * 2.20462
    }

    var proteinTarget: Double {
        currentWeight * 1.5
    }

    var daysSinceStart: Int {
        Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0
    }
}

// MARK: - Calendar Day State

enum DayState {
    case rest
    case scheduled
    case completed(reps: Int, levelCode: String, workoutMode: WorkoutMode)
    case missed
}

struct CalendarDay: Identifiable {
    let id = UUID()
    let date: Date
    let state: DayState

    var isWorkoutDay: Bool {
        let weekday = Calendar.current.component(.weekday, from: date)
        return weekday == 2 || weekday == 4 || weekday == 6
    }
}

// MARK: - Weight Unit

enum WeightUnit: String, CaseIterable {
    case kilograms = "kg"
    case pounds = "lbs"
}
