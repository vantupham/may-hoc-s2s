import { defineConfig, devices } from '@playwright/test';

// Kiểm thử khói trên bản build thật: npm run build trước, rồi npm run test:e2e
const PORT = 4329;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts', // đuôi riêng để vitest không chạy nhầm
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/may-hoc-s2s/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/may-hoc-s2s/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
