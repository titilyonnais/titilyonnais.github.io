import { token } from './couleurs';

/**
 * Couture entre deux sections : une demi-teinte dont les points grossissent
 * jusqu'à recouvrir la couleur suivante. Elle est calculée une fois (et à chaque
 * changement de largeur) dans un canvas 2D qui défile avec la page : aucun
 * décalage possible avec les sections voisines.
 */

const CELL = 9; // px CSS

// Bruit 1D lisse, déterministe : la frontière ondule sans jamais bouger d'un rendu à l'autre.
function bruit(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

const lisse = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Rayon d'un point pour une couverture c ∈ [0, 1] d'une cellule carrée. */
function rayon(c: number): number {
  const touche = Math.PI / 4; // les points se touchent
  if (c <= touche) return Math.sqrt(c / Math.PI);
  return 0.5 + (Math.SQRT1_2 - 0.5) * ((c - touche) / (1 - touche));
}

export function dessinerCouture(el: HTMLElement): void {
  const canvas = el.querySelector('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const de = el.dataset.de === 'paper' ? '--paper' : '--ink';
  const vers = el.dataset.vers === 'paper' ? '--paper' : '--ink';

  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = el.clientWidth;
  const h = el.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = token(de);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = token(vers);

  const cols = Math.ceil(w / CELL) + 1;
  const rows = Math.ceil(h / CELL) + 1;
  const graine = Number(el.dataset.graine ?? 0);

  ctx.beginPath();
  for (let r = 0; r < rows; r++) {
    // Une rangée sur deux décalée d'une demi-cellule : trame d'imprimerie.
    const dx = (r % 2) * (CELL / 2);
    const y = r * CELL;
    for (let c = 0; c < cols; c++) {
      const x = c * CELL + dx;
      const onde = (bruit(x / 260 + graine) - 0.5) * 0.16 + (bruit(x / 70 + graine * 3) - 0.5) * 0.05;
      const v = lisse(0.06, 0.94, y / h + onde);
      if (v <= 0.002) continue;
      const rad = rayon(v) * CELL;
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  el.dataset.ready = '1';
}

export function bootCoutures(): void {
  const all = document.querySelectorAll<HTMLElement>('[data-couture]');
  if (!all.length) return;
  const draw = () => all.forEach(dessinerCouture);
  draw();
  let width = innerWidth;
  let timer = 0;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    clearTimeout(timer);
    timer = window.setTimeout(draw, 150);
  });
}
