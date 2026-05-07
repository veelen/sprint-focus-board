import { createFileRoute } from "@tanstack/react-router";
import { rollForward } from "@/lib/board-storage.server";

export const Route = createFileRoute("/api/board/roll-forward")({
  server: {
    handlers: {
      POST: async () => {
        const board = await rollForward();
        return Response.json(board);
      },
    },
  },
});
