// @ts-check
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  testDir: './tests/e2e',
};

module.exports = config;
