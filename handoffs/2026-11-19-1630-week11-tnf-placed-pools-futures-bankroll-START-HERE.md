# START HERE: Week 11, Thu 11/19 4:30 PM PT (Claude Team 1 -> Claude Team 2)

Repo `E:\dev\projects\NFL_Dashboard` (bridge: `$HOME/mnt/dev/projects/NFL_Dashboard`), branch `claude/w5-prop-cards-2026-10-11`.
**First read `CLAUDE.md` and `docs/OPERATIONS_MAP.md`** (cloud sessions don't auto-load them). Previous: `claude/handoff-2026-11-17-1930-w11-rules-final-START-HERE.md` (DEV).
**The GitHub repo is public.** `data/bankroll/` (deposits, withdrawals, balances, raw book histories) is gitignored and stays local. Andy pushes; the bridge can't.

## 1. TNF IND @ HOU (kickoff 5:15 PM PT) — placed, all logged in `data/official-picks/user-placed-wagers-2026.json`
| Ticket | Book | Stake | Pays | Funding |
|---|---|---:|---:|---|
| 1016875939: Jones o0.5 INT / Jones o0.5 pass TD / Hutchinson 3+ rec / Schultz o29.5 rec yds | BetOnline | $10 | $70 | cash |
| DKP 4-pick: Taylor 60+ rush / Hutchinson 3+ / Lassiter 4+ solo tkl / Bullock 3+ solo tkl (+20% boost) | DKP | $9.94 | $158.81 | promo (DKP winnings balance) |
| DKP 7-pick: Stroud 290+ / Collins ATD + 7+ rec / Pitre 5+ T+A / Boutte 20+ / Shrader (IND K) 1+ FG / HOU ML (+20% combo boost) | DKP | $9.98 | $394.00 | promo |
| FDP Same Game Combo 26.3x: Dell ATD / Taylor ATD / McGowan o14.5 rush yds / Stroud o1.5 pass TD / Hutchinson o2.5 rec / HOU win (placed 4:30 PM) | FanDuel Predicts | $5 bonus ($0 cost) | $114.73 (profit only) | promo, bankroll-exempt |
- **Proposed, not placed** (`data/official-picks/candidates-w11-tnf-final.json`): D = BKR cash $10, Taylor o13.5 carries +109 / Stroud o251.5 pass yds -110 / Treadwell u2.5 rec -126 (~+616); E = DKP promo ~$5, Treadwell u2.5 rec / McGowan u6.5 carries / Will Anderson 4+ T+A / Burks u16.5 rec yds (~+1247). Andy had not pasted slips. A DK sportsbook social post link he sent (`.../social/post/8d10694d...`) could not be read (blocked); ask for a screenshot.
- Slate caps (S5): Hutchinson is now on 3 tickets (over the cap of 2, via the FDP bonus ticket); Taylor, Stroud, Treadwell (if D/E are placed).
- Injury notes: Woody Marks OUT (Montgomery lead back), HOU without Harrison Jr., Brevin Jordan, Danielle Hunter; IND without Ward, Mallory, likely Sauce Gardner. **Hutchinson has a new hamstring tag**: confirm he's active (on 2 placed tickets). Official inactives were not posted when this was written.
- Write-up: `reports/bets/2026-w11-tnf-island-stacks.md`. Settle after the game from the box score (grade, then Andy's OK to apply).
- Method notes: screen props with snap-count-filtered history (nflverse PBP + snap counts, now through W10; `node scripts/fetch-nflverse.mjs`), shrink halfway to the no-vig price, PLAY at 4+ pts. Defensive "Tackles" at DKP = solo tackles.

## 2. Pools (W11)
- Preliminary sheet: `reports/bets/2026-w11-pool-picks-proposal-2026-11-17.md` (BKR MLs 11/17). TNF HOU everywhere (duma 14, Yahoo 11) unless Andy took the look-ahead option B/C (HOU 16, KC 15, BUF 14; CIN/JAX above DET/DAL). Ask Andy what he entered.
- Tiebreakers given: CBS MNF total 54; Yahoo TB1 CIN 30-WAS 24 and SF 24-MIN 21, TB2 most DAL / fewest ARI. Recheck MIN QB and the PHI/DAL totals before Sunday.
- Duma Quattro W8-11: Andy 337, 24th, 18 back of 3rd; leverage vs chalk was left to Andy.

## 3. Futures
- Placed 11/19: **CHI vs JAX SB exacta 1016773387, $34.87 @ +2300 (BEO promo pot, now $0)**. Futures ledger updated. Portfolio (11/17 BEO prices): EV +$48, P(loss) 69.9%; JAX/CHI branch +$362; biggest hole now JAX/SF (-$475).
- Held: **$17.39 BUF-only credit** -> BUF SB at **+700 or better** or after BUF's first loss in W12-16 (KC, @NE, @GB, CHI, @DEN). Add this check to the weekly futures review.
- Pending: Andy's Circa contact for JAX/SF (buy only if better than BEO +1200; fair +1502), JAX/CHI, CIN/SF, KC/SF, DEN/SF, JAX AFC (>+325), SF NFC (>+225).
- Kalshi checked 11/18: worse than BEO everywhere except CIN SB. Snapshot `data/futures-imports/kalshi-sb-outcome-2026-11-18.json`. Plan + matrix: `reports/bets/2026-w11-futures-promo-plan.md`, `reports/bets/futures_matrix_w11.py`.
- BEO prices every SB exacta at ~86% of fair (AFC x NFC product minus a flat margin).

## 4. Bankroll and book balances (local only)
- Official bankroll (`node scripts/lib/bankroll.mjs`): -$835.15 before W11; DKP/Pick6/FDP exempt; Kalshi counts (cash).
- Reconciled to the penny from the books' transaction histories: **BKR $800.00** (true net +$255.22; $22.50 carried in pre-Aug), **BOL $75.12 on 11/18** (true net about -$1,113; $0.96 carried in; $91.85 bonuses + $19.07 casino off-ledger). BOL $40.25 after the CHI/JAX exacta. DKP $393.40 (+$0.04 rewards) after tonight's tickets.
- Files: `data/bankroll/book-transactions-2026.csv`, `book-balances-manual-2026.csv`, `bkr-history-2026-11-18.json`, `bol-history.json`, `raw/`; parsers `scripts/bankroll/parse_bkr_history.py`, `parse_bol_history.py`.
- **Awaiting Andy's OK (BKR ledger fixes):** (1) 738317559 and 738444813 logged short by the stake (+$40.13); (2) 738491435 profit -15 (estimate today); (3) ticket 1011531336 is BetOnline, not Bookmaker; (4) add 3 missing NFL BKR tickets (#738270619 -$20, #740771339 -$25, #740771681 -$5). Bankroll -835.15 -> -845.02. Also ask: do the 10/7 MLB bets (-$14.93) belong in the ledger? Also the 10/5 BOL ticket 1002754993 is logged $11.61 = $6.61 + separate $5 (1002746959).
- ~$67 of small BOL wagers 9/6-9/17 are unidentified (not NFL ledger, not futures).
- Still to collect: DKP/FDP/Pick6/Bovada/Kalshi/Novig histories. Then build the accounts view in `bankroll.mjs` (true net per book next to the ticket P&L).
- Balance reader (`scripts/props/book-balance.mjs`, `runbalances.cmd`) now reads all three books on every capture.

## 5. Week 11 Sunday-Monday still to do
- W11 fair lines (`reports/intel/w10-model/fair_lines_w10.py` -> w11, rebuild the QB/injury ADJ table), synthesis queue, per-game PLAY/LEAN (every game gets a side and total LEAN).
- Sunday captures: BOL props (gate fails until Sunday props post), BKR (session expires; sign in first), DKP feed (`npm run props:dkp:cron`, not `rundkprops`).
- **Gemini credits are exhausted (HTTP 402):** podcast/Twitter extraction stalled until Andy tops up.
- Weekly post-mortem Tuesday; nightly settlement stays --dry-run.

## 6. Standing rules
Never place, log or settle without Andy's OK (a pasted confirmation = OK to log). Back up a ledger before editing (match its JSON indentation: 2 spaces). `git commit --only <paths>`; never `git add -A`. Git leaves lock files over the bridge without delete permission: move `.git/*.lock` aside after commits. Supabase writes and paid runs need per-run approval.
