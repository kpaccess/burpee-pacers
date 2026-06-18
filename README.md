# BurpeePacer

BurpeePacer is a fitness app for a community that runs structured burpee workout sessions. Users are assigned to Beginner or Advanced tracks with level-based rep goals. The app provides a live workout timer, progress tracking, admin analytics, and subscription gating. The public app is the Next.js web app; native iOS (SwiftUI + Apple Watch) and Android (Kotlin/Compose) apps exist as pre-release builds and are not published publicly yet.

## Project Structure

```text
burpee-pacers/
├── web/                  # Next.js 16 web app: dashboard, timer, admin, Stripe, email
├── ios/                  # Native iOS SwiftUI app + Apple Watch app (pre-release)
├── android/              # Native Android Kotlin/Compose app (pre-release)
├── n8n-workflows/        # Engagement automation workflows
├── firebase.json         # Firebase config for Firestore, Storage, Hosting, emulator
├── firestore.rules       # Firestore security rules
├── docker-compose.yml    # Local services
└── docs/                 # Project docs (QA guide, deploy notes, reviews, analyses)
```

## Features

- Beginner and Advanced tracks with level-based rep goals.
- Live workout timer with Navy Seals, 5-count pushups, and Hybrid sessions.
- Advanced weekday defaults: Monday Navy Seals, Wednesday 5-count pushups, Friday Hybrid.
- Hybrid Friday format: 10 minutes Navy Seals, then 10 minutes 5-count pushups.
- Hybrid timer UI with phase label, phase countdown, total-remaining caption, and per-phase rep counter.
- Daily workout logging, milestone check-ins, and progress tracking.
- Firebase Auth with Google sign-in.
- Firestore-backed user profiles, workout logs, and analytics — shared schema across web and iOS.
- Apple Watch companion app with live workout sync, heart rate, and calorie tracking via HealthKit.
- Launch access is free for all users.
- CSV export and advanced analytics are open during launch.
- Admin dashboard with allowlisted admin access and cross-user analytics.
- Playwright tests against the Firebase emulator, plus read-only production smoke tests.

## Tech Stack

### Web

- **Framework:** Next.js 16, React 19, TypeScript 5
- **UI:** MUI v7, Tailwind CSS v4, Framer Motion
- **Backend:** Firebase Auth, Firestore, Storage, Firebase Admin SDK
- **Payments:** Stripe Checkout, Billing Portal, webhooks
- **Email:** Resend
- **Testing:** Playwright, Firebase Auth and Firestore emulators

### iOS

- **Language:** Swift 5.10+, SwiftUI
- **Architecture:** MVVM with `@Observable` macro
- **Backend:** Firebase iOS SDK (Auth + Firestore), Google Sign-In
- **Extras:** WatchConnectivity (Apple Watch sync), HealthKit, UserNotifications

### Android

- **Language:** Kotlin, Jetpack Compose + Material3
- **Architecture:** MVVM with `StateFlow`
- **Storage:** Jetpack DataStore (local, no Firebase)

## Workout Levels

**Beginner** (B1–B6): 20 → 40 → 55 → 70 → 90 → 110 burpees in 20 min (no pushups).

**Advanced** — sealsGoal / sixCountsGoal per level:

| Level      | Navy Seals | 5-Count Pushups |
| ---------- | ---------- | --------------- |
| Foundation | 15         | 40              |
| Level 1    | 30         | 75              |
| Level 2    | 50         | 125             |
| Level 3    | 70         | 175             |
| Level 4    | 90         | 225             |
| Elite      | 120        | 300             |

Hybrid rep targets per phase = `Math.ceil(fullGoal / 2)` (each phase is 10 min).

## Workout Logic

Core web workout configuration lives in `web/src/lib/workoutTimer.ts`, with timer state managed by `web/src/hooks/useWorkoutTimer.ts`.

- `WorkoutMode` is `"N" | "C" | "H"`.
- Beginner users only receive 5-count mode (`"C"`).
- Advanced users can use Navy Seals (`"N"`), 5-count pushups (`"C"`), and Hybrid (`"H"`).
- Hybrid sessions split the 20-minute workout into two 10-minute phases.
- The dashboard derives the default mode for the current weekday and passes it to `WorkoutTimer`.
- `useWorkoutTimer` handles mode changes, countdown state, phase crossover, rep resets, whistle sounds, and completion behavior.

## Getting Started

### Prerequisites

- Node.js 20+, npm
- Java (for Firebase emulator tests) — `brew install --cask temurin`
- Firebase CLI for emulator work
- Firebase project credentials for local web development

### Web App

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`. Configuration lives in `web/.env.local` (gitignored); copy from `.env.local.example` and fill in Firebase, Stripe, Firebase Admin, and Resend values.

### iOS App

Open `ios/BurpeePacer/BurpeePacer.xcodeproj` in Xcode. Select the **BurpeePacer** scheme for iPhone or the **BurpeePacerWatch Watch App** scheme for the Watch. Requires iOS 17.0+ / watchOS 10.0+, Xcode 15+. Add `GoogleService-Info.plist` (gitignored) before building.

### Android App

Open the `android/` folder in Android Studio. Sync Gradle, then run on an emulator or physical device (API 26+).

```bash
cd android && ./gradlew assembleDebug
```

## Common Commands

| Location   | Command                     | Description                                      |
| ---------- | --------------------------- | ------------------------------------------------ |
| `web/`     | `npm run dev`               | Start the Next.js dev server                     |
| `web/`     | `npm run build`             | Build the web app for production                 |
| `web/`     | `npm run lint`              | Run ESLint                                       |
| `web/`     | `npm test`                  | Run Playwright tests against Firebase emulator   |
| `web/`     | `npm run test:ui`           | Open Playwright UI mode                          |
| `web/`     | `npm run test:report`       | Open the Playwright HTML report                  |
| `android/` | `./gradlew assembleDebug`   | Build debug APK                                  |
| `android/` | `./gradlew assembleRelease` | Build release APK (requires keystore.properties) |

## Testing

See `docs/qadetails.md` for the full QA guide.

```bash
cd web
cp .env.test.local.example .env.test.local
npm install
npx playwright install chromium
npm test
```

The Playwright setup starts the Firebase Auth emulator on `localhost:9099`, the Firestore emulator on `localhost:8080`, and the web app on `localhost:3000`. Test accounts are seeded automatically: `qa-user@test.com` and `qa-admin@test.com`.

Production smoke tests (read-only):

```bash
cd web && npx playwright test --project=smoke
```

## Firebase

Firestore rules are in `firestore.rules`.

```bash
firebase deploy --only firestore:rules
```

Key data boundaries:

- Users can read and update only their own document.
- Client writes cannot modify subscription fields (`isPro`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`).
- Subscription state is written server-side via Firebase Admin SDK routes and Stripe webhooks.
- `pending_subscriptions` and `analytics` documents are server-only.

## Deployment

The web app deploys automatically to Vercel on every push to `main` (`www.burpeepacers.com`). Firestore rules are deployed separately with the Firebase CLI.

Keep `web/.env.local` and `web/.env.test.local` out of version control.

## Admin Access

Admin access is controlled by an allowlist in `web/src/lib/allowlist.ts`. Admin users can view cross-user analytics and admin-only dashboards.
