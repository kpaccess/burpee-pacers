# BurpeePacer — Android App

Native Android implementation of BurpeePacer, built with Kotlin and Jetpack Compose. Pre-release; not published publicly yet.

## Stack

- **Language:** Kotlin
- **UI:** Jetpack Compose + Material3
- **Architecture:** MVVM with `StateFlow`
- **Persistence:** Jetpack DataStore (local, no Firebase — all data is on-device)
- **Build:** Gradle with `google-services` plugin

## Getting Started

1. Open the `android/` folder in Android Studio (Hedgehog or newer).
2. Sync Project with Gradle Files.
3. Run on an emulator or physical device (API 26+, Android 8.0+).

```bash
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Release APK (requires keystore.properties)
```

Copy `keystore.properties.example` to `keystore.properties` and fill in signing credentials before building a release APK.

## Project Structure

```
android/app/src/main/java/com/burpeepacer/app/
├── model/          # Core data models (Level, UserProfile, WorkoutSession, AgeBracket, Equipment, Finisher)
├── data/           # Persistence layer (Jetpack DataStore + Gson for workout history JSON)
├── viewmodel/      # UI logic (AppViewModel, WorkoutViewModel)
├── ui/
│   ├── theme/      # Dark mode design system
│   ├── components/ # Reusable UI widgets
│   └── screens/    # LandingScreen, DashboardScreen, WorkoutScreen
└── MainActivity.kt # Entry point and navigation
```

## Key Concepts

### Tracks & Levels

Same track/level structure as web and iOS. Two tracks:
- **Beginner** (B1–B6): 20 → 40 → 55 → 70 → 90 → 110 burpees in 20 min.
- **Advanced** (1A–grad): Navy Seals and 5-count pushup goals per level; Hybrid mode splits the 20-min session into two 10-min phases.

### AgeBracket & Equipment

Android includes post-workout finisher exercises gated by:
- `AgeBracket` — `THIRTIES | FORTIES | FIFTIES_PLUS`
- `Equipment` — `DUMBBELLS_ONLY | FULL_GYM`

`FinisherDatabase` returns a `Finisher` (exercise + reps) for Mon/Wed/Fri based on these two values, or `null` on other days.

### Data Flow

`DataRepository` (DataStore flows) → `AppViewModel` (derived `StateFlow`) → Compose screens. No network calls — all data is local to the device.

## Features

- 20-minute countdown timer with rep pacing.
- Rep counter with large tap target.
- Mon/Wed/Fri workout calendar with completion badges.
- Automatic level advancement when rep targets are met.
- Post-workout finisher exercises based on age bracket and equipment.
- Stats dashboard with weight tracking and protein target calculation.
- All data stored locally (no account required).
