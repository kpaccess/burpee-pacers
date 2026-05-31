# QA Testing Guide — BurpeePacer

This document explains how to set up your machine, run tests locally against the Firebase emulator, and run read-only smoke tests against the live production site.

---

## Prerequisites

- Node.js 18+ and npm
- Git
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- Java (required by the Firebase emulator)

---

## QA Onboarding Steps (one-time)

### 1. Pull the latest code

```bash
git pull origin main
```

### 2. Install Java (required by the Firebase emulator — skip if already installed)

```bash
brew install --cask temurin
```

> Verify it worked: `java -version` should print a version number.

### 3. Create your local environment file from the committed template

```bash
cd web
cp .env.test.local.example .env.test.local
```

The defaults in the template work as-is. **No values need to be changed** for emulator tests — the test accounts (`qa-user@test.com` and `qa-admin@test.com`) are created automatically in the emulator before each test run.

> `.env.test.local` is gitignored. It lives only on your machine and is never committed.

### 4. Install dependencies and Playwright browsers

```bash
cd web
npm install
npx playwright install chromium
```

---

## Running Tests

### Emulator tests — isolated, safe, no production data touched

This is the standard QA mode. Playwright automatically starts the Next.js dev server and the Firebase emulator before the tests run. Test accounts are seeded automatically.

```bash
cd web && npm test
```

What happens behind the scenes:
- Firebase Auth and Firestore emulators start on `localhost:9099` and `localhost:8080`
- A `qa-user@test.com` and `qa-admin@test.com` account are created in the emulator
- The Next.js dev server starts on `localhost:3000` pointed at the emulator (not production)
- All tests run in Chromium
- An HTML report is generated at `web/playwright-report/index.html`

To view the report after a run:

```bash
npx playwright show-report
```

### Live production smoke tests — read-only, no login, no data written

Runs a small set of checks directly against `https://www.burpeepacers.com`. These tests only assert that pages load and key UI elements are visible. They never log in and never write any data.

```bash
cd web && npx playwright test --project=smoke
```

---

## Running Specific Scenarios

Run a single spec file:

```bash
npx playwright test tests/auth.spec.ts
npx playwright test tests/dashboard.spec.ts
npx playwright test tests/pricing.spec.ts
npx playwright test tests/admin.spec.ts
```

Run a single test by name:

```bash
npx playwright test -g "timer start button"
npx playwright test -g "non-admin is redirected"
```

Run with a visible browser (useful for debugging):

```bash
npx playwright test --headed
```

Step through a test interactively:

```bash
npx playwright test tests/auth.spec.ts --debug
```

Open the interactive Playwright UI (best for exploring and filtering tests):

```bash
npx playwright test --ui
```

---

## Manual QA Checklist

Use this checklist for release testing in addition to automated tests.

### Launch Access / Pricing

- Landing page says the app is free during launch.
- Landing page CTA says "View Launch Access" instead of "Advanced Pricing".
- Pricing page headline says "Launch Access".
- Pricing page shows Beginner and Advanced as free during launch.
- Pricing page does not show monthly/yearly prices, Stripe checkout buttons, "Subscribe", "Upgrade to Pro", or "60-day trial" wording.
- "Start Free" sends signed-out users to login and "Open App" sends signed-in users to the dashboard.
- Advanced content, CSV export, and timer features are available without a paid subscription during launch.

### Custom Workout Schedule

- Landing page explains that three workout days per week is recommended, but users can customize their schedule.
- Logged-in dashboard schedule card shows Mon, Wed, and Fri selected by default for existing users.
- Tapping a selected day removes it from the schedule, unless it is the only selected day.
- Tapping an unselected day adds it back to the schedule.
- The workout calendar updates immediately to mark only selected days as workout days.
- The selected schedule persists after refresh and after signing out and back in.
- Beginner users see "Burpees" labels on schedule chips.
- Advanced users see Navy Seals on Monday, 5-Count on Wednesday, and Hybrid on Friday.

### iOS App

- Native landing screen includes "Free during launch".
- Native track selection does not mention subscriptions, pricing, or trials.
- Beginner and Advanced tracks can both be selected without any paywall.
- Account Settings lets users toggle Mon/Wed/Fri workout days while keeping at least one day selected.
- Workout reminders use the selected workout days and selected reminder time.
- iOS still builds and launches after the launch-access copy changes.

### Regression Areas

- New account onboarding still creates a usable profile.
- Existing accounts without `workoutDays` still default to Mon/Wed/Fri.
- Timer completion still logs today's workout.
- Advanced Friday Hybrid completion still unlocks pulling work.
- Admin dashboard still loads for allowlisted admin users.
- Privacy and success pages still load, even though checkout is hidden during launch.

---

## Test Coverage at a Glance

| Spec file | Pages / flows covered | Needs login? |
|---|---|---|
| `auth.spec.ts` | `/login`, sign-up form toggle, wrong-credential error | No |
| `landing.spec.ts` | `/` (unauthenticated), CTA and nav links | No |
| `pricing.spec.ts` | `/pricing`, plan cards, trust badges | No |
| `dashboard.spec.ts` | `/` (logged in), timer, calendar, workout checkbox, logout | Yes — `qa-user@test.com` |
| `admin.spec.ts` | `/admin` access control (non-admin redirect + admin full access) | Yes — both accounts |
| `smoke.spec.ts` | Landing, login, pricing on live site | No |

---

## Troubleshooting

**Emulator fails to start**
- Confirm Java is installed: `java -version`
- Confirm Firebase CLI is installed: `firebase --version`
- Make sure ports 9099 and 8080 are not already in use

**Tests fail with "Firebase not configured" error**
- Check that `web/.env.test.local` exists and contains `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`
- Re-run `cp .env.test.local.example .env.test.local` if the file is missing

**Dashboard or admin tests fail immediately**
- The emulator is ephemeral — data resets each time the emulator restarts. The `global-setup.ts` script re-creates the test accounts on every run, so this should be automatic. If you see auth errors, stop everything and re-run `npm test` from scratch.

**Smoke tests fail**
- Check your internet connection
- The production site may be temporarily down — verify manually at `https://www.burpeepacers.com`
