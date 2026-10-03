import { test, expect } from '@playwright/test';

test('sans WebGL : logos SVG et démos jouables', async ({ page }) => {
  await page.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test
    HTMLCanvasElement.prototype.getContext = function (t: string, ...a: unknown[]) {
      return /webgl/.test(t) ? null : o.call(this, t, ...a);
    };
  });
  await page.goto('/');
  await expect(page.locator('.hero .repli').first()).toBeVisible();
  await page.locator('#postship').scrollIntoViewIfNeeded();
  await page.locator('#postship [data-action="pousser"]').click();
  await expect(page.locator('#postship [data-score]')).toHaveText('60', { timeout: 5000 });
});

test('sans JavaScript : contenu lisible', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('.pre')).toBeHidden();
  await expect(page.locator('#postship [data-check]').first()).toBeVisible();
  await ctx.close();
});
