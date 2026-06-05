//
//  FinisherDatabase.swift
//  BurpeePacer
//

import Foundation

struct StrengthFinisher: Identifiable {
    let id = UUID()
    let title: String
    let setsAndReps: String
    let focus: String
    let iconName: String
}

struct FinisherDatabase {
    
    static func finisher(for age: AgeBracket, equipment: Equipment, date: Date = Date()) -> StrengthFinisher {
        let weekday = Calendar.current.component(.weekday, from: date)
        
        switch age {
        case .fiftiesPlus:
            return fiftiesPlusFinisher(weekday: weekday, equipment: equipment)
        case .forties:
            return fortiesFinisher(weekday: weekday, equipment: equipment)
        case .thirties:
            return thirtiesFinisher(weekday: weekday, equipment: equipment)
        }
    }
    
    private static func fiftiesPlusFinisher(weekday: Int, equipment: Equipment) -> StrengthFinisher {
        switch weekday {
        case 2: // Mon: Shoulders
            return StrengthFinisher(
                title: "DB Overhead Press",
                setsAndReps: "3 sets of 10-12 reps",
                focus: "Shoulder Health & Mobility",
                iconName: "figure.strengthtraining.traditional"
            )
        case 4: // Wed: Hips/Legs
            return StrengthFinisher(
                title: "DB Goblet Squats",
                setsAndReps: "3 sets of 12-15 reps",
                focus: "Bone Density & Hip Integrity",
                iconName: "figure.strengthtraining.functional"
            )
        case 6: // Fri: Back/Pull
            return equipment == .fullGym ? 
                StrengthFinisher(
                    title: "Assisted Pullups",
                    setsAndReps: "3 sets to near failure",
                    focus: "Posture & Spinal Decompression",
                    iconName: "figure.arms.open"
                ) :
                StrengthFinisher(
                    title: "One-Arm DB Rows",
                    setsAndReps: "3 sets of 10 reps per side",
                    focus: "Upper Back & Grip Strength",
                    iconName: "figure.rowing"
                )
        default:
            return restDayFinisher()
        }
    }
    
    private static func fortiesFinisher(weekday: Int, equipment: Equipment) -> StrengthFinisher {
        switch weekday {
        case 2: // Mon: Push
            return StrengthFinisher(
                title: "DB Floor Press",
                setsAndReps: "3 sets of 10 reps",
                focus: "Chest & Tricep Power",
                iconName: "figure.strengthtraining.traditional"
            )
        case 4: // Wed: Legs
            return StrengthFinisher(
                title: "DB Alternating Lunges",
                setsAndReps: "3 sets of 10 reps per leg",
                focus: "Balance & Knee Stability",
                iconName: "figure.walk"
            )
        case 6: // Fri: Pull
            return StrengthFinisher(
                title: "DB Renegade Rows",
                setsAndReps: "3 sets of 8 reps per side",
                focus: "Core Stability & Lat Strength",
                iconName: "figure.rowing"
            )
        default:
            return restDayFinisher()
        }
    }
    
    private static func thirtiesFinisher(weekday: Int, equipment: Equipment) -> StrengthFinisher {
        switch weekday {
        case 2: // Mon: Push
            return StrengthFinisher(
                title: "DB Thrusters",
                setsAndReps: "4 sets of 12 reps",
                focus: "Explosive Full-Body Power",
                iconName: "figure.strengthtraining.traditional"
            )
        case 4: // Wed: Legs
            return StrengthFinisher(
                title: "DB Bulgarian Split Squats",
                setsAndReps: "3 sets of 10 reps per leg",
                focus: "Max Leg Hypertrophy",
                iconName: "figure.walk"
            )
        case 6: // Fri: Pull
            return equipment == .fullGym ?
                StrengthFinisher(
                    title: "Weighted Pullups",
                    setsAndReps: "3 sets of 5-8 reps",
                    focus: "Absolute Back Strength",
                    iconName: "figure.arms.open"
                ) :
                StrengthFinisher(
                    title: "DB Gorilla Rows",
                    setsAndReps: "4 sets of 12 reps",
                    focus: "Back Volume & Thickness",
                    iconName: "figure.rowing"
                )
        default:
            return restDayFinisher()
        }
    }
    
    private static func restDayFinisher() -> StrengthFinisher {
        return StrengthFinisher(
            title: "Active Recovery",
            setsAndReps: "20 min walk or stretching",
            focus: "Joint Health & Blood Flow",
            iconName: "figure.yoga"
        )
    }
}
