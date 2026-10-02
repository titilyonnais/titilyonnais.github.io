import { test, expect } from '@playwright/test';

// En version calme, la toile est posée d'emblée et les cartes sont libres.
test.use({ reducedMotion: 'reduce' });

async function ouvrir(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('#aether .ae').scrollIntoViewIfNeeded();
  await expect(page.locator('#aether .ae')).toHaveClass(/libre/);
}

test('une carte se déplace à la souris', async ({ page, isMobile }) => {
  test.skip(isMobile, 'glisser à la souris : bureau seulement');
  await ouvrir(page);
  const carte = page.locator('#aether .carte').filter({ hasText: 'Tram 28' });
  const avant = (await carte.boundingBox())!;
  await page.mouse.move(avant.x + avant.width / 2, avant.y + avant.height / 2);
  await page.mouse.down();
  await page.mouse.move(avant.x + avant.width / 2 + 60, avant.y + avant.height / 2 + 40, { steps: 6 });
  await page.mouse.move(avant.x + avant.width / 2 + 120, avant.y + avant.height / 2 + 80, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const apres = (await carte.boundingBox())!;
  expect(Math.hypot(apres.x - avant.x, apres.y - avant.y)).toBeGreaterThan(60);
});

test('une carte se déplace aux flèches du clavier', async ({ page, isMobile }) => {
  test.skip(isMobile, 'clavier : bureau seulement');
  await ouvrir(page);
  const carte = page.locator('#aether .carte').filter({ hasText: 'Cargo' });
  const avant = (await carte.boundingBox())!;
  await carte.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const apres = (await carte.boundingBox())!;
  expect(apres.x - avant.x).toBeGreaterThan(24);
});

test('au doigt, la toile laisse défiler la page hors des cartes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'tactile : mobile seulement');
  await ouvrir(page);
  // Seules les cartes captent le geste ; la toile garde le défilement natif.
  const toile = await page.locator('#aether .toile').evaluate((e) => getComputedStyle(e).touchAction);
  const scene = await page.locator('#aether .ae').evaluate((e) => getComputedStyle(e).touchAction);
  expect(toile).not.toBe('none');
  expect(scene).not.toBe('none');
  const carte = await page.locator('#aether .carte').first().evaluate((e) => getComputedStyle(e).touchAction);
  expect(carte).toBe('none');
});
