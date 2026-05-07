export const TEAMS = ["TeamA", "TeamB", "TeamC", "TeamD"] as const;
export const SPRINTS = ["S0", "S1", "S2", "S3"] as const;

export type Team = (typeof TEAMS)[number];
export type Sprint = (typeof SPRINTS)[number];

export type Cell = { team: Team; sprint: Sprint; goals: string[] };
export type Board = {
  teams: readonly Team[];
  sprints: readonly Sprint[];
  cells: Record<string, { goals: string[] }>;
};

export const cellKey = (team: string, sprint: string) => `${team}|${sprint}`;

export function isTeam(v: string): v is Team {
  return (TEAMS as readonly string[]).includes(v);
}
export function isSprint(v: string): v is Sprint {
  return (SPRINTS as readonly string[]).includes(v);
}
