/** Les quatre thèmes de la démo, tels que backgroundPresets.ts les définit ; les couleurs vivent dans tokens.css. */
export type Theme = {
  id: 'aurore' | 'nebuleuse' | 'braise' | 'pulsar';
  nom: string;
  /** Variable CSS de la couleur d'accent (pastille du sélecteur, particules). */
  accent: string;
  base: string;
  couches: { fond: string; anim: 'drift' | 'pulse' | 'swirl' }[];
  anime: boolean;
};

export const THEMES: readonly Theme[] = [
  {
    id: 'aurore',
    nom: 'Aurore boréale',
    accent: '--ae-aurore-accent',
    base: '--ae-aurore-base',
    couches: [
      { fond: '--ae-aurore-drift', anim: 'drift' },
      { fond: '--ae-aurore-pulse', anim: 'pulse' },
    ],
    anime: true,
  },
  { id: 'nebuleuse', nom: 'Nébuleuse', accent: '--ae-nebuleuse-accent', base: '--ae-nebuleuse-base', couches: [], anime: false },
  { id: 'braise', nom: 'Braise', accent: '--ae-braise-accent', base: '--ae-braise-base', couches: [], anime: false },
  {
    id: 'pulsar',
    nom: 'Pulsar',
    accent: '--ae-pulsar-accent',
    base: '--ae-pulsar-base',
    couches: [
      { fond: '--ae-pulsar-pulse', anim: 'pulse' },
      { fond: '--ae-pulsar-swirl', anim: 'swirl' },
    ],
    anime: true,
  },
];
