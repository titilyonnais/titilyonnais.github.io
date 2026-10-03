/** La Toile de la démo ÆTHER : trois Espaces, six pages ouvertes, quatre de plus quand on compare Rust et Zig. */
export type Espace = { id: string; nom: string; teinte: number };
export type Carte = {
  id: string;
  espace: string;
  titre: string;
  domaine: string;
  /** Coin haut gauche dans le monde de la Toile (cartes de 360 × 260), bureau puis téléphone. */
  pos: [number, number];
  posMobile: [number, number];
  vivante: boolean;
};

export const ESPACES: readonly Espace[] = [
  { id: 'lisbonne', nom: 'Lisbonne', teinte: 24 },
  { id: 'rust', nom: 'Rust', teinte: 210 },
  { id: 'factures', nom: 'Factures', teinte: 158 },
];

export const CARTES: readonly Carte[] = [
  { id: 'visitlisboa', espace: 'lisbonne', titre: 'Visit Lisboa — Que faire à Lisbonne', domaine: 'visitlisboa.com', pos: [0, 10], posMobile: [0, 0], vivante: true },
  { id: 'tap', espace: 'lisbonne', titre: 'TAP Air Portugal — Vols', domaine: 'tap.pt', pos: [30, 330], posMobile: [400, 20], vivante: false },
  { id: 'impots', espace: 'factures', titre: 'Espace particulier', domaine: 'impots.gouv.fr', pos: [420, -10], posMobile: [10, 320], vivante: false },
  { id: 'pennylane', espace: 'factures', titre: 'Pennylane — Factures fournisseurs', domaine: 'pennylane.com', pos: [400, 320], posMobile: [410, 330], vivante: true },
  { id: 'rustdoc', espace: 'rust', titre: 'The Rust Programming Language', domaine: 'doc.rust-lang.org', pos: [830, 20], posMobile: [0, 640], vivante: true },
  { id: 'crates', espace: 'rust', titre: 'crates.io: Rust Package Registry', domaine: 'crates.io', pos: [810, 340], posMobile: [400, 650], vivante: false },
];

/** Les quatre pages qu'ouvre « compare rust et zig pour un jeu », dans l'Espace Rust. */
export const INTENTION: readonly Carte[] = [
  { id: 'rustlang', espace: 'rust', titre: 'Rust', domaine: 'rust-lang.org', pos: [1240, 0], posMobile: [0, 960], vivante: true },
  { id: 'zig', espace: 'rust', titre: 'Zig', domaine: 'ziglang.org', pos: [1250, 330], posMobile: [400, 970], vivante: true },
  { id: 'bevy', espace: 'rust', titre: 'Bevy Engine', domaine: 'bevyengine.org', pos: [830, 660], posMobile: [10, 1270], vivante: false },
  { id: 'ziggit', espace: 'rust', titre: 'Zig vs Rust pour un moteur de jeu', domaine: 'ziggit.dev', pos: [1240, 670], posMobile: [410, 1280], vivante: false },
];

export const PHRASE = 'compare rust et zig pour un jeu';

/** La teinte d'un domaine, comme hueFromString (ÆTHER) : h = (h × 31 + code) mod 360. */
export const teinteDe = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);

export type Interpretation = { genre: 'url' | 'recherche' | 'comparer'; libelle: string; detail: string };

/** Ce que la Barre d'Intention comprend de ce qu'on tape (IntentionOverlay.tsx). */
export function interpreter(brut: string): Interpretation | null {
  const q = brut.trim();
  if (!q) return null;
  const cmp = q.match(/\bcompar\w*\s+(\S+)\s+(?:et|vs\.?|ou|avec|à)\s+(\S+)/i);
  if (cmp) {
    return {
      genre: 'comparer',
      libelle: `Comparer « ${cmp[1]} » et « ${cmp[2]} »`,
      detail: 'Vue scindée : deux recherches côte à côte, synthèse par Muse',
    };
  }
  const url = q.match(/^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,})(\/\S*)?$/i);
  if (url) return { genre: 'url', libelle: `Naviguer vers ${url[1]}`, detail: /^https?:/i.test(q) ? q : `https://${q}` };
  return { genre: 'recherche', libelle: `Rechercher « ${q} »`, detail: 'Recherche web dans une nouvelle carte' };
}
