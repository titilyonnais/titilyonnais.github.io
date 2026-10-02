// Audit anti-slop : fait échouer la CI quand le code s'écarte de DESIGN.md.
// Usage : node scripts/audit-design.mjs <dossier> [<dossier>…]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const dirs = process.argv.slice(2);
if (dirs.length === 0) dirs.push('src');

const EXT = new Set(['.css', '.astro', '.ts', '.md', '.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.has(extname(p))) yield p;
  }
}

// Remplace commentaires par des espaces de même longueur : les numéros de ligne restent justes.
const blank = (s) => s.replace(/[^\n]/g, ' ');
function stripComments(src, ext) {
  let out = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (ext === '.astro' || ext === '.md') out = out.replace(/<!--[\s\S]*?-->/g, blank);
  if (ext === '.ts' || ext === '.mjs' || ext === '.astro') out = out.replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
  return out;
}

// Zones « CSS » : tout un .css, les blocs <style> d'un .astro, les attributs style="…".
function cssZones(src, ext) {
  if (ext === '.css') return [[0, src.length]];
  const zones = [];
  for (const re of [/<style[\s\S]*?<\/style>/g, /style="[^"]*"/g]) {
    for (const m of src.matchAll(re)) zones.push([m.index, m.index + m[0].length]);
  }
  return zones;
}
const inZones = (i, zones) => zones.some(([a, b]) => i >= a && i < b);

const FONT_OK = /^(var\(--(sans|mono)\)|inherit|'Mona Sans'|'IBM Plex Mono')/;

const rules = [
  { id: 'rayon', re: /border-(?:[a-z-]*-)?radius\s*:\s*([^;}\n"]+)/g, css: true, bad: (m) => !/^0(px|rem|em|%)?\s*$/.test(m[1].trim()) },
  { id: 'dégradé', re: /(?:linear|radial|conic)-gradient\(/g },
  { id: 'ombre', re: /box-shadow\s*:\s*(?!none)/g, css: true },
  { id: 'ombre-texte', re: /text-shadow\s*:\s*(?!none)/g, css: true },
  { id: 'flou', re: /blur\(/g },
  { id: 'verre', re: /backdrop-filter/g },
  { id: 'couleur', re: /#[0-9a-fA-F]{3,8}\b/g, css: true, skipTokens: true },
  { id: 'couleur', re: /(['"`])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\1/g, skipTokens: true },
  { id: 'couleur', re: /\b(?:rgba?|hsla?|oklch|lab|lch)\(/g, skipTokens: true },
  { id: 'couleur', re: /(?:color|background|fill|stroke|border|outline)[a-z-]*\s*:[^;}\n]*\b(?:black|white|gr[ae]y|silver|red|blue|green|orange|yellow|purple|pink)\b/g, css: true },
  { id: 'gris', re: /opacity\s*:\s*0?\.\d/g },
  { id: 'police', re: /font-family\s*:\s*([^;}\n]+)/g, css: true, bad: (m) => !FONT_OK.test(m[1].trim()) },
  { id: 'emoji', re: /\p{Emoji_Presentation}/gu },
];

const failures = [];
for (const dir of dirs) {
  for (const file of walk(dir)) {
    const ext = extname(file);
    const raw = readFileSync(file, 'utf8');
    const src = stripComments(raw, ext);
    const zones = cssZones(src, ext);
    const isTokens = basename(file) === 'tokens.css';
    for (const r of rules) {
      if (r.skipTokens && isTokens) continue;
      for (const m of src.matchAll(r.re)) {
        if (r.css && !inZones(m.index, zones)) continue;
        if (r.bad && !r.bad(m)) continue;
        const line = src.slice(0, m.index).split('\n').length;
        failures.push(`${file}:${line}  [${r.id}]  ${raw.split('\n')[line - 1].trim()}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Audit anti-slop : ${failures.length} écart(s) avec DESIGN.md\n`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`Audit anti-slop : rien à signaler (${dirs.join(', ')}).`);
