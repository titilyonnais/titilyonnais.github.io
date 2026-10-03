import { test, expect } from '@playwright/test';

test('les coutures sont dessinées', async ({ page }) => {
  await page.goto('/');
  for (const c of await page.locator('[data-couture]').all()) {
    await expect(c).toHaveAttribute('data-ready', '1');
  }
});
