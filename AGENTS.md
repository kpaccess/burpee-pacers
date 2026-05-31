# AGENTS.md

Guidance for Codex when working in this repository.

## Project Overview

**BurpeePacer** — a fitness app for a community (Burpee Pacers) that runs structured burpee workout sessions. Users are assigned to Beginner or Advanced tracks with level-based rep goals. The public app is the Next.js web app; the native iOS app exists as a pre-release build and is not published publicly yet.

## Monorepo Structure

```
burpee-pacers/
├── web/                  # Next.js 16 web app (primary codebase)
├── ios/                  # Native iOS SwiftUI app, pre-release only
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
```

## Tech Stack

- **Framework**: Next.js 16, React 19
- **UI**: MUI v7 + Tailwind CSS v4 + Framer Motion
- **Backend**: Firebase (Firestore, Storage, Auth, Hosting)
- **Payments**: Stripe
- **Email**: Resend
- **Testing**: Playwright (E2E, against Firebase emulator)
- **Language**: TypeScript 5

## Key Architecture

### Tracks & Levels

Two tracks with different workout modes:
- **Beginner** — 5-Count Pushups only (`WorkoutMode = "C"`)
- **Advanced** — Navy Seals (`"N"`), 5-Count Pushups (`"C"`), Hybrid (`"H"`)

Advanced Track day-of-week defaults:
- Monday → Navy Seals (`"N"`)
- Wednesday → 5-Count Pushups (`"C"`)
- Friday → Hybrid (`"H"`) — 10 min Navy Seals → 10 min 5-Count Pushups

### Web Workout Logic

- `web/src/lib/workoutTimer.ts` — builds mode/goal config per user level and tier
- `WorkoutMode` — `"N" | "C" | "H"`
- `HybridPhaseConfig` — two-phase structure for Friday Hybrid sessions
- Hybrid rep targets are `Math.ceil(fullGoal / 2)` per phase

### Components (`web/src/components/`)

- `Dashboard.tsx` — main user dashboard; derives today's day for default timer mode; CSV export for Advanced Pro users; pulling work config for Fridays
- `WorkoutTimer/` — live timer UI; supports all three modes; Hybrid shows phase label, phase countdown, total-remaining caption, per-phase rep counter
- `WorkoutTimer` receives a `defaultMode` prop passed from Dashboard

### Hooks (`web/src/hooks/`)

- `useWorkoutTimer.ts` — core timer logic; Hybrid-aware with `hybridState` derived memo; handles phase crossover (resets reps, plays whistle, updates phase)
- `useSubscription.ts` — Stripe subscription status
- `useUserData.ts` — Firestore user data

### Auth & Access Control

- Firebase Auth with Google Sign-In (SSO)
- Admin allowlist in `web/src/lib/allowlist.ts`
- `ProGate.tsx` — legacy Pro wrapper; launch UI currently presents full access
- CSV export and advanced analytics are open during launch

## QA / Testing

See `qadetails.md` for the full QA onboarding guide.

- Tests run against the Firebase emulator (never production data)
- Test env file: `web/.env.test.local` (gitignored; copy from `web/.env.test.local.example`)
- Seeded test accounts: `qa-user@test.com`, `qa-admin@test.com`
- Java is required for the Firebase emulator (`brew install --cask temurin`)

## Firestore

- Security rules in `firestore.rules`
- Workout logs stored per user; `toDateKey()` in `web/src/lib/date.ts` is the canonical date key format
- Admin users can view workout analytics across all users

## Environment Variables

Stored in `web/.env.local` (gitignored). Firebase config, Stripe keys, and Resend API key are required.
