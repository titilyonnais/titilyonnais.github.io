# titilyonnais.github.io

Le portfolio de Thibault Morretton : je fabrique des logiciels.
**PostShip**, **Clipper** et **ÆTHER**, racontés par des scènes lues au défilement.

→ https://titilyonnais.github.io/

## Principe

Une imprimerie numérique : deux valeurs (encre `#000000`, papier `#F4F4F2`),
deux polices (Mona Sans, IBM Plex Mono), et une seule matière pour les gris,
la trame 1-bit. Les règles sont dans [`DESIGN.md`](DESIGN.md) ; `npm run audit`
fait échouer la CI quand le code s'en écarte.

- **Hero** : un shader WebGL écrit à la main (Bayer 8×8). Le nom est un masque
  rasterisé dans un canvas, et une loupe suit le curseur.
- **Coutures** : entre deux sections, une demi-teinte calculée en canvas 2D,
  dont les points grossissent jusqu'à recouvrir la couleur suivante.
- **Scènes** : une piste haute et une scène `position: sticky`. Chaque scène est
  une fonction pure `rendre(t)`, avec t ∈ [0, 1] donné par le défilement
  (ScrollTrigger + Lenis). Elle se rejoue donc à l'identique dans les deux sens.
- **Version calme** : avec « réduire les animations », tout est posé dans son
  état final, sans rien retirer du contenu.

## Commandes

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + build statique dans dist/
npm run audit      # règles anti-slop
npm run budget     # JS ≤ 120 Ko gzip
npx playwright test
npm run og         # régénère public/og.png (serveur lancé)
```

## Contenu

Les études de cas vivent dans `src/content/projets/*.md` (schéma Zod dans
`src/content.config.ts`). Les chiffres viennent des dépôts des produits,
relevés le 2 octobre 2026.

## Mise en ligne

Chaque push sur `main` passe les vérifications (audit, typage, budget, tests
Playwright bureau et mobile), puis est publié sur GitHub Pages.
