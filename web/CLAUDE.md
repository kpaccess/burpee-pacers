# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config, v9)
```

```bash
# Run all Playwright E2E tests (starts dev server + Firebase emulator automatically)
npm test

# Run a single test file
npx playwright test tests/dashboard.spec.ts

# Run a single test by name
npx playwright test -g "shows admin dashboard heading"

# Run smoke tests against production
npx playwright test --project=smoke

# Open interactive test UI
npm run test:ui

# View last HTML report
npm run test:report
```

Tests require `web/.env.test.local` (copy from `web/.env.test.local.example`). The emulator is started automatically when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` is set in that file. Java is required for the Firebase emulator (`brew install --cask temurin`). Seeded test accounts: `qa-user@test.com` and `qa-admin@test.com`.

## Architecture

**BurpeePacer** is a burpee workout tracker. Users follow structured programs (Beginner B1–B6 or Advanced 1A–4/Grad), log workouts, and currently receive full launch access while paid plans are paused.

### Stack
- **Next.js App Router** (src/app/) — pages and API routes colocated
- **Firebase Auth** — client-side authentication via `src/context/AuthContext.tsx` (`useAuth` hook)
- **Firestore** — primary database (client via `src/lib/db.ts`, server via `firebase-admin`)
- **Stripe** — payment plumbing retained for possible future paid plans (webhook at `/api/stripe/webhook`)
- **MUI v7** dark theme + **Tailwind CSS v4** for styling
- **Resend** — transactional email via `src/lib/email.ts`

### Monorepo Structure

This is one of the active packages under `/burpee-workout/`:
- `web/` — this Next.js app
- `ios/BurpeePacer/` — native iOS app, pre-release only

### Key Data Flow

`src/app/page.tsx` is the app shell. It renders conditionally: `LandingPage` → `Onboarding` → `MilestoneCheckin` → `Dashboard` based on auth/user state.

User data lives in a single Firestore doc (`users/{userId}`). `useUserData` (`src/hooks/useUserData.ts`) manages all reads/writes. `useSubscription` (`src/hooks/useSubscription.ts`) remains for subscription state, but the launch UI currently grants full access. Types are defined in `src/types/index.ts`.

### Workout Logic

- `src/lib/workoutTimer.ts` — `buildWorkoutTimerConfig()` builds tier-specific workout configs (modes, goals). Beginner: single (C) mode counting burpees without pushups. Advanced: Navy Seals, 5-count pushups, and Hybrid modes.
- `src/hooks/useWorkoutTimer.ts` — React hook wrapping the timer state machine.

### Launch Access & Subscription Plumbing
- **Stripe webhooks** update `isPro` and `subscriptionStatus` in Firestore
- **Allowlist** (`src/lib/allowlist.ts`, server variant `src/lib/allowlist-server.ts`): emails in `NEXT_PUBLIC_ADMIN_EMAILS` are admins; `NEXT_PUBLIC_ADMIN_EMAILS` + `ALLOWLISTED_EMAILS` get free Pro via `isAllowlisted()`; `isAdmin()` gates `/admin`
- **Guest checkout**: Stripe session stores email in `pending_subscriptions` collection; claimed via `/api/claim-subscription` after signup
- `<ProGate>` (`src/components/ProGate.tsx`) is legacy gating UI; current launch copy points users to launch access
- New onboarding still stores `trialEndsAt` for compatibility, but checkout is hidden during launch

### Admin API Auth
All `/api/admin/*` routes are protected the same way: the client sends a Firebase ID token in the `Authorization: Bearer <token>` header, the route verifies it server-side with `firebase-admin`'s `verifyIdToken`, then calls `isAdmin(decoded.email)` (checks against `NEXT_PUBLIC_ADMIN_EMAILS`). There is no separate admin secret — see `src/app/api/admin/stats/route.ts` for the canonical pattern.

### API Routes

| Route | Purpose |
|---|---|
| `/api/stripe/checkout` | Create Stripe checkout session |
| `/api/stripe/portal` | Open Stripe billing portal |
| `/api/stripe/webhook` | Handle Stripe events → update Firestore |
| `/api/claim-subscription` | Link guest Stripe payment to new Firebase user |
| `/api/send-welcome-email` | Send welcome email via Resend (deduped via `welcomeEmailSent` flag) |
| `/api/analytics/visit` | Increment page view counter |
| `/api/admin/stats` | Admin-only: user list + analytics |
| `/api/admin/allowlist` | Admin-only: read/manage the `allowlisted_emails` Firestore collection |
| `/api/admin/toggle-test-user` | Admin-only: flip `isTestUser` on a given user doc |

### Path Aliases
`@/*` maps to `src/*`.

### Environment Variables
Required (prefix `NEXT_PUBLIC_` for client-side Firebase vars):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON string for admin SDK (falls back to GCP default credentials)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_ADMIN_EMAILS` — comma-separated admin emails; gates `/admin` and `/api/admin/*`
- `ALLOWLISTED_EMAILS` — comma-separated emails granted free Pro access (in addition to admins)
- `EMAIL_FROM` — sender address for Resend (default: `BurpeePacer <hello@burpeepacers.com>`)

### Deployment
Pushes to `main` deploy automatically to Vercel. Firestore rules deploy separately: `firebase deploy --only firestore:rules`.
