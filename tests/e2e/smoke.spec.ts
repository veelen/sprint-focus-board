import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";

const STORAGE = "/tmp/outlook-board-e2e.json";

test.beforeEach(async () => {
  await fs.rm(STORAGE, { force: true });
});

test("smoke: open board, edit TeamA/S0, save, reload, verify persistence", async ({ page }) => {
  await page.goto("/");

  // matrix: 4 teams + 16 N.T.B. cells
  await expect(page.getByText("TeamA")).toBeVisible();
  await expect(page.getByText("TeamB")).toBeVisible();
  await expect(page.getByText("TeamC")).toBeVisible();
  await expect(page.getByText("TeamD")).toBeVisible();
  await expect(page.getByText("N.T.B.")).toHaveCount(16);

  // open the first cell (team-a / S0)
  await page.getByText("N.T.B.").first().click();
  const textarea = page.getByPlaceholder("Eén doel per regel");
  await textarea.fill("E2E doel 1\nE2E doel 2");
  await page.getByRole("button", { name: /opslaan/i }).click();

  await expect(page.getByText("E2E doel 1")).toBeVisible();
  await expect(page.getByText("E2E doel 2")).toBeVisible();

  // reload and verify persistence
  await page.reload();
  await expect(page.getByText("E2E doel 1")).toBeVisible();
  await expect(page.getByText("E2E doel 2")).toBeVisible();
  await expect(page.getByText("N.T.B.")).toHaveCount(15);
});
