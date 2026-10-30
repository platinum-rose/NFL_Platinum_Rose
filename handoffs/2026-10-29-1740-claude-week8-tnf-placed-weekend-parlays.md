# Claude handoff — Week 8 TNF placed, weekend parlays live, October 29, 2026 5:40 PM PT

## Resume

1. Read `HANDOFF.md`, reconcile live Git, then `AGENTS.md` / `CLAUDE.md`.
2. Branch: `claude/w5-prop-cards-2026-10-11`. This session's work is in the commit that contains this file, on top of `d6356c3`.
3. Suite: not run this session (last broad run 2,046 passed / 27 failed; not a full pass).
4. The working tree still holds extensive unrelated dirty, generated and private work. Preserve it: no broad staging, reset, clean or stash.
5. **TNF CAR @ GB kicked off 5:15 PM PT on Oct 29. Ten Week 8 tickets are pending** (below).

## What is done

**Pools.** The duma "quarterly" prize is a rolling 4-week window paid weekly, and the four-game segment prize is the same thing (Andy, 2:15 PM). Scale this week is 3–16. Picks entered by Andy:
- duma GB 10, Yahoo GB 8, CBS GB.
- Tiebreaker 2: most points DAL, fewest points PHI (submitted).
- Tiebreaker 1 (Sun 10 AM PST lock): proposed SEA 24–21 (CHI 21), WSH 23–17 (PHI 17). Not confirmed entered.
- Full Sunday/Monday slots: `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md`. Refresh prices Sunday.
- `data/pickem/pools-2026.json` still describes the duma as "1..N" with separate prizes. It needs the rule fix; not done.

**Intel.**
- Afternoon article intake reviewed; all 48 URLs are already in Supabase `research_intel_notes` (read-only check).
- 14 evergreen pages hold older versions there.
- Pasted Action expert picks are **not** in Supabase.
- X bookmarks were read in the built-in browser (Andy signed in). The canonical `npm run twitter:bookmarks` was **not** run; the VM cannot reach x.com or Gemini.
- Videos and images still needing extraction (links inside): `reports/engineering/week8-pools-tnf-2026-10-29/x-bookmarks-pass-2026-10-29.md`.
- Supabase receipt: `.../supabase-readonly-check-2026-10-29.md`.

**Proposals.** `reports/bets/2026-w08-tnf-island-ladder-2026-10-29.md` (current), `2026-w08-tnf-sgp-proposals-2026-10-29.md`, `2026-w08-weekend-parlay-proposal-2026-10-29.md`. Fresh BEO SGP board, 3:59 PM: `reports/engineering/week8-pools-tnf-2026-10-29/beo-sgp-board-car-gb-2026-10-29-1559.txt`.

**Placed tickets** (logged to `data/official-picks/user-placed-wagers-2026.json`; 10 rows upserted to Supabase `user_bankroll_bets` via approved SQL; the sync script failed with DNS from the VM):

| Book / ticket | Stake | Payout or win | Legs |
|---|---|---|---|
| DKP 48373977 6-pick, +30% | $10 promo | $355.80 | Hubbard ATD, McKinney 4+ T+A, Jacobs 15+ att, Young 1+ INT, Kraft 4+ rec, Watson 5+ rec |
| DKP 48487002 7-pick, +20% | $9.98 promo | $319.60 | Van Ness sack, McKinney 4+, Young 2+ pass TD, Jacobs ATD, Golden ATD, McMillan 6+ rec, Metchie 2+ rec |
| DKP 48337161 2-pick | $9.87 promo | $32.00 | CAR +4.5, Under 48.5 |
| BEO 1010127424 | $6.02 | win $138.46 | Love o0.5 INT, Van Ness o0.5 sacks, Coker ATD, Waller o21.5 rec yds |
| BEO 1010107890 | $5 | win $490 | Hubbard ATD, Watson o4.5 rec, Watson ATD, Young INT, Jacobs ATD, Coker ATD, McMillan 66+ yds, Metchie o1.5 rec |
| BEO 1010136110 SGP (insurance eligible?) | $10 | win $280 | Watson ATD, Hubbard ATD, Waller 15+, Smack 1+ FG, Hubbard 10+ rec yds, Jacobs 70+ R+R, Young INT, Metchie 15+ |
| BKR 740983886 (11 teams) | $10 | win $1,265.60 | TNF Jacobs ATD; Sunday BUF/DAL/PIT/LAR/NE ML, Chase ATD, Irving ATD, IND-JAX u47.5, KC-DEN u42; SNF WSH ML |
| BKR 740984963 (10 teams) | $10 | win $1,055.54 | TNF Love 2+ TD; Sunday DET ML, LAC-LAR o43, Tuten ATD, CLE-PIT u40.5, Stevenson ATD, BAL-BUF o53, ATL-TB u46, Burrow 2+ TD (−386, over the −350 barrier); SNF WSH ML |
| BKR 740904942 (10/27) | $5 | win $592.33 | CAR ML, DET, BUF, CLE ML, IND ML, WSH ML |
| BKR 740900674 SGP (10/27) | $25 | win $61.25 | CAR +4, Over 46 |

Funding assumed cash for BEO and BKR; DKP is promo per Andy's rule. Recommendation ledger Week 8 D48–D53 is written to the DEV project and to `docs/claude-project-dev/recommendation-ledger-2026.md`. Tracker HTML was rebuilt locally (not committed; Andy said the phone tracker is not needed tonight).

## Next

1. **Grade TNF** after the final from the ESPN box score, then:
   - Update the wagers file. The leg statuses are graded by the tracker or by hand.
   - Settle the DKP and BEO TNF tickets.
   - Mark the TNF legs on the BKR weekend parlays.
   - Grade D52 and D53 on paper.
   - Supabase writes need a fresh per-action OK.
2. Andy runs `npm run twitter:bookmarks` on Windows. Transcribe the Sal Bets TNF and Week 8 videos.
3. **Friday/Saturday:**
   - Refresh moneylines and injuries: DET Gibbs; NE A.J. Brown; BUF Kincaid and DJ Moore; BAL Lamar is full go.
   - Re-slot duma 3–9 and 11–16, and Yahoo; decide the CBS LV option.
   - Fix the duma rule in `pools-2026.json`.
4. Sunday live: the BKR weekend parlays carry WSH ML as the SNF cap. Watch for a PHI hedge if they are alive.

## Guardrails

- No wager, account action, Supabase action, paid call or publication without Andy's per-action OK.
- No player-named output without a current strict roster gate (it passed this session on every proposal file).
- Stage narrowly; never `git add -A`.

Resume prompt:
```
Resume Platinum Rose NFL. HEAD = <commit containing handoffs/2026-10-29-1740-claude-week8-tnf-placed-weekend-parlays.md> (claude/w5-prop-cards-2026-10-11). Suite: not run this session (last broad 2,046/27 failed). Week 8 TNF tickets and two BKR weekend parlays are logged and pending. Next: grade TNF from ESPN, then the Friday/Sunday pool re-slot. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-29-1740-claude-week8-tnf-placed-weekend-parlays.md.
```
