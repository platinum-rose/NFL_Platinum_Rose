# Futures: Packers exactas placed, fresh 9/29 outrights captured, Week 4 intel next (2026-09-30 00:50 PT)

**From:** Claude (M6 desktop session, 2026-09-29 evening to 09-30 00:50 PT), working with Andy.
**Scope of this commit:** the seven new BetOnline exacta tickets recorded in the official futures ledger, plus the raw board captures and comparison work that led to them. Nothing in the placed-wager file, Supabase, bankroll, or any account was touched.

## 1. What was done

1. **Captured fresh boards (Andy ran console snippets in his own logged-in Chrome; I read the saved text):** BetOnline conference winners, Super Bowl winner, division winners, make-the-playoffs, regular-season win totals, and the full 256-matchup Super Bowl exact-matchup board (all 9/29 evening). Also BetUS (Andy's saved text), DraftKings Predictions (conference, Super Bowl winner, trade slips), and Kalshi's Super Bowl matchup list (21 of 256 markets).
2. **Findings:**
   - BetOnline's exact-matchup prices equal the product of its two conference prices within about 3% (median ratio 0.99 across 67 matchups). The board carries about 17% overround (1.078 squared) versus 7.8% per conference, so an exacta costs roughly 15% against no-vig fair.
   - BetOnline was best on 12 of the 13 exactas Andy asked about; BetUS wins only Bills/Vikings (+5000 vs +4800). Kalshi is shorter on nearly every listed matchup before fees.
   - The 9/9 dashboard captures were stale: Packers NFC win fell from 7.7% to 2.6% fair, 49ers rose from 8.4% to 17.7%, Chargers fell from 9.8% to 1.8%.
   - Circa (screenshots, conference only): best on 49ers (+500) and Bengals (+850); worse on Bills (+280), Ravens, Rams, Seahawks, Packers. `docs/circa-betonline-conference-comparison-2026-09-29.md` (NOT committed here, another agent's file) compares Circa 9/29 to a stale BetOnline 9/22; against tonight's BetOnline several of its verdicts flip. Circa exacta prices were never captured.
3. **Placed by Andy (BetOnline, accepted 9/30/26), recorded in `data/futures-imports/andy-portfolio-ledger-2026.json`:**

| Packers vs | Ticket | Stake | Price | To win |
|---|---|---|---|---|
| Bills | 1000995399 | $15 | +16100 | $2,415 |
| Ravens | 1000995399 | $8 | +20600 | $1,648 |
| Chiefs | 1000995399 | $8 | +23300 | $1,864 |
| Chiefs | 1000995658 | $1 | +23300 | $233 |
| Bengals | 1000995399 | $2 | +32300 | $646 |
| Broncos (new position `gb_den_exacta`) | 1000995399 | $5 | +39500 | $1,975 |
| Steelers | 1000995587 | $1 | +147500 | $1,475 |

   Ledger `as_of` is now 2026-09-30. Total staked **$278.51** (was $238.51). Each exacta position keeps a flat `stake_usd`/`to_win_usd`/`price` (summed/blended across tickets) plus a `tickets` array. The two focused ledger tests pass (`portfolioLocalInputs`, `portfolioPreflightScanner`, 69 tests).
4. Andy's plan was $13 Bills / $8 Ravens / $9 Chiefs / $2 Bengals / $5 Broncos / $3 Steelers ($40). He placed $15 Bills and $1 Steelers instead; total is still $40.

## 2. CRITICAL: how to read "to win"

Exactas are **mutually exclusive**: only one matchup is the final. Never add `to_win_usd` across different exactas. The Packers and Bills Super Bowl winner tickets are also mutually exclusive with each other. Earlier summaries in the session that showed $13,148 or $23,404 "total to win" were wrong and were corrected.

Net profit by final (SB-linked stake $238.51; excludes the Bills-over-10.5 and Packers-playoffs tickets, $40, which settle separately):

| Final | If Packers win | If the other team wins |
|---|---|---|
| Packers vs Bills | +$7,011 | +$6,617 (Bills win) |
| Packers vs Steelers | +$5,475 | +$4,435 |
| Packers vs Chiefs | +$4,051 | +$3,011 |
| Packers vs Ravens | +$3,705 | +$2,665 |
| Packers vs Broncos | +$2,781 | +$1,741 |
| Packers vs Bengals | +$2,593 | +$1,553 |
| Bills vs Seahawks / Lions / Eagles | Bills win: +$793 / +$797 / +$747 | +$147 / +$151 / +$101 |
| Any other final | -$238.51 | -$238.51 |

Packers-linked stake is about 65% of the total ($182 of $278.51 counting the playoffs ticket).

## 3. Ledger and data anomalies to verify

- `bills_packers_exacta` original `ticket_number` is `994540980`, identical to the first Bills Super Bowl ticket. Likely a copy error; check the BetOnline account.
- Ledger untouched otherwise: `bills_sb` (59.09 at +992), `packers_sb` (40 at +2500), other Bills exactas, Bills over 10.5 wins (-135), Packers to make playoffs (-120).
- Marks at 9/29 BetOnline: Bills SB +650 (fair ~12.0%, ticket worth ~$77.73 on $59.09), Packers SB +6600 (fair 1.35%, ~$14.02 on $40), Packers to make playoffs now +235 (fair ~28.6%).
- The raw captures are plain text saved under accurate names; the originals were named `.json`/no extension.

## 4. DraftKings Predictions credit (Andy holds a $100 Predictions Dollars credit)

- Andy cannot use it on exactas. Plan under discussion: park it on a short-odds Bills contract so it converts to withdrawable cash without touching bankroll, then fund further Packers adds.
- **Open, decides everything:** does a winning credit trade pay the full $1/contract to cash, or only winnings? Terms say payouts go to cash; the trade slip shows payout = contracts x $1; an AI-search answer and DK terms both lean "full payout" but one third-party site says profit-only. Get DraftKings support to confirm in writing, and ask whether selling a credit-funded position early returns cash or credit. Each $50 click-to-claim expires 7 days after issue.
- Fee schedule is the CDNA/DKeX table (confirmed by the slip: 16c ask + 1.1c fee). Assuming full payout returns, value per $1 of credit: Bills make playoffs (94c ask + 2c fee) about 90-93c; Bills AFC East (81c + 2c) about 88-92c; Bills AFC winner (25c) ~77c; Bills SB (16c) ~70c; Bills over 11.5 wins (81c) ~70-75c (thin, wide-spread book). Fair values from BetOnline: playoffs 89.4% (-1600/+800), AFC East ~76% (-400/+300).
- DraftKings win-total markets show wide spreads (both sides priced 85-96%); do not use.

## 5. Git state on M6 (read before pulling)

- This commit was made from a clean worktree at `origin/main` (057d2be). The main M6 checkout (`~/projects/NFL_Dashboard`) is `behind 2` with about 1,290 dirty/untracked files and was not touched.
- `git merge --ff-only origin/main` in that checkout **aborts** because 18 local files would be overwritten: `agents/schedule-ingest.js` (tracked, locally modified, identical to upstream), and 17 untracked files identical to upstream except four (`WEEK4_MATCHUP_INTEL.md`, `week4-team-baselines.json`, `regrade_summary.json`, `alternative_baskets.json`) that differ only in `generated_at` (local older). Safe resolution: move those 18 files aside, then fast-forward. I did not do it (the delete step was blocked by the harness).
- The main checkout also holds the same ledger edit uncommitted. After fast-forwarding, `git checkout -- data/futures-imports/andy-portfolio-ledger-2026.json` will drop the duplicate (content identical to the committed version).
- Uncommitted on purpose: the Circa comparison doc, its screenshots and source JSON, and everything unrelated in the dirty tree.

## 6. Next: Week 4 intel gathering

Follow `handoffs/2026-09-29-1235-codex-tuesday-pipeline-w1-3-week4-m6-handoff.md` (Thursday preliminary pass, Saturday Master Intel build). Rules that still hold: run the strict roster gate before naming any player; do not call TheOddsAPI, write Supabase, change the placed-wager file, or sync bankroll without new explicit authorization; keep current market observations separate from the saved 9/28 opening snapshot.

Futures follow-ups for tomorrow (exactas are the only time-sensitive market; the rest stays open):
1. Get the DraftKings written answer on credit payout, then rank Bills options (playoffs contract first) using `docs/futures-odds-20260929/BetOnline_Conference_Outrights_20260929.md` numbers.
2. Capture Circa's Super Bowl matchup board if available (unknown whether Circa allows proxy placement; Andy to confirm terms).
3. Refresh BetOnline exacta board before any further Packers adds; the Packers scale-in plan is checkpoint based (W4 at TB Oct 4, W5 CHI Oct 11, W6 DAL Oct 18, W7 at DET Oct 25, W8 CAR, W9 at NE; Packers are 1-2 after a 22-39 loss at MIN, 20-17 win at NYJ, 14-35 home loss to ATL).

## 7. Resume prompt

```text
Resume NFL Dashboard on the M6. Read handoffs/2026-09-30-0050-claude-futures-exactas-placed-week4-intel-resume-handoff.md, then handoffs/2026-09-29-1235-codex-tuesday-pipeline-w1-3-week4-m6-handoff.md, AGENTS.md, and the relevant CLAUDE.md/ANTI_PATTERNS.md rules. Reconcile live Git first: the main checkout is behind origin/main by 3+ commits and blocked by 18 local files identical to upstream (see section 5); preserve all unrelated dirty work.

State: Andy placed seven BetOnline Packers exacta tickets on 9/30 (ledger updated, total staked $278.51). Exactas are mutually exclusive; never sum to_win across them. Fresh 9/29 BetOnline/BetUS/DraftKings/Kalshi captures are in docs/futures-odds-20260929/.

Task: Week 4 intel gathering per the Codex handoff (Thursday preliminary pass, Saturday Master Intel), running the strict roster gate before naming any player. Do not call TheOddsAPI, write Supabase, touch the placed-wager file, or sync bankroll without new authorization. Futures items (DraftKings credit payout confirmation, Circa exacta board, refreshed BetOnline exacta prices) are secondary and only when Andy asks.
```
