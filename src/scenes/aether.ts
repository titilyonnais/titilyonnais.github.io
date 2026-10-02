import type { SceneModule } from '../lib/motion/scene';
import { gsap } from '../lib/motion';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { $, $$, clamp, easeInOut, easeOut, etat, hasard, lerp, seg, temps } from './outils';

gsap.registerPlugin(Draggable, InertiaPlugin);

/*
 * ÆTHER, en trois temps :
 *  0.00 Trop d'onglets — la barre se remplit jusqu'à rendre les onglets illisibles.
 *  0.30 Des cartes     — chaque onglet se détache, bascule et devient une carte.
 *  0.80 Une toile      — les cartes se posent en trois intentions ; on peut les déplacer.
 */
const BORNES = [0, 0.3, 0.8];
const LIBRE = 0.9; // au-delà, la scène est finie : les cartes se prennent à la main.

type Rect = { x: number; y: number; w: number; h: number; r: number };

export const mount: SceneModule['mount'] = (root, { mobile }) => {
  const ae = $(root, '.ae');
  const strip = $(ae, '.onglets');
  const toile = $(ae, '.toile');
  const adr = $(ae, '.adr');
  const groupes = $$(ae, '.groupe');
  const cartes = $$(ae, '.carte').filter((c) => !mobile || c.dataset.mobile === '1');
  const N = cartes.length;
  const domaines = cartes.map((c) => c.querySelector('.d')?.textContent ?? '');

  let A: Rect[] = [];
  let B: Rect[] = [];

  // Positions de départ (barre d'onglets) et d'arrivée (groupes sur la toile), relatives à .ae.
  const mesurer = () => {
    const base = ae.getBoundingClientRect();
    const s = strip.getBoundingClientRect();
    const tl = toile.getBoundingClientRect();
    const ox = tl.left - base.left;
    const oy = tl.top - base.top;

    const tabW = s.width / N;
    A = cartes.map((_, i) => ({ x: s.left - base.left + i * tabW, y: s.top - base.top, w: tabW, h: s.height, r: 0 }));

    const parGroupe: number[][] = [[], [], []];
    cartes.forEach((c, i) => parGroupe[Number(c.dataset.g)]!.push(i));
    B = new Array(N);
    const col = tl.width / 3;
    // Deux colonnes de cartes par groupe, décalées de 62 % : le groupe tient dans 86 % de sa colonne.
    const cw = mobile ? Math.min(118, tl.width * 0.3) : Math.min(200, col * 0.53);
    const ch = cw * (mobile ? 0.62 : 0.64);
    const hauteurGroupe = ch * 0.8 * 3 + ch;

    parGroupe.forEach((ids, g) => {
      let gx: number;
      let gy: number;
      if (mobile) {
        const bande = tl.height / 3;
        gx = ox + 12;
        gy = oy + g * bande + 26;
      } else {
        gx = ox + g * col + col * 0.07;
        gy = oy + Math.max(34, (tl.height - hauteurGroupe) / 2 + (g === 1 ? 36 : -24));
      }
      const lab = groupes[g]!;
      lab.style.setProperty('--x', `${gx - ox}px`);
      lab.style.setProperty('--y', `${gy - oy - 26}px`);
      ids.forEach((i, k) => {
        const n = i * 7.3 + g;
        let x: number;
        let y: number;
        if (mobile) {
          x = gx + k * (cw * 0.72);
          y = gy + (k % 2) * (ch * 0.22);
        } else {
          const colK = k % 2;
          const rowK = Math.floor(k / 2);
          x = gx + colK * (cw * 0.62) + (hasard(n) - 0.5) * 14;
          y = gy + rowK * (ch * 0.8) + (hasard(n + 1) - 0.5) * 12;
        }
        B[i] = { x, y, w: cw, h: ch, r: (hasard(n + 2) - 0.5) * 9 };
      });
    });
  };

  // Glisser-déposer, créé une fois, activé seulement quand la scène est finie.
  let drags: Draggable[] = [];
  const deplacees = new Set<HTMLElement>();
  let libre = false;
  let premier = 10;
  const liberer = (on: boolean) => {
    if (on === libre) return;
    libre = on;
    etat(ae, 'libre', on);
    if (on && !drags.length) {
      drags = Draggable.create(cartes, {
        type: 'x,y',
        bounds: toile,
        inertia: true,
        edgeResistance: 0.85,
        zIndexBoost: false,
        onPress(this: Draggable) {
          (this.target as HTMLElement).style.zIndex = String(++premier);
        },
        onDragStart(this: Draggable) {
          deplacees.add(this.target as HTMLElement);
        },
      });
    }
    drags.forEach((d) => (on ? d.enable() : d.disable()));
    cartes.forEach((c) => (on ? c.setAttribute('tabindex', '0') : c.removeAttribute('tabindex')));
    if (!on) deplacees.clear();
  };

  // Au clavier : les flèches déplacent la carte de 16 px, sans sortir de la toile.
  const clavier = (e: KeyboardEvent) => {
    const c = e.target as HTMLElement;
    if (!libre || !c.classList.contains('carte')) return;
    const pas: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const d = pas[e.key];
    if (!d) return;
    e.preventDefault();
    const r = c.getBoundingClientRect();
    const t = toile.getBoundingClientRect();
    const dx = clamp(d[0], t.left - r.left, t.right - r.right);
    const dy = clamp(d[1], t.top - r.top, t.bottom - r.bottom);
    gsap.to(c, { x: `+=${dx}`, y: `+=${dy}`, duration: 0.18, ease: 'power2.out' });
    deplacees.add(c);
  };
  ae.addEventListener('keydown', clavier);

  let derniereT = 0;
  const rendre = (t: number) => {
    derniereT = t;
    temps(root, BORNES, t);

    // 1. La barre se remplit : de 6 onglets lisibles à N lamelles.
    const ouverts = Math.round(lerp(Math.min(6, N), N, easeOut(seg(t, 0.02, 0.28))));
    const s = strip.getBoundingClientRect();
    const tabW = s.width / ouverts;
    const actif = ouverts - 1;
    const a = adr.textContent;
    const txt = t < 0.78 ? domaines[actif] ?? '' : `toile · 3 intentions · ${N} cartes`;
    if (a !== txt) adr.textContent = txt;

    cartes.forEach((c, i) => {
      // 2. Le détachement : chaque onglet part à son tour, dans l'ordre de la barre.
      const d0 = 0.3 + (i / N) * 0.32;
      const p = easeInOut(seg(t, d0, d0 + 0.18));
      const depart: Rect = { ...A[i]!, x: A[0]!.x + i * tabW, w: tabW };
      const fin = B[i]!;
      etat(c, 'vue', i < ouverts || t >= 0.3);
      etat(c, 'onglet', p < 0.35);
      etat(c, 'active', i === actif && p === 0 && t < 0.3);
      if (libre && deplacees.has(c)) return; // la main a la priorité
      const levee = Math.sin(p * Math.PI);
      gsap.set(c, {
        x: lerp(depart.x, fin.x, p),
        y: lerp(depart.y, fin.y, p) - levee * 46,
        rotation: lerp(0, fin.r, p) + levee * (hasard(i) - 0.5) * 28,
        width: lerp(depart.w, fin.w, p),
        height: lerp(depart.h, fin.h, p),
        zIndex: p > 0 && p < 1 ? 5 : 1,
      });
    });

    // 3. La toile : pointillé, intentions, puis les cartes se libèrent.
    etat(ae, 'posee', t >= 0.66);
    groupes.forEach((g, i) => g.style.setProperty('--r', String(easeInOut(seg(t, 0.76 + i * 0.03, 0.84 + i * 0.03)))));
    liberer(t >= LIBRE);
  };

  mesurer();
  const ro = new ResizeObserver(() => {
    mesurer();
    deplacees.clear();
    rendre(derniereT);
  });
  ro.observe(ae);

  return {
    progress: rendre,
    destroy() {
      ro.disconnect();
      ae.removeEventListener('keydown', clavier);
      drags.forEach((d) => d.kill());
      drags = [];
      cartes.forEach((c) => {
        gsap.set(c, { clearProps: 'all' });
        c.removeAttribute('tabindex');
      });
    },
  };
};
