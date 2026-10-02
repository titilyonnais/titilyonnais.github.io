import type { SceneModule } from '../lib/motion/scene';

export const mount: SceneModule['mount'] = () => ({ progress() {}, destroy() {} });
