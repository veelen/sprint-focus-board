import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { renameTeam } from "@/lib/board-storage.server";
import { isTeamId } from "@/lib/board-constants";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export const Route = createFileRoute("/api/teams/$teamId")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const { teamId } = params;
        if (!isTeamId(teamId)) {
          return new Response("Unknown team", { status: 404 });
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
        try {
          const teams = await renameTeam(teamId, parsed.data.name);
          return Response.json({ teams });
        } catch (e) {
          if ((e as Error).message === "DUPLICATE_NAME") {
            return Response.json({ error: "Teamnaam moet uniek zijn" }, { status: 409 });
          }
          throw e;
        }
      },
    },
  },
});
