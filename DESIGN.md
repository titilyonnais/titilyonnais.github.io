# Direction visuelle — portfolio

**Une toile de particules, et les vrais produits dedans.** Le site est noir et
blanc ; la couleur n'y entre qu'avec les produits.

Dix lignes qui tranchent. `npm run audit` en vérifie la plupart ; les autres
se tiennent à la relecture.

1. **Deux valeurs.** `--ink: #000000`, `--paper: #F4F4F2`. Hors produits, les
   gris n'existent que par densité de particules. Jamais d'aplat gris,
   jamais d'`opacity` entre 0 et 1, jamais de dégradé, de flou, de verre, de
   halo ni d'ombre.
2. **La particule est la matière.** Un point lumineux sur noir, encre sur
   papier. Elle forme les logos, les signes de la méthode, l'arobase du
   contact, et passe d'une section à l'autre. Plus de trame.
3. **Deux familles.** Mona Sans pour tout le texte : titres en 400–500,
   tracking −0,04 em, et l'axe de largeur (75 → 125) qui bouge quand un
   titre arrive. IBM Plex Mono pour ce qui est littéralement technique :
   une version, une commande, une stack, un libellé de scène.
4. **Exception produits.** À l'intérieur de `src/demos/**`, une fenêtre
   reproduit le vrai produit : ses rayons, ombres, flous, dégradés, polices
   (Onest, Inter, Instrument Serif, JetBrains Mono) et couleurs. Les
   couleurs littérales ne vivent que dans `src/demos/<produit>/tokens.css`,
   chacune avec son fichier source. Le nom du produit peut prendre sa
   police hors de la fenêtre (hero, étude de cas).
5. **La couleur est réservée aux produits** : les particules qui forment un
   logo produit, les fenêtres, le fond de la scène ÆTHER. Jamais ailleurs.
6. **Rayon 0** hors produits. Du papier coupé.
7. **Interdits :** fondu qui monte par bloc, carte arrondie hors produit,
   icône décorative, emoji, texte en dégradé, bento, badge « Nouveau »,
   témoignage, chiffre qui défile pour impressionner (le compteur du
   préchargeur suit un vrai chargement), « révolutionnez », « let's build
   something amazing ».
8. **Le mouvement raconte le produit, ou il n'existe pas.** Chaque geste
   montre une chose vraie : un paiement qui casse puis revient, un
   historique qui se filtre, des pages qui deviennent des cartes.
9. **On écrit comme on parle.** Pas de superlatif. Pas de fonction ni de
   chiffre qui ne soit dans le dépôt du produit.
10. **Version calme complète.** Avec « réduire les animations », tout est
    posé dans son état final. On retire le mouvement, jamais le contenu.
