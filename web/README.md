# BurpeePacer — Web App

The Next.js web app for BurpeePacer, deployed at [burpeepacers.com](https://www.burpeepacers.com).

## Stack

- **Framework:** Next.js 16, React 19, TypeScript 5
- **UI:** MUI v7, Tailwind CSS v4, Framer Motion
- **Backend:** Firebase Auth, Firestore, Storage, Firebase Admin SDK
- **Payments:** Stripe Checkout, Billing Portal, webhooks
- **Email:** Resend
- **Testing:** Playwright, Firebase Auth and Firestore emulators

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Configuration lives in `.env.local` (gitignored); copy from `.env.local.example` and fill in Firebase, Stripe, Firebase Admin, and Resend values.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Playwright E2E tests against Firebase emulator
npm run test:ui      # Playwright interactive UI
npm run test:report  # Open last HTML test report
```

## Testing

Tests run against the Firebase emulator (never production). Requires Java (`brew install --cask temurin`).

```bash
cp .env.test.local.example .env.test.local
npx playwright install chromium
npm test
```

Seeded test accounts: `qa-user@test.com`, `qa-admin@test.com`. See `docs/qadetails.md` for the full QA guide.

## Deployment

Pushes to `main` deploy automatically to Vercel. No manual deploy step needed.

To deploy Firestore rules separately:

```bash
firebase deploy --only firestore:rules
```

## Key Directories

| Path | Description |
|------|-------------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/components/` | React components (Dashboard, WorkoutTimer, etc.) |
| `src/hooks/` | Custom hooks (`useWorkoutTimer`, `useUserData`, `useSubscription`) |
| `src/lib/` | Shared utilities (Firebase, Stripe, Resend, workout logic) |
| `src/types/` | TypeScript type definitions |
| `tests/` | Playwright E2E tests |
