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
  lenis = new Lenis({ lerp: 0.11, anchors: { offset: 0 }, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** Les polices changent les hauteurs : on recalcule une fois qu'elles sont là. */
export function refreshWhenFontsReady(): void {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
