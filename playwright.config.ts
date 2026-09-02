import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Charge les variables locales (URL + clés Supabase) pour l'app et les helpers de test.
loadEnv({ path: ".env.local" });

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Le login OTP écrit des cookies de session : on garde les fichiers séquentiels par worker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "fr-FR",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, teardown: "cleanup" },
    { name: "cleanup", testMatch: /global\.teardown\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // Dev suffit pour l'E2E ; réutilise un serveur déjà lancé si présent.
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
