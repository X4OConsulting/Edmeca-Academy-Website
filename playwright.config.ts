import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // testDir points to the parent folder so both suites are discovered:
  //   tests/screenshots/  — Phase 2 design screenshots
  //   tests/uat/          — Phase 4 UAT portal tests
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      // Mobile Chrome — used by TC-012 mobile viewport tests
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
      // Only run UAT tests on mobile — the Phase 2 screenshot suite is desktop-only
      testMatch: '**/uat/**',
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
