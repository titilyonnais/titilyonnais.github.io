import { gsap } from '../../lib/motion';
import { fenetre3d } from '../../lib/fenetre3d';
import type { SceneHandle, SceneOpts } from '../../lib/motion/scene';
import { ALERTE, CHECKS, KO, RAIL, ton } from './donnees';

/** La démo gère elle-même son échelle : pas de remontage au redimensionnement. */
export const garderAuResize = true;

type Etat = 'repos' | 'pousse' | 'verifie' | 'panne' | 'alerte' | 'retour' | 'retabli';

const INVITES: Record<Etat, string> = {
  repos: 'Cliquez sur « git push »',
  pousse: 'Déploiement reçu',
  verifie: 'PostShip ouvre les pages comme un visiteur',
  panne: 'Le paiement ne passe plus',
  alerte: 'Remettez en ligne le précédent',
  retour: 'Retour arrière en cours',
  retabli: 'Rejouer, ou continuez à défiler',
};

/**
 * repos → pousse → verifie → panne → alerte → retour → retabli.
 * Chaque étape est un setTimeout ; « rejouer » et le démontage les annulent.
 * Sans interaction pendant 2,5 s en phase démo, le scénario se joue seul.
 */
export function mount(root: HTMLElement, opts: SceneOpts): SceneHandle {
  const scene = root.querySelector<HTMLElement>('.scene')!;
  const ps = root.querySelector<HTMLElement>('[data-etat-demo]')!;
  const invite = root.querySelector<HTMLElement>('[data-invite]');
  const annonce = ps.querySelector<HTMLElement>('[data-annonce]')!;
  const score = ps.querySelector<HTMLElement>('[data-score]')!;
  const raison = ps.querySelector<HTMLElement>('[data-raison]')!;
  const paiement = ps.querySelector<HTMLElement>('[data-categorie="Pages de paiement"]');
  const statut = ps.querySelector<HTMLElement>('[data-statut]')!;
  const incidents = ps.querySelector<HTMLElement>('[data-incidents]')!;
  const frise = ps.querySelector<HTMLElement>('[data-frise]')!;
  const bilan = ps.querySelector<HTMLElement>('[data-bilan]')!;
  const filet = ps.querySelector<HTMLElement>('[data-filet]')!;
  const fin = ps.querySelector<HTMLElement>('[data-fin]')!;
  const progression = ps.querySelector<HTMLElement>('[data-progression]')!;
  const checks = [...ps.querySelectorAll<HTMLElement>('[data-check]')];
  const video = ps.querySelector<HTMLVideoElement>('video');
  const calme = opts.calm;
  const f = fenetre3d(root, { calme, mobile: opts.mobile, chef: null });

  let etat: Etat = 'repos';
  let minuteurs: number[] = [];
  let auto = 0;
  let touche = false;
  let enAuto = false;
  let demo = false;
  const nombre = { v: 100 };

  const apres = (ms: number, fn: () => void) => {
    if (calme) fn();
    else minuteurs.push(window.setTimeout(fn, ms));
  };
  const annuler = () => {
    minuteurs.forEach(clearTimeout);
    minuteurs = [];
  };
  const dire = (texte: string) => (annonce.textContent = texte);
  const passer = (e: Etat) => {
    etat = e;
    ps.dataset.etatDemo = e;
    if (invite) invite.textContent = INVITES[e];
  };

  const poserScore = (v: number, anime: boolean) => {
    gsap.killTweensOf(nombre);
    const ecrire = () => {
      score.textContent = String(Math.round(nombre.v));
      score.dataset.ton = ton(Math.round(nombre.v));
    };
    if (!anime || calme) {
      nombre.v = v;
      ecrire();
      return;
    }
    gsap.to(nombre, { v, duration: 0.6, ease: 'power2.out', onUpdate: ecrire });
  };

  const verdict = (li: HTMLElement, e: string, texte: string) => {
    li.dataset.e = e;
    li.querySelector('[data-verdict]')!.textContent = texte;
  };

  const sante = (ok: boolean) => {
    ps.dataset.sante = ok ? 'ok' : 'ko';
    statut.textContent = ok ? 'Tout va bien' : 'Le paiement ne passe plus';
    incidents.textContent = ok ? '0' : '1';
    frise.textContent = ok ? 'tout est passé' : '1 échec, maintenant';
  };

  const remettre = () => {
    annuler();
    gsap.killTweensOf(nombre);
    checks.forEach((li) => {
      verdict(li, 'attente', 'à venir');
      li.classList.remove('flash');
    });
    bilan.textContent = 'En attente d’un déploiement';
    bilan.className = 'bilan';
    filet.style.width = '0%';
    progression.style.transition = 'none';
    progression.style.width = '0%';
    fin.textContent = `Remise en ligne de ${RAIL[1]}…`;
    paiement?.classList.remove('retire');
    paiement?.querySelector('.bareme')?.replaceChildren('sur 40');
    raison.textContent = 'Rien retiré : tout ce qui est vérifié est passé.';
    sante(true);
    poserScore(100, false);
    passer('repos');
  };

  // Lancée au clavier, la démo garde le focus : le bouton pressé disparaît, le suivant le reçoit.
  let auClavier = false;
  const focaliser = (action: string) => {
    if (!auClavier) return;
    // Le panneau apparaît par une transition de visibilité (0,32 s) : on attend qu'il soit là,
    // et on ne reprend pas le focus si le visiteur est allé ailleurs entre-temps.
    apres(calme ? 0 : 340, () => {
      const ici = document.activeElement;
      if (ici && ici !== document.body && !ps.contains(ici)) return;
      ps.querySelector<HTMLElement>(`[data-action="${action}"]`)?.focus({ preventScroll: true });
    });
  };
  const pousser = () => {
    if (etat !== 'repos') return;
    auClavier = !enAuto && ps.contains(document.activeElement) && document.activeElement !== document.body;
    passer('pousse');
    bilan.textContent = 'Déploiement reçu · Vercel';
    dire('Déploiement a1b2c3d reçu : feat: nouveau checkout.');
    apres(400, () => {
      passer('verifie');
      CHECKS.forEach((c, i) => {
        apres(i * 300, () => {
          verdict(checks[i]!, 'cours', '…');
          bilan.textContent = `Vérification ${i + 1} sur 6`;
          filet.style.width = `${((i + 0.5) / 6) * 100}%`;
        });
        apres(i * 300 + 240, () => {
          const ko = i === KO;
          verdict(checks[i]!, ko ? 'ko' : 'ok', ko ? c.ko! : c.ok);
          filet.style.width = `${((i + 1) / 6) * 100}%`;
          if (ko) panne(i);
        });
      });
      apres(6 * 300, () => {
        bilan.textContent = '5 sur 6 passent';
        bilan.className = 'bilan ko';
      });
      apres(6 * 300 + 500, alerte);
    });
  };

  const panne = (i: number) => {
    passer('panne');
    const li = checks[i]!;
    li.classList.add('flash');
    apres(600, () => li.classList.remove('flash'));
    paiement?.classList.add('retire');
    paiement?.querySelector('.bareme')?.replaceChildren('−40');
    raison.textContent = 'Ce qui a coûté : Pages de paiement.';
    poserScore(60, true);
    sante(false);
    dire('Le paiement ne passe plus : 500 après « Payer ». Ship Score 60 sur 100.');
  };

  const alerte = () => {
    passer('alerte');
    focaliser('retour');
    dire(ALERTE);
    if (enAuto) apres(1800, () => enAuto && retour());
  };

  const retour = () => {
    if (etat !== 'alerte') return;
    passer('retour');
    dire(`Remise en ligne de ${RAIL[1]}, le dernier déploiement vérifié bon.`);
    progression.style.transition = calme ? 'none' : 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
    void progression.offsetWidth;
    progression.style.width = '100%';
    apres(1200, () => {
      passer('retabli');
      fin.textContent = 'Rétabli en 3,8 s';
      // Le score est celui de la production, revenue à 4b1d7a0 : rien n'y est retiré.
      paiement?.classList.remove('retire');
      paiement?.querySelector('.bareme')?.replaceChildren('sur 40');
      raison.textContent = 'Rien retiré : tout ce qui est vérifié est passé.';
      sante(true);
      poserScore(100, true);
      dire('Rétabli en 3,8 s. Ship Score 100 sur 100.');
      focaliser('rejouer');
      enAuto = false;
    });
  };

  // Démo automatique : 2,5 s sans interaction en phase démo.
  const armer = () => {
    clearTimeout(auto);
    if (touche || etat !== 'repos' || calme) return;
    auto = window.setTimeout(() => {
      if (touche || !f.enDemo) return;
      enAuto = true;
      pousser();
    }, 2500);
  };
  const reprendre = () => {
    touche = true;
    enAuto = false;
    clearTimeout(auto);
  };
  // Survoler la fenêtre, c'est être là : le compte à rebours repart de zéro.
  const present = () => {
    if (demo && etat === 'repos' && !touche) armer();
  };
  ps.addEventListener('pointerdown', reprendre);
  ps.addEventListener('keydown', reprendre);
  ps.addEventListener('pointermove', present);

  const clic = (e: MouseEvent) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (a === 'pousser') pousser();
    else if (a === 'retour') retour();
    else if (a === 'rejouer') {
      remettre();
      ps.querySelector<HTMLElement>('[data-action="pousser"]')?.focus();
    }
  };
  ps.addEventListener('click', clic);

  // La vidéo : chargée dès le montage (la piste est à moins d'un écran), lue en vue éclatée.
  if (video && !calme) video.preload = 'auto';
  let lit = false;
  const lire = (on: boolean) => {
    if (!video || calme || on === lit) return;
    lit = on;
    if (on) void video.play().catch(() => {});
    else video.pause();
  };

  remettre();
  return {
    progress(t) {
      f.phase(t);
      scene.dataset.demo = f.enDemo ? 'on' : 'off';
      lire(t > 0.15 && t < 0.45);
      if (f.enDemo !== demo) {
        demo = f.enDemo;
        if (demo) armer();
        else clearTimeout(auto);
      }
    },
    destroy() {
      annuler();
      clearTimeout(auto);
      gsap.killTweensOf(nombre);
      ps.removeEventListener('pointerdown', reprendre);
      ps.removeEventListener('keydown', reprendre);
      ps.removeEventListener('pointermove', present);
      ps.removeEventListener('click', clic);
      lire(false);
      f.detruire();
    },
  };
}
