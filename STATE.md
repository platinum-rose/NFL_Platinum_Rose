# STATE — NFL_Dashboard (single current-state file; rewrite, don't append; max 40 lines)
Updated: Thu 2026-11-26 ~1:55 PM PT (Claude Team 2, W12 holiday session closed). Reconcile live git before trusting this.

## Repo
- Branch `claude/w5-prop-cards-2026-10-11`. Session commit (named paths, temp-index method) pushed 11-26 ~2 PM; see `git log -1`. Tree still dirty from other sessions — commit named paths only (`GIT_INDEX_FILE=.git/tmp-idx git read-tree HEAD; git add -- <paths>; git write-tree; git commit-tree ...; git update-ref`).
- Device VM cannot reach ESPN or Supabase: build the MOBILE tracker in the cloud workspace (stage ledgers + scripts/lib); the BROWSER tracker (`node scripts/generate-live-tracker.mjs --week 12`) builds on device and grades live in Andy's browser.

## W12 rules
- R11-1 ($60/game, parlay stake counts on every game) ACCEPTED, enforcement DEFERRED to W13 (Andy 11-25: holiday one-off). R11-2 proposed, effective W13. `rules-2026.json` updated.
- W11 card rule (cash max 4 legs) also waived for W12 holiday tickets per Andy.

## W12 ledger (as of 1:55 PM Thu) — `data/official-picks/user-placed-wagers-2026.json` (424 rows; public/ copy synced)
- WED GB@LAR final LAR 26-13: 1 cashed (FDP 3-leg $19.20), 10 burnt (BKR SGP $20, BKR 2-leg $40, RR 8-team $5, DKP boost x2, Alejandro Wed split, FDP 6-leg, DKP slip #1/#3-alt/#4-alt).
- LIVE (none graded in ledger yet — settle after Thu/Sun finals): BOL 10-leg 1018836566-1 ($10, boost to grade), BKR slip #5 742347346 ($5), BKR Compact RR 742351627 (70x4, 15 combos alive), BKR CHI@DET SGP 742375974 ($20->$244.60), BOL PHI@DAL 7-leg 1019155914-1 ($10->$230, placed live 1:45), DKP: Alejandro Thu split ($10 -> $217, he owes $5), repl #6 ($144), Stack A ($864), Andy 10-pick ($2,357), G ($2,357), H ($3,085), I ($2,357), CHI@DET 5-pick boost ($77.11), PHI@DAL 6-pick boost ($157.40); FDP: 8-sel multigame ($5 bonus + $5, ~ $826 est), PHI@DAL 6-leg ($118.11).
- CHI@DET late 4Q DET 35-24 at 12:54: Gibbs 3 TD (Stack G Gibbs 2+ TD hit), Swift TD hit.
- Flags in ledger: many DKP/FDP rows "'official' implied" (Andy confirmed by placing); BOL 1018836566-1 boosted payout TBC (Andy said "+2500"; 25% profit boost = ~$2,462.50 win?); Alejandro Wed split $4.99 vs $5.00 share.
- Alejandro: Thu split live, Wed split burnt; partner tracker rebuilt locally `public/alejandro/index.html` — Andy runs `npm run tracker:alejandro:publish` (pushes alejandro-tickets repo).
- Imaginary: paper_w12_holiday_v7_s2/s8/s9/s10 live at $10 default; s6/s7 burnt; s1/s3/s4/s5 SUPERSEDED (placed for real).
- Ticket-type gotcha: browser tracker reads RR config from ticket_type text — log RRs as "Round Robin (N Selections, K-Team Combinations, P Parlays)".

## Work products this session
- Holiday longshots v8/v9 sheets `reports/bets/2026-w12-holiday-cheat-sheet-v{8,9}.html` (v9 artifact https://claude.ai/artifact/E5zQLFrpvfgcrjAjQi2qhW).
- Thu replacement stacks `reports/bets/2026-w12-thu-replacement-stacks.html` (https://claude.ai/artifact/84EngZihAVw3YhX4XREe9L); prop usage check `reports/bets/2026-w12-thu-prop-usage-check.md` + `scripts/analysis/{usage,edge}_w12.py` (team-scoped game logs vs DKP lines; re-run any week).
- Best-book parser `scripts/props/book_compare_w12.py`. Mobile Road Tracker artifact https://claude.ai/artifact/VdQ8mw4fPC17C3fqe2Scbg (old Q7NB link unreachable); Andy prefers the BROWSER tracker today.
- Lesson (Andy 11-25): never propose a prop from intel labels/book lines alone — check usage + season/L5 hit rate vs price first.

## Pools
- 3k (other session): GB@LAR final pick LAR slot 3 Duma+Yahoo, LAR in CBS. Record Andy's confirmed picks in `data/pickem/picks-2026-w12.json` (`pools` key). Sunday final pass 9:30 AM (Sat odds re-capture; Herbert concussion Q for NE@LAC).

## NEXT SESSION GOAL
- Grade/settle W12 Thursday tickets after KC@BUF final (`python3 scripts/settle_from_mobile_state.py` dry run first; RR per-combo; BOL boost amount). Then Sunday: stranded Sunday legs (WAS -6.5, NYG -6.5, LV +5.5, BAL/HOU o45.5, CIN, SF) into stacks after Fri injuries, using edge_w12.py-style checks; DEN@PIT Fri (Rudolph).
- Backlog: season-recap half-sack grading; paper W9/W10 pending; roster_vet plain-name gap; public/schedule.json W12 kickoff times wrong for TEN@JAX/NE@LAC/LV@CLE.

## Where older context lives
- `HANDOFF.md`, `handoffs/`, `docs/CLAUDE_REFERENCE.md` (grep), `docs/MOBILE_LIVE_TRACKER.md`, W11 evidence `reports/bets/2026-w11-*`, backup `STATE.md.bak-claude-20261126-close`.
