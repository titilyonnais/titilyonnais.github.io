import { ScrollTrigger } from '../motion';
import { cible } from './cibles';
import type { Hero } from './hero';
import type { Etat, Moteur, Reglages, Teinte } from './types';

/**
 * Le chef d'orchestre : chaque section déclare une « station » dans le HTML,
 *
 *   <section data-station="contact" data-fond="ink" data-forme="arobase" data-teinte="--teinte-x">
 *
 * et la station qui couvre le milieu de l'écran décide de la forme, de la teinte
 * et du fond. La forme se dessine dans [data-place] (ou dans tout l'écran si
 * data-ancre="ecran"), et la toile suit cet élément quand il défile.
 */
export type Fond = 'ink' | 'paper' | 'aucun';

type Station = {
  id: string;
  el: HTMLElement;
  rang: number;
  fond: Fond;
  formes: string[];
  teinte: string[];
  ecran: boolean;
};

export interface Chef {
  /** Forme visée en ce moment (clé de FORMES, ou « hero »). */
  readonly forme: string;
  /** Éclate le nuage depuis un point de l'écran. */
  eclater(x: number, y: number, force?: number): void;
  /** Montre une autre forme dans la station courante pendant `ms`, puis revient. */
  montrer(cle: string, ms: number): void;
  /** Dessine le contour d'un élément (une fenêtre qui arrive). */
  poser(el: Element, teinte?: string): void;
  /** Fait voler des particules d'un rectangle à un autre ; résout à l'arrivée. */
  envoler(de: DOMRect, vers: DOMRect, teinte?: string): Promise<void>;
  /** Rend la main à la forme de la station courante. */
  liberer(): void;
  reglages(r: Partial<Reglages>): void;
  /** Prévient quand une station devient active ou ne l'est plus. */
  sur(id: string, f: (actif: boolean) => void): void;
}

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let instance: Chef | null = null;
/** Le chef, s'il y a une toile (null sans WebGL ou avant le démarrage). */
export const leChef = () => instance;

declare global {
  interface Window {
    __chef?: Chef;
  }
}

const REPOS: Partial<Reglages> = { bruit: 10, raideur: 38 };
const MORPHOSE: Partial<Reglages> = { bruit: 650, raideur: 9 };

export function bootChef(m: Moteur, etat: Etat, hero: Hero | null): Chef {
  const fige = calme();
  const stations: Station[] = [...document.querySelectorAll<HTMLElement>('[data-station]')].map((el, rang) => ({
    id: el.dataset.station!,
    el,
    rang,
    fond: (el.dataset.fond as Fond) ?? 'ink',
    formes: (el.dataset.formes ?? el.dataset.forme ?? '').split(',').filter(Boolean),
    teinte: (el.dataset.teinte ?? '').split(',').filter(Boolean),
    ecran: el.dataset.ancre === 'ecran',
  }));

  // Ancre : la simulation vit dans son repère, le rendu suit sa position à chaque image.
  let ancre: Element | null = null;
  const position = (): [number, number] => {
    const r = ancre?.getBoundingClientRect();
    return r ? [r.left, r.top] : [0, 0];
  };
  const ancrer = (el: Element | null) => {
    ancre = el;
    m.decaler(...position(), true);
  };
  m.surImage(() => m.decaler(...position()));
  addEventListener('scroll', () => m.decaler(...position()), { passive: true });

  let courante: Station | null = null;
  let sous = 0;
  let forme = '';
  let gen = 0;
  let retour = 0;
  const abonnes = new Map<string, ((actif: boolean) => void)[]>();

  const teinteDe = (st: Station): Teinte => {
    if (st.fond === 'paper') return [css('--ink')];
    if (st.teinte.length) return st.teinte.map(css) as Teinte;
    return [css('--paper')];
  };

  /** Dessine `cle` dans l'ancre de la station ; une réponse périmée (station quittée) est ignorée. */
  const dessiner = async (st: Station, cle: string, opts: { eclat?: number; reglages?: Partial<Reglages> } = {}) => {
    const g = ++gen;
    forme = cle; // la forme visée, même si son dessin arrive un peu plus tard
    const el = st.ecran ? null : (st.el.querySelector('[data-place]') ?? st.el);
    const r = el?.getBoundingClientRect() ?? { width: innerWidth, height: innerHeight };
    const champ = cle === 'champ';
    const pts = await cible(cle, { x: 0, y: 0, w: r.width, h: r.height }, Math.round(m.n * (champ ? 1 : 0.8)));
    if (g !== gen) return;
    ancrer(el);
    const paper = st.fond === 'paper';
    // Mélange additif sur le noir seulement : sur le papier et sur un ciel coloré, le mélange normal.
    const base = { additif: st.fond === 'ink', taille: st.fond === 'ink' ? 1.3 : 1.5, souffle: 1 };
    const eclat = opts.eclat ?? (champ ? 0.2 : paper ? 0.6 : 0.5);
    if (fige) {
      m.viser({ points: pts, teinte: teinteDe(st), eclat }, { ...base, ...REPOS, ...opts.reglages }, 0, true);
      return;
    }
    m.viser({ points: pts, teinte: teinteDe(st), eclat }, { ...base, ...(champ ? {} : MORPHOSE), ...opts.reglages }, 0.3);
    setTimeout(() => g === gen && m.reglages(champ ? { bruit: 120, raideur: 2 } : { ...REPOS, ...opts.reglages }), 650);
  };

  const activer = (st: Station, s = 0) => {
    const id = st.formes.length > 1 ? `${st.id}-${s + 1}` : st.id;
    if (courante === st && sous === s) return;
    const precedente = courante;
    clearTimeout(retour);
    if (precedente !== st) {
      if (precedente) abonnes.get(precedente.id)?.forEach((f) => f(false));
      abonnes.get(st.id)?.forEach((f) => f(true));
    }
    courante = st;
    sous = s;
    etat.station = id;

    // Fond : le nouveau entre par le bas quand on descend, par le haut quand on remonte.
    // « aucun » : la toile devient transparente et laisse voir le fond de la scène (le ciel d'ÆTHER).
    const vers = st.fond === 'aucun' ? 'transparent' : st.fond === 'paper' ? css('--paper') : css('--ink');
    const sens = !precedente || st.rang >= precedente.rang ? 1 : -1;
    document.documentElement.dataset.fond = st.fond;
    m.fond(vers, 650, sens);
    if (precedente && precedente.fond !== st.fond && !fige) {
      m.impulsion(innerWidth / 2, sens > 0 ? innerHeight + 160 : -160, 700, 0);
    }

    if (st.id === 'hero' && hero) {
      gen++;
      forme = 'hero';
      ancrer(hero.ancre);
      if (fige) void hero.figer();
      else void hero.demarrer();
      return;
    }
    hero?.arreter();
    void dessiner(st, st.formes[s] ?? 'champ');
  };

  // Une station est active quand elle couvre le milieu de l'écran.
  for (const st of stations) {
    ScrollTrigger.create({
      trigger: st.el,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && activer(st, st.formes.length > 1 ? Math.min(st.formes.length - 1, Math.floor(self.progress * st.formes.length)) : 0),
      onUpdate: (self) => {
        if (st.formes.length < 2 || !self.isActive) return;
        activer(st, Math.min(st.formes.length - 1, Math.floor(self.progress * st.formes.length)));
      },
    });
  }

  // À propos : la vitesse du défilement agite le champ.
  let dernierY = scrollY;
  let agitation = 0;
  m.surImage(() => {
    const v = Math.abs(scrollY - dernierY);
    dernierY = scrollY;
    if (courante?.id !== 'apropos' || fige) return;
    agitation += (v * 30 - agitation) * 0.1;
    m.reglages({ bruit: 120 + Math.min(agitation, 2400) });
  });

  // Nouvelle largeur : les boîtes ont changé, on redessine la station courante.
  let largeur = innerWidth;
  let t = 0;
  addEventListener('resize', () => {
    if (innerWidth === largeur) return;
    largeur = innerWidth;
    clearTimeout(t);
    t = window.setTimeout(() => {
      if (courante && courante.id !== 'hero') void dessiner(courante, courante.formes[sous] ?? 'champ');
    }, 150);
  });

  const chef: Chef = {
    get forme() {
      return forme;
    },
    eclater(x, y, force = 2600) {
      m.impulsion(x, y, force, Math.max(innerWidth, innerHeight) * 0.6);
    },
    montrer(cle, ms) {
      const st = courante;
      if (!st || st.id === 'hero') return;
      void dessiner(st, cle);
      clearTimeout(retour);
      retour = window.setTimeout(() => courante === st && void dessiner(st, st.formes[sous] ?? 'champ'), ms);
    },
    poser(el, teinte) {
      const st = courante;
      if (!st) return;
      const g = ++gen;
      const r = el.getBoundingClientRect();
      void cible('contour', { x: 0, y: 0, w: r.width, h: r.height }, Math.round(m.n * 0.6)).then((pts) => {
        if (g !== gen) return;
        ancrer(el);
        forme = 'contour';
        m.viser({ points: pts, teinte: teinte ? [teinte] : teinteDe(st), eclat: 0.7 }, { ...MORPHOSE, additif: st.fond === 'ink' }, 0.25, fige);
        setTimeout(() => g === gen && m.reglages(REPOS), 500);
      });
    },
    async envoler(de, vers, teinte) {
      const st = courante;
      if (!st || fige) return;
      const g = ++gen;
      const n = Math.round(m.n * 0.25);
      const depart = await cible('champ', { x: 0, y: 0, w: de.width, h: de.height }, n);
      const arrivee = await cible('champ', { x: 0, y: 0, w: vers.width, h: vers.height }, n);
      if (g !== gen) return;
      ancrer(null);
      for (let i = 0; i < depart.length; i += 3) {
        depart[i] = depart[i]! + de.left;
        depart[i + 1] = depart[i + 1]! + de.top;
        depart[i + 2] = 0;
        arrivee[i] = arrivee[i]! + vers.left;
        arrivee[i + 1] = arrivee[i + 1]! + vers.top;
        arrivee[i + 2] = 0;
      }
      const tt = teinte ? [teinte] as Teinte : teinteDe(st);
      forme = 'envol';
      m.viser({ points: depart, teinte: tt, eclat: 0.9 }, { raideur: 40, bruit: 0 }, 0, true);
      m.viser({ points: arrivee, teinte: tt, eclat: 0.9 }, { raideur: 26, bruit: 220 }, 0.18);
      await new Promise((r) => setTimeout(r, 650));
    },
    liberer() {
      if (courante) activer(courante, sous);
      else forme = '';
      const st = courante;
      if (st && st.id !== 'hero') void dessiner(st, st.formes[sous] ?? 'champ');
    },
    reglages(r) {
      m.reglages(r);
    },
    sur(id, f) {
      const l = abonnes.get(id) ?? [];
      l.push(f);
      abonnes.set(id, l);
      if (courante?.id === id) f(true);
    },
  };
  instance = chef;
  window.__chef = chef;

  // Station de départ : celle qui couvre le milieu de l'écran maintenant (retour arrière, ancre d'URL).
  const milieu = innerHeight / 2;
  const depart = stations.find((s) => {
    const r = s.el.getBoundingClientRect();
    return r.top <= milieu && r.bottom >= milieu;
  });
  if (depart) activer(depart);
  return chef;
}
