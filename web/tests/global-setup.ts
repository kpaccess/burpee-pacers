// Runs once before all Playwright tests when NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.
// We only normalize emulator host env here. Auth accounts are created lazily
// from the test helpers so they do not race the emulator startup sequence.
export default async function globalSetup() {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') return;

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST?.startsWith('http')) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = new URL(
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
    ).host;
  }
}
