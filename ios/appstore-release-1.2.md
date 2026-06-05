# BurpeePacers 1.2 — In-App Purchase Release

## What's New in 1.2
- StoreKit 2 in-app purchase for Pro tier (`com.burpeepacers.pro`)
- 60-day free trial for all new users
- Upgrade card on Dashboard when trial is active or expired
- Purchase and Restore Purchases flow in Account Settings
- Pro access gating: trial → StoreKit purchase → admin/allowlist fallback

---

## Test Cases

### 1. Trial Period (new user, < 60 days since startDate)

- [ ] Dashboard shows upgrade card with days remaining (e.g. "X days left in your trial")
- [ ] All Pro features are accessible during trial — timer, CSV export, stats
- [ ] Upgrade card shows product price fetched from App Store (e.g. "$9.99")
- [ ] Tapping upgrade card initiates StoreKit purchase sheet
- [ ] Account Settings → Purchases section shows price button (not a loading spinner after a moment)
- [ ] Account Status shows "Standard" (not "Pro") during trial — Pro is only granted after purchase

### 2. Purchase Flow

- [ ] Tapping "Upgrade to Pro" opens native StoreKit payment sheet
- [ ] Completing purchase dismisses sheet and grants Pro access immediately
- [ ] `hasProAccess` returns true after successful purchase
- [ ] Upgrade card disappears from Dashboard after purchase
- [ ] Account Settings shows "Account Status: Pro" after purchase
- [ ] Cancelling the payment sheet returns to app cleanly with no error

### 3. Restore Purchases

- [ ] Account Settings → Purchases → "Restore Purchases" button is visible for non-Pro users
- [ ] Tapping Restore on a device that previously purchased Pro restores access
- [ ] Tapping Restore on a device with no prior purchase shows no error (silently completes)

### 4. Trial Expired (simulate by setting startDate > 60 days ago in Firestore)

- [ ] Dashboard shows upgrade card with "Your trial has ended. Upgrade to Pro for lifetime access."
- [ ] Pro features are gated — CSV export, advanced stats not accessible
- [ ] Upgrade card price button is active and initiates purchase

### 5. Pro via Allowlist / Admin

- [ ] `kpaccess@gmail.com` and `krishnapradhan88@gmail.com` bypass purchase and get full access
- [ ] Admin users (isAdmin = true in Firestore) get full access regardless of StoreKit state
- [ ] No upgrade card shown for allowlisted or admin users

### 6. Loading / Error States

- [ ] Upgrade card shows a spinner while products are loading (`storeKit.isLoading = true`)
- [ ] If product fetch fails (airplane mode), upgrade card shows graceful fallback text
- [ ] Account Settings shows "Unable to load purchase options. Check your connection and try again." if products fail to load
- [ ] A purchase error (e.g. network drop mid-purchase) shows the error message inline

### 7. Transaction Listener (background updates)

- [ ] Killing and relaunching the app preserves Pro status (entitlements restored via `currentEntitlements`)
- [ ] A refunded purchase revokes Pro access on next launch

---

## App Store Connect Checklist

### In-App Purchase Setup
- [ ] Product ID `com.burpeepacers.pro` created in App Store Connect → In-App Purchases
- [ ] Price set and at least one localization added
- [ ] Product is in "Ready to Submit" state before submitting 1.2

### App Privacy (Nutrition Label)
- [ ] Purchase History data type added if not already present

### Version Info
- [ ] Version: **1.2**, Build: **2**
- [ ] "What's New" copy:
  > Unlock Pro with a one-time in-app purchase. New users get a 60-day free trial with full access — no credit card required.

---

## Submission Steps
1. Select **Any iOS Device (arm64)** as destination
2. Product → Archive
3. Distribute App → App Store Connect → Upload
4. Wait for processing (~10–15 min)
5. In App Store Connect, link the 1.2 build and attach the IAP product to the version
6. Submit for Review

---

## Notes
- StoreKit purchases require a **physical device** — sandbox testing also works on device with a sandbox Apple ID
- `isPro` in Firestore is the server-side source of truth (set by Stripe webhook on web); `storeKit.hasPro` is the iOS-side StoreKit entitlement — both independently grant access
- dSYM upload warnings for Firebase/gRPC frameworks are non-blocking and can be ignored
