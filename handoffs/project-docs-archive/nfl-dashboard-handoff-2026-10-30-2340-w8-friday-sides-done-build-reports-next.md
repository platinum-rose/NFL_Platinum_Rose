# NFL Dashboard handoff — 2026-10-30 23:40 PT — Week 8 Friday: sides + props done, build both reports next

Branch `claude/w5-prop-cards-2026-10-11` @ 4d0cb46 (pushed). The full handoff is in the repo at `handoffs/2026-10-30-2340-claude2-w8-friday-sides-done-build-reports-next.md`; it has a post-commit section appended, not committed.

**Goal for the fresh session:** build BOTH Week 8 Intel reports (Master + SuperContest) tonight from Friday data, for Andy's review. Saturday late night is the data refresh and delta re-run. Get Andy's OK before publishing, sending, archiving or pushing to main.

## State at close (~midnight)
- **Gate:** Friday final gate is GREEN.
- **Sides:** 13/13 games, committed.
- **Quant refresh:** `reports/intel/w08-model/fair-lines-w08-synth.json` supersedes the SRS-only baseline. Committed.
- **Props:** 13/13 COMPLETE.
  - 10 games are committed.
  - ATL@TB, TEN@CIN and KC@DEN are on disk but uncommitted.
  - KC@DEN: Bookmaker has no First-TD market, so the 8a candidates there are DraftKings Predictions reference prices only.
- **SuperContest pitches:** rewritten on disk (uncommitted) to the Week 7 schema; passes the check_sc_report pitch checks.
  - AI five: CIN -10.5, BAL +3.5, CLE +3.5, LAC +6.5, CHI +3.
  - Alternates: MIN +3.5, MIA +7, JAX -9.5.
- **BUILD BLOCKER:** build.py reads the five from `## SuperContest` in `reports/bets/2026-w08-card.md` and the alternates from the narratives file.
  - Both files still hold the Friday baseline: CIN/JAX/MIN/DAL/BAL, alternates CHI/PHI/LAR.
  - The baseline also carries a bad CIN fair of -15 and a bad MIN fair of -0.4.
  - Update both files to match the new pitches file.
- **Expert narratives NOT WRITTEN:** the device bridge dropped before the write. Re-run step 6 to produce `reports/intel/expert-narratives-2026-w08.md`; it doesn't exist yet. Use the w07 layout that build.py parses.
  - Findings from the lost draft:
    - 26 experts have Sun/Mon picks.
    - No card: Wilson, Fitzmaurice, Madden, Feng.
    - Fitzmaurice conflict: a BettingPros episode has him on a JAX survivor pick and IND@JAX U46.5. Ask Andy whether he stays excused.
    - Consensus: BAL +3.5 (6 experts), DEN +1.5 (5, against our KC ML), NYJ (5), DET (5, against MIN +3), PHI (5), CLE +3.5 (4).
  - Data issues:
    - Anderson's "Jaleel McLaughlin" ladder is actually Jonah Coleman (KC@DEN).
    - The verifier mapped 3 W7 PHI/DAL picks onto W8.
    - Anderson's CIN -2.5 is a mismatch.

## Next
1. Commit the uncommitted props and SC pitches.
2. Re-run the expert narratives.
3. Step 5: digest, card (fix the SC section), Pitch/Pushback, prop stacks, 7e/8a.
4. Narratives rewrite (fix the SC alternates).
5. Run `$HOME/pyenv312/bin/python scripts/master-intel/build.py --week 8 --date 2026-10-31`, then `check_sc_report.py`.
6. Client editions from the W7 format, then the PDF.
7. QA and summary.

## Open
- QB notes fixes: Bailey is Doubtful, not OUT; McDuffie is Questionable.
- BEO props: re-run Saturday around 2 PM.
- Saturday gate.
- Antigravity items B and C.
- DKP manual login.
- DST ends Sunday: early kickoffs are 10:00 AM PST.
