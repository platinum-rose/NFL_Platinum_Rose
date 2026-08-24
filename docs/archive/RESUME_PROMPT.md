You are resuming an active development session on **NFL Dashboard (Platinum Rose)**.

## Project

- **Repo:** `E:\dev\projects\NFL_Dashboard` — branch `main`, HEAD `5c3e066`
- **Frontend:** Vite 7.3.1 + React 18, dev server `http://localhost:5173/platinum-rose-app/`
- **AI layer:** Anthropic `claude-sonnet-4-5` + OpenAI `gpt-4o-mini`, called from `src/lib/anthropicClient.js` (pure browser)
- **Data layer:** Supabase PostgreSQL — migrations 001–012 ALL applied
- **Tests:** Vitest — 80/80 unit tests passing

## What's Built (key layers)

- **BETTING agent** (`AgentChat.jsx` + `agentTools.js`) — 11 tools: analyze matchup, get picks, search intel, get performance stats, read/write vault notes, and others
- **System prompt pre-loads:** research intel notes, performance stats, vault reference notes (3000-char cap each), season phase awareness
- **Intel pipeline:** `research_intel_notes` + `research_pick_signals` from Action Network / VSiN / ESPN RSS; Postgres FTS via tsvector; GHA runs 2×/day
- **Game odds:** `game_odds_snapshots` (spreads, h2h, totals) via TheOddsAPI; GHA runs hourly on game days
- **Vault (F-12):** dual-backend `VaultClient` — Obsidian REST API locally, Supabase `vault_notes` table in production; switch via `VITE_VAULT_BACKEND` env
- **Props agent** (`PropsAgentChat.jsx` + `propsTools.js`) — DK/FD, 7 tools, auto-grade GHA
- **DFS optimizer** (`DFSOptimizer.jsx`) — DK/FD platform toggle, greedy optimizer

## Active Backlog (next work)

- **F-13** (P2) — Twitter/X sharp-account ingestion; blocked on X API access decision
- **F-14** (P2) — Vault pre-load with historical stats, rosters, coaching data (offseason work)

## Rules

- All server-side agents use `dotenv/config` + `SUPABASE_SERVICE_ROLE_KEY` (never ANON_KEY for writes)
- `VITE_` prefix for browser env vars; no `VITE_` prefix for Node agent env vars
- Every archived agent run writes a `.nfl/receipts/` JSON receipt
- Vault write tool enforces `NFL/` path prefix — no exceptions
- Never commit `.nfl/receipts/`, `supabase/.temp/`, or decrypted PII

## Where to start (follow in order)

1. **Read `HANDOFF.md`** — check `## Persistent Backlogs` table first.
   For each backlog row, read the referenced file and surface the top 2–3 open items
   to the user **before starting any other work**.
   - **Do NOT begin new feature work if any CRITICAL items are open in `docs/NFL_AUDIT_BACKLOG.md`**
     — surface them and get explicit acknowledgement to defer.
2. **Read `TASK_BOARD.md`** — confirm active feature work aligns with no open blockers.
3. **Confirm dev server**: `npm run dev` → `http://localhost:5173/platinum-rose-app/`

## Session-close checklist (run before ending)

1. Mark completed backlog items `[x]` in `docs/NFL_AUDIT_BACKLOG.md`
2. Update `HANDOFF.md` Persistent Backlogs table — new Open Items count + Last Touched date
3. Update `HANDOFF.md ## Pick Up Here` with session summary (≤ 30 lines)
4. Commit: `git commit -m "S<N>: <ITEM-ID> — <short description>"`
