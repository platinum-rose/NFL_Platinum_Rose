# NFL_Dashboard — Current Handoff

> Start here, then reconcile live Git. This is a routing index, not a transcript.
> Detailed history belongs in dated `handoffs/`; cross-team recovery material belongs in
> its dated H2C2 snapshot packet.

## Current pick-up point

**Latest session (2026-10-06 23:45 PT, Claude Team 2 — Week 4 close-out + automation):** `handoffs/2026-10-06-2345-claude-week4-archive-automation-postmortem-next-handoff.md`. Week 4 settled (0 open, net −$266.23) and archived (data/archive + Obsidian); weekly archive, all toolbox cadences and per-cadence Claude reports are now scheduled. **Next:** finish `week4-post-mortem.html` (§4), then Week 5 prep (§5).

Previous: `handoffs/2026-10-05-1720-claude-mnf-planner-experts-tickets-handoff.md` (MNF tickets, prop planner).

**H2C2 transfer to Claude Team 2 (Week 4 close-out / Week 5 launch):**

1. Read `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/H2C2_START_HERE.md`.
2. Run `git status -sb`, `git branch --show-current`, and `git log -5 --oneline`.
3. Choose one lane and load only the matching material from
   `handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`.

The snapshot was built at `6887ca8`; later commits may legitimately exist. Live Git is
authoritative. The detailed H2C2 briefing, its local copies, manifest, and chain digest
are at `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/`.

## Active lanes

- **Week 4 post-mortem page:** paper tickets, AI-rec grading, RR payouts, recommendation ledger (handoff §4).
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
