import { promises as fs } from "fs";
import {
  TEAM_IDS,
  SPRINTS,
  DEFAULT_TEAM_NAMES,
  cellKey,
  computeSprints,
  todayISO,
  addDaysISO,
  type Board,
  type Team,
  type TeamId,
} from "./board-constants";

const FILE = process.env.OUTLOOK_BOARD_FILE ?? "/tmp/outlook-board.json";

type Stored = {
  teamNames?: Record<string, string>;
  sprintStartDate?: string;
  cells?: Record<string, { goals: string[] }>;
};

function defaultTeams(): Team[] {
  return TEAM_IDS.map((id) => ({ id, name: DEFAULT_TEAM_NAMES[id] }));
}

function emptyCells(): Record<string, { goals: string[] }> {
  const cells: Record<string, { goals: string[] }> = {};
  for (const t of TEAM_IDS) for (const s of SPRINTS) cells[cellKey(t, s)] = { goals: [] };
  return cells;
}

async function readStored(): Promise<Stored> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Stored;
  } catch {
    return {};
  }
}

async function writeStored(s: Stored): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), "utf8");
}

export async function readBoard(): Promise<Board> {
  const stored = await readStored();
  const teams = defaultTeams().map((t) => ({
    ...t,
    name: stored.teamNames?.[t.id] ?? t.name,
  }));
  const startDate = stored.sprintStartDate ?? todayISO();
  const cells = emptyCells();
  if (stored.cells) {
    for (const [k, v] of Object.entries(stored.cells)) {
      if (k in cells && Array.isArray(v?.goals)) {
        cells[k] = { goals: v.goals.filter((g) => typeof g === "string") };
      }
    }
  }
  return {
    teams,
    sprints: computeSprints(startDate),
    sprintStartDate: startDate,
    cells,
  };
}

export async function writeCell(teamId: string, sprint: string, goals: string[]) {
  const stored = await readStored();
  stored.cells = stored.cells ?? {};
  stored.cells[cellKey(teamId, sprint)] = { goals };
  await writeStored(stored);
  return stored.cells[cellKey(teamId, sprint)];
}

export async function renameTeam(teamId: TeamId, name: string): Promise<Team[]> {
  const stored = await readStored();
  stored.teamNames = stored.teamNames ?? {};
  // uniqueness check across resolved names
  const resolvedNames = TEAM_IDS.map((id) => {
    if (id === teamId) return name;
    return stored.teamNames?.[id] ?? DEFAULT_TEAM_NAMES[id];
  });
  const lower = resolvedNames.map((n) => n.toLowerCase());
  if (new Set(lower).size !== lower.length) {
    throw new Error("DUPLICATE_NAME");
  }
  stored.teamNames[teamId] = name;
  await writeStored(stored);
  return TEAM_IDS.map((id, i) => ({ id, name: resolvedNames[i] }));
}

export async function setSprintStartDate(iso: string): Promise<string> {
  const stored = await readStored();
  stored.sprintStartDate = iso;
  await writeStored(stored);
  return iso;
}

export async function rollForward(): Promise<Board> {
  const stored = await readStored();
  const cells = stored.cells ?? {};
  const newCells: Record<string, { goals: string[] }> = {};
  for (const t of TEAM_IDS) {
    newCells[cellKey(t, "S0")] = cells[cellKey(t, "S1")] ?? { goals: [] };
    newCells[cellKey(t, "S1")] = cells[cellKey(t, "S2")] ?? { goals: [] };
    newCells[cellKey(t, "S2")] = cells[cellKey(t, "S3")] ?? { goals: [] };
    newCells[cellKey(t, "S3")] = { goals: [] };
  }
  stored.cells = newCells;
  stored.sprintStartDate = addDaysISO(stored.sprintStartDate ?? todayISO(), 14);
  await writeStored(stored);
  return readBoard();
}
