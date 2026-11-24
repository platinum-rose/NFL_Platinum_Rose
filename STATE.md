# STATE — NFL_Dashboard (single current-state file; rewrite, don't append; max 40 lines)
Updated: Tue 2026-11-24 ~2:00 PM PT (Claude Team 1). HANDED OFF to Claude Team 2: read handoffs/2026-11-24-1400-claude-h2c2-team2-briefing-w12-pools-prep.md. Reconcile live git before trusting this.

## Repo
- Branch `claude/w5-prop-cards-2026-10-11`; last commit `187d7db4` (pushed 11/24, H2C2 handoff). Tree dirty (~2,300 paths, mostly other sessions). Commit named paths only via the temp-index method (`GIT_INDEX_FILE=.git/tmp-idx git read-tree HEAD; git add -- <paths>; git write-tree; git commit-tree <tree> -p HEAD -F msg; git update-ref HEAD <new> <old>`).
- UNCOMMITTED, awaiting Andy OK: ledgers (`data/official-picks/user-placed-wagers-2026.json`, `paper-wagers-2026.json`, `public/user-placed-wagers-2026.json`), trackers (`scripts/generate-live-tracker*.mjs`, `public/live-tracker-*.html`, `docs/tracked-wagers/live-tracker-sunday.html`), `hooks/scripts/quality-gate.js`, `data/nfl-rosters/operator-status-overrides.json`, `reports/bets/2026-w11-mnf-island-v{2,3}.md`, `reports/bets/2026-w11-postmortem.md`, `reports/bets/season-recap/{w11*.json,work/w11/,rules/rules-2026.json,scripts/crosscheck-adjudications.json}`, `reports/analysis/season/claude/out/week-11*`, `docs/MASTER_INTEL_REPORT_RUNBOOK.md` (§3a), `docs/CODEX_FTN_STATS_IQ_CAPTURE_RUNBOOK.md` (39 tables + new format), `scripts/build-ftn-stats-weekly-context.js`, `scripts/normalize-ftn-export.py`, `scripts/analysis/matchup_splits.py`, `data/nflverse/2026/*` (thru W11 incl MNF; ftn_charting added), `data/research-intel/source-evidence/2026-11-24-ftn-stats-iq/`, `data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json`, `data/generated/matchup-splits/2026-w12.json`, `reports/bets/2026-w12-{gb-lar-matchup,chi-det-matchup,matchup-splits}.md`, `data/research-intel/action-network-picks/an-expert-picks-2026-week11-mnf.json`, (STATE.md now committed). Backups: `*.bak-claude-2026112[34]-*`.

## Week 11 — CLOSED (details: `reports/bets/2026-w11-postmortem.md`)
- Cash W11: 33 tickets, 1 won, $434.61 staked, net −$414.60 (+ xweek DKP 10-pick −$15, tagged W12). Season ledger: 397 settled, $5,621.77, net −$279.09 (−5.0%), 0 pending. bankroll.mjs counted: season −$1,056.78; exempt Andy share +$491.51.
- Paper W11: 55 settled from tracker grading, 6 won, −$167.89. Mobile tracker republished (W11 final) at https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy (slug bb25b564-71ba-426d-82bf-7ae16b1da5a2).
- Supabase NOT synced (rule); `public/` ledger copy refreshed locally.
- W12 rules: R11-1 $60 max cash per game ACTIVE (Andy 11/24). Still proposed (`rules.py accept --id R11-2`): R11-2 islands ≤6 tickets, 2–3 legs, Tier 1 no favourite-dependent leg.
- Lessons: 0/31 multi-leg cash; one-game concentration (MIN@SF, JAX@NYG, CIN@WAS) lost all; island ladders 0/14; ATD 10–19, First TD 1–5, rush yds 3–7; model totals +4.1 high (enforce S22).

## Decisions in force
- Lean session rules (CLAUDE.md top). Proposals only; Andy places; log only when he says official. No Supabase writes, paid APIs, wagers or purchases.
- Strict roster gate on every proposed player (`npm run roster:vet -- --week 12 --date <d> --fetch --strict`).
- Runbook §3a matchup checks on every prop: #2–#6 automated in `scripts/analysis/matchup_splits.py --week 12` (FTN coverage shell via shell-fit YPRR; blitz from FTN charting); #1 slot/outside alignment has NO source (flag rows "alignment: manual").
- FTN capture: Andy runs the export prompt in the Claude in Chrome side panel and drops files in `data/intake-drop/`; then `python3 scripts/normalize-ftn-export.py data/intake-drop data/research-intel/source-evidence/<date>-ftn-stats-iq` + `node scripts/build-ftn-stats-weekly-context.js --input-dir <that>`. DVOA columns export blank (premium). Claude cannot reach Downloads; session browser and the remote Chrome both hit the FTN paywall on export.

## Open / next (Team 2: W12 pools first, then islands)
1. POOLS by Wed ~3:45 PM PT (GB@LAR locks 5:00 PM): build `data/pickem/leans-2026-w12.json`, re-run `node scripts/pickem-card.mjs --week 12 --odds-file data/pickem/odds/odds-2026-w12-bkr-1124.json`, give Andy GB@LAR + 16-game rankings (Duma/Yahoo/CBS). Prelim market card `reports/pickem/2026-w12-pickem.md`. W11 standings captured (`data/pickem/*-2026-w11.json`, pools-2026.json); CBS public % `data/pickem/cbs-bukbuk-2026-w12-public-pct.json`. Tiebreakers SUBMITTED for Kenny's Yahoo pool (picks-2026-w12.json). No game picks entered yet. Checklist `reports/pickem/2026-w12-pool-inputs.md`.
2. Live BKR 11/24: CHI -2 at DET (55.5), LAR -2.5 (43.5). public/schedule.json W12 kickoffs WRONG for TEN@JAX (10:00), NE@LAC (1:05), LV@CLE (SNF); odds file has correct times.
3. Island deep-dives: GB@LAR + CHI@DET DONE (`reports/bets/2026-w12-{gb-lar,chi-det}-matchup.md`; re-price CHI@DET on CHI -2), then PHI@DAL, KC@BUF, DEN@PIT; then island 3-tier stacks (respect R11-2 if accepted); Sunday card (16 games total; second pass Fri after injuries).
4. Yahoo API WORKING (secret rotated; AUDIT-CX-014 closed). Session-browser sign-ins live for Duma + CBS.
5. Backlog: season-recap half-sack grading (0.5 sack vs 0.5+ line; lib.py does not exist, grep `sack` in reports/bets/season-recap/scripts/); paper W9 (12) / W10 (16) PENDING; pools odds converter script; roster_vet plain-name status gap.
6. R11-1 ACCEPTED 11/24 ($60 max cash per game). Andy: accept/decline R11-2; OK the commit list; clear `data/intake-drop/`; confirm DKP funding; enter picks.

## Where older context lives
- `HANDOFF.md`, `handoffs/`, `docs/CLAUDE_REFERENCE.md` (grep), `docs/MOBILE_LIVE_TRACKER.md`, W11 evidence `reports/bets/2026-w11-*`.
