# Existing Users: Connect Apple Sign-In to Your Gmail Account

If you already use BurpeePacers with Gmail or Google, sign in with Google first. Do not start by using Sign in with Apple from the login screen.

## Why

Apple can hide your real email and send the app a private relay email instead. That private relay email may look like it forwards to your Gmail, but Firebase treats it as a different login identity unless it is connected to your existing account.

## What To Do

1. Open BurpeePacers.
2. Tap **Sign in with Google**.
3. Confirm your existing workout data appears.
4. Tap the account icon in the top-right.
5. In Account settings, tap **Continue with Apple**.
6. Wait for **Apple Sign-In Connected**.
7. Sign out.
8. Sign in with Apple.

After this, Google and Apple will open the same BurpeePacers account and the same workout data.

## What You Should See

In Account settings, the account should show:

```text
Connected: Apple, Google
```

Some accounts may also show:

```text
Connected: Apple, Email, Google
```

That is okay. It means Apple is connected to the existing account.

## If Apple Opens A New/Empty Account

Sign out and sign in with Google again. Then connect Apple from Account settings. If Apple says it is already connected to another account, the duplicate Apple/private-relay Firebase account must be removed before connecting again.
