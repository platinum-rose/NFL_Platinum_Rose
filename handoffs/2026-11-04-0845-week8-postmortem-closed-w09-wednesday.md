# Handoff: Week 8 post-mortem closed; Week 9 Wednesday (11/04, ~8:45 AM PT)

Repo `E:\dev\projects\NFL_Dashboard`. Nothing committed or pushed. No Supabase writes, wagers or wager-ledger edits.

## Week 8 post-mortem (done)
- `reports/analysis/week8-postmortem/w08-closeout-2026-11-04.md` + `official-ticket-summary-2026-11-04.csv`
  - As tagged: cash **+$267.83 on $348.27** (matches weekly_review). The $609 A-A-A DK win carries the week.
  - **Under Andy's 10/27 DK rule** (DK = promo, booked at the account result): **-$221.40 on $228.50**, plus the DK account change. Needs DK's balance and summary.
  - Splits: Alejandro **+$133.06**; Amanda **+$198.00** (+$193.06 if her solo $4.94 DK ticket was fronted).
- `platinum-rose-w8-paper-accuracy-2026-11-04.md` + `...-leg-grades-...csv`: 24 paper tickets, 4 cashed; legs **38-60 (38.8%)** (W7 53.4%).
  By unique proposition, rushing yards went 6-1 while receptions went 0-4, receiving yards 0-2 and totals 1-4. Over-reused legs: Okonkwo x5, Warren x4.
- SuperContest: AI five **1-4**, official five **2-3** (Andy right, +1.0).
- Recommendation ledger Week 8 closed (D50-D56 + close-out): DEV `claude/recommendation-ledger-2026.md`, repo mirror `docs/claude-project-dev/`.
- Waiting on Andy's OK (wager/paper ledger edits): 3 PENDING legs in settled official tickets (PIT TD u2.5 L, DET FG o1.5 **W**, Barkley 60+ L)
  and 2 PENDING paper legs (Lamar o1.5 pass TD, both L).
- Andy: re-run `node scripts/archive/weekly-archive.mjs --week 8 --refresh` on Windows.
- Logged, not fixed: the `lib.py` grader reads "INT" on a QB as defensive INTs (Goff u0.5 INT). The stored grade was correct.

## Code changes since 11/03 (backups `*.bak-claude-2026110[34]-*`)
- `scripts/build-projected-starters.js`: **stale Week 1 locks superseded + IR/Out availability veto** (Andy approved 11/04).
  Snapshot rebuilt: Lamar, Hurts and Jeanty superseded; Dart, Croskey-Merritt, Njoku, J. Love, Bourne, Diaby and C. Bryant marked unavailable. **NYG now has no QB row**:
  add a manual row or let the Week 9 usage lock fill it. New test `tests/unit/projectedStartersStaleVeto.test.js` (2/2 pass).
  The existing `dataGatheringSprint.test.js` KC case was already failing before this change: it reads the live manual folder, not a fixture.
- From 11/03: toolbox Tuesday step 6b (cache refresh), atomic box-score writes, grader fixes (decimal "N.5+", new recap markets).

## Week 9 (in progress)
- Antigravity Part B prompt: `agents/dev/ANTIGRAVITY_W09_TUESDAY_PODCAST_SWEEP_PART_B.md` (Andy launching; digest due noon).
- FDP N2 decision card: `reports/bets/2026-w09-fdp-n2-decision-card.md`. **Bonus expires 5:30 PM PT.** It depends on Tuten's Wednesday practice.
  Tuesday: Tuten DNP (Mon and Tue), Rodriguez limited (hand).
- TNF packet: `reports/bets/2026-w09-tnf-prep-packet.md` (line BAL +10 / 40.5).
- Next: TNF proposals in `reports/bets/2026-w09-card.md` after the digest, the Wednesday injury report and the roster gate.
