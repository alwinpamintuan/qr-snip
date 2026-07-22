import { expect, test } from '@playwright/test';

test('synthetic fixture gallery exercises hostile and changing page content', async ({ page }) => {
  await page.goto('/e2e/fixtures/gallery.html');
  await expect(page.getByRole('img', { name: 'Synthetic QR code', exact: true })).toBeVisible();
  await expect(page.getByLabel('Synthetic paused video')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.transformed')).toBeVisible();
  await expect(page.locator('.hostile-zone')).toBeVisible();
  await expect(page.locator('.mutation')).toBeVisible();
});
