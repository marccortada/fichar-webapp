import { test, expect } from '@playwright/test';

test('redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});
