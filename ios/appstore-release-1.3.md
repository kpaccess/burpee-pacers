# BurpeePacers 1.3 — Apple Watch Improvements + Weighted Training

## Version bump before archiving
- **Version (MARKETING_VERSION):** 1.2 → **1.3**
- **Build (CURRENT_PROJECT_VERSION):** 5 → **6**

Change both in Xcode → BurpeePacer target → General → Identity, and again in BurpeePacerWatch target.

---

## What's New in 1.3

### Apple Watch — Phase 2

- Watch app opens automatically when you start the iPhone timer (via HealthKit `startWatchApp`)
- Countdown haptics at **4 / 3 / 2 / 1 seconds** before each rep boundary — strong buzz + beep each beat
- Haptic fires the moment the workout goes active so you know to look at the Watch
- Rep counter now starts at **1** (not 0) — consistent with iPhone display
- Watch countdown is driven by a **local timer** — no more 1-second lag behind the iPhone
- **Start button** on Watch idle screen — tap to start the workout from your wrist
- Watch state syncs from stored context when Watch app opens mid-workout
- Post-workout summary shows even if HealthKit session was not started

### Weighted Training (opt-in)

- New **"Weighted Training"** toggle in Account Settings → Personalization
- Off by default — users who don't want it never see it
- When enabled, a card appears on the Dashboard below the calendar **on workout days only**
  - Monday → Day 1: Pulling + Biceps
  - Wednesday → Day 2: Pushing + Shoulders
  - Friday → Day 3: Legs + Core
- Card is collapsible — tap to expand/collapse the exercise list
- Shows sets, reps, and coaching notes for each exercise
- Non-workout days (Tue/Thu/Sat/Sun) — card does not appear

---

## Test Cases

### 1. Watch — Auto-open

- [ ] With Watch app installed, tap **Start** on iPhone timer — Watch app comes to foreground within 5 seconds (you feel a buzz as it opens)
- [ ] Check Xcode console for `"HealthManager: Successfully requested watch app start"` — confirm no failure log
- [ ] If Watch app is backgrounded (user navigated away), starting a new workout on iPhone brings Watch app back to foreground
- [ ] Watch idle screen shows **Start** button — tapping it starts the timer on iPhone and Watch activates

### 2. Watch — Rep counter

- [ ] Timer starts → Watch shows **1 / [goal]** immediately (not 0)
- [ ] iPhone shows same number as Watch at all times
- [ ] After auto-increment, both iPhone and Watch increment together
- [ ] Manual +/- on Watch increments the iPhone counter and vice versa

### 3. Watch — Countdown haptics

- [ ] At 4, 3, 2, 1 seconds before each rep boundary — Watch vibrates (`.notification` strength) with an audible beep
- [ ] Each of the 4 seconds produces a **distinct** buzz (not just one buzz at 4 seconds)
- [ ] At the moment the rep auto-increments, iPhone plays the whistle sound
- [ ] When workout goes active (after 5-second countdown), Watch plays a single **start** haptic

### 4. Watch — Lag

- [ ] Start timer — iPhone and Watch countdown should stay within **1 second** of each other at all times
- [ ] Pause and resume — Watch countdown resumes in sync with iPhone

### 5. Watch — Phase transitions

- [ ] **Idle → Prepare:** Watch shows "Get Ready" with 5-second countdown
- [ ] **Prepare → Active:** Watch transitions to workout view with rep ring and timer
- [ ] **Active → Paused:** Pause on iPhone → Watch pauses; pause on Watch → iPhone pauses
- [ ] **Active → Finished:** Timer hits 0:00 → Watch shows summary screen (reps, duration, calories)
- [ ] **Finished → Idle (Reset):** Reset on iPhone → Watch returns to idle screen
- [ ] **Hybrid mode (Friday):** Watch shows correct phase label ("Navy Seals" → "5-Count Pushups") at 10-minute mark

### 6. Watch — HealthKit

- [ ] Starting a workout records an HKWorkout of type Functional Strength Training
- [ ] Heart rate appears on Watch workout view during active session
- [ ] Calorie count appears on post-workout summary
- [ ] Workout appears in Apple Health app after session ends

### 7. Watch — Edge cases

- [ ] Open Watch app manually **before** starting iPhone timer — idle screen shows, no crash
- [ ] Start iPhone timer with Watch app **closed** — Watch app opens via `startWatchApp`
- [ ] Start iPhone timer with Watch **screen off** — feel haptic, raise wrist to see workout view
- [ ] Kill Watch app mid-workout, reopen it — should re-sync from stored WatchConnectivity context

### 8. Weighted Training — Toggle

- [ ] Account Settings → Personalization → "Weighted Training" toggle is visible
- [ ] Default state is **off** — no weighted card on Dashboard
- [ ] Toggle on → Dashboard shows weighted training card on Mon/Wed/Fri
- [ ] Toggle off → card disappears from Dashboard immediately
- [ ] Toggle state persists across app restarts

### 9. Weighted Training — Card content

- [ ] **Monday:** Card shows "Day 1 — Pulling + Biceps" with chin-ups, rows, barbell curl, hammer curl
- [ ] **Wednesday:** Card shows "Day 2 — Pushing + Shoulders" with overhead press, incline press, laterals, triceps
- [ ] **Friday:** Card shows "Day 3 — Legs + Core" with goblet squat, RDL, lunges, plank
- [ ] **Other days (Tue/Thu/Sat/Sun):** Card does not appear even when toggle is on
- [ ] Each exercise row shows: sets ×, exercise name, rep target, coaching note

### 10. Weighted Training — Card interaction

- [ ] Card starts **collapsed** (just shows title and focus area)
- [ ] Tapping card header **expands** it to show exercise list
- [ ] Tapping again **collapses** it
- [ ] Animation is smooth (no jank)
- [ ] Card scrolls naturally with the rest of the Dashboard

### 11. Regression — Existing features

- [ ] Burpee timer starts, pauses, resets correctly on iPhone
- [ ] Hybrid mode phase crossover works at 10-minute mark on iPhone
- [ ] Rep counter on iPhone starts at 1 and auto-increments correctly
- [ ] Pacing strip and rep pace guide text show correctly during workout
- [ ] Workout saves correctly to Firestore after completion
- [ ] Calendar grid shows completed days correctly
- [ ] Account Settings — all existing toggles (reminders, weight unit, age bracket, equipment) still work
- [ ] StoreKit purchase and restore still work (if Pro)

---

## New Files Added to Xcode Project

The following files were created and must be added to the **BurpeePacer** (iPhone) target before building:

| File | Target |
|---|---|
| `BurpeePacer/WeightedTrainingModels.swift` | BurpeePacer |
| `BurpeePacer/WeightedTrainingCard.swift` | BurpeePacer |
| `BurpeePacerWatch Watch App/WatchSoundManager.swift` | BurpeePacerWatch Watch App |

**How to add:** In Xcode Project Navigator, right-click the target folder → "Add Files to BurpeePacer" → select the file → ensure the correct target checkbox is ticked.

---

## App Store Connect — Version Info

- [ ] Version: **1.3**, Build: **6**
- [ ] "What's New" copy:
  > Apple Watch improvements: workout now opens Watch app automatically, rep counter syncs from the first second, and you get a strong haptic countdown before each rep. Plus a new optional Weighted Training plan on your Dashboard — toggle it on in Settings.

---

## Submission Steps

1. Select **Any iOS Device (arm64)** as destination
2. Product → Archive
3. Distribute App → App Store Connect → Upload
4. Wait for processing (~10–15 min)
5. In App Store Connect, link the 1.3 build
6. Submit for Review

---

## Notes

- WatchConnectivity and HKWorkoutSession **require physical devices** — full phone↔watch flow cannot be tested in simulator
- `startWatchApp` requires HealthKit authorization on the iPhone — first launch will prompt for permission; if user previously denied it, go to Settings → Privacy → Health → BurpeePacers and re-enable
- The `WatchSoundManager` uses `AVAudioEngine` to synthesize tones — no bundled audio files needed
- Weighted Training card is stored in `UserDefaults` (`weightedTrainingEnabled`) — local only, not in Firestore
