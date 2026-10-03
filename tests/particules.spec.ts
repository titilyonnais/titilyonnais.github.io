import { test, expect } from '@playwright/test';
import { erreurs } from './aide';

test('la toile tourne puis se met en pause quand l’onglet est caché', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 10, null, { timeout: 15_000 });
  expect(await page.evaluate(() => window.__particules!.running)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  const f = await page.evaluate(() => window.__particules!.frames);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__particules!.frames)).toBe(f);
  expect(await page.evaluate(() => window.__particules!.running)).toBe(false);
  expect(e).toEqual([]);
});

test('perte du contexte WebGL : bascule sans WebGL', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 2, null, { timeout: 15_000 });
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>('#particules')!.getContext('webgl2')!;
    gl.getExtension('WEBGL_lose_context')!.loseContext();
  });
  await expect(page.locator('html')).toHaveAttribute('data-particules', 'off');
});

test('sans WebGL2 : html[data-particules=off]', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error surcharge de test
    HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) {
      return t === 'webgl2' || t === 'webgl' ? null : orig.call(this, t, ...a);
    };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-particules', 'off');
});
