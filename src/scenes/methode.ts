import type { SceneModule } from '../lib/motion/scene';

// Les mots passent du contour à l'encre au rythme de la lecture.
export const mount: SceneModule['mount'] = (root) => {
  const mots = [...root.querySelectorAll<HTMLElement>('.mot')];
  let courant = -1;
  return {
    progress(t) {
      // Les derniers 15 % de la piste laissent le texte entier posé un instant.
      const n = Math.round(Math.min(1, t / 0.85) * mots.length);
      if (n === courant) return;
      courant = n;
      mots.forEach((m, i) => m.classList.toggle('lu', i < n));
    },
    destroy() {
      mots.forEach((m) => m.classList.remove('lu'));
    },
  };
};
