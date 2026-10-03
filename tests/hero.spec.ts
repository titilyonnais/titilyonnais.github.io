import { test, expect } from '@playwright/test';
import { erreurs } from './aide';

test('le préchargeur s’efface en moins de 3 s, puis est sauté', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await expect(page.locator('.pre')).toBeAttached();
  await expect(page.locator('.pre')).toBeHidden({ timeout: 3000 });
  await page.goto('/projets/postship/');
  await page.goto('/');
  // Deuxième visite de la session : sauté dès le premier rendu.
  await expect(page.locator('html')).toHaveAttribute('data-pre', 'vu');
  await expect(page.locator('.pre')).toBeHidden({ timeout: 300 });
  expect(e).toEqual([]);
});

test('le hero dit la phrase et fait défiler les trois produits', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero .phrase')).toHaveText(/Trois logiciels en service\.\s*D’autres en route\./);
  const p = page.locator('[data-hero-produit]');
  await expect(p).toContainText('PostShip', { timeout: 5000 });
  await expect(p).toContainText('Clipper', { timeout: 20_000 });
  await expect(p).toContainText('ÆTHER', { timeout: 20_000 });
  await expect(p).toHaveAttribute('href', '#aether');
});

test('calme : pas de préchargeur, toile figée', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.pre')).toBeHidden({ timeout: 300 });
  await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 0, null, { timeout: 10_000 });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__particules!.running)).toBe(false);
  await ctx.close();
});

test('sans WebGL : les vrais logos s’affichent', async ({ page }) => {
  await page.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error surcharge de test
    HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) {
      return /webgl/.test(t) ? null : o.call(this, t, ...a);
    };
  });
  await page.goto('/');
  await expect(page.locator('.pre')).toBeHidden({ timeout: 3000 });
  await expect(page.locator('.hero .repli').first()).toBeVisible();
});
