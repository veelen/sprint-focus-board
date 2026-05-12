import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BoardPage } from "@/routes/index";

type Cell = { goals: string[] };
type Board = {
  teams: { id: string; name: string }[];
  sprints: { id: string; startDate: string; endDate: string }[];
  sprintStartDate: string;
  cells: Record<string, Cell>;
};

function makeBoard(overrides: Partial<Record<string, string[]>> = {}): Board {
  const teams = [
    { id: "team-a", name: "TeamA" },
    { id: "team-b", name: "TeamB" },
    { id: "team-c", name: "TeamC" },
    { id: "team-d", name: "TeamD" },
  ];
  const sprints = ["S0", "S1", "S2", "S3"].map((id, i) => ({
    id,
    startDate: `2026-01-${String(1 + i * 14).padStart(2, "0")}`,
    endDate: `2026-01-${String(14 + i * 14).padStart(2, "0")}`,
  }));
  const cells: Record<string, Cell> = {};
  for (const t of teams) for (const s of sprints) cells[`${t.id}|${s.id}`] = { goals: overrides[`${t.id}|${s.id}`] ?? [] };
  return { teams, sprints, sprintStartDate: "2026-01-01", cells };
}

function renderBoard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BoardPage />
    </QueryClientProvider>,
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BoardPage rendering", () => {
  it("renders the 4x4 matrix with team names and sprint columns", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeBoard()), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    renderBoard();
    for (const name of ["TeamA", "TeamB", "TeamC", "TeamD"]) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
    for (const sprint of ["S0", "S1", "S2", "S3"]) {
      expect(screen.getAllByText(sprint).length).toBeGreaterThan(0);
    }
  });

  it("shows N.T.B. in empty cells", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeBoard()), { status: 200 }),
    );
    renderBoard();
    const ntbs = await screen.findAllByText("N.T.B.");
    expect(ntbs).toHaveLength(16);
  });

  it("shows existing goals as bullets", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeBoard({ "team-a|S0": ["Doel A", "Doel B"] })), { status: 200 }),
    );
    renderBoard();
    expect(await screen.findByText("Doel A")).toBeInTheDocument();
    expect(screen.getByText("Doel B")).toBeInTheDocument();
  });
});

describe("BoardPage edit flow (integration)", () => {
  it("cancel does not call PUT", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeBoard()), { status: 200 }),
    );
    renderBoard();
    const cell = (await screen.findAllByText("N.T.B."))[0].closest("td")!;
    await userEvent.click(cell);
    const textarea = await screen.findByPlaceholderText("Eén doel per regel");
    await userEvent.type(textarea, "Niet opslaan");
    await userEvent.click(screen.getByRole("button", { name: /annuleren/i }));
    // only the GET happened
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("save sends PUT to the right endpoint and updates UI on refetch", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeBoard()), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ team: "team-a", sprint: "S0", goals: ["Nieuw doel"] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeBoard({ "team-a|S0": ["Nieuw doel"] })), { status: 200 }),
      );

    renderBoard();
    // first cell of first team row = team-a / S0
    const firstCell = (await screen.findAllByText("N.T.B."))[0].closest("td")!;
    await userEvent.click(firstCell);
    const textarea = await screen.findByPlaceholderText("Eén doel per regel");
    await userEvent.type(textarea, "Nieuw doel");
    await userEvent.click(screen.getByRole("button", { name: /opslaan/i }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PUT");
      expect(putCall).toBeTruthy();
      expect(putCall![0]).toBe("/api/board/team-a/S0");
      expect(JSON.parse(putCall![1].body)).toEqual({ goals: ["Nieuw doel"] });
    });

    expect(await screen.findByText("Nieuw doel")).toBeInTheDocument();
    void within;
  });
});
