import { gsap } from './motion';
import { leChef, type Chef } from './particules/chef';

/**
 * Une fenêtre produit en HTML, posée dans un théâtre en perspective et pilotée
 * par la progression de sa piste :
 *
 *   0    → 0,15  arrivée : les particules dessinent le contour, puis l'interface apparaît
 *   0,15 → 0,45  vue éclatée : la fenêtre s'incline, ses couches se séparent en Z
 *   0,45 → 0,55  réassemblage, presque de face
 *   0,55 → 0,95  démo : la fenêtre est jouable et suit un peu la souris
 *   0,95 → 1     départ : la fenêtre se dissout en particules
 *
 * Les couches sont les éléments [data-couche data-z="120" data-legende="…"].
 * Un élément intermédiaire entre la fenêtre et une couche porte [data-3d]
 * pour garder la profondeur.
 */
export type Couche = { el: HTMLElement; z: number; legende?: string };
export type Fenetre3D = {
  phase(t: number): void;
  echelle(): void;
  readonly enDemo: boolean;
  detruire(): void;
};

const borne = (v: number) => Math.min(1, Math.max(0, v));
const lisse = (v: number) => {
  const x = borne(v);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, e: number) => a + (b - a) * e;

export function fenetre3d(scene: HTMLElement, opts: { calme: boolean; mobile: boolean; chef: Chef | null }): Fenetre3D {
  const theatre = scene.querySelector<HTMLElement>('.theatre')!;
  const fen = scene.querySelector<HTMLElement>('[data-fenetre]')!;
  // Le chef démarre après le préchargeur : on le demande au moment d'agir.
  const chef = () => opts.chef ?? leChef();

  const couches: Couche[] = [...fen.querySelectorAll<HTMLElement>('[data-couche]')].map((el) => ({
    el,
    z: Number(el.dataset.z ?? 0) * (opts.mobile ? 0.5 : 1),
    legende: el.dataset.legende,
  }));
  const legendes = couches.map((c) => {
    if (!c.legende) return null;
    const l = document.createElement('span');
    // data-legende-pos="bas" : sous la couche, quand une couche plus proche cacherait le haut.
    l.className = c.el.dataset.legendePos === 'bas' ? 'legende mono bas' : 'legende mono';
    l.setAttribute('aria-hidden', 'true');
    l.textContent = c.legende;
    c.el.append(l);
    return l;
  });

  // Rotation de la phase (rx, ry), inclinaison à la souris (ix, iy), séparation des couches (z).
  const etat = { rx: 0, ry: 0, ix: 0, iy: 0, z: 0 };
  const rendre = () => {
    fen.style.setProperty('--rx', `${(etat.rx + etat.ix).toFixed(3)}deg`);
    fen.style.setProperty('--ry', `${(etat.ry + etat.iy).toFixed(3)}deg`);
    couches.forEach((c) => c.el.style.setProperty('--tz', `${(c.z * etat.z).toFixed(2)}px`));
    // En vue éclatée, la fenêtre recule un peu : inclinée, elle tient encore dans le théâtre.
    fen.style.setProperty('--ke', (1 - 0.14 * etat.z).toFixed(4));
  };
  const versIx = gsap.quickTo(etat, 'ix', { duration: 0.6, ease: 'power3.out', onUpdate: rendre });
  const versIy = gsap.quickTo(etat, 'iy', { duration: 0.6, ease: 'power3.out', onUpdate: rendre });

  let enDemo = false;
  let pose = false;
  let parti = false;

  const vue = (on: boolean) => (fen.dataset.vue = on ? '1' : '0');
  // L'inclinaison de la vue éclatée (degrés, x puis y) : une fenêtre large peut demander moins.
  const [IX, IY] = (fen.querySelector<HTMLElement>('[data-incline]')?.dataset.incline ?? '14,-18').split(',').map(Number) as [number, number];
  const centre = () => {
    const r = fen.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2] as const;
  };

  // La taille native vient du CSS : elle change sous 768 px (une mise en page de téléphone).
  const echelle = () => {
    const css = getComputedStyle(fen);
    const w = parseFloat(css.getPropertyValue('--w')) || fen.offsetWidth;
    const h = parseFloat(css.getPropertyValue('--h')) || fen.offsetHeight;
    // 4 % de marge : en perspective, le bord incliné vers soi grandit un peu.
    const k = Math.min(1, theatre.clientWidth / w, theatre.clientHeight / h) * 0.96;
    fen.style.setProperty('--k', String(Math.max(0.1, k)));
  };
  const ro = new ResizeObserver(echelle);
  ro.observe(theatre);
  echelle();

  const incliner = (e: PointerEvent) => {
    if (!enDemo || opts.mobile) return;
    // Sur la fenêtre, l'inclinaison se fige : ce qu'on vise ne glisse pas sous le curseur.
    if (fen.contains(e.target as Node)) return;
    const r = theatre.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    versIx(-y * 12);
    versIy(x * 12);
  };
  const redresser = () => {
    versIx(0);
    versIy(0);
  };
  theatre.addEventListener('pointermove', incliner);
  theatre.addEventListener('pointerleave', redresser);

  const phase = (t: number) => {
    if (opts.calme) {
      Object.assign(etat, { rx: 0, ry: 0, z: 0 });
      enDemo = true;
      vue(true);
      rendre();
      return;
    }
    const c = chef();

    // Arrivée : le contour en particules, puis l'interface à 0,12. Pas avant t > 0 : la scène
    // se monte un écran à l'avance, quand la station d'avant tient encore la toile.
    if (c && t <= 0) {
      vue(false);
      if (pose) {
        pose = false;
        c.liberer();
      }
    } else if (c && t < 0.12 && !pose) {
      pose = true;
      vue(false);
      c.poser(fen);
    } else if (t >= 0.12 && pose) {
      pose = false;
      c?.liberer();
    }
    if (!c) vue(t < 0.95);
    else if (t >= 0.12 && t < 0.95) vue(true);

    // Départ : la fenêtre se dissout, et revient si l'on remonte.
    if (t >= 0.95 && !parti) {
      parti = true;
      vue(false);
      if (c) c.eclater(...centre());
    } else if (t < 0.95 && parti) {
      parti = false;
    }

    if (t < 0.15) Object.assign(etat, { rx: 0, ry: 0, z: 0 });
    else if (t < 0.45) {
      const e = lisse((t - 0.15) / 0.3);
      Object.assign(etat, { rx: lerp(0, IX, e), ry: lerp(0, IY, e), z: e });
    } else if (t < 0.55) {
      const e = lisse((t - 0.45) / 0.1);
      Object.assign(etat, { rx: lerp(IX, 4, e), ry: lerp(IY, 0, e), z: 1 - e });
    } else Object.assign(etat, { rx: 4, ry: 0, z: 0 });
    fen.dataset.legendes = t > 0.3 && t < 0.5 ? 'on' : 'off';
    fen.dataset.eclate = etat.z > 0.05 ? 'on' : 'off';

    const demo = t >= 0.55 && t < 0.95;
    if (demo !== enDemo) {
      enDemo = demo;
      if (!demo) redresser();
    }
    rendre();
  };

  return {
    phase,
    echelle,
    get enDemo() {
      return enDemo;
    },
    detruire() {
      ro.disconnect();
      theatre.removeEventListener('pointermove', incliner);
      theatre.removeEventListener('pointerleave', redresser);
      gsap.killTweensOf(etat);
      legendes.forEach((l) => l?.remove());
      if (pose) chef()?.liberer();
    },
  };
}
