import { test, expect } from '@playwright/test';
import { erreurs, parcourir } from './aide';

const pages = ['/', '/projets/postship/', '/projets/clipper/', '/projets/aether/'];

for (const url of pages) {
  test(`${url} se charge sans erreur`, async ({ page }) => {
    test.setTimeout(120_000); // page entière parcourue écran par écran, toile comprise
    const errs = erreurs(page);
    const rep = await page.goto(url);
    expect(rep?.status()).toBe(200);
    await expect(page.locator('h1')).not.toBeEmpty();
    await expect(page.locator('header.nav a')).toHaveCount(5);
    await parcourir(page);
    expect(errs).toEqual([]);
  });
}

test('la page ne défile jamais à l’horizontale', async ({ page }) => {
  test.setTimeout(150_000); // quatre pages parcourues de bout en bout
  for (const url of pages) {
    await page.goto(url);
    await parcourir(page);
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw, url).toBeLessThanOrEqual(iw);
  }
});

test('chaque scène mène à son étude de cas', async ({ page }) => {
  await page.goto('/');
  for (const id of ['postship', 'clipper', 'aether']) {
    const href = await page.locator(`#${id} .cas a`).getAttribute('href');
    expect(href).toBe(`/projets/${id}/`);
  }
});

test('« Suivant » fait la boucle PostShip → Clipper → ÆTHER → PostShip', async ({ page }) => {
  await page.goto('/projets/postship/');
  for (const attendu of ['/projets/clipper/', '/projets/aether/', '/projets/postship/']) {
    await page.locator('a.suivant').click();
    await expect(page).toHaveURL(new RegExp(`${attendu}$`));
  }
});

test('les liens externes pointent vers des adresses absolues', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('a[href^="http"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs.length).toBeGreaterThan(4);
  for (const h of hrefs) expect(h).toMatch(/^https:\/\/(postship\.fr|github\.com)\//);
});

test('retour depuis une étude de cas : la scène revient sans erreur', async ({ page }) => {
  const errs = erreurs(page);
  await page.goto('/');
  await page.locator('#clipper .cas a').scrollIntoViewIfNeeded();
  await page.locator('#clipper .cas a').click();
  await expect(page).toHaveURL(/\/projets\/clipper\/$/);
  await page.goBack();
  await page.waitForTimeout(800);
  await expect(page.locator('#clipper .sortie')).toBeInViewport({ ratio: 0.1 });
  expect(errs).toEqual([]);
});

/** Où en est la piste d'une scène (t ∈ [0, 1]). */
const tDe = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((id) => {
    const p = document.querySelector<HTMLElement>(`#${id} .piste`)!;
    const haut = p.getBoundingClientRect().top + scrollY;
    return (scrollY - haut) / (p.offsetHeight - innerHeight);
  }, id);

test('un lien de la nav saute droit à la démo, sans traverser les scènes', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const ys: number[] = [];
    (window as unknown as { __ys: number[] }).__ys = ys;
    const f = () => {
      ys.push(scrollY);
      requestAnimationFrame(f);
    };
    f();
  });
  await page.getByRole('navigation', { name: 'Principale' }).getByRole('link', { name: 'Clipper' }).click();
  await page.waitForTimeout(1200);
  const ys = await page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
  const fin = ys.at(-1)!;
  expect(ys.filter((y) => y > 1 && Math.abs(y - fin) > 1)).toEqual([]);
  const t = await tDe(page, 'clipper');
  expect(t).toBeGreaterThan(0.55);
  expect(t).toBeLessThan(0.9);
  await expect(page.locator('#clipper [data-fenetre]')).toHaveAttribute('data-vue', '1');
});

test('depuis une étude de cas, la nav ouvre la scène sur sa démo', async ({ page }) => {
  await page.goto('/projets/postship/');
  await page.getByRole('navigation', { name: 'Principale' }).getByRole('link', { name: 'ÆTHER' }).click();
  await expect(page).toHaveURL(/\/#aether$/);
  await page.waitForTimeout(1500);
  const t = await tDe(page, 'aether');
  expect(t).toBeGreaterThan(0.55);
  expect(t).toBeLessThan(0.9);
});
