# Claude handoff — Week 8 Friday close: FDP promo running, start Master Intel + SuperContest Intel (October 30, 2026, ~3:30 PM PT)

## Resume
1. Read `HANDOFF.md`, reconcile live Git. Branch `claude/w5-prop-cards-2026-10-11`; this session's commits sit on top of `97ec2ff` and were **pushed ~3:30 PM PT Oct 30 at Andy's request** (verify `git status -sb` shows in sync). Use `git -c core.fsmonitor=false`.
2. The VM cannot delete files: git lock files were renamed to `.git/stale-*-lock-claude-*` (Andy can delete them).
3. Dirty tree = scheduled-job outputs (Thu PM to Fri) plus Codex's uncommitted atomic-write repairs in `scripts/build-player-availability.js`, `scripts/sync-live-market-lines.mjs`, `tests/unit/cadenceFileWrites.test.js` (12/12 pass with them). Preserve; not this session's work.

## Next session: build the Week 8 Master Intel report and the SuperContest Intel report
- **Master Intel:** follow `docs/MASTER_INTEL_REPORT_RUNBOOK.md` (pipeline table §1; locked format v2 in `docs/MASTER_INTEL_REPORT_FORMAT.md`). Andy sends it to clients as a **multi-page** report; reviewers edit outside Cowork. Last week's inputs to mirror: `reports/intel/master-intel-narratives-2026-w07.md`, `reports/intel/master-pitches-2026-w07.json`; builder `scripts/master-intel/build.py --week 8 --date <BKR capture date>` (runs the strict roster gate itself), `build_site.py` for the multi-page site, `export_pdf.py` for the PDF. Output goes to `dist/nfl_week8_master_packet/` (gitignored).
- **SuperContest Intel:** last week's pitches `reports/intel/supercontest-pitches-2026-w07.json`; checker `scripts/master-intel/check_sc_report.py`; format locked in `handoffs/2026-10-17-1215-claude-sc-report-v3-locked-handoff.md`; Codex sides-only resume `handoffs/2026-10-24-1820-codex-resume-supercontest-sides-only.md`. Week 8 sheet checked against Westgate's official 14-game sheet: `reports/engineering/week8-supercontest-reconcile-2026-10-29/README.md`. Andy plays nfl-supercontest.com lines with partner Amanda (5 mutually agreed picks), not Westgate.
- TNF (CAR @ GB) is final, so Week 8 reports cover Sunday + MNF only.
- Fresh inputs this session: Friday injury designations (in `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md`, "Friday 1 PM injury re-check"); twitter bookmarks run (55 ingested); Sal Bets Week 8 five picks (addendum in `handoffs/2026-10-30-1325-claude-week8-friday-injuries-fdp-promo.md`). The 3 PM Windows Friday cadence should have refreshed availability/starters/props intel/prediction markets; check its log before relying on it.
- Andy said earlier he wants the Master Intel multi-page and archived to Google Drive; no publication or sending without his OK.

## Done this session (since the 1:25 PM handoff)
- **A.J. Brown:** questionable (knee flare-up, "degenerative"; missed Thu/Fri practice). The "multiple weeks / career-ending / trade talks" tweet from @S_CharlesNFL was **not** corroborated by any credible outlet. Treat him as likely out; NE −325 unmoved.
- **FanDuel Predicts (FDP) welcome promo — live.** Plan: `reports/bets/2026-w08-fdp-promo-plan.md` (DEV project `claude/fdp-promo-plan-2026-10-30.md`). $20 bonus lands right after each daily real-money trade, expires 1 day later, profit-only payouts. FDP offers only MLs, standard player props (yards, receptions, passing TDs) and ATDs — no defensive props, alt lines, QB completions, and no CLE @ PIT props in Week 8.
  - Placed: Day 1 cash combo $1.80 (CIN/JAX/NE/DAL/LAR ML; pays $6.00). Bonus #1 tickets A–D ($5 each; profits $16.74 / $12.25 / $7.82 / $10.19) — legs in the plan.
  - Format from bonus #2: **2 × $10 stacks, 2–3x displayed, one ATD each.** Sat T1/T2 (Sunday slate), Sun V1/V2 (Sunday PM + SNF), Mon M1/M2 (MNF), Tue N1/N2 (Week 9 TNF JAX @ BAL). FDP displays ~1.15–1.2× our box-score fair.
  - Leg-type history (`reports/bets/fdp-legs-2026-w08/history.py`, run from repo root): tackles, passing TDs, fav-priced rec-yds rungs outperform; short ATDs (−16) and ≤ −300 MLs (−14) underperform.
  - Tools: `reports/bets/fdp-legs-2026-w08/` (box.py, legs.py, history.py, json outputs); working copies in `~/fdp` on Andy's VM.
  - **Not logged yet:** the 5 FDP tickets are not in `data/official-picks/user-placed-wagers-2026.json` or the recommendation ledger — Andy hasn't answered the OK request.
- **Scheduled tasks** (push to Andy's phone): FDP Day 2 Sat 10:17 AM, Day 3 Sun 8:40 AM, Day 4 Mon 10:23 AM, Day 5 Tue 10:19 AM, final check Wed 10:11 AM PT; plus a Monday 9:30 AM PT refresh in this session (needs Andy's computer) for the MNF/TNF stacks.

## Open for Andy
1. OK to log the 5 FDP tickets (wagers file + ledger)?
2. OK to fix the 4 OCR team tags in Supabase `research_pick_signals` (Tuten/Javonte/DJ Moore)?
3. DK defensive rerun Saturday evening/Sunday morning (`npm run props:dkp:defense`); connect Claude in Chrome for BEO Sunday tackle ladders.
4. Sunday: pool entries (duma 3–9/11–16, Yahoo, CBS) after inactives; BKR weekend parlays; PHI hedge watch.

## Guardrails
- No wager, account, Supabase, paid call or publication without Andy's per-action OK.
- No player-named output without a current strict roster gate.
- Stage narrowly; never `git add -A`.

Resume prompt:
```
Resume Platinum Rose NFL. Branch claude/w5-prop-cards-2026-10-11 (pushed ~3:30 PM PT Oct 30). Week 8: TNF final; Friday injuries checked; FDP promo running on scheduled reminders. Task: build the Week 8 Master Intel report (multi-page, per docs/MASTER_INTEL_REPORT_RUNBOOK.md) and the SuperContest Intel report. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-30-1530-claude-week8-fdp-promo-master-intel-next.md.
```
