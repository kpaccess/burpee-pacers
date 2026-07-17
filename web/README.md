# BurpeePacer Web

The public Next.js app for BurpeePacer, a community fitness program built around structured burpee sessions and level-based rep goals. Production is deployed at [burpeepacers.com](https://www.burpeepacers.com).

## Overview

- Two workout tracks: `Beginner` and `Advanced`
- Beginner workouts use 5-Count Pushups only
- Advanced workouts support Navy Seals (`N`), 5-Count Pushups (`C`), and Hybrid (`H`)
- Friday Hybrid sessions split the workout into two phases, with rep targets rounded up per phase
- Users authenticate with Google Sign-In and store workout data in Firebase
- Admin users can review broader analytics and manage the allowlist

## Stack

- Framework: Next.js 16, React 19, TypeScript 5
- UI: MUI v7, Tailwind CSS v4, Framer Motion
- Backend: Firebase Auth, Firestore, Storage, Firebase Admin SDK
- Payments: Stripe Checkout, Billing Portal, webhooks
- Email: Resend
- Testing: Playwright with Firebase emulators

## Project Structure

```text
web/
├── src/app/                 # App Router pages and API routes
├── src/components/          # UI, dashboard, onboarding, workout timer
├── src/components/WorkoutTimer/
├── src/hooks/               # User data, subscription, timer state
├── src/lib/                 # Firebase, Stripe, workout logic, date helpers
├── src/config/              # Program configuration JSON and loaders
├── tests/                   # Playwright E2E coverage
└── scripts/                 # Maintenance scripts
```

## Key App Behavior

### Workout Modes

- `C`: 5-Count Pushups
- `N`: Navy Seals
- `H`: Hybrid

Advanced track defaults by weekday:

- Monday: `N`
- Wednesday: `C`
- Friday: `H`

Relevant implementation files:

- `src/lib/workoutTimer.ts` builds timer configuration from tier, level, and mode
- `src/hooks/useWorkoutTimer.ts` runs timer state, rep pacing, and Hybrid phase crossover
- `src/components/Dashboard.tsx` derives the default mode for the current day and passes it to the timer
- `src/lib/date.ts` provides `toDateKey()`, the canonical workout log date format

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Java, required for the Firebase emulator

Install Java on macOS if needed:

```bash
brew install --cask temurin
```

### Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Configuration lives in `.env.local` and typically includes:

- Firebase client config
- Firebase Admin credentials
- Stripe keys and webhook settings
- Resend API key

## Commands

```bash
npm run dev                 # Start Next.js dev server
npm run build               # Create a production build
npm run start               # Serve the production build
npm run lint                # Run ESLint
npm test                    # Run Playwright E2E tests
npm run test:ui             # Open Playwright UI mode
npm run test:report         # Open the latest Playwright report
npm run cleanup:unverified  # Dry-run cleanup for unverified users
```

## Testing

Tests run against Firebase emulators, never production data.

```bash
cp .env.test.local.example .env.test.local
npx playwright install chromium
npm test
```

Seeded QA accounts:

- `qa-user@test.com`
- `qa-admin@test.com`

Full QA onboarding lives in [`../docs/qadetails.md`](../docs/qadetails.md).

## Auth and Access

- Google Sign-In is the primary login flow
- Admin checks are handled through the allowlist helpers in `src/lib/allowlist.ts`
- The admin UI is available under `/admin`
- `ProGate.tsx` still exists, but launch behavior currently exposes the main experience broadly

## Deployment Notes

- Pushes to `main` deploy the web app automatically
- Firestore rules are managed at the monorepo level

If you need to deploy Firestore rules separately from the repo root:

```bash
firebase deploy --only firestore:rules
```

## Repository Notes

- This app lives inside a larger monorepo with sibling `ios/`, `n8n-workflows/`, and root-level Firebase config
- When changing Next.js behavior, check the version-specific docs in `node_modules/next/dist/docs/` first
- Do not use production Firebase data for tests or local QA
