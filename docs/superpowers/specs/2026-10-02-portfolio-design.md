# Portfolio de Thibault Morretton — conception

Date : 2026-10-02 · Statut : validé en conversation, à relire

## 1. Intention

Remplacer l'ancien portfolio (`titilyonnais/Portfolio`, « futur développeur
front-end », cartes Lorem ipsum) par un site qui présente Thibault comme
**créateur de logiciels**. Il fabrique des SaaS et des applications, et il
le fait avec l'IA. C'est assumé, mais ce n'est pas un argument de vente.

- **Public prioritaire** : les utilisateurs potentiels de ses produits. Le
  site sert de hub et donne de la crédibilité à PostShip, Clipper et ÆTHER.
- **Langue** : français seul.
- **Projets montrés** : PostShip (vedette), Clipper, ÆTHER. Rien d'autre :
  ni projets clients, ni labo. Les satellites de PostShip n'apparaissent
  que dans son étude de cas.
- **Contact** : `tmorretton@gmail.com` et `github.com/titilyonnais`.
- **Personnel** : nom et courte bio. Pas de photo, pas de ville.
- **Réussite** : un visiteur comprend en moins de 10 s ce que Thibault
  fabrique, retient au moins une scène, et clique vers un produit. Le site
  ne ressemble à aucun portfolio généré.

## 2. Direction visuelle : « une imprimerie numérique »

Tout repose sur une seule matière, la **trame 1-bit**, faite de points noirs
ou blancs et de rien d'autre. Elle porte le hero, les transitions entre
sections et les textures des scènes.

### Règles (reprises dans `DESIGN.md` à la racine du repo)

1. **Deux valeurs** : `--ink: #000000` et `--paper: #F4F4F2`. Les gris
   n'existent que dans la trame, par densité de points, jamais en aplat.
   Interdits : dégradé, flou, `backdrop-filter`, halo, ombre portée.
2. **Typographie** :
   - **Mona Sans** (variable, axes graisse et largeur) pour tout le texte.
     Titres en 400–500, `letter-spacing: -0.04em`. L'axe de largeur
     s'anime (condensé → large) quand un titre entre à l'écran.
   - **IBM Plex Mono** pour ce qui est littéralement technique : versions,
     commandes, stack, libellés de scène.
   - Pas de troisième fonte. Les deux sont auto-hébergées (sous-ensemble
     latin).
3. **Grille à 12 colonnes**, visible par moments sous forme de filets de
   1 px pendant les scènes (repères de maquette).
4. **Rayon 0** partout.
5. **Interdits** : fade-up par bloc, cartes arrondies, icônes décoratives,
   emoji, gradient text, bento grid, badges « Nouveau », témoignages,
   compteurs qui défilent, formules creuses (« révolutionnez »,
   « let's build something amazing »).
6. **Le mouvement raconte le produit, ou il n'existe pas.** Chaque
   animation représente un fait réel du produit.
7. **Le texte est écrit comme on parle**, sans superlatifs. Aucune fonction
   ni aucun chiffre inventé.
8. **Une panne se montre par inversion** (bloc papier sur fond encre, ou
   l'inverse), jamais par une couleur.
9. **Version calme complète** : avec `prefers-reduced-motion: reduce`, tout
   est posé dans son état final. On retire le mouvement, jamais le contenu.

### Alternance des fonds

Les sections alternent encre et papier. On passe de l'une à l'autre par un
**balayage en trame** piloté par le défilement : les points grossissent
jusqu'à recouvrir l'écran de la couleur suivante.

## 3. Page d'accueil

| # | Section | Fond | Épinglage |
|---|---------|------|-----------|
| 0 | Ouverture | encre | non (hauteur 100svh) |
| 1 | Méthode | papier | non |
| 2 | PostShip | encre | ≈ 400vh |
| 3 | Clipper | papier | ≈ 300vh |
| 4 | ÆTHER | encre | ≈ 300vh, puis interactif |
| 5 | À propos | papier | non |
| 6 | Contact | encre | non |

### 0 · Ouverture

- **Intro (< 1 s)** : l'écran est noir, puis la trame « se développe »
  (le seuil descend) comme un tirage photo. Ce n'est pas un loader.
- **THIBAULT MORRETTON** est dessiné par la densité des points. Le texte
  est rasterisé dans une texture qui sert de masque au shader.
- **Loupe au curseur** : un disque où la trame change d'échelle et de
  seuil, avec un amorti. Désactivée sur pointeur grossier (tactile).
- Sous le nom : « Je fabrique des logiciels. » et, en mono,
  `PostShip · Clipper · ÆTHER`. Le `<h1>` est un vrai texte HTML,
  visuellement masqué derrière le canvas, mais lisible par les lecteurs
  d'écran et les moteurs de recherche.
- Au défilement : balayage en trame vers le papier.

### 1 · Méthode

Trois phrases. Brouillon : « J'écris la spec. Claude Code écrit le code. Je
relis, je teste, je publie. » Les mots passent de gris tramé à encre pleine
au rythme du défilement (progression de lecture, un mot à la fois).

### 2 · Scène PostShip

1. `git push origin main` se tape en mono. Le filet du pipeline se trace :
   `build → en ligne`.
2. Une page en fil de fer se monte. Une ligne de balayage la parcourt
   « comme un visiteur ». À droite, les vérifications se cochent dans
   l'ordre : HTTP, Ressources, Indexabilité, Carte sociale, Sitemap,
   Certificat.
3. **L'angle mort** : l'écran se coupe en deux. À gauche, « Monitoring
   classique » affiche `200 OK`. À droite, le bloc paiement se désagrège en
   bruit de trame et s'inverse. PostShip signale : « La page répond, mais
   le bouton de paiement a disparu. »
4. **Ship Score** : grand chiffre en Mona Sans large. Il descend par
   paliers liés aux vérifications (100 → 71), puis revient à 100 quand le
   correctif passe.
5. Sortie : les faits (§ 6), `postship.fr ↗`, « Étude de cas → ».

### 3 · Scène Clipper

1. Une palette Clipper stylisée (angles vifs). Les éléments copiés y tombent
   un à un : une phrase, du code (coloration traduite en graisses et
   italique), un lien, une image tramée, un fichier.
2. `facture` se tape dans la recherche ; la liste se filtre lettre par
   lettre, avec les correspondances soulignées.
3. Une clé `sk-live-…` arrive : ses caractères se brouillent puis
   deviennent `••••••••`, étiquette « Secret masqué, exclu de la
   recherche ».
4. Sortie : `v3.6.0 · 11 versions · Rust · Tauri 2 · 100 % local`,
   Releases ↗, Étude de cas →.

### 4 · Scène ÆTHER

1. Une barre de navigateur saturée de 30 onglets réduits à des lamelles.
2. Au défilement, les onglets se détachent, basculent et deviennent des
   cartes (le titre de l'onglet devient celui de la carte).
3. Les cartes se posent sur une toile pointillée, en 3 groupes autour
   d'intentions : *Préparer Lisbonne*, *Apprendre Rust*, *Factures*.
4. Fin de l'épinglage : les cartes deviennent **déplaçables** (souris,
   doigt, inertie ; flèches du clavier après focus). Indication en mono :
   `glissez les cartes`.
5. Sortie : `v0.98.0 · 100 versions en 5 semaines · Electron · local
   d'abord`, Releases ↗, Étude de cas →.

### 5 · À propos

Bio écrite à partir de faits uniquement. Brouillon validé :

> J'ai commencé par le HTML et le CSS, en refaisant des maquettes. Puis
> l'IA a changé l'échelle de ce qu'une personne seule peut construire.
> Aujourd'hui j'écris les specs, je pilote Claude Code, je relis et je
> teste. Et je publie des logiciels entiers : un SaaS en production, une
> app Windows en Rust, un navigateur.

Dessous : la méthode en mono (`spec → plan → code → tests → release`) et
les outils réellement utilisés (Claude Code, TypeScript, Rust, Next.js,
Tauri, Electron, Supabase, Stripe, Swift).

### 6 · Contact

- `tmorretton@gmail.com` en très grand. Chaque lettre s'élargit selon la
  distance au curseur (axe de largeur).
- Un clic copie l'adresse (retour « Copié », annoncé via `aria-live`), avec
  un lien `mailto:` à côté, plus GitHub ↗.
- Pied de page en mono : « Fait avec Astro, un shader de quelques Ko et
  Claude Code · mis à jour le <date du build> ».

### Navigation

- Une ligne fixe en mono : `Thibault Morretton` à gauche ;
  `PostShip  Clipper  ÆTHER  Contact` à droite.
- Elle s'inverse selon le fond survolé (`mix-blend-mode: difference`).
- Pas de menu hamburger. Sur mobile, les liens passent sur une seconde
  ligne.

### Mobile

Mêmes scènes, épinglages raccourcis (≈ 60 % de la hauteur bureau), pas de
loupe. La toile ÆTHER reste manipulable au doigt (`touch-action` géré pour
ne pas bloquer le défilement hors des cartes).

## 4. Études de cas (`/projets/postship/`, `/projets/clipper/`, `/projets/aether/`)

### Transition depuis l'accueil

View Transitions d'Astro (`<ClientRouter />`). L'état final de la scène
(fil de fer, palette, toile) porte un `view-transition-name` partagé avec
l'en-tête de l'étude de cas. Le titre s'étire de condensé à large. Retour
arrière : le mouvement inverse.

### Gabarit commun

1. **En-tête** : le nom en très grand, une phrase sur ce que fait le
   produit, puis en mono l'état, les dates et les liens.
2. **Le problème** : un paragraphe.
3. **Ce que ça fait** : 3 ou 4 fonctions, chacune avec une mini-animation
   recréée (déclenchée à l'entrée dans l'écran, une seule fois).
4. **Comment c'est construit** : schéma d'architecture en SVG monochrome
   et choix techniques expliqués.
5. **Les chiffres vrais**, posés en typo.
6. **Ce que j'en ai appris** : quelques lignes, marquées « à relire » pour
   Thibault.
7. **Suivant →** vers l'étude de cas suivante (PostShip → Clipper → ÆTHER
   → PostShip).

### Contenu spécifique

- **PostShip** : écosystème (CLI, API `psk_`, GitHub Action
  `postship-check`, console iOS) ; architecture VM Oracle Paris → Caddy →
  Next.js 15 + worker de vérifications, Supabase (Postgres, RLS, UE),
  Stripe, Resend ; Vercel en secours sans trafic.
- **Clipper** : collage rapide Win+V et `Ctrl+1…9`, file de collage,
  snippets à variables, OCR Windows hors ligne, détection de secrets, mode
  incognito, IA facultative (Ollama local, Claude, OpenAI) ;
  architecture Tauri 2 (Rust + WebView2), React, SQLite FTS5.
- **ÆTHER** : navigateur sans onglets (intentions, cartes, toile spatiale,
  espaces), Muse (IA hybride, local d'abord) ; Electron, SQLite, mises à
  jour automatiques publiées par GitHub Actions.

Sources du texte : README, `DESIGN.md`, `CLAUDE.md` et specs de chaque
repo. Aucune fonction ni aucun chiffre absent de ces sources.

## 5. Architecture technique

**Pile** : Astro (sortie statique), GSAP + ScrollTrigger, Lenis, WebGL 1
natif (sans Three.js), TypeScript strict.

```
src/
  pages/            index.astro · projets/[slug].astro
  content/projets/  postship.md · clipper.md · aether.md   (schéma Zod)
  layouts/          Base.astro (nav, ClientRouter, polices, meta)
  scenes/           hero/ · postship/ · clipper/ · aether/
  lib/
    dither/         moteur de trame partagé
    motion/         Lenis + ScrollTrigger, reduced-motion, cycle de vie
  styles/           tokens.css · base.css
public/fonts/       MonaSans[wdth,wght].woff2 · IBMPlexMono-Regular.woff2
DESIGN.md
```

### Contrats

- **Scène** : `mount(root: HTMLElement): { progress(t: number): void; destroy(): void }`.
  Une scène ne connaît pas les autres. Elle reçoit sa progression
  (0 → 1) depuis `lib/motion` et doit pouvoir être affichée dans son état
  final en appelant `progress(1)` (utilisé par la version calme).
- **Moteur de trame** (`lib/dither`) : un seul contexte WebGL plein écran
  (`position: fixed`, derrière le contenu), qui dessine selon l'état
  courant : hero (masque texte + loupe), balayage (progression + sens) ou
  rien. Matrice de Bayer 8×8, taille de point en pixels CSS × DPR. Le
  rendu s'arrête (`requestAnimationFrame` coupé) quand rien de tramé n'est
  visible ou que l'onglet est caché.
- **Repli** : sans WebGL → même algorithme en canvas 2D, à basse
  résolution. En cas d'échec → image tramée statique générée au build.
- **Chargement** : chaque scène est importée dynamiquement quand sa
  section arrive à moins d'un écran (`IntersectionObserver`).

### Données

`content/projets/*.md` : frontmatter validé par Zod (`nom`, `phrase`,
`etat`, `version`, `dates`, `liens`, `faits[]`, `stack[]`, `suivant`) et
corps Markdown pour les sections rédigées. Les chiffres sont saisis à la
main, à partir des relevés du 2026-10-02 :

| Projet | Faits |
|---|---|
| PostShip | 1 224 commits (31 août → 2 oct. 2026) · 383 fichiers de tests · 276 migrations SQL · Stripe en production depuis le 24 sept. 2026 · VM Oracle gratuite à Paris |
| Clipper | v3.6.0 · 11 versions · Rust + TypeScript |
| ÆTHER | v0.98.0 · 100 versions en 5 semaines · 122 commits |
| postship-check | v1.5.1 · 6 versions |
| Console iOS | v1.1.30 · 14 versions · Swift |

## 6. Qualité

### Performance

- Accueil : JS ≤ 120 Ko gzippé au total (GSAP compris), dont rien de
  bloquant au premier rendu en dehors du moteur de trame.
- Polices : 2 fichiers `woff2` préchargés, `font-display: swap`.
- Cibles Lighthouse mobile : Performance ≥ 90, Accessibilité 100,
  Bonnes pratiques 100, SEO 100.

### Accessibilité

- La version calme est complète (§ 2, règle 9).
- Tout le texte des scènes existe en HTML réel ; le décor animé est en
  `aria-hidden="true"`.
- Navigation complète au clavier, focus visible (contour 2 px de la
  couleur opposée au fond).
- Les cartes d'ÆTHER se déplacent aussi aux flèches.

### Tests

- **Playwright** :
  - chaque page se charge sans erreur console ;
  - en `reducedMotion: 'reduce'`, chaque scène affiche son texte final ;
  - liens internes et externes, copie de l'e-mail ;
  - drag d'une carte ÆTHER ;
  - captures de référence (1440 × 900 et 390 × 844).
- **Audit anti-slop** (`scripts/audit-design.mjs`, en CI) : échoue sur tout
  `border-radius` non nul, `linear-gradient` / `radial-gradient`,
  `box-shadow`, `filter: blur`, `backdrop-filter`, couleur littérale
  autre que les deux tokens, police autre que les deux familles.
- `astro check` pour le typage.

## 7. Mise en ligne

- Nouveau repo **public** `titilyonnais/titilyonnais.github.io`, développé
  dans `C:\Users\gilbe\Desktop\claude-projects\portfolio`.
- GitHub Actions : `ci.yml` (check, audit, Playwright) sur les PR ;
  `deploy.yml` (build + `actions/deploy-pages`) sur `main`.
- URL : `https://titilyonnais.github.io/`. Le repo `Portfolio` n'est pas
  touché : il reste servi sous `/Portfolio/`.
- Métadonnées : titre, description, image Open Graph tramée générée au
  build, `sitemap.xml`, `robots.txt`, favicon monogramme tramé.

## 8. Écarts décidés à l'implémentation

1. **Transitions entre documents** (`@view-transition { navigation: auto }`)
   au lieu de `<ClientRouter />` : chaque page est un vrai chargement, sans
   cycle de vie à rejouer pour Lenis, ScrollTrigger et WebGL. La page
   suivante se déroule de haut en bas (`clip-path`), sans fondu.
2. **Méthode** : les mots passent de contour à plein, au lieu d'un gris
   tramé. C'est du 1-bit pur.
3. **Trame dans le flux** : le hero a son canvas WebGL, et les coutures sont
   des demi-teintes en canvas 2D, calculées une fois. Pas de calque fixe
   superposé, qui décalerait d'une image au défilement natif.
4. **Scènes en `position: sticky`** plutôt qu'épinglées par ScrollTrigger :
   aucun décalage de mise en page quand une scène se charge à la demande.
5. **Sans WebGL** : le nom s'écrit en toutes lettres. Pas de second moteur
   en canvas 2D.
6. **Image Open Graph** générée par `scripts/og.mjs` et versionnée.
7. **Études de cas** : l'en-tête reprend le moteur de trame avec le nom du
   produit ; le visuel de la scène y voyage par View Transition.

## 9. Hors périmètre

- Version anglaise, blog, formulaire de contact, analytics, mode clair ou
  sombre au choix, captures réelles, vidéos, curseur personnalisé, écran de
  chargement à compteur.
