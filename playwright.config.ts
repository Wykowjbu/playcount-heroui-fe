import { defineConfig, devices } from '@playwright/test';

const mapboxTestToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.playwright-test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'line',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: mapboxTestToken,
      NEXT_PUBLIC_MAPBOX_STYLE_URL: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/streets-v12',
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
