import type { Etat, Moteur } from './types';

/**
 * Démarre la toile de particules. Sans WebGL2 (ou avec un GPU incapable de
 * textures flottantes), la page passe en `data-particules="off"` : les
 * versions de secours en CSS et SVG prennent le relais.
 */
export async function bootParticules(): Promise<Moteur | null> {
  const etat: Etat = { frames: 0, palier: 0, station: '', running: false };
  window.__particules = etat;
  const { cible } = await import('./cibles');
  window.__particulesApi = { cible };
  const canvas = document.getElementById('particules') as HTMLCanvasElement | null;
  if (!canvas) return null;
  const { creerMoteur } = await import('./moteur');
  let m: Moteur | null = null;
  try {
    m = creerMoteur(canvas, etat);
  } catch {
    m = null;
  }
  if (!m) {
    document.documentElement.dataset.particules = 'off';
    return null;
  }
  document.documentElement.dataset.particules = 'on';
  // Provisoire : un nuage libre sur tout l'écran, en attendant le chef d'orchestre.
  m.viser({ points: new Float32Array(0), teinte: [getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()] });
  return m;
}
