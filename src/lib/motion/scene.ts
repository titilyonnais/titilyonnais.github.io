import { ScrollTrigger, calm, mobile } from './index';

export type SceneHandle = {
  /** t ∈ [0, 1] : la scène doit pouvoir être rendue à n'importe quel t, dans les deux sens. */
  progress(t: number): void;
  destroy(): void;
  /** Appelé à true quand la scène est finie (fin du défilement) : la place aux interactions. */
  interactive?(on: boolean): void;
};

export type SceneOpts = { mobile: boolean; calm: boolean };
export type SceneModule = {
  mount(root: HTMLElement, opts: SceneOpts): SceneHandle;
  /** Vrai : la scène suit elle-même les changements de taille (une démo garde son état). */
  garderAuResize?: boolean;
};

const loaders: Record<string, () => Promise<SceneModule>> = {
  methode: () => import('../../scenes/methode'),
  postship: () => import('../../demos/postship/demo'),
  clipper: () => import('../../scenes/clipper'),
  aether: () => import('../../scenes/aether'),
  contact: () => import('../../scenes/contact'),
};

/**
 * Une scène = un élément [data-scene="nom"]. Sa progression va de 0 (le haut de
 * la zone de défilement touche le haut de l'écran) à 1 (le bas touche le bas).
 * La zone est `position: sticky` en CSS : rien ne bouge dans la mise en page
 * quand le module arrive, donc on peut le charger à la dernière minute.
 */
function register(root: HTMLElement): void {
  const name = root.dataset.scene ?? '';
  const load = loaders[name];
  if (!load) return;

  let handle: SceneHandle | null = null;
  let mod: SceneModule | null = null;
  let trigger: ScrollTrigger | null = null;
  let width = innerWidth;
  let wasFinal = false;

  const track = (root.querySelector<HTMLElement>('[data-track]') ?? root);

  const apply = (t: number) => {
    if (!handle) return;
    handle.progress(t);
    const final = t >= 0.999;
    root.dataset.state = final ? 'final' : t <= 0 ? 'idle' : 'running';
    if (final !== wasFinal) {
      wasFinal = final;
      handle.interactive?.(final);
    }
  };

  const mount = async () => {
    mod = await load();
    handle = mod.mount(root, { mobile: mobile(), calm: calm() });
    if (calm()) {
      wasFinal = false;
      apply(1);
      return;
    }
    trigger ??= ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(trigger.progress);
  };

  // Charge le module quand la scène est à moins d'un écran.
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        void mount();
      }
    },
    { rootMargin: '100% 0px 100% 0px' },
  );
  io.observe(root);

  // Une nouvelle largeur change toutes les positions : on remonte la scène.
  let timer = 0;
  addEventListener('resize', () => {
    if (innerWidth === width) return;
    width = innerWidth;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!handle || mod?.garderAuResize) return;
      handle.destroy();
      handle = null;
      wasFinal = false;
      void mount();
    }, 200);
  });
}

export function bootScenes(): void {
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach(register);
}
