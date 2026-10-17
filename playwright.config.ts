import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // The smallest common phone: Pixel 7 touch/UA at iPhone SE dimensions.
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 667 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
