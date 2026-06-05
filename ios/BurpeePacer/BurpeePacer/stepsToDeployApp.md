# BurpeePacer – iOS App Store Deployment Checklist

Step-by-step record of everything needed to publish BurpeePacer on the App Store.

**App Details**
- Bundle ID: `com.BurpeePacers.BurpeePacers`
- Display Name: BurpeePacers
- Version: 1.0, Build 1
- Archive created: 2026-05-26
- Dependencies: Firebase, Google Sign-In, Firestore

---

## Phase 1 – App Icon

- [x] Generate 1024×1024 app icon image
- [x] Create all required icon sizes
- [x] Add 1024.png to Assets.xcassets → AppIcon in Xcode
- [x] Verified Contents.json references 1024.png correctly

---

## Phase 2 – Xcode Project Setup

- [x] Bundle ID set: `com.BurpeePacers.BurpeePacers`
- [x] Display Name: BurpeePacers
- [x] Version: 1.0, Build: 1
- [x] Deployment Target: iOS 17.0+
- [x] Firebase configured (GoogleService-Info.plist present)
- [x] Google Sign-In URL scheme added to Info.plist
- [x] Photo library usage descriptions added to Info.plist
- [ ] Set signing to your Apple Developer Team in Xcode → Target → Signing & Capabilities
- [ ] Switch signing identity from "Apple Development" to "Apple Distribution" for App Store upload

---

## Phase 3 – Privacy Policy

- [x] Write privacy policy
- [x] Host privacy policy online
- [x] Privacy policy URL: **https://www.burpeepacers.com/privacy**

---

## Phase 4 – Screenshots

- [ ] Run app on iPhone 15 Pro Max simulator
- [ ] Capture 3–10 screenshots showing:
  1. Dashboard with stats and calendar
  2. Active workout timer (20-min countdown with rep counter)
  3. Workout calendar grid with completed sessions
  4. Stats/profile card with weight and protein tracker
  5. Progress photos section
- [ ] Required size: **1290 × 2796px** (iPhone 6.7") — simulator auto-generates correct size with Cmd+S
- [ ] Optional: iPad Pro 12.9" screenshots (2048 × 2732px) if supporting iPad

---

## Phase 5 – App Store Connect Listing

- [ ] Go to appstoreconnect.apple.com → My Apps → + → New App
- [ ] Fill in:
  - Platform: iOS
  - Name: `BurpeePacer - Burpee Workout Timer` *(keyword-rich name)*
  - Primary Language: English (U.S.)
  - Bundle ID: `com.BurpeePacers.BurpeePacers`
  - SKU: `burpeepacers-2026`
- [ ] Set Categories:
  - Primary: **Health & Fitness**
  - Secondary: **Sports**
- [ ] Set Age Rating: 4+
- [ ] Set Pricing: Free
- [ ] Set Availability: All Countries

### App Store Page Content

**Subtitle (30 chars):**
```
20-Min Burpee Program Tracker
```

**Keywords (100 chars — don't repeat words from name/subtitle):**
```
fitness,workout,timer,reps,burpees,strength,cardio,daily,goals,program,routine,discipline
```

**Description (copy/edit as needed):**
```
BurpeePacer is a minimalist fitness tracker built around the Busy People Program — 20-minute time-capped burpee workouts, 3 days a week.

SIMPLE. EFFECTIVE. PROVEN.
Follow a structured progression from beginner to advanced, logging each rep as you go. The 20-minute countdown keeps you honest.

FEATURES:
• 20-minute countdown timer with rep counter
• Beginner track: B1–B6 (20 to 110 reps)
• Advanced track: A1–A5 (30 to 150 reps)
• Mon/Wed/Fri workout calendar with completion tracking
• Auto-advance to next level when you hit your target
• Protein target calculator (1.5g × bodyweight)
• Progress photo milestones (Day 1 & 6-month)
• CSV export of full workout history
• Dark mode design

No fluff. No subscriptions. Just burpees.
```

- [ ] Fill in Support URL (your privacy policy URL)
- [ ] Fill in App Review Notes: "Sign in with Google required. Firebase is used for authentication. All workout data stored locally on device."

---

## Phase 6 – App Privacy (App Store Connect)

Because this app uses Google Sign-In and Firebase, you **must** disclose data collection:

- [ ] Go to App Privacy in App Store Connect
- [ ] Declare data types collected:
  - **Name** (from Google account) — linked to user, used for app functionality
  - **Email address** (from Google account) — linked to user, used for app functionality
  - **User ID** — linked to user, used for app functionality
- [ ] If Firebase Analytics is active, also declare: **Usage Data**, **Crash Data**
- [ ] Complete and publish the privacy nutrition label

---

## Phase 7 – Build & Upload

- [x] Archive created: `build/BurpeePacer.xcarchive` (created 2026-05-26)
- [ ] Open Xcode Organizer (Window → Organizer) and locate the archive
- [ ] Click **Validate App** — fix any errors
- [ ] Click **Distribute App** → App Store Connect → Upload
- [ ] Wait 10–30 min for build to process in App Store Connect

---

## Phase 8 – Final Submission

- [ ] In App Store Connect, go to version 1.0 → Prepare for Submission
- [ ] Upload screenshots
- [ ] Select uploaded build
- [ ] Answer Export Compliance:
  - App uses Firebase which includes standard HTTPS encryption → Answer **Yes** to encryption
  - Select **Exempt** (standard encryption, no custom algorithms)
- [ ] Answer Advertising Identifier: **No** (unless Firebase Analytics is enabled)
- [ ] Check Content Rights box
- [ ] Click **Add for Review** → **Submit to App Review**

---

## Phase 9 – Post-Launch

- [ ] Add `SKStoreReviewController.requestReview()` after a user completes a workout (great natural moment)
- [ ] Share on Reddit r/bodyweightfitness, r/fitness, r/SideProject
- [ ] Post on Twitter/X with #IndieDev #fitness
- [ ] Ask early users to leave a rating
- [ ] Monitor Firebase crash reports and Firestore usage

---

## Key Facts

| Field | Value |
|---|---|
| App Name (target) | BurpeePacer - Burpee Workout Timer |
| Bundle ID | com.BurpeePacers.BurpeePacers |
| Current Version | 1.0 Build 1 |
| Archive Status | ✅ Built 2026-05-26 |
| Firebase | ✅ Configured |
| Google Sign-In | ✅ Configured |
| App Icon | ❌ Needs to be added |
| Privacy Policy | ❌ Needs to be written & hosted |
| App Store Listing | ❌ Not created yet |

---

## Important Notes

- **Firebase/Google Sign-In = data disclosure required.** Unlike a local-only app, you must declare data collection in App Store privacy labels or Apple will reject the app.
- **Export compliance:** Firebase uses standard encryption — answer Yes to encryption question, then select Exempt.
- **Signing:** The archive was signed with "Apple Development" certificate. You need to re-sign with "Apple Distribution" when uploading to App Store Connect (Xcode handles this automatically during Distribute).
