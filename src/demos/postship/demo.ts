import { fenetre3d } from '../../lib/fenetre3d';
import type { SceneHandle, SceneOpts } from '../../lib/motion/scene';

/** La démo gère elle-même son échelle : pas de remontage au redimensionnement. */
export const garderAuResize = true;

export function mount(root: HTMLElement, opts: SceneOpts): SceneHandle {
  const scene = root.querySelector<HTMLElement>('.scene')!;
  const f = fenetre3d(root, { calme: opts.calm, mobile: opts.mobile, chef: null });
  return {
    progress(t) {
      f.phase(t);
      scene.dataset.demo = f.enDemo ? 'on' : 'off';
    },
    destroy() {
      f.detruire();
    },
  };
}
