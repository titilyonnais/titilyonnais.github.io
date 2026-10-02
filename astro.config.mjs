import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://titilyonnais.github.io',
  trailingSlash: 'always',
  // Comportement classique : un espace entre deux éléments en ligne reste un espace.
  compressHTML: true,
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') })],
  build: { inlineStylesheets: 'auto' },
});
