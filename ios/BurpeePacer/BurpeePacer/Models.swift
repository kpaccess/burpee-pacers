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

    var storageValue: String {
        switch self {
        case .beginner: return "beginner"
        case .advanced: return "advanced"
        }
    }
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

    var availableModes: [WorkoutMode] {
        let configuredModes = ProgramCatalog.availableModes(for: track)
        return configuredModes.isEmpty ? (track == .beginner ? [.fiveCount] : [.navySeals, .fiveCount, .hybrid]) : configuredModes
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

    var hybridPhaseLabels: [String] { ProgramCatalog.hybridPhaseLabels }

    static func placeholder(for track: ProgramTrack) -> Level {
        Level(
            id: track == .beginner ? "B1" : "F",
            track: track,
            displayName: "Program unavailable",
            description: "Unable to load the shared workout configuration.",
            sealsGoal: 0,
            sixCountsGoal: 0
        )
    }
}

// MARK: - Level Database

struct LevelDatabase {
    static var beginnerLevels: [Level] { ProgramCatalog.levels(for: .beginner) }
    static var advancedLevels: [Level] { ProgramCatalog.levels(for: .advanced) }

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
