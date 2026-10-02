import { calm } from './motion';

/**
 * Les titres [data-etire] arrivent condensés et s'élargissent quand ils entrent
 * dans l'écran : l'axe de largeur de Mona Sans, de 75 % à 100 %.
 * Une seule fois par titre ; rien en mode calme.
 */
export function bootTitres(): void {
  const titres = document.querySelectorAll<HTMLElement>('[data-etire]');
  if (!titres.length || calm()) return;
  document.documentElement.dataset.etire = 'on';
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.etire = 'vu';
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  titres.forEach((t) => io.observe(t));
}
