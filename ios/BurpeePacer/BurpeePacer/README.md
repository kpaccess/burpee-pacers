# BurpeePacer — iOS App

Native iOS app for BurpeePacer, built with Swift and SwiftUI. Pre-release; not published publicly yet.

## Requirements

- iOS 17.0+, Xcode 15+, Swift 5.10+
- `GoogleService-Info.plist` (gitignored) — required for Firebase

## Getting Started

Open `ios/BurpeePacer/BurpeePacer.xcodeproj` in Xcode:
- **iPhone app** — select the `BurpeePacer` scheme, run on an iPhone simulator or device.
- **Apple Watch app** — select the `BurpeePacerWatch Watch App` scheme, run on a paired Watch simulator or physical Watch.

WatchConnectivity and HealthKit end-to-end testing require physical hardware (iPhone + Apple Watch on the same Apple ID).

## Architecture

MVVM with SwiftUI and the `@Observable` macro.

### Data Flow

```
Firestore ──► FirebaseService (@Observable)
                     │
                     ▼
              AppViewModel (@Observable)
                     │
                     ▼
              SwiftUI Views
                     │
                     ▼
         SessionTimerViewModel (@Observable)
                     │
              ┌──────┴──────┐
              ▼             ▼
     PhoneSessionManager  HealthManager
     (WatchConnectivity)  (stub on iOS 17)
```

`FirebaseService` owns Auth listeners and a real-time Firestore snapshot. `AppViewModel` derives all UI state from it. The only `UserDefaults` key is `useKilograms` (weight unit preference) — all workout data lives in Firestore at `users/{uid}`, matching the web schema exactly.

### Apple Watch Data Flow

```
SessionTimerViewModel ──► PhoneSessionManager ──► WCSession ──► WatchSessionManager
```

`WatchSessionManager` owns the `HKWorkoutSession` and `HKLiveWorkoutBuilder` on the Watch. It starts, pauses, resumes, and ends the HealthKit workout based on the `phase` field received from the iPhone. The Watch sends tap commands back (`start`, `pause`, `reset`, `incrementRep`, `decrementRep`).

## Key Files

### iPhone

| File | Purpose |
|------|---------|
| `Models.swift` | `ProgramTrack`, `WorkoutMode`, `Level`, `LevelDatabase`, `WorkoutSession`, `UserProfile` |
| `AppViewModel.swift` | Main `@Observable` ViewModel; derives all state from `FirebaseService` |
| `FirebaseService.swift` | Firebase Auth + Firestore real-time sync |
| `SessionTimerViewModel.swift` | 20-min countdown; Hybrid phase crossover; pushes `WorkoutState` to Watch |
| `PhoneSessionManager.swift` | WatchConnectivity bridge |
| `HealthManager.swift` | Stub on iOS 17 (Watch owns the `HKWorkoutSession`) |
| `NotificationManager.swift` | Mon/Wed/Fri workout reminders via `UNUserNotificationCenter` |
| `DashboardView.swift` | Main hub: level card, calendar, stats, CSV export |
| `SessionTimerView.swift` | 20-min timer sheet with progress ring and rep counter |

### Apple Watch

| File | Purpose |
|------|---------|
| `WatchSessionManager.swift` | `@Observable` singleton; owns `HKWorkoutSession`; applies iPhone state |
| `WatchIdleView.swift` | Shown when no workout is in progress |
| `WatchWorkoutView.swift` | Live UI: progress ring, countdown, rep counter, heart rate, controls |
| `WatchSummaryView.swift` | Post-workout summary: reps, duration, calories |

## Tracks & Levels

**Beginner** (B1–B6): 20 → 40 → 55 → 70 → 90 → 110 burpees in 20 min (no pushups).

**Advanced** — sealsGoal / sixCountsGoal per level:

| Level | Navy Seals | 5-Count Pushups |
|-------|-----------|-----------------|
| 1A    | 0         | 0               |
| 1B    | 20        | 50              |
| 1C    | 40        | 100             |
| 1D    | 60        | 150             |
| 2     | 80        | 200             |
| 3     | 100       | 250             |
| 4     | 120       | 275             |
| grad  | 150       | 325             |

Hybrid rep targets per phase = `ceil(fullGoal / 2)`, each phase is 10 min.

## Pro Access (`AppViewModel.hasProAccess`)

Checked in order:
1. Email allowlist (hardcoded in `AppViewModel`)
2. `isAdmin == true` in Firestore
3. StoreKit 2 entitlement (`com.burpeepacers.pro`)
4. 60-day trial (`daysSinceStart < 60`)
