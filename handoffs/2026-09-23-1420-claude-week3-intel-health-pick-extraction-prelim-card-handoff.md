# Handoff: Week 3 intel repair, pick-extraction rerun, toolbox cadence, preliminary game-parlay card

**Date:** 2026-09-23 01:08 → 14:20 PT (Wed, Week 3 TUE-WED mode) · **Branch:** `wip/yahoo-sync` · **Author:** Claude
**Commits this session:** `1e35dda`, `e63adba`, `40d2eb1`, `6020262`, `21bd021` (pushed), `881d28a` + this handoff commit (push pending from Andy's shell).
**main:** `2412d13` (pushed by Andy) = old main + pick-extraction week-scope/teaser/dedupe + intel revisions + CFB filter.

## 1. Circa run (sister at Circa Wed afternoon)
- Cheat sheet doc (claude.ai Docs, rev 14): https://claude.ai/code/artifact/f0663899-2a00-4bdc-a1d2-f6b1cd6a8e10
  - Added: Circa NV house rules ($1 min, no stated leg cap, 2,000:1 max, tickets valid 365 days, mail-in OK); hard-floor To-win per futures parlay (#2 $345, B $593, A $574); **Market fair (Kalshi/Polymarket 9/23 11:52) + "Circa vs fair" columns** on the leg table.
  - Key reads: BAL AFC N +105 vs fair +133 (worse; in all 3 flex parlays); **LAR NFC +360 vs fair +506 (much worse; ticket A)**; Ravens 12+ wins fair ~+113–122 so the +130 floor holds.
- No live Circa photos received yet. Re-price + ledger update still to do after tickets are placed (DEV project doc `claude/recommendation-ledger-2026.md`).

## 2. Intel pipeline — fixes and cleanup (all Supabase deletes Andy-approved)
- **Evergreen revisions** (`agents/lib/intel-revisions.js`, opt-in `trackRevisions: true`, Action Network only): AN primer/QB rankings/TD Machine are rewritten in place weekly under one URL; newer pubDate (>=20h) now stores a dated revision row. First version applied to all feeds and made ~42 dup rows in 2h — fixed in `6020262`, dups deleted. Caveat: revision bodies are ~4k chars (JS-rendered pages); full Week 3 primer was parsed via Firecrawl into the digest instead.
- **CFB filter** (`agents/lib/college-football-filter.js`, 17 tests): title terms or /college-football/, /ncaaf/, /cfb/ path, unless title says NFL. 14-day backtest: 88 matches, 0 NFL false positives.
- Feeds Football Outsiders + THE WINDOW removed (subscription, per Andy).
- Deleted from `research_intel_notes` (cascade to signals): Week 1 primer (2936), 3 off-topic (4539/4540/4587), 31 Week-2-MNF/CFB/Week-1-copies/misc, 42 revision dups + all 238 stored CFB rows; plus 3 junk title-as-lean signals on 4691-4693.
- TASK_BOARD: B-intel-evergreen-revisions (P1), B-intel-an-feed-depth (P2: AN via r.jina.ai sees ~12 of ~40-50 feed items), B-intel-queue-window-check (P3), B-intel-cfb-filter (P2, done + cleanup record).
- **PFF podcast feed on file (`feeds.simplecast.com/U644ZfMt`) looks like the wrong show** (Collinsworth/NBC interviews). Not yet on TASK_BOARD — verify and fix `podcast_feeds`.
- AN PRO pages (QB rankings) are paywalled — title/teaser only.

## 3. Expert picks
- GitHub pick-extraction on old `main` inserted 347 picks at 06:48 (275 off-slate/malformed). Deleted all 347, reset `picks_promoted_at` on 32 transcripts, pushed fixed extractor to `main`, Andy ran it locally: **64 picks, all on Week 3 slate, 7 transcripts, 6 teasers, 4 dups dropped**. Consensus (2+ shows) in digest: CHI, CLE, JAX −2.5, TEN, TB, MIA.
- Action Network "Futures Watch Wk3" picks: Allen OPOY 50-1 (no book named; DraftKings is only the show sponsor), CHI +3, GB miss playoffs, LAC miss playoffs (−120), passes on MIA/TEN/WAS/ATL.

## 4. Data refreshes this session
- nflverse games.csv refreshed through Week 2 (gitignored; direct pull, formatting matched) → `team-power-ratings-2026.json` rebuilt. **Andy distrusts these ratings (LV #4, BUF #11) — revamp the model later; do not use as evidence.**
- Andy ran: projected starters (11:42), betting splits (16 games → Supabase), prediction markets + map + coherence (11:52; 7 "incoherent" teams are a junk 25.5% SB contract artifact).
- **Still stale:** player availability (Tue 23:30) — run **Toolbox → Wednesday → PM Refresh** (restart toolbox server first) after Wed practice reports; that also rebuilds starters, PM chain and Alpha packet. BKR lines are Tue 18:59 — re-paste before placing.

## 5. Toolbox (`881d28a`)
- New cadence `wednesday-pm` + button "PM Refresh (after practice reports)"; new cadence `prediction-markets` (Data Source Health Run Now now runs markets→map→coherence); Sunday tracker no longer hardcodes `--week 1`.
- Still open (Andy's call): Wednesday articles/bookmarks and Tuesday odds steps run `--dry-run`.
- Pre-existing uncommitted edits in `scripts/toolbox-app-server.mjs` (launch-button fixes, fantasy tools) left unstaged.

## 6. Money / promos
- `data/sportsbooks/promotions-2026.json`: logged $3.96 BetOnline free-slots win as unassigned free money (`21bd021`). Rule recorded (Andy): BEO promo/casino cash is real cash usable at any book and still counts as free money. Reloads $2.85 unchanged (earmark GB SB ≥+2500 / exacta). Total free money $6.81; Andy declined to lock it to BUF futures yet.
- Bills $10 credit due tonight — play not chosen yet.

## 7. Preliminary Week 3 game-parlay card — `reports/bets/2026-w03-card.md`
Digest: `scratch/w03-synthesis-digest.md`. Proposals only; BKR 9/22 prices; QB-dependent games provisional.
- Bills credit: Andy default LAC +7 vs best −110 JAX −3.
- Slot 2 Dog ML RR (BKR, $20): TEN +123, CLE +126, IND +120, TB +101, ATL +227, NYJ +256 (CHI dropped — PHI secondary HIGH + 80% money PHI + CHI QB unknown).
- Slot 1 Master RR: recommend skip or $70 low end.
- Slot 3 Morning: JAX ML · CIN ML · NO ML · LAR ML (+585) / alt 3-leg +330. Slot 4 Afternoon: BAL ML · CAR/CLE U42.5 · SEA/WAS U40.5 · LAR ML (+890). Slot 5 Hybrid: CIN −3.5 · JAX −3 · BAL −3 · PHI ML (+907).
- Slot 6 SuperContest: Week 3 lines not posted.
- TNF ATL@GB read: ATL ML + Under 43.5 (Cohen/VSiN strong lean ATL +6.5 wants +7; BettingPros Under ×2; GB off-OT short week 2-12 ATS laying 3+; Circa ~80% tickets GB, sharp money ATL). Slot 9 island ladder = THU mode; candidate Pitts o35.5 rec yds (Cohen).
- **Not yet done:** STOP B digest summary sign-off, recommendation ledger, futures review §8, Phase 2a record-rules read.

## 8. Next session
1. Andy pushes `wip/yahoo-sync` (this handoff commit + `881d28a`).
2. PM Refresh after practice reports → firm up NYG/CHI/WAS/MIN/SEA QB games; fresh BKR paste → re-price card.
3. Bills credit play (by 4 PM PT tonight) and Circa re-price when photos arrive; then ledger doc.
4. THU mode tomorrow: TNF island ladder + final TNF card.
5. Fix PFF feed URL; decide toolbox dry-run steps; power-ratings revamp (later).

## Guardrails honoured
No bets/account actions. Supabase writes only with per-change OK (deletes, picks reset). No `git add -A`; only this session's files staged. Stale `.git/index.lock` removed once (no git process; delete permission granted on E:\dev).
