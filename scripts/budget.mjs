// Budgets : JS ≤ 350 Ko gzip, polices produits ≤ 220 Ko, vidéo ≤ 1,2 Mo.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

let echec = false;
const ko = (n) => `${(n / 1024).toFixed(1).padStart(7)} Ko`;

const LIMITE_JS = 350 * 1024;
const dir = 'dist/_astro';
let total = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const n = gzipSync(readFileSync(join(dir, f))).length;
  total += n;
  console.log(`${ko(n)}  ${f}`);
}
console.log(`${ko(total)}  total JS gzip (limite ${LIMITE_JS / 1024} Ko)`);
if (total > LIMITE_JS) echec = true;

/** Somme des fichiers d'un dossier de dist dont le nom finit par `ext`. */
function somme(dossier, ext, limite, nom) {
  if (!existsSync(dossier)) return;
  const n = readdirSync(dossier)
    .filter((f) => f.endsWith(ext))
    .reduce((s, f) => s + statSync(join(dossier, f)).size, 0);
  console.log(`${ko(n)}  ${nom} (limite ${ko(limite).trim()})`);
  if (n > limite) echec = true;
}
somme('dist/produits/polices', '.woff2', 220 * 1024, 'polices produits');
somme('dist/produits/postship', '.mp4', 1.2 * 1024 * 1024, 'vidéo PostShip (mp4)');
somme('dist/produits/postship', '.webm', 1.2 * 1024 * 1024, 'vidéo PostShip (webm)');

if (echec) process.exit(1);
