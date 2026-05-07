import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { readBoard, writeCell } from "@/lib/board-storage.server";
import { cellKey, isSprint, isTeamId } from "@/lib/board-constants";

const BodySchema = z.object({
  goals: z.array(z.string().trim().min(1).max(280)).max(20),
});

export const Route = createFileRoute("/api/board/$team/$sprint")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { team, sprint } = params;
        if (!isTeamId(team) || !isSprint(sprint)) {
          return new Response("Unknown team or sprint", { status: 404 });
        }
        const board = await readBoard();
        const cell = board.cells[cellKey(team, sprint)];
        return Response.json({ team, sprint, goals: cell.goals });
      },
      PUT: async ({ request, params }) => {
        const { team, sprint } = params;
        if (!isTeamId(team) || !isSprint(sprint)) {
          return new Response("Unknown team or sprint", { status: 404 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const cell = await writeCell(team, sprint, parsed.data.goals);
        return Response.json({ team, sprint, goals: cell.goals });
      },
    },
  },
});
