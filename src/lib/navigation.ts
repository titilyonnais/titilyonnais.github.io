import { calm, sauterA } from './motion';

/**
 * Les liens internes (la nav, la liste du hero) vont droit à l'essentiel : pas de
 * défilement à travers toutes les scènes, un fondu bref et l'on y est. Une scène
 * s'ouvre sur sa démo jouable, pas sur le haut de sa piste.
 */

/** Dans la piste d'une scène, le moment où la fenêtre est de face et jouable (fenetre3d : 0,55 → 0,95). */
const ESSENTIEL = 0.62;

function cible(id: string): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const piste = el.querySelector<HTMLElement>('.piste');
  if (!piste) return el.getBoundingClientRect().top + scrollY;
  const haut = piste.getBoundingClientRect().top + scrollY;
  return haut + ESSENTIEL * Math.max(0, piste.offsetHeight - innerHeight);
}

function aller(id: string, anime: boolean): boolean {
  const y = cible(id);
  if (y === null) return false;
  const sauter = () => {
    sauterA(y);
    // Le focus suit, comme pour une ancre native, sans faire défiler.
    const el = document.getElementById(id)!;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  if (anime && !calm() && document.startViewTransition) document.startViewTransition(sauter);
  else sauter();
  return true;
}

export function bootNavigation(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || a.target || a.classList.contains('skip')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!aller(id, true)) return;
    e.preventDefault();
    history.replaceState(history.state, '', url.hash);
  });

  // Arrivée depuis une étude de cas sur /#clipper : la démo, pas le haut de la piste.
  // Un retour arrière ou un rechargement garde la position que le navigateur restaure.
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || id === 'contenu' || (nav && nav.type !== 'navigate')) return;
  // Le navigateur fait d'abord défiler jusqu'au haut de la section : on passe après lui (load),
  // puis une seconde fois quand les polices ont fixé les hauteurs, si personne n'a bougé entre-temps.
  const arriver = () => {
    aller(id, false);
    const ici = scrollY;
    document.fonts.ready.then(() => {
      if (Math.abs(scrollY - ici) < 2) aller(id, false);
    });
  };
  if (document.readyState === 'complete') arriver();
  else addEventListener('load', arriver, { once: true });
}
