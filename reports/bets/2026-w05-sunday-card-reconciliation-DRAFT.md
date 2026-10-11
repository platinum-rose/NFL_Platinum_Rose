# Week 5 Sunday card — reconciliation DRAFT (Claude Team 2, Lane D)

**Written:** Sat 2026-10-10 ~23:30 PT, git HEAD `09f6673` (main, on top of `7ebef66`).
**Status:** research/proposed only. NOT a card, wager instruction, ticket record, or ledger entry. **Unpriced: every price below is Saturday-night and expired** (BKR 2026-10-11T01:15:40Z, window ended 00:15 PT Sun; BEO 03:15:09Z, window ended 02:15 PT). No fresh capture exists yet, so no side/total/prop can be promoted.

## Gate status
| Gate | State |
|---|---|
| Git vs brief | match (main, handoff commit over 7ebef66) |
| ESPN status refresh | done 2026-10-11T06:13:58Z (Sat 23:13 PT); finals: TB@DAL only |
| Roster gate `--strict` | **PASS**, 0 blocking (info-only UNVERIFIED rows; none used by a card leg). ESPN rosters 3.6 h old |
| ESPN roster IR/Out gap (221 players) | still open in packets (Lane B not done) — blocks any player-specific card |
| Fresh BKR/BEO capture | **MISSING — Andy must run** (see below) |
| Packet rebuild + commit + new HEAD | waits on capture (rebuilding now would reuse Saturday data) |

QB flags from ESPN: **CHI Caleb Williams = Questionable (AMBIGUOUS)** — operator-confirmed starter in repo is Bagent; needs Andy's reconfirm. BAL: Huntley starts (Lamar Out). TB: Daniels (game final).

## Codex card items vs per-game outputs (Saturday prices)
| Codex item | Codex state | Per-game result | Verdict |
|---|---|---|---|
| LV +3.5 (-107) | review, rank 1 | Opus LV@NE conflicted / skip; 3 tier-eligible rows are one outlet (VSiN), contradict on side; Opus leans LV only 0.5 | not supported |
| CHI -1.5 (-108) | review, rank 2 | Opus pass / skip (-0.5 toward CHI); Astra research_only; only tier-eligible side source is GB ML +120; Williams Questionable, Parsons Out | not supported; QB unresolved |
| BUF +3 (+100) | review, rank 3 | BKR now LAR -3.5 (BUF +3.5); Opus pass / skip; +3 no longer the market | not supported; line moved |
| Dulcich o25.5 | prop review | usage context in Opus CIN@MIA only (BKR 25.5 -112); needs roster gate + ESPN roster-group check | not promotable |
| Judkins u59.5 | prop review | digest row, corroboration only, not BKR price | not promotable |
| Watches NO +2.5 / CLE +2.5 / CIN -7 / ATL -3 | review | MIN@NO conflicted/research_only; CLE@NYJ conflicted/research_only; CIN@MIA pass/research_only; BAL@ATL price moved/research_only (Opus), pass/research_only (Astra) | stay watches |
| No-bet records (PHI, IND, NYG, HOU, DEN, SF, DET) | pass | consistent with per-game passes/skips | consistent |

## Codex "Ticket and portfolio status" section — do not carry forward
The dirty card (`reports/bets/2026-w05-card.md`, tracked, modified) ends with Slot 3/Slot 4 parlays, three $15 singles, a dog round-robin and a SuperContest 5-team parlay, each marked "Tier 1 qualified" with stakes/payouts. Codex's own handoff says no tickets are authorized or placed, and they contradict the per-game runs:
- LV +3.5, MIN -2.5, SF +3, JAX -7.5, TEN +7.5, DEN Under 42: Opus = conflicted/pass/skip or research_only, not Tier 1.
- IND@PIT **Over 42.5** is the opposite lean of Opus's weather-only Under 43.5 (itself recommended research_only).
- ATL ML -161 (SNF): Opus BAL@ATL price moved / research_only.
- Parlay/RR prices are Saturday BKR displays, expired. I treat all of it as **proposed, not placed**; nothing is recorded. (Andy: tell me if any of these were actually placed, with book/price/time, and I will log only that.)

## Proposed Sunday posture until fresh data
All 14 games stay **pass / skip / research_only**. Only candidate above that, IND@PIT 2- weather-only Under, stays research_only pending Sunday forecast + line (weather file is 10-10 17:56Z; no fetch script exists). SuperContest picks are a separate workflow, and the six reversed-label matchups (TEN@HOU, MIA@CIN, NO@MIN, GB@CHI, LAC@DEN, ARI@DET) still await Andy's OK.

## What Andy needs to run (PowerShell, repo root, read-only captures)
1. `npm run props:bkr:launch` then `npm run props:bkr:cron`
2. `npm run props:bol:launch` then `npm run props:bol:cron`
Do it by ~05:30 PT for PHI@JAX (06:30 PT); recommendation window = capture + 3 h inside 6 h of kickoff (+6 h before). Then I run: rebuild packets (`python3 scripts/intel/build-w05-game-packets.py`, --exclude TB@DAL), commit explicit paths, new HEAD, re-reconcile this table with live prices.

## Open questions for Andy
1. CHI QB: is Bagent still the expected starter, or Williams (ESPN: Questionable)?
2. IND@PIT 2- Under: keep research_only? (Team 1 says yes.)
3. Land the ESPN roster-group fix (Lane B) before the rebuild?
4. Were any Codex-section tickets actually placed?
5. Weather refresh: approve a new Open-Meteo capture?

## UPDATE Sat 23:30 PT — early Sunday captures landed (Andy ran them)
- BKR `capturedAt` 2026-10-11T06:21:29.799Z (3586 rows, 14 games); BEO `capturedAt` 2026-10-11T06:15:10.239Z (1118 rows, 14 games). Both overwrote the 10-11 files; Saturday copies remain in the handoff snapshot `copies/`.
- BKR parser: TD markets empty (td=0) for MIN@NO, CIN@MIA, NYG@WAS, CHI@GB, BAL@ATL — keep as unavailable, do not substitute.
- **Line moves vs Saturday BKR (STOP condition: changed line):**
  - PHI@JAX: JAX -7.5 -> **-8** (-113), total 42 -> **41** (-108/-108). BEO shows PHI +8.
  - CHI@GB: total 46 -> **47** (-108/-108)
  - BAL@ATL: total 44 -> **43.5** (Over -103 / Under -113)
  - All other spreads/totals: same number, price drift only (e.g. LV +3.5 -108, HOU -7 -104).
- **Windows:** capture + 6 h (all kickoffs are >6 h away) => BKR window ends ~05:21 PT, BEO ~05:15 PT, i.e. BEFORE PHI@JAX (06:30). These captures cannot support a Sunday recommendation; a second capture inside 6 h of kickoff is required (+3 h window): ~05:00 PT for PHI@JAX, ~07:00 PT for the 10:00 games, ~10:00 PT for 13:05/13:25.
- Packets NOT rebuilt/committed yet (would be superseded by the pre-dawn capture). Per-game outputs (written at JAX -7.5 / total 42; CHI@GB 46; BAL@ATL 44) are now off the market on those three games.

## UPDATE Sat 23:40 PT — Lane B landed (commit 588d225) + corrections
- Andy confirmed: CHI starter = Bagent; no Codex tickets placed; IND@PIT weather-only Under stays research_only; Lane B before the rebuild.
- Lane B: unconfirmed ESPN roster IR/Out group now in packets (separate labelled category), prompt number-check rules + roster:vet date, BEO expiry check in the validator. Not yet rebuilt into `data/research-intel/game-packets/` (scratch dry run: 228 players over the 14 games; gap file's 221 missed 4 WAS players due to a WSH/WAS label and the injury feed drifted by a few names).
- **Correction to the window note above:** expiry = capture + 3 h, unless the capture is more than 6 h before kickoff, in which case it ends at kickoff − 6 h at the latest. Current captures (BKR 06:21Z, BEO 06:24Z) therefore end about 02:21 PT for PHI@JAX and 04:00 PT for the 10:00 PT games. The recapture plan (~05:00 PT, ~07:00 PT, ~10:00 PT) is unchanged.
- Latest BEO capture is 2026-10-11T06:24:03Z (Andy re-ran it); BKR 06:21:29Z.
