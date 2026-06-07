# App Store Deployment Reference

A step-by-step checklist for submitting an iOS app to the App Store.

---

## 1. Apple Developer Account

- Enroll at [developer.apple.com](https://developer.apple.com) — $99/year
- Accept latest agreements in App Store Connect

---

## 2. URLs You Must Have Ready

| URL | Required | Notes |
|-----|----------|-------|
| **Privacy Policy** | Yes | Must be publicly accessible before submission |
| **Support URL** | Yes | A page where users can get help (can be same site) |
| **Marketing URL** | No | Optional homepage/landing page |
| **Terms of Service** | No | Recommended if you have subscriptions |

For a quick privacy policy generator: [privacypolicygenerator.info](https://www.privacypolicygenerator.info) or [app-privacy-policy-generator](https://app-privacy-policy-generator.nisrulz.com)

---

## 3. App Store Connect — Create the App

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Apps → **+** → New App
3. Fill in:
   - **Platform**: iOS
   - **Name**: App Store display name (max 30 chars)
   - **Primary Language**
   - **Bundle ID**: must match Xcode project exactly
   - **SKU**: any unique internal string (e.g. `burpeepacer-001`)

---

## 4. App Metadata (App Store Connect)

Under the app's version page:

- **Description** — up to 4000 chars, first 3 lines show without "more"
- **Keywords** — up to 100 chars total, comma-separated
- **Subtitle** — up to 30 chars, shown under app name in search
- **What's New** — required for updates, blank for first submission
- **Support URL** — required
- **Privacy Policy URL** — required
- **Category** — pick primary (and optional secondary)

---

## 5. Screenshots

Required — at least one set for the largest screen size you support.

| Device | Size |
|--------|------|
| iPhone 6.9" (16 Pro Max) | 1320 × 2868 px |
| iPhone 6.5" (XS Max / 11 Pro Max) | 1242 × 2688 px |
| iPad 13" Pro (if supporting iPad) | 2064 × 2752 px |

- Minimum 1, max 10 per device
- Can use Xcode Simulator + screenshots, or a tool like [RocketSim](https://www.rocketsim.app)
- If you upload 6.9" screenshots, smaller iPhone sizes are inferred automatically

---

## 6. App Privacy (Data Collection)

In App Store Connect → App Privacy:
- Declare every data type you collect (name, email, usage data, etc.)
- For each type: is it linked to the user? Is it used for tracking?
- Firebase Auth + Firestore = at minimum declare **Email Address** and **User ID**
- Stripe = declare **Purchase History** and **Financial Info**

---

## 7. Age Rating

App Store Connect → App Information → Age Rating:
- Answer the questionnaire (violence, adult content, etc.)
- Rating is computed automatically

---

## 8. Pricing & Availability

- Set price tier (Free or paid)
- Select available countries
- If you have In-App Purchases or subscriptions — set them up under **Monetization → In-App Purchases** before submitting

---

## 9. Xcode — Prepare the Build

### Bundle ID & Version
- `PRODUCT_BUNDLE_IDENTIFIER` must match the Bundle ID registered in App Store Connect
- `MARKETING_VERSION` — user-facing version, e.g. `1.0.0`
- `CURRENT_PROJECT_VERSION` — build number, must increment with every upload (e.g. `1`, `2`, `3`)

### App Icons
- All required sizes must be filled — easiest via an `AppIcon.appiconset` in the asset catalog
- Use [appicon.co](https://www.appicon.co) to generate all sizes from one 1024×1024 image

### Signing
- Xcode → Signing & Capabilities → select your team
- Use **Automatically manage signing** (simplest)
- Xcode will create/refresh the distribution certificate and provisioning profile

### Capabilities
- Make sure any entitlements used (Push Notifications, Sign in with Apple, etc.) are enabled both in Xcode and in the App ID on developer.apple.com

### Archive
1. Select **Any iOS Device (arm64)** as the run destination (not a simulator)
2. Product → **Archive**
3. Xcode Organizer opens when done

---

## 10. Upload to App Store Connect

In Xcode Organizer:
1. Select the archive → **Distribute App**
2. Choose **App Store Connect**
3. Choose **Upload**
4. Leave all checkboxes as default → Next through signing
5. Upload completes — build appears in App Store Connect under **TestFlight** within ~15 min

---

## 11. TestFlight (Optional but Recommended)

- Add internal testers (up to 100, no review needed)
- Add external testers (up to 10,000, requires Beta App Review — ~1 day)
- Good to run at least one TestFlight build before full submission

---

## 12. Submit for Review

In App Store Connect → your version:
1. Scroll to **Build** section → select the uploaded build
2. Fill in **Review Information**:
   - Demo account credentials (if app requires login — required for BurpeePacers)
   - Notes to reviewer (optional, but helpful)
   - Contact info
3. Click **Add for Review** → **Submit to App Review**

Review typically takes **24–48 hours**. Check App Store Connect or email for status.

---

## 13. After Approval

- Choose **Manually release** or **Automatically release** when approved
- For manual: go to App Store Connect → Release This Version when ready
- First version goes live within a few hours of release

---

## Common Rejection Reasons

| Reason | Fix |
|--------|-----|
| Missing privacy policy | Add a real public URL |
| Broken demo account | Test it yourself before submitting |
| App crashes on launch | Run on a real device before archiving |
| Missing purpose strings (NSCameraUsageDescription etc.) | Add all `NS*UsageDescription` keys to Info.plist |
| Sign in with Apple missing | If you offer any third-party login, Apple SSO is required too |
| Metadata mismatch | Screenshots must reflect actual app UI |

---

## Useful Links

- App Store Connect: https://appstoreconnect.apple.com
- Developer portal (certs, IDs, profiles): https://developer.apple.com/account
- App Review guidelines: https://developer.apple.com/app-store/review/guidelines
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines


-------

What You Need for Deployment

1. App Icon - YES, you need this! 🎨
You referenced an App​Logo image in your code, but for deployment you need a proper App Icon set in your Assets catalog with all required sizes:

• 1024×1024 (App Store)
• 180×180 (iPhone 3x)
• 120×120 (iPhone 2x)
• 167×167 (iPad Pro)
• 152×152 (iPad 2x)
• 76×76 (iPad 1x)

To add it:
1. Open your Assets​.xcassets in Xcode
2. Right-click → New iOS App Icon
3. Drag your burpee-themed icon images into each size slot
   

     1. appicon.co — paste one 1024×1024 image, download a zip with every required iOS size already named correctly. Drop the
  AppIcon.appiconset folder straight into your Xcode asset catalog. Easiest option.
  2. makeappicon.com — similar, also handles Android if you ever need it.
  3. icon.kitchen — Google's tool, works for iOS too, lets you customize background color, padding, and shape before
  downloading.
  4. canva.com — design the 1024×1024 base icon there (free tier is fine), export as PNG, then run it through appicon.co to
  generate all the Xcode sizes.

  Recommended flow: design or source a 1024×1024 PNG (no transparency, no rounded corners — iOS applies the mask itself) → drop
   into appicon.co → unzip → drag the AppIcon.appiconset folder into your Xcode asset catalog replacing the existing one.
