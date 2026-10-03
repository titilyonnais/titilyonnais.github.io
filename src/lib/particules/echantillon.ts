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

  if (forme.type === 'champ') {
    for (let i = 0; i < n; i++) {
      out[i * 3] = rnd() * w;
      out[i * 3 + 1] = rnd() * h;
      out[i * 3 + 2] = (rnd() - 0.5) * 300;
    }
    return out;
  }

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
    out[i * 3] = Math.min(w, ((p % cw) + rnd()) / k);
    out[i * 3 + 1] = Math.min(h, (Math.floor(p / cw) + rnd()) / k);
    out[i * 3 + 2] = (rnd() - 0.5) * 24;
  }
  return out;
}
