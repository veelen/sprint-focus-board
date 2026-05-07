import { promises as fs } from "fs";
import { TEAMS, SPRINTS, cellKey, type Board } from "./board-constants";

const FILE = "/tmp/outlook-board.json";

function emptyBoard(): Board {
  const cells: Board["cells"] = {};
  for (const t of TEAMS) for (const s of SPRINTS) cells[cellKey(t, s)] = { goals: [] };
  return { teams: TEAMS, sprints: SPRINTS, cells };
}

export async function readBoard(): Promise<Board> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as { cells?: Record<string, { goals: string[] }> };
    const board = emptyBoard();
    if (parsed.cells) {
      for (const [k, v] of Object.entries(parsed.cells)) {
        if (k in board.cells && Array.isArray(v?.goals)) {
          board.cells[k] = { goals: v.goals.filter((g) => typeof g === "string") };
        }
      }
    }
    return board;
  } catch {
    return emptyBoard();
  }
}

export async function writeCell(team: string, sprint: string, goals: string[]) {
  const board = await readBoard();
  board.cells[cellKey(team, sprint)] = { goals };
  await fs.writeFile(FILE, JSON.stringify({ cells: board.cells }, null, 2), "utf8");
  return board.cells[cellKey(team, sprint)];
}
