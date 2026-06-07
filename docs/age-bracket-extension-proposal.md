# Proposal: Extend `AgeBracket` Beyond 50+

## Motivation

[hybrid_athlete_analysis.md](hybrid_athlete_analysis.md) describes how the BurpeePacer program could
serve athletes well into their 60s, 70s, and 80s — and the program's core design (no-jump movement,
self-paced metronome, scalable rep targets) genuinely supports that. But today's `AgeBracket` model
caps out at `FIFTIES_PLUS` ("50+"), so a 75-year-old user gets the exact same Friday finisher
(Assisted Pullups / One-Arm DB Rows, 3x12/side) as a 51-year-old. That's a wide span to serve with
one bracket, and it's the main gap between the analysis's aspirational framing and what the app
actually models today.

This proposal sketches what it would take to add finer-grained brackets for 60s, 70s, and 80+.

## Current State

`AgeBracket` is defined independently (but identically) in three places:

| Platform | File | Cases |
|---|---|---|
| Android | `android/app/src/main/java/com/burpeepacer/app/model/Models.kt:14-17` | `THIRTIES("30s")`, `FORTIES("40s")`, `FIFTIES_PLUS("50+")` |
| iOS | `ios/BurpeePacer/BurpeePacer/Models.swift:18-21` | `.thirties = "30s"`, `.forties = "40s"`, `.fiftiesPlus = "50+"` |
| Web | — | not modeled; `ageBracket` is not currently read by `Dashboard.tsx`/`workoutTimer.ts` |

It feeds exactly one piece of logic: `FinisherDatabase.getFinisher(day, age, equipment)`
(`Finishers.kt` / `FinisherDatabase.swift`), which picks a Mon/Wed/Fri strength finisher per the
table in [WORKOUT_SPECIFICATION.md §5](../ios/BurpeePacer/WORKOUT_SPECIFICATION.md#L81-L98).

## Proposed Change

### 1. New enum cases

Add three brackets, keeping the existing `"50+"` as a fallback default so existing users are
unaffected until they explicitly update their profile:

```
THIRTIES   ("30s")
FORTIES    ("40s")
FIFTIES    ("50s")     // narrows the old 50+ bucket
SIXTIES    ("60s")
SEVENTIES  ("70s")
EIGHTIES_PLUS ("80+")
```

> Renaming `FIFTIES_PLUS` → `FIFTIES` is a breaking change for anyone already stored as `"50+"` in
> Firestore/DataStore — see Migration below. If that churn isn't worth it, an additive-only option
> is to keep `FIFTIES_PLUS("50+")` as-is and add `SIXTIES`/`SEVENTIES`/`EIGHTIES_PLUS` above it,
> at the cost of a slightly inconsistent naming scheme.

### 2. New finisher mappings

Extending the existing Mon (Push) / Wed (Leg) / Fri (Pull) structure with lighter-load,
joint-friendlier variants — consistent with the coaching guidance in
[hybrid_athlete_analysis.md §age-by-age](hybrid_athlete_analysis.md):

| Day | 60s | 70s | 80+ |
|---|---|---|---|
| **Monday (Push)** | DB Incline Press, 3x10 | Wall/Bench Pushups, 3x10 | Seated DB Press, 2x10 |
| **Wednesday (Leg)** | DB Step-Ups, 3x10/side | Sit-to-Stands (DB optional), 3x12 | Bodyweight Sit-to-Stands, 2x10 |
| **Friday (Pull)** | Band-Assisted Rows, 3x10/side | Seated DB Rows, 3x10 | Resistance Band Pulls, 2x10 |

These are starting suggestions, not final prescriptions — they should be reviewed by whoever owns
exercise programming before shipping (form cues, injury-risk tradeoffs, and equipment availability
all matter more at this end of the spectrum than the exact rep scheme).

### 3. Files to touch

- **Android**: `model/Models.kt` (enum), `model/Finishers.kt` (3 new `when` branches per day),
  any Compose picker that lists `AgeBracket.entries` (e.g. onboarding/settings screens — search for
  `AgeBracket.entries` or `.values()`)
- **iOS**: `Models.swift` (enum), `FinisherDatabase.swift` (3 new `switch` branches per day),
  `AccountSettingsView.swift` / onboarding picker that enumerates `AgeBracket.allCases`
- **Web**: no change required today (doesn't model `ageBracket`), but if web ever surfaces
  finishers, it would need the same enum + mapping for parity (per `WORKOUT_SPECIFICATION.md §6`)
- **Spec**: update `WORKOUT_SPECIFICATION.md §5` finisher table to document the new brackets —
  it's the cross-platform source of truth and should be updated *before* the platform code, per
  its own stated purpose ("definitive technical reference... ensuring parity")

### 4. Migration considerations

- Existing Firestore/DataStore records store the raw string (`"50+"`, `"40s"`, etc.). If
  `FIFTIES_PLUS("50+")` is renamed/split, add a one-time decode fallback that maps a stored
  `"50+"` to `FIFTIES` (or prompt the user to re-select their bracket on next launch).
- If kept additive (`FIFTIES_PLUS` stays, new cases added above it), no migration is needed —
  this is the lower-risk path and is recommended for a first iteration.

## Recommendation

Ship additively first: keep `FIFTIES_PLUS("50+")` untouched, add `SIXTIES`, `SEVENTIES`,
`EIGHTIES_PLUS` above it with their own finisher mappings, and update the spec doc. This delivers
the age-appropriate programming the analysis calls for without touching existing user data, and a
later rename/rebalance of the 50s bucket can be done as a separate, deliberate migration if desired.
