import { expect, test, type Page } from '@playwright/test';

async function completeKeyboardSelection(page: Page): Promise<void> {
  await page.keyboard.press('k');
  await expect(page.getByRole('button', { name: 'Select with keyboard' })).toBeHidden();
  await page.keyboard.press('Alt+ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Enter');
}

test('@critical decodes, previews, copies, and opens only after an explicit action', async ({ page }) => {
  await page.goto('/harness/');
  await expect(page.getByText('Drag around a QR code')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select with keyboard' })).toBeVisible();
  await expect(page.locator('.qr-snip-app')).toBeFocused();
  await completeKeyboardSelection(page);

  await expect(page.getByRole('heading', { name: 'QR code found' })).toBeVisible();
  await expect(page.getByText('https://example.com/qr-snip', { exact: true })).toBeVisible();
  await expect(page.getByTestId('test-state')).toHaveText('Harness ready');

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.locator('.toast')).toContainText(/Copied to clipboard|Copy failed/);
  await page.getByRole('button', { name: 'Open link' }).click();
  await expect(page.getByTestId('test-state')).toContainText('OPEN_RESULT');
  await expect(page).toHaveURL(/\/harness\/$/);
});

test('@critical suspicious links expose every signal before Open anyway', async ({ page }) => {
  await page.goto('/harness/?scenario=suspicious');
  await completeKeyboardSelection(page);

  await expect(page.getByRole('heading', { name: 'Check this destination' })).toBeVisible();
  await expect(page.getByText('This link uses unencrypted HTTP.')).toBeVisible();
  await expect(page.getByText('The link contains embedded sign-in information.')).toBeVisible();
  await expect(page.getByText('The destination uses an IP address instead of a domain name.')).toBeVisible();
  await expect(page.getByText('The link points to this device or a private network.')).toBeVisible();
  await expect(page.getByText('The link uses the unusual port 8080.')).toBeVisible();
  await expect(page.getByTestId('test-state')).toHaveText('Harness ready');

  await page.getByRole('button', { name: 'Open anyway' }).click();
  await expect(page.getByTestId('test-state')).toContainText('OPEN_RESULT');
});

test('structured payloads show inactive summaries and preserve copy-only handling', async ({ page }) => {
  await page.goto('/harness/?scenario=wifi');
  await completeKeyboardSelection(page);

  await expect(page.getByRole('dialog').getByText('Wi-Fi network · preview only', { exact: true })).toBeVisible();
  await expect(page.getByText('Guest network', { exact: true })).toBeVisible();
  await expect(page.getByText('WPA', { exact: true })).toBeVisible();
  await expect(page.getByText('Included', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open link' })).toHaveCount(0);
});

test('retry, Escape, and focus containment preserve a keyboard-only flow', async ({ page }) => {
  await page.goto('/harness/?scenario=not-found');
  await completeKeyboardSelection(page);
  await expect(page.getByRole('heading', { name: 'Try a wider selection' })).toBeVisible();

  const tryAgain = page.getByRole('button', { name: 'Try again' });
  await tryAgain.click();
  await expect(page.locator('.selection.visible')).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Try a wider selection' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('[id^="qr-snip-"]')).toHaveCount(0);
});

test('long pseudo-localized RTL content remains operable', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 720 });
  await page.goto('/harness/?pseudo=long&dir=rtl&scenario=suspicious');
  await page.keyboard.press('k');
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('.qr-snip-app')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name: /Open anyway/ })).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(420);
});
