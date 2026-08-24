# NFL_Dashboard Deep Audit — Prioritized Backlog (2026-08-21)

> Companion to `NFL_DASHBOARD_AUDIT_REPORT_2026-08-21.md`. Nothing here has
> been executed yet — mechanical items are ready to run once Andy confirms;
> code-touching items need their own scoped sessions per the original audit
> prompt's constraints (protect the core dashboard/bankroll, no regressions).

## Critical

- [ ] **AUDIT-001** — Fix the Bet Management ("Bankroll" popup) data mapping.
      Every game option renders "undefined @ undefined," Team never
      populates, Kelly sizing shows `$NaN`. Sits inside paramount-priority
      bankroll/portfolio management. See report §1a.
- [ ] **AUDIT-002** — Add a timeout + error state to the Picks & Inbox tab's
      `127.0.0.1:8787` local-server check; document the dependency if it's
      expected to run. Currently an unexplained infinite spinner. See §1b.

## High

- [ ] **AUDIT-003** — Code-split the ~23 eagerly-loaded modal components
      behind `React.lazy`/dynamic `import()`. Most concrete lead for the
      in-browser sluggishness complaint. Verify with before/after production
      bundle size. See §2a.
- [ ] **AUDIT-004** — Determine why TheOddsAPI returned 0 games locally:
      check deployed production site to isolate config-vs-bug, then fix
      accordingly. See §1c.
- [ ] **AUDIT-005** — Collapse the 321 per-game `console.warn` calls (one per
      game with no live odds) into a single summary log. See §2b.

## Medium

- [ ] **AUDIT-006** — Regenerate/wire up the local YouTube futures intel data
      the Sides & Totals agent depends on — currently empty for both Super
      Bowl and Chiefs futures prompts. See §1e.
- [ ] **AUDIT-007** — Downgrade the "Splits not found" console warning to
      match its actually-correct UI empty state (or log at info level) so it
      stops reading as a bug during future debugging. See §1d.
- [ ] **AUDIT-008** — Trim `TASK_BOARD.md`'s oversized Notes-column entries
      to one-line summaries + links to their existing detail docs (the size
      is concentrated in a few cells, not the task count). See §3e.

## Low / mechanical cleanup (safe once Andy confirms)

- [ ] **AUDIT-009** — Delete the 8 stale build-verification directories
      (`dist.old-*` ×6, `dist-verify-2026-08-13*` ×2, ~34MB total) after
      confirming nothing references them. See §3a.
- [ ] **AUDIT-010** — Remove `docs/The Genius of Desperation.epub` and its
      `.acsm` license file — a personal ebook unrelated to the project's
      mission, not project documentation. See §3b.
- [ ] **AUDIT-011** — Sort `docs/` into living specs (keep) vs. completed
      point-in-time artifacts (move to `docs/archive/`) per the Pile 1/2/3
      classification in the report — roughly 25-30 files identified as
      archive candidates, worth a full confirmation pass rather than treating
      the report's list as final. See §3c.
- [ ] **AUDIT-012** — Decide the right home for the large data-dump
      directories currently living under `docs/` (`podcast-transcript-deep-dives`,
      `Futures_Odds`, `article-intel-review`, `player-availability`,
      `prediction-markets`, `fantasy`, `podcast-narratives`, `antigravity`,
      `projected-starters` — ~18MB combined): regenerable pipeline cache
      (gitignore + move to `data/`) vs. genuine reference material (leave
      as-is). See §3d.

## Deferred / needs more investigation before action

- [ ] **AUDIT-013** — Confirm whether the `_LATEST` naming pattern
      (`FUTURES_ODDS_EXECUTION_VALIDATION_LATEST.md`,
      `NFL_INTEL_SOURCE_AUDIT_LATEST.html`,
      `SEASON_READINESS_SMOKE_TEST_LATEST.md`) is meant to supersede their
      dated siblings — if so, fold the dated versions into AUDIT-011. See §3c
      Pile 3.
- [ ] **AUDIT-014** — Decide on a rotation/archive convention for
      `handoffs/` (54 dated files, 444K) — not urgent, but will keep growing
      unbounded without one. See §3g.
- [ ] **AUDIT-015** — Confirm whether "Add Bet" in the broken Bankroll modal
      fails loudly or silently writes bad data if forced through — needs a
      test-data-safe way to check without touching Andy's real Supabase
      tables. See report §4.
