import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4200';
const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  expect: {
    timeout: 10_000,
  },
  outputDir: 'test-results',
  globalSetup: './e2e/global-setup.ts',
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'desktop-chrome',
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /responsive\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet',
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: process.env.CI
            ? 'npm run start --workspace=Backend_Fintech'
            : 'npm run dev --workspace=Backend_Fintech',
          url: `${apiURL.replace(/\/api$/, '')}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV ?? 'development',
            PORT: '3000',
            DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
            DB_PORT: process.env.DB_PORT ?? '3306',
            DB_USER: process.env.DB_USER ?? 'root',
            DB_PASSWORD: process.env.DB_PASSWORD ?? '',
            DB_NAME: process.env.DB_NAME ?? 'fintech_db',
            REDIS_ENABLED: 'false',
            JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-jwt-secret-min-32-characters!!',
            JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'e2e-test-refresh-secret-min-32-chars',
            CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY ?? 'e2e-test-config-key-min-32-chars',
            CORS_ORIGIN: baseURL,
          },
        },
        {
          command: 'npm run start --workspace=Frontend_Fintech',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
