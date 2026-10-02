import { test, expect } from '@playwright/test';
import { allerA, erreurs, parcourir } from './aide';

test.describe('version calme (réduire les animations)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('toutes les scènes sont posées dans leur état final, sans piste de défilement', async ({ page }) => {
    const errs = erreurs(page);
    await page.goto('/');
    await parcourir(page);
    for (const s of await page.locator('[data-scene]').all()) {
      await expect(s).toHaveAttribute('data-state', 'final');
    }
    const positions = await page.locator('.scene').evaluateAll((els) => els.map((e) => getComputedStyle(e).position));
    expect(positions.every((p) => p !== 'sticky')).toBe(true);
    // L'adresse e-mail tient dans l'écran sans animation.
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw).toBeLessThanOrEqual(iw);
    const email = (await page.locator('#contact .email').boundingBox())!;
    const lettres = await page.locator('#contact .email .l').last().boundingBox();
    expect(lettres!.x + lettres!.width).toBeLessThanOrEqual(email.x + email.width + 1);
    expect(errs).toEqual([]);
  });

  test('PostShip : score final 100 et sept vérifications en clair', async ({ page }) => {
    await page.goto('/');
    await page.locator('#postship').scrollIntoViewIfNeeded();
    await expect(page.locator('#postship .score')).toHaveText('100');
    await expect(page.locator('#postship .verif')).toHaveCount(7);
    await expect(page.locator('#postship .verif .st').last()).toHaveText('rétabli');
    await expect(page.locator('#postship .msg')).toContainText('71');
  });

  test('Clipper : la clé est masquée et marquée comme secret', async ({ page }) => {
    await page.goto('/');
    await page.locator('#clipper').scrollIntoViewIfNeeded();
    await expect(page.locator('#clipper .cle')).toHaveText(/^•+$/);
    await expect(page.locator('#clipper .secret .tag')).toHaveText('secret');
  });

  test('Méthode : tous les mots sont pleins', async ({ page }) => {
    await page.goto('/');
    await page.locator('.methode').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const pleins = await page.locator('.mot').evaluateAll((m) => m.every((e) => getComputedStyle(e).color !== 'rgba(0, 0, 0, 0)'));
    expect(pleins).toBe(true);
  });
});

test.describe('scènes au défilement', () => {
  test('PostShip passe par 71 puis revient à 100', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'postship', 0.66);
    await expect(page.locator('#postship .score')).toHaveText('71');
    await expect(page.locator('#postship .verif').last()).toHaveClass(/echec/);
    await allerA(page, 'postship', 0.95);
    await expect(page.locator('#postship .score')).toHaveText('100');
  });

  test('Clipper filtre sur « facture » : trois éléments', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'clipper', 0.58);
    await expect(page.locator('#clipper .q')).toHaveText('facture');
    await expect(page.locator('#clipper .compte')).toHaveText('3 éléments');
  });

  test('redimensionner au milieu d’une scène ne casse rien', async ({ page }) => {
    const errs = erreurs(page);
    await page.goto('/');
    await allerA(page, 'aether', 0.5);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(800);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#contact .email')).toBeVisible();
    expect(errs).toEqual([]);
  });
});
