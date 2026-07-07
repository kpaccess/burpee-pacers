# Web Code Review — 2026-07-07

_Scope: full `web/` codebase (not a diff). Companion doc: `web-architecture-design.md`._

## Executive Summary

**Overall risk: Medium-High.** The security fundamentals are good (webhook signature verification, per-route ID-token checks, server-only admin gating, sensible Firestore rules), but there are three critical issues: new-user onboarding appears to be **blocked by the Firestore rules** it ships with, privilege-ish fields (`isAdmin`, `isTestUser`) are **client-writable**, and progress photos are stored as **base64 data URLs inside the user doc** (1 MB doc limit).

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 5 |
| Medium | 8 |
| Low | 5 |

---

## Critical

### C-1 · Onboarding write violates the Firestore `create` rule
`web/src/components/Onboarding.tsx:81` sends `trialEndsAt` in the first-ever save for a new user. `firestore.rules` denies `create` when the doc contains `trialEndsAt` (it's in the protected-keys list). `saveUserDataDB` uses `setDoc(merge)`, which counts as a **create** when the doc doesn't exist — so a brand-new user's onboarding save is rejected with `permission-denied` (surfaced as the "Failed to sync data" error).
**Fix**: stop writing `trialEndsAt` from the client (launch access doesn't need it; `useSubscription` can keep reading legacy values). Alternatively set it server-side.

### C-2 · `isAdmin` / `isTestUser` / `welcomeEmailSent` are client-writable
`firestore.rules` only protects the five Stripe fields. Any authenticated user can `setDoc({ isAdmin: true })` on their own doc.
- Web ignores `userData.isAdmin` (admin gating is email-based), but **iOS grants Pro when `userData.isAdmin == true`** (`AppViewModel.hasProAccess`).
- `isTestUser` skews admin analytics; `welcomeEmailSent` is benign but should still be server-owned.
- `Login.tsx:53` (`stampAdminIfAllowlisted`) currently relies on this hole — it writes `isAdmin` from the client.
**Fix**: add `isAdmin`, `isTestUser`, `welcomeEmailSent` to the protected keys in both `create` and `update` rules; move admin stamping server-side (e.g. inside `/api/send-welcome-email` after token verification, using `isServerAdmin`).

### C-3 · Photos stored as base64 data URLs in Firestore
`Onboarding.tsx:52-60` and `MilestoneCheckin.tsx:28-37` put `FileReader.readAsDataURL` output straight into `startPictureUrl` / `endPictureUrl`. A typical phone photo (2–8 MB → +33% base64) blows past Firestore's 1 MB document limit, so onboarding/check-in fails; smaller images permanently bloat every read of the user doc. There's also no size/type validation. `Dashboard.handleDay1PictureChange` already does this correctly (validate → upload to Storage → store download URL).
**Fix**: reuse the Dashboard upload pattern in both components.

---

## High

### H-1 · Checkout redirect URLs are attacker-controllable
`web/src/app/api/stripe/checkout/route.ts:8,25-26` accepts `successUrl`/`cancelUrl` from the (optionally unauthenticated) request body and passes them to Stripe. Anyone can mint a checkout session on your Stripe account that redirects to an arbitrary site after payment — a phishing primitive.
**Fix**: ignore client-supplied URLs (or accept only path fragments appended to `baseUrl`).

### H-2 · Guest subscriptions never downgrade
Guest checkout sessions carry no `firebaseUserId` metadata (checkout.ts:58-63), so after the user claims the subscription, `invoice.payment_failed` and `customer.subscription.deleted` (webhook.ts:103-134) can't resolve a user — a canceled guest subscription keeps `isPro: true` forever.
**Fix**: when `/api/claim-subscription` links the user, also `stripe.subscriptions.update(subId, { metadata: { firebaseUserId: uid } })`.

### H-3 · Workout timer drifts when the tab is backgrounded
`useWorkoutTimer.ts:146-290` decrements `secondsLeft` once per `setInterval` tick. Browsers throttle background-tab timers (Chrome: ~1/min), so a 20-minute workout timer effectively freezes when the user switches apps or the phone locks — likely mid-workout. The effect also depends on `secondsLeft`, tearing down and recreating the interval every second (adds per-tick latency drift even in the foreground).
**Fix**: anchor to wall clock — record `startedAt`/accumulated-pause timestamps and derive `secondsLeft` from `Date.now()` each tick; keep the 1 s interval purely as a UI refresh.

### H-4 · Client-side `isAllowlisted()` silently sees an empty allowlist
`lib/allowlist.ts:18-25` reads `process.env.ALLOWLISTED_EMAILS`, which is server-only, but the function is called from client code (`useSubscription.ts:38`, `Login.tsx:54`). In the browser it degrades to admins-only. Currently masked by launch mode (`isPro` hardcoded), but it will bite when subscriptions are re-enabled.
**Fix (when re-enabling payments)**: derive allowlisted-Pro from the server (`isPro` is already set server-side when an allowlisted user is added/signs up), and restrict the client helper to admin-UI affordances.

### H-5 · Level definitions diverge from the shared cross-platform scheme
`types/index.ts:62-164` defines Advanced `F,1,2,3,4,E` (15/40 … 70/120) and B-goals `20…90`, while the root CLAUDE.md, iOS, and Android document `1A–grad` (20/50 … 150/325) and B-goals `20…110`. `currentLevelId` is shared through Firestore, so `"F"`/`"E"` won't resolve in `LevelDatabase` on the native apps.
**Fix**: cross-platform product decision required — pick one scheme, migrate stored `currentLevelId`s. Not auto-fixable web-side.

---

## Medium

### M-1 · UTC date parsing skews day counts
`Dashboard.tsx:287` (`new Date("YYYY-MM-DD")`) parses as UTC midnight; in negative-UTC-offset timezones (US), `daysPassed`/milestone math is off by one, and workouts done in the evening can land on the "wrong" day relative to the calendar (which correctly appends `"T00:00:00"` at line 1240). Same issue in `admin/page.tsx:623` (`getCurrentDay`).

### M-2 · Duplicate JSX branch in Stats Overview
`Dashboard.tsx:731-765`: the `isAdvancedTrack ? … : …` ternary renders two byte-identical blocks.

### M-3 · CSV export lacks formula-injection guard
`Dashboard.tsx:386-388` quotes cells but doesn't neutralize leading `= + - @`; a note like `=HYPERLINK(...)` executes when the CSV is opened in Excel/Sheets. Low likelihood (users export their own notes), still cheap to guard.

### M-4 · Admin stats does one Firestore read per user
`admin/stats/route.ts:76-78` fires an unbounded `Promise.all` of individual `get()`s for every Auth user. Use `db.getAll(...refs)` in chunks; fine today, degrades linearly with signups.

### M-5 · `analytics/visit` does two sequential writes
`analytics/visit/route.ts:33-34`: the `set` + `update` pair can be a single `set({pageViews: increment, dailyViews.<day>: increment}, {merge:true})`. Also unauthenticated → trivially spammable counter (accepted risk for launch analytics).

### M-6 · Welcome-email dedupe has a read-then-write race
`send-welcome-email/route.ts:69-86`: two concurrent calls (Login fires it on every sign-in) can both pass the `welcomeEmailSent` check and double-send. Use a transaction or conditional update.

### M-7 · Login button spins forever if Firebase env is missing
`Login.tsx:124-130`: `setIsLoading(true)` precedes the `!auth` early-return, and it's never reset.

### M-8 · Whole-doc optimistic save (last-write-wins)
`useUserData.saveUserData` merges local state and rewrites all changed fields including the full `workoutLogs` array. Two devices editing concurrently (web + iOS) can silently drop each other's logs. Acceptable at current scale; worth a note before user counts grow.

---

## Low

- **L-1** Dead code: `lib/db.ts` `getUserData` and `logWorkoutDB` are unused (the latter also skips log normalization/`levelCompleted`).
- **L-2** `admin/page.tsx:498` uses `key={u.email}` — collides for multiple `"(no email)"` users; use `u.uid`.
- **L-3** Timer-finished Hybrid workouts are logged as `N` (`Dashboard.tsx:851`) while the manual calendar menu logs `H` — inconsistent history data for the same workout type.
- **L-4** `pending_subscriptions` docs never expire; an unclaimed guest payment grants Pro to whoever verifies that email years later.
- **L-5** No `storage.rules` in the repo (and no `storage` block in `firebase.json`) even though the client uploads to `users/{uid}/photos/`; Storage security is unversioned/console-managed. Also `allowlist-server.ts` has the `server-only` import commented out.

## Recommended Actions

1. **Before next deploy (critical batch)**: C-1, C-2, C-3.
2. **Security/correctness batch**: H-1, H-2, H-3, M-7.
3. **Cleanups**: M-1–M-6, L-1–L-3.
4. **Product decisions (not code fixes)**: H-5 level-scheme unification, H-4/launch-mode strategy, L-4 pending-sub expiry, L-5 storage rules into the repo, past-day logging UX (calendar disables past days entirely — users can't back-fill yesterday's workout).

## Positive Notes

- Stripe webhook does proper signature verification and safe idempotent merges.
- All API routes consistently verify Firebase ID tokens; admin routes double-check `email_verified` + server-side email list.
- Firestore rules correctly fence subscription fields and default-deny everything else.
- `useWorkoutTimer`'s derived-state approach (hybrid phase from `secondsLeft`, refs for callbacks) is clean; timer UI is well decomposed.
- Playwright E2E suite runs against the emulator with seeded accounts — good safety net for the fixes below.
