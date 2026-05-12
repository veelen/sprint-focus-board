import { test, expect, request } from "@playwright/test";

// Reset board state through the API before each test so the smoke test is hermetic
// regardless of where the dev server stores data.
test.beforeEach(async ({ baseURL }) => {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.get("/api/board");
  const board = await res.json();
  for (const team of board.teams) {
    for (const sprint of board.sprints) {
      await ctx.put(`/api/board/${team.id}/${sprint.id}`, { data: { goals: [] } });
    }
  }
  await ctx.dispose();
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
