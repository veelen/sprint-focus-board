import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 4173);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `OUTLOOK_BOARD_FILE=/tmp/outlook-board-e2e.json bun run build && OUTLOOK_BOARD_FILE=/tmp/outlook-board-e2e.json bun run preview --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
