import type { SceneModule } from '../lib/motion/scene';
import { $, $$, etat, hasard, seg, taper, temps } from './outils';

/*
 * Clipper, en trois temps :
 *  0.00 Copier    — cinq éléments arrivent en haut de l'historique.
 *  0.38 Chercher  — « facture » se tape, la liste se filtre lettre par lettre.
 *  0.70 Protéger  — une clé d'API arrive, se brouille, puis se masque.
 */
const BORNES = [0, 0.38, 0.7];
const BROUILLE = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*';

export const mount: SceneModule['mount'] = (root) => {
  const cl = $(root, '.cl');
  const q = $(cl, '.q');
  const els = $$(cl, '.el');
  const compte = $(cl, '.compte');
  const cle = $(cl, '.cle');
  const secret = $(cl, '.el.secret');
  const requete = q.dataset.texte ?? '';
  const brut = cle.dataset.cle ?? '';

  const lettres = els.map((el) => $$(el, '.c'));

  const rendre = (t: number) => {
    temps(root, BORNES, t);

    // 1. Copier : chaque élément arrive à son heure (le secret, plus tard).
    const arrivees = els.map((el) => {
      const k = Number(el.dataset.arrivee);
      const a = k < 5 ? 0.04 + k * 0.065 : 0.74;
      return t >= a;
    });

    // 2. Chercher : on tape, puis on efface pour la suite.
    const p = seg(t, 0.42, 0.56) - seg(t, 0.62, 0.68);
    taper(q, requete, p);
    const n = q.textContent?.length ?? 0;
    const prefixe = requete.slice(0, n);
    etat(cl, 'sans-requete', n === 0);

    let visibles = 0;
    let premier: HTMLElement | null = null;
    els.forEach((el, i) => {
      const filtre = n > 0 && !(el.dataset.cherche ?? '').includes(prefixe);
      etat(el, 'la', arrivees[i]!);
      etat(el, 'filtre', filtre);
      lettres[i]!.forEach((c) => etat(c, 'hit', Number(c.dataset.k) < n));
      if (arrivees[i] && !filtre) {
        visibles++;
        premier ??= el;
      }
    });
    // Comme dans l'application : le premier élément visible est sélectionné.
    els.forEach((el) => etat(el, 'sel', el === premier));
    const c = visibles === 0 ? 'historique vide' : `${visibles} élément${visibles > 1 ? 's' : ''}`;
    if (compte.textContent !== c) compte.textContent = c;

    // 3. Protéger : la clé apparaît en clair, chaque caractère se brouille puis se masque.
    const m = seg(t, 0.8, 0.92);
    let s = '';
    for (let i = 0; i < brut.length; i++) {
      const a = (i / brut.length) * 0.7;
      if (m <= a) s += brut[i];
      else if (m < a + 0.3) s += BROUILLE[Math.floor(hasard(i * 31 + Math.floor(m * 40)) * BROUILLE.length)];
      else s += '•';
    }
    if (cle.textContent !== s) cle.textContent = s;
    etat(secret, 'masque', m >= 1);
    const tag = secret.querySelector<HTMLElement>('.tag')!;
    const tt = m >= 1 ? 'secret' : 'texte';
    if (tag.textContent !== tt) tag.textContent = tt;
    const meta = secret.querySelector<HTMLElement>('.meta')!;
    const mt = m >= 1 ? 'exclu de la recherche' : 'Terminal · 10:03';
    if (meta.textContent !== mt) meta.textContent = mt;
  };

  return { progress: rendre, destroy() {} };
};
