import { calm } from '../lib/motion';
import { $$, etat, hasard, seg, taper } from './outils';

/*
 * Mini-animations des études de cas. Chacune est une fonction de t ∈ [0, 1],
 * jouée une seule fois quand la figure entre dans l'écran. En mode calme, on
 * pose directement t = 1.
 */
type Rendu = (t: number) => void;
const BROUILLE = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*';

function terminal(fig: HTMLElement): Rendu {
  const lignes = $$(fig, '.l');
  const n = lignes.length;
  return (t) => lignes.forEach((l, i) => taper(l, l.dataset.texte ?? '', seg(t, i / n, (i + 0.8) / n)));
}

function touches(fig: HTMLElement): Rendu {
  const kbd = $$(fig, 'kbd');
  const leg = fig.querySelector<HTMLElement>('.leg');
  return (t) => {
    kbd.forEach((k, i) => etat(k, 'presse', t >= 0.12 + i * 0.12 && t < 0.62));
    leg?.style.setProperty('--r', String(seg(t, 0.55, 0.9)));
  };
}

function liste(fig: HTMLElement): Rendu {
  const li = $$(fig, 'li');
  const n = li.length;
  return (t) => {
    const k = Math.min(n - 1, Math.floor(t * n * 0.999));
    li.forEach((el, i) => {
      etat(el, 'cache', i > k);
      etat(el, 'actif', i === k);
    });
  };
}

function bascule(fig: HTMLElement): Rendu {
  const el = fig.querySelector<HTMLElement>('.bascule')!;
  const avant = el.dataset.avant ?? '';
  const apres = el.dataset.apres ?? '';
  return (t) => {
    const m = seg(t, 0.35, 0.85);
    const long = Math.round(avant.length + (apres.length - avant.length) * m);
    let s = '';
    for (let i = 0; i < long; i++) {
      const a = (i / long) * 0.6;
      if (m <= a) s += avant[i] ?? ' ';
      else if (m < a + 0.4) s += BROUILLE[Math.floor(hasard(i * 17 + Math.floor(m * 30)) * BROUILLE.length)];
      else s += apres[i] ?? '';
    }
    if (m >= 1) s = apres;
    if (el.textContent !== s) el.textContent = s;
    etat(el, 'inverse', m >= 1);
  };
}

const FABRIQUES: Record<string, (f: HTMLElement) => Rendu> = { terminal, touches, liste, bascule };
const DUREES: Record<string, number> = { terminal: 2200, touches: 1600, liste: 1800, bascule: 1700 };

function jouer(rendu: Rendu, duree: number): void {
  let debut = 0;
  const pas = (now: number) => {
    if (!debut) debut = now;
    const t = Math.min(1, (now - debut) / duree);
    rendu(t);
    if (t < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

export function bootFigures(): void {
  const figs = document.querySelectorAll<HTMLElement>('[data-figure]');
  const tranquille = calm();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const fig = e.target as HTMLElement;
        const rendu = FABRIQUES[fig.dataset.figure ?? '']?.(fig);
        if (rendu) jouer(rendu, DUREES[fig.dataset.figure ?? ''] ?? 1800);
      }
    },
    { threshold: 0.6 },
  );
  figs.forEach((fig) => {
    const rendu = FABRIQUES[fig.dataset.figure ?? '']?.(fig);
    if (!rendu) return;
    if (tranquille) return rendu(1);
    rendu(0);
    io.observe(fig);
  });

  // Les schémas d'architecture se tracent une fois, à l'entrée.
  const schemas = document.querySelectorAll<HTMLElement>('[data-schema]');
  const io2 = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.trace = '1';
        io2.unobserve(e.target);
      }
    },
    { threshold: 0.35 },
  );
  schemas.forEach((s) => (tranquille ? (s.dataset.trace = '1') : io2.observe(s)));
}
