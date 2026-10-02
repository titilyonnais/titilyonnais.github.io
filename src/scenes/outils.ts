// Outils partagés par les scènes. Tout est fonction de t : rejouable dans les deux sens.

export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));

/** Progression locale de t dans [a, b], bornée à [0, 1]. */
export const seg = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));

export const easeInOut = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number): number => 1 - Math.pow(1 - x, 3);

export const lerp = (a: number, b: number, x: number): number => a + (b - a) * x;

/** Hasard déterministe : la même graine donne toujours la même valeur. */
export function hasard(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Tape `texte` dans `el` à la progression p ∈ [0, 1]. N'écrit que si ça change. */
export function taper(el: HTMLElement, texte: string, p: number): void {
  const s = texte.slice(0, Math.round(clamp(p) * texte.length));
  if (el.textContent !== s) el.textContent = s;
}

/** Bascule une classe sans toucher au DOM quand rien ne change. */
export function etat(el: Element, cls: string, on: boolean): void {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

/** Met en évidence le temps courant dans la liste des temps de la scène. */
export function temps(root: HTMLElement, bornes: number[], t: number): void {
  let i = 0;
  while (i < bornes.length - 1 && t >= bornes[i + 1]!) i++;
  root.querySelectorAll<HTMLElement>('[data-temps]').forEach((li, j) => etat(li, 'actif', j === i));
}

export const $ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`scène : ${sel} introuvable`);
  return el;
};
export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] => [
  ...root.querySelectorAll<T>(sel),
];
