// Capture l'image de partage : node scripts/og.mjs [url-de-base]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await page.goto(`${base}/og/`, { waitUntil: 'networkidle' });
// Les trois logos et les polices sont chargés avant la capture.
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode()));
});
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png');
