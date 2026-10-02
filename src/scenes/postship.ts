import type { SceneModule } from '../lib/motion/scene';
import { token } from '../lib/dither/couleurs';
import { $, $$, etat, hasard, seg, taper, temps, easeInOut } from './outils';

/*
 * PostShip, en quatre temps (t de 0 à 1) :
 *  0.00 Mise en ligne  — git push tapé, le pipeline se trace, la page se monte.
 *  0.12 Vérification   — la page est parcourue comme par un visiteur, six vérifications passent.
 *  0.50 L'angle mort   — le moniteur classique dit 200 OK ; le bouton de paiement se désagrège.
 *  0.70 Le verdict     — 71/100, puis retour au dernier déploiement vérifié bon : 100.
 */
const BORNES = [0, 0.12, 0.5, 0.7];

const MSG_PANNE = 'La page répond, mais le bouton de paiement a disparu.';
const MSG_RETOUR = 'Bouton de paiement disparu : 71. Retour au déploiement vérifié bon : 100. Alerte envoyée.';

export const mount: SceneModule['mount'] = (root) => {
  const ps = $(root, '.ps');
  const cmd = $(ps, '.cmd');
  const cmd2 = $(ps, '.cmd2');
  const curseur = $(ps, '.curseur');
  const etapes = $$(ps, '.etape');
  const blocs = $$(ps, '.b');
  const scan = $(ps, '.scan');
  const page = $(ps, '.page');
  const verifs = $$(ps, '.verif');
  const score = $(ps, '.score');
  const msg = $(ps, '.msg');
  const main = $(ps, '.main');
  const canvas = $<HTMLCanvasElement>(ps, '.bruit');
  const ctx = canvas.getContext('2d')!;

  // Bruit 1-bit : chaque cellule a son seuil fixe ; la densité décide qui s'allume.
  const CELL = 4;
  let cols = 0;
  let rows = 0;
  let seuils: Float32Array = new Float32Array(0);
  const dimensionner = () => {
    const r = canvas.getBoundingClientRect();
    cols = Math.max(1, Math.ceil(r.width / CELL));
    rows = Math.max(1, Math.ceil(r.height / CELL));
    canvas.width = cols;
    canvas.height = rows;
    seuils = new Float32Array(cols * rows);
    for (let i = 0; i < seuils.length; i++) {
      // Le bruit attaque par le centre du bouton, puis s'étend.
      const x = (i % cols) / cols - 0.5;
      const y = Math.floor(i / cols) / rows - 0.5;
      seuils[i] = hasard(i * 1.37) * 0.75 + Math.hypot(x, y * 0.6) * 0.5;
    }
    densiteDessinee = -1;
  };
  let densiteDessinee = -1;
  const bruit = (d: number) => {
    const q = Math.round(d * 48) / 48;
    if (q === densiteDessinee) return;
    densiteDessinee = q;
    ctx.clearRect(0, 0, cols, rows);
    if (q <= 0) return;
    ctx.fillStyle = token('--ink');
    for (let i = 0; i < seuils.length; i++) {
      if (seuils[i]! < q * 1.26) ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1);
    }
  };
  dimensionner();

  let derniereT = 0;
  const rendre = (t: number) => {
    derniereT = t;
    temps(root, BORNES, t);

    // 1. Mise en ligne
    taper(cmd, cmd.dataset.texte ?? '', seg(t, 0.01, 0.08));
    etat(curseur, 'cache', t > 0.7);
    const pas = [0.08, 0.11, 0.14, 0.17];
    etapes.forEach((e, i) => {
      const a = pas[i]!;
      if (i > 0) e.style.setProperty('--s', String(seg(t, a - 0.03, a)));
      etat(e, 'vu', t >= a);
    });
    const actif = t < 0.08 ? 0 : t < 0.11 ? 1 : t < 0.14 ? 1 : t < 0.17 ? 2 : 3;
    etapes.forEach((e, i) => etat(e, 'actif', i === actif && t > 0.02));
    blocs.forEach((b, i) => b.style.setProperty('--r', String(easeInOut(seg(t, 0.12 + i * 0.012, 0.17 + i * 0.012)))));

    // 2. Vérification : la ligne descend la page, les vérifications passent une à une.
    const s = seg(t, 0.24, 0.46);
    etat(ps, 'scanne', s > 0 && s < 1);
    scan.style.setProperty('--y', `${(s * (page.clientHeight - 2)).toFixed(1)}px`);
    const panne = t >= 0.62 && t < 0.86;
    verifs.forEach((v, i) => {
      const st = v.querySelector<HTMLElement>('.st')!;
      const dernier = i === verifs.length - 1;
      let txt = '…';
      if (!dernier && t >= 0.26 + i * 0.033) txt = 'ok';
      if (dernier) txt = t >= 0.86 ? 'rétabli' : panne ? 'échec' : '…';
      if (st.textContent !== txt) st.textContent = txt;
      etat(v, 'echec', dernier && panne);
    });

    // 3. L'angle mort : le moniteur classique entre, le paiement se désagrège.
    main.style.setProperty('--cl', String(easeInOut(seg(t, 0.5, 0.56))));
    const d = seg(t, 0.55, 0.62) - seg(t, 0.78, 0.86);
    bruit(Math.max(0, d));
    etat(ps, 'panne', panne && d >= 0.999);

    // 4. Le verdict
    const sc = t < 0.62 ? '' : t < 0.88 ? '71' : '100';
    if (score.textContent !== sc) score.textContent = sc;
    const m = t < 0.62 ? '' : t < 0.88 ? MSG_PANNE : MSG_RETOUR;
    if (msg.textContent !== m) msg.textContent = m;
    etat(ps, 'rollback', t >= 0.7);
    taper(cmd2, cmd2.dataset.texte ?? '', seg(t, 0.71, 0.79));
  };

  const ro = new ResizeObserver(() => {
    dimensionner();
    rendre(derniereT);
  });
  ro.observe(canvas);

  return {
    progress: rendre,
    destroy() {
      ro.disconnect();
    },
  };
};
