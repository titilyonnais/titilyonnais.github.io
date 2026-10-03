import { test, expect } from '@playwright/test';

test('étude de cas : univers du produit et logo en particules', async ({ page }) => {
  await page.goto('/');
  await page.locator('#aether a[href="/projets/aether/"]').click();
  await page.waitForURL('**/projets/aether/');
  await expect(page.locator('body')).toHaveClass(/univers-aether/);
  await page.waitForFunction(() => window.__particules?.station === 'cas-logo');
  await expect(page.locator('main')).not.toContainText(/3 intentions/);
});

test('PostShip : vraies illustrations', async ({ page }) => {
  await page.goto('/projets/postship/');
  await expect(page.locator('img[src$="deploiement.svg"]')).toBeVisible();
});

test('le passage en particules est consommé à l’arrivée', async ({ page }) => {
  await page.goto('/');
  // Le passage n'existe qu'avec la toile : on attend qu'elle tourne (sinon le lien navigue simplement).
  await page.waitForFunction(() => !!window.__chef, null, { timeout: 15_000 });
  await page.locator('#clipper a[href="/projets/clipper/"]').click();
  await page.waitForURL('**/projets/clipper/');
  await expect(page.locator('body')).toHaveClass(/univers-clipper/);
  // Lu une fois : il ne doit plus rester dans la session.
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('passage'))).toBeNull();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.passage)).toBe('lu');
});
