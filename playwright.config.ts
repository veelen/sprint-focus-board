import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 8080);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  // Reuse running dev server if present; otherwise start it.
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: `bun run dev`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
