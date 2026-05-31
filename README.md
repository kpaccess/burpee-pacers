# BurpeePacer

BurpeePacer is a fitness app for a community that runs structured burpee workout sessions. Users are assigned to Beginner or Advanced tracks with level-based rep goals, live timers, workout logging, progress tracking, and admin analytics. The public app is the Next.js web app; the native iOS app exists as a pre-release build and is not published publicly yet. The app is free for everyone during launch, with payment plumbing kept in place for possible future paid plans.

## Project Structure

```text
burpee-pacers/
├── web/                  # Next.js 16 web app: dashboard, timer, admin, Stripe, email
├── ios/                  # Native iOS SwiftUI app, pre-release only
├── n8n-workflows/        # Engagement automation workflows
├── firebase.json         # Firebase config for Firestore, Storage, Hosting, emulator
├── firestore.rules       # Firestore security rules
├── docker-compose.yml    # Local services
└── qadetails.md          # QA setup and testing guide
```

## Features

- Beginner and Advanced tracks with level-based rep goals.
- Live workout timer with Navy Seals, 5-count pushups, and Hybrid sessions.
- Advanced weekday defaults: Monday Navy Seals, Wednesday 5-count pushups, Friday Hybrid.
- Hybrid Friday format: 10 minutes Navy Seals, then 10 minutes 5-count pushups.
- Hybrid timer UI with phase label, phase countdown, total-remaining caption, and per-phase rep counter.
- Daily workout logging, milestone check-ins, and progress tracking.
- Firebase Auth with Google sign-in.
- Firestore-backed user profiles, workout logs, and analytics.
- Launch access is free for all users.
- CSV export and advanced analytics are open during launch.
- Admin dashboard with allowlisted admin access and cross-user analytics.
- Playwright tests against the Firebase emulator, plus read-only production smoke tests.

## Tech Stack

- **Web:** Next.js 16, React 19, TypeScript 5
- **UI:** MUI v7, Tailwind CSS v4, Framer Motion
- **Backend:** Firebase Auth, Firestore, Storage, Firebase Admin SDK
- **Payments:** Stripe Checkout, Billing Portal, webhooks
- **Email:** Resend
- **Testing:** Playwright, Firebase Auth and Firestore emulators

## Workout Logic

Core web workout configuration lives in `web/src/lib/workoutTimer.ts`, with timer state managed by `web/src/hooks/useWorkoutTimer.ts`.

- `WorkoutMode` is `"N" | "C" | "H"`.
- Beginner users only receive the 5-count/beginner mode (`"C"`).
- Advanced users can use Navy Seals (`"N"`), 5-count pushups (`"C"`), and Hybrid (`"H"`).
- Hybrid sessions split the full 20-minute workout into two 10-minute phases.
- Hybrid phase targets are calculated with `Math.ceil(fullGoal / 2)` per phase.
- The dashboard derives the default mode for the current weekday and passes it to `WorkoutTimer`.
- `useWorkoutTimer` handles mode changes, countdown state, phase crossover, rep resets, whistle sounds, and completion behavior.

Primary web entry points:

- `web/src/components/Dashboard.tsx`
- `web/src/components/WorkoutTimer/index.tsx`
- `web/src/components/WorkoutTimer/HybridDisplay.tsx`
- `web/src/components/WorkoutTimer/StandardDisplay.tsx`
- `web/src/components/WorkoutTimer/ModeSelector.tsx`
- `web/src/hooks/useWorkoutTimer.ts`

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Java for Firebase emulator tests
- Firebase CLI for emulator work
- Firebase project credentials for local web development
- Stripe credentials only if re-enabling paid subscription flows
- Resend API key for email flows

### Web App

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

Local web configuration lives in `web/.env.local` and is gitignored. It should include the Firebase, Stripe, Firebase Admin, and Resend values needed by the app.

## Common Commands

| Location | Command | Description |
|---|---|---|
| `web/` | `npm run dev` | Start the Next.js dev server |
| `web/` | `npm run build` | Build the web app for production |
| `web/` | `npm run lint` | Run ESLint |
| `web/` | `npm test` | Run Playwright tests against Firebase emulators |
| `web/` | `npm run test:ui` | Open Playwright UI mode |
| `web/` | `npm run test:report` | Open the Playwright HTML report |

## Testing

See `qadetails.md` for the full QA guide.

For local emulator tests:

```bash
cd web
cp .env.test.local.example .env.test.local
npm install
npx playwright install chromium
npm test
```

The Playwright setup starts the Firebase Auth emulator on `localhost:9099`, the Firestore emulator on `localhost:8080`, and the web app on `localhost:3000`. Test accounts are seeded automatically:

- `qa-user@test.com`
- `qa-admin@test.com`

For read-only production smoke tests:

```bash
cd web
npx playwright test --project=smoke
```

## Firebase

Firestore rules are in `firestore.rules`.

```bash
firebase deploy --only firestore:rules
```

Important data boundaries:

- Users can read and update only their own user document.
- Client writes cannot modify subscription fields such as `isPro`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, or `trialEndsAt`.
- Subscription state is written server-side through Firebase Admin SDK routes and Stripe webhooks.
- `pending_subscriptions` and `analytics` documents are server-only.

## Launch Access

Paid subscriptions are paused for launch. The web app currently grants full access so early users can train, test, and provide feedback. The native iOS app also uses launch-access wording in its pre-release build, but it is not published publicly yet.

Stripe Checkout, the customer portal, and webhook-driven subscription sync remain in the codebase for possible future paid plans.

Relevant web API routes live under `web/src/app/api/stripe/` and `web/src/app/api/claim-subscription/`.

## Admin Access

Admin access is controlled by an allowlist in `web/src/lib/allowlist.ts`. Admin users can view cross-user analytics and admin-only dashboards. Non-admin users are redirected away from admin pages.

## Deployment Notes

- The web app is configured as a Next.js app.
- Firebase rules are deployed separately with the Firebase CLI.
- Keep `.env.local` and `.env.test.local` out of version control.
- Run `cd web && npm run build` before shipping web changes.
- Run the Playwright suite for changes touching auth, dashboard, timers, subscriptions, admin, or routing.
