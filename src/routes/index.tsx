import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RefreshCw, FastForward, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  cellKey,
  formatDateNL,
  type Board,
  type Team,
  type SprintInfo,
} from "@/lib/board-constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outlook Bord OTT" },
      { name: "description", content: "Digitaal Outlook Bord met sprintdoelen per team." },
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

async function saveTeamName(teamId: string, name: string) {
  const res = await fetch(`/api/teams/${teamId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Opslaan mislukt");
  }
  return res.json();
}

async function saveStartDate(startDate: string) {
  const res = await fetch(`/api/board/start-date`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate }),
  });
  if (!res.ok) throw new Error("Opslaan mislukt");
  return res.json();
}

async function rollForward() {
  const res = await fetch(`/api/board/roll-forward`, { method: "POST" });
  if (!res.ok) throw new Error("Doorschuiven mislukt");
  return res.json();
}

export function BoardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["board"],
    queryFn: fetchBoard,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["board"] });

  const rollMutation = useMutation({
    mutationFn: rollForward,
    onSuccess: () => {
      toast.success("Sprints zijn doorgeschoven");
      invalidate();
    },
    onError: () => toast.error("Doorschuiven mislukt"),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          <span className="inline-flex h-7 items-center rounded-sm bg-primary-foreground px-2 text-sm font-extrabold tracking-tight text-primary">
            KPN
          </span>
          <span className="text-xs font-medium uppercase tracking-wider opacity-90">
            OTT · Outlook Bord
          </span>
        </div>
      </div>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Outlook Bord OTT
            </h1>
            <p className="text-sm text-muted-foreground">
              Sprintdoelen per team — S0 is de huidige sprint, S1–S3 komen daarna.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={rollMutation.isPending}>
                  {rollMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FastForward className="h-4 w-4" />
                  )}
                  Sprint doorschuiven
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sprints doorschuiven?</AlertDialogTitle>
                  <AlertDialogDescription>
                    De huidige S0 vervalt. S1 wordt de nieuwe S0, S2 wordt S1, S3 wordt S2,
                    en er komt een lege S3 bij. De startdatum schuift 14 dagen op.
                    Deze actie kan niet ongedaan gemaakt worden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={() => rollMutation.mutate()}>
                    Doorschuiven
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {data && (
          <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
            <StartDateEditor
              startDate={data.sprintStartDate}
              onSaved={invalidate}
            />
          </div>
        )}
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
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-40 border-b border-r bg-muted px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Team
                  </th>
                  {data.sprints.map((s, i) => (
                    <th
                      key={s.id}
                      className="border-b bg-secondary px-4 py-3 text-left text-sm font-semibold text-secondary-foreground"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                          <span>{s.id}</span>
                          {i === 0 && (
                            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
                              Huidig
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-normal text-muted-foreground">
                          {formatDateNL(s.startDate)} – {formatDateNL(s.endDate)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.teams.map((team) => (
                  <tr key={team.id}>
                    <th className="sticky left-0 z-10 w-40 border-b border-r bg-muted px-2 py-3 text-left align-top text-sm font-semibold text-foreground">
                      <TeamNameEditor team={team} onSaved={invalidate} />
                    </th>
                    {data.sprints.map((sprint: SprintInfo) => (
                      <BoardCell
                        key={sprint.id}
                        teamId={team.id}
                        teamName={team.name}
                        sprint={sprint.id}
                        goals={data.cells[cellKey(team.id, sprint.id)]?.goals ?? []}
                        onSaved={invalidate}
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

function StartDateEditor({
  startDate,
  onSaved,
}: {
  startDate: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(startDate);

  useEffect(() => {
    if (!editing) setValue(startDate);
  }, [startDate, editing]);

  const mutation = useMutation({
    mutationFn: () => saveStartDate(value),
    onSuccess: () => {
      toast.success("Startdatum opgeslagen");
      setEditing(false);
      onSaved();
    },
    onError: () => toast.error("Opslaan mislukt"),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Startdatum S0: <strong className="text-foreground">{formatDateNL(startDate)}</strong></span>
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" /> Wijzigen
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-44"
        disabled={mutation.isPending}
      />
      <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        <Check className="h-3 w-3" /> Opslaan
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setValue(startDate);
          setEditing(false);
        }}
        disabled={mutation.isPending}
      >
        <X className="h-3 w-3" /> Annuleren
      </Button>
    </div>
  );
}

function TeamNameEditor({ team, onSaved }: { team: Team; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setName(team.name);
  }, [team.name, editing]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const mutation = useMutation({
    mutationFn: () => saveTeamName(team.id, name.trim()),
    onSuccess: () => {
      toast.success("Teamnaam opgeslagen");
      setEditing(false);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message || "Opslaan mislukt"),
  });

  function handleSave() {
    if (!name.trim()) {
      toast.error("Teamnaam mag niet leeg zijn");
      return;
    }
    mutation.mutate();
  }

  if (!editing) {
    return (
      <div className="group flex items-center justify-between gap-1">
        <span className="break-words">{team.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 shrink-0 p-0 opacity-0 group-hover:opacity-100"
          onClick={() => setEditing(true)}
          aria-label="Teamnaam wijzigen"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 text-sm"
        disabled={mutation.isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setName(team.name);
            setEditing(false);
          }
        }}
        maxLength={40}
      />
      <div className="flex items-center gap-1">
        <Button size="sm" className="h-7 px-2" onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => {
            setName(team.name);
            setEditing(false);
          }}
          disabled={mutation.isPending}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function BoardCell({
  teamId,
  teamName,
  sprint,
  goals,
  onSaved,
}: {
  teamId: string;
  teamName: string;
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
    mutationFn: (next: string[]) => saveCell(teamId, sprint, next),
    onSuccess: () => {
      toast.success(`${teamName} · ${sprint} opgeslagen`);
      setEditing(false);
      onSaved();
    },
    onError: () => toast.error("Opslaan mislukt — probeer opnieuw"),
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
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={mutation.isPending}>
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
