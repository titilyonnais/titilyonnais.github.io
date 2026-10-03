import { defineConfig, devices } from '@playwright/test';

// BASE_URL=https://titilyonnais.github.io npx playwright test  → teste le site en ligne.
const live = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  // Chaque page fait tourner une simulation WebGL (logicielle en test) : peu de navigateurs à la fois.
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: live ?? 'http://localhost:4322',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /smoke|aether|particules|hero|chef|postship|clipper|fenetre|cas|secours/ },
  ],
  webServer: live
    ? undefined
    : {
        command: 'npx astro preview --port 4322',
        url: 'http://localhost:4322',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
