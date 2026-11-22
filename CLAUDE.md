# CLAUDE.md - AI Assistant Guidelines for NFL Platinum Rose

## Lean Session Rules (approved 2026-11-22)
Token burn is driven by step count x standing context (~150-170k tokens re-read per request in claude.ai chats). Follow these in every session:
1. One goal per session. Hand off at ~60 tool calls, not 150.
2. Batch related commands into one call. No task-list ticks or status messages for routine steps.
3. Quiet output by default: cap every command at ~40 lines (`| tail -n 40`). Git: counts or path-filtered status only. Long scripts (build.py, roster vet, site diag) go through `scripts/quiet.sh <label> -- <cmd>` (full log saved, summary printed).
4. No whole-file reads over ~5 KB; grep/sed the section needed.
5. One START-HERE handoff per session, under 3 KB, and read only that one.
6. Write the handoff to project docs once, at session close. Keep only the latest 2 handoffs in the claude.ai project; older ones live in `handoffs/`.
7. Screenshots only when a visual check is the point.
8. Moved reference material is in `docs/CLAUDE_REFERENCE.md` - grep it for the section you need; never load it whole.

## Project Overview
NFL betting analytics and line shopping dashboard (React + Vite + Tailwind CSS).
Integrates real-time odds from 8 sportsbooks, tracks betting performance, manages expert picks, and provides simulation-based edge analysis.

**Repository**: https://github.com/andrewlrose/NFL_Platinum_Rose
**Workspace (Windows dev)**: `E:\dev\projects\NFL_Dashboard`
**Workspace (M6/Linux)**: `~/projects/NFL_Dashboard` (path may vary — use GitHub URL as canonical)
**Dev URL**: http://localhost:5173/platinum-rose-app/

## Orchestration Directives
1. **Agent-first**: Route work to the specialist agent with deepest domain knowledge. See `AGENTS.md` routing guide.
2. **Context check**: Read `HANDOFF.md` at session start, then reconcile live Git state. Current mode determines current priorities.
3. **Rules are laws**: `RULES.md` must-never rules require explicit Creator approval to override.
4. **Anti-patterns are supreme**: Read `docs/ANTI_PATTERNS.md` before touching dates, team names, storage keys, or scoring logic.
5. **Quality gates are self-enforced**: Run tests before closing tasks, lint changed files, check for stray `console.log` before commit.
6. **Hot files require PM lock**: `App.jsx`, `storage.js`, `picksDatabase.js`, `CLAUDE.md`, `AGENT_LOCK.json` — claim explicit scope before editing.

## Key Commands
```bash
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npm run update-schedule  # Refresh schedule.json from external source
```

> Before touching dates, team names, or storage keys: **see `docs/ANTI_PATTERNS.md`** first.

## Placed Wagers Ledger (Manually-Placed Real/Promo Tickets)
`data/official-picks/user-placed-wagers-2026.json` is the SINGLE SOURCE OF TRUTH for every wager Andy has actually placed at a sportsbook (Bovada, Bookmaker.eu, BetOnline, DraftKings Predictions, etc.) — distinct from `platinum-rose-ai-2026.json` (the AI's own paper-tracked picks). Every new or edited ticket goes into this file ONLY. Never write ticket data directly to `public/user-placed-wagers-2026.json` (a generated hydration copy), the Supabase `user_bankroll_bets` table (a sync target), `data/futures-imports/*` (raw sportsbook account/futures exports — not weekly wager tickets, see `docs/ANTI_PATTERNS.md` Storage & Data), or either live-tracker HTML file. After any change to the master ledger, run `node scripts/sync-placed-wagers-to-bankroll.mjs` to propagate to `public/` + Supabase, then `node scripts/generate-live-tracker.mjs` to rebuild both tracker HTML copies. See `docs/ANTI_PATTERNS.md` for the 2026-09-13 incident where 3 tickets were logged to the wrong file and went untracked for days.

## AI record at proposal time (all agents) — added 2026-11-04
Every card, ladder, parlay or promo proposal writes its legs to the machine-readable AI record **when it is proposed**, not after the week:
`python3 reports/bets/season-recap/scripts/ai_record.py add --week <N> --file <proposal.json>` → `data/official-picks/ai-proposals/2026-wNN.json`.
Schema and leg keys are in the script's docstring (`ai_record.py show --week <N>` lists what's logged). Mark replaced builds `status --set superseded`.
This is the AI side of the Tuesday post-mortem (AI-backed vs Andy-only vs unplaced AI); a proposal that isn't logged doesn't exist for grading.

## NFL Roster Gate (mandatory)

**ROSTER GATE (mandatory since 2026-09-27).** Never state a player's team, role or status from memory — 2026 rosters have changed (A.J. Brown is a Patriot, Mike Evans a 49er, Rachaad White a Commander). Every player named in the digest, card, narratives, matchup seeds and picks must pass `npm run roster:vet -- --week <N> --date <capture-date> --fetch --strict` (wraps `scripts/nfl-rosters/roster_vet.py` and finds Python even where `python3` isn't on PATH) against the live ESPN 2026 rosters (all 32 teams incl. IR and practice squad; auto-refreshed when >24h old). A BLOCK means stop and fix; nothing is presented, built or placed on a failing vet. The preflight and `scripts/master-intel/build.py` both run it and fail on it.

## Reference Docs (load on demand)
- `docs/OPERATIONS_MAP.md` — Betting operations map: capture commands and ports, ledgers, rules and pre-buy checks, futures, pools, bankroll reconciliation; **load at session start for any betting, capture, ledger, futures or pool task**
- `docs/ARCHITECTURE.md` — Component/hook/lib internals; load when editing any `src/` file
- `docs/PIPELINE_AGENTS.md` — GHA pipeline agent system, workflows, Supabase tables; load when working in `agents/` or `.github/`
- `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md` — canonical Antigravity exhaustive extraction source contract; load before synthesizing betting recommendations or reporting podcast/article coverage gaps
- `docs/MASTER_INTEL_REPORT_FORMAT.md` + `docs/MASTER_INTEL_REPORT_RUNBOOK.md` — weekly Saturday-night Master Intel Report: locked template v1 format, hand-written inputs, build steps, 5-format export (html/pdf/docx/md/json); load when asked for the intel report
- `docs/TESTING.md` — Verification checklists; load after changes to App.jsx, storage, or parsers
- `docs/ROADMAP.md` — Feature tracking & completed phases; load for planning tasks
- `docs/HANDOFF.md` — `/handoff` command output format; load on `/handoff`
- `docs/ANTI_PATTERNS.md` — Categorized anti-patterns; load before touching dates, team names, storage keys
- `AGENTS.md` — Agent routing guide + lock protocol; load when delegating work
- `HANDOFF.md` — Current root handoff index; load at session start
- `WORKING-CONTEXT.md` — Compatibility pointer; load only if a tool/prompt still references it
- `RULES.md` — Must-always / must-never rules; load for any code change

<!-- BEGIN UNIFIED SESSION CONTEXT PROTOCOL -->

## Moved to docs/CLAUDE_REFERENCE.md (load on demand, by section)
- File Structure Conventions
- Vite Config
- Environment Variables
- Tab Routing (App.jsx)
- localStorage Keys
- API Integrations
- Sportsbooks Integrated
- Session Protocols
- Custom Commands
- Workflow & Process
- Learnings & Gotchas
- Anti-Patterns to Avoid
- Style Constants
- Unified Session Context Protocol (Claude, Codex, Antigravity, VS Code Copilot)
