/** L'historique de la démo Clipper : 14 éléments copiés dans la matinée. */
export type Type = 'texte' | 'code' | 'lien' | 'image' | 'fichier' | 'couleur' | 'secret' | 'snippet';

export type Element = {
  id: string;
  type: Type;
  /** Le libellé d'une ligne (masqué pour un secret). */
  titre: string;
  /** Ce qui part dans le Bloc-notes au collage. */
  contenu: string;
  /** Texte reconnu dans une image. */
  ocr?: string;
  source: string;
  quand: string;
  langage?: string;
  /** Le code coloré, en spans .kw .str .num .fn .com .var. */
  html?: string;
  chemin?: string;
  abreviation?: string;
};

export const SECRET = 'sk-proj-7Hq2vN9xLm4TbR8cWe1Za';

export const ELEMENTS: readonly Element[] = [
  {
    id: 'facture',
    type: 'fichier',
    titre: 'Facture-2026-031.pdf',
    contenu: 'C:\\Users\\thibault\\Téléchargements\\Facture-2026-031.pdf',
    chemin: 'C:\\Users\\thibault\\Téléchargements\\Facture-2026-031.pdf',
    source: 'Explorateur',
    quand: 'il y a 2 min',
  },
  {
    id: 'capture',
    type: 'image',
    titre: 'Capture d’écran 2026-10-03',
    contenu: 'FACTURE N° 2026-031 · Total 1 240,00 €',
    ocr: 'FACTURE N° 2026-031 · Total 1 240,00 €',
    source: 'Outil Capture',
    quand: 'il y a 4 min',
  },
  {
    id: 'code',
    type: 'code',
    titre: 'def total(lignes):',
    contenu: 'def total(lignes):\n    return sum(l.prix * l.qte for l in lignes)',
    langage: 'python',
    html:
      '<span class="kw">def</span> <span class="fn">total</span>(<span class="var">lignes</span>):\n' +
      '    <span class="kw">return</span> <span class="fn">sum</span>(<span class="var">l</span>.prix * <span class="var">l</span>.qte <span class="kw">for</span> <span class="var">l</span> <span class="kw">in</span> <span class="var">lignes</span>)',
    source: 'VS Code',
    quand: 'il y a 6 min',
  },
  { id: 'couleur', type: 'couleur', titre: '#ff6b5e', contenu: '#ff6b5e', source: 'Figma', quand: 'il y a 9 min' },
  {
    id: 'lien',
    type: 'lien',
    titre: 'https://github.com/titilyonnais/Clipper',
    contenu: 'https://github.com/titilyonnais/Clipper',
    source: 'Chrome',
    quand: 'il y a 12 min',
  },
  { id: 'secret', type: 'secret', titre: 'Contenu sensible masqué', contenu: SECRET, source: 'Terminal', quand: 'il y a 15 min' },
  {
    id: 'contact',
    type: 'texte',
    titre: 'Marie Durand — marie.durand@exemple.fr',
    contenu: 'Marie Durand — marie.durand@exemple.fr',
    source: 'Outlook',
    quand: 'il y a 21 min',
  },
  {
    id: 'sig',
    type: 'snippet',
    titre: 'Signature',
    contenu: 'Thibault Morretton · créateur de logiciels',
    abreviation: ';sig',
    source: 'Snippets',
    quand: 'il y a 24 min',
  },
  { id: 'adresse', type: 'texte', titre: '12 rue des Tanneurs, 69001 Lyon', contenu: '12 rue des Tanneurs, 69001 Lyon', source: 'Chrome', quand: 'il y a 31 min' },
  {
    id: 'note',
    type: 'texte',
    titre: 'Relancer le devis Corail avant vendredi',
    contenu: 'Relancer le devis Corail avant vendredi',
    source: 'Bloc-notes',
    quand: 'il y a 38 min',
  },
  { id: 'suivi', type: 'texte', titre: 'Suivi colis : 6A21843950127', contenu: 'Suivi colis : 6A21843950127', source: 'Gmail', quand: 'il y a 44 min' },
  {
    id: 'build',
    type: 'code',
    titre: 'npm run build',
    contenu: 'npm run build',
    langage: 'shell',
    html: '<span class="fn">npm</span> run build',
    source: 'Terminal',
    quand: 'il y a 52 min',
  },
  { id: 'reunion', type: 'texte', titre: 'Réunion jeudi 14 h', contenu: 'Réunion jeudi 14 h', source: 'Teams', quand: 'il y a 1 h' },
  {
    id: 'readme',
    type: 'texte',
    titre: '## API — clipper.lire() renvoie l’historique',
    contenu: '## API — clipper.lire() renvoie l’historique',
    source: 'VS Code',
    quand: 'il y a 1 h',
  },
];

export const SUGGESTIONS = ['facture', 'api', '#ff6b5e'] as const;

/** Minuscules, sans accents, un caractère pour un caractère (les positions restent valables). */
export const normaliser = (s: string) =>
  [...s].map((c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().charAt(0) || c).join('');

/** Ce sur quoi porte la recherche : le titre, le contenu et le texte reconnu (jamais un secret). */
export const indexer = (e: Element) => normaliser(e.type === 'secret' ? e.titre : [e.titre, e.contenu, e.ocr ?? ''].join(' '));
