import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "SESSION_SECRET=dev-secret-change-in-production-min-32-chars npm run build && rm -f data/e2e.sqlite && DATABASE_PATH=./data/e2e.sqlite SESSION_SECRET=dev-secret-change-in-production-min-32-chars npx next start -p 3001",
    url: "http://127.0.0.1:3001/login",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
