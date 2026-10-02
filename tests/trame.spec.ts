import { test, expect, chromium } from '@playwright/test';

test('le masque du nom est prêt une fois les polices chargées', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-hero] canvas')).toHaveAttribute('data-mask-ready', '1');
  // Des images ont bien été tirées.
  await expect.poll(() => page.evaluate(() => window.__dither?.frames ?? 0)).toBeGreaterThan(5);
});

test('la boucle de rendu s’arrête quand le hero n’est plus visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__dither?.running)).toBe(false);
});

test('les coutures sont dessinées', async ({ page }) => {
  await page.goto('/');
  for (const c of await page.locator('[data-couture]').all()) {
    await expect(c).toHaveAttribute('data-ready', '1');
  }
});

test('sans WebGL, le nom s’écrit en toutes lettres', async ({ baseURL }) => {
  const browser = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const page = await browser.newPage();
  await page.goto(baseURL + '/');
  await expect(page.locator('html')).toHaveAttribute('data-dither', 'off');
  await expect(page.locator('.hero h1')).toBeVisible();
  const box = await page.locator('.hero h1').boundingBox();
  expect(box!.width).toBeGreaterThan(200);
  await browser.close();
});
