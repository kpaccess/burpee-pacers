# BurpeePacer Workout Specification

This document serves as the definitive technical reference for the BurpeePacer workout logic, ensuring parity between iOS, Web, and Android implementations.

---

## 1. Program Structure

### Workout Schedule
- **Default Days**: Monday, Wednesday, Friday.
- **Duration**: Exactly 20 minutes (1,200 seconds) for all sessions.
- **Rest Days**: All non-workout days are designated for recovery.

### Program Tracks
1. **Beginner**: Focused on volume without pushups.
2. **Advanced**: Includes Navy Seals and 5-count burpees with pushups.

---

## 2. Level Definitions

### Beginner Track (Mode: `fiveCount` / No Pushups)
| Level ID | Display Name | Goal (Reps) | Description |
|----------|--------------|-------------|-------------|
| **B1**   | Beginner 1   | 20          | 20 burpees in 20 min |
| **B2**   | Beginner 2   | 40          | 40 burpees in 20 min |
| **B3**   | Beginner 3   | 55          | 55 burpees in 20 min |
| **B4**   | Beginner 4   | 70          | 70 burpees in 20 min |
| **B5**   | Beginner 5   | 90          | 90 burpees in 20 min |
| **B6**   | Beginner 6   | 110         | 110 burpees in 20 min |

### Advanced Track (Multiple Modes)
| Level ID | Display Name | Navy Seals Goal (N) | 5-Count Goal (C) |
|----------|--------------|---------------------|------------------|
| **1B**   | Level 1B     | 20                  | 50               |
| **1C**   | Level 1C     | 40                  | 100              |
| **1D**   | Level 1D     | 60                  | 150              |
| **2**    | Level 2      | 80                  | 200              |
| **3**    | Level 3      | 100                 | 250              |
| **4**    | Level 4      | 120                 | 275              |
| **grad** | Graduation   | 150                 | 325              |

---

## 3. Workout Modes

| Mode | Key | Display Name | Logic |
|------|-----|--------------|-------|
| **Navy Seals** | `N` | Navy Seals | 3 pushups per rep (typically). Goal used: `sealsGoal`. |
| **5-Count** | `C` | 5-Count Pushups | 1 pushup per rep. Goal used: `sixCountsGoal`. |
| **Hybrid** | `H` | Hybrid | **Split Session**: First 10 mins = Navy Seals, Last 10 mins = 5-Count. |

### Hybrid Mode Details
- **Phase 1 (0:00 - 10:00 elapsed)**: Target is `ceil(sealsGoal / 2)`.
- **Phase 2 (10:01 - 20:00 elapsed)**: Target is `ceil(sixCountsGoal / 2)`.
- **Reset**: The rep counter resets to 0 when transitioning to Phase 2.

---

## 4. Pacing & Timer Logic

### Pacer Formula
The app acts as a metronome to ensure the user hits their target by the end of the 20-minute window.
- `Total Seconds` = 1,200 (or 600 for a Hybrid Phase).
- `Interval` = `Total Seconds / Goal`.
- `Next Rep Boundary` = `(Current Rep + 1) * Interval`.

### Audio/Visual Cues
- **Rep Warning**: Beep/Visual cue 4 seconds before the next rep boundary.
- **Rep Trigger**: Sound/Vibration exactly at the boundary.
- **Countdown**: 5-second preparation countdown before the 20-minute timer starts.

---

## 5. Personalization & Calculations

### Protein Target
- **Formula**: `User Weight (kg) * 1.5`.
- **Conversion**: If weight is in lbs, `Weight (lbs) / 2.20462`.

### Strength Finishers
Assigned after the 20-minute burpee session based on Age and Equipment.

#### Monday (Push Focus)
- **30s**: DB Thrusters (4x12)
- **40s**: DB Floor Press (3x10)
- **50+**: DB Overhead Press (3x10-12)

#### Wednesday (Leg Focus)
- **30s**: DB Bulgarian Split Squats (3x10/side)
- **40s**: DB Alternating Lunges (3x10/side)
- **50+**: DB Goblet Squats (3x12-15)

#### Friday (Pull Focus)
- **30s**: Weighted Pullups (Gym) or DB Gorilla Rows (Home)
- **40s**: DB Renegade Rows (3x8/side)
- **50+**: Assisted Pullups (Gym) or One-Arm DB Rows (Home)

---

## 6. Data Schema (Firestore)

### User Document: `users/{uid}`
```typescript
{
  startDate: string;       // "YYYY-MM-DD"
  startWeight: number;     // Always in lbs for the database
  workoutTier: string;     // "beginner" | "advanced"
  currentLevelId: string;  // e.g., "1C", "B4"
  workoutDays: number[];   // [2, 4, 6] (ISO weekdays)
  ageBracket: string;      // "30s", "40s", "50+"
  equipment: string;       // "Dumbbells Only", "Full Gym Access"
  workoutLogs: [
    {
      date: string;           // "YYYY-MM-DD"
      completed: boolean;
      levelCompleted: string; // e.g., "1C(N)", "B3(C)"
      repsCompleted: number;
      workoutType: string;    // "with_pushups" | "no_pushups"
    }
  ]
}
```

---

## 7. Assets & Resources
- **Beginner Tutorial**: https://www.youtube.com/watch?v=TU8QYVW0gDU
- **Advanced Tutorial**: https://www.youtube.com/watch?v=4dF1DOWzf20
- **Theme**: Dark Mode First (Background: `#09090b`, Cards: `#1c1c1e`, Accent: Crimson Red).
