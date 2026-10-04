import type { Forme } from './formes';

type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/** Générateur pseudo-aléatoire à graine (mulberry32) : une forme donne toujours le même nuage. */
export function alea(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX = 1024;

/** Bruit de valeur 2D lissé, à graine, sommé sur quatre octaves : des amas et des vides, pas une grille. */
function fbm(graine: number): (x: number, y: number) => number {
  const val = (ix: number, iy: number) => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + graine * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const doux = (t: number) => t * t * (3 - 2 * t);
  const bruit = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = doux(x - ix);
    const fy = doux(y - iy);
    const a = val(ix, iy) + (val(ix + 1, iy) - val(ix, iy)) * fx;
    const b = val(ix, iy + 1) + (val(ix + 1, iy + 1) - val(ix, iy + 1)) * fx;
    return a + (b - a) * fy;
  };
  return (x, y) => {
    let v = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 4; o++) {
      v += amp * bruit(x * f + o * 17.3, y * f - o * 9.1);
      f *= 2.03;
      amp *= 0.5;
    }
    return v / 0.9375;
  };
}

const marche = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Le champ : un nuage de poussière, pas un rectangle. La densité suit un bruit fractal
 * (amas, filaments, trous) et s'éteint vers les bords par une ellipse arrondie dont le
 * contour est lui-même bruité : aucun bord droit, aucun coin.
 */
function champ(w: number, h: number, n: number, rnd: () => number, out: Float32Array): Float32Array {
  const b = fbm(rnd() * 1000);
  const e = 3.2 / Math.max(w, h); // quelques amas par largeur, quelle que soit la boîte
  let i = 0;
  for (let essais = 0; i < n && essais < n * 60; essais++) {
    const u = rnd();
    const v = rnd();
    const x = u * w;
    const y = v * h;
    const dx = Math.abs(2 * u - 1);
    const dy = Math.abs(2 * v - 1);
    const d = Math.cbrt(dx ** 3 + dy ** 3) + (b(x * e + 31, y * e + 7) - 0.5) * 0.55;
    const bord = 1 - marche(0.45, 1.02, d);
    const amas = 0.12 + 0.88 * marche(0.28, 0.78, b(x * e, y * e));
    if (rnd() >= bord * amas) continue;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = (rnd() - 0.5) * 300;
    i++;
  }
  // Filet de sûreté : ce qui manque se pose près du centre.
  for (; i < n; i++) {
    out[i * 3] = w * (0.3 + 0.4 * rnd());
    out[i * 3 + 1] = h * (0.3 + 0.4 * rnd());
    out[i * 3 + 2] = (rnd() - 0.5) * 300;
  }
  return out;
}

/**
 * Dessine la forme dans une boîte w × h (ajustée sans déformation, centrée),
 * puis tire n points parmi les pixels pleins, en favorisant les bords pour que
 * la silhouette reste nette. Renvoie xyz en px, relatifs au coin de la boîte.
 */
export function echantillonner(
  forme: Forme,
  w: number,
  h: number,
  n: number,
  texte: string | undefined,
  fabrique: (w: number, h: number) => { ctx: Ctx2D },
): Float32Array {
  const k = Math.min(1, MAX / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * k));
  const ch = Math.max(1, Math.round(h * k));
  const rnd = alea(Math.round(w * 7 + h * 13 + n));
  const out = new Float32Array(n * 3);

  if (forme.type === 'champ') return champ(w, h, n, rnd, out);

  const { ctx } = fabrique(cw, ch);
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = 'white'; // masque : seule l'opacité compte
  ctx.strokeStyle = 'white';

  if (forme.type === 'chemin') {
    const [vx, vy, vw, vh] = forme.vb;
    const s = Math.min(cw / vw, ch / vh);
    ctx.setTransform(s, 0, 0, s, (cw - vw * s) / 2 - vx * s, (ch - vh * s) / 2 - vy * s);
    for (const t of forme.traces) {
      const p = new Path2D(t.d);
      if (t.trait) {
        ctx.lineWidth = t.trait;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(p);
      } else ctx.fill(p);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else if (forme.type === 'texte') {
    const t = texte ?? forme.texte;
    const police = (taille: number) => `${forme.graisse ?? 400} ${taille}px "${forme.police}"`;
    ctx.font = police(100);
    const m = ctx.measureText(t);
    const lw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const lh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const taille = 100 * Math.min(cw / Math.max(lw, 1), ch / Math.max(lh, 1));
    ctx.font = police(taille);
    const m2 = ctx.measureText(t);
    const bw = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight;
    const bh = m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t, (cw - bw) / 2 + m2.actualBoundingBoxLeft, (ch - bh) / 2 + m2.actualBoundingBoxAscent);
  } else if (forme.type === 'rect') {
    const e = Math.max(1, forme.contour * k);
    ctx.lineWidth = e;
    ctx.strokeRect(e / 2, e / 2, cw - e, ch - e);
  }

  // Pixels pleins, poids double sur les bords.
  const data = ctx.getImageData(0, 0, cw, ch).data;
  const plein = (x: number, y: number) => x >= 0 && y >= 0 && x < cw && y < ch && data[(y * cw + x) * 4 + 3]! > 128;
  const idx: number[] = [];
  const cumul: number[] = [];
  let total = 0;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (!plein(x, y)) continue;
      const bord = !plein(x - 2, y) || !plein(x + 2, y) || !plein(x, y - 2) || !plein(x, y + 2);
      total += bord ? 2 : 1;
      idx.push(y * cw + x);
      cumul.push(total);
    }
  }
  if (!idx.length) {
    for (let i = 0; i < n; i++) {
      out[i * 3] = w / 2;
      out[i * 3 + 1] = h / 2;
    }
    return out;
  }
  const flou = Math.max(w, h) * 0.008;
  for (let i = 0; i < n; i++) {
    const r = rnd() * total;
    let lo = 0;
    let hi = cumul.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumul[mid]! < r) lo = mid + 1;
      else hi = mid;
    }
    const p = idx[lo]!;
    let x = ((p % cw) + rnd()) / k;
    let y = (Math.floor(p / cw) + rnd()) / k;
    // Un grain sur cinq s'écarte un peu du trait (loi normale) : le bord s'effiloche au lieu d'être découpé.
    if (rnd() < 0.2) {
      const r = Math.sqrt(-2 * Math.log(1 - rnd())) * flou;
      const a = rnd() * Math.PI * 2;
      x += Math.cos(a) * r;
      y += Math.sin(a) * r;
    }
    out[i * 3] = Math.min(w, Math.max(0, x));
    out[i * 3 + 1] = Math.min(h, Math.max(0, y));
    out[i * 3 + 2] = (rnd() - 0.5) * 24;
  }
  return out;
}
