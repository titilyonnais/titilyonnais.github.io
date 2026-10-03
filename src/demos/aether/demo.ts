import { gsap } from '../../lib/motion';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { fenetre3d } from '../../lib/fenetre3d';
import { leChef } from '../../lib/particules/chef';
import type { SceneHandle, SceneOpts } from '../../lib/motion/scene';
import { CARTES, ESPACES, PHRASE, interpreter, teinteDe } from './donnees';
import { THEMES, type Theme } from './themes';

gsap.registerPlugin(Draggable, InertiaPlugin);

/** La démo gère elle-même son échelle : pas de remontage au redimensionnement. */
export const garderAuResize = true;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const borne = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// SpatialCanvas.tsx : cartes de 360 × 260, « Tout cadrer » en 340 ms avec 90 px de marge.
const CW = 360;
const CH = 260;
const ZMIN = 0.25;
const ZMAX = 2;
const PAS = 1.25;

/**
 * La Toile d'ÆTHER, jouable : la Barre d'Intention (Ctrl K) comprend ce qu'on
 * tape, « compare rust et zig » ouvre quatre pages en cartes ; la Toile se
 * déplace, se zoome et se cadre ; les cartes se prennent à la main ou au
 * clavier ; un Espace met ses pages en avant ; quatre thèmes changent le ciel.
 */
export function mount(root: HTMLElement, opts: SceneOpts): SceneHandle {
  const section = root.closest<HTMLElement>('section') ?? root;
  const scene = root.querySelector<HTMLElement>('.scene')!;
  const ae = root.querySelector<HTMLElement>('.ae')!;
  const toile = ae.querySelector<HTMLElement>('.toile')!;
  const grille = ae.querySelector<HTMLElement>('[data-toile]')!;
  const monde = ae.querySelector<HTMLElement>('[data-monde]')!;
  const overlay = ae.querySelector<HTMLElement>('[data-intention]')!;
  const champ = ae.querySelector<HTMLInputElement>('[data-champ-intention]')!;
  const interp = ae.querySelector<HTMLElement>('[data-interpretation]')!;
  const icone = interp.querySelector<HTMLElement>('.o-icone')!;
  const pilule = ae.querySelector<HTMLElement>('[data-pilule]')!;
  const nomEspace = ae.querySelector<HTMLElement>('[data-nom-espace]')!;
  const zoomVal = ae.querySelector<HTMLElement>('[data-zoom-val]')!;
  const pages = ae.querySelector<HTMLElement>('[data-compte-pages]');
  const annonce = root.querySelector<HTMLElement>('[data-annonce]')!;
  const invite = root.querySelector<HTMLElement>('[data-invite]');
  const ciel = document.querySelector<HTMLElement>('[data-ciel]');
  const calme = opts.calm;
  const f = fenetre3d(root, { calme, mobile: opts.mobile, chef: null });

  const cartes = () => [...monde.querySelectorAll<HTMLElement>('[data-carte]')];
  const dire = (t: string) => (annonce.textContent = t);

  // Sur téléphone (la mise en page de la fenêtre change sous 768 px), les cartes prennent leurs places
  // de téléphone. Elles en changent si l'écran tourne pendant la démo.
  const etroit = matchMedia('(max-width: 767px)');
  const placer = (mobile: boolean) => {
    if (invite) invite.textContent = mobile ? 'Touchez la Barre d’Intention' : 'Ctrl K, ou cliquez la Barre d’Intention';
    monde.querySelectorAll<HTMLElement>('[data-pos]').forEach((c) => {
      const [x, y] = (mobile ? c.dataset.posMobile! : c.dataset.pos!).split(',').map(Number);
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
    });
  };
  placer(etroit.matches);

  // ——— La caméra de la Toile : translation puis échelle du calque monde. ———
  const cam = { x: 0, y: 0, zoom: 0.62 };
  const rendre = () => {
    grille.style.setProperty('--zoom', cam.zoom.toFixed(4));
    grille.style.setProperty('--cx', `${cam.x.toFixed(2)}px`);
    grille.style.setProperty('--cy', `${cam.y.toFixed(2)}px`);
    grille.style.setProperty('--gx', `${cam.x.toFixed(2)}px`);
    grille.style.setProperty('--gy', `${cam.y.toFixed(2)}px`);
    zoomVal.textContent = `${Math.round(cam.zoom * 100)}%`;
  };
  /** Écran → pixels natifs de la Toile (la fenêtre est mise à l'échelle par son théâtre). */
  const local = (cx: number, cy: number) => {
    const r = grille.getBoundingClientRect();
    const k = r.width / grille.clientWidth || 1;
    return [(cx - r.left) / k, (cy - r.top) / k, k] as const;
  };
  const zoomerVers = (z: number, px: number, py: number) => {
    gsap.killTweensOf(cam);
    const z2 = borne(z, ZMIN, ZMAX);
    const wx = (px - cam.x) / cam.zoom;
    const wy = (py - cam.y) / cam.zoom;
    Object.assign(cam, { zoom: z2, x: px - wx * z2, y: py - wy * z2 });
    rendre();
  };
  const position = (c: HTMLElement) => ({
    x: parseFloat(c.style.left) + Number(gsap.getProperty(c, 'x')),
    y: parseFloat(c.style.top) + Number(gsap.getProperty(c, 'y')),
  });
  const cadrer = (anime = !calme) => {
    const cs = cartes();
    if (!cs.length) return;
    const ps = cs.map(position);
    const x0 = Math.min(...ps.map((p) => p.x));
    const y0 = Math.min(...ps.map((p) => p.y));
    const x1 = Math.max(...ps.map((p) => p.x + CW));
    const y1 = Math.max(...ps.map((p) => p.y + CH));
    const W = grille.clientWidth;
    const H = grille.clientHeight;
    const m = etroit.matches ? 24 : 90;
    const zoom = borne(Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m) / (y1 - y0)), ZMIN, 1.15);
    const cible = { zoom, x: (W - (x1 - x0) * zoom) / 2 - x0 * zoom, y: (H - (y1 - y0) * zoom) / 2 - y0 * zoom };
    gsap.killTweensOf(cam);
    if (anime) gsap.to(cam, { ...cible, duration: 0.34, ease: 'power2.out', onUpdate: rendre });
    else {
      Object.assign(cam, cible);
      rendre();
    }
  };

  // Glisser la Toile à la souris (au doigt, la page défile) ; Ctrl + molette zoome vers le curseur.
  let glisse: { id: number; x: number; y: number } | null = null;
  const appuiToile = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    if ((e.target as Element).closest('[data-carte], button')) return;
    gsap.killTweensOf(cam);
    glisse = { id: e.pointerId, x: e.clientX, y: e.clientY };
    grille.setPointerCapture(e.pointerId);
    grille.classList.add('panne');
  };
  const bougeToile = (e: PointerEvent) => {
    if (!glisse || e.pointerId !== glisse.id) return;
    const k = local(0, 0)[2];
    cam.x += (e.clientX - glisse.x) / k;
    cam.y += (e.clientY - glisse.y) / k;
    glisse.x = e.clientX;
    glisse.y = e.clientY;
    rendre();
  };
  const lacheToile = () => {
    glisse = null;
    grille.classList.remove('panne');
  };
  const molette = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const [px, py] = local(e.clientX, e.clientY);
    zoomerVers(cam.zoom * Math.exp(-e.deltaY * 0.0024), px, py);
  };
  // Le focus d'une carte à moitié hors champ ne fait pas défiler la Toile : elle n'a pas de barre.
  const sansDefilement = () => {
    toile.scrollTop = toile.scrollLeft = 0;
  };

  // ——— Les cartes : à la main (avec inertie) et au clavier. ———
  let premier = 10;
  const drags = new Map<HTMLElement, Draggable>();
  const prendre = (c: HTMLElement) => {
    if (drags.has(c)) return;
    const [d] = Draggable.create(c, {
      type: 'x,y',
      inertia: !calme,
      zIndexBoost: false,
      onPress(this: Draggable) {
        (this.target as HTMLElement).style.zIndex = String(++premier);
      },
      onClick(this: Draggable) {
        choisirCarte(this.target as HTMLElement);
      },
    });
    drags.set(c, d!);
  };
  const choisirCarte = (c: HTMLElement) => cartes().forEach((x) => x.setAttribute('aria-pressed', String(x === c)));

  // Les flèches déplacent la carte de 16 px à l'écran, quel que soit le zoom.
  const cibles = new WeakMap<HTMLElement, { x: number; y: number }>();
  const clavierCarte = (e: KeyboardEvent) => {
    const c = (e.target as Element).closest<HTMLElement>('[data-carte]');
    if (!c || e.target !== c) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choisirCarte(c);
      return;
    }
    const pas: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
    const d = pas[e.key];
    if (!d) return;
    e.preventDefault();
    // On part de la cible précédente : deux appuis rapides font 32 px.
    const avant = cibles.get(c) ?? { x: Number(gsap.getProperty(c, 'x')), y: Number(gsap.getProperty(c, 'y')) };
    const cible = { x: avant.x + d[0] / cam.zoom, y: avant.y + d[1] / cam.zoom };
    cibles.set(c, cible);
    gsap.to(c, { ...cible, duration: calme ? 0 : 0.18, ease: 'power2.out', overwrite: true, onComplete: () => cibles.delete(c) });
  };

  // ——— Les Espaces : celui qu'on choisit garde ses pages, les autres s'estompent. ———
  let espace = 'rust';
  const appliquerEspace = () => {
    cartes().forEach((c) => c.toggleAttribute('data-attenue', c.dataset.espaceDe !== espace));
    ae.querySelectorAll<HTMLElement>('[data-espace]').forEach((b) => {
      const on = b.dataset.espace === espace;
      b.classList.toggle('actif', on);
      b.setAttribute('aria-pressed', String(on));
    });
    nomEspace.textContent = ESPACES.find((e) => e.id === espace)?.nom ?? '';
  };
  const choisirEspace = (id: string) => {
    espace = id;
    appliquerEspace();
    dire(`Espace ${nomEspace.textContent}`);
  };
  const compter = () => {
    const cs = cartes();
    ESPACES.forEach((e) => {
      const el = ae.querySelector<HTMLElement>(`[data-compte="${e.id}"]`);
      if (el) el.textContent = String(cs.filter((c) => c.dataset.espaceDe === e.id).length);
    });
    if (pages) pages.textContent = `${cs.length} pages · 2 notes`;
  };

  // ——— Les thèmes : le ciel sous la Toile, et la teinte des particules. ———
  const choisirTheme = (t: Theme, particules = true) => {
    section.dataset.theme = t.id;
    if (ciel) ciel.dataset.theme = t.id;
    root.querySelectorAll<HTMLElement>('[data-theme-choix]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoix === t.id)));
    const accent = getComputedStyle(ae).getPropertyValue(t.accent).trim();
    const glacier = getComputedStyle(ae).getPropertyValue('--ae-glacier').trim();
    document.documentElement.style.setProperty('--ae-particules-1', accent);
    document.documentElement.style.setProperty('--ae-particules-2', glacier);
    if (particules && !calme) leChef()?.liberer();
  };

  // ——— La Barre d'Intention. ———
  let ouverte = false;
  const lire = () => {
    const i = interpreter(champ.value);
    interp.hidden = !i;
    if (!i) return null;
    icone.dataset.genre = i.genre;
    interp.querySelector<HTMLElement>('[data-libelle]')!.textContent = i.libelle;
    interp.querySelector<HTMLElement>('[data-detail]')!.textContent = i.detail;
    return i;
  };
  /** La démo automatique ouvre sans prendre le focus : un focus vaudrait « la main est prise ». */
  const ouvrir = (focus = true) => {
    if (!ouverte) {
      ouverte = true;
      overlay.hidden = false;
      champ.value = '';
      lire();
    }
    if (focus) champ.focus({ preventScroll: true });
  };
  const fermer = (rendreFocus = true) => {
    if (!ouverte) return;
    ouverte = false;
    overlay.hidden = true;
    champ.value = '';
    interp.hidden = true;
    if (rendreFocus) pilule.focus({ preventScroll: true });
  };

  const venir = [...monde.querySelectorAll<HTMLElement>('[data-a-venir]')];
  let comparee = false;
  let libres = 0;

  /** Les quatre pages de « compare rust et zig » deviennent des cartes, avec ressort. */
  const comparer = async () => {
    choisirEspace('rust');
    // Le comparatif s'ouvre une fois : le redemander recadre la Toile sur ses cartes.
    if (comparee) return cadrer();
    comparee = true;
    const chef = calme ? null : leChef();
    if (chef) {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--ae-particules-2').trim();
      // Les pages partent de la Barre d'Intention, ou de la pilule si la Barre est déjà refermée.
      const de = (interp.hidden ? pilule : interp).getBoundingClientRect();
      await chef.envoler(de, grille.getBoundingClientRect(), accent);
      setTimeout(() => chef.liberer(), 900);
    }
    venir.forEach((c, i) => {
      c.dataset.carte = c.dataset.aVenir!;
      delete c.dataset.aVenir;
      c.hidden = false;
      prendre(c);
      if (!calme) gsap.from(c, { scale: 0.55, opacity: 0, y: -60, rotation: (i % 2 ? 1 : -1) * 6, duration: 1.1, delay: i * 0.09, ease: 'elastic.out(1, 0.55)', clearProps: 'scale,opacity,rotation' });
    });
    ae.querySelectorAll<SVGElement>('[data-futur]').forEach((el) => el.removeAttribute('data-futur'));
    appliquerEspace();
    compter();
    cadrer();
    dire('Quatre pages ouvertes sur la Toile, dans l’Espace Rust');
  };

  /** Une adresse ou une recherche : une carte de plus, à droite des autres. */
  const nouvelleCarte = (titre: string, domaine: string) => {
    const modele = cartes()[0];
    if (!modele) return;
    const c = modele.cloneNode(true) as HTMLElement;
    c.querySelector('.legende')?.remove();
    c.removeAttribute('data-couche');
    c.removeAttribute('data-z');
    c.removeAttribute('data-legende');
    c.removeAttribute('style');
    c.removeAttribute('aria-pressed');
    c.dataset.carte = `libre-${++libres}`;
    c.dataset.espaceDe = espace;
    const ps = cartes().map(position);
    const [x, y] = [Math.max(...ps.map((p) => p.x)) + CW + 50, Math.min(...ps.map((p) => p.y))];
    c.style.cssText = `--h: ${teinteDe(domaine)}; left: ${x}px; top: ${y}px`;
    c.dataset.pos = c.dataset.posMobile = `${x},${y}`; // sa place, quel que soit l'écran
    c.setAttribute('aria-label', `${titre} — ${domaine}`);
    c.querySelectorAll('.favicon').forEach((x) => (x.textContent = domaine.charAt(0)));
    c.querySelector('.c-dom')!.textContent = domaine;
    c.querySelector('.c-dom2')!.textContent = domaine;
    c.querySelector('.c-titre')!.textContent = titre;
    monde.append(c);
    prendre(c);
    if (!calme) gsap.from(c, { scale: 0.965, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'scale,opacity' });
    appliquerEspace();
    compter();
    cadrer();
    dire(`Nouvelle carte : ${titre}`);
  };

  const valider = async (rendreFocus = true) => {
    const i = lire();
    const q = champ.value.trim();
    if (!i) return;
    if (i.genre === 'comparer') {
      const fin = comparer();
      fermer(rendreFocus);
      return fin;
    }
    fermer(rendreFocus);
    if (i.genre === 'url') {
      const hote = i.libelle.replace('Naviguer vers ', '');
      nouvelleCarte(hote, hote);
    } else nouvelleCarte(q, 'recherche');
  };

  // ——— La démo qui se joue seule, puis rend la main. ———
  let gen = 0;
  let touche = false;
  let auto = 0;
  let demo = false;

  const lancerAuto = async () => {
    const g = ++gen;
    const etape = async (ms: number) => {
      await pause(ms);
      return g === gen && !touche;
    };
    ouvrir(false);
    for (const c of PHRASE) {
      if (!(await etape(35))) return;
      champ.value += c;
      lire();
    }
    if (!(await etape(600))) return;
    await valider(false);
    if (!(await etape(1800))) return;
    choisirTheme(THEMES[1]!);
    if (!(await etape(2600))) return;
    choisirTheme(THEMES[0]!);
  };
  const armer = () => {
    clearTimeout(auto);
    if (touche || calme) return;
    auto = window.setTimeout(() => {
      if (!touche && demo) void lancerAuto();
    }, 2500);
  };
  const reprendre = () => {
    if (touche) return;
    touche = true;
    clearTimeout(auto);
    if (gen && ouverte) fermer(false); // la Barre ouverte par la démo se referme
    gen++;
  };
  const present = () => {
    if (demo && !touche) armer();
  };

  // ——— Les écouteurs. ———
  const clic = (e: MouseEvent) => {
    const cible = e.target as Element;
    if (cible.closest('[data-pilule]')) return ouvrir();
    if (cible.closest('[data-fermer]')) return fermer();
    if (cible.closest('[data-interpretation]')) return void valider();
    const z = cible.closest<HTMLElement>('[data-zoom]')?.dataset.zoom;
    if (z === 'cadrer') return cadrer();
    if (z) return zoomerVers(z === '+' ? cam.zoom * PAS : cam.zoom / PAS, grille.clientWidth / 2, grille.clientHeight / 2);
    const es = cible.closest<HTMLElement>('[data-espace]')?.dataset.espace;
    if (es) return choisirEspace(es);
    const th = cible.closest<HTMLElement>('[data-theme-choix]')?.dataset.themeChoix;
    const t = THEMES.find((x) => x.id === th);
    if (t) {
      choisirTheme(t);
      dire(`Thème ${t.nom}`);
    }
  };
  const clavierChamp = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void valider();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
    }
  };
  const ctrlK = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return;
    // Seulement quand le focus est dans la scène : ailleurs, Ctrl K reste au navigateur.
    if (!root.contains(document.activeElement)) return;
    e.preventDefault();
    reprendre();
    ouvrir();
  };
  // Un clic dans la fenêtre y met le focus (la Toile n'est pas un champ) : Ctrl K s'adresse alors à ÆTHER.
  const engager = () =>
    setTimeout(() => {
      if (!root.contains(document.activeElement)) ae.focus({ preventScroll: true });
    });
  const tourner = () => {
    placer(etroit.matches);
    requestAnimationFrame(() => cadrer(false));
  };
  const sceneAe = ae.parentElement!;

  sceneAe.addEventListener('click', clic);
  sceneAe.addEventListener('keydown', clavierCarte);
  champ.addEventListener('keydown', clavierChamp);
  champ.addEventListener('input', lire);
  grille.addEventListener('pointerdown', appuiToile);
  grille.addEventListener('pointermove', bougeToile);
  grille.addEventListener('pointerup', lacheToile);
  grille.addEventListener('pointercancel', lacheToile);
  toile.addEventListener('wheel', molette, { passive: false });
  toile.addEventListener('scroll', sansDefilement);
  document.addEventListener('keydown', ctrlK);
  for (const t of ['pointerdown', 'keydown', 'focusin'] as const) sceneAe.addEventListener(t, reprendre);
  sceneAe.addEventListener('pointermove', present);
  sceneAe.addEventListener('pointerdown', engager);
  etroit.addEventListener('change', tourner);

  CARTES.forEach((_, i) => prendre(cartes()[i]!));
  appliquerEspace();
  compter();
  choisirTheme(THEMES[0]!, false);
  rendre();
  // La Toile se cadre une fois sa taille connue (la fenêtre peut naître cachée).
  const ro = new ResizeObserver(() => {
    if (!grille.clientWidth) return;
    ro.disconnect();
    cadrer(false);
  });
  ro.observe(grille);

  return {
    progress(t) {
      f.phase(t);
      scene.dataset.demo = f.enDemo ? 'on' : 'off';
      if (f.enDemo !== demo) {
        demo = f.enDemo;
        if (demo) armer();
        else {
          // Hors de la démo, la démo automatique s'arrête là (elle reprendra au retour).
          clearTimeout(auto);
          gen++;
          if (!touche) fermer(false);
        }
      }
    },
    destroy() {
      gen++;
      clearTimeout(auto);
      ro.disconnect();
      gsap.killTweensOf(cam);
      sceneAe.removeEventListener('click', clic);
      sceneAe.removeEventListener('keydown', clavierCarte);
      champ.removeEventListener('keydown', clavierChamp);
      champ.removeEventListener('input', lire);
      grille.removeEventListener('pointerdown', appuiToile);
      grille.removeEventListener('pointermove', bougeToile);
      grille.removeEventListener('pointerup', lacheToile);
      grille.removeEventListener('pointercancel', lacheToile);
      toile.removeEventListener('wheel', molette);
      toile.removeEventListener('scroll', sansDefilement);
      document.removeEventListener('keydown', ctrlK);
      for (const t of ['pointerdown', 'keydown', 'focusin'] as const) sceneAe.removeEventListener(t, reprendre);
      sceneAe.removeEventListener('pointermove', present);
      sceneAe.removeEventListener('pointerdown', engager);
      etroit.removeEventListener('change', tourner);
      drags.forEach((d) => d.kill());
      drags.clear();
      document.documentElement.style.removeProperty('--ae-particules-1');
      document.documentElement.style.removeProperty('--ae-particules-2');
      f.detruire();
    },
  };
}
