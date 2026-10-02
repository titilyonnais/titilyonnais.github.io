---
ordre: 2
nom: Clipper
phrase: Un gestionnaire de presse-papiers pour Windows. Tout ce que vous copiez, retrouvé en une frappe et gardé sur votre PC.
etat: v3.6.0
periode: depuis juin 2026
liens:
  - label: Télécharger (Releases)
    href: https://github.com/titilyonnais/Clipper/releases
  - label: Code source
    href: https://github.com/titilyonnais/Clipper
faits:
  - valeur: "11"
    libelle: versions publiées
  - valeur: v3.6.0
    libelle: dernière version, le 1ᵉʳ octobre 2026
  - valeur: "0"
    libelle: droit administrateur pour l’installer
  - valeur: "0"
    libelle: compte, serveur ou donnée envoyée par défaut
stack:
  - Rust
  - Tauri 2
  - WebView2
  - React
  - TypeScript
  - SQLite FTS5
  - Tailwind v4
  - Windows.Media.Ocr
suivant: aether
probleme: >-
  Le presse-papiers de Windows oublie vite et cherche mal. Ce qu’on a copié il
  y a une heure (une adresse, un bout de code, un numéro de commande) est
  perdu. Clipper garde tout sur la machine, trie les secrets, et retrouve
  n’importe quel élément en tapant trois lettres.
fonctions:
  - titre: Collage rapide
    texte: >-
      Win+V ouvre une palette au centre de l’écran. Entrée colle directement
      dans l’application où vous étiez, Maj+Entrée en texte brut, Ctrl+1 à 9
      colle l’un des neuf premiers éléments.
    figure:
      type: touches
      touches: [Win, V]
      legende: la palette s’ouvre là où vous êtes
  - titre: Chercher, même dans les images
    texte: >-
      La recherche est instantanée, y compris dans le texte des captures
      d’écran, lu par l’OCR intégré à Windows, hors ligne.
    figure:
      type: bascule
      avant: "capture-2026-10-01.png"
      apres: "« Facture n° 2026-118 » · texte lu hors ligne"
  - titre: Secrets masqués
    texte: >-
      Mots de passe, clés d’API, jetons et numéros de carte sont détectés,
      masqués et exclus de la recherche. Un mode incognito suspend la capture
      cinq minutes, une heure, ou jusqu’à nouvel ordre.
    figure:
      type: bascule
      avant: "sk-live-4f9a2c71e0b8"
      apres: "•••••••• · exclu de la recherche"
  - titre: La file de collage
    texte: >-
      Sélectionnez plusieurs éléments : chaque Ctrl+V colle le suivant. Pour
      remplir un formulaire champ par champ sans aller-retour.
    figure:
      type: liste
      elements:
        - "1 · Marie Durand"
        - "2 · 8 rue de la Paix"
        - "3 · 75002"
architecture:
  noeuds:
    - { id: pp, label: Presse-papiers, detail: "capture par événements", col: 0, rang: 0 }
    - { id: rust, label: Cœur Rust, detail: "capture, collage, file", col: 1, rang: 0 }
    - { id: db, label: SQLite + FTS5, detail: "historique, collections", col: 2, rang: 0 }
    - { id: ui, label: React, detail: "fenêtre et palette, WebView2", col: 3, rang: 0 }
    - { id: ocr, label: OCR Windows, detail: "hors ligne", col: 0, rang: 1 }
    - { id: secrets, label: Secrets, detail: "détection et masquage", col: 1, rang: 1 }
    - { id: ia, label: IA facultative, detail: "Ollama, Claude, OpenAI", col: 3, rang: 1 }
  liens:
    - [pp, rust]
    - [rust, db]
    - [rust, ui]
    - [rust, ocr]
    - [rust, secrets]
    - [ui, ia]
appris: >-
  Rust n’a rien d’une montagne quand la spec est écrite d’abord : chaque
  module a un seul rôle (capture, base, collage, OCR) et les tests du backend
  tiennent la barre. Et une version doit se publier en un geste, pas en une
  soirée.
---

Tauri 2 : un cœur natif en Rust et une interface React affichée par
WebView2, le moteur web déjà présent dans Windows. L’application reste
légère, s’installe dans le profil de l’utilisateur, et ne demande aucun
droit administrateur.

Le cœur Rust écoute le presse-papiers par événements plutôt que de
l’interroger en boucle, colle directement dans l’application précédente, et
sert la file de collage en rendu différé. L’historique vit dans SQLite, avec
FTS5 pour la recherche plein texte.

La livraison est automatique : `npm run release -- 3.6.0` ouvre une pull
request qui se fusionne seule quand la CI est verte (typage, build, Clippy,
tests). L’arrivée sur `main` compile l’installateur et le `.msi` sur les
serveurs de GitHub, puis publie la version avec ses empreintes SHA-256.
