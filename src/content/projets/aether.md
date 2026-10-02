---
ordre: 3
nom: ÆTHER
phrase: Un navigateur pour Windows sans onglets. On exprime une intention, on range des cartes sur une toile, et une IA locale suit le contexte.
etat: v0.98.0
periode: juillet – août 2026
liens:
  - label: Télécharger (Releases)
    href: https://github.com/titilyonnais/aether-browser/releases
  - label: Code source
    href: https://github.com/titilyonnais/aether-browser
faits:
  - valeur: "100"
    libelle: versions publiées en cinq semaines
  - valeur: "122"
    libelle: commits
  - valeur: "6"
    libelle: pages vivantes en mémoire au plus, les autres restent des cartes
  - valeur: "0"
    libelle: jeton embarqué dans l'application distribuée
stack:
  - Electron
  - TypeScript
  - React
  - SQLite
  - Ollama
  - electron-updater
  - Playwright
  - Vitest
suivant: postship
probleme: >-
  Trente onglets ouverts, et plus aucune idée de pourquoi. Les onglets rangent
  les pages par ordre d'ouverture, pas par ce qu'on est en train de faire.
  ÆTHER part de l'intention : on dit ce qu'on cherche, les pages deviennent des
  cartes, et les cartes se rangent dans des espaces.
fonctions:
  - titre: La barre d'Intention
    texte: >-
      Ctrl+K : une adresse, une recherche ou une pensée. La classification
      d'intention décide quoi en faire : ouvrir, chercher, comparer, résumer.
    figure:
      type: terminal
      lignes:
        - "> compare rust et zig"
        - "intention · comparer"
        - "2 cartes posées sur la toile"
  - titre: Focus ou toile
    texte: >-
      Une page en grand pour lire, ou la toile spatiale pour voir toutes les
      cartes de l'espace et les déplacer. Double-clic sur la toile : une
      nouvelle carte à cet endroit.
    figure:
      type: touches
      touches: [Ctrl, E]
      legende: basculer entre Focus et la toile
  - titre: Muse, local d'abord
    texte: >-
      Le compagnon IA passe d'abord par Ollama sur la machine, détecté tout
      seul. Les embeddings tissent des liens d'affinité entre les pages. Une
      API distante n'intervient que si on la configure.
    figure:
      type: liste
      elements:
        - "Ollama local, détecté tout seul"
        - "llama3.2 pour le dialogue"
        - "nomic-embed-text pour les affinités"
        - "API distante, si vous le voulez"
  - titre: Des mises à jour qui se font seules
    texte: >-
      ÆTHER vérifie au lancement, télécharge en arrière-plan, puis propose de
      redémarrer. Une version change dans package.json, une GitHub Action
      publie la release.
    figure:
      type: bascule
      avant: "v0.97.0 · installée"
      apres: "v0.98.0 · prête au redémarrage"
architecture:
  noeuds:
    - { id: ui, label: Interface React, detail: "toile, espaces, intention, Muse", col: 0, rang: 0 }
    - { id: ipc, label: IPC validée, detail: "preload minimal et typé", col: 1, rang: 0 }
    - { id: main, label: Processus principal, detail: "Node, sessions, sécurité", col: 2, rang: 0 }
    - { id: db, label: SQLite, detail: "espaces, pages, notes, embeddings", col: 3, rang: 0 }
    - { id: vues, label: Vues natives, detail: "6 pages vivantes au plus", col: 1, rang: 1 }
    - { id: apercus, label: Aperçus, detail: "captures JPEG, protocole aether://", col: 2, rang: 1 }
    - { id: ia, label: IA, detail: "Ollama local, puis API", col: 3, rang: 1 }
  liens:
    - [ui, ipc]
    - [ipc, main]
    - [main, db]
    - [main, vues]
    - [main, apercus]
    - [main, ia]
appris: >-
  Changer de paradigme coûte plus cher qu'ajouter une fonction : chaque
  réflexe hérité des onglets a dû trouver sa traduction, de la navigation
  privée aux téléchargements. Et cent versions en cinq semaines ne sont
  possibles que si publier ne coûte rien.
---

Electron et Chromium, mais pas de `<webview>` : chaque page est une vue
native, posée sous l'interface et synchronisée avec elle. Au-delà de six vues
vivantes, les plus anciennes sont déchargées. La carte, elle, reste sur la
toile avec ses métadonnées et un aperçu, et se réhydrate au clic.

La sécurité suit les règles d'Electron à la lettre : bac à sable partout,
isolation du contexte, preload minimal et typé, popups convertis en cartes,
clés d'API chiffrées par Windows (DPAPI). Les données (espaces, pages, notes,
embeddings) vivent dans SQLite, sur la machine.

Chaque changement de version sur `main` déclenche une GitHub Action qui
construit l'installateur et publie la release ; les postes installés la
récupèrent au lancement suivant.
