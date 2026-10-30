import { defineConfig, devices } from '@playwright/test'

// BASE_URL lets the same tests run against a Vercel preview or production.
// Without it, the suite builds the app and serves it with `vite preview`.
const baseURL = process.env.BASE_URL || 'http://localhost:4173'
// Optional: point at a locally installed Chrome instead of a downloaded browser.
const executablePath = process.env.PW_CHROME || undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
