import { test, expect } from '@playwright/test';
import { allerA, erreurs, montee } from './aide';

test('ÆTHER : intention, cartes, thème, zoom, glisser', async ({ page }) => {
  const e = erreurs(page);
  await page.goto('/');
  await page.keyboard.press('Control+k'); // hors scène : rien
  await expect(page.locator('#aether [data-intention]')).toBeHidden();
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const s = page.locator('#aether');
  await s.locator('[data-pilule]').click();
  await expect(s.locator('[data-intention]')).toBeVisible();
  await page.keyboard.type('compare rust et zig pour un jeu');
  await expect(s.locator('[data-interpretation]')).toContainText('Comparer « rust » et « zig »');
  await page.keyboard.press('Enter');
  await expect(s.locator('[data-carte]')).toHaveCount(4 + 6, { timeout: 4000 }); // 6 cartes de départ + 4
  await s.locator('[data-theme-choix="braise"]').click();
  await expect(s).toHaveAttribute('data-theme', 'braise');
  const z0 = await s.locator('[data-toile]').evaluate((t) => getComputedStyle(t).getPropertyValue('--zoom'));
  await s.locator('[data-zoom="+"]').click();
  const z1 = await s.locator('[data-toile]').evaluate((t) => getComputedStyle(t).getPropertyValue('--zoom'));
  expect(Number(z1)).toBeGreaterThan(Number(z0));
  // Sur téléphone, atteindre « + » a pu faire défiler la page : on revient en pleine démo, fenêtre de face.
  await allerA(page, 'aether', 0.7);
  await page.waitForTimeout(300);
  const c = s.locator('[data-carte]').first();
  const a = await c.boundingBox();
  await c.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  expect((await c.boundingBox())!.x - a!.x).toBeGreaterThan(20);
  expect(e).toEqual([]);
});

test('ÆTHER : se joue seul après inaction', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await expect(page.locator('#aether [data-carte]')).toHaveCount(10, { timeout: 15000 });
});

test('ÆTHER : un Espace met ses cartes en avant', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const s = page.locator('#aether');
  await s.locator('[data-espace="factures"]').click();
  // Seules les deux pages de l'Espace Factures restent nettes (la démo a pu en ouvrir d'autres).
  await expect
    .poll(async () => (await s.locator('[data-carte]').count()) - (await s.locator('[data-carte][data-attenue]').count()))
    .toBe(2);
  await expect(s.locator('[data-nom-espace]')).toHaveText('Factures');
});

test('au doigt, la toile laisse défiler la page hors des cartes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'tactile : mobile seulement');
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  const toile = await page.locator('#aether [data-toile]').evaluate((e) => getComputedStyle(e.parentElement!).touchAction);
  expect(toile).not.toBe('none');
  const carte = await page.locator('#aether [data-carte]').first().evaluate((e) => getComputedStyle(e).touchAction);
  expect(carte).toBe('none');
});

test('Ctrl K : rien au simple survol, la Barre après un clic dans la fenêtre', async ({ page, isMobile }) => {
  test.skip(isMobile, 'clavier et souris : bureau');
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const s = page.locator('#aether');
  await s.locator('[data-toile]').hover({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(200);
  await expect(s.locator('[data-intention]')).toBeHidden();
  await s.locator('[data-toile]').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('Control+k');
  await expect(s.locator('[data-intention]')).toBeVisible();
});

test('passer sous 768 px pendant la démo remet les cartes dans le cadre', async ({ page, isMobile }) => {
  test.skip(isMobile, 'part du bureau');
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const s = page.locator('#aether');
  await s.locator('.ae').dispatchEvent('pointerdown'); // la main est prise : pas de démo automatique
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await allerA(page, 'aether', 0.7);
  await page.waitForTimeout(500);
  const t = (await s.locator('[data-toile]').boundingBox())!;
  for (const c of await s.locator('[data-carte]').all()) {
    const b = (await c.boundingBox())!;
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2];
    expect(cx > t.x && cx < t.x + t.width && cy > t.y && cy < t.y + t.height).toBe(true);
  }
});

test('ÆTHER : le focus clavier d’une carte se voit, distinct du choix', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const c = page.locator('#aether [data-carte]').first();
  await c.focus();
  const [style, presse] = await c.evaluate((e) => [getComputedStyle(e).outlineStyle, e.getAttribute('aria-pressed')]);
  expect(style).not.toBe('none');
  expect(presse).not.toBe('true');
});

test('ÆTHER : un thème repeint les surfaces et l’accent de l’app', async ({ page }) => {
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  const s = page.locator('#aether');
  await s.locator('.ae').dispatchEvent('pointerdown');
  await s.locator('[data-theme-choix="braise"]').click();
  // backgroundPresets.ts, « ember » : surface mist #1d120c, accent #e6883d.
  const [mist, glacier] = await s.locator('.ae').evaluate((e) => {
    const c = getComputedStyle(e);
    return [c.getPropertyValue('--ae-mist').trim(), c.getPropertyValue('--ae-glacier').trim()];
  });
  expect(mist.toLowerCase()).toBe('#1d120c');
  expect(glacier.toLowerCase()).toBe('#e6883d');
});

test.describe('calme', () => {
  test.use({ reducedMotion: 'reduce' });
  test('ÆTHER calme : la fenêtre est posée, la Barre d’Intention marche', async ({ page }) => {
    await page.goto('/');
    await page.locator('#aether [data-fenetre]').scrollIntoViewIfNeeded();
    await montee(page, 'aether');
    const s = page.locator('#aether');
    await s.locator('[data-pilule]').click();
    await page.keyboard.type('compare rust et zig');
    await page.keyboard.press('Enter');
    await expect(s.locator('[data-carte]')).toHaveCount(10);
  });
});

test('le ciel Aurore se voit à travers la toile', async ({ page, isMobile }) => {
  test.skip(isMobile, 'un point de mesure de bureau');
  await page.goto('/');
  await allerA(page, 'aether', 0.7);
  await montee(page, 'aether');
  await allerA(page, 'aether', 0.7);
  await page.waitForTimeout(900); // la vague de bascule a fini
  // Entre le titre et la phrase : le halo vert d'eau de l'Aurore boréale.
  const png = await page.screenshot({ clip: { x: 700, y: 120, width: 8, height: 8 } });
  const [r, g] = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0);
    return [...x.getImageData(4, 4, 1, 1).data];
  }, png.toString('base64'));
  expect(g! - r!).toBeGreaterThan(8);
});
