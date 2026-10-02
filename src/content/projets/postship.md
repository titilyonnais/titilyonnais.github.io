---
ordre: 1
nom: PostShip
phrase: Après chaque mise en ligne, PostShip ouvre vos pages comme un visiteur, et vous prévient si quelque chose casse.
etat: en production
periode: depuis août 2026
liens:
  - label: postship.fr
    href: https://postship.fr
  - label: postship-check sur GitHub
    href: https://github.com/titilyonnais/postship-check
faits:
  - valeur: "1 224"
    libelle: commits entre le 31 août et le 2 octobre 2026
  - valeur: "383"
    libelle: fichiers de tests
  - valeur: "276"
    libelle: migrations SQL
  - valeur: 24 sept.
    libelle: paiements Stripe en production depuis le 24 septembre 2026
stack:
  - Next.js 15
  - React 19
  - TypeScript
  - Supabase
  - Stripe
  - Resend
  - Caddy
  - Oracle Cloud
  - Vitest
  - Swift
suivant: clipper
probleme: >-
  Un site peut répondre « 200 OK » et être cassé : un bouton de paiement
  disparu, une page remplacée par « coming soon », une carte sociale vide.
  Un moniteur de disponibilité classique ne voit rien. PostShip vérifie, après
  chaque mise en ligne, ce qu’un visiteur verrait vraiment, et reste muet
  quand tout va bien.
fonctions:
  - titre: Après chaque déploiement
    texte: >-
      Les pages critiques sont ouvertes comme par un visiteur : réponse HTTP,
      ressources, indexabilité, carte sociale, sitemap, certificat. Une alerte
      part par e-mail, Slack ou Discord quand ça casse, et quand ça repart.
    figure:
      type: terminal
      lignes:
        - "$ git push origin main"
        - "déployé · production"
        - "postship · 6 pages ouvertes"
        - "ok 6/6 · Ship Score 100"
  - titre: Le Ship Score
    texte: >-
      Chaque déploiement reçoit une note sur 100, avec son barème : ce qui a
      été vérifié, ce qui a coûté des points, ce qu’aucune vérification ne
      couvre encore. Sous le score plancher, la livraison est tenue pour
      bloquée.
    figure:
      type: bascule
      avant: "Ship Score 100 · tout est vérifié"
      apres: "Ship Score 71 · le paiement ne répond plus"
  - titre: Le retour arrière
    texte: >-
      Un déploiement qui a cassé une vérification peut revenir au précédent :
      PostShip repointe la production sur le dernier déploiement qu’il a
      vérifié bon. Une option le fait tout seul quand une page de paiement
      casse.
    figure:
      type: liste
      elements:
        - "déploiement n · paiement cassé"
        - "production repointée sur n − 1"
        - "vérifié bon · Ship Score 100"
  - titre: Dans le workflow GitHub
    texte: >-
      Le même moteur tourne dans une GitHub Action, sur l’URL de preview d’une
      pull request. Le step échoue si une vérification échoue ou si le score
      passe sous le seuil.
    figure:
      type: terminal
      lignes:
        - "- uses: titilyonnais/postship-check@v1"
        - "  with:"
        - "    url: ${{ steps.preview.outputs.url }}"
        - "    min-score: 80"
architecture:
  noeuds:
    - { id: nav, label: Navigateur, detail: "visiteurs et clients", col: 0, rang: 0 }
    - { id: caddy, label: Caddy, detail: "VM Oracle gratuite, Paris", col: 1, rang: 0 }
    - { id: next, label: Next.js 15, detail: "site, app, API v1", col: 2, rang: 0 }
    - { id: supa, label: Supabase, detail: "Postgres, RLS, UE", col: 3, rang: 0 }
    - { id: ios, label: Console iOS, detail: "Swift", col: 0, rang: 1 }
    - { id: worker, label: Worker, detail: "vérifications, cron", col: 1, rang: 1 }
    - { id: sites, label: Sites clients, detail: "ouverts comme un visiteur", col: 2, rang: 1 }
    - { id: stripe, label: Stripe, detail: "abonnements", col: 3, rang: 1 }
    - { id: alertes, label: Alertes, detail: "e-mail, Slack, Discord", col: 1, rang: 2 }
    - { id: github, label: GitHub, detail: "Check sur le commit", col: 2, rang: 2 }
  liens:
    - [nav, caddy]
    - [caddy, next]
    - [next, supa]
    - [next, stripe]
    - [ios, next]
    - [worker, supa]
    - [worker, sites]
    - [worker, alertes]
    - [worker, github]
appris: >-
  Écrire les règles avant les écrans. Le DESIGN.md de PostShip tient en douze
  lignes, et un audit les vérifie : c’est lui qui tranche, pas l’humeur du
  jour. Et l’hébergement à budget zéro oblige à comprendre ce qu’on déploie :
  une VM, un proxy, une sauvegarde chaque nuit.
---

Next.js 15 en App Router, TypeScript strict, et Zod à chaque frontière :
rien n’entre dans l’application sans avoir été validé. L’authentification
passe par Supabase (lien magique ou GitHub), les données vivent dans Postgres
avec des règles RLS, hébergées dans l’Union européenne. Les abonnements
passent par Stripe Billing, en production depuis le 24 septembre 2026, et les
e-mails par Resend.

Le tout tourne sur **une seule VM gratuite** chez Oracle, à Paris. Elle sert
le site derrière Caddy, le reconstruit et le bascule quand `main` bouge, et
revient en arrière s’il ne répond pas. Elle fait aussi tourner le worker de
vérifications et la sauvegarde `pg_dump` de chaque nuit. Vercel reste
déployé en secours, sans trafic.

Autour du produit : une CLI (`npm i -g postship`), une API
(`POST /api/v1/check` avec un jeton `psk_`), une GitHub Action publique, et
une console d’exploitation pour iPhone écrite en Swift.
