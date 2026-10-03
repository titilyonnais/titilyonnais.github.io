import type { SceneModule } from '../lib/motion/scene';
import { coarse } from '../lib/motion';
import { leChef } from '../lib/particules/chef';

/**
 * L'adresse e-mail : chaque lettre s'élargit selon la distance au curseur
 * (axe de largeur de Mona Sans, 75 → 125 %). Un clic copie l'adresse.
 * Pas de défilement ici : progress() ne fait rien.
 */
export const mount: SceneModule['mount'] = (root, { calm }) => {
  const bouton = root.querySelector<HTMLButtonElement>('[data-copier]')!;
  const lettres = [...bouton.querySelectorAll<HTMLElement>('.l')];
  const statut = root.closest('section')?.querySelector<HTMLElement>('.statut');
  const adresse = bouton.dataset.copier ?? '';
  const zone: HTMLElement = root.closest('section') ?? root;

  let timer = 0;
  const copier = async () => {
    // L'arobase éclate et se reforme en coche, le temps de dire « copié ».
    const chef = leChef();
    if (chef) {
      const r = bouton.getBoundingClientRect();
      chef.eclater(r.left + r.width / 2, r.top + r.height / 2, 1800);
      chef.montrer('coche', 1600);
    }
    try {
      await navigator.clipboard.writeText(adresse);
      if (statut) statut.textContent = 'Copié';
    } catch {
      if (statut) statut.textContent = adresse;
    }
    clearTimeout(timer);
    timer = window.setTimeout(() => statut && (statut.textContent = ''), 2400);
  };
  bouton.addEventListener('click', copier);

  let raf = 0;
  let px = -1e4;
  let py = -1e4;
  const largeurs = lettres.map(() => 100);

  const frame = () => {
    raf = 0;
    let encore = false;
    for (let i = 0; i < lettres.length; i++) {
      const r = lettres[i]!.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
      const cible = 75 + 50 * Math.max(0, 1 - d / 260);
      const w = largeurs[i]! + (cible - largeurs[i]!) * 0.2;
      if (Math.abs(w - largeurs[i]!) > 0.1) encore = true;
      largeurs[i] = w;
      lettres[i]!.style.setProperty('--w', `${w.toFixed(1)}%`);
    }
    if (encore) raf = requestAnimationFrame(frame);
  };
  const move = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const leave = () => {
    px = py = -1e4;
    if (!raf) raf = requestAnimationFrame(frame);
  };

  // Au survol de l'adresse, le curseur attire les particules au lieu de les souffler.
  const attirer = () => leChef()?.reglages({ souffle: -1.3 });
  const relacher = () => leChef()?.reglages({ souffle: 1 });

  const anime = !calm && !coarse();
  if (anime) {
    bouton.addEventListener('pointerenter', attirer);
    bouton.addEventListener('pointerleave', relacher);
    // Au repos, les lettres sont condensées (75 %, dans le CSS) : le curseur les ouvre.
    lettres.forEach((_, i) => (largeurs[i] = 75));
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerleave', leave);
  }

  return {
    progress() {},
    destroy() {
      bouton.removeEventListener('click', copier);
      zone.removeEventListener('pointermove', move);
      zone.removeEventListener('pointerleave', leave);
      bouton.removeEventListener('pointerenter', attirer);
      bouton.removeEventListener('pointerleave', relacher);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      lettres.forEach((l) => l.style.removeProperty('--w'));
    },
  };
};
