import { test, expect } from '@playwright/test';
import { erreurs, montee, stable } from './aide';

test('la station suit le scroll, saut direct compris', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await page.waitForFunction(() => window.__particules?.station === 'hero', null, { timeout: 15_000 });
  // Saut direct par le sommaire : on arrive sur le contact sans rester bloqué en route.
  await page.click('.nav a[href="/#contact"]');
  await page.waitForFunction(() => window.__particules?.station === 'contact', null, { timeout: 4000 });
  expect(await page.evaluate(() => document.documentElement.dataset.fond)).toBe('ink');
  // Le défilement doux doit être arrivé avant qu'on saute ailleurs.
  await stable(page);
  await page.evaluate(() => document.querySelector('.methode')!.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForFunction(() => window.__particules?.station.startsWith('methode'), null, { timeout: 4000 });
  expect(await page.evaluate(() => document.documentElement.dataset.fond)).toBe('paper');
  expect(e).toEqual([]);
});

test('plus aucune trame : ni coutures ni canvas tramé', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-couture]')).toHaveCount(0);
});

test('contact : copier forme la coche puis revient à l’arobase', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.evaluate(() => document.querySelector('#contact')!.scrollIntoView({ behavior: 'instant' }));
  await page.waitForFunction(() => window.__chef?.forme === 'arobase', null, { timeout: 8000 });
  await montee(page, 'contact');
  // Les formes visées, image par image : la coche ne dure que 1,6 s.
  await page.evaluate(() => {
    const w = window as unknown as { __vu: string[] };
    w.__vu = [];
    const t = () => {
      w.__vu.push(window.__chef!.forme);
      requestAnimationFrame(t);
    };
    t();
  });
  await page.click('[data-copier]');
  await page.waitForFunction(() => (window as unknown as { __vu: string[] }).__vu.includes('coche'), null, { timeout: 4000 });
  await page.waitForFunction(() => window.__chef?.forme === 'arobase', null, { timeout: 4000 });
});
