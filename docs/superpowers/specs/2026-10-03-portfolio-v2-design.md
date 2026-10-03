# Portfolio v2 — particules, vraies interfaces, démos jouables

Date : 2026-10-03 · Statut : validé en conversation, à relire
Remplace, pour le hero, les coutures, les scènes produits et les études de
cas, la conception du 2026-10-02 (`2026-10-02-portfolio-design.md`). Tout ce
que cette spec ne mentionne pas reste comme dans la v1.

## 1. Intention

Retour de Thibault sur la v1 : le site est bon, mais

- les scènes produits n'utilisent pas les vrais designs, interfaces,
  couleurs et assets des produits ;
- le hero ne plaît pas du tout : trop plat, trop statique, et l'esthétique
  trame/points ne lui plaît pas ;
- les animations sont « des trucs au scroll », sans 3D, sans rien qui
  marque.

**Réussite v2** :

- un visiteur reconnaît chaque produit à l'écran comme s'il l'avait ouvert ;
- il joue au moins une démo ;
- le hero donne l'effet d'un site de studio (références : Awwwards / Lusion
  / Active Theory, pages produit Apple).

Le reste du site reste noir et blanc. Le public, la langue, les projets
montrés et le contact restent ceux de la v1.

### Décisions prises en conversation

| Sujet | Décision |
|---|---|
| Hero | Particules massives formant les 3 logos en métamorphose |
| Curseur | Souffle / répulsion avec inertie, onde de choc au clic |
| Sortie du hero | Les particules deviennent la scène suivante (une seule toile pour tout le site) |
| Couleur des particules | Teinte de chaque produit ; Clipper en blanc pur |
| Texte du hero | Nom en petit + phrase « Trois logiciels en service. D'autres en route. » |
| Préchargeur | Oui : compteur 0→100 réel, < 1,5 s, sauté aux visites suivantes |
| Couleurs produits | Fidèles, mais la mise en scène fait briller ce qui est coloré |
| Scènes produits | Démos jouables + fenêtres 3D + transitions WebGL |
| Polices produits | Vraies polices, uniquement dans les fenêtres recréées |
| Trame | Supprimée partout (hero, coutures, plaques, favicon) |
| Assets réutilisés | Logos SVG, illustrations PostShip, extrait de la vidéo PostShip v4 FR |
| Profondeur des démos | Un scénario guidé par produit |
| Son | Aucun |
| Méthode / À propos / Contact | Habités par la même toile de particules |
| Mobile | Pleine puissance (avec garde-fou automatique) |
| Études de cas | Aux couleurs du produit, ouverture en particules |
| Moteur | Astro 7 + GSAP + Three.js (architecture A) |
| Poids | Spectaculaire d'abord ; budget JS porté à 350 Ko gzip |

## 2. Inventaire des vrais assets (sources)

Toutes les valeurs ci-dessous sont copiées des dépôts. Chaque `tokens.css`
de démo cite le fichier source en commentaire.

### PostShip — `claude-projects/postship`

- **Tokens** (`src/app/globals.css`, thème sombre par défaut) :

  | Token | Valeur |
  |---|---|
  | `background` | `#000000` |
  | `foreground` | `#ededed` |
  | `card` | `#0f0f0f` |
  | `popover` | `#1a1a1a` |
  | `secondary` / `muted` | `#242424` |
  | `muted-foreground` | `#a1a1a1` |
  | `subtle-foreground` | `#868686` |
  | `border` | `#333333` |
  | `line` | `#2a2a2a` |
  | `sidebar-actif` | `#1c1c1c` |
  | `signal` | `#8fb0dc` (seul accent ; un CTA par écran) |
  | `ok` | `#4a9e70` |
  | `warn` | `#b09134` |
  | `danger` | `#d9635a` |

  Les états s'affichent en paires teintées (`bg-ok/10 text-ok`).
- **Rayons** : contrôles 7 px (4 px en xs), cartes 6 px, 8 px maximum.
- **Mouvement** : `--ease: cubic-bezier(0.22,1,0.36,1)`, 180 / 320 ms.
- **Polices** : Onest (graisse ≤ 500, titres `-0.02em`), JetBrains Mono
  pour URL, SHA et chemins. Les chiffres sont en Onest `tabular-nums`.
- **Logo** : deux chevrons, `public/logo-icon.svg` (viewBox `20 20 196 160`).
- **Illustrations** : `public/illustrations/{alerte,deploiement,page-vs-serveur,parcours,retour-arriere,statut}.svg`.
- **Vidéo** : `postship-video/render/v4/v4-FR-video.mp4`. Les couleurs de
  la vidéo sont plus vives : ok `#5fd49a`, ko `#ff6b5e`.
- **Textes de la démo** (`src/components/marketing/pieces/demo.tsx`) :
  - commit `a1b2c3d` « feat: nouveau checkout » ;
  - « La page répond » 200 · 312 ms ;
  - « Le contenu attendu est là » trouvé ;
  - « Le certificat tient » 71 jours ;
  - « Le sitemap est sain » 148 URLs, 0 morte ;
  - « Le paiement passe » **500 après « Payer »** ;
  - « La page reste indexable » index.
- **Ship Score** :
  - couleur : ≥ 90 ok, ≥ 70 warn, sinon danger ;
  - poids des critères : Pages de paiement 40, Indexabilité 30, Visibilité
    IA 25, Ressources déclarées 25, DNS 20, Budget de performance 15, Rendu
    visuel 15, Carte de partage 15, Certificat 10, Hygiène du site 10,
    Autres pages 10.
- **Cadre de l'app** (`src/components/marketing/app/cadre-app.tsx`) :
  - barre latérale de 13 rem, « Rechercher… » avec `Ctrl K` ;
  - barre du haut de 56 px, « agence-onze › Boutique Corail » ;
  - groupes de menu Surveillance, Alertes, Public, Paramètres.

### Clipper — `claude-projects/clipper/loopy-clipboard`

- **Tokens** (`src/styles.css`, thème sombre) :

  | Token | Valeur |
  |---|---|
  | `background` | `#000000` |
  | `surface` | `#0f0f0f` |
  | `popover` | `#141414` |
  | `muted` | `#1c1c1c` |
  | `secondary` | `#242424` |
  | `line` | `#2a2a2a` |
  | `border` | `#333333` |
  | `foreground` | `#ededed` |
  | `muted-foreground` | `#a1a1a1` |
  | `subtle-foreground` | `#868686` |
  | `selected` | `#1f1f1f` |
  | `danger` | `#d9635a` |
  | `ok` | `#4a9e70` |
  | `warn` | `#b09134` |

  Aucune couleur d'accent.
- **Coloration syntaxique** (sombre) : mot-clé `#ff8a80`, chaîne
  `#9ecbff`, nombre `#79b8ff`, fonction `#d2a8ff`, commentaire `#7d7d7d`
  en italique, variable `#ffab70`.
- **Rayons** : 7 / 4 / 6 / 8 px ; tuiles d'icône 5 px.
- **Polices** : Onest (≤ 500), JetBrains Mono.
- **Logo** : `assets/logo.svg` (carré arrondi + trois lignes) et
  `public/clipper.svg`.
- **Fenêtre de collage rapide** :
  - 820×520 ;
  - en-tête de 56 px : recherche « Rechercher, ou tapez l'abréviation
    d'un snippet… » et segments Historique | Snippets | Collections ;
  - liste de 360 px, lignes compactes (tuile 28 px, barre active de 2 px,
    numéros 1–9 en mono 11 px) ;
  - aperçu dans une carte `surface` ;
  - pied de 40 px : `Entrée` « Coller dans {App} », `Maj` `Entrée`
    « Texte brut », `F1` Raccourcis.
- **Animations** : `popup-in` 280 ms `cubic-bezier(0.16,1,0.3,1)`
  (translateY 6 px, scale .99) ; les lignes de la liste montent en
  cascade, 20 ms d'écart, 180 ms maximum.
- **Textes réels** :
  - « Contenu sensible masqué » ;
  - « Mot de passe, clé ou jeton détecté. Il reste collable. » / « Afficher » ;
  - badge « Sensible » (warn) ;
  - « Texte reconnu » (OCR) ;
  - états vides « Aucun résultat » / « Essayez d'autres mots. ».
- **Raccourci** : `Ctrl+Maj+V` par défaut (`Win+V` proposé à l'accueil).

### ÆTHER — `Desktop/aether-browser`

- **Tokens** (`src/renderer/src/styles/global.css`) :

  | Token | Valeur |
  |---|---|
  | `void` | `#060608` |
  | `abyss` | `#0a0a10` |
  | `mist` | `#101018` |
  | `veil` | `#16161f` |
  | `ink` | `#e9e9f2` |
  | `ink-dim` | `#9a9ab0` |
  | `ink-faint` | `#7c7c98` |
  | `glacier` | `#a9c9ec` |
  | `lavande` | `#b3a4e6` |
  | ease fluide | `cubic-bezier(0.22,1,0.36,1)` |

- **Verre** :
  - `glass` : fond blanc 3 %, bordure blanc 7 %, `blur(24px) saturate(1.25)` ;
  - `glass-strong` : glacier 9 % dans `rgb(14 14 22/.86)`, `blur(36px)` et
    une grande ombre.
- **Polices** : Inter Variable, Instrument Serif (italique, pour le Æ et
  les titres), JetBrains Mono.
- **Couleurs des Espaces** (`hsl(h 45% 72%)`) : 210 Glacier, 262 Lavande,
  158 Émeraude, 24 Ambre, 318 Rose, 44 Doré, 0 Corail, 190 Cyan.
- **Thèmes de fond** (`lib/backgroundPresets.ts`), pour la démo :
  Aurore boréale `#6ee7c8` (animé), Nébuleuse `#c14fd6`, Braise `#e6883d`,
  Pulsar `#8ab4f8` (animé). Le fond ambiant est composé de deux halos
  radiaux (glacier 5 %, lavande 4,5 %) et d'un grain à 1,6 %.
- **Carte** :
  - 360×260, rayon 16 px, fond `mist`, bordure blanc 8 % ;
  - ombre `0 18px 70px -24px rgba(0,0,0,.85)`, sélection en glacier 40 % ;
  - sans vignette : `linear-gradient(155deg, hsl(h 26% 13%), hsl(h 20% 7%))`,
    favicon de 30 px et domaine en mono ;
  - pied : favicon de 15 px, titre 12,5 px, domaine en mono 10 px ;
  - ressort à l'entrée : 300 / 32, scale .965, 25 ms d'écart.
- **Toile** :
  - grille de points blanc 5 %, pas de 26 px ;
  - zoom de 0,04 à 3 ;
  - « Tout cadrer » ;
  - état vide « Une toile vide, prête à recevoir vos pensées. ».
- **Barre d'Intention** :
  - `glass-strong`, rayon 16 px, `min(660px, 92vw)` ;
  - placeholder « Une adresse, une recherche, une intention… » ;
  - interprétations « Naviguer vers… », « Rechercher « … » »,
    « Comparer « A » et « B » » ;
  - pied « ⏎ ouvrir · ⇧⏎ carte sur la toile · Ctrl⏎ forcer la recherche ».
- **Barre de titre** :
  - 44 px, Æ en Instrument Serif 16 px ;
  - pilule d'intention « Exprimez une intention — naviguer, chercher,
    penser… » avec `Ctrl K` ;
  - bascule Focus | Toile.
- **Constellation** : 288 px, titre « ESPACES », points de couleur avec
  halo, carte des pages en SVG.
- **Correction de vocabulaire** : les cartes sont rangées par **Espaces**.
  L'« intention » est ce qu'on tape dans la Barre d'Intention. La v1 dit
  « 3 intentions » : c'est faux, à corriger partout (scène, contenu de
  l'étude de cas).

## 3. Direction visuelle v2

### Règles du site (mise à jour de `DESIGN.md`)

1. Hors fenêtres produits, il n'y a que deux valeurs : `--ink #000000` et
   `--paper #F4F4F2`. Les gris n'existent que par densité de particules.
2. **La trame 1-bit disparaît.** La matière commune du site devient la
   **particule** : un point lumineux sur noir, encre sur papier.
3. Mona Sans et IBM Plex Mono restent les polices du site.
4. **Exception produits** : à l'intérieur de `src/demos/**`, les rayons,
   ombres, flous, dégradés et couleurs sont permis s'ils reproduisent le
   vrai produit. Les couleurs littérales ne vivent que dans
   `src/demos/<produit>/tokens.css`.
5. **La couleur est réservée aux produits.** Elle apparaît dans les
   particules qui forment un logo produit, dans les fenêtres, et dans le
   fond de la scène ÆTHER (thème Aurore). Jamais ailleurs.
6. Les règles de la v1 restent : français soigné (’, espaces fines
   insécables), chiffres sourcés, pas d'emoji, l'échec montré par le
   produit lui-même.

## 4. Le moteur de particules

Une seule toile WebGL2 (Three.js), en `position: fixed`, plein écran,
derrière le DOM (`z-index: 0`, `pointer-events: none`). Le DOM est
transparent par-dessus.

### Simulation (GPGPU)

- Deux textures flottantes ping-pong, **position** et **vitesse**, en
  512×256 (131 072 particules). Une texture de **cible** (xyz) et une
  texture de **couleur** cible sont écrites par le chef d'orchestre.
- **Forces par image** :
  - ressort vers la cible (raideur `k`, amortissement `c`, réglés par
    station) ;
  - bruit de courbure 3D (curl noise), d'intensité variable ;
  - souffle du curseur : répulsion dans un rayon d'environ 140 px CSS,
    décroissance douce, proportionnelle à la vitesse du curseur ;
  - onde de choc au clic ou au toucher : anneau qui s'étend à environ
    1 400 px/s et donne une impulsion radiale ;
  - « explosion » : impulsion globale depuis un point, utilisée entre deux
    formes et entre deux pages.
- **Métamorphose A → B** : la cible bascule. Pendant 0,6 s, le bruit de
  courbure monte et le ressort mollit, puis tout se resserre. Chaque
  particule a un retard propre (0 à 0,25 s) pour que la forme se recompose
  en vague, pas d'un bloc.

### Rendu

- Points (`gl.POINTS`) de 1 à 2,2 px × dpr. La taille dépend légèrement de
  la profondeur, l'éclat de la vitesse.
- Mélange additif sur fond noir, normal (encre) sur papier.
- Caméra en perspective calée pour qu'à z = 0, une unité = un pixel CSS.
  Une particule peut ainsi se poser exactement sur le contour d'un élément
  HTML (`getBoundingClientRect`).
- Parallaxe : le nuage pivote de ±4° suivant la souris (amorti), ou
  suivant l'orientation sur mobile quand elle est disponible sans
  permission.
- La couleur de fond (noir ou papier) est peinte par la toile. Les
  sections du DOM sont transparentes.

### Cibles (`cibles.ts` + Worker)

- **Sources** : chemin SVG (logos), texte (police chargée, rendu dans un
  `OffscreenCanvas`), rectangle ou contour d'un élément du DOM, champ
  diffus (À propos).
- **Échantillonnage** : rasterisation, puis tirage pondéré des pixels
  pleins. Les bords sont favorisés (×2) pour que la forme soit nette.
  Profondeur aléatoire ±12 px pour le volume.
- Le calcul se fait dans un Web Worker. Le résultat (`Float32Array` xyz,
  dans l'espace de la forme) est mis en cache en mémoire par clé
  (`forme@taille`).
- Les particules en surplus (si la forme en demande moins) se dispersent
  en poussière autour, à 15 % d'éclat.

### Chef d'orchestre (`chef.ts`)

- Les sections déclarent des **stations** dans le HTML :

  ```html
  <section data-station="postship-fenetre" data-fond="ink" data-teinte="#8fb0dc">
  ```

- Le chef observe la position de scroll (ScrollTrigger) et, pour la
  station active :
  - écrit la cible (forme + placement en pixels écran, recalculés au
    redimensionnement) ;
  - choisit la teinte, le fond, la raideur et l'intensité du bruit ;
  - déclenche les **vagues de bascule** noir ↔ papier : une bande dense de
    particules monte, et la couleur de fond bascule derrière son front.
- **API pour les démos** :

  ```ts
  particules.eclater(x, y, force)
  particules.envoler(deRect, versRect, teinte)
  particules.poser(rect)
  ```

### Garde-fou et cycle de vie

- La toile mesure le temps par image. Sous 40 images par seconde pendant
  2 s, elle descend d'un palier (512×256 → 384×192 → 256×128). Elle ne
  remonte pas dans la même visite.
- La boucle s'arrête quand l'onglet est caché.
- `webglcontextlost` → mode sans WebGL (§ 9).
- Expose `window.__particules = { frames, palier, station, running }`
  pour les tests.

## 5. Préchargeur et hero

### Préchargeur

- Il est en HTML et CSS inline dans `Base.astro`, donc visible avant tout
  JavaScript : écran noir, compteur `000` en IBM Plex Mono en bas à gauche.
- Le compteur suit les vraies étapes, pondérées :

  | Étape | Poids |
  |---|---|
  | polices du site | 20 |
  | module Three.js | 40 |
  | cibles des 3 logos | 30 |
  | premier rendu | 10 |

  Il s'anime vers la valeur atteinte, jamais au-delà.
- À 100, le texte du compteur est échantillonné comme première cible. Le
  DOM du compteur s'efface au moment exact où les particules prennent sa
  place, puis elles s'élancent vers les chevrons PostShip.
- **Durée** : elle est fixée par le vrai chargement, avec un plafond
  d'attente de 3 s. Au-delà, le site s'affiche quand même et les
  particules arrivent quand elles sont prêtes.
- Un indicateur `sessionStorage` marque le préchargeur comme vu. Il est
  sauté aux navigations suivantes de la session.

### Hero (fond noir)

- **Boucle de métamorphose**, environ 4 s par logo :

  | Logo | Teinte |
  |---|---|
  | chevrons PostShip | `#8fb0dc` |
  | glyphe Clipper | `#ededed` (blanc pur produit) |
  | Æ d'ÆTHER (dessiné en Instrument Serif) | dégradé glacier `#a9c9ec` → lavande `#b3a4e6` sur l'axe x |

- Les logos font environ 46 % de la hauteur d'écran et sont centrés
  légèrement à droite sur ordinateur, centrés au-dessus du texte sur
  mobile.
- **Texte** (DOM, net, blanc) :
  - en haut à gauche, en mono `--t-xs` : « Thibault Morretton · créateur
    de logiciels » ;
  - en bas à gauche, en Mona Sans très grand, sur deux lignes : « Trois
    logiciels en service. » / « D'autres en route. » ;
  - à droite, aligné sur le logo, le nom du produit dans sa propre police
    et sa phrase courte. Il change avec la métamorphose (fondu et
    décalage de 8 px). C'est un lien vers `#<produit>` ;
  - le sommaire 01–03 reste en pied.
- `h1` = « Thibault Morretton, créateur de logiciels ».
- **Interaction** : souffle et onde de choc (§ 4). La boucle se met en
  pause tant que le curseur souffle, et reprend 1,5 s après.
- **Sortie** : dès que le scroll quitte le hero, la boucle s'arrête. Le
  nuage glisse vers le bas avec la page et se pose sur le contour de la
  fenêtre PostShip (station `postship-fenetre`).

## 6. Scènes produits

### Principe commun (`fenetre3d.ts`)

- Chaque scène est une piste épinglée (sticky, comme en v1) qui contient
  une fenêtre produit en HTML dans un conteneur
  `perspective: 1600px`.
- **Phases pilotées par le scroll** :

  | Progression | Phase |
  |---|---|
  | 0 → 0,15 | Arrivée : les particules dessinent le contour de la fenêtre, puis l'interface apparaît (fondu de 300 ms) pendant que les particules se dissipent en poussière autour. |
  | 0,15 → 0,45 | Vue éclatée : la fenêtre s'incline (rotateX ≈ 14°, rotateY ≈ −18°) et ses couches se séparent en Z (60 à 220 px). Chaque couche porte une légende en mono, dans le style du site. |
  | 0,45 → 0,55 | Réassemblage : la fenêtre revient presque de face (rotateX 4°). |
  | 0,55 → 0,95 | Démo : la fenêtre est jouable. Le scroll ne pilote plus la démo, il la laisse vivre. Une invite en mono indique l'action. |
  | 0,95 → 1 | Départ : la fenêtre se dissout en particules (chef : `eclater`), qui partent former le logo du produit suivant. |

- **Inclinaison à la souris** : ±6° amortis sur la fenêtre, seulement
  quand elle est de face.
- **La démo n'est jamais obligatoire.** Le visiteur qui ne joue pas voit
  une démonstration automatique : après 2,5 s sans interaction en phase
  démo, le scénario se joue seul. Toute interaction reprend la main.
- **Sortie vers l'étude de cas** : les liens « Étude de cas », les faits
  et les liens produits restent sous la fenêtre (`.sortie` de la v1).
- **Mobile** :
  - la fenêtre est mise à l'échelle pour tenir dans la largeur ;
  - la vue éclatée est réduite (Z ÷ 2) ;
  - les démos marchent au toucher.

### PostShip (`src/demos/postship/`) — fond noir, teinte `#8fb0dc`

- **Fenêtre** : le cadre de l'app.
  - Barre latérale avec le logo, « Rechercher… » `Ctrl K` et les groupes
    Surveillance (actif), Alertes, Public, Paramètres.
  - Barre du haut « agence-onze › Boutique Corail ».
  - Contenu :
    - l'URL en mono ;
    - le statut « Tout va bien » ;
    - la rangée de chiffres (Disponibilité 24 h, 7 jours, Incidents
      ouverts) ;
    - la frise des 24 barres ;
    - le panneau « Ship Score du dernier déploiement ».
- **Couches éclatées** :

  | Couche | Légende |
  |---|---|
  | barre latérale | « Projets » |
  | barre du haut | « Espace de travail » |
  | frise 24 h | « Disponibilité » |
  | Ship Score | « Ship Score · /100 » |
  | panneau des vérifications | « 6 vérifications par déploiement » |

  Un écran flottant joue l'**extrait vidéo** v4 FR « Votre sonde — Tout va
  bien / Vos clients — Ne peuvent pas payer » (environ 5 s, boucle
  muette, `playsinline`, image d'attente ; chargé quand la piste est à
  moins d'un écran).
- **Démo** (machine à états `repos → pousse → verifie → panne → alerte → retour → retabli`) :
  1. Le bouton « git push » (seul bouton en `signal`) affiche le commit
     `a1b2c3d` « feat: nouveau checkout ».
  2. Les 6 vérifications passent une à une (300 ms chacune) avec leurs
     vrais textes. La 5ᵉ, « Le paiement passe », tombe : « 500 après
     « Payer » » en `danger`, avec un flash rouge discret sur la ligne.
  3. Le Ship Score chute de 100 à **60**, en rouge : on retire les 40
     points des pages de paiement, avec le vrai poids et le vrai seuil.
  4. Le message glisse : « Message envoyé dans #alertes — /checkout répond
     500 après « Payer » depuis a1b2c3d. »
  5. La bannière « Le dernier déploiement de production a cassé. Vous
     pouvez remettre en ligne le précédent. » s'affiche avec le bouton
     « Remettre en ligne le précédent ».
  6. Au clic, le rail passe de `9f3c2e1` à `4b1d7a0` (barre de
     progression), puis « Rétabli en 3,8 s » en `ok`. Le score remonte à
     100, en vert.
  7. « Rejouer » remet à zéro.
- **Annonces** : `aria-live="polite"` à chaque étape.

### Clipper (`src/demos/clipper/`) — fond noir, teinte blanche

- **Entrée** : avant la fenêtre, trois touches 3D `Ctrl` `Maj` `V`
  (DOM, avec relief) apparaissent et s'enfoncent. La fenêtre jaillit
  ensuite de la profondeur avec la courbe de `popup-in`.
- **Fenêtre** : la fenêtre de collage rapide (§ 2), en 820×520, à
  l'échelle de l'écran.
- **Couches éclatées** : la liste se déploie en profondeur, une ligne par
  plan (14 plans, 18 px d'écart), légendée « Historique · tout ce que vous
  copiez ». Puis l'en-tête « Recherche », l'aperçu « Aperçu » et le pied
  « Raccourcis ».
- **Données** : environ 14 éléments réalistes.
  - Facture PDF « Facture-2026-031.pdf ».
  - Capture contenant le texte « FACTURE N° 2026-031 · Total 1 240,00 € »,
    avec « Texte reconnu ».
  - Code Python coloré.
  - Couleur `#ff6b5e` avec sa pastille.
  - Lien `https://github.com/titilyonnais/Clipper`.
  - Clé masquée.
  - Adresse e-mail fictive « Marie Durand ».
  - Snippet `;sig`, etc.

  Chaque élément porte une source et une date relative (« Copié depuis
  Chrome · il y a 3 min »).
- **Démo** :
  - la recherche est un vrai `<input>`. Suggestions cliquables :
    « facture », « api », « #ff6b5e ». Le filtrage porte sur le contenu
    et le texte OCR, avec surlignage ;
  - flèches haut/bas et survol pour sélectionner (barre active animée,
    aperçu mis à jour) ;
  - sur la clé : badge « Sensible » et bouton « Afficher », qui révèle la
    clé caractère par caractère ;
  - `Entrée`, clic ou `Ctrl+1…9` : l'élément « s'envole ». Le chef envoie
    des particules blanches du rectangle de la ligne vers un bloc-notes
    flottant à droite (DOM simple, police mono système, titre « Sans
    titre — Bloc-notes »), où le texte apparaît ;
  - le pied affiche « Coller dans Bloc-notes ».
- **Couleurs en vedette** : coloration syntaxique, pastille de couleur,
  badge `warn`.

### ÆTHER (`src/demos/aether/`) — fond coloré, teinte glacier → lavande

- **Fond de la scène** : à l'entrée de la piste, la vague de bascule
  apporte le thème **Aurore boréale**, recréé en CSS dans le DOM de la
  scène : couches radiales et linéaires, animation de dérive de 34 s, et
  grain en SVG `feTurbulence` à 1,6 %. Les particules passent en mélange
  normal et prennent les teintes glacier et lavande.
- **Fenêtre** : 1180×720 à l'échelle, fond `void` et verre.
  - Barre de titre : Æ, nom de l'Espace, pilule d'intention, bascule
    Focus | Toile (Toile active), bouton Muse lavande.
  - Constellation à gauche : « ESPACES » avec 3 Espaces (Lisbonne ·
    Ambre, Rust · Glacier, Factures · Émeraude), chacun avec son point de
    couleur, et la carte des pages en SVG.
  - La Toile au centre : grille de points et cartes sans vignette.
- **Couches éclatées** :

  | Couche | Légende |
  |---|---|
  | barre de titre | « Barre d'Intention » |
  | Constellation | « Espaces » |
  | Toile | « Toile » |
  | cartes | une par plan, légende « Pages vivantes » |

- **Démo** :
  1. `Ctrl K` (quand la scène a le focus) ou un clic sur la pilule ouvre
     la Barre d'Intention, avec le vrai ressort. La suggestion « compare
     rust et zig pour un jeu » se tape seule si l'on n'écrit rien.
  2. Interprétation : « Comparer « rust » et « zig » ». `Entrée` pose
     2 cartes (rust-lang.org, ziglang.org) puis 2 cartes liées sur la
     Toile, avec le ressort 300/32 et 25 ms d'écart. Une nouvelle
     particule-étoile apparaît dans la Constellation.
  3. **Toile** :
     - déplacement au glisser ;
     - zoom à la molette avec `Ctrl`, ou au pincement ; zoom de 0,25 à 2
       dans la démo ;
     - « Tout cadrer » ;
     - cartes déplaçables (Draggable de la v1, accessible au clavier).

     La Toile est un plan en 3D : zoomer avance la caméra (translateZ),
     ce qui donne la profondeur.
  4. Un clic sur un Espace de la Constellation met en avant ses cartes
     (les autres passent à 35 %).
  5. Un **sélecteur de thème** (4 pastilles : Aurore boréale, Nébuleuse,
     Braise, Pulsar) repeint le fond de toute la section, avec une
     transition de 900 ms. Les particules suivent la teinte du thème.
- **Copie** : « Espaces » partout. La phrase de la scène et le contenu de
  `aether.md` sont corrigés.

## 7. Le reste de l'accueil

| Section | Fond | Station | Ce que forment les particules |
|---|---|---|---|
| Méthode | papier | `methode-1..3` | ¶ (lignes de texte alignées), { } (flux rapide horizontal), ↗ (s'envole vers le haut à droite). Une forme par phrase, à droite des phrases sur ordinateur, derrière elles en filigrane (à 25 %) sur mobile. |
| À propos | noir | `apropos` | Champ diffus calme, densité faible, sans forme. La vitesse du scroll l'agite (bruit ×). Le texte reste au premier plan. |
| Contact | noir | `contact` | Une arobase « @ » géante derrière l'adresse. Au survol de l'adresse, attraction vers le curseur. Au clic sur copier, `eclater` puis reformation en coche « ✓ » pendant 1,6 s, puis retour à l'arobase. |

- Les phrases de Méthode gardent leur passage du contour au plein. La
  largeur variable de l'adresse du Contact est gardée.
- Les **coutures** (`Couture.astro`, `couture.ts`) sont supprimées. Les
  bascules de fond sont faites par la toile (§ 4).
- L'**ordre** des sections ne change pas : Hero, Méthode, PostShip,
  Clipper, ÆTHER, À propos, Contact.

## 8. Études de cas (`/projets/<slug>/`)

- **Univers** : la page prend le fond, l'accent et les polices de son
  produit, à travers une classe `univers-<produit>` qui charge le
  `tokens.css` du produit. ÆTHER prend le fond Aurore boréale (sans
  animation au-delà de l'écran d'ouverture).
- **Ouverture** : la toile forme le logo du produit au centre (station
  `cas-logo`), avec le nom et la phrase en dessous. Au scroll, le logo se
  défait en poussière ambiante.
- **Contenu** : les sections 01 → 05 de la v1 restent.
  - Les figures (`Figure.astro`) sont redessinées dans le style du
    produit : terminal PostShip, lignes Clipper, cartes ÆTHER.
  - **PostShip** intègre ses vraies illustrations SVG (`deploiement`,
    `retour-arriere`, `alerte`, `parcours`), copiées dans
    `public/produits/postship/`.
  - Le **schéma** d'architecture (`Schema.astro`) prend les couleurs du
    produit, et ses liens se tracent comme en v1.
- **Transition accueil → étude de cas** :
  1. Au clic, le chef `eclate` la fenêtre (ou le lien) et les particules
     remplissent l'écran.
  2. On écrit `{ x, y, instant, graine, teinte }` dans `sessionStorage`,
     puis on navigue (View Transitions entre documents, fondu racine de
     150 ms).
  3. La nouvelle page démarre sur le même nuage, recalculé à partir de la
     graine, et le fait converger vers le logo.
  4. Le retour vers l'accueil fait l'inverse.
- **« Suivant »** et « Retour à l'accueil » restent.

## 9. Accessibilité, versions de secours, performance

- **`prefers-reduced-motion`** :
  - pas de simulation ;
  - chaque station est rendue en image fixe, avec les particules posées
    sur la cible ;
  - pas de 3D au scroll ni de vue éclatée ;
  - démos fonctionnelles, avec des changements instantanés ;
  - pas d'autoplay de la vidéo (l'image d'attente reste) ;
  - le préchargeur est sauté.
- **Sans WebGL2** (ou contexte perdu) :
  - `html[data-particules="off"]` ;
  - fond noir/papier en CSS par section ;
  - le hero montre les 3 vrais logos SVG en couleur, côte à côte ;
  - Méthode, À propos et Contact sont typographiques ;
  - les démos sont intactes (pas d'envol en particules, le texte
    apparaît directement dans le bloc-notes).
- **Sans JavaScript** : contenu lisible. Les fenêtres s'affichent dans
  leur état final et le préchargeur est masqué par `<noscript>`.
- **Clavier** :
  - toutes les démos sont utilisables au clavier, avec un focus visible ;
  - `Ctrl K` d'ÆTHER n'est capté que quand le focus est dans la scène ;
  - les touches de la démo Clipper ne volent pas les raccourcis du
    navigateur hors de la scène.
- **Lecteurs d'écran** :
  - la toile est `aria-hidden` ;
  - chaque démo a un titre, une consigne courte et une région
    `aria-live` ;
  - les couches éclatées dupliquées sont `aria-hidden`.
- **Budget** :
  - JS total ≤ 350 Ko gzip ;
  - Three.js (environ 150 Ko gzip) est chargé à part, après le premier
    affichage ;
  - polices produits ≤ 220 Ko woff2 au total, chargées seulement quand
    une scène les affiche ;
  - vidéo ≤ 1,2 Mo (MP4 H.264 + WebM VP9, 960 px de large) ;
  - `scripts/budget.mjs` est mis à jour.
- **Cible de performance** : 60 images par seconde sur un portable
  récent, et ≥ 40 sur un téléphone de milieu de gamme après garde-fou.

## 10. Organisation du code

```
src/lib/particules/
  moteur.ts        renderer, GPGPU, boucle, paliers
  shaders/         simulation (position, vitesse), rendu (points)
  cibles.ts        API d'échantillonnage (côté page)
  cibles.worker.ts échantillonnage (Worker)
  formes.ts        logos et glyphes (chemins SVG, textes) par clé
  chef.ts          stations, scroll, fonds, vagues, API eclater/envoler/poser
  passage.ts       sessionStorage entre pages
src/lib/fenetre3d.ts  perspective, inclinaison, vue éclatée
src/demos/<produit>/
  Fenetre.astro    DOM fidèle de la fenêtre
  tokens.css       vraies valeurs (source citée)
  donnees.ts       éléments, textes, étapes
  demo.ts          machine à états + liaison au chef
src/components/Prechargeur.astro
public/produits/   logos SVG, illustrations PostShip, vidéo, polices produits
```

**Supprimés** : `src/lib/dither/*` (hero, couture, shader), `Couture.astro`
et les scènes v1 `src/scenes/{postship,clipper,aether}.ts`, remplacées par
les démos. `figures.ts` et `titres.ts` restent.

## 11. Tests

Playwright, projets « bureau » et « mobile » :

- **Préchargeur** : il disparaît en moins de 3 s ; il est sauté à la
  2ᵉ navigation de la session.
- **Particules** :
  - `__particules.frames` augmente ;
  - `running` passe à faux quand l'onglet est caché ;
  - la station change au scroll (`hero` → `postship-fenetre` →
    … → `contact`).
- **PostShip** : clic sur « git push » ; la 5ᵉ vérification affiche
  « 500 » ; le score affiche 60 ; clic sur « Remettre en ligne » ;
  « Rétabli » apparaît et le score affiche 100. La démo automatique se
  lance seule après inaction.
- **Clipper** : saisir « facture » donne 2 éléments, OCR compris ;
  « Afficher » révèle la clé ; `Entrée` fait apparaître le texte dans le
  bloc-notes.
- **ÆTHER** :
  - `Ctrl K` dans la scène ouvre la barre ;
  - `Entrée` pose 4 cartes ;
  - changer de thème change l'attribut de thème de la section ;
  - le zoom modifie l'échelle ;
  - le glisser et le clavier déplacent une carte.
- **Versions de secours** : réduction des animations (états finaux, pas
  de boucle) ; sans WebGL (logos SVG visibles, démos OK).
- **Régressions v1** : pas de défilement horizontal, liens, boucle
  « Suivant », retour arrière, erreurs de console.
- **Audit anti-slop** : il accepte `src/demos/**` selon la règle 4 et
  refuse une couleur littérale hors `tokens.css`. Le fichier piège est
  mis à jour.

## 12. Livraison

Branche `v2`. Le site en ligne reste la v1 jusqu'à ce que la v2 soit
complète et verte en CI ; on fusionne alors dans `main`, ce qui déclenche
la mise en ligne. Ordre de travail :

1. Moteur, préchargeur, hero.
2. Chef d'orchestre, fonds, Méthode, À propos, Contact, suppression de la
   trame.
3. PostShip.
4. Clipper.
5. ÆTHER.
6. Études de cas et transitions entre pages.
7. Nettoyage, tests complets, budget, audit, mise en ligne.

## 13. Hors champ

Son, nouvelles pages, nouveaux projets, version anglaise, mini-apps
complètes au-delà du scénario guidé, captures d'écran des produits (hors
extrait vidéo).

## 14. Écarts décidés pendant la réalisation

Les écarts réels avec ce document, décidés en cours de route (le détail et le
coût de chacun sont dans le registre d'exécution) :

- **Moteur.** Le fond passe par un quad plein écran à front ondulé (jamais de
  gris intermédiaire) ; il sait devenir transparent (station `fond="aucun"`)
  pour laisser voir le ciel d'ÆTHER, posé sous la toile. Rendu logiciel
  (SwiftShader, llvmpipe) : plus petit palier dès le départ.
- **Préchargeur.** Plafonné à 1,8 s, compteur au temps ; sauté sans WebGL2.
- **Hero.** Cycle de 5,2 s (les formes mettent ~3,5 s à se poser) ; la ligne
  sous le nom dit « Créateur de logiciels ».
- **Fenêtres 3D.** Échelle × 0,96 (la perspective agrandit le bord incliné) ;
  hors vue éclatée la fenêtre est à plat (Chrome départage mal les couches
  coplanaires au clic) ; l'inclinaison se fige sous le pointeur ; la
  profondeur des couches passe par `translate`, pas `transform`.
- **Démos.** Survoler la fenêtre retarde la démo automatique ; chaque démo a
  une mise en page de téléphone native (400 px de large).
  PostShip : la colonne allume « Aperçu » (entrée par défaut du vrai cadre).
  Clipper : un appui choisit une ligne, un double-clic colle (comme ClipRow) ;
  le Bloc-notes fait partie de la fenêtre native ; les onglets Historique,
  Snippets et Collections sont décoratifs.
  ÆTHER : le zoom est une vraie échelle de la Toile (0,25 → 2), les flèches
  déplacent de 16 px à l'écran ; pas de pincement au doigt (la page défile) ;
  l'Espace Rust est actif au départ ; une adresse ou une recherche ajoute une
  carte ; la fenêtre est translucide sur le ciel ; le sélecteur de thèmes est
  sous la fenêtre.
- **Études de cas.** L'univers vit dans `src/demos/univers.css` ; les sections
  « papier » prennent la surface du produit ; l'ouverture d'ÆTHER montre le
  ciel immobile ; le passage en particules vaut aussi pour « Suivant » et
  « Retour à l'accueil » ; le nom de l'étude suivante reste en Mona Sans.
- **Audit.** `donnees.ts` peut porter une couleur littérale quand elle est un
  contenu (la couleur copiée depuis Figma dans Clipper).
