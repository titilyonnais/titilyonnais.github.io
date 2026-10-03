import type { Page } from '@playwright/test';

/** Collecte les erreurs JS et console d'une page. */
export function erreurs(page: Page): string[] {
  const liste: string[] = [];
  // Chrome abandonne une View Transition si la fenêtre change de taille en route
  // (barre d'adresse mobile) : la navigation a lieu quand même, sans animation.
  const benin = (t: string) => t.includes('Transition was aborted');
  page.on('pageerror', (e) => !benin(e.message) && liste.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !benin(m.text())) liste.push(m.text());
  });
  return liste;
}

/** Fait défiler toute la page par pas d'un écran : les scènes paresseuses se montent. */
export async function parcourir(page: Page): Promise<void> {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y <= h; y += vh) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(400);
}

/** Va directement à une position dans la piste d'une scène (t ∈ [0, 1]). */
export async function allerA(page: Page, scene: string, t: number): Promise<void> {
  await page.evaluate(
    ({ scene, t }) => {
      const p = document.querySelector<HTMLElement>(`#${scene} .piste`)!;
      const top = p.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: top + t * (p.offsetHeight - innerHeight), behavior: 'instant' });
    },
    { scene, t },
  );
  await page.waitForTimeout(700);
}

/** Attend que le défilement (doux) soit arrivé : scrollY ne bouge plus pendant 300 ms. */
export async function stable(page: Page): Promise<void> {
  let avant = -1;
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => scrollY);
    if (y === avant) return;
    avant = y;
    await page.waitForTimeout(300);
  }
}

/** Attend qu'une scène paresseuse soit montée (son module chargé, data-state posé). */
export async function montee(page: Page, scene: string): Promise<void> {
  await page.waitForFunction((s) => !!document.querySelector<HTMLElement>(`[data-scene="${s}"]`)?.dataset.state, scene, {
    timeout: 15_000,
  });
}

/**
 * Le visiteur prend la main sur la démo PostShip : un appui dans la fenêtre
 * coupe la démo automatique, puis « git push » si elle n'était pas partie.
 */
export async function prendreLaMain(page: Page): Promise<void> {
  const ps = page.locator('#postship [data-etat-demo]');
  await ps.dispatchEvent('pointerdown');
  if ((await ps.getAttribute('data-etat-demo')) === 'repos') await page.locator('#postship [data-action="pousser"]').click();
}
