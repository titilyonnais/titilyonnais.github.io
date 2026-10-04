import { test, expect } from '@playwright/test';
import { allerA, erreurs, montee } from './aide';

test('Clipper : chercher, révéler, coller', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await montee(page, 'clipper');
  await allerA(page, 'clipper', 0.7);
  const s = page.locator('#clipper');
  await s.locator('input[type="search"]').fill('facture');
  await expect(s.locator('[data-item]:visible')).toHaveCount(2);
  // Le secret se trouve par son titre (Clipper n'indexe pas son contenu). Le cliquer dans la liste
  // complète faisait défiler la page sous le défilement doux, et le clic tombait parfois cinq lignes plus bas.
  await s.locator('input[type="search"]').fill('sensible');
  await expect(s.locator('[data-item]:visible')).toHaveCount(1);
  await s.locator('[data-item][data-type="secret"]').click();
  await s.locator('[data-action="afficher"]').click();
  await expect(s.locator('[data-apercu]')).toContainText('sk-');
  // Même chose pour le code : on le cherche, on vérifie qu'il est bien la ligne choisie, puis Entrée.
  await s.locator('input[type="search"]').fill('total');
  const code = s.locator('[data-item][data-type="code"]:visible').first();
  await code.click();
  await expect(code).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(s.locator('[data-blocnotes]')).toContainText('def ', { timeout: 8000 });
  expect(e).toEqual([]);
});

test('Clipper : se joue seul après inaction', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await expect(page.locator('#clipper [data-blocnotes]')).not.toBeEmpty({ timeout: 15000 });
});

test('Clipper : Ctrl+1 colle le premier, Échap vide la recherche', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await montee(page, 'clipper');
  await allerA(page, 'clipper', 0.7);
  const s = page.locator('#clipper');
  const champ = s.locator('input[type="search"]');
  await champ.fill('tanneurs');
  await expect(s.locator('[data-item]:visible')).toHaveCount(1);
  await page.keyboard.press('Control+1');
  await expect(s.locator('[data-blocnotes]')).toContainText('Tanneurs', { timeout: 8000 });
  await champ.focus();
  await page.keyboard.press('Escape');
  await expect(champ).toHaveValue('');
  await expect(s.locator('[data-item]:visible')).toHaveCount(14);
});

test('Ctrl+1 marche aussi en AZERTY : la touche physique compte', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await montee(page, 'clipper');
  await allerA(page, 'clipper', 0.7);
  const s = page.locator('#clipper');
  const champ = s.locator('input[type="search"]');
  await champ.fill('tanneurs');
  await expect(s.locator('[data-item]:visible')).toHaveCount(1);
  // Sur AZERTY, Ctrl+1 donne key « & » ; seule la touche physique (code Digit1) dit 1.
  await champ.evaluate((el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1', ctrlKey: true, bubbles: true, cancelable: true })));
  await expect(s.locator('[data-blocnotes]')).toContainText('Tanneurs', { timeout: 8000 });
});

test('un geste pendant le collage automatique rend la toile et ne laisse pas de texte à moitié tapé', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await montee(page, 'clipper');
  await allerA(page, 'clipper', 0.7);
  const s = page.locator('#clipper');
  const notes = s.locator('[data-blocnotes]');
  // La démo automatique colle le code : on intervient dès que le texte commence à s'écrire.
  await expect(notes).not.toBeEmpty({ timeout: 15_000 });
  await s.locator('.cl').dispatchEvent('pointerdown');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__chef?.forme)).not.toBe('envol');
  const texte = (await notes.textContent()) ?? '';
  expect(texte === '' || texte.endsWith('for l in lignes)')).toBe(true);
});

test('Clipper au doigt : l’invite dit comment coller', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'tactile');
  await page.goto('/');
  await allerA(page, 'clipper', 0.7);
  await montee(page, 'clipper');
  await expect(page.locator('#clipper [data-invite]')).toContainText('deux fois');
});

test.describe('calme', () => {
  test.use({ reducedMotion: 'reduce' });
  test('Clipper calme : la recherche filtre, le collage est instantané', async ({ page }) => {
    await page.goto('/');
    await page.locator('#clipper [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'clipper');
    const s = page.locator('#clipper');
    await s.locator('input[type="search"]').fill('#ff6b5e');
    await expect(s.locator('[data-item]:visible')).toHaveCount(1);
    await s.locator('[data-item]:visible').dblclick();
    await expect(s.locator('[data-blocnotes]')).toContainText('#ff6b5e');
  });
});
