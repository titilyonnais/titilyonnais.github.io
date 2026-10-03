import { test, expect } from '@playwright/test';
import { allerA, erreurs, montee, prendreLaMain } from './aide';

test('PostShip : pousser casse le paiement, revenir le répare', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await allerA(page, 'postship', 0.7);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.7);
  const s = page.locator('#postship');
  await prendreLaMain(page);
  await expect(s.locator('[data-check]').nth(4)).toContainText('500', { timeout: 5000 });
  await expect(s.locator('[data-score]')).toHaveText('60');
  await expect(s.locator('[role="status"]')).toContainText('#alertes');
  await s.locator('[data-action="retour"]').click();
  await expect(s.locator('[data-etat-demo]')).toHaveAttribute('data-etat-demo', 'retabli', { timeout: 5000 });
  await expect(s.locator('[data-score]')).toHaveText('100');
  await expect(s).toContainText('Rétabli en 3,8 s');
  expect(e).toEqual([]);
});

test('PostShip : se joue seul après inaction', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'postship', 0.7);
  await expect(page.locator('#postship [data-etat-demo]')).toHaveAttribute('data-etat-demo', 'retabli', { timeout: 15000 });
});

test('au clavier, le focus suit la démo jusqu’à « Remettre en ligne le précédent »', async ({ page, isMobile }) => {
  test.skip(isMobile, 'clavier : bureau');
  await page.goto('/');
  await allerA(page, 'postship', 0.7);
  await montee(page, 'postship');
  await allerA(page, 'postship', 0.7);
  const s = page.locator('#postship');
  await s.locator('[data-etat-demo]').dispatchEvent('pointerdown'); // la main est prise
  await s.locator('[data-action="pousser"]').focus();
  await page.keyboard.press('Enter');
  await expect(s.locator('[data-etat-demo]')).toHaveAttribute('data-etat-demo', 'alerte', { timeout: 8000 });
  await expect(s.locator('[data-action="retour"]')).toBeFocused();
});

test.describe('calme', () => {
  test.use({ reducedMotion: 'reduce' });
  test('PostShip calme : la fenêtre est posée de face, la démo marche', async ({ page }) => {
    await page.goto('/');
    await page.locator('#postship [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'postship');
    const s = page.locator('#postship');
    await expect(s.locator('[data-fenetre]')).toHaveAttribute('data-vue', '1');
    await prendreLaMain(page);
    await expect(s.locator('[data-score]')).toHaveText('60');
    await s.locator('[data-action="retour"]').click();
    await expect(s.locator('[data-score]')).toHaveText('100');
  });
});
