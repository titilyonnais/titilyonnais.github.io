// Capture l'image de partage : node scripts/og.mjs [url-de-base]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await page.goto(`${base}/og/`, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas[data-mask-ready="1"]');
await page.waitForTimeout(400);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png');
