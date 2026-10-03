import { startScroll, refreshWhenFontsReady } from './motion';
import { bootScenes } from './motion/scene';
import { bootTitres } from './titres';
import { bootParticules } from './particules';

startScroll();
void bootParticules();
bootTitres();
bootScenes();
refreshWhenFontsReady();

// Études de cas : figures animées et schémas, chargés seulement s'il y en a.
if (document.querySelector('[data-figure], [data-schema]')) {
  void import('../scenes/figures').then((m) => m.bootFigures());
}
