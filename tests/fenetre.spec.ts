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

test('redimensionner pendant l’arrivée garde le contour de la fenêtre', async ({ page, isMobile }) => {
  test.skip(isMobile, 'un redimensionnement de bureau');
  await page.goto('/');
  await page.waitForFunction(() => !!window.__chef, null, { timeout: 15_000 });
  await allerA(page, 'postship', 0.05);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.05);
  await page.waitForFunction(() => window.__chef?.forme === 'contour', null, { timeout: 5000 });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__chef?.forme)).toBe('contour');
});

test('un changement de zoom du navigateur est suivi par la toile', async ({ page, isMobile }) => {
  test.skip(isMobile, 'émulation CDP de bureau');
  await page.goto('/');
  await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 2, null, { timeout: 15_000 });
  const cdp = await page.context().newCDPSession(page);
  // Un zoom à 200 % : la page voit deux fois moins de pixels CSS, chacun fait deux pixels d'écran.
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 450, deviceScaleFactor: 2, mobile: false });
  await page.waitForTimeout(500);
  const [w, iw] = await page.evaluate(() => [document.querySelector<HTMLCanvasElement>('#particules')!.width, innerWidth]);
  expect(w).toBe(iw * 2);
});

test('l’invite de chaque scène n’est pas une seconde annonce pour les lecteurs d’écran', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-invite]')).toHaveCount(3);
  await expect(page.locator('[data-invite][aria-live]')).toHaveCount(0);
});

test('les invites suivent la typographie française', async ({ page }) => {
  await page.goto('/');
  for (const id of ['postship', 'clipper', 'aether']) {
    await allerA(page, id, 0.7);
    await montee(page, id);
    const t = (await page.locator(`#${id} [data-invite]`).textContent()) ?? '';
    // Avant ; : ! ? » et après « : une espace fine insécable (U+202F), jamais une espace ordinaire.
    expect(t, t).not.toMatch(/[^\u202f][;:!?»]|«[^\u202f]/);
  }
});
