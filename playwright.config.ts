import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'node e2e/server.mjs',
    url: 'http://127.0.0.1:4174/e2e/fixtures/gallery.html',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  projects: [
    {
      name: 'chromium-harness',
      testIgnore: /extension\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] },
    },
    {
      name: 'firefox-harness',
      testIgnore: /extension\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'chromium-extension',
      testMatch: /extension\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
