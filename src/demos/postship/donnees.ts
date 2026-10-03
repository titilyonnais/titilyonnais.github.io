/** Les vrais textes de la démo PostShip (src/components/marketing/pieces/demo.tsx). */
export type Check = { label: string; url: string; ok: string; ko?: string };

export const CHECKS: readonly Check[] = [
  { label: 'La page répond', url: '/', ok: '200 · 312 ms' },
  { label: 'Le contenu attendu est là', url: '/produits', ok: 'trouvé' },
  { label: 'Le certificat tient', url: 'boutique-corail.fr', ok: '71 jours' },
  { label: 'Le sitemap est sain', url: '/sitemap.xml', ok: '148 URLs, 0 morte' },
  { label: 'Le paiement passe', url: '/checkout', ok: 'passe', ko: '500 après « Payer »' },
  { label: 'La page reste indexable', url: '/', ok: 'index' },
];

/** Index de la vérification qui tombe. */
export const KO = 4;

export const COMMIT = { sha: 'a1b2c3d', message: 'feat: nouveau checkout' };
/** Le rail de production : le déploiement cassé, puis le précédent vérifié bon. */
export const RAIL = ['9f3c2e1', '4b1d7a0'] as const;
export const ALERTE = 'Message envoyé dans #alertes — /checkout répond 500 après « Payer » depuis a1b2c3d.';
export const CAUSE = 'Cause probable : STRIPE_SECRET absente de la preview, retirée dans le même commit.';

/** Le barème du Ship Score : le poids réel de chaque catégorie. */
export const VERIFIE = [
  { libelle: 'Pages de paiement', bareme: 40 },
  { libelle: 'Indexabilité', bareme: 30 },
  { libelle: 'Ressources déclarées', bareme: 25 },
  { libelle: 'Certificat', bareme: 10 },
] as const;
export const PAS_ENCORE = [
  { libelle: 'Visibilité IA', bareme: 25 },
  { libelle: 'Rendu visuel', bareme: 15 },
] as const;

/** Couleur du score : ≥ 90 ok, ≥ 70 warn, sinon danger. */
export const ton = (score: number) => (score >= 90 ? 'ok' : score >= 70 ? 'warn' : 'danger');
