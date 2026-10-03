// Captures de contrôle : node scripts/shot.mjs <url> <sortie-sans-ext> [largeur] [hauteur] [y1,y2,…] [--calm] [--attente=ms] [--js=code]
// Le GPU est activé : la toile de particules a besoin d'un vrai WebGL2 pour être jugée à l'œil.
import { chromium } from '@playwright/test';

const [url = 'http://localhost:4321/', out = 'shot', w = '1440', h = '900', ys = '0', ...flags] = process.argv.slice(2);
const opt = (k, d) => (flags.find((f) => f.startsWith(`--${k}=`)) ?? `=${d}`).split('=').slice(1).join('=');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 1,
  reducedMotion: flags.includes('--calm') ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(+opt('attente', 1600));
if (opt('js', '')) await page.evaluate(opt('js', ''));
const list = ys.split(',');
for (const y of list) {
  // Les y en « % » visent une fraction de la hauteur totale ; « #id » vise un élément.
  await page.evaluate(async (y) => {
    let top = 0;
    if (y.startsWith('#')) top = document.querySelector(y).getBoundingClientRect().top + scrollY;
    else if (y.endsWith('%')) top = (parseFloat(y) / 100) * (document.documentElement.scrollHeight - innerHeight);
    else if (y.startsWith('+')) { const [sel, off] = y.slice(1).split('@'); top = document.querySelector(sel).getBoundingClientRect().top + scrollY + parseFloat(off) * innerHeight; }
    else top = parseFloat(y);
    window.lenis?.stop?.();
    window.scrollTo({ top, behavior: 'instant' });
  }, y);
  await page.waitForTimeout(900);
  const name = `${out}-${list.indexOf(y)}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}
if (errors.length) console.log('ERREURS:\n' + errors.join('\n'));
await browser.close();
