export const TEAM_IDS = ["team-a", "team-b", "team-c", "team-d"] as const;
export const SPRINTS = ["S0", "S1", "S2", "S3"] as const;

export type TeamId = (typeof TEAM_IDS)[number];
export type SprintId = (typeof SPRINTS)[number];

export type Team = { id: TeamId; name: string };
export type SprintInfo = { id: SprintId; startDate: string; endDate: string };

export type Board = {
  teams: Team[];
  sprints: SprintInfo[];
  sprintStartDate: string; // ISO date for S0
  cells: Record<string, { goals: string[] }>;
};

export const SPRINT_DAYS = 14;

export const DEFAULT_TEAM_NAMES: Record<TeamId, string> = {
  "team-a": "TeamA",
  "team-b": "TeamB",
  "team-c": "TeamC",
  "team-d": "TeamD",
};

export const cellKey = (teamId: string, sprint: string) => `${teamId}|${sprint}`;

export function isTeamId(v: string): v is TeamId {
  return (TEAM_IDS as readonly string[]).includes(v);
}
export function isSprint(v: string): v is SprintId {
  return (SPRINTS as readonly string[]).includes(v);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function formatDateNL(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${NL_MONTHS[m - 1]}`;
  void y;
}

export function computeSprints(startISO: string): SprintInfo[] {
  return SPRINTS.map((id, i) => {
    const start = addDaysISO(startISO, i * SPRINT_DAYS);
    const end = addDaysISO(start, SPRINT_DAYS - 1);
    return { id, startDate: start, endDate: end };
  });
}
