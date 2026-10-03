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

  const section = document.querySelector<HTMLElement>('[data-station="hero"]');
  const { preparerHero } = await import('./hero');
  const hero = section ? preparerHero(moteur, section) : null;
  void (hero?.pret ?? Promise.resolve()).then(() => pre?.avancer('cibles'));
  void image().then(() => pre?.avancer('rendu'));
  const { bootChef } = await import('./chef');

  if (calme()) {
    moteur.figer(true);
    bootChef(moteur, etat, hero);
    return moteur;
  }
  if (!hero) {
    pre?.finir();
    bootChef(moteur, etat, hero);
    return moteur;
  }

  // À 100, les chiffres du compteur deviennent des particules ; le chef prend ensuite la main
  // et les envoie vers le premier logo.
  const relais = async () => {
    const boite = document.querySelector<HTMLElement>('.pre');
    const chiffres = boite?.querySelector<HTMLElement>('[data-compteur]');
    if (boite && chiffres && getComputedStyle(boite).display !== 'none') {
      const r = chiffres.getBoundingClientRect();
      const pts = await cible('compteur', { x: 0, y: 0, w: r.width, h: r.height }, Math.round(moteur.n * 0.3), chiffres.textContent ?? '100');
      moteur.decaler(r.left, r.top, true);
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      moteur.viser({ points: pts, teinte: [paper], eclat: 0.9 }, { bruit: 0, raideur: 40, additif: true }, 0, true);
      await image();
      boite.classList.add('fini');
      document.documentElement.dataset.pre = 'vu';
    }
    bootChef(moteur, etat, hero);
  };
  if (!pre || pre.fini) void relais();
  else document.addEventListener('pret', () => void relais(), { once: true });
  return moteur;
}
