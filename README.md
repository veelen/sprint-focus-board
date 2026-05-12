# Outlook Bord OTT

Digitaal whiteboard met een 4×4 matrix (TeamA–D × S0–S3) en sprintdoelen per cel.

## Development

```bash
bun install
bun run dev
```

## Tests

De applicatie heeft tests op alle lagen.

| Laag | Tool | Bestanden |
| --- | --- | --- |
| API / storage | Vitest (Node) | `tests/api/*.test.ts` |
| Frontend / integratie | Vitest + React Testing Library (jsdom) | `tests/frontend/*.test.tsx` |
| End-to-end / smoke | Playwright (Chromium) | `tests/e2e/*.spec.ts` |

### Scripts

```bash
bun run test          # alle Vitest tests (API + frontend + integratie)
bun run test:api      # alleen API/storage tests
bun run test:frontend # alleen component/integratie tests
bun run test:e2e      # Playwright smoke test (vereist browser, zie hieronder)
bun run test:all      # vitest + playwright
bun run test:watch    # vitest in watch-mode
```

### Wat er getest wordt

**API (`tests/api/`)**
- `GET /api/board` — leeg bord, default teams, 4 sprints
- `GET /api/board/:team/:sprint` — bestaande/lege doelen, 404 voor onbekende team/sprint
- `PUT /api/board/:team/:sprint` — opslaan, persistentie, ongeldige JSON, schema-validatie
- Storage helpers: `readBoard`, `writeCell`, `renameTeam` (incl. duplicate-check), `rollForward`

**Frontend (`tests/frontend/`)**
- Rendering van de 4×4 matrix, teamnamen en sprintkolommen
- Lege cellen tonen `N.T.B.`
- Bestaande doelen worden als bullets gerenderd
- Inline edit-mode: cancel doet géén PUT; opslaan doet de juiste PUT en UI update

**E2E / smoke (`tests/e2e/smoke.spec.ts`)**
Open bord → verifieer matrix → bewerk TeamA/S0 → opslaan → verifieer zichtbaar → reload → verifieer nog steeds zichtbaar.

### Playwright eerste keer opzetten

```bash
bunx playwright install --with-deps chromium
bun run test:e2e
```

De Playwright config (`playwright.config.ts`) start automatisch `bun run dev` als er nog geen server draait (poort 8080). Tussen tests reset hij het bord via de API zodat de smoke test hermetisch is.

### Test-only env var

`OUTLOOK_BOARD_FILE` overschrijft het pad waar de server JSON-data opslaat (default `/tmp/outlook-board.json`). De Vitest API-tests gebruiken dit om elke testcase op een eigen tijdelijk bestand te draaien.
