import { cible } from './cibles';
import type { Moteur, Placement, Teinte } from './types';

type Produit = { id: string; nom: string; ligne: string; police: string };

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/** Teinte des particules d'un produit, lue dans les tokens (src/styles/tokens.css). */
export function teinteDe(id: string): Teinte {
  if (id === 'aether') return [css('--teinte-aether-1'), css('--teinte-aether-2')];
  return [css(`--teinte-${id}`) || css('--paper')];
}

/** Boîte d'un élément dans son propre repère (la toile suit l'ancre, voir Moteur.decaler). */
export function boite(el: Element): Placement {
  const r = el.getBoundingClientRect();
  return { x: 0, y: 0, w: r.width, h: r.height };
}

const PART_FORME = 0.85; // le reste fait une poussière autour du logo

export type Hero = {
  /** L'élément dont la toile suit la position pendant le hero. */
  ancre: Element;
  /** Lance (ou relance) la boucle des trois logos. */
  demarrer(): Promise<void>;
  arreter(): void;
  /** Mode calme : les trois logos posés côte à côte, une seule image. */
  figer(): Promise<void>;
  /** Formes prêtes (pour le préchargeur). */
  pret: Promise<unknown>;
};

export function preparerHero(m: Moteur, section: HTMLElement): Hero {
  const produits = JSON.parse(section.dataset.produits ?? '[]') as Produit[];
  const place = section.querySelector('[data-place]')!;
  const lien = section.querySelector<HTMLAnchorElement>('[data-hero-produit]')!;
  const nom = lien.querySelector('.nom')!;
  const ligne = lien.querySelector('.ligne')!;

  const formes = () => {
    const p = boite(place);
    return Promise.all(produits.map((pr) => cible(pr.id, p, Math.round(m.n * PART_FORME))));
  };
  let pretes = formes();

  let i = 0;
  let timer = 0;
  let actif = false;
  let dernierSouffle = 0;
  section.addEventListener('pointermove', () => (dernierSouffle = performance.now()), { passive: true });

  const etiquette = (pr: Produit) => {
    lien.classList.add('sortant');
    setTimeout(() => {
      nom.textContent = pr.nom;
      ligne.textContent = pr.ligne;
      lien.href = `#${pr.id}`;
      lien.style.setProperty('--police-produit', pr.police);
      lien.classList.remove('sortant');
      lien.classList.add('entrant');
      requestAnimationFrame(() => requestAnimationFrame(() => lien.classList.remove('entrant')));
    }, 230);
  };

  const montrer = async (k: number, premier = false) => {
    const pr = produits[k]!;
    const pts = (await pretes)[k]!;
    if (!actif) return;
    // Métamorphose : le ressort mollit et le flux monte, puis tout se resserre en vague.
    m.viser({ points: pts, teinte: teinteDe(pr.id), eclat: 0.55 }, { bruit: 650, raideur: 9, additif: true, taille: 1.3 }, 0.35);
    setTimeout(() => actif && m.reglages({ bruit: 10, raideur: 38 }), 650);
    if (!premier) etiquette(pr);
  };

  const suivant = () => {
    timer = window.setTimeout(() => {
      if (!actif) return;
      // Le visiteur souffle sur le logo : on attend qu'il ait fini.
      if (performance.now() - dernierSouffle < 1500) return suivant();
      i = (i + 1) % produits.length;
      void montrer(i);
      suivant();
    }, 5200);
  };

  let largeur = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === largeur) return;
    largeur = innerWidth;
    pretes = formes();
    if (actif) void montrer(i, true);
  });

  return {
    ancre: place,
    pret: pretes,
    async demarrer() {
      if (actif) return;
      actif = true;
      await montrer(i, true);
      suivant();
    },
    arreter() {
      actif = false;
      clearTimeout(timer);
    },
    async figer() {
      const p = boite(place);
      const larg = p.w / produits.length;
      const n = Math.floor(m.n / produits.length);
      const parts = await Promise.all(
        produits.map((pr, k) => cible(pr.id, { x: p.x + k * larg + larg * 0.1, y: p.y, w: larg * 0.8, h: p.h }, n)),
      );
      const points = new Float32Array(n * 3 * produits.length);
      const couleurs = new Float32Array(points.length);
      parts.forEach((pts, k) => {
        points.set(pts, k * n * 3);
        const t = teinteDe(produits[k]!.id)[0];
        const c = versRvb(t);
        for (let j = 0; j < n; j++) couleurs.set(c, (k * n + j) * 3);
      });
      m.viser({ points, couleurs, teinte: [t0()], eclat: 0.85 }, {}, 0, true);
    },
  };
}

const t0 = () => css('--paper');

/** Couleur CSS → rgb 0–1 (via le navigateur, pour lire n'importe quelle notation). */
function versRvb(c: string): [number, number, number] {
  const cv = document.createElement('canvas').getContext('2d')!;
  cv.fillStyle = c;
  const h = cv.fillStyle as string; // toujours rendu en #rrggbb
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
