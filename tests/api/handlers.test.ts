import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

let tmpFile: string;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `board-api-${Date.now()}-${Math.random()}.json`);
  process.env.OUTLOOK_BOARD_FILE = tmpFile;
  vi.resetModules();
});

afterEach(async () => {
  await fs.rm(tmpFile, { force: true });
  delete process.env.OUTLOOK_BOARD_FILE;
});

// Helper: pull handler function out of a TanStack route file.
async function getHandlers(modulePath: string) {
  const mod = await import(modulePath);
  // createFileRoute stores options under different keys depending on version.
  const route = mod.Route;
  const options = route.options ?? route;
  return options.server.handlers as Record<string, (ctx: { request: Request; params: Record<string, string> }) => Promise<Response>>;
}

describe("GET /api/board", () => {
  it("returns an empty 4x4 board on first load", async () => {
    const handlers = await getHandlers("@/routes/api/board");
    const res = await handlers.GET({ request: new Request("http://x/api/board"), params: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.teams).toHaveLength(4);
    expect(body.sprints).toHaveLength(4);
    expect(Object.keys(body.cells)).toHaveLength(16);
  });
});

describe("GET /api/board/:team/:sprint", () => {
  it("returns goals for a valid cell (empty by default)", async () => {
    const handlers = await getHandlers("@/routes/api/board.$team.$sprint");
    const res = await handlers.GET({
      request: new Request("http://x/api/board/team-a/S0"),
      params: { team: "team-a", sprint: "S0" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ team: "team-a", sprint: "S0", goals: [] });
  });

  it("404s for an unknown team or sprint", async () => {
    const handlers = await getHandlers("@/routes/api/board.$team.$sprint");
    const res = await handlers.GET({
      request: new Request("http://x/api/board/nope/S0"),
      params: { team: "nope", sprint: "S0" },
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/board/:team/:sprint", () => {
  it("saves goals and persists across reads", async () => {
    const handlers = await getHandlers("@/routes/api/board.$team.$sprint");
    const put = await handlers.PUT({
      request: new Request("http://x/api/board/team-a/S0", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: ["Doel 1", "Doel 2"] }),
      }),
      params: { team: "team-a", sprint: "S0" },
    });
    expect(put.status).toBe(200);
    expect(await put.json()).toEqual({ team: "team-a", sprint: "S0", goals: ["Doel 1", "Doel 2"] });

    // persistence: re-read via fresh module import
    vi.resetModules();
    const handlers2 = await getHandlers("@/routes/api/board.$team.$sprint");
    const get = await handlers2.GET({
      request: new Request("http://x/api/board/team-a/S0"),
      params: { team: "team-a", sprint: "S0" },
    });
    expect(await get.json()).toEqual({ team: "team-a", sprint: "S0", goals: ["Doel 1", "Doel 2"] });
  });

  it("rejects invalid JSON body", async () => {
    const handlers = await getHandlers("@/routes/api/board.$team.$sprint");
    const res = await handlers.PUT({
      request: new Request("http://x/api/board/team-a/S0", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
      params: { team: "team-a", sprint: "S0" },
    });
    expect(res.status).toBe(400);
  });

  it("rejects schema-invalid payload (non-string goals)", async () => {
    const handlers = await getHandlers("@/routes/api/board.$team.$sprint");
    const res = await handlers.PUT({
      request: new Request("http://x/api/board/team-a/S0", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: [123, ""] }),
      }),
      params: { team: "team-a", sprint: "S0" },
    });
    expect(res.status).toBe(400);
  });
});
