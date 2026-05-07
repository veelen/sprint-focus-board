import { createFileRoute } from "@tanstack/react-router";
import { readBoard } from "@/lib/board-storage.server";

export const Route = createFileRoute("/api/board")({
  server: {
    handlers: {
      GET: async () => {
        const board = await readBoard();
        return Response.json(board);
      },
    },
  },
});
