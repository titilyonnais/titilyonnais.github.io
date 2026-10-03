/// <reference lib="webworker" />
import { echantillonner } from './echantillon';
import type { Forme } from './formes';

type Demande = {
  id: number;
  forme: Forme;
  w: number;
  h: number;
  n: number;
  texte?: string;
  police?: { famille: string; url: string; desc: FontFaceDescriptors };
};

const chargees = new Map<string, Promise<void>>();
const scope = self as unknown as DedicatedWorkerGlobalScope & { fonts?: FontFaceSet };

function charger(p: NonNullable<Demande['police']>): Promise<void> {
  if (!scope.fonts) return Promise.reject(new Error('pas de polices dans le worker'));
  let c = chargees.get(p.famille);
  if (!c) {
    const ff = new FontFace(p.famille, `url(${p.url})`, p.desc);
    c = ff.load().then((f) => void scope.fonts!.add(f));
    chargees.set(p.famille, c);
  }
  return c;
}

scope.onmessage = async (e: MessageEvent<Demande>) => {
  const d = e.data;
  try {
    if (d.forme.type === 'texte' && d.police) await charger(d.police);
    const points = echantillonner(d.forme, d.w, d.h, d.n, d.texte, (w, h) => {
      const c = new OffscreenCanvas(w, h);
      return { ctx: c.getContext('2d', { willReadFrequently: true })! };
    });
    scope.postMessage({ id: d.id, points }, [points.buffer]);
  } catch (err) {
    scope.postMessage({ id: d.id, erreur: String(err) });
  }
};
