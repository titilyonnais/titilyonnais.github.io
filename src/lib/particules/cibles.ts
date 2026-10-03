import { echantillonner } from './echantillon';
import { FORMES, POLICES } from './formes';
import type { Placement } from './types';

export type { Placement };

let worker: Worker | null | undefined;
let prochain = 1;
const attente = new Map<number, { ok: (p: Float32Array) => void; ko: (e: Error) => void }>();
const cache = new Map<string, Promise<Float32Array>>();

function leWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    if (typeof OffscreenCanvas === 'undefined') throw new Error('OffscreenCanvas');
    worker = new Worker(new URL('./cibles.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; points?: Float32Array; erreur?: string }>) => {
      const a = attente.get(e.data.id);
      attente.delete(e.data.id);
      if (!a) return;
      if (e.data.points) a.ok(e.data.points);
      else a.ko(new Error(e.data.erreur));
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** Repli sur le fil principal : les polices du document sont déjà chargées. */
async function ici(cle: string, w: number, h: number, n: number, texte?: string): Promise<Float32Array> {
  const forme = FORMES[cle]!;
  if (forme.type === 'texte') await document.fonts.load(`${forme.graisse ?? 400} 100px "${forme.police}"`);
  const c = document.createElement('canvas');
  return echantillonner(forme, w, h, n, texte, (cw, ch) => {
    c.width = cw;
    c.height = ch;
    return { ctx: c.getContext('2d', { willReadFrequently: true })! };
  });
}

function brut(cle: string, w: number, h: number, n: number, texte?: string): Promise<Float32Array> {
  const forme = FORMES[cle];
  if (!forme) return Promise.reject(new Error(`forme inconnue : ${cle}`));
  const wk = leWorker();
  if (!wk) return ici(cle, w, h, n, texte);
  const id = prochain++;
  const police = forme.type === 'texte' ? POLICES[forme.police] : undefined;
  return new Promise<Float32Array>((ok, ko) => {
    attente.set(id, { ok, ko });
    wk.postMessage({
      id,
      forme,
      w,
      h,
      n,
      texte,
      police: police && { famille: forme.type === 'texte' ? forme.police : '', ...police },
    });
  }).catch(() => ici(cle, w, h, n, texte));
}

/**
 * Nuage de n points (xyz entrelacés, px écran) qui dessine la forme `cle`
 * dans la boîte `place`. Le dessin est mis en cache par taille ; seule la
 * translation est recalculée.
 */
export async function cible(cle: string, place: Placement, n: number, texte?: string): Promise<Float32Array> {
  const w = Math.max(1, Math.round(place.w));
  const h = Math.max(1, Math.round(place.h));
  const k = `${cle}|${w}x${h}|${n}|${texte ?? ''}`;
  let p = cache.get(k);
  if (!p) {
    p = brut(cle, w, h, n, texte);
    cache.set(k, p);
    p.catch(() => cache.delete(k));
  }
  const base = await p;
  const out = new Float32Array(base.length);
  for (let i = 0; i < base.length; i += 3) {
    out[i] = base[i]! + place.x;
    out[i + 1] = base[i + 1]! + place.y;
    out[i + 2] = base[i + 2]!;
  }
  return out;
}
