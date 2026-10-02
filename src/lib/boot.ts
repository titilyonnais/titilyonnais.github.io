import { startScroll, refreshWhenFontsReady } from './motion';
import { bootScenes } from './motion/scene';
import { bootHero } from './dither/hero';
import { bootCoutures } from './dither/couture';
import { bootTitres } from './titres';

startScroll();
bootHero();
bootCoutures();
bootTitres();
bootScenes();
refreshWhenFontsReady();
