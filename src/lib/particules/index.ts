import type { Etat, Moteur } from './types';

type Pre = { avancer(k: string): void; finir(): void; fini: boolean };
declare global {
  interface Window {
    __pre?: Pre;
  }
}

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const image = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/**
 * Démarre la toile de particules. Sans WebGL2 (ou avec un GPU incapable de
 * textures flottantes), la page passe en `data-particules="off"` : les
 * versions de secours en CSS et SVG prennent le relais.
 */
export async function bootParticules(): Promise<Moteur | null> {
  const etat: Etat = { frames: 0, palier: 0, station: '', running: false };
  window.__particules = etat;
  const pre = window.__pre;
  void document.fonts.ready.then(() => pre?.avancer('polices'));

  const { cible } = await import('./cibles');
  window.__particulesApi = { cible };
  const canvas = document.getElementById('particules') as HTMLCanvasElement | null;
  if (!canvas) return null;

  const { creerMoteur } = await import('./moteur');
  pre?.avancer('three');
  let m: Moteur | null = null;
  try {
    m = creerMoteur(canvas, etat);
  } catch {
    m = null;
  }
  if (!m) {
    document.documentElement.dataset.particules = 'off';
    pre?.finir();
    return null;
  }
  document.documentElement.dataset.particules = 'on';
  const moteur = m;

  // La toile suit une ancre : la simulation vit dans son repère, le rendu est décalé de sa position.
  let ancre: Element | null = null;
  const position = () => {
    const r = ancre?.getBoundingClientRect();
    return r ? [r.left, r.top] : [0, 0];
  };
  const ancrer = (el: Element | null) => {
    ancre = el;
    const [x, y] = position();
    moteur.decaler(x!, y!, true);
  };
  moteur.surImage(() => {
    const [x, y] = position();
    moteur.decaler(x!, y!);
  });
  addEventListener('scroll', () => moteur.decaler(...(position() as [number, number])), { passive: true });

  const section = document.querySelector<HTMLElement>('[data-station="hero"]');
  if (!section) {
    pre?.finir();
    return moteur;
  }
  const { preparerHero } = await import('./hero');
  const hero = preparerHero(moteur, section);
  void hero.pret.then(() => pre?.avancer('cibles'));
  void image().then(() => pre?.avancer('rendu'));
  etat.station = 'hero';

  if (calme()) {
    moteur.figer(true);
    ancrer(hero.ancre);
    await hero.figer();
    return moteur;
  }

  // À 100, les chiffres du compteur deviennent des particules, qui s'élancent vers le premier logo.
  const relais = async () => {
    const boite = document.querySelector<HTMLElement>('.pre');
    const chiffres = boite?.querySelector<HTMLElement>('[data-compteur]');
    if (boite && chiffres && getComputedStyle(boite).display !== 'none') {
      const r = chiffres.getBoundingClientRect();
      ancrer(chiffres);
      const pts = await cible(
        'compteur',
        { x: 0, y: 0, w: r.width, h: r.height },
        Math.round(moteur.n * 0.3),
        chiffres.textContent ?? '100',
      );
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      moteur.viser({ points: pts, teinte: [paper], eclat: 0.9 }, { bruit: 0, raideur: 40, additif: true }, 0, true);
      await image();
      // Le compteur masqué n'a plus de position : on passe l'ancre au logo dans la même image.
      ancrer(hero.ancre);
      boite.classList.add('fini');
      document.documentElement.dataset.pre = 'vu';
    }
    ancrer(hero.ancre);
    await hero.demarrer();
  };
  if (!pre || pre.fini) void relais();
  else document.addEventListener('pret', () => void relais(), { once: true });
  return moteur;
}
