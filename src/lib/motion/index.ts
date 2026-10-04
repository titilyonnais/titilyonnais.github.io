import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const calm = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = (): boolean => matchMedia('(pointer: coarse)').matches;
export const mobile = (): boolean => innerWidth < 768;

let lenis: Lenis | null = null;

/** Défilement lissé (sauf en mode calme et au doigt, où le natif est meilleur). */
export function startScroll(): void {
  if (calm() || lenis) return;
  // Pas d'ancres lissées : un lien interne saute droit à sa cible (lib/navigation.ts).
  lenis = new Lenis({ lerp: 0.11, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** Les polices changent les hauteurs : on recalcule une fois qu'elles sont là. */
export function refreshWhenFontsReady(): void {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/** Saute à `y` sans défiler : ni le défilement doux ni les scènes intermédiaires ne s'y jouent. */
export function sauterA(y: number): void {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: 'instant' });
  ScrollTrigger.update();
}
