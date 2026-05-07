## Outlook Bord — MVP plan

Een digitaal whiteboard voor de afdeling: matrix met 4 teams (rijen) × 4 sprints (kolommen). Elke cel toont sprintdoelen, inline bewerkbaar door iedereen.

### Pagina's
Eén pagina op `/`:
- Header: "Outlook Bord OTT" + uitleg sprints (S0 = huidige).
- Matrix-tabel: rijen TeamA–TeamD, kolommen S0–S3.
- Elke cel: lijst sprintdoelen (bullets). Lege cellen krijgen lichtrode achtergrond + tekst "N.T.B.".
- Cel klikken → inline bewerken: textarea waar elke regel = één doel. Knoppen Opslaan / Annuleren. Tijdens opslaan: spinner; daarna toast bij succes/fout.
- "Vernieuwen" knop rechtsboven.

### Responsive
- Desktop/laptop: volledige matrix zichtbaar, ruime padding.
- Tablet/mobiel: zelfde matrix, horizontaal scrollbaar; team-kolom blijft sticky links zodat doelen herkenbaar gekoppeld blijven.

### Visueel
- Whiteboard-look: lichte achtergrond, duidelijke borders, sprint-headers in kleur, team-labels vet.
- Lege cel: subtiele rode tint + "N.T.B." placeholder, consistent op alle breedtes.
- Geselecteerde (bewerkende) cel: duidelijke focus-ring.

### Data & API
Storage: JSON-bestand op de server (Lovable Cloud niet nodig — geen auth, geen realtime).

Server routes onder `src/routes/api/`:
- `GET /api/board` → `{ teams: [...], sprints: [...], cells: { "TeamA|S0": { goals: [...] }, ... } }`. Lege matrix als nog geen data.
- `GET /api/board/:team/:sprint` → `{ team, sprint, goals }`, 404 bij onbekend.
- `PUT /api/board/:team/:sprint` met `{ goals: string[] }` → valideert team/sprint, slaat op, geeft cel terug.

Teams en sprints zijn constanten (`["TeamA","TeamB","TeamC","TeamD"]`, `["S0","S1","S2","S3"]`).

### Technische details
- TanStack Start server routes voor API; JSON-file via `fs` in `/tmp/outlook-board.json` (Worker virtual fs).
- Frontend: één route `src/routes/index.tsx`, fetch via React Query, mutatie via `PUT`, invalidate na succes.
- Validatie met Zod in PUT handler (max lengte per goal, max aantal goals).
- Inline edit-state lokaal in component; geen modal/side panel.
- Toasts via bestaande `sonner`.

### Open punten geadresseerd
- Mobiel: horizontale scroll matrix met sticky team-kolom.
- Edit: open voor iedereen, geen login.
- Sync: handmatig refresh + automatische refetch na eigen save.
