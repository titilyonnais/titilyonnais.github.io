import { test, expect } from '@playwright/test';
import { allerA, montee, prendreLaMain } from './aide';

test('la fenêtre s’éclate puis se réassemble', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'postship', 0.3);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.3);
  // La profondeur passe par la propriété translate (une démo peut garder transform pour elle).
  const z = await page.locator('#postship [data-couche]').nth(1).evaluate((e) => getComputedStyle(e).translate);
  expect(z).toMatch(/px$/);
  expect(z).not.toMatch(/ 0px$/);
  await allerA(page, 'postship', 0.7);
  await expect(page.locator('#postship .scene')).toHaveAttribute('data-demo', 'on');
});

test('la fenêtre tient dans son théâtre', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'postship', 0.7);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.7);
  const [f, t] = await Promise.all(
    ['#postship [data-fenetre]', '#postship .theatre'].map((s) => page.locator(s).evaluate((e) => e.getBoundingClientRect().toJSON())),
  );
  expect(f.width).toBeLessThanOrEqual(t.width + 1);
  expect(f.height).toBeLessThanOrEqual(t.height + 1);
});

test('redimensionner pendant la démo garde l’état', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'postship', 0.7);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.7);
  await prendreLaMain(page);
  await expect(page.locator('#postship [data-etat-demo]')).toHaveAttribute('data-etat-demo', /verifie|panne|alerte|retabli/);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(400);
  await expect(page.locator('#postship [data-etat-demo]')).not.toHaveAttribute('data-etat-demo', 'repos');
});

test('en descendant pas à pas, le contour de la fenêtre se dessine à son arrivée', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__chef, null, { timeout: 15_000 });
  const [cible, h] = await page.evaluate(() => {
    const p = document.querySelector<HTMLElement>('#postship .piste')!;
    const top = p.getBoundingClientRect().top + scrollY;
    return [top + 0.05 * (p.offsetHeight - innerHeight), innerHeight];
  });
  // On part de deux écrans et demi plus haut (la scène se monte un écran à l'avance), puis on descend.
  for (let y = cible - 2.5 * h; y < cible; y += h / 8) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), cible);
  await page.waitForFunction(() => window.__chef?.forme === 'contour', null, { timeout: 3000 });
});
