# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**BurpeePacer** — a fitness app for a community that runs structured burpee workout sessions. Users are assigned to Beginner or Advanced tracks with level-based rep goals. The app provides a live workout timer, progress tracking, admin analytics, and subscription gating. The public app is the Next.js web app; native iOS (SwiftUI) and Android (Kotlin/Compose) apps exist as pre-release builds and are not published publicly yet.

## Monorepo Structure

```
burpee-pacers/
├── web/                  # Next.js 16 web app (primary codebase)
├── ios/                  # Native iOS SwiftUI app (ios/BurpeePacer/)
├── android/              # Native Android Kotlin/Compose app (pre-release)
├── n8n-workflows/        # Automation workflows
├── firebase.json         # Firebase config (Firestore, Storage, Hosting, Emulator)
├── firestore.rules       # Firestore security rules
├── docker-compose.yml    # Local services
└── qadetails.md          # QA testing guide
```

## Commands

```bash
# Start web dev server
cd web && npm run dev

# Build
cd web && npm run build

# Lint
cd web && npm run lint

# Run Playwright tests (starts emulator + dev server automatically)
cd web && npm test

# Run tests with UI
cd web && npm run test:ui

# View test report
cd web && npm run test:report

# iOS — open in Xcode (select BurpeePacer scheme → iPhone)
open ios/BurpeePacer/BurpeePacer.xcodeproj
# Apple Watch — select BurpeePacerWatch Watch App scheme → paired Watch

# Android — build debug APK
cd android && ./gradlew assembleDebug

# Android — build release APK (requires keystore.properties)
cd android && ./gradlew assembleRelease
```

## Tech Stack

### Web
- **Framework**: Next.js 16, React 19
- **UI**: MUI v7 + Tailwind CSS v4 + Framer Motion
- **Backend**: Firebase (Firestore, Storage, Auth, Hosting) — firebase v12, firebase-admin v13
- **Payments**: Stripe v22
- **Email**: Resend v6
- **Testing**: Playwright (E2E, against Firebase emulator)
- **Language**: TypeScript 5

### iOS (Native)
- **Language**: Swift 5.10+, SwiftUI
- **Architecture**: MVVM with `@Observable` macro
- **Backend**: Firebase iOS SDK 12.13.0 (Auth + Firestore), GoogleSignIn 9.1.0
- **Extras**: WatchConnectivity (Apple Watch sync), HealthKit, UserNotifications (workout reminders)
- **Minimum iOS**: 17.0, Xcode 15+

### Android (Native)
- **Language**: Kotlin, Jetpack Compose + Material3
- **Architecture**: MVVM with `StateFlow`
- **Storage**: Jetpack DataStore (local, no Firebase) + Gson for workout history JSON
- **Build**: Gradle with `google-services` plugin; signing config via `keystore.properties`
- **Minimum SDK**: 26 (Android 8.0); Target SDK: 34

## Tracks & Levels

Two tracks with different workout modes:
- **Beginner** — 5-Count Pushups only (`WorkoutMode = "C"` / `.fiveCount`)
- **Advanced** — Navy Seals (`"N"`), 5-Count Pushups (`"C"`), Hybrid (`"H"`)

Advanced Track day-of-week defaults:
- Monday → Navy Seals (`"N"`)
- Wednesday → 5-Count Pushups (`"C"`)
- Friday → Hybrid (`"H"`) — 10 min Navy Seals → 10 min 5-Count Pushups

### Level Definitions (shared across web, iOS, and Android)

**Beginner levels** (B1–B6): 20 → 40 → 55 → 70 → 90 → 110 burpees (no pushups) in 20 min.

**Advanced levels**: sealsGoal / sixCountsGoal per level:
- 1A: No Landmark Workout (0 / 0)
- 1B: 20 / 50
- 1C: 40 / 100
- 1D: 60 / 150
- 2: 80 / 200
- 3: 100 / 250
- 4: 120 / 275
- grad: 150 / 325

Hybrid rep targets per phase = `Math.ceil(fullGoal / 2)` (seals half + five-count half, each over 10 min).

## Web Architecture

### Web Workout Logic

- `web/src/lib/workoutTimer.ts` — builds mode/goal config per user level and tier
- `WorkoutMode` — `"N" | "C" | "H"`
- `HybridPhaseConfig` — two-phase structure for Friday Hybrid sessions

### Pages (`web/src/app/`)

- `/` — landing page
- `/login` — sign-in
- `/pricing` — subscription pricing
- `/success` — post-checkout success
- `/privacy` — privacy policy
- `/admin` — admin analytics (allowlist-gated)

### API Routes (`web/src/app/api/`)

- `stripe/checkout` — create Stripe checkout session
- `stripe/portal` — customer billing portal
- `stripe/webhook` — handle Stripe events
- `claim-subscription` — link Stripe subscription to user
- `send-welcome-email` — trigger Resend welcome email
- `analytics/visit` — track page visits
- `admin/allowlist` — manage admin allowlist
- `admin/stats` — aggregate stats for admin

### Components (`web/src/components/`)

- `Dashboard.tsx` — main user dashboard; derives today's day for default timer mode; CSV export for Advanced Pro users; Friday pulling-work section
- `WorkoutTimer/` — live timer UI split into sub-components:
  - `index.tsx` — root; receives `defaultMode` prop from Dashboard
  - `StandardDisplay.tsx` — non-hybrid timer display
  - `HybridDisplay.tsx` — hybrid phase display with per-phase countdown and rep counter
  - `ModeSelector.tsx` — mode toggle (N/C/H)
  - `TimerControls.tsx` — start/pause/reset controls
  - `PrepareCountdown.tsx` — pre-workout 10-second countdown
  - `PacingStrip.tsx` — pacing guidance strip
  - `WarmupPrompt.tsx` — warm-up cue
  - `CooldownBanner.tsx` — cool-down cue
- `LandingPage.tsx` — public landing page
- `Login.tsx` — Google SSO sign-in
- `Onboarding.tsx` — new user onboarding flow
- `MilestoneCheckin.tsx` — 6-month milestone check-in
- `BurpeeFormGuide.tsx` — burpee form guidance
- `BurpeeLogoIcon.tsx` — shared logo icon
- `ProGate.tsx` — legacy Pro wrapper; launch UI currently presents full access

### Hooks (`web/src/hooks/`)

- `useWorkoutTimer.ts` — core timer logic; Hybrid-aware with `hybridState` derived memo; handles phase crossover (resets reps, plays whistle, updates phase)
- `useSubscription.ts` — Stripe subscription status
- `useUserData.ts` — Firestore user data

### Auth & Access Control

- Firebase Auth with Google Sign-In (SSO)
- Admin allowlist in `web/src/lib/allowlist.ts` (server: `allowlist-server.ts`)
- `ProGate.tsx` — legacy Pro wrapper
- CSV export and advanced analytics are open during launch

## iOS Architecture (`ios/BurpeePacer/BurpeePacer/`)

### Key Files

- `Models.swift` — `ProgramTrack`, `WorkoutMode`, `Level`, `LevelDatabase`, `WorkoutSession`, `UserProfile`, `CalendarDay`
- `AppViewModel.swift` — main `@Observable` ViewModel; derives all state from `FirebaseService`; mirrors Firestore schema
- `FirebaseService.swift` — Firebase Auth + Firestore sync; `@Observable`; mirrors web `types/index.ts` schema (`FirestoreUserData`, `FirestoreWorkoutLog`)
- `SessionTimerViewModel.swift` — timer-specific `@Observable` ViewModel; handles Hybrid phase crossover, rep counting, beep guards; pushes `WorkoutState` to Watch on every timer event; `watchPhase` returns `"idle" | "prepare" | "active" | "paused" | "finished"`
- `ContentView.swift` — app entry; routes between `SignInView` and `DashboardView`
- `DashboardView.swift` — main hub; level card, calendar, stats, CSV export, Friday pulling-work section
- `SessionTimerView.swift` — 20-min countdown timer sheet with progress ring and rep counter
- `HeaderView.swift` — program status header
- `StatsOverviewCard.swift` — weight, protein target, days since start
- `WorkoutCalendarGridView.swift` — monthly Mon/Wed/Fri workout calendar
- `RecoveryDisclosureGroup.swift` — collapsible warm-up/cool-down guide
- `ProgressPhotosSection.swift` — Day 1 and milestone progress photos (Firebase Storage)
- `FridayPullingWorkSection.swift` — Friday pulling-work (chin-ups etc.) guidance
- `NotificationManager.swift` — schedules Mon/Wed/Fri workout reminders via `UNUserNotificationCenter`; configurable hour/minute; persisted in UserDefaults
- `PhoneSessionManager.swift` — WatchConnectivity bridge; sends `WorkoutState` dict to Apple Watch on every timer event; receives Watch commands (`start`, `pause`, `reset`, `incrementRep`, `decrementRep`)
- `HealthManager.swift` — stub on iOS 17 (HKWorkoutSession on iPhone requires iOS 26+); Watch owns the HKWorkoutSession
- `SoundManager.swift` / `WorkoutSoundManger.swift` — audio cues; restarts AVAudioEngine on interruption (with 300ms retry) and route changes
- `AccountSettingsView.swift` — user settings (weight unit, notifications, sign-out)

### iOS Data Flow

`FirebaseService` (Firestore listener) → `AppViewModel` (derived state) → SwiftUI Views. The only UserDefaults key is `useKilograms` (weight unit preference); all workout data lives in Firestore at `users/{uid}`, matching the web schema exactly.

## Apple Watch Architecture (`ios/BurpeePacer/BurpeePacerWatch Watch App/`)

### Key Files

- `WatchSessionManager.swift` — `@Observable` singleton; owns the `HKWorkoutSession`; receives `WorkoutState` from iPhone via WatchConnectivity and drives all Watch UI state; sends tap commands back to iPhone
- `BurpeePacerWatchApp.swift` — Watch app entry; injects `WatchSessionManager` into environment; requests HealthKit authorization at launch
- `ContentView.swift` (`WatchRootView`) — routes between `WatchIdleView`, `WatchWorkoutView`, `WatchSummaryView` based on `session.phase` and `session.showSummary`
- `WatchIdleView.swift` — shown when no workout is in progress; prompts user to start on iPhone
- `WatchWorkoutView.swift` — live workout UI: progress ring, countdown, rep counter, heart rate, pause/play + rep controls
- `WatchSummaryView.swift` — post-workout summary: reps, duration, calories

### Watch Data Flow

iPhone `SessionTimerViewModel` → `PhoneSessionManager.push()` (WatchConnectivity) → `WatchSessionManager.apply()` → SwiftUI Watch views.

On `phase == "active"` (first transition): Watch creates `HKWorkoutSession(functionalStrengthTraining)` and starts `HKLiveWorkoutBuilder` to collect heart rate + calories.

### Watch Phase States

`watchPhase` in `SessionTimerViewModel` maps timer state to one of:
- `"idle"` — not started or reset
- `"prepare"` — 5-second countdown
- `"active"` — 20-min timer running (`isRunning = true`)
- `"paused"` — timer paused mid-workout (`hasEverStarted && !isRunning`)
- `"finished"` — timer reached 0:00

### Watch HealthKit Lifecycle

- **Start**: `phase == "active"` and `workoutSession == nil` → `startHealthKitWorkout()`
- **Pause**: `phase == "paused"` → `workoutSession?.pause()`
- **Resume**: `phase == "active"` and `workoutSession != nil` → `workoutSession?.resume()`
- **Finish**: `phase == "finished"` → `endHealthKitWorkout()` saves to Health app, shows summary
- **Reset**: `phase == "idle"` with active session → `endHealthKitWorkout()` silently, no summary

### Watch Requirements

- Requires physical iPhone + Apple Watch (WatchConnectivity and HealthKit do not work in simulator for end-to-end testing)
- Both devices must be on the same Apple ID
- Watch app must be open (foreground or recently backgrounded) to receive `sendMessage` immediately; `updateApplicationContext` delivers as fallback when Watch app next wakes

### iOS Pro Access

`AppViewModel.hasProAccess` is `true` when `userData.isPro == true` OR `userData.isAdmin == true`.

### iOS Default Timer Mode

`AppViewModel.defaultMode(for:)` returns `.fiveCount` for Beginner users; for Advanced: Mon → `.navySeals`, Wed → `.fiveCount`, Fri → `.hybrid`.

## Android Architecture (`android/app/src/main/java/com/burpeepacer/app/`)

### Key Files

- `model/Models.kt` — `ProgramTrack`, `WorkoutMode`, `Level`, `LevelDatabase`, `WorkoutSession`, `UserProfile`, `AgeBracket`, `Equipment`
- `model/Finishers.kt` — `Finisher`, `FinisherDatabase`; day-of-week finisher exercises keyed by `AgeBracket` and `Equipment`
- `data/DataRepository.kt` — all persistence via Jetpack DataStore; workout history serialized as JSON via Gson
- `viewmodel/AppViewModel.kt` — derives `currentLevel`, `programStatusText`, `todayFinisher` from `DataRepository` flows
- `viewmodel/WorkoutViewModel.kt` — 20-min countdown timer; Hybrid phase logic; `WorkoutSoundManager` for audio cues
- `ui/screens/LandingScreen.kt` — onboarding/login (local only, no Firebase Auth)
- `ui/screens/DashboardScreen.kt` — main hub; level card, calendar, stats, finisher card
- `ui/screens/WorkoutScreen.kt` — live timer with progress ring, rep counter, pacing strip

### Android Data Flow

`DataRepository` (DataStore flows) → `AppViewModel` (derived `StateFlow`) → Compose screens. No Firebase — all data is local to the device.

### Android-Specific Concepts

- **`AgeBracket`** — `THIRTIES | FORTIES | FIFTIES_PLUS`; determines finisher exercises
- **`Equipment`** — `DUMBBELLS_ONLY | FULL_GYM`; affects Friday finisher options
- **`FinisherDatabase`** — returns a post-workout finisher (`Finisher`) for Mon/Wed/Fri based on `AgeBracket` + `Equipment`; returns `null` on other days
- **`keystore.properties`** — required for release builds; copy from `keystore.properties.example`

## Firestore Schema (`users/{uid}`)

- `startDate` — `"YYYY-MM-DD"`
- `startWeight` — number (lbs)
- `workoutTier` — `"beginner" | "advanced"`
- `currentLevelId` — e.g. `"1C"`, `"B3"`
- `isPro`, `isAdmin` — booleans
- `startPictureUrl` — Firebase Storage URL
- `workoutLogs[]` — array of `{ date, completed, levelCompleted, workoutType, repsCompleted, notes }`
- `workoutStats` — `{ workoutsCompleted, timerVerified }`
- Stripe fields: `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`

Security rules in `firestore.rules`. Date keys via `toDateKey()` in `web/src/lib/date.ts`.

## QA / Testing

See `qadetails.md` for the full QA onboarding guide.

- Tests run against the Firebase emulator (never production data)
- Test env file: `web/.env.test.local` (gitignored; copy from `web/.env.test.local.example`)
- Seeded test accounts: `qa-user@test.com`, `qa-admin@test.com`
- Java is required for the Firebase emulator (`brew install --cask temurin`)

## Environment Variables

Stored in `web/.env.local` (gitignored). Firebase config, Stripe keys, and Resend API key are required. iOS uses `GoogleService-Info.plist` (gitignored).
