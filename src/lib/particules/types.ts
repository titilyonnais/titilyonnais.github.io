/** Points xyz entrelacés, en px CSS : origine au coin haut-gauche de l'écran, z vers l'écran. */
export type Vec3 = Float32Array;

/** Une teinte, ou deux pour un dégradé de gauche à droite (en hexadécimal, lue dans les tokens). */
export type Teinte = [string, string?];

export type Cible = {
  points: Vec3;
  teinte: Teinte;
  /** Couleur propre à chaque point (rgb 0–1 entrelacés) ; remplace la teinte. */
  couleurs?: Float32Array;
  /** Éclat des particules de la forme (0–1). Celles en surplus deviennent une poussière à 15 %. */
  eclat?: number;
};

export type Reglages = {
  /** Raideur du ressort vers la cible (1/s²). */
  raideur: number;
  /** Amortissement par image à 60 i/s (0–1). */
  amorti: number;
  /** Intensité du bruit de courbure (px/s²). */
  bruit: number;
  /** Taille des points en px CSS. */
  taille: number;
  /** Mélange additif (sur noir) ou normal (encre sur papier). */
  additif: boolean;
  /** Force du curseur : positive repousse (souffle), négative attire. */
  souffle: number;
};

export interface Moteur {
  readonly palier: number;
  /** Nombre de particules du palier courant. */
  readonly n: number;
  /** decalage : retard maximal par particule (s). instant : les particules sont posées sans trajet. */
  viser(c: Cible, r?: Partial<Reglages>, decalage?: number, instant?: boolean): void;
  reglages(r: Partial<Reglages>): void;
  /**
   * Position écran de l'ancre (px) : la simulation vit dans son repère, le rendu est décalé
   * d'autant, sans retard. rebaser : l'ancre change, les particules ne bougent pas à l'écran.
   */
  decaler(dx: number, dy: number, rebaser?: boolean): void;
  /** Appelé au début de chaque image (suivi des ancres). */
  surImage(f: () => void): void;
  /** Couleur de fond (clear), animée sur `duree` ms. */
  fond(couleur: string, duree?: number): void;
  /** rayon > 0 : explosion depuis (x, y) dans ce rayon. rayon = 0 : onde de choc qui s'étend. */
  impulsion(x: number, y: number, force: number, rayon: number): void;
  /** Mode calme : une image, plus de boucle. */
  figer(on: boolean): void;
  detruire(): void;
}

export type Etat = { frames: number; palier: number; station: string; running: boolean };

/** Boîte écran en px CSS. */
export type Placement = { x: number; y: number; w: number; h: number };

declare global {
  interface Window {
    __particules?: Etat;
    /** Accès de test aux cibles. */
    __particulesApi?: { cible(cle: string, place: Placement, n: number, texte?: string): Promise<Float32Array> };
  }
}
