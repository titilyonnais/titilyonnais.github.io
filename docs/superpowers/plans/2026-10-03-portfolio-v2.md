# Portfolio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la trame 1-bit par une toile de particules WebGL2 unique, et remplacer les scènes produits par les vraies interfaces de PostShip, Clipper et ÆTHER, en 3D et jouables.

**Architecture:**
- Un canvas Three.js fixe derrière le DOM simule environ 131 000 particules sur le GPU (textures ping-pong position et vitesse).
- Un chef d'orchestre lit des « stations » déclarées dans le HTML et pilote cibles, teintes et fonds au scroll.
- Les fenêtres produits restent du HTML, avec une perspective 3D CSS (GSAP).
- Chaque démo est une machine à états qui appelle l'API des particules : `eclater`, `envoler`, `poser`.

**Tech Stack:** Astro 7.3, TypeScript 6.0, Three.js 0.186 (`GPUComputationRenderer` des addons), GSAP 3.15 + ScrollTrigger + Draggable, Lenis, Playwright 1.63, @fontsource (Onest, Inter, Instrument Serif, JetBrains Mono), ffmpeg pour l'extrait vidéo.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`

## Global Constraints

- Branche `v2`. On ne fusionne dans `main` qu'en fin de Task 11, quand le CI est vert.
- Site hors fenêtres produits : `--ink #000000`, `--paper #F4F4F2`, Mona Sans + IBM Plex Mono uniquement.
- Couleurs littérales seulement dans `src/styles/tokens.css` et `src/demos/<produit>/tokens.css` ; chacun de ces fichiers cite son fichier source produit.
- Rayon, ombre, flou, dégradé et `backdrop-filter` sont permis seulement sous `src/demos/**`.
- Copie en français, apostrophe ’ dans les textes, U+202F avant `: ; ! ?` et dans les nombres (« 1 240,00 € »). Pas d'emoji.
- Phrase du hero : « Trois logiciels en service. » / « D’autres en route. »
- Teintes des particules :

  | Station | Teinte |
  |---|---|
  | PostShip | `#8fb0dc` |
  | Clipper | `#ededed` |
  | ÆTHER | `#a9c9ec` → `#b3a4e6` |
  | Site, fond noir | `#f4f4f2` |
  | Site, fond papier | `#000000` |

- Budget JS ≤ 350 Ko gzip ; polices produits ≤ 220 Ko ; vidéo ≤ 1,2 Mo.
- Garde-fou : sous 40 images/s pendant 2 s → palier inférieur (512×256 → 384×192 → 256×128).
- ÆTHER : « Espaces », jamais « intentions » pour les groupes.
- Score PostShip : 100 → 60 (on retire « Pages de paiement » = 40), puis retour à 100.
- `window.__particules = { frames, palier, station, running }`.
- `prefers-reduced-motion` : pas de simulation, images fixes, démos instantanées, préchargeur sauté.
- Sans WebGL2 : `html[data-particules='off']`, logos SVG, démos intactes.

## Review Focus

1. **Redimensionnement ou rotation du téléphone pendant une démo** : la fenêtre se remet à l'échelle, la démo garde son état et les particules se reposent sur le nouveau contour. Test : Task 6, redimensionnement en pleine démo PostShip, l'état est conservé.
2. **Scroll rapide à travers plusieurs stations** (lien du sommaire, touche Fin) : le chef saute directement à la station d'arrivée, sans file de métamorphoses ni fond bloqué sur la mauvaise couleur. Test : Task 5, `#contact` depuis le hero, station `contact` et fond noir en moins de 1,5 s.
3. **Saisie clavier dans la démo Clipper ou `Ctrl K` hors de la scène** : les raccourcis ne sont captés que si le focus est dans la scène. `Ctrl K` ailleurs ne fait rien de la démo. Test : Task 9, `Ctrl K` sur le hero n'ouvre pas la barre.
4. **Onglet caché puis rendu, ou contexte WebGL perdu** : la boucle s'arrête puis reprend ; une perte de contexte bascule en mode sans WebGL, sans page blanche. Test : Task 2, `WEBGL_lose_context` met `data-particules=off` et les logos SVG sont visibles.
5. **Visiteur qui ne joue pas** : chaque démo se joue seule après 2,5 s d'inaction en phase démo, et ne reste jamais bloquée à mi-chemin. Tests : Tasks 7, 8 et 9 (démo automatique).

---

## Structure des fichiers

```
src/lib/particules/
  types.ts           Station, Forme, API publique (types partagés)
  shaders.ts         GLSL : simulation vitesse, position, rendu points
  moteur.ts          renderer, GPUComputationRenderer, boucle, paliers, pointeur, impulsions
  formes.ts          définitions des formes (chemins SVG, textes, glyphes) par clé
  cibles.worker.ts   échantillonnage dans un Worker (OffscreenCanvas)
  cibles.ts          file d'attente vers le worker + cache
  chef.ts            stations, ScrollTrigger, teintes, fonds, vagues, API eclater/envoler/poser
  passage.ts         sessionStorage entre pages
  index.ts           boot : charge moteur + chef, expose window.__particules
src/lib/fenetre3d.ts perspective, inclinaison souris, vue éclatée, échelle
src/demos/postship/  Fenetre.astro tokens.css donnees.ts demo.ts
src/demos/clipper/   Fenetre.astro tokens.css donnees.ts demo.ts icones.ts
src/demos/aether/    Fenetre.astro tokens.css donnees.ts demo.ts themes.ts
src/components/Prechargeur.astro
src/components/scenes/SceneProduit.astro   (remplace SceneProjet.astro)
public/produits/{postship,clipper,aether}/ logos, illustrations, vidéo
```

**Supprimés :**
- `src/lib/dither/` (tout le dossier)
- `src/components/Couture.astro`
- `src/scenes/{postship,clipper,aether}.ts`
- `src/components/scenes/{PostShip,Clipper,Aether,SceneProjet}.astro`
- `tests/trame.spec.ts`

---

### Task 1: Socle v2 (dépendances, polices produits, audit, budget)

**Files:**
- Modify: `package.json`, `scripts/audit-design.mjs`, `scripts/budget.mjs`, `scripts/fixtures/piege.css`, `DESIGN.md`
- Create: `scripts/fixtures/demos/piege/tokens.css`, `scripts/fixtures/demos/piege/ok.css`, `scripts/audit.test.mjs`

**Interfaces:**
- Produces: `npm run audit` qui accepte `src/demos/**` (rayon, ombre, flou, dégradé, verre, polices produits) et y refuse les couleurs littérales hors `tokens.css` ; `npm run budget` à 350 Ko.

- [ ] **Step 1: Écrire le test de l'audit**

  `scripts/audit.test.mjs` :

  ```js
  import { execFileSync } from 'node:child_process';
  import assert from 'node:assert/strict';
  const run = (dir) => {
    try { execFileSync('node', ['scripts/audit-design.mjs', dir], { stdio: 'pipe' }); return ''; }
    catch (e) { return String(e.stderr); }
  };
  // Une démo peut avoir rayon, ombre, flou, dégradé ; ses couleurs vivent dans tokens.css.
  assert.equal(run('scripts/fixtures/demos/piege-ok'), '');
  // Une couleur littérale hors tokens.css, même dans une démo, échoue.
  assert.match(run('scripts/fixtures/demos/piege-ko'), /\[couleur\]/);
  // Hors démos, les règles strictes restent.
  assert.match(run('scripts/fixtures'), /\[rayon\]/);
  console.log('audit.test : ok');
  ```

  Pour que le chemin contienne `/demos/`, les fixtures vont dans `scripts/fixtures/demos/piege-ok/{tokens.css,ok.css}` et `scripts/fixtures/demos/piege-ko/ko.css` :
  - `ok.css` : `.f { border-radius: 8px; box-shadow: 0 1px 2px var(--x); backdrop-filter: blur(4px); background: linear-gradient(var(--a), var(--b)); font-family: 'Onest'; }`
  - `tokens.css` : `:root { --a: #000; --b: #fff; }`
  - `ko.css` : `.f { color: #ff0000; }`

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

  Run: `node scripts/audit.test.mjs`
  Expected: AssertionError (l'audit rejette `piege-ok`).

- [ ] **Step 3: Modifier l'audit**

  Dans `scripts/audit-design.mjs` :
  - calculer `const demo = /[\\/]demos[\\/]/.test(file)` ;
  - pour les règles `rayon`, `dégradé`, `ombre`, `ombre-texte`, `flou`, `verre`, `gris` et `police`, ajouter `demoOk: true` et `if (r.demoOk && demo) continue;` ;
  - garder `skipTokens` sur `isTokens` : tout `tokens.css` peut contenir des couleurs ;
  - `police` hors démo garde `FONT_OK`.

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

  Run: `node scripts/audit.test.mjs && npm run audit`
  Expected: `audit.test : ok`, puis l'audit de `src` passe.

- [ ] **Step 5: Dépendances, budget et DESIGN.md**

  ```bash
  npm i three@0.186.1
  npm i -D @types/three @fontsource-variable/onest @fontsource-variable/inter @fontsource/instrument-serif @fontsource-variable/jetbrains-mono
  ```

  - `scripts/budget.mjs` : `const LIMITE = 350 * 1024;`, et un second contrôle qui fait la somme des `.woff2` de `dist/produits/polices/` (limite 220 Ko) et de `dist/produits/postship/*.mp4` (limite 1,2 Mo).
  - Ajouter `"test:audit": "node scripts/audit.test.mjs"` et l'enchaîner dans `ci.yml` après `npm run audit`.
  - `DESIGN.md` : règle 2 « la particule remplace la trame », règle 4 « exception produits » (texte du § 3 de la spec).

- [ ] **Step 6: Copier les polices produits (sous-ensemble latin)**

  Copier dans `public/produits/polices/` :
  - `onest-latin-wght-normal.woff2` ;
  - `inter-latin-wght-normal.woff2` ;
  - `instrument-serif-latin-400-normal.woff2` et `instrument-serif-latin-400-italic.woff2` ;
  - `jetbrains-mono-latin-wght-normal.woff2`.

  Les sources sont dans `node_modules/@fontsource*/files/`. Ajouter `src/styles/polices-produits.css` avec les `@font-face` (`font-display: swap`, `unicode-range` latin, copié de `base.css`). Ce fichier n'est importé que par les démos et les études de cas : les navigateurs ne téléchargent une police que si un élément l'utilise.

- [ ] **Step 7: Vérifier et commiter**

  Run: `npm run build && npm run budget`
  Expected: build OK, budget OK.

  ```bash
  git add -A && git commit -m "Socle v2 : Three.js, polices produits, audit avec exception démos, budget 350 Ko"
  ```

---

### Task 2: Moteur de particules (GPGPU, rendu, boucle, paliers)

**Files:**
- Create: `src/lib/particules/types.ts`, `src/lib/particules/shaders.ts`, `src/lib/particules/moteur.ts`, `src/lib/particules/index.ts`
- Modify: `src/layouts/Base.astro` (canvas fixe), `src/styles/base.css` (canvas, sections transparentes), `src/lib/boot.ts`
- Test: `tests/particules.spec.ts`

**Interfaces:**
- Produces (`types.ts`) :

  ```ts
  export type Vec3 = Float32Array;            // xyz entrelacés, en px CSS, origine = coin haut-gauche de l'écran, z vers l'écran
  export type Cible = { points: Vec3; couleurs?: Float32Array; teinte: [string, string?]; };
  export type Reglages = { raideur: number; amorti: number; bruit: number; taille: number; additif: boolean };
  export interface Moteur {
    readonly palier: 0 | 1 | 2;
    readonly n: number;                       // nombre de particules du palier
    viser(c: Cible, r?: Partial<Reglages>, decalage?: number): void; // decalage : retard max par particule (s)
    reglages(r: Partial<Reglages>): void;
    fond(couleur: string): void;              // couleur de clear
    impulsion(x: number, y: number, force: number, rayon: number): void; // explosion / onde (px CSS)
    pointeur(x: number, y: number, actif: boolean): void;
    figer(on: boolean): void;                 // mode calme : une image, plus de boucle
    detruire(): void;
  }
  export type Etat = { frames: number; palier: number; station: string; running: boolean };
  ```

- `moteur.ts` : `export function creerMoteur(canvas: HTMLCanvasElement, etat: Etat): Moteur | null`. Renvoie `null` si WebGL2 ou `EXT_color_buffer_float` est absent.

- [ ] **Step 1: Écrire le test**

  `tests/particules.spec.ts` :

  ```ts
  import { test, expect } from '@playwright/test';
  import { erreurs } from './aide';

  test('la toile tourne puis se met en pause quand l’onglet est caché', async ({ page }) => {
    const e = erreurs(page);
    await page.goto('/');
    await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 10, null, { timeout: 8000 });
    expect(await page.evaluate(() => window.__particules!.running)).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);
    const f = await page.evaluate(() => window.__particules!.frames);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__particules!.frames)).toBe(f);
    expect(e).toEqual([]);
  });

  test('perte du contexte WebGL : bascule sans WebGL', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window.__particules?.frames ?? 0) > 2);
    await page.evaluate(() => {
      const gl = document.querySelector<HTMLCanvasElement>('#particules')!.getContext('webgl2')!;
      gl.getExtension('WEBGL_lose_context')!.loseContext();
    });
    await expect(page.locator('html')).toHaveAttribute('data-particules', 'off');
  });

  test('sans WebGL2 : html[data-particules=off]', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error surcharge de test
      HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) {
        return t === 'webgl2' || t === 'webgl' ? null : orig.call(this, t, ...a);
      };
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-particules', 'off');
  });
  ```

  Ajouter `particules` au `testMatch` du projet mobile dans `playwright.config.ts`.

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/particules.spec.ts --project=bureau`
  Expected: FAIL (timeout sur `__particules`).

- [ ] **Step 3: Shaders (`shaders.ts`)**

  - **`SIM_VITESSE`** (fragment de `GPUComputationRenderer`, uniforms `texturePosition`, `textureVitesse`, plus `tCible`, `tDepart`, `uTemps`, `uDt`, `uRaideur`, `uAmorti`, `uBruit`, `uPointeur` (vec4 : x, y, rayon, force), `uImpulsions[4]` (vec4 : x, y, t0, force)) :
    - `acc = (cible - pos) * uRaideur * actif`, où `actif = smoothstep(depart, depart + 0.35, uTemps)` et `depart = texture(tDepart).r` est le retard propre de la particule ;
    - `+ curl(pos * 0.004 + uTemps * 0.08) * uBruit` (curl noise d'un simplex 3D) ;
    - souffle : `d = pos.xy - uPointeur.xy ; acc.xy += normalize(d) * uPointeur.w * pow(1 - clamp(length(d) / uPointeur.z, 0, 1), 2)` ;
    - impulsions : anneau d'âge `a = uTemps - t0`, rayon `R = a * 1400`, gain `force * exp(-a * 2.5) * exp(-pow((length(d) - R) / 60, 2))` ;
    - `vel = (vel + acc * uDt) * pow(uAmorti, uDt * 60)`.
  - **`SIM_POSITION`** : `pos += vel * uDt`.
  - **`RENDU_VERT` / `RENDU_FRAG`** :
    - attribut `ref` (uv dans les textures) ;
    - `gl_PointSize = uTaille * uDpr * (0.8 + 0.4 * hash(ref)) * (uFocale / (uFocale - pos.z))` ;
    - la couleur mélange `couleurDepart` et `couleurCible` selon `actif`, éclat `+ min(length(vel) / 900, 0.6)` ;
    - fragment : disque doux `1 - smoothstep(0.35, 0.5, length(gl_PointCoord - 0.5))`.

- [ ] **Step 4: Moteur (`moteur.ts`)**

  - `THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })`, `setPixelRatio(min(dpr, 2))`.
  - Caméra : `PerspectiveCamera(fov)` avec `fov = 2 * atan((H / 2) / D) * 180 / PI`, `D = 1200`, `position.set(W / 2, H / 2, D)`, et y inversé (`scale.y = -1` sur la scène) pour que y suive l'écran CSS.
  - `GPUComputationRenderer(TW, TH)`, paliers `[[512, 256], [384, 192], [256, 128]]`. Variables `vitesse` et `position` ; textures `tCible`, `tCouleur` et `tDepart` mises à jour par `viser()`.
  - `viser()` :
    - recopie les points de la cible (répétés modulo leur nombre si la cible en a moins que `n` ; le surplus va en « poussière » à 15 % d'éclat, avec un rayon aléatoire de ±40 px autour) ;
    - copie `couleurCible` vers `couleurDepart` ;
    - écrit `tDepart` = `uTemps + hash(i) * decalage`.
  - Boucle `requestAnimationFrame`, arrêtée quand `document.hidden` ou `figer(true)`. Elle incrémente `etat.frames` et tient `etat.running`.
  - Garde-fou : moyenne glissante du temps par image sur 120 images. Si elle dépasse 25 ms pendant 2 s, `palier++` et le moteur se reconstruit : il relit les positions courantes avec `readRenderTargetPixels` sur le nouveau palier (sous-échantillonnage).
  - `webglcontextlost` → `document.documentElement.dataset.particules = 'off'` et `etat.running = false`.
  - Pointeur : `pointermove` sur `window`, vitesse lissée → force `min(vitesse * 0.9, 2600)`. `pointerdown` → `impulsion(x, y, 2200, 0)`. Désactivé en mode calme.

- [ ] **Step 5: Boot (`index.ts`, `Base.astro`, `base.css`)**

  - `Base.astro` : `<canvas id="particules" aria-hidden="true"></canvas>` juste après `<body>`.
  - `base.css` : `#particules { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }` et `main, .nav { position: relative; z-index: 1; }`. Sections `.ink` et `.paper` transparentes quand `html:not([data-particules='off'])`.
  - `index.ts` :

    ```ts
    export async function bootParticules(): Promise<void> {
      const etat = { frames: 0, palier: 0, station: '', running: false };
      window.__particules = etat;
      const canvas = document.getElementById('particules') as HTMLCanvasElement | null;
      if (!canvas) return;
      const { creerMoteur } = await import('./moteur');
      const m = creerMoteur(canvas, etat);
      if (!m) { document.documentElement.dataset.particules = 'off'; return; }
      document.documentElement.dataset.particules = 'on';
      const { bootChef } = await import('./chef');
      bootChef(m, etat);
    }
    ```

    (Le chef de la Task 5 n'existe pas encore : en attendant, viser un nuage aléatoire avec `bootChef` = stub local, remplacé en Task 5.)
  - `boot.ts` : `void bootParticules()`.

- [ ] **Step 6: Lancer les tests**

  Run: `npx playwright test tests/particules.spec.ts`
  Expected: 3 PASS (bureau) + 3 PASS (mobile).

- [ ] **Step 7: Vérification visuelle**

  Avec le serveur de dev et le panneau navigateur : le nuage est visible, le souffle réagit à la souris, un clic donne une onde, 60 images/s (Performance).

- [ ] **Step 8: Commit**

  ```bash
  git add -A && git commit -m "Moteur de particules : GPGPU 131 k, souffle, onde de choc, paliers"
  ```

---

### Task 3: Formes et cibles (Worker)

**Files:**
- Create: `src/lib/particules/formes.ts`, `src/lib/particules/cibles.worker.ts`, `src/lib/particules/cibles.ts`
- Copy: `public/produits/postship/logo.svg`, `public/produits/clipper/logo.svg`, `public/produits/aether/icone.svg` (sources : spec § 2)
- Test: `tests/particules.spec.ts` (ajout)

**Interfaces:**
- Produces :

  ```ts
  // formes.ts
  export type Forme =
    | { type: 'chemin'; d: string[]; vb: [number, number, number, number]; trait?: number }  // SVG path(s), viewBox
    | { type: 'texte'; texte: string; police: string; graisse?: number; italique?: boolean }
    | { type: 'rect'; contour: number }                                                      // contour d'un rect DOM, épaisseur px
    | { type: 'champ' };                                                                     // poussière diffuse
  export const FORMES: Record<string, Forme>; // 'postship', 'clipper', 'aether', 'pied', 'accolades', 'fleche', 'arobase', 'coche', 'compteur'
  // cibles.ts
  export type Placement = { x: number; y: number; w: number; h: number };   // boîte écran en px CSS
  export function cible(cle: string, place: Placement, n: number, texte?: string): Promise<Float32Array>;
  ```

- `formes.ts` :
  - `postship` : deux `path` des chevrons, `vb [20, 20, 196, 160]`.
  - `clipper` : `rect x10 y10 w44 h44 rx11` (trait 5) + 3 lignes, `vb [0, 0, 64, 64]`. Le worker convertit le rect arrondi en chemin.
  - `aether` : texte « Æ », police `Instrument Serif`.
  - `pied` « ¶ », `accolades` « { } », `fleche` « ↗ », `arobase` « @ », `coche` « ✓ » : textes Mona Sans 500.
  - `compteur` : texte libre en IBM Plex Mono.

- [ ] **Step 1: Écrire le test**

  ```ts
  test('les cibles des trois logos tombent dans leur boîte', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.__particules?.frames! > 2);
    const r = await page.evaluate(async () => {
      const { cible } = await import('/src/lib/particules/cibles.ts');
      const out: Record<string, boolean> = {};
      for (const k of ['postship', 'clipper', 'aether']) {
        const p = await cible(k, { x: 100, y: 100, w: 400, h: 300 }, 5000);
        let ok = p.length === 15000;
        for (let i = 0; i < p.length; i += 3) ok &&= p[i]! >= 99 && p[i]! <= 501 && p[i + 1]! >= 99 && p[i + 1]! <= 401;
        out[k] = ok;
      }
      return out;
    });
    expect(r).toEqual({ postship: true, clipper: true, aether: true });
  });
  ```

  (Ce test tourne contre `astro dev` ; dans la config preview, il faut exposer `window.__cible = cible` en dev et en test. Retenu : `index.ts` expose `window.__particulesApi = { cible }`, et le test l'utilise à la place de l'import dynamique.)

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/particules.spec.ts -g cibles --project=bureau`
  Expected: FAIL (`__particulesApi` undefined).

- [ ] **Step 3: Worker**

  `cibles.worker.ts` reçoit `{ id, forme, place, n, texte, dpr }` et, sur un `OffscreenCanvas` à la taille `place.w × place.h` (× 1, au maximum 1024 px de côté puis remis à l'échelle) :
  - **`chemin`** : `ctx.setTransform` pour ajuster la viewBox avec « contain » et centrer, puis `ctx.fill(new Path2D(d))` (ou `stroke` avec `lineWidth = trait`, `lineCap round`).
  - **`texte`** : `await new FontFace(...)` n'est pas disponible pour les polices du document. On passe donc les URL des polices dans le message, et le worker les charge avec `new FontFace(nom, 'url(...)')` et `self.fonts.add`. Taille calculée pour « contain ».
  - **`rect`** : contour de largeur `contour`.
  - **`champ`** : tirage uniforme dans la boîte.
  - Échantillonnage : lire `getImageData`, garder les pixels alpha > 128, poids ×2 si un voisin à 2 px est vide (bord), tirage pondéré de `n` points (alias, graine fixe). z = `(rand - 0.5) * 24`.
  - Réponse `{ id, points }` en transfert.

- [ ] **Step 4: `cibles.ts`**

  Un seul Worker (`new Worker(new URL('./cibles.worker.ts', import.meta.url), { type: 'module' })`), des promesses par `id`, et un cache `Map<string, Float32Array>` de clé `${cle}|${w}x${h}|${n}|${texte ?? ''}`. Les points sont translatés de `place.x/y`.

- [ ] **Step 5: Lancer le test**

  Run: `npx playwright test tests/particules.spec.ts --project=bureau`
  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add -A && git commit -m "Cibles des particules : logos, glyphes, contours, échantillonnés dans un Worker"
  ```

---

### Task 4: Préchargeur et hero

**Files:**
- Create: `src/components/Prechargeur.astro`
- Modify: `src/components/Hero.astro` (réécrit), `src/layouts/Base.astro`, `src/lib/particules/index.ts`
- Delete: `src/lib/dither/hero.ts`, `src/lib/dither/shader.ts`
- Test: `tests/hero.spec.ts` (remplace les tests hero de `trame.spec.ts`)

**Interfaces:**
- Consumes: `Moteur`, `cible()`.
- Produces :
  - `Prechargeur.avancer(etape: 'polices' | 'three' | 'cibles' | 'rendu')` sur `window.__pre`, et l'événement `document` `'pret'` (CustomEvent) à 100 ;
  - hero : `[data-station="hero"]` avec `data-cycle="postship,clipper,aether"`, `[data-hero-produit]` (texte qui change), `html[data-pre='vu']`.

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  test('le préchargeur s’efface en moins de 3 s, puis est sauté', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pre')).toBeHidden({ timeout: 3000 });
    await page.goto('/projets/postship/');
    await page.goto('/');
    await expect(page.locator('.pre')).toBeHidden({ timeout: 300 });
  });
  test('le hero dit la phrase et cycle les produits', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .phrase')).toHaveText(/Trois logiciels en service\.\s*D’autres en route\./);
    const p = page.locator('[data-hero-produit]');
    await expect(p).toHaveText(/PostShip/);
    await expect(p).toHaveText(/Clipper/, { timeout: 6000 });
    await expect(p).toHaveText(/ÆTHER/, { timeout: 6000 });
  });
  test('calme : pas de préchargeur, logos fixes', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('.pre')).toBeHidden({ timeout: 300 });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.__particules!.running)).toBe(false);
  });
  ```

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/hero.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: Préchargeur**

  `Prechargeur.astro` :
  - `<div class="pre ink" aria-hidden="true"><span class="compteur mono">000</span></div>`, en position fixe, z-index 50, fond `--ink` ;
  - un script inline (`is:inline`) avant tout module :

    ```js
    (() => {
      const vu = sessionStorage.getItem('pre') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (vu) { document.documentElement.dataset.pre = 'vu'; return; }
      const P = { polices: 20, three: 40, cibles: 30, rendu: 10 }; let cible = 0, affiche = 0;
      const el = () => document.querySelector('.pre .compteur');
      window.__pre = { avancer(k) { cible += P[k] || 0; } };
      const tic = () => {
        affiche += Math.max(0.6, (cible - affiche) * 0.12); if (affiche > cible) affiche = cible;
        const e = el(); if (e) e.textContent = String(Math.round(affiche)).padStart(3, '0');
        if (affiche >= 100) { sessionStorage.setItem('pre', '1'); document.dispatchEvent(new CustomEvent('pret')); return; }
        requestAnimationFrame(tic);
      };
      requestAnimationFrame(tic);
      setTimeout(() => { cible = 100; }, 3000); // plafond
    })();
    ```

  - CSS : `html[data-pre='vu'] .pre { display: none }` et `.pre.fini { opacity: 0; transition: opacity .2s steps(1) }` (pas d'opacité intermédiaire : bascule nette, règle anti-gris).
  - `index.ts` appelle `__pre?.avancer` à chaque étape : `document.fonts.ready` → `polices`, import du moteur → `three`, `Promise.all` des 3 logos → `cibles`, premier `frames > 0` → `rendu`.
  - Sur `'pret'` : `cible('compteur', rectDuCompteur, n, texteDuCompteur)`, puis `m.viser(...)` avec réglages `raideur 0` pendant une image (les particules sont posées) ; `.pre` reçoit `fini`, puis on vise les chevrons avec un décalage de 0,25 s.

- [ ] **Step 4: Hero**

  Nouveau `Hero.astro` :

  ```astro
  <section class="hero ink" data-station="hero" data-cycle="postship,clipper,aether" data-fond="ink">
    <h1 class="sr-only">Thibault Morretton, créateur de logiciels</h1>
    <p class="qui mono">Thibault Morretton · créateur de logiciels</p>
    <div class="scene-logo" data-place aria-hidden="true">
      <img class="repli" src="/produits/postship/logo.svg" alt="" />
      <img class="repli" src="/produits/clipper/logo.svg" alt="" />
      <img class="repli" src="/produits/aether/icone.svg" alt="" />
    </div>
    <a class="produit" data-hero-produit href="#postship"><span class="nom">PostShip</span><span class="ligne">Vérifie votre site après chaque déploiement.</span></a>
    <p class="phrase">Trois logiciels en service.<br />D’autres en route.</p>
    <ol class="sommaire mono">…01–03 comme en v1…</ol>
  </section>
  ```

  - `.repli` n'est visible que si `html[data-particules='off']` ou en mode calme, où l'image fixe utilise les particules ; en calme, les trois logos sont rendus côte à côte par le moteur figé.
  - `[data-place]` donne la boîte écran du logo : ~46 % de hauteur, à droite sur ordinateur (colonnes 6–12), au-dessus du texte sur mobile.
  - `.produit .nom` prend la police du produit (`font-family: var(--police-produit)`), une variable posée par le chef. Ces familles sont ajoutées à `FONT_OK` dans l'audit : `'Onest'`, `'Instrument Serif'`, `'Inter'`.
  - Le cycle est dans le chef (Task 5). En attendant, `index.ts` fait tourner `postship → clipper → aether` toutes les 4 s, avec les teintes des Global Constraints et `viser(c, { bruit: 900, raideur: 6 }, 0.25)` puis `reglages({ bruit: 40, raideur: 22 })` après 0,6 s. Le contenu de `[data-hero-produit]` change à mi-transition :

    | Produit | Ligne | `href` |
    |---|---|---|
    | PostShip | « Vérifie votre site après chaque déploiement. » | `#postship` |
    | Clipper | « Le presse-papiers qui se souvient. » | `#clipper` |
    | ÆTHER | « Le navigateur où les onglets deviennent des cartes. » | `#aether` |

  - Le souffle met le cycle en pause, qui reprend 1,5 s après le dernier `pointermove` dans le hero.
  - Supprimer `src/lib/dither/hero.ts`, `src/lib/dither/shader.ts` et leur appel dans `boot.ts`.

- [ ] **Step 5: Lancer les tests**

  Run: `npx playwright test tests/hero.spec.ts tests/particules.spec.ts`
  Expected: PASS.

- [ ] **Step 6: Vérification visuelle**

  Capture du préchargeur à 50 %, puis du hero sur les 3 logos, sur ordinateur et sur mobile (`scripts/shot.mjs`). Ajuster taille, densité et éclat jusqu'à ce que les logos soient nets et lisibles.

- [ ] **Step 7: Commit**

  ```bash
  git add -A && git commit -m "Préchargeur réel et hero en particules : trois logos en métamorphose"
  ```

---

### Task 5: Chef d'orchestre, fonds, Méthode, À propos, Contact ; fin de la trame

**Files:**
- Create: `src/lib/particules/chef.ts`
- Modify: `src/lib/particules/index.ts`, `src/pages/index.astro`, `src/components/Methode.astro`, `src/components/APropos.astro`, `src/components/Contact.astro`, `src/scenes/contact.ts`, `src/lib/boot.ts`, `public/favicon.svg`
- Delete: `src/components/Couture.astro`, `src/lib/dither/` (reste), `tests/trame.spec.ts`
- Test: `tests/chef.spec.ts`

**Interfaces:**
- Consumes: `Moteur`, `cible()`, `FORMES`.
- Produces (`chef.ts`) :

  ```ts
  export type Station = {
    id: string;                       // data-station
    el: HTMLElement;
    fond: 'ink' | 'paper' | 'aucun';  // 'aucun' : la section peint son fond (ÆTHER)
    forme?: string;                   // clé FORMES ; absente → champ
    teinte: [string, string?];
    place?: () => Placement;          // défaut : boîte de [data-place] dans la station
    reglages?: Partial<Reglages>;
  };
  export interface Chef {
    eclater(x: number, y: number, force?: number): void;
    envoler(de: DOMRect, vers: DOMRect, teinte: string): Promise<void>; // résout à l'arrivée
    poser(rect: DOMRect, teinte?: string): void;                        // contour d'un rect
    liberer(): void;                                                    // rend la main à la station courante
    sur(id: string, fn: (actif: boolean) => void): void;                // abonnement d'une démo à sa station
  }
  export function bootChef(m: Moteur, etat: Etat): Chef;   // exposé : window.__chef
  ```

- Lecture des stations dans le DOM :
  - `data-station` (id), `data-fond`, `data-forme` ;
  - `data-teinte` (`"#8fb0dc"` ou `"#a9c9ec,#b3a4e6"`) ;
  - `data-cycle` (hero).

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  import { erreurs } from './aide';
  test('la station suit le scroll, saut direct compris', async ({ page }) => {
    const e = erreurs(page);
    await page.goto('/');
    await page.waitForFunction(() => window.__particules?.station === 'hero');
    await page.click('a[href="#contact"]');
    await page.waitForFunction(() => window.__particules?.station === 'contact', null, { timeout: 1500 });
    expect(await page.evaluate(() => document.documentElement.dataset.fond)).toBe('ink');
    await page.locator('#methode').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => window.__particules?.station.startsWith('methode'));
    expect(await page.evaluate(() => document.documentElement.dataset.fond)).toBe('paper');
    expect(e).toEqual([]);
  });
  test('contact : copier forme la coche puis revient', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#contact');
    await page.click('[data-copier]');
    await page.waitForFunction(() => window.__chef?.forme === 'coche');
    await page.waitForFunction(() => window.__chef?.forme === 'arobase', null, { timeout: 3000 });
  });
  ```

  (`window.__chef` expose aussi `forme: string`, la forme visée en cours.)

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/chef.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: Chef**

  - Une station est active quand son élément couvre le centre vertical de l'écran : un `ScrollTrigger` par station, `start: 'top center'`, `end: 'bottom center'`, et `onToggle` la rend active.
  - Changement de station :
    - `etat.station = id` ;
    - `document.documentElement.dataset.fond = fond` ;
    - `cible(forme, place(), m.n)` puis `m.viser(...)`.
  - On garde un jeton de génération : une réponse de cible périmée (station déjà quittée) est ignorée. C'est ce qui permet le saut direct (Review Focus 2).
  - **Fond** : `m.fond(fond === 'paper' ? '#f4f4f2' : '#000000')`, animé sur 450 ms derrière une **vague** : `m.impulsion(W / 2, fond === 'paper' ? H + 200 : -200, 900, 0)` pour pousser un front de particules dans le sens du scroll. Couleurs depuis les tokens CSS (`token('--paper')`), pas de littéral dans le TS.
  - **Teinte** : sur papier, les particules passent à `--ink` avec le mélange normal ; sur noir, à `--paper` (ou à la teinte produit) avec le mélange additif.
  - **Suivi du placement** : à chaque scroll, si la station a `place`, recalculer la boîte, et si elle a bougé de plus de 0,5 px, translater la cible. Uniform `uDecalage` (vec2) dans le shader de simulation : la cible est ajoutée à `uDecalage` ; on ne rééchantillonne pas.
  - **Redimensionnement** (debounce 150 ms) : rééchantillonner la station active.
  - Le cycle du hero est déplacé ici depuis `index.ts`.

- [ ] **Step 4: Sections**

  - `index.astro` : retirer toutes les `<Couture>`.
  - Stations :

    | Section | Attributs |
    |---|---|
    | Méthode | `data-station="methode-1"` / `-2` / `-3` sur chaque phrase, `data-fond="paper"`, `data-forme="pied"` / `"accolades"` / `"fleche"`, et un `[data-place]` à droite (colonnes 8–12) |
    | À propos | `data-station="apropos" data-fond="ink"`, sans forme (champ diffus), réglages `{ bruit: 120, raideur: 2 }` ; un `ScrollTrigger` passe la vitesse du scroll en `reglages({ bruit: 120 + v * 0.4 })` |
    | Contact | `data-station="contact" data-fond="ink" data-forme="arobase"`, place derrière l'adresse |

  - `contact.ts` :
    - au survol de l'adresse, `m.pointeur(x, y)` avec une force négative (attraction), via `chef.reglages` ;
    - au clic sur copier, `chef.eclater(cx, cy)`, la forme passe à `coche` pendant 1,6 s, puis revient à `arobase`.
  - **Mobile** : la forme de la Méthode passe derrière la phrase, rendue en filigrane avec un éclat de 25 % (réglage `taille` plus petit). Ce n'est pas une opacité CSS.
  - `public/favicon.svg` : `<svg viewBox="0 0 32 32"><rect width="32" height="32" fill="#000"/><circle cx="16" cy="16" r="5" fill="#f4f4f2"/></svg>` (le dossier `public` n'est pas audité).
  - Supprimer `Couture.astro`, `src/lib/dither/` et `tests/trame.spec.ts` ; retirer `bootCoutures`.

- [ ] **Step 5: Lancer les tests**

  Run: `npx playwright test tests/chef.spec.ts tests/hero.spec.ts tests/particules.spec.ts tests/contact.spec.ts`
  Expected: PASS (adapter `contact.spec.ts` si un sélecteur a changé).

- [ ] **Step 6: Vérification visuelle et commit**

  Captures de la Méthode (papier), de l'À propos et du Contact, plus une vague de bascule à mi-course.

  ```bash
  git add -A && git commit -m "Chef d’orchestre des particules : stations, fonds, vagues ; fin de la trame"
  ```

---

### Task 6: Fenêtres 3D et SceneProduit

**Files:**
- Create: `src/lib/fenetre3d.ts`, `src/components/scenes/SceneProduit.astro`
- Modify: `src/lib/motion/scene.ts` (loaders → démos)
- Test: `tests/fenetre.spec.ts`

**Interfaces:**
- Consumes: `Chef.poser`, `Chef.eclater`, `Chef.sur`.
- Produces :

  ```ts
  // fenetre3d.ts
  export type Couche = { el: HTMLElement; z: number; legende?: string };
  export type Fenetre3D = {
    phase(t: number): void;            // t ∈ [0,1] de la piste (phases du § 6 de la spec)
    echelle(): void;                   // remet la fenêtre à l'échelle de son conteneur
    readonly enDemo: boolean;          // t ∈ [0.55, 0.95)
    detruire(): void;
  };
  export function fenetre3d(scene: HTMLElement, opts: { calme: boolean; mobile: boolean; chef: Chef | null }): Fenetre3D;
  ```

- `SceneProduit.astro` : mêmes props que `SceneProjet` sans `temps`, `decor` ni `resume`, plus `largeur` et `hauteur` (taille native de la fenêtre) et `teinte`. Structure :

  ```astro
  <section id={id} class="projet ink" data-station={`${id}-fenetre`} data-fond={fond} data-teinte={teinte}>
    <div class="piste" data-scene={id} style={`--pin: ${pin}`}>
      <div class="scene">
        <header class="tete wrap">…numéro, état, h2 data-etire, phrase…</header>
        <div class="theatre" data-place>                  <!-- perspective: 1600px -->
          <div class="fenetre" data-fenetre style={`--w:${largeur}px;--h:${hauteur}px`}>
            <slot />                                      <!-- couches [data-couche data-z data-legende] -->
          </div>
          <p class="invite mono" data-invite></p>
        </div>
      </div>
    </div>
    <div class="sortie">…faits, stack, liens, Étude de cas (v1)…</div>
  </section>
  ```

- `fenetre3d.phase(t)` :

  | t | Effet |
  |---|---|
  | `< .15` | `chef.poser(rectFenetre)`, interface `visibility: hidden` ; à `.12`, l'interface apparaît (`data-vue="1"`) et `chef.liberer()` dissipe |
  | `.15 → .45` | `rotateX = lerp(0, 14, e)`, `rotateY = lerp(0, -18, e)` ; chaque couche `translateZ(z * e)` ; légendes visibles à `e > .5` |
  | `.45 → .55` | retour vers `rotateX(4deg)`, couches à z = 0 |
  | `.55 → .95` | `enDemo` vrai ; inclinaison souris ±6° (quickTo GSAP, 0,6 s) |
  | `≥ .95` | `chef.eclater(centreFenetre)`, interface masquée |

  - Échelle : `scale = min(1, conteneur.w / w, conteneur.h / h)`, posée en `--k`. Recalculée par un `ResizeObserver`, sans perdre l'état (Review Focus 1).
  - Mobile : z ÷ 2, pas d'inclinaison souris.
  - Calme : `phase(.6)` figé, sans rotation.

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  import { allerA } from './aide';
  test('la fenêtre s’éclate puis se réassemble', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'postship', 0.3);
    const z = await page.locator('#postship [data-couche]').nth(1).evaluate((e) => getComputedStyle(e).transform);
    expect(z).not.toBe('none');
    await allerA(page, 'postship', 0.7);
    await expect(page.locator('#postship .scene')).toHaveAttribute('data-demo', 'on');
  });
  test('redimensionner pendant la démo garde l’état', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'postship', 0.7);
    await page.click('#postship [data-action="pousser"]');
    await expect(page.locator('#postship [data-etat-demo]')).toHaveAttribute('data-etat-demo', /verifie|panne|alerte/);
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForTimeout(400);
    await expect(page.locator('#postship [data-etat-demo]')).not.toHaveAttribute('data-etat-demo', 'repos');
  });
  ```

  (Le second test passe après la Task 7 ; il est écrit ici pour fixer le contrat.)

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/fenetre.spec.ts -g éclate --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: Implémenter**

  - `fenetre3d.ts` et `SceneProduit.astro` comme ci-dessus.
  - `scene.ts` : les loaders `postship`, `clipper` et `aether` pointent vers `../../demos/<p>/demo`.
  - Une démo exporte `mount(root, opts)` qui crée `fenetre3d` et sa machine à états. `progress(t)` appelle `f.phase(t)` et pose `scene.dataset.demo = f.enDemo ? 'on' : 'off'`.
  - **Le remontage au redimensionnement de `scene.ts` est retiré pour les démos** : elles gèrent l'échelle elles-mêmes. On ajoute `garderAuResize?: boolean` dans `SceneModule`, et `scene.ts` ne remonte que si ce champ est faux.

- [ ] **Step 4: Démo factice**

  Pour faire passer le premier test avant la Task 7, créer `src/demos/postship/demo.ts` minimal (3 couches vides) et `Fenetre.astro` avec 3 `div[data-couche]`.

- [ ] **Step 5: Tests et commit**

  Run: `npx playwright test tests/fenetre.spec.ts -g éclate`
  Expected: PASS.

  ```bash
  git add -A && git commit -m "Fenêtres 3D : arrivée en particules, vue éclatée, échelle, démo"
  ```

---

### Task 7: Démo PostShip

**Files:**
- Create: `src/demos/postship/{Fenetre.astro,tokens.css,donnees.ts,demo.ts}`, `public/produits/postship/{logo.svg,deploiement.svg,retour-arriere.svg,alerte.svg,parcours.svg,sonde-clients.mp4,sonde-clients.webm,sonde-clients.jpg}`
- Modify: `src/pages/index.astro` (`<SceneProduit>` + `<PostShipFenetre>`)
- Delete: `src/components/scenes/PostShip.astro`, `src/scenes/postship.ts`
- Test: `tests/postship.spec.ts`

**Interfaces:**
- Consumes: `fenetre3d`, `Chef`.
- Produces: DOM `[data-etat-demo]` ∈ `repos|pousse|verifie|panne|alerte|retour|retabli`, boutons `[data-action="pousser"|"retour"|"rejouer"]`, `[data-score]`, `[data-check]` × 6.

- [ ] **Step 1: Extrait vidéo**

  ```bash
  SRC=/c/Users/gilbe/Desktop/claude-projects/postship-video/render/v4/v4-FR-video.mp4
  ffmpeg -y -ss 2.2 -t 3.6 -i $SRC -vf "scale=960:-2,fps=30" -an -c:v libx264 -profile:v high -crf 28 -movflags +faststart -pix_fmt yuv420p public/produits/postship/sonde-clients.mp4
  ffmpeg -y -ss 2.2 -t 3.6 -i $SRC -vf "scale=960:-2,fps=30" -an -c:v libvpx-vp9 -b:v 0 -crf 40 public/produits/postship/sonde-clients.webm
  ffmpeg -y -ss 4.0 -i $SRC -frames:v 1 -vf scale=960:-2 -q:v 4 public/produits/postship/sonde-clients.jpg
  ```

  Vérifier à l'œil que l'extrait montre « Votre sonde — Tout va bien / Vos clients — Ne peuvent pas payer » ; sinon ajuster `-ss`. Taille totale ≤ 1,2 Mo.

- [ ] **Step 2: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  import { allerA, erreurs } from './aide';
  test('PostShip : pousser casse le paiement, revenir le répare', async ({ page }) => {
    const e = erreurs(page);
    await page.goto('/');
    await allerA(page, 'postship', 0.7);
    const s = page.locator('#postship');
    await s.locator('[data-action="pousser"]').click();
    await expect(s.locator('[data-check]').nth(4)).toContainText('500', { timeout: 5000 });
    await expect(s.locator('[data-score]')).toHaveText('60');
    await expect(s.locator('[role="status"]')).toContainText('#alertes');
    await s.locator('[data-action="retour"]').click();
    await expect(s.locator('[data-etat-demo]')).toHaveAttribute('data-etat-demo', 'retabli', { timeout: 5000 });
    await expect(s.locator('[data-score]')).toHaveText('100');
    await expect(s).toContainText('Rétabli en 3,8 s');
    expect(e).toEqual([]);
  });
  test('PostShip : se joue seul après inaction', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'postship', 0.7);
    await expect(page.locator('#postship [data-etat-demo]')).toHaveAttribute('data-etat-demo', 'retabli', { timeout: 15000 });
  });
  ```

- [ ] **Step 3: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/postship.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 4: `tokens.css`, `donnees.ts`, `Fenetre.astro`**

  - **`tokens.css`** : les valeurs de la spec § 2, sous `.ps { --ps-background: #000000; … }`, avec en tête le commentaire `/* Source : claude-projects/postship/src/app/globals.css (thème sombre) */`. Plus `--ps-radius-ctl: 7px; --ps-radius-carte: 6px; --ps-ease: cubic-bezier(0.22,1,0.36,1);`.
  - **`donnees.ts`** :
    - `CHECKS` : les 6 lignes `{ label, ok, ko? }` de la spec ;
    - `COMMIT = { sha: 'a1b2c3d', message: 'feat: nouveau checkout' }` ;
    - `RAIL = ['9f3c2e1', '4b1d7a0']` ;
    - `ALERTE = 'Message envoyé dans #alertes — /checkout répond 500 après « Payer » depuis a1b2c3d.'`
  - **`Fenetre.astro`**, couches `[data-couche]` :

    | Couche | `data-z` | Légende | Contenu |
    |---|---|---|---|
    | 1 | 60 | « Projets » | barre latérale 13 rem : logo SVG inline, « Rechercher… » `Ctrl K`, groupes Surveillance (actif, `--ps-sidebar-actif`), Alertes, Public, Paramètres |
    | 2 | 100 | « Espace de travail » | barre du haut de 56 px : « agence-onze › Boutique Corail », avatar en `--ps-signal` |
    | 3 | 140 | « Disponibilité » | URL mono `boutique-corail.fr`, « Tout va bien » (`text-2xl`), rangée de chiffres (Disponibilité 24 h 100 %, 7 jours 99,98 %, Incidents ouverts 0), frise de 24 barres `--ps-ok` |
    | 4 | 180 | « Ship Score · /100 » | `[data-score]` 3xl + « / 100 », deux colonnes « Vérifié sur ce ship » / « Pas encore vérifié » |
    | 5 | 220 | « 6 vérifications par déploiement » | en-tête de commit, `ol` de 6 `[data-check]` avec point d'état, libellé, valeur à droite, `[data-action="pousser"]` (bouton signal) |
    | — | 120 | — | hors fenêtre, visible seulement en vue éclatée : écran vidéo `<video muted loop playsinline preload="none" poster>` avec `<source>` webm et mp4, `aria-hidden` |
    | — | — | — | `[role="status"][aria-live="polite"]` pour l'alerte et les annonces |

    Bannière de panne + `[data-action="retour"]` « Remettre en ligne le précédent » ; rail ; `[data-action="rejouer"]`.
  - Polices : `.ps { font-family: 'Onest', system-ui, sans-serif; }`, code en `'JetBrains Mono'`. Le fichier importe `polices-produits.css`.

- [ ] **Step 5: `demo.ts`**

  - Machine à états avec `setTimeout` chaînés, annulés sur `destroy` et `rejouer` :
    - `pousser()` → `pousse` (commit affiché, 400 ms) → `verifie` : les checks passent un à un toutes les 300 ms, le 5ᵉ échoue → `panne` (flash : classe `.flash` 600 ms, score 100 → 60 animé, couleur danger) → 500 ms → `alerte` (statut, bannière) ;
    - `retour()` → `retour` (barre de progression 3,8 s accélérée à 1,2 s, rail) → `retabli` (score 100, « Rétabli en 3,8 s »).
  - Démo automatique : quand `f.enDemo` devient vrai et qu'il n'y a pas d'interaction en 2,5 s, `pousser()`, puis `retour()` 1,8 s après `alerte`. Un clic ou une touche dans la fenêtre annule l'automatique.
  - Vidéo : `play()` quand la vue éclatée commence (t > .15), `pause()` après .45. `preload` passe à `auto` quand la piste est à moins d'un écran.
  - Calme : chaque transition est instantanée et la vidéo n'est pas lue.
  - Sans particules (`chef` nul) : tout marche pareil.

- [ ] **Step 6: Lancer les tests**

  Run: `npx playwright test tests/postship.spec.ts tests/fenetre.spec.ts`
  Expected: PASS.

- [ ] **Step 7: Vérification visuelle**

  Captures à t = .1 (contour en particules), .3 (éclatée + vidéo), .7 (démo en panne), puis rétabli. Comparer à la planche `planche-postship-v4-reddit-16x9.png` et aux tokens : fond noir, `#ededed`, bordures `#333`, rayons 6–7 px.

- [ ] **Step 8: Commit**

  ```bash
  git add -A && git commit -m "Démo PostShip : vraie interface, vue éclatée, panne du paiement et retour arrière jouables"
  ```

---

### Task 8: Démo Clipper

**Files:**
- Create: `src/demos/clipper/{Fenetre.astro,tokens.css,donnees.ts,demo.ts,icones.ts}`, `public/produits/clipper/logo.svg`
- Modify: `src/pages/index.astro`
- Delete: `src/components/scenes/Clipper.astro`, `src/scenes/clipper.ts`
- Test: `tests/clipper.spec.ts`

**Interfaces:**
- Consumes: `fenetre3d`, `Chef.envoler`.
- Produces: `#clipper input[type=search]`, `[data-item]` (visibles = filtrés), `[data-action="afficher"]`, `[data-blocnotes]`, `[data-suggestion]`.

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  import { allerA, erreurs } from './aide';
  test('Clipper : chercher, révéler, coller', async ({ page }) => {
    const e = erreurs(page);
    await page.goto('/');
    await allerA(page, 'clipper', 0.7);
    const s = page.locator('#clipper');
    await s.locator('input[type="search"]').fill('facture');
    await expect(s.locator('[data-item]:visible')).toHaveCount(2);
    await s.locator('input[type="search"]').fill('');
    await s.locator('[data-item][data-type="secret"]').click();
    await s.locator('[data-action="afficher"]').click();
    await expect(s.locator('[data-apercu]')).toContainText('sk-');
    await s.locator('[data-item][data-type="code"]').click();
    await page.keyboard.press('Enter');
    await expect(s.locator('[data-blocnotes]')).toContainText('def ', { timeout: 3000 });
    expect(e).toEqual([]);
  });
  test('Clipper : se joue seul après inaction', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'clipper', 0.7);
    await expect(page.locator('#clipper [data-blocnotes]')).not.toBeEmpty({ timeout: 15000 });
  });
  ```

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/clipper.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: Données**

  `donnees.ts`, 14 éléments `{ id, type: 'texte'|'code'|'lien'|'image'|'fichier'|'couleur'|'secret'|'snippet', titre, contenu, ocr?, source, quand, langage? }`.
  - Facture : `fichier` « Facture-2026-031.pdf » (Explorateur, il y a 2 min).
  - Capture : `image` « Capture d’écran 2026-10-03 », OCR « FACTURE N° 2026-031 · Total 1 240,00 € » (Outil Capture, il y a 4 min).
  - Code : `code` python

    ```python
    def total(lignes):
        return sum(l.prix * l.qte for l in lignes)
    ```

    (VS Code, il y a 6 min).
  - Couleur : `couleur` `#ff6b5e` (Figma, il y a 9 min).
  - Lien : `lien` `https://github.com/titilyonnais/Clipper` (Chrome, il y a 12 min).
  - Secret : `secret` `sk-proj-7Hq2…` complet fictif `sk-proj-7Hq2vN9xLm4TbR8cWe1Za` (Terminal, il y a 15 min).
  - Contact : `texte` « Marie Durand — marie.durand@exemple.fr » (Outlook, il y a 21 min).
  - Snippet : `snippet` `;sig` « Thibault Morretton · créateur de logiciels ».
  - Six textes courts réalistes de plus : une adresse, une note, un numéro de suivi, une commande `npm run build`, « Réunion jeudi 14 h », un extrait de README.

  Recherche : `normaliser` (minuscules, sans accents) appliqué à titre + contenu + ocr ; « facture » ne doit trouver que le PDF et la capture.

- [ ] **Step 4: `icones.ts`, `tokens.css`, `Fenetre.astro`**

  - **`icones.ts`** : chemins SVG Lucide (Type, Code2, Link2, Image, FileText, Lock, Scissors, Search, X, ScanText, EyeOff, Pin), copiés depuis `node_modules/lucide-static` si présent, sinon depuis lucide.dev. Ce sont de courts tableaux de `d`.
  - **`tokens.css`** : spec § 2 (Clipper), avec la coloration syntaxique et le commentaire de source.
  - **`Fenetre.astro`**, couches :

    | Couche | `data-z` | Légende | Contenu |
    |---|---|---|---|
    | en-tête | 200 | « Recherche » | icône + `input type=search` (placeholder réel) + X + segments Historique (actif) / Snippets / Collections |
    | liste | lignes de 0 à 14 × 18 | « Historique · tout ce que vous copiez » | 360 px ; chaque ligne `[data-item data-type]` en bouton `role="option"` dans un `role="listbox"` ; tuile 28 px, titre, numéro mono 1–9 ; barre active ; vue éclatée : chaque ligne a son propre `data-z` |
    | aperçu | 100 | « Aperçu » | `[data-apercu]` : carte surface ; selon le type, code coloré (spans `.kw .str .num .fn .com .var`), pastille, carte lien, image recréée (rectangle `#fafafa` avec le texte de facture en mono gris, sans capture réelle) + carte « Texte reconnu », secret masqué + EyeOff + « Mot de passe, clé ou jeton détecté. Il reste collable. » + `[data-action="afficher"]` + badge « Sensible » |
    | pied | 60 | « Raccourcis » | `Entrée` « Coller dans Bloc-notes », `Maj` `Entrée` « Texte brut », `F1` Raccourcis |

    - Avant la fenêtre : trois touches `<kbd class="touche3d">` Ctrl / Maj / V (relief en `box-shadow` de démo + `translateZ`), enfoncées à t ≈ .08.
    - Bloc-notes `[data-blocnotes]` à droite de la fenêtre, dans le théâtre mais hors couches : titre « Sans titre — Bloc-notes », zone `pre`, police `ui-monospace` système (permis dans `src/demos/`).

- [ ] **Step 5: `demo.ts`**

  - **Saisie** : filtre en direct et surlignage `<mark>`. Les lignes visibles montent en cascade (`popup` stagger 20 ms, au plus 180 ms).
  - **Suggestions** `[data-suggestion]` « facture », « api », « #ff6b5e » : un clic tape le mot lettre par lettre, à 40 ms.
  - **Clavier** (seulement si `document.activeElement` est dans `#clipper .fenetre`) :
    - ↑ / ↓ : sélection ;
    - `Entrée` : coller ;
    - `Ctrl+1…9` : coller le n-ième ;
    - `Échap` : vider la recherche.

    Un `preventDefault` n'est appelé que dans ces cas.
  - **Coller** : `await chef?.envoler(ligne.getBoundingClientRect(), blocnotes.getBoundingClientRect(), '#ededed')`, puis le texte est ajouté au bloc-notes (frappe à 8 ms par caractère, instantanée en calme).
  - **Afficher** : révélation caractère par caractère (20 ms), le badge reste.
  - **Démo automatique** après 2,5 s : taper « facture », sélectionner la capture, attendre 1 s, vider, sélectionner le code, coller.

- [ ] **Step 6: Tests, vérification visuelle et commit**

  Run: `npx playwright test tests/clipper.spec.ts`
  Expected: PASS.

  Captures : les touches 3D, la pile éclatée, la recherche « facture », le collage.

  ```bash
  git add -A && git commit -m "Démo Clipper : fenêtre de collage rapide, recherche OCR, secret, collage en particules"
  ```

---

### Task 9: Démo ÆTHER

**Files:**
- Create: `src/demos/aether/{Fenetre.astro,tokens.css,donnees.ts,demo.ts,themes.ts}`, `public/produits/aether/icone.svg`
- Modify: `src/pages/index.astro`, `src/content/projets/aether.md` (Espaces)
- Delete: `src/components/scenes/Aether.astro`, `src/scenes/aether.ts`, `tests/aether.spec.ts` (remplacé)
- Test: `tests/aether.spec.ts` (réécrit)

**Interfaces:**
- Consumes: `fenetre3d`, `Chef`, `Draggable` + `InertiaPlugin` (déjà en dépendance GSAP).
- Produces: `#aether [data-intention]` (overlay), `[data-carte]`, `[data-espace]`, `[data-theme-choix]`, `#aether` `data-theme` ∈ `aurore|nebuleuse|braise|pulsar`, `[data-toile]` avec `--zoom`.

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  import { allerA, erreurs } from './aide';
  test('ÆTHER : intention, cartes, thème, zoom, glisser', async ({ page }) => {
    const e = erreurs(page);
    await page.goto('/');
    await page.keyboard.press('Control+k');                     // hors scène : rien
    await expect(page.locator('#aether [data-intention]')).toBeHidden();
    await allerA(page, 'aether', 0.7);
    const s = page.locator('#aether');
    await s.locator('[data-pilule]').click();
    await expect(s.locator('[data-intention]')).toBeVisible();
    await page.keyboard.type('compare rust et zig pour un jeu');
    await expect(s.locator('[data-interpretation]')).toContainText('Comparer « rust » et « zig »');
    await page.keyboard.press('Enter');
    await expect(s.locator('[data-carte]')).toHaveCount(4 + 6, { timeout: 4000 }); // 6 cartes de départ + 4
    await s.locator('[data-theme-choix="braise"]').click();
    await expect(s).toHaveAttribute('data-theme', 'braise');
    const z0 = await s.locator('[data-toile]').evaluate((t) => getComputedStyle(t).getPropertyValue('--zoom'));
    await s.locator('[data-zoom="+"]').click();
    const z1 = await s.locator('[data-toile]').evaluate((t) => getComputedStyle(t).getPropertyValue('--zoom'));
    expect(Number(z1)).toBeGreaterThan(Number(z0));
    const c = s.locator('[data-carte]').first();
    const a = await c.boundingBox();
    await c.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    expect((await c.boundingBox())!.x - a!.x).toBeGreaterThan(20);
    expect(e).toEqual([]);
  });
  test('ÆTHER : se joue seul après inaction', async ({ page }) => {
    await page.goto('/');
    await allerA(page, 'aether', 0.7);
    await expect(page.locator('#aether [data-carte]')).toHaveCount(10, { timeout: 15000 });
  });
  ```

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/aether.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: `tokens.css`, `themes.ts`, `donnees.ts`**

  - **`tokens.css`** : la spec § 2 (ÆTHER), plus `glass` et `glass-strong` en classes `.ae-glass` et `.ae-glass-fort`, avec le commentaire de source `aether-browser/src/renderer/src/styles/global.css`.
  - **`themes.ts`** : les 4 thèmes (Aurore boréale, Nébuleuse, Braise, Pulsar). Recopier les gradients exacts de `aether-browser/src/renderer/src/lib/backgroundPresets.ts` (lire le fichier pendant la tâche). Chaque thème a `{ id, nom, couleur, couches: string[] /* CSS background */, anime: boolean }`. Les couleurs littérales vont dans `tokens.css` sous forme de variables (`--ae-aurore-1`…), et `themes.ts` ne fait que référencer `var(--ae-…)` : la règle d'audit s'applique au TS.
  - **`donnees.ts`** :
    - Espaces :
      - `{ id: 'lisbonne', nom: 'Lisbonne', teinte: 24 }`
      - `{ id: 'rust', nom: 'Rust', teinte: 210 }`
      - `{ id: 'factures', nom: 'Factures', teinte: 158 }`
    - 6 cartes de départ, 2 par Espace : visitlisboa.com, tap.pt, doc.rust-lang.org, crates.io, impots.gouv.fr, pennylane.com. Chaque carte a un titre, une position et un `vivante`.
    - 4 cartes de l'intention (Espace Rust) : rust-lang.org « Rust », ziglang.org « Zig », bevyengine.org « Bevy », « Zig vs Rust pour un moteur de jeu » (forum ziggit.dev).
    - Les favicons sont des lettres en carré coloré (SVG inline) : pas d'images externes.

- [ ] **Step 4: `Fenetre.astro`**

  Section `#aether` avec `data-fond="aucun"` et `data-theme="aurore"`. Son fond est en DOM : `.ae-fond` absolu, couches du thème, dérive animée de 34 s, grain SVG `feTurbulence` à 1,6 %.

  Fenêtre 1180×720, couches :

  | Couche | `data-z` | Légende | Contenu |
  |---|---|---|---|
  | barre de titre | 200 | « Barre d’Intention » | Æ Instrument Serif, nom de l'Espace, `[data-pilule]` pilule d'intention avec placeholder réel et Kbd `Ctrl` `K`, bascule Focus / Toile (Toile active, `text-glacier`), bouton Muse lavande, boutons fenêtre |
  | Constellation | 120 | « Espaces » | 288 px, `bg-abyss/50` ; « ESPACES » ; 3 `[data-espace]` boutons avec point coloré à halo ; carte SVG des pages (cercles r = 9, lignes pleines et pointillées glacier) ; pied « N pages · N notes » |
  | Toile | 40 | « Toile » | `[data-toile]` grille de points 26 px × `--zoom`, `transform: translateZ(calc((var(--zoom) - 1) * 300px)) scale(var(--zoom))` ; zoom `glass rounded-xl` − % + « Tout cadrer » (`[data-zoom="-"|"+"|"cadrer"]`) |
  | cartes | une par carte | « Pages vivantes » | `[data-carte]` `role="button"` `aria-roledescription="carte déplaçable"` : 360×260 (échelle 0,62 dans la démo), sans vignette (dégradé hsl de l'Espace), favicon, titre, domaine en mono, point « vivante » pulsé |

  Hors couches :
  - overlay `[data-intention]` (`hidden` par défaut) : fond `void/55` + flou 7 px, panneau `glass-strong` rounded-2xl `min(660px, 92%)` ; input 17 px light avec le placeholder réel ; `[data-interpretation]` ; pied de raccourcis réels ;
  - sélecteur de thème : 4 `[data-theme-choix]` pastilles sous la fenêtre (en dehors de l'interface produit, style du site : mono, sans rayon, avec une pastille de la couleur du thème en carré).

- [ ] **Step 5: `demo.ts`**

  - **Intention** :
    - `Ctrl K` ne s'écoute que si `#aether` contient `document.activeElement` ou si la souris est au-dessus de la fenêtre et que la scène est en démo ;
    - la pilule ouvre aussi ;
    - interprétation en direct : contient « compare » + deux mots → « Comparer « A » et « B » », Wand2 lavande ; une URL → « Naviguer vers… » ; sinon « Rechercher « … » » ;
    - `Entrée` : fermeture, puis les 4 cartes apparaissent aux positions libres de l'Espace Rust, avec le ressort GSAP `elastic.out(1, 0.75)` 0,6 s, `scale .965 → 1`, opacité binaire (règle site : pas de fondu gris, l'opacité des démos est permise) et 25 ms d'écart ; une nouvelle étoile dans la Constellation.
  - **Toile** :
    - glisser le fond = déplacement ;
    - `Ctrl` + molette ou pincement (deux pointeurs) = zoom de 0,25 à 2 vers le curseur ;
    - « Tout cadrer » = zoom et position englobant les cartes, 340 ms, ease-out cubique.
  - **Cartes** : `Draggable` + inertie, bornes dans la toile ; flèches au clavier, 16 px, avec la WeakMap `cibles` reprise de la v1 `src/scenes/aether.ts:116-137`.
  - **Espace** : clic → les cartes des autres Espaces passent `data-attenue` (opacité .35, permise dans les démos), le nom dans la barre de titre change.
  - **Thème** : clic → `#aether[data-theme]` ; transition de 900 ms (fondu croisé de deux couches `.ae-fond`) ; `chef` reçoit la teinte du thème pour les particules ambiantes de la station (`aether-fenetre` : teinte du thème actif).
  - **Démo automatique** (2,5 s) : ouvrir la barre, taper la phrase à 35 ms par caractère, `Entrée`, « Tout cadrer », thème Nébuleuse puis retour à Aurore.

- [ ] **Step 6: Contenu**

  `aether.md` : remplacer chaque « intention(s) » utilisée pour les groupes par « Espace(s) ». Garder « Barre d'Intention » pour la barre. Relire `src/content/projets/aether.md` en entier.

- [ ] **Step 7: Tests, vérification visuelle et commit**

  Run: `npx playwright test tests/aether.spec.ts`
  Expected: PASS (bureau et mobile ; sur mobile, le test du glisser utilise le clavier, comme en v1).

  Captures : fond Aurore, vue éclatée, barre d'intention ouverte, 4 thèmes.

  ```bash
  git add -A && git commit -m "Démo ÆTHER : Toile en 3D, Barre d’Intention, Espaces et thèmes jouables"
  ```

---

### Task 10: Études de cas aux couleurs des produits et passage entre pages

**Files:**
- Create: `src/lib/particules/passage.ts`
- Modify: `src/pages/projets/[slug].astro`, `src/components/cas/Figure.astro`, `src/components/cas/Schema.astro`, `src/content/projets/postship.md` (illustrations), `src/lib/particules/chef.ts`, `src/styles/base.css` (retirer `visuel-*`)
- Copy: `public/produits/postship/{deploiement,retour-arriere,alerte,parcours}.svg`
- Test: `tests/cas.spec.ts`

**Interfaces:**
- Consumes: `Chef`, `Moteur.impulsion`, `tokens.css` de chaque démo.
- Produces :

  ```ts
  // passage.ts
  export type Passage = { x: number; y: number; t: number; graine: number; teinte: string; vers: string };
  export function ecrirePassage(p: Passage): void;            // sessionStorage 'passage'
  export function lirePassage(chemin: string): Passage | null; // consommé une fois, ignoré après 4 s
  ```

- [ ] **Step 1: Écrire le test**

  ```ts
  import { test, expect } from '@playwright/test';
  test('étude de cas : univers du produit et logo en particules', async ({ page }) => {
    await page.goto('/');
    await page.locator('#aether a[href="/projets/aether/"]').click();
    await page.waitForURL('**/projets/aether/');
    await expect(page.locator('body')).toHaveClass(/univers-aether/);
    await page.waitForFunction(() => window.__particules?.station === 'cas-logo');
    await expect(page.locator('main')).not.toContainText(/3 intentions/);
  });
  test('PostShip : vraies illustrations', async ({ page }) => {
    await page.goto('/projets/postship/');
    await expect(page.locator('img[src$="deploiement.svg"]')).toBeVisible();
  });
  ```

- [ ] **Step 2: Lancer, vérifier l'échec**

  Run: `npx playwright test tests/cas.spec.ts --project=bureau`
  Expected: FAIL.

- [ ] **Step 3: Page d'étude de cas**

  - `body class={`univers-${id}`}` passé par `Base.astro` (nouvelle prop `univers?: string`).
  - L'univers importe le `tokens.css` du produit et `polices-produits.css`. Les variables du site `--bg` et `--fg` sont redéfinies par l'univers : PostShip et Clipper `#000` / `#ededed`, ÆTHER `void` / `ink`. Accent `--accent` : `#8fb0dc` / `#ededed` / `#a9c9ec`.
  - Les titres passent à la police du produit (Onest ou Instrument Serif italique). Le texte courant reste en Mona Sans pour la lecture, la mono reste IBM Plex Mono.
  - Ouverture : une `section data-station="cas-logo" data-forme={id} data-teinte=…` de 90 svh, avec le nom et la phrase. La plaque tramée est supprimée.
  - ÆTHER : fond Aurore statique sur l'ouverture (`.ae-fond` sans animation au-delà de 100 svh).
  - `Figure.astro` : variantes de style par univers (terminal PostShip en tokens ps, lignes Clipper avec tuiles, cartes ÆTHER en verre).
  - `Schema.astro` : traits et nœuds en `--accent` et `--fg` de l'univers.
  - PostShip : insérer les 4 illustrations SVG dans les sections 02 et 03, en `<img>` avec `alt` descriptif.

- [ ] **Step 4: Passage**

  - Sur l'accueil, au clic d'un lien `/projets/…` (délégation sur `document`, sauf touches de modification), dans l'ordre :
    1. `e.preventDefault()` ;
    2. `chef.eclater(cx, cy, 3200)` ;
    3. `ecrirePassage({ x: cx, y: cy, t: performance.timeOrigin + performance.now(), graine, teinte, vers: href })` ;
    4. après 260 ms, `location.href = href`.

    Avec la View Transition racine (fondu de 150 ms dans `base.css`, qui remplace `vt-deroule`), la navigation reste un vrai lien : sans JS, il fonctionne.
  - Sur la page d'arrivée, `lirePassage` : le moteur démarre avec un nuage explosé (positions = cercle de rayon `R ∝ âge`, autour de `(x, y)`, à partir de la `graine`), puis le chef vise `cas-logo`. Le retour « Retour à l'accueil » fait pareil dans l'autre sens et vise la station de l'ancre (`#postship` → `postship-fenetre`).
  - Retirer `view-transition-name: visuel-*` et les règles `visuel-*` de `base.css`.

- [ ] **Step 5: Tests, vérification visuelle et commit**

  Run: `npx playwright test tests/cas.spec.ts tests/smoke.spec.ts`
  Expected: PASS (`smoke` : la boucle « Suivant » et le retour arrière marchent toujours).

  Captures des 3 ouvertures et d'une page entière par produit.

  ```bash
  git add -A && git commit -m "Études de cas aux couleurs des produits, passage en particules entre les pages"
  ```

---

### Task 11: Versions de secours, nettoyage, tests complets, mise en ligne

**Files:**
- Modify: `tests/calme.spec.ts`, `tests/smoke.spec.ts`, `playwright.config.ts`, `src/layouts/Base.astro` (noscript), `scripts/og.mjs` + `public/og.png`, `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§ écarts), `src/pages/og.astro`
- Delete: tout code mort restant (`src/scenes/outils.ts` si plus utilisé, `SceneProjet.astro`, `src/scenes/methode.ts` si remplacé)
- Test: `tests/calme.spec.ts`, `tests/secours.spec.ts`

**Interfaces:**
- Consumes: tout.
- Produces: branche `v2` fusionnée dans `main`, déployée.

- [ ] **Step 1: Écrire les tests de secours**

  ```ts
  // tests/secours.spec.ts
  import { test, expect } from '@playwright/test';
  test('sans WebGL : logos SVG et démos jouables', async ({ page }) => {
    await page.addInitScript(() => {
      const o = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error test
      HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : o.call(this, t, ...a); };
    });
    await page.goto('/');
    await expect(page.locator('.hero .repli').first()).toBeVisible();
    await page.locator('#postship').scrollIntoViewIfNeeded();
    await page.locator('#postship [data-action="pousser"]').click();
    await expect(page.locator('#postship [data-score]')).toHaveText('60', { timeout: 5000 });
  });
  test('sans JavaScript : contenu lisible', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('.pre')).toBeHidden();
    await expect(page.locator('#postship [data-check]').first()).toBeVisible();
  });
  ```

  `calme.spec.ts` : réécrire pour la v2.
  - Préchargeur absent ; `__particules.running` faux.
  - Pistes non collantes (comme en v1).
  - PostShip : un clic sur pousser donne directement l'état `alerte`, sans délai.
  - Clipper : saisir « facture » donne 2 éléments ; ÆTHER : pilule, `Entrée`, puis 10 cartes.
  - L'adresse e-mail tient dans la largeur.

- [ ] **Step 2: Lancer, vérifier l'échec, implémenter**

  Run: `npx playwright test tests/secours.spec.ts tests/calme.spec.ts`

  Corriger ce qui échoue :
  - `noscript` : `.pre { display: none }`, fenêtres `visibility: visible` ;
  - `.repli` visibles en `html[data-particules='off']` ;
  - démos sans `chef` ;
  - délais à 0 en calme.

- [ ] **Step 3: Nettoyage**

  - Rechercher les imports morts (`npx astro check`, `grep -r "dither\|Couture\|SceneProjet" src tests`).
  - Supprimer le code mort.
  - Mettre à jour `DESIGN.md`, et le § « Écarts décidés » de la spec v2 avec tout écart réel pris pendant l'implémentation.

- [ ] **Step 4: OG image**

  `og.astro` : le nuage n'est pas capturable par l'outil OG. On compose donc les 3 logos SVG en couleur sur noir, avec « Thibault Morretton · créateur de logiciels » et la phrase du hero, puis on lance `npm run og` contre le serveur preview (port 4322) et on l'arrête ensuite.

- [ ] **Step 5: Suite complète**

  Run :

  ```bash
  npm run audit && npm run test:audit && npm run build && npm run budget && npx playwright test
  ```

  Expected: tout vert (bureau et mobile).

- [ ] **Step 6: Relecture finale**

  Une relecture indépendante de toute la branche (agent frais) : fidélité aux produits (tokens et textes comparés aux sources), accessibilité, performance, copie française. Corriger les constats.

- [ ] **Step 7: Fusion et mise en ligne**

  ```bash
  git checkout main && git merge --no-ff v2 -m "Portfolio v2 : particules, vraies interfaces, démos jouables" && git push origin main
  gh run watch --exit-status $(gh run list --branch main --limit 1 --json databaseId -q '.[0].databaseId')
  BASE_URL=https://titilyonnais.github.io npx playwright test tests/smoke.spec.ts
  ```

  Expected: déploiement vert ; smoke en ligne vert.
