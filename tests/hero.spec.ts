import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __redim?: Promise<unknown>;
  }
}
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

test('le hero ne lance jamais deux boucles de logos', async ({ page, isMobile }) => {
  test.skip(isMobile, 'un redimensionnement de bureau');
  test.setTimeout(90_000);
  await page.goto('/');
  await page.waitForFunction(() => window.__particules?.station === 'hero', null, { timeout: 15_000 });
  await page.waitForTimeout(1500);
  // Nouvelle largeur : les formes se recalculent. Pendant ce calcul, on quitte le hero et on y revient deux fois.
  await page.evaluate(() => {
    window.__redim = new Promise((r) => addEventListener('resize', () => r(null), { once: true }));
  });
  const redim = page.setViewportSize({ width: 1300, height: 900 });
  await page.evaluate(async () => {
    await window.__redim;
    const image = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    const y = document.querySelector('.methode')!.getBoundingClientRect().top + scrollY;
    for (let k = 0; k < 2; k++) {
      scrollTo(0, y);
      await image();
      scrollTo(0, 0);
      await image();
    }
  });
  await redim;
  // Une seule boucle change de logo toutes les 5,2 s : deux changements au plus en 11 s.
  const n = await page.evaluate(
    () =>
      new Promise<number>((r) => {
        const nom = document.querySelector('[data-hero-produit] .nom')!;
        let c = 0;
        new MutationObserver(() => c++).observe(nom, { childList: true, characterData: true, subtree: true });
        setTimeout(() => r(c), 11_000);
      }),
  );
  expect(n).toBeLessThanOrEqual(2);
});
