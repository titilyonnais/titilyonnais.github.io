import { test, expect } from '@playwright/test';
import { montee } from './aide';

test('un clic sur l’adresse la copie et le dit', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await montee(page, 'contact');
  await page.locator('#contact .email').click();
  await expect(page.locator('#contact .statut')).toHaveText('Copié');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('tmorretton@gmail.com');
  await expect(page.locator('#contact a[href="mailto:tmorretton@gmail.com"]')).toBeVisible();
});
