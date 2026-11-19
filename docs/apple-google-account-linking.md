# Sign in with Apple and existing Google accounts

## Sharing your real email
If you choose **Share My Email** in Sign in with Apple and that email already has a BurpeePacers account through Google:
- the app asks you to sign in with Google once;
- it then connects Apple to that account.

After that, both buttons open the same account.

## Hide My Email
If you choose **Hide My Email**, Apple gives the app a private relay address (`…@privaterelay.appleid.com`). The app can't match that to an existing account.

The first time you sign in this way, the app shows **"Already have an account?"**:

- **Yes, connect my Google account:** sign in with Google once. The app removes the empty Apple-only account it just created and connects Apple to your Google account. Your workouts stay as they are, and from then on Apple and Google both open the same account.
- **No, I'm new here:** the Apple account is kept and you continue to track selection.

## Connecting later
You can always connect Apple to an existing account:
1. Sign in with Google.
2. Open **Account settings**.
3. Tap **Continue with Apple**.

The account should then show `Connected: Apple, Google`. It may also include `Email`, which is fine.

## If Apple says it's already connected to another account
An earlier Apple sign-in created a separate Firebase account. To fix it:
1. Delete that duplicate Apple account in the Firebase Console (Authentication → Users).
2. Sign in with Google.
3. Connect Apple from Account settings.
