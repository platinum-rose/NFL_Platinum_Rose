# Handoff: Week 3 THU night — favorites longshot parlay + late TNF adds placed, tracker current

**Session:** Thu 2026-09-24 14:42 → 18:05 PT · **Author:** Claude · **Branch:** `main` (HEAD was `3d42bb9` = origin/main at start)
**Commit:** this handoff + card + Codex game-line captures (push pending — Andy).

## 1. Placed tonight (all Bookmaker, all in `data/official-picks/user-placed-wagers-2026.json` — 68 entries; gitignored)
| Ticket | What | Risk | Win shown |
|---|---|---|---|
| 739210986 | Favorites longshot 9-leg: ATL/GB U43.5 −117 · CIN ML −194 · BAL ML −174 · PHI ML −228 · NO ML −162 · JAX ML −157 · LAR ML −135 · CAR/CLE U43.5 −124 · SEA/WAS U41.5 −136 | $10 | $909.84 (+9098, = naive multiply) |
| 739211245 | 8-team open: ATL +5 −112 · DET ML −295 · CIN −3 −129 · BUF ML −335 · SEA ML −371 · SF ML −386 · **2 open spots** | $10 | $330.36 (assumes −110 fills; filled legs +834) |
| 739213650 | TNF SGP: Bijan 1st TD · Love 2+ pass TD · Golden 1+ TD · Penix 1+ pass TD | $5 | $148.50 (+2970) |
| 739213766 | 3-team open: GB −4 −119 · BUF −6.5 −133 · **1 open spot** | $60 | $309.30 (assumes −110 fill; filled legs +222) |
Plus the three earlier TNF ladder tickets (999235271 / 739202488 / 999241744 — see the 14:35 handoff).
- needs_confirmation on the new entries: funding (assumed cash); $60 logged as 6 units (Andy called it 5); open spots to fill before Sunday.
- Flags: ATL +5 (739211245) and GB −4 (739213766) are near-complementary (only GB by exactly 4 → ATL +5 wins, GB −4 pushes). 739211245 has SEA/SF ML past −350 and 4 legs < −200 (Andy-built). Love 2+ TD (739213650) runs against the TNF Under legs.
- Live Tracker regenerated 18:03 PT (`npm run tracker:generate -- --week 3`) — all 7 TNF-night tickets present. Outputs (`public/` + `docs/tracked-wagers/live-tracker-sunday.html`) are untracked as before.

## 2. Ledger / card
- DEV `claude/recommendation-ledger-2026.md`: Week 3 Tickets 4–7 added. **D14** = TNF Under replaced GB ML on the favorites parlay (settles MNF). **D15** = Golden 1+ TD in place of GB ML on the 1st-TD SGP (settles tonight). D13 still open.
- `reports/bets/2026-w03-card.md`: slot 10 (favorites parlay) + "also placed" section.
- Pricing notes learned: BKR booked a 9-team cross-game parlay at exactly the naive multiply; BKR fav MLs 5–13¢ cheaper than BEO on BAL/NO/LAR and hung 42.5/40.5 vs BEO 42/40. First-TD markets: overround ~39% BEO / ~45% BKR; only Bijan BKR +509 was near fair (+518..+662).
- Half-point break-evens used (p≈0.5): 42.5→43.5 ≈ −125; 40.5→41.5 ≈ −137; GB −4.5→−4 ≈ −113; BUF −7→−6.5 ≈ −129; GB −3 fair ≈ −136.

## 3. Pick'em
- CBS TNF: Andy asked about flipping to ATL; Claude said keep GB (Andy 22 vs leader 24, 9 ahead; save flips for coin-flips: TEN already on card; HOU/IND, CAR/CLE, MIN/TB are intel-backed flip candidates). CBS standings pasted in chat (not yet in `data/pickem/pools-2026.json`).

## 4. Next (fresh session)
1. **After TNF:** grade Tier 1–3 tickets, 739213650, the TNF legs of 739210986 / 739211245 / 739213766, D13 + D15; BEO Primetime insurance check on Tier 1 (refund if exactly 1 of 4 legs loses).
2. Fill open spots on 739211245 (2) and 739213766 (1) before Sunday — paste slips; update entries.
3. Still unconfirmed: SuperContest 5 submission; Bills $10 credit; card slots 1–5 (note JAX/CIN/BAL/LAR/NO overlap with the favorites parlay). $6.81 free money unassigned.
4. Friday: Nacua/Darnold status; pick'em leaderboards (all three pools) → standings; `npm run pickem:card`; futures review §8; Circa re-price if photos arrive.
5. Carry-forward: CI-GREEN, props-intel WIP commit, governance pass, worktree cleanup, FantasyPros published_at bug, futures-ingest quota guard + re-enable Futures Odds Ingest after quota reset, BEO Primetime terms → promotions-2026.json.

## 5. Ops notes
- The device bridge dropped 17:10–17:55 (a trivial command timed out, then disconnected; recovered by itself). Fix if it recurs: fully quit + reopen the Claude desktop app. Avoid repo-wide `find`/`grep` over the E: mount (one hung this afternoon) — keep scans scoped.
- Codex game-line captures committed: `handoffs/2026-09-24-1433-codex-beo-…`, `…1436-codex-dk-…` (DK file is DK Predictions probabilities, not sportsbook odds; no BKR game-line capture — Andy pasted BKR at 16:38).

## 6. Resume prompt
```
Resume NFL_Dashboard ("Platinum Rose") — Week 3 THU night → FRI. Repo E:\dev\projects\NFL_Dashboard (device_bash $HOME/mnt/dev/projects/NFL_Dashboard), branch main; verify HEAD vs origin/main.
Read: HANDOFF.md → handoffs/2026-09-24-1805-claude-week3-tnf-night-favorites-parlay-late-adds-handoff.md → reports/bets/2026-w03-card.md (bottom) → DEV claude/recommendation-ledger-2026.md (Week 3).
First: grade TNF (ATL@GB) — Tier 1 999235271 (+ Primetime insurance), Tier 2 739202488, Tier 3 999241744, 1st-TD SGP 739213650, and the TNF legs of 739210986 / 739211245 / 739213766; grade D13 + D15 in the ledger; update wagers JSON statuses; regenerate the tracker (npm run tracker:generate -- --week 3).
Then: open spots on 739211245 (2) and 739213766 (1); SuperContest 5 / Bills credit / slots 1–5 status; Friday Nacua/Darnold; pick'em standings → pools-2026.json → npm run pickem:card; futures §8.
Standing constraints: no git add -A; never reset/clean/stash; Supabase writes need per-change OK; no bet placement/account actions; Andy pushes; docs/Futures_Odds/ untracked; no team power ratings as evidence; $6.81 free money unassigned; local scheduled tasks run from this checkout; paste-slip check on every ticket; keep file scans scoped (bridge stalls).
```
