import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against a production build (`next build && next start`) by default.
 * Set BASE_URL to run the same tests against a deployment instead:
 *   BASE_URL=https://tessel-fragrance.vercel.app npm run test:e2e
 * The tests talk to the real dev store: they create carts but never pay.
 */
const PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PORT}`,
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: true,
      },
});
