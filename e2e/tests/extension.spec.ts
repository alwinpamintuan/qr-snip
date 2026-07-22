import { chromium, expect, test, type BrowserContext, type CDPSession, type Page } from '@playwright/test';
import { resolve } from 'node:path';

let context: BrowserContext;
let fixturePage: Page;
let extensionId = '';
let browserSession: CDPSession;

test.beforeAll(async () => {
  const extensionPath = resolve('.output/chrome-mv3');
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let worker = context.serviceWorkers()[0];
  worker ??= await context.waitForEvent('serviceworker');
  extensionId = new URL(worker.url()).host;
  browserSession = await context.browser()!.newBrowserCDPSession();
  fixturePage = await context.newPage();
  await fixturePage.goto('http://127.0.0.1:4174/e2e/fixtures/gallery.html');
});

test.afterAll(async () => {
  await context.close();
});

test('browser action activates one real extension overlay across reinvocation', async () => {
  await triggerAction();
  await expect(fixturePage.locator('[id^="qr-snip-"]')).toHaveCount(1);
  await triggerAction();
  await expect(fixturePage.locator('[id^="qr-snip-"]')).toHaveCount(1);
  await fixturePage.keyboard.press('Escape');
  await expect(fixturePage.locator('[id^="qr-snip-"]')).toHaveCount(0);
});

async function triggerAction(): Promise<void> {
  await fixturePage.bringToFront();
  const { targetInfos } = await browserSession.send('Target.getTargets', {
    filter: [{ type: 'tab', exclude: false }],
  }) as {
    targetInfos: Array<{ targetId: string; type: string; url: string }>;
  };
  const target = targetInfos.find(({ type, url }) => type === 'tab' && url === fixturePage.url());
  if (!target) throw new Error('Synthetic fixture tab target was not found.');
  await browserSession.send('Extensions.triggerAction', { id: extensionId, targetId: target.targetId });
}

test('component gallery exposes deterministic visual states', async ({}, testInfo) => {
  const gallery = await context.newPage();
  const states = [
    ['light', ''],
    ['dark', '?theme=dark'],
    ['contrast', '?contrast=more'],
    ['narrow', '?viewport=narrow'],
    ['text-200', '?scale=2'],
  ] as const;
  for (const [name, query] of states) {
    await gallery.goto(`chrome-extension://${extensionId}/gallery.html${query}`);
    await expect(gallery.getByRole('heading', { name: 'Material, with momentum.' })).toBeVisible();
    await testInfo.attach(`gallery-${name}`, {
      body: await gallery.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
  await gallery.close();
});

test('onboarding explains the privacy model and options persist locally', async ({}, testInfo) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html?onboarding=1`);
  await expect(options.getByRole('heading', { name: 'Preferences' })).toBeVisible();
  await expect(options.getByRole('heading', { name: 'Before your first scan' })).toBeVisible();
  await expect(options.getByText('Processing stays local')).toBeVisible();
  await expect(options.getByText('You decide what happens')).toBeVisible();

  await options.getByLabel('Theme').selectOption('dark');
  await options.getByLabel('Show decoder diagnostics').check();
  await expect(options.getByRole('status')).toHaveText('Saved');
  await options.reload();
  await expect(options.getByLabel('Theme')).toHaveValue('dark');
  await expect(options.getByLabel('Show decoder diagnostics')).toBeChecked();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(options.getByRole('heading', { name: 'Before your first scan' })).toHaveCount(0);
  const metrics = await options.evaluate(() => ({
    helperFontSizes: [...document.querySelectorAll('.field small, .privacy-note span')]
      .map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    rowPadding: [...document.querySelectorAll('.field')]
      .map((element) => `${getComputedStyle(element).paddingBlockStart} ${getComputedStyle(element).paddingBlockEnd}`),
    controlHeights: [...document.querySelectorAll('select, button')]
      .map((element) => element.getBoundingClientRect().height),
    switchSize: (() => {
      const switchElement = document.querySelector('.toggle-field i')!;
      const bounds = switchElement.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    })(),
  }));
  expect(metrics.helperFontSizes.every((size) => size >= 16)).toBe(true);
  expect(new Set(metrics.rowPadding)).toEqual(new Set(['12px 12px']));
  expect(metrics.controlHeights.every((height) => height <= 40)).toBe(true);
  expect(metrics.switchSize).toEqual({ width: 44, height: 28 });
  await testInfo.attach('settings-dark', {
    body: await options.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await options.setViewportSize({ width: 360, height: 800 });
  await expect(options.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  expect(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('settings-dark-narrow', {
    body: await options.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await options.close();
});
