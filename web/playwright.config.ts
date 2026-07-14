import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local first, then .env.test.local can override
config({ path: path.resolve(__dirname, '.env.local') });
config({ path: path.resolve(__dirname, '.env.test.local'), override: true });

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
const appPort = process.env.PLAYWRIGHT_APP_PORT ?? '3001';
const appBaseUrl = `http://localhost:${appPort}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'html',
  globalSetup: useEmulator ? './tests/global-setup.ts' : undefined,
  use: {
    baseURL: appBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/smoke.spec.ts',
    },
    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.burpeepacers.com',
      },
      testMatch: '**/smoke.spec.ts',
    },
  ],
  webServer: [
    {
      command: `/bin/zsh -lc 'set -a; source .env.local >/dev/null 2>&1 || true; source .env.test.local >/dev/null 2>&1 || true; set +a; npm run dev -- --port ${appPort}'`,
      url: appBaseUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    ...(useEmulator
      ? [
          {
            // Run from repo root where firebase.json lives
            command: 'cd .. && firebase emulators:start --config firebase.playwright.json --only auth,firestore --project burpee-workout',
            url: 'http://127.0.0.1:4100',
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ]
      : []),
  ],
});
