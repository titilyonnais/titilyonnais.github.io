import { fenetre3d } from '../../lib/fenetre3d';
import { leChef } from '../../lib/particules/chef';
import type { SceneHandle, SceneOpts } from '../../lib/motion/scene';
import { ELEMENTS, SECRET, indexer, normaliser } from './donnees';

/** La démo gère elle-même son échelle : pas de remontage au redimensionnement. */
export const garderAuResize = true;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * La fenêtre de collage rapide, jouable : recherche en direct (contenu et
 * texte reconnu), sélection au clavier et à la souris, secret révélé, et
 * collage dans le Bloc-notes, porté par les particules.
 */
export function mount(root: HTMLElement, opts: SceneOpts): SceneHandle {
  const scene = root.querySelector<HTMLElement>('.scene')!;
  const fen = root.querySelector<HTMLElement>('[data-fenetre]')!;
  const cl = root.querySelector<HTMLElement>('.cl')!;
  const champ = cl.querySelector<HTMLInputElement>('[data-recherche]')!;
  const lignes = [...cl.querySelectorAll<HTMLElement>('[data-item]')];
  const vide = cl.querySelector<HTMLElement>('[data-vide]')!;
  const notes = root.querySelector<HTMLElement>('[data-blocnotes]')!;
  const fenNotes = root.querySelector<HTMLElement>('[data-blocnotes-fenetre]')!;
  const annonce = root.querySelector<HTMLElement>('[data-annonce]')!;
  const invite = root.querySelector<HTMLElement>('[data-invite]');
  const touches = root.querySelector<HTMLElement>('.cl-touches');
  const calme = opts.calm;
  const f = fenetre3d(root, { calme, mobile: opts.mobile, chef: null });
  const par = new Map(ELEMENTS.map((e) => [e.id, e]));
  const index = new Map(ELEMENTS.map((e) => [e.id, indexer(e)]));
  const textes = new Map<HTMLElement, string>();
  cl.querySelectorAll<HTMLElement>('[data-titre], [data-surligne]').forEach((el) => textes.set(el, el.textContent ?? ''));

  let actif = lignes[0]!.dataset.item!;
  let gen = 0;
  let touche = false;
  let auto = 0;
  let demo = false;
  let collage = 0;
  let revele = false;
  let revelation = 0;
  let envol = false; // des particules volent vers le Bloc-notes : il faudra rendre la toile

  const dire = (t: string) => (annonce.textContent = t);
  if (invite) invite.textContent = 'Tapez, ou essayez une suggestion';
  const visibles = () => lignes.filter((l) => !l.hidden);

  /** Surligne `q` dans un texte, sans HTML injecté : les morceaux sont des nœuds. */
  const surligner = (el: HTMLElement, q: string) => {
    const brut = textes.get(el) ?? '';
    if (!q) return void (el.textContent = brut);
    const i = normaliser(brut).indexOf(q);
    if (i < 0) return void (el.textContent = brut);
    const m = document.createElement('mark');
    m.textContent = brut.slice(i, i + q.length);
    el.replaceChildren(brut.slice(0, i), m, brut.slice(i + q.length));
  };

  const numeroter = () => visibles().forEach((l, i) => (l.querySelector<HTMLElement>('[data-num]')!.textContent = i < 9 ? String(i + 1) : ''));

  // Fait défiler la liste seule (scrollIntoView ferait aussi défiler la page).
  const liste = cl.querySelector<HTMLElement>('[data-liste]')!;
  const garderVisible = (l: HTMLElement) => {
    const haut = l.offsetTop - liste.offsetTop;
    if (haut < liste.scrollTop) liste.scrollTop = haut;
    else if (haut + l.offsetHeight > liste.scrollTop + liste.clientHeight) liste.scrollTop = haut + l.offsetHeight - liste.clientHeight;
  };

  const choisir = (id: string, focus = false) => {
    actif = id;
    lignes.forEach((l) => {
      const on = l.dataset.item === id;
      l.setAttribute('aria-selected', String(on));
      l.tabIndex = on ? 0 : -1;
      if (on && focus) l.focus({ preventScroll: true });
      if (on) garderVisible(l);
    });
    cl.querySelectorAll<HTMLElement>('[data-vue-de]').forEach((v) => (v.hidden = v.dataset.vueDe !== id));
    if (id !== 'secret') cacherSecret();
  };

  const filtrer = (brut: string) => {
    const q = normaliser(brut.trim());
    if (q) cl.dataset.q = q;
    else delete cl.dataset.q;
    let rang = 0;
    lignes.forEach((l) => {
      const ok = !q || index.get(l.dataset.item!)!.includes(q);
      l.hidden = !ok;
      l.classList.remove('monte');
      if (ok && !calme) {
        void l.offsetWidth;
        l.style.setProperty('--rang', String(rang++));
        l.classList.add('monte');
      }
    });
    cl.querySelectorAll<HTMLElement>('[data-titre], [data-surligne]').forEach((el) => surligner(el, q));
    const v = visibles();
    vide.hidden = v.length > 0;
    numeroter();
    if (v.length && !v.some((l) => l.dataset.item === actif)) choisir(v[0]!.dataset.item!);
    if (q) dire(v.length === 0 ? 'Aucun résultat' : `${v.length} élément${v.length > 1 ? 's' : ''}`);
  };

  const cacherSecret = () => {
    revele = false;
    clearInterval(revelation);
    const pre = cl.querySelector<HTMLElement>('[data-revele]')!;
    pre.hidden = true;
    pre.textContent = '';
    cl.querySelector<HTMLElement>('[data-masque]')!.hidden = false;
  };
  const afficherSecret = () => {
    if (revele) return;
    revele = true;
    const pre = cl.querySelector<HTMLElement>('[data-revele]')!;
    cl.querySelector<HTMLElement>('[data-masque]')!.hidden = true;
    pre.hidden = false;
    if (calme) return void (pre.textContent = SECRET);
    let n = 0;
    revelation = window.setInterval(() => {
      pre.textContent = SECRET.slice(0, ++n);
      if (n >= SECRET.length) clearInterval(revelation);
    }, 20);
  };

  const ecrire = async (texte: string, c: number) => {
    const avant = notes.textContent ?? '';
    const debut = avant ? avant + '\n' : '';
    if (calme) return void (notes.textContent = debut + texte);
    for (let i = 1; i <= texte.length; i++) {
      // Collage annulé en cours de frappe : pas de ligne à moitié tapée.
      if (c !== collage) return void (notes.textContent = avant);
      notes.textContent = debut + texte.slice(0, i);
      await pause(8);
    }
  };
  const rendreToile = () => {
    if (!envol) return;
    envol = false;
    leChef()?.liberer();
  };

  /**
   * Colle un élément : les particules vont de sa ligne au Bloc-notes, puis le texte s'y tape.
   * Un nouveau collage remplace celui en cours : chacun a son numéro (`collage`).
   */
  const coller = async (id: string) => {
    const ligne = lignes.find((l) => l.dataset.item === id);
    const e = par.get(id);
    if (!ligne || !e) return;
    const c = ++collage;
    const chef = leChef();
    if (chef && !calme) {
      const blanc = getComputedStyle(cl).getPropertyValue('--cl-foreground').trim();
      envol = true;
      await chef.envoler(ligne.getBoundingClientRect(), fenNotes.getBoundingClientRect(), blanc);
      setTimeout(() => c === collage && rendreToile(), 1000);
    }
    if (c !== collage) return;
    await ecrire(e.contenu, c);
    if (c !== collage) return;
    dire(`Collé dans Bloc-notes : ${e.type === 'secret' ? 'contenu sensible' : e.titre}`);
    if (invite) invite.textContent = 'Entrée colle, Ctrl+1…9 aussi';
  };

  // Les suggestions se tapent lettre par lettre.
  const taper = async (mot: string, g: number) => {
    champ.value = '';
    filtrer('');
    for (const c of mot) {
      if (g !== gen) return;
      champ.value += c;
      filtrer(champ.value);
      if (!calme) await pause(40);
    }
  };

  const deplacer = (pas: number) => {
    const v = visibles();
    if (!v.length) return;
    const i = Math.max(0, v.findIndex((l) => l.dataset.item === actif));
    choisir(v[Math.min(v.length - 1, Math.max(0, i + pas))]!.dataset.item!, document.activeElement !== champ);
  };

  const clavier = (e: KeyboardEvent) => {
    if (!fen.contains(document.activeElement)) return;
    // La touche physique, comme Clipper (PopupApp.tsx) : en AZERTY, Ctrl+1 donne « & ».
    const chiffre = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
    const n = e.ctrlKey && !e.shiftKey && !e.altKey && chiffre ? Number(chiffre) : NaN;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      deplacer(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement && !e.target.dataset.item)) {
      e.preventDefault();
      void coller(actif);
    } else if (n >= 1 && n <= 9) {
      const l = visibles()[n - 1];
      if (!l) return;
      e.preventDefault();
      choisir(l.dataset.item!);
      void coller(l.dataset.item!);
    } else if (e.key === 'Escape' && champ.value) {
      e.preventDefault();
      champ.value = '';
      filtrer('');
      champ.focus();
    }
  };

  // Une ligne se choisit à l'appui, comme dans Clipper (ClipRow : onMouseDown) ; le double-clic colle.
  const appui = (e: PointerEvent) => {
    const ligne = e.button === 0 && (e.target as Element).closest<HTMLElement>('[data-item]');
    if (ligne) choisir(ligne.dataset.item!, true);
  };
  const clic = (e: MouseEvent) => {
    const cible = e.target as Element;
    const action = cible.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'afficher') afficherSecret();
    else if (action === 'effacer') {
      champ.value = '';
      filtrer('');
      champ.focus();
    }
    const s = cible.closest<HTMLElement>('[data-suggestion]')?.dataset.suggestion;
    if (s) {
      gen++;
      champ.focus({ preventScroll: true });
      void taper(s, gen);
    }
  };
  const double = (e: MouseEvent) => {
    const ligne = (e.target as Element).closest<HTMLElement>('[data-item]');
    if (ligne) void coller(ligne.dataset.item!);
  };
  const saisie = () => {
    gen++;
    filtrer(champ.value);
  };

  // Démo automatique : « facture », la capture et son texte reconnu, puis le code collé.
  const lancerAuto = async () => {
    const g = ++gen;
    const etape = async (ms: number) => {
      await pause(ms);
      return g === gen && !touche;
    };
    await taper('facture', g);
    if (!(await etape(500))) return;
    choisir('capture');
    if (!(await etape(1000))) return;
    champ.value = '';
    filtrer('');
    if (!(await etape(400))) return;
    choisir('code');
    if (!(await etape(600))) return;
    await coller('code');
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
    gen++;
    collage++; // le collage automatique en cours s'arrête là
    rendreToile();
  };
  const present = () => {
    if (demo && !touche) armer();
  };

  cl.addEventListener('keydown', clavier);
  cl.addEventListener('pointerdown', appui);
  cl.addEventListener('click', clic);
  cl.addEventListener('dblclick', double);
  champ.addEventListener('input', saisie);
  for (const t of ['pointerdown', 'keydown', 'focusin'] as const) cl.addEventListener(t, reprendre);
  cl.addEventListener('pointermove', present);

  filtrer('');
  choisir(actif);
  return {
    progress(t) {
      f.phase(t);
      scene.dataset.demo = f.enDemo ? 'on' : 'off';
      if (touches) touches.dataset.touches = calme || t >= 0.12 ? 'off' : t >= 0.08 ? 'presse' : t > 0.01 ? 'on' : 'off';
      if (f.enDemo !== demo) {
        demo = f.enDemo;
        if (demo) armer();
        else clearTimeout(auto);
      }
    },
    destroy() {
      gen++;
      collage++;
      clearTimeout(auto);
      clearInterval(revelation);
      cl.removeEventListener('keydown', clavier);
      cl.removeEventListener('pointerdown', appui);
      cl.removeEventListener('click', clic);
      cl.removeEventListener('dblclick', double);
      champ.removeEventListener('input', saisie);
      for (const t of ['pointerdown', 'keydown', 'focusin'] as const) cl.removeEventListener(t, reprendre);
      cl.removeEventListener('pointermove', present);
      f.detruire();
    },
  };
}
