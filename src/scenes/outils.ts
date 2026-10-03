// Outils des figures d'étude de cas. Tout est fonction de t : rejouable dans les deux sens.

const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));

/** Progression locale de t dans [a, b], bornée à [0, 1]. */
export const seg = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));

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

export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] => [
  ...root.querySelectorAll<T>(sel),
];
