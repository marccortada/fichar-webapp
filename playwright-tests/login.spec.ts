import { test, expect } from '@playwright/test';

test('renders login form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /accede/i })).toBeVisible();
});
