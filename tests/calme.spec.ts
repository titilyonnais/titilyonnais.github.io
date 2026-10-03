import { test, expect } from '@playwright/test';
import { allerA, erreurs, montee, parcourir } from './aide';

test.describe('version calme (réduire les animations)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('tout est posé : pas de préchargeur, pas de boucle, pas de piste collante', async ({ page }) => {
    const errs = erreurs(page);
    await page.goto('/');
    await expect(page.locator('.pre')).toBeHidden();
    await parcourir(page);
    expect(await page.evaluate(() => window.__particules?.running ?? false)).toBe(false);
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

  test('les trois démos répondent sans délai', async ({ page }) => {
    await page.goto('/');
    // PostShip : pousser mène droit à l'alerte.
    await page.locator('#postship [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'postship');
    await page.locator('#postship [data-action="pousser"]').click();
    await expect(page.locator('#postship [data-etat-demo]')).toHaveAttribute('data-etat-demo', 'alerte', { timeout: 500 });
    // Clipper : « facture » ne garde que deux éléments.
    await page.locator('#clipper [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'clipper');
    await page.locator('#clipper input[type="search"]').fill('facture');
    await expect(page.locator('#clipper [data-item]:visible')).toHaveCount(2, { timeout: 500 });
    // ÆTHER : la pilule, Entrée, et dix cartes.
    await page.locator('#aether [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'aether');
    await page.locator('#aether [data-pilule]').click();
    await page.keyboard.type('compare rust et zig');
    await page.keyboard.press('Enter');
    await expect(page.locator('#aether [data-carte]')).toHaveCount(10, { timeout: 500 });
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
