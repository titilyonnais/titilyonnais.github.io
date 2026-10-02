// Les couleurs viennent de tokens.css : aucune valeur littérale ici.
export type RGB = [number, number, number];

export function token(name: '--ink' | '--paper'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function rgb(name: '--ink' | '--paper'): RGB {
  const hex = token(name).replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
