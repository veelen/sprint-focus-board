import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

let tmpFile: string;

beforeEach(async () => {
  tmpFile = path.join(os.tmpdir(), `board-test-${Date.now()}-${Math.random()}.json`);
  process.env.OUTLOOK_BOARD_FILE = tmpFile;
});

afterEach(async () => {
  await fs.rm(tmpFile, { force: true });
  delete process.env.OUTLOOK_BOARD_FILE;
});

async function freshStorage() {
  // re-import to pick up env var (module cached, but FILE captured at module load)
  // workaround: dynamic import with cache-busting query
  const mod = await import(`@/lib/board-storage.server?cb=${Math.random()}`);
  return mod;
}

describe("board-storage", () => {
  it("returns an empty board with default teams and 4 sprints", async () => {
    const { readBoard } = await freshStorage();
    const board = await readBoard();
    expect(board.teams).toHaveLength(4);
    expect(board.teams.map((t: { name: string }) => t.name)).toEqual([
      "TeamA",
      "TeamB",
      "TeamC",
      "TeamD",
    ]);
    expect(board.sprints.map((s: { id: string }) => s.id)).toEqual(["S0", "S1", "S2", "S3"]);
    for (const cell of Object.values(board.cells)) {
      expect((cell as { goals: string[] }).goals).toEqual([]);
    }
  });

  it("persists goals via writeCell", async () => {
    const { writeCell, readBoard } = await freshStorage();
    await writeCell("team-a", "S0", ["Goal 1", "Goal 2"]);
    const board = await readBoard();
    expect(board.cells["team-a|S0"].goals).toEqual(["Goal 1", "Goal 2"]);
  });

  it("renames a team and prevents duplicates", async () => {
    const { renameTeam } = await freshStorage();
    const teams = await renameTeam("team-a", "Alpha");
    expect(teams.find((t: { id: string }) => t.id === "team-a")?.name).toBe("Alpha");
    await expect(renameTeam("team-b", "alpha")).rejects.toThrow("DUPLICATE_NAME");
  });

  it("rolls sprints forward", async () => {
    const { writeCell, rollForward, readBoard } = await freshStorage();
    await writeCell("team-a", "S0", ["old s0"]);
    await writeCell("team-a", "S1", ["old s1"]);
    await rollForward();
    const board = await readBoard();
    expect(board.cells["team-a|S0"].goals).toEqual(["old s1"]);
    expect(board.cells["team-a|S3"].goals).toEqual([]);
  });
});
