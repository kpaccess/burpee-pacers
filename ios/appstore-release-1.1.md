# BurpeePacers 1.1 — Apple Watch Release Checklist

## Before Building

### Xcode Setup (already done)
- [x] watchOS target `BurpeePacerWatch Watch App` created
- [x] Minimum deployment: watchOS 10
- [x] HealthKit capability added to Watch target
- [x] Health Share usage description filled in
- [x] Health Update usage description filled in

### Xcode Setup (still needed)
- [ ] Add HealthKit capability to the iPhone target too (BurpeePacer → Signing & Capabilities → + HealthKit)
- [ ] Add WatchConnectivity framework to the Watch target (Watch target → Frameworks → + WatchConnectivity)
- [ ] Set Watch app icon (use same icon as iPhone app)

---

## Code (handled by Claude)
- [ ] `WatchSessionManager.swift` — receives WorkoutState from iPhone, sends commands back
- [ ] `WatchWorkoutView.swift` — live timer, rep counter, heart rate display
- [ ] `WatchIdleView.swift` — shown when no workout is active
- [ ] `WatchSummaryView.swift` — shown after workout ends
- [ ] `WatchContentView.swift` — routes between the above views
- [ ] Wire `PhoneSessionManager.push()` into `SessionTimerViewModel` (iPhone side)
- [ ] Move `HKWorkoutSession` from iPhone `HealthManager` to Watch target

---

## Testing on Your Watch

### First-time setup
1. Connect your iPhone to Mac via USB
2. In Xcode, select destination: **your Apple Watch** (it appears when iPhone is connected and Watch is paired)
3. Select scheme: **BurpeePacerWatch Watch App**
4. Press Run (⌘R) — Xcode installs the app on your Watch

### What to test
- [ ] Watch app launches and shows idle screen
- [ ] Start workout on iPhone → Watch shows live timer
- [ ] Tap Pause on Watch → iPhone timer pauses
- [ ] Tap +Rep on Watch → rep count updates on both devices
- [ ] End workout on Watch → saved to Apple Fitness app
- [ ] Heart rate displays live during session
- [ ] Works for all modes: Navy Seals, 5-Count, Hybrid

---

## App Store Connect (before submitting 1.1)

### App Privacy (Nutrition Label)
- [ ] Add **Health & Fitness** data type
  - Workout data → Used for App Functionality → Not linked to identity
  - Heart rate → Used for App Functionality → Not linked to identity

### Screenshots
- [ ] Add Apple Watch screenshots (40mm and 44mm sizes required)
  - Idle/home screen
  - Active workout screen showing timer + heart rate
  - Summary screen

### Version Info
- [ ] Bump version to **1.1** in both iPhone and Watch targets
- [ ] Bump build number to **11** (or next available)
- [ ] Update "What's New" in App Store Connect:
  > Apple Watch support — your burpee sessions now sync live to your Watch with heart rate tracking and full activity ring credit.

### Privacy Policy
- [ ] Update `burpeepacers.com/privacy` to mention HealthKit and Apple Watch

---

## Submission
1. Select **Any iOS Device (arm64)** as destination
2. Product → Archive
3. Distribute App → App Store Connect → Upload
4. Wait for processing (~10-15 min)
5. Select new build in App Store Connect → Submit for Review

---

## Notes
- HealthKit and Watch features require a **physical device** — simulator cannot test these
- Watch app installs automatically alongside the iPhone app — users don't download separately
- If 1.0 gets more rejection feedback, fix on `main` branch — Watch work stays on `release/1.1-watch`
