import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { setSprintStartDate } from "@/lib/board-storage.server";

const BodySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const Route = createFileRoute("/api/board/start-date")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
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
        const startDate = await setSprintStartDate(parsed.data.startDate);
        return Response.json({ startDate });
      },
    },
  },
});
