import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('shows page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /launch access/i })).toBeVisible();
  });

  test('shows launch access subtitle', async ({ page }) => {
    await expect(
      page.getByText(/BurpeePacers is free for everyone during launch/i),
    ).toBeVisible();
  });

  test('shows beginner card with free price', async ({ page }) => {
    await expect(page.getByText('BEGINNER', { exact: true })).toBeVisible();
    await expect(page.getByText('Included during launch', { exact: true })).toBeVisible();
  });

  test('shows advanced card as free during launch', async ({ page }) => {
    await expect(page.getByText('ADVANCED', { exact: true })).toBeVisible();
    await expect(page.getByText('Full launch access', { exact: true })).toBeVisible();
  });

  test('unauthenticated user sees start free CTA', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /^start free$/i }),
    ).toBeVisible();
  });

  test('back to app button returns to home', async ({ page }) => {
    await page.getByRole('button', { name: /back to app/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('hides checkout wording during launch', async ({ page }) => {
    await expect(page.getByText(/\$4\.99/i)).toHaveCount(0);
    await expect(page.getByText(/subscribe/i)).toHaveCount(0);
  });
});
