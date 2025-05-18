import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev --prefix bitcoin-moon/client',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}); 