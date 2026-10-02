// Budget JS : la somme gzip de tous les scripts du site doit tenir sous 120 Ko.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMITE = 120 * 1024;
const dir = 'dist/_astro';
let total = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const n = gzipSync(readFileSync(join(dir, f))).length;
  total += n;
  console.log(`${(n / 1024).toFixed(1).padStart(6)} Ko  ${f}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(6)} Ko  total gzip (limite ${LIMITE / 1024} Ko)`);
if (total > LIMITE) process.exit(1);
