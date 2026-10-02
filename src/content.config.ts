import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Une figure est une mini-animation recréée en HTML, jamais une capture.
const figure = z.discriminatedUnion('type', [
  z.object({ type: z.literal('terminal'), lignes: z.array(z.string()).min(1) }),
  z.object({ type: z.literal('touches'), touches: z.array(z.string()).min(1), legende: z.string() }),
  z.object({ type: z.literal('liste'), elements: z.array(z.string()).min(2) }),
  z.object({ type: z.literal('bascule'), avant: z.string(), apres: z.string() }),
]);

const noeud = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string().optional(),
  // Position sur une grille de 4 colonnes × n rangées.
  col: z.number().int().min(0).max(3),
  rang: z.number().int().min(0),
});

const projets = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projets' }),
  schema: z.object({
    ordre: z.number().int(),
    nom: z.string(),
    phrase: z.string(),
    etat: z.string(),
    periode: z.string(),
    liens: z.array(z.object({ label: z.string(), href: z.url() })).min(1),
    faits: z.array(z.object({ valeur: z.string(), libelle: z.string() })).min(2),
    stack: z.array(z.string()).min(2),
    suivant: z.string(),
    probleme: z.string(),
    fonctions: z.array(z.object({ titre: z.string(), texte: z.string(), figure })).min(3).max(4),
    architecture: z.object({
      noeuds: z.array(noeud).min(2),
      liens: z.array(z.tuple([z.string(), z.string()])),
    }),
    appris: z.string(),
  }),
});

export const collections = { projets };
