# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Opening the Project

```bash
# iPhone app (BurpeePacer scheme → iPhone simulator or device)
open BurpeePacer/BurpeePacer.xcodeproj

# Apple Watch (BurpeePacerWatch Watch App scheme → paired Watch simulator or device)
# Select the Watch scheme in Xcode after opening the same project
```

Build, run, and test exclusively through Xcode. There are no shell build commands.

## Project Structure

```
ios/
├── BurpeePacer/
│   ├── BurpeePacer/                      # iPhone app
│   └── BurpeePacerWatch Watch App/       # watchOS app
├── appstore-release-1.1.md               # Watch release notes + test checklist
└── appstore-release-1.2.md               # StoreKit/IAP release notes + test checklist
```

## Architecture

Both targets are **SwiftUI + `@Observable`** (no Combine `@Published` pattern). State flows down; user actions call methods on ViewModels.

### iPhone App Data Flow

```
Firestore ──► FirebaseService (@Observable)
                     │
                     ▼
              AppViewModel (@Observable)    ◄── UserDefaults (useKilograms only)
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

`FirebaseService` owns Auth listeners and a real-time Firestore snapshot. `AppViewModel` holds a `FirebaseService` instance and derives all UI state from `firebase.userData`. The only `UserDefaults` key is `useKilograms`.

### Timer Architecture

`SessionTimerViewModel` drives the 20-minute countdown. Key behaviors:
- **Prepare countdown**: 5 seconds before the main timer, played via `WorkoutSoundManager`
- **Hybrid mode**: `hybridPhaseIndex` flips at the 10-minute mark; `currentReps` resets to 0 on crossover; `hybridPhaseGoal` mirrors web `Math.ceil(goal / 2)`
- **Auto-increment**: The timer auto-increments `currentReps` each time a pace interval elapses — this is intentional pacing behavior, not a bug
- **Watch push**: `pushWatchState()` is called every second (throttled by `lastPushedSecond`) and on every user action. It sends `WorkoutState` via both `updateApplicationContext` (fallback) and `sendMessage` (immediate)
- **`watchPhase`**: maps timer state to `"idle" | "prepare" | "active" | "paused" | "finished"`

### Watch App Data Flow

```
iPhone SessionTimerViewModel ──► PhoneSessionManager ──► WCSession
                                                              │
                                                    WatchSessionManager.apply()
                                                              │
                                                    SwiftUI Watch Views
```

`WatchSessionManager` is the only `@Observable` on the Watch side. It owns the `HKWorkoutSession`/`HKLiveWorkoutBuilder` and starts/pauses/ends them based on the `phase` field arriving from the iPhone. The Watch sends tap commands back (`start`, `pause`, `reset`, `incrementRep`, `decrementRep`) which `PhoneSessionManager` routes to `SessionTimerViewModel`.

**HealthKit ownership**: `HealthManager` on the iPhone is a stub — it only calls `healthStore.startWatchApp()`. The Watch owns the `HKWorkoutSession` entirely.

### Pro Access Logic (`AppViewModel.hasProAccess`)

Four independent gates, checked in order:
1. Email allowlist (hardcoded in `AppViewModel`)
2. `isAdmin == true` in Firestore
3. `storeKit.hasPro` — StoreKit 2 entitlement (`com.burpeepacers.pro`)
4. 60-day trial (`daysSinceStart < 60`)

`isPro` in Firestore is the web/Stripe source of truth; it is **not** checked on iOS. iOS uses StoreKit for its own purchase state.

### Auth

`FirebaseService` supports email/password, Google Sign-In, and Apple Sign-In. Apple Sign-In uses a SHA-256 nonce. On first sign-in, `initializeNewUserProfile` creates a Firestore document without `workoutTier` — that triggers `AppViewModel.needsTrackSelection` and routes to `TrackSelectionView`.

### Firestore Schema Compatibility

`FirebaseService` mirrors the web schema at `users/{uid}`. When writing workout logs, it always writes `levelCompleted` in the format `"1C(N)"` (level ID + mode char in parens). `parseLevelCompleted` parses this back. `FirebaseService.parse` handles a legacy Firestore typo: `startPictureURl` (capital L) alongside `startPictureUrl`.

## Testing Constraints

- **WatchConnectivity and HKWorkoutSession require physical hardware** — the full phone↔watch sync loop cannot be tested in the simulator
- **StoreKit purchases require a physical device** — sandbox testing works with a sandbox Apple ID configured on device
- The appstore release checklists in `appstore-release-1.1.md` and `appstore-release-1.2.md` serve as manual QA guides for each feature area
