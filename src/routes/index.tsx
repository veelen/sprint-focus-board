import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TEAMS, SPRINTS, cellKey, type Board } from "@/lib/board-constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outlook Bord OTT" },
      { name: "description", content: "Digitaal Outlook Bord met sprintdoelen per team." },
      { property: "og:title", content: "Outlook Bord OTT" },
      { property: "og:description", content: "Digitaal Outlook Bord met sprintdoelen per team." },
    ],
  }),
  component: BoardPage,
});

async function fetchBoard(): Promise<Board> {
  const res = await fetch("/api/board");
  if (!res.ok) throw new Error("Kon bord niet laden");
  return res.json();
}

async function saveCell(team: string, sprint: string, goals: string[]) {
  const res = await fetch(`/api/board/${team}/${sprint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goals }),
  });
  if (!res.ok) throw new Error("Opslaan mislukt");
  return res.json();
}

function BoardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["board"],
    queryFn: fetchBoard,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Outlook Bord OTT
            </h1>
            <p className="text-sm text-muted-foreground">
              Sprintdoelen per team — S0 is de huidige sprint, S1–S3 komen daarna.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Vernieuwen
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laden…
          </div>
        )}
        {isError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Kon het bord niet laden. Probeer te vernieuwen.
          </div>
        )}
        {data && (
          <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-32 border-b border-r bg-muted px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Team
                  </th>
                  {SPRINTS.map((s, i) => (
                    <th
                      key={s}
                      className="border-b bg-secondary px-4 py-3 text-left text-sm font-semibold text-secondary-foreground"
                    >
                      <div className="flex items-baseline gap-2">
                        <span>{s}</span>
                        {i === 0 && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
                            Huidig
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEAMS.map((team) => (
                  <tr key={team}>
                    <th className="sticky left-0 z-10 w-32 border-b border-r bg-muted px-4 py-3 text-left align-top text-sm font-semibold text-foreground">
                      {team}
                    </th>
                    {SPRINTS.map((sprint) => (
                      <BoardCell
                        key={sprint}
                        team={team}
                        sprint={sprint}
                        goals={data.cells[cellKey(team, sprint)]?.goals ?? []}
                        onSaved={() => qc.invalidateQueries({ queryKey: ["board"] })}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: klik op een cel om sprintdoelen toe te voegen of te wijzigen. Eén doel per regel.
        </p>
      </main>
    </div>
  );
}

function BoardCell({
  team,
  sprint,
  goals,
  onSaved,
}: {
  team: string;
  sprint: string;
  goals: string[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goals.join("\n"));
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setText(goals.join("\n"));
  }, [goals, editing]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const mutation = useMutation({
    mutationFn: (next: string[]) => saveCell(team, sprint, next),
    onSuccess: () => {
      toast.success(`${team} · ${sprint} opgeslagen`);
      setEditing(false);
      onSaved();
    },
    onError: () => {
      toast.error("Opslaan mislukt — probeer opnieuw");
    },
  });

  const isEmpty = goals.length === 0;

  function handleSave() {
    const next = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    mutation.mutate(next);
  }

  function handleCancel() {
    setText(goals.join("\n"));
    setEditing(false);
  }

  if (editing) {
    return (
      <td className="border-b border-l align-top">
        <div className="flex h-full flex-col gap-2 p-2 ring-2 ring-primary ring-inset">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Eén doel per regel"
            rows={5}
            className="resize-y text-sm"
            disabled={mutation.isPending}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Annuleren
            </Button>
            <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Opslaan
            </Button>
          </div>
        </div>
      </td>
    );
  }

  return (
    <td
      onClick={() => setEditing(true)}
      className={
        "cursor-pointer border-b border-l p-3 align-top text-sm transition-colors hover:bg-accent/50 " +
        (isEmpty ? "bg-destructive/5" : "")
      }
    >
      {isEmpty ? (
        <span className="inline-flex items-center rounded border border-dashed border-destructive/40 px-2 py-0.5 text-xs font-medium text-destructive/80">
          N.T.B.
        </span>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-foreground">
          {goals.map((g, i) => (
            <li key={i} className="break-words">
              {g}
            </li>
          ))}
        </ul>
      )}
    </td>
  );
}
