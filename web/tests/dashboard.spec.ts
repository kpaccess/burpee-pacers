import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { newLoggedInContext, testUser, ensureOnboarded } from './helpers/auth';
import { seedUserData } from './helpers/firebase';

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  test.setTimeout(90_000);
  await seedUserData({ email: testUser.email, password: testUser.password, completedToday: false });
  ({ context, page } = await newLoggedInContext(browser, testUser));
  await ensureOnboarded(page);
});

test.afterAll(async () => {
  await context?.close();
});

test('dashboard renders after login', async () => {
  await expect(page.getByText('Session Timer')).toBeVisible();
});

test('hero start workout CTA is enabled when today is not completed', async () => {
  await seedUserData({ email: testUser.email, password: testUser.password, completedToday: false });
  await page.reload();
  await expect(page.getByRole('heading', { name: /keep your momentum going\./i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^start today's workout$/i }),
  ).toBeEnabled();
});

test('hero start workout CTA is disabled when today is already completed', async () => {
  await seedUserData({ email: testUser.email, password: testUser.password, completedToday: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: /keep your momentum going\./i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^workout completed today$/i }),
  ).toBeDisabled();
});

test('workout calendar shows day headers', async () => {
  // Match the chip label in the calendar grid (Mon appears in multiple places)
  await expect(page.getByText('Mon').first()).toBeVisible();
  await expect(page.getByText('Thu').first()).toBeVisible();
});

test('schedule controls show selectable workout days', async () => {
  await expect(page.getByRole('button', { name: /Mon · (Navy Seals|Burpees)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Wed · (5-Count|Burpees)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Fri · (Hybrid|Burpees)/ })).toBeVisible();
});

test('timer start button is visible', async () => {
  await expect(page.getByRole('button', { name: /^start$/i })).toBeVisible();
});

test('can interact with a workout day checkbox', async () => {
  const checkbox = page.locator('input[type="checkbox"]:not([disabled])').first();
  if (await checkbox.count() === 0) return; // no past workout days yet

  const initialChecked = await checkbox.isChecked();
  await checkbox.click();

  // Advanced track shows a type menu (N / C); close it and call the test done.
  // Beginner / non-Pro direct-toggles the checkbox state.
  const menu = page.locator('[role="menu"]');
  if (await menu.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden({ timeout: 3_000 });
  } else {
    // Wait for Firestore-backed state update, then restore
    const newChecked = await checkbox.isChecked({ timeout: 8_000 });
    if (newChecked !== initialChecked) {
      await checkbox.click();
    }
  }
});

test('starting the timer shows prepare countdown', async () => {
  const typeMenu = page.locator('[role="menu"]');
  if (await typeMenu.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(typeMenu).toBeHidden({ timeout: 3_000 });
  }

  await page.getByRole('button', { name: /^workout$/i }).click();
  const startBtn = page.getByRole('button', { name: /^start$/i });
  await startBtn.scrollIntoViewIfNeeded();
  await expect(startBtn).toBeVisible();
  await startBtn.click();
  await expect(page.getByText('Did you warm up?')).toBeVisible({ timeout: 3_000 });
  await page.getByRole('button', { name: /yes, start workout/i }).click();
  // After confirming warm-up, the 10-second prepare phase begins
  await expect(page.getByText('GET READY')).toBeVisible({ timeout: 3_000 });

  // Cancel and reset to leave timer in clean state for subsequent tests
  await page.getByRole('button', { name: /cancel/i }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
});

test('user menu and logout are accessible', async () => {
  // Logout button should exist somewhere in the dashboard
  await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
});
