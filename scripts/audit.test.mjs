// Vérifie l'exception « démos » de l'audit anti-slop (DESIGN.md, règle 4).
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const run = (dir) => {
  try {
    execFileSync('node', ['scripts/audit-design.mjs', dir], { stdio: 'pipe' });
    return '';
  } catch (e) {
    return String(e.stderr);
  }
};

// Une démo peut avoir rayon, ombre, flou, dégradé, police produit ; ses couleurs vivent dans tokens.css.
assert.equal(run('scripts/fixtures/demos/piege-ok'), '');
// Une couleur littérale hors tokens.css, même dans une démo, échoue.
assert.match(run('scripts/fixtures/demos/piege-ko'), /\[couleur\]/);
// Hors démos, les règles strictes restent.
assert.match(run('scripts/fixtures/piege.css'.replace(/\/piege\.css$/, '')), /\[rayon\]/);
console.log('audit.test : ok');
// Déclarer une police dans @font-face n'est pas l'utiliser.
assert.equal(run('scripts/fixtures/fontface'), '');
// L'utiliser hors démo reste refusé.
assert.match(run('scripts/fixtures/fontface-ko'), /\[police\]/);
console.log('audit.test (@font-face) : ok');
// Dans une démo, donnees.ts porte le contenu copié (une couleur Figma) : permis.
assert.equal(run('scripts/fixtures/demos/donnees-ok'), '');
// Ailleurs dans la démo (demo.ts), la même chaîne reste refusée.
assert.match(run('scripts/fixtures/demos/donnees-ko'), /\[couleur\]/);
console.log('audit.test (données de démo) : ok');
