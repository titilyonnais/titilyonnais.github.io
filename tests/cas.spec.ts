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
  await expect(page.locator('.illus svg[aria-label^="Un commit part"]')).toBeVisible();
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

test.describe('mise en page des études de cas', () => {
  test.use({ reducedMotion: 'reduce' }); // figures et schémas posés dans leur état final

  for (const id of ['postship', 'clipper', 'aether']) {
    test(`${id} : rien ne déborde ni ne reste vide`, async ({ page, isMobile }) => {
      await page.goto(`/projets/${id}/`);
      const r = await page.evaluate(() => {
        const pb: string[] = [];
        // Schéma (ordinateur) : chaque détail tient dans son nœud.
        document.querySelectorAll<SVGGElement>('.schema .noeud').forEach((g) => {
          const w = Number(g.querySelector('rect')!.getAttribute('width'));
          // Ligne par ligne : un détail sur deux lignes se mesure par ses tspan.
          g.querySelectorAll<SVGTextContentElement>('.det').forEach((d) => {
            const ls = d.querySelectorAll<SVGTSpanElement>('tspan');
            (ls.length ? [...ls] : [d]).forEach((t) => {
              if (getComputedStyle(g.ownerSVGElement!).display !== 'none' && t.getComputedTextLength() > w - 20) pb.push(`nœud : ${t.textContent}`);
            });
          });
        });
        // Schéma (téléphone) : jamais de « relié à : » sans rien derrière.
        document.querySelectorAll<HTMLElement>('.schema .vers').forEach((v) => {
          if (!v.textContent!.trim()) pb.push('relié à : vide');
        });
        // Figures : le texte reste dans son cadre.
        document.querySelectorAll<HTMLElement>('.fig .bascule').forEach((b) => {
          const f = b.closest('.fig')!.getBoundingClientRect();
          if (b.getBoundingClientRect().right > f.right + 0.5 || b.scrollWidth > b.clientWidth + 1) pb.push(`figure : ${b.textContent}`);
        });
        // Chiffres : une valeur sur une ligne, dans sa colonne.
        document.querySelectorAll<HTMLElement>('.faits dt').forEach((dt) => {
          const r = document.createRange();
          r.selectNodeContents(dt);
          const lignes = new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
          if (dt.scrollWidth > dt.parentElement!.clientWidth + 1 || lignes > 1) pb.push(`chiffre : ${dt.textContent}`);
        });
        return pb;
      });
      expect(r, isMobile ? 'téléphone' : 'ordinateur').toEqual([]);
    });
  }
});

test('PostShip : les illustrations gardent leurs polices, chaque texte tient dans sa boîte', async ({ page }) => {
  await page.goto('/projets/postship/');
  await expect(page.locator('.illus svg')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  const pb = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll<SVGTextElement>('.illus svg text').forEach((t) => {
      const b = t.getBBox();
      // La plus petite boîte qui contient le début du texte.
      const boites = [...t.ownerSVGElement!.querySelectorAll<SVGRectElement>('rect')]
        .map((r) => r.getBBox())
        .filter((r) => b.x >= r.x && b.x <= r.x + r.width && b.y + b.height / 2 >= r.y && b.y + b.height / 2 <= r.y + r.height)
        .sort((a, c) => a.width * a.height - c.width * c.height);
      const r = boites[0];
      if (r && b.x + b.width > r.x + r.width + 1) out.push(t.textContent!);
    });
    return out;
  });
  expect(pb).toEqual([]);
});
