# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**BurpeePacer** — a fitness app for a community that runs structured burpee workout sessions. Users are assigned to Beginner or Advanced tracks with level-based rep goals. The app provides a live workout timer, progress tracking, admin analytics, and subscription gating. The public app is the Next.js web app; the native iOS SwiftUI app exists as a pre-release build and is not published publicly yet.

## Monorepo Structure

```
burpee-pacers/
├── web/                  # Next.js 16 web app (primary codebase)
├── ios/                  # Native iOS SwiftUI app (ios/BurpeePacer/)
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

# iOS — open in Xcode
open ios/BurpeePacer/BurpeePacer.xcodeproj
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
- **Extras**: WatchConnectivity (Apple Watch sync), UserNotifications (workout reminders)
- **Minimum iOS**: 17.0, Xcode 15+

## Tracks & Levels

Two tracks with different workout modes:
- **Beginner** — 5-Count Pushups only (`WorkoutMode = "C"` / `.fiveCount`)
- **Advanced** — Navy Seals (`"N"`), 5-Count Pushups (`"C"`), Hybrid (`"H"`)

Advanced Track day-of-week defaults:
- Monday → Navy Seals (`"N"`)
- Wednesday → 5-Count Pushups (`"C"`)
- Friday → Hybrid (`"H"`) — 10 min Navy Seals → 10 min 5-Count Pushups

### Level Definitions (shared across web and iOS)

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
- `SessionTimerViewModel.swift` — timer-specific `@Observable` ViewModel; handles Hybrid phase crossover, rep counting, beep guards
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
- `PhoneSessionManager.swift` — WatchConnectivity bridge; sends `WorkoutState` dict to Apple Watch during active sessions
- `SoundManager.swift` / `WorkoutSoundManger.swift` — audio cues
- `AccountSettingsView.swift` — user settings (weight unit, notifications, sign-out)

### iOS Data Flow

`FirebaseService` (Firestore listener) → `AppViewModel` (derived state) → SwiftUI Views. The only UserDefaults key is `useKilograms` (weight unit preference); all workout data lives in Firestore at `users/{uid}`, matching the web schema exactly.

### iOS Pro Access

`AppViewModel.hasProAccess` is `true` when `userData.isPro == true` OR `userData.isAdmin == true`.

### iOS Default Timer Mode

`AppViewModel.defaultMode(for:)` returns `.fiveCount` for Beginner users; for Advanced: Mon → `.navySeals`, Wed → `.fiveCount`, Fri → `.hybrid`.

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
