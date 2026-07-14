import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /simple 20-minute home conditioning you can actually stick with/i,
      }),
    ).toBeVisible();
  });

  test('shows primary and secondary hero actions with clear account paths', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /^start your first workout$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^see how it works$/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/new here\? start with your first workout above\./i),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /already a member\? sign in/i }),
    ).toBeVisible();
  });

  test('primary hero CTA navigates to signup flow', async ({ page }) => {
    await page.getByRole('button', { name: /^start your first workout$/i }).first().click();
    await expect(page).toHaveURL(/\/login\?signup=1$/);
  });

  test('pricing details link navigates to pricing page', async ({ page }) => {
    await page.getByRole('button', { name: /see pricing details/i }).click();
    await expect(page).toHaveURL('/pricing');
  });

  test('launch messaging is supporting text instead of a competing CTA', async ({ page }) => {
    await expect(
      page.getByText(/free during launch\. full web access is currently included\./i),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /free during launch/i }),
    ).toBeVisible();
  });

  test('sign in link navigates to login', async ({ page }) => {
    await page.getByRole('button', { name: /already a member/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
