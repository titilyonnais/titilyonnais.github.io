# Portfolio Thibault Morretton — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** construire et publier sur `https://titilyonnais.github.io/` le
portfolio monochrome à scènes défilées décrit dans la spec.

**Architecture :** Astro en sortie statique, multi-pages (accueil + 3 études
de cas en content collection). Une couche `lib/motion` (Lenis +
ScrollTrigger) donne à chaque scène une progression de 0 à 1 ; chaque scène
est un module isolé qui construit une timeline GSAP en pause. Un **seul**
canvas WebGL fixe, posé au-dessus du contenu (`pointer-events: none`),
dessine toute la trame 1-bit : la plaque du hero et les coutures entre
sections, décrites par des rectangles DOM passés en uniformes.

**Tech Stack :** Astro 7, TypeScript, GSAP 3.15 (ScrollTrigger, Draggable,
InertiaPlugin), Lenis 1.3, WebGL 1 natif, Playwright 1.63, GitHub Actions +
Pages.

**Spec :** `docs/superpowers/specs/2026-10-02-portfolio-design.md`

## Global Constraints

- Couleurs : `--ink: #000000`, `--paper: #F4F4F2`, rien d'autre en CSS. Pas de gris en aplat, pas d'`opacity` intermédiaire pour faire du gris (0 ou 1 seulement).
- Polices : `Mona Sans` (variable `wght` 200–900, `wdth` 75–125) et `IBM Plex Mono` 400, auto-hébergées dans `public/fonts/`.
- `border-radius: 0` partout ; aucun `linear-gradient` / `radial-gradient`, `box-shadow`, `filter: blur`, `backdrop-filter`.
- Texte en français, sans superlatifs ; aucun chiffre ni aucune fonction absents des sources (README, DESIGN.md, CLAUDE.md, journal PostShip).
- `prefers-reduced-motion: reduce` → aucune scène épinglée ; `progress(1)` appliqué ; tout le contenu reste.
- Tout le texte des scènes existe en HTML ; le décor animé est en `aria-hidden="true"`.
- JS de l'accueil ≤ 120 Ko gzippé au total.
- Repo public `titilyonnais/titilyonnais.github.io`, branche `main`, déploiement GitHub Pages par Actions.

## Écarts assumés par rapport à la spec

Ils sont décidés ici et reportés dans la spec à la tâche 11.

1. **View Transitions entre documents** (`@view-transition { navigation: auto; }`) au lieu de `<ClientRouter />`. Chaque page est un vrai chargement : pas de cycle de vie à rejouer pour Lenis, ScrollTrigger ou WebGL, et un repli naturel (navigation normale) dans les navigateurs qui ne les gèrent pas.
2. **Méthode** : les mots passent de **contour** (`-webkit-text-stroke`) à **plein**, au lieu de « gris tramé → encre ». C'est du 1-bit pur, sans gris CSS.
3. **Repli sans WebGL** : le `<h1>` du hero devient visible en Mona Sans et les coutures deviennent des coupes nettes. Pas de second moteur en canvas 2D (YAGNI).
4. **Coutures** en trame de demi-teinte (des points qui grossissent, comme écrit dans la spec) ; le hero en Bayer 8×8.
5. **Image Open Graph** générée par un script Playwright et versionnée, au lieu d'être générée au build.

## Review Focus

1. **Redimensionnement / rotation mobile pendant une scène épinglée** : la scène doit se recalculer (positions des cartes ÆTHER, hauteur des listes), sans décalage ni saut. Test : Playwright redimensionne de 1440 à 390 au milieu de la page, puis vérifie qu'aucune erreur console n'apparaît et que le contact reste atteignable.
2. **Retour arrière du navigateur depuis une étude de cas** : la scène doit revenir dans le bon état à la position restaurée. Test : aller sur `/projets/clipper/` depuis l'accueil, revenir, vérifier que `#clipper` est en vue sans erreur.
3. **Polices pas encore chargées au premier rendu du hero** : le masque du nom doit être re-rasterisé une fois `document.fonts` prêt. Test : vérifier que le canvas a bien redessiné après `document.fonts.ready` (attribut `data-mask-ready`).
4. **Tactile sur la toile ÆTHER** : glisser une carte ne doit pas bloquer le défilement en dehors des cartes. Test : en mobile, un `scroll` sur la toile hors carte fait défiler la page.
5. **Onglet en arrière-plan** : le rAF du moteur de trame s'arrête (`document.hidden`) ; aucune boucle quand rien de tramé n'est visible. Test : `window.__dither.running` vaut `false` quand on est en bas de page.

---

### Task 1 : socle Astro, tokens, polices, DESIGN.md et audit anti-slop

**Files :**
- Create : `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/styles/tokens.css`, `src/styles/base.css`, `public/fonts/*.woff2`, `DESIGN.md`, `scripts/audit-design.mjs`, `src/pages/index.astro` (minimal)

**Interfaces :**
- Produces : variables CSS `--ink`, `--paper`, `--fg`, `--bg` ; classes `.ink` / `.paper` (fond et texte d'une section) ; familles `--sans: 'Mona Sans'`, `--mono: 'IBM Plex Mono'` ; échelle `--t-xs … --t-mega`.

- [ ] Installer `astro`, `gsap`, `lenis`, `@astrojs/sitemap`, `@astrojs/check`, `typescript`, `@playwright/test`.
- [ ] Copier `mona-sans-latin-standard-normal.woff2` et `mona-sans-latin-ext-standard-normal.woff2` (depuis `@fontsource-variable/mona-sans`) et `ibm-plex-mono-latin-400-normal.woff2`, puis déclarer les `@font-face` (`font-weight: 200 900; font-stretch: 75% 125%`).
- [ ] Écrire `scripts/audit-design.mjs` : il lit tous les `.css`, `.astro` et `.ts` sous `src/` et échoue (code 1, avec fichier:ligne) sur `border-radius:` non nul, `gradient(`, `box-shadow`, `blur(`, `backdrop-filter`, et sur toute couleur littérale (`#hex`, `rgb(`, `hsl(`) hors de `tokens.css`. Test d'abord : un fichier piégé dans `scripts/fixtures/` doit faire échouer l'audit (`node scripts/audit-design.mjs scripts/fixtures` → exit 1), puis `src/` doit passer.
- [ ] `npm run build` OK, `npm run audit` OK. Commit.

### Task 2 : gabarit, navigation, contenus, pages squelettes, tests de fumée

**Files :**
- Create : `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Fleche.astro`, `src/content.config.ts`, `src/content/projets/{postship,clipper,aether}.md`, `src/pages/projets/[slug].astro`, `playwright.config.ts`, `tests/smoke.spec.ts`

**Interfaces :**
- Produces : la collection `projets` avec le schéma `{ ordre, nom, slug, phrase, etat, version?, debut, liens: {label, href}[], faits: string[], stack: string[], suivant, fonctions: Fonction[], architecture: {noeuds, liens} }` ; `Base.astro` avec les props `{ title, description, path }`.

- [ ] Tests de fumée d'abord : `/`, `/projets/postship/`, `/projets/clipper/` et `/projets/aether/` répondent 200, avec un `h1` non vide et zéro erreur console ; la nav contient 4 liens.
- [ ] Implémenter le gabarit, la nav (`mix-blend-mode: difference`) et les 3 fichiers de contenu rédigés à partir des sources.
- [ ] Tests verts. Commit.

### Task 3 : couche de mouvement

**Files :**
- Create : `src/lib/motion/index.ts`, `src/lib/motion/scene.ts`, `tests/calme.spec.ts`

**Interfaces :**
- Produces :
  - `type SceneHandle = { progress(t: number): void; destroy(): void; interactive?(on: boolean): void }`
  - `type SceneModule = { mount(root: HTMLElement, opts: { mobile: boolean }): SceneHandle }`
  - `registerScene(root: HTMLElement, load: () => Promise<SceneModule>, opts: { pin: number /* écrans */ })`
  - `prefersCalm(): boolean`
- Comportement : import dynamique quand la section est à moins d'un écran ; ScrollTrigger `pin` + `scrub` ; en mode calme, `progress(1)` sans pin ; remontage sur changement de largeur (débounce 200 ms).

- [ ] Test d'abord : en `reducedMotion: 'reduce'`, chaque `[data-scene]` reçoit `data-state="final"` et aucun `.pin-spacer` n'existe.
- [ ] Implémenter. Commit.

### Task 4 : moteur de trame, hero, coutures

**Files :**
- Create : `src/lib/dither/engine.ts`, `src/lib/dither/shader.ts`, `src/lib/dither/mask.ts`, `src/components/Hero.astro`, `src/components/Couture.astro`, `tests/trame.spec.ts`

**Interfaces :**
- Produces : `window.__dither = { running: boolean }` (lecture pour les tests) ; `<Couture de="ink" vers="paper" />` ; `[data-dither="plate"]` sur la plaque du hero.

- [ ] Tests d'abord :
  - le canvas existe et `data-mask-ready="1"` après le chargement des polices ;
  - avec `--disable-webgl`, le `h1` du hero devient visible et `data-dither="off"` est posé sur `<html>` ;
  - en bas de page, `__dither.running === false`.
- [ ] Shader : uniformes `u_res`, `u_time`, `u_dpr`, `u_plate` (rect), `u_mask` (texture), `u_expo`, `u_mouse`, `u_lens`, `u_seams[4]` (rect + sens), `u_ink`, `u_paper`. Mode plaque : Bayer 8×8 ; mode couture : demi-teinte en cellules de 7 px CSS, rayon = f(position dans la couture).
- [ ] Commit.

### Task 5 : Méthode, À propos, Contact

**Files :**
- Create : `src/components/Methode.astro`, `src/components/APropos.astro`, `src/components/Contact.astro`, `src/scenes/methode.ts`, `src/scenes/contact.ts`, `tests/contact.spec.ts`

- [ ] Test d'abord : un clic sur l'e-mail écrit `tmorretton@gmail.com` dans le presse-papiers (permission `clipboard-read`) et affiche « Copié » ; le lien `mailto:` est présent.
- [ ] Implémenter : les mots de la méthode passent de contour à plein avec la progression ; le contact varie `font-stretch` par lettre selon la distance au curseur, dans un rAF, désactivé en mode calme ou sur pointeur grossier.
- [ ] Commit.

### Task 6 : scène PostShip

**Files :** Create : `src/components/scenes/PostShip.astro`, `src/scenes/postship.ts`

- [ ] Temps : `git push` tapé → filet du pipeline → fil de fer monté → balayage et vérifications cochées → coupure (`200 OK` à gauche) → paiement en bruit 1-bit (canvas 2D, seuil de hachage déterministe) puis inversé → score 100 → 86 → 71 → « Retour au dernier déploiement vérifié bon » → 100.
- [ ] Test (dans `calme.spec.ts`) : en mode calme, le score affiché vaut `100` et les 6 vérifications sont listées en HTML.
- [ ] Commit.

### Task 7 : scène Clipper

**Files :** Create : `src/components/scenes/Clipper.astro`, `src/scenes/clipper.ts`

- [ ] Temps : 5 éléments qui tombent → `facture` tapé et filtrage (repli en hauteur des éléments non trouvés, soulignement des correspondances) → clé `sk-live-…` brouillée de façon déterministe puis `••••••••`.
- [ ] Test (mode calme) : la recherche affiche `facture` et l'élément secret affiche `••••••••`.
- [ ] Commit.

### Task 8 : scène ÆTHER et toile manipulable

**Files :** Create : `src/components/scenes/Aether.astro`, `src/scenes/aether.ts`, `tests/aether.spec.ts`

- [ ] Tests d'abord : en mode calme, glisser une carte de 120 px la déplace (bbox changée) ; la flèche droite après focus la décale de 16 px ; en mobile, un défilement sur la toile hors carte fait défiler la page.
- [ ] Temps : 30 lamelles → détachement et bascule → 3 groupes sur la toile pointillée. À `progress === 1`, `interactive(true)` active Draggable + Inertia (bornes = la toile) ; quand on remonte sous 1, les cartes reviennent et le glisser est désactivé.
- [ ] Commit.

### Task 9 : études de cas

**Files :** Create : `src/components/cas/{EnTete,Fonction,Schema,Faits}.astro`, `src/scenes/figures.ts` ; Modify : `src/pages/projets/[slug].astro`

- [ ] Figures pilotées par les données : `terminal` (lignes tapées), `touches` (touches qui s'enfoncent), `liste` (éléments qui entrent), `bascule` (état A ↔ B). Jouées une seule fois à l'entrée dans l'écran ; état final en mode calme.
- [ ] Schéma d'architecture en SVG : nœuds rectangulaires et filets tracés via `stroke-dashoffset`.
- [ ] `view-transition-name` partagé entre le visuel final de la scène et l'en-tête de l'étude de cas ; titre animé de `wdth` 75 à 125 via `::view-transition-new`.
- [ ] Test : la navigation « Suivant » boucle PostShip → Clipper → ÆTHER → PostShip ; le bouton retour ramène à l'accueil sans erreur.
- [ ] Commit.

### Task 10 : SEO, image OG, favicon, budget

**Files :** Create : `public/favicon.svg`, `public/og.png`, `public/robots.txt`, `scripts/og.mjs`, `scripts/budget.mjs`, `src/pages/og.astro` (exclu du sitemap, `noindex`)

- [ ] `scripts/budget.mjs` : la somme gzip des `.js` chargés par `dist/index.html` (y compris les imports dynamiques des scènes) doit être ≤ 120 Ko, sinon échec.
- [ ] Commit.

### Task 11 : CI, repo public, Pages, vérification en ligne

**Files :** Create : `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md` ; Modify : la spec (écarts)

- [ ] `gh repo create titilyonnais/titilyonnais.github.io --public`, push, puis activer Pages en mode `workflow`.
- [ ] Attendre le déploiement, ouvrir `https://titilyonnais.github.io/`, relancer les tests de fumée contre l'URL en ligne (`BASE_URL=…`), puis lancer Lighthouse mobile.
- [ ] Revue finale de toute la branche par un relecteur indépendant.
