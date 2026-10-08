# NFL_Dashboard — Current Handoff

> Start here, then reconcile live Git. This is a routing index, not a transcript.
> Detailed history belongs in dated `handoffs/`; cross-team recovery material belongs in
> its dated H2C2 snapshot packet.

## Current pick-up point

**Latest session (2026-10-08 PT, Codex — TNF props and article-ingestion audit):** `handoffs/2026-10-08-codex-tnf-article-intake-handoff.md`. Fresh TB @ DAL BKR/BEO price captures remain raw evidence; no ticket was proposed, created, or placed. `Mar'Keise Irving` is saved as an alias of Bucky Irving. **Next:** audit the available article corpus and extract only reviewable Week 5/TNF selections; do not promote a lead into a ticket, ledger, or official pick without current authorization.

Previous: `handoffs/2026-10-07-0105-claude-week4-postmortem-done-week5-prep-handoff.md` (Week 4 post-mortem, Week 5 prep).

**H2C2 transfer to Claude Team 2 (Week 4 close-out / Week 5 launch):**

1. Read `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/H2C2_START_HERE.md`.
2. Run `git status -sb`, `git branch --show-current`, and `git log -5 --oneline`.
3. Choose one lane and load only the matching material from
   `handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`.

The snapshot was built at `6887ca8`; later commits may legitimately exist. Live Git is
authoritative. The detailed H2C2 briefing, its local copies, manifest, and chain digest
are at `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/`.

## Active lanes

- **Article intake (next):** review captured Week 5/TNF articles and extract only
  attributable, quoted selections with source, timestamp, market, line, and price/book
  provenance; preserve context/inference separately from picks.
- **TNF player props:** read-only evidence and current player-prop price gathering for
  TB @ DAL; maintain the roster/evidence gates and keep analysis separate from tickets.
- **Week 5 lines and promos:** missing BKR games, CHI@GB time correction, and only
  authorized Bills-credit/reload work.
- **Week 4 analysis:** paper-ticket grading, recommendation-ledger separation, and
  end-of-week analysis.
- **Week 5 Master Intel:** evidence cadence only; no wagering synthesis before the
  documented readiness gates pass.

## Guardrails

- Preserve the dirty shared checkout. Never reset, clean, stash, broad-stage, or delete
  unrelated work; never use `git add -A`.
- Sportsbooks are read-only. Do not place wagers, make account/cashier actions, or call
  TheOddsAPI.
- Supabase writes, paid synthesis, portfolio/ledger changes, and official-pick promotion
  require current, specific authorization. Keep real, paper, and proposed records separate.
- Run the roster gate before presenting player-specific cards or narratives.
- If live Git or current evidence contradicts a handoff, stop and report the mismatch.

## Maintenance rule

Keep this file under one screen: one current pickup, active lanes, guardrails, and stop
conditions. A standard handoff adds one dated file and updates this pointer. A zero-context
team/platform transfer uses the `h2c2` skill: start brief, detailed packet, and manifest
of locally preserved nonportable inputs.
