/**
 * Les formes que la toile sait dessiner. Les logos reprennent la géométrie exacte
 * des fichiers des produits ; les glyphes qui manquent au sous-ensemble latin de
 * Mona Sans (↗, ✓) sont dessinés en traits.
 */
export type Trace = { d: string; trait?: number };

export type Forme =
  | { type: 'chemin'; traces: Trace[]; vb: [number, number, number, number] }
  | { type: 'texte'; texte: string; police: string; graisse?: number }
  | { type: 'rect'; contour: number }
  | { type: 'champ' };

export const FORMES: Record<string, Forme> = {
  // postship/public/logo-icon.svg
  postship: {
    type: 'chemin',
    vb: [20, 20, 196, 160],
    traces: [
      { d: 'M 99.900 35.600 L 36.000 100.000 L 99.900 164.400 L 115.700 148.000 L 68.500 100.000 L 115.700 52.000 Z' },
      { d: 'M 136.500 35.600 L 200.400 100.000 L 136.500 164.400 L 120.700 148.000 L 167.900 100.000 L 120.700 52.000 Z' },
    ],
  },
  // clipper/loopy-clipboard/assets/logo.svg : carré arrondi (rx 11, trait 5) et trois lignes d'historique.
  clipper: {
    type: 'chemin',
    vb: [7, 7, 50, 50],
    traces: [
      { d: 'M21 10H43A11 11 0 0 1 54 21V43A11 11 0 0 1 43 54H21A11 11 0 0 1 10 43V21A11 11 0 0 1 21 10Z', trait: 5 },
      { d: 'M21 25.5H43M21 32.5H38M21 39.5H31', trait: 4.5 },
    ],
  },
  // aether-browser : le Æ en Instrument Serif (scripts/gen-icon.mjs).
  aether: { type: 'texte', texte: 'Æ', police: 'Instrument Serif', graisse: 400 },

  pied: { type: 'texte', texte: '¶', police: 'Mona Sans', graisse: 500 },
  accolades: { type: 'texte', texte: '{ }', police: 'Mona Sans', graisse: 500 },
  arobase: { type: 'texte', texte: '@', police: 'Mona Sans', graisse: 500 },
  fleche: { type: 'chemin', vb: [8, 8, 84, 84], traces: [{ d: 'M18 82L82 18M34 18H82V66', trait: 11 }] },
  coche: { type: 'chemin', vb: [6, 14, 88, 72], traces: [{ d: 'M14 50L40 76L86 22', trait: 12 }] },
  compteur: { type: 'texte', texte: '000', police: 'IBM Plex Mono', graisse: 400 },
  contour: { type: 'rect', contour: 2 },
  champ: { type: 'champ' },
};

/** Où trouver chaque police, pour les charger dans le worker. */
export const POLICES: Record<string, { url: string; desc: FontFaceDescriptors }> = {
  'Mona Sans': {
    url: '/fonts/mona-sans-latin-standard-normal.woff2',
    desc: { weight: '200 900', stretch: '75% 125%' },
  },
  'IBM Plex Mono': { url: '/fonts/ibm-plex-mono-latin-400-normal.woff2', desc: { weight: '400' } },
  'Instrument Serif': { url: '/produits/polices/instrument-serif-latin-400-normal.woff2', desc: { weight: '400' } },
};
