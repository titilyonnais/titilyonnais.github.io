import { test, expect } from '@playwright/test';
import { allerA, erreurs, montee } from './aide';

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

test('les cibles des trois logos tombent dans leur boîte', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__particulesApi, null, { timeout: 15_000 });
  const r = await page.evaluate(async () => {
    const out: Record<string, boolean> = {};
    for (const k of ['postship', 'clipper', 'aether', 'arobase', 'fleche']) {
      const p = await window.__particulesApi!.cible(k, { x: 100, y: 100, w: 400, h: 300 }, 5000);
      let ok = p.length === 15000;
      for (let i = 0; i < p.length; i += 3) ok &&= p[i]! >= 99 && p[i]! <= 501 && p[i + 1]! >= 99 && p[i + 1]! <= 401;
      out[k] = ok;
    }
    return out;
  });
  expect(r).toEqual({ postship: true, clipper: true, aether: true, arobase: true, fleche: true });
});

test('perte du contexte WebGL : plus de chef, les fenêtres ne l’attendent plus', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__chef, null, { timeout: 15_000 });
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>('#particules')!.getContext('webgl2')!;
    gl.getExtension('WEBGL_lose_context')!.loseContext();
  });
  await expect(page.locator('html')).toHaveAttribute('data-particules', 'off');
  await expect.poll(() => page.evaluate(() => !!window.__chef)).toBe(false);
  // À l'arrivée (t = 0,05), sans toile, la fenêtre est là tout de suite.
  await allerA(page, 'postship', 0.05);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.05);
  await expect(page.locator('#postship [data-fenetre]')).toHaveAttribute('data-vue', '1');
});
