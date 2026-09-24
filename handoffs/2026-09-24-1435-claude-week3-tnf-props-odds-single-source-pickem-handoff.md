# Handoff: Week 3 THU — odds single-source, pick'em tools, TNF island ladder placed

**Session:** Thu 2026-09-24 11:05 → 14:35 PT · **Author:** Claude · **Branch:** `main`
**Commits:** `040318f` odds single-source (pushed) · `db7acec` pick'em tools (pushed) · this handoff commit (push pending — Andy).

## 1. TheOddsAPI → single source (`040318f`)
- `odds-ingest.yml` and `game-odds-ingest.yml` made the identical call (3 credits each); nothing read `odds_snapshots`. `agents/game-odds-ingest.js` is now the only scheduled caller and derives `line_movements` (legacy Away_Home shape; same-hour re-runs don't duplicate). Free `/v4/sports` quota pre-check; skips below `ODDS_QUOTA_FLOOR` (15) unless `--force` / workflow `force` input.
- `scripts/sync-live-market-lines.mjs` reads Supabase `game_odds_snapshots` (0 credits; `--live` keeps the API path). Also fixed: it compared against Week 2 contest lines (now newest of latest.json / week-NN-lines.json). Verified on Andy's machine 11:41 (Week 3, 16 games).
- Schedules: odds-ingest manual-only; game-odds 11 runs/wk (Sun 4, Mon/Thu pre-primetime, Tue–Sat 16:30 UTC); futures Tue+Fri. ~200 credits/mo.
- GitHub: Andy disabled "Odds Ingest" and **"Futures Odds Ingest"** (re-enable after the quota resets — futures agent has no quota guard yet). Quota was ~12 at 11:13; reset date unknown (check account).

## 2. Pick'em / confidence pools (`db7acec`)
- `data/pickem/pools-2026.json`: SimplySportsware (confidence; weekly+quarterly+4-game+season → `market`), Yahoo (confidence; weekly+season → `weekly_leverage`), CBS (straight-up; `su_flips`). ~95 entrants each; per-game locks.
- `npm run pickem:card` → `reports/pickem/2026-wNN-pickem.md` + `data/pickem/plan-2026-wNN.json`; `npm run pickem:grade -- --week N`. Leans: `data/pickem/leans-2026-w03.json`. 11 unit tests.
- **Week 3 TNF submitted:** SimplySportsware GB @10 · Yahoo ATL @3 · CBS GB. Yahoo plan for Sunday: TB @2, IND @1 (coin-flip flips). Standings not yet entered — Andy will provide leaderboards; then wire standings into strategy.

## 3. TNF ATL@GB — placed (all logged in `data/official-picks/user-placed-wagers-2026.json`, gitignored)
| Rung | Ticket | Book | Risk | Price | Legs |
|---|---|---|---|---|---|
| Tier 1 | 999235271 | BEO Prop Shop (Primetime insured) | $10 | +1000 | Love 1+ INT (**D13**: plan was U0.5) · Love U19.5 comp · Penix o19.5 comp · Z. Smith 1+ sack |
| Tier 2 | 739202488 | BKR SGP | $6.48 | +2584 | Bijan 5+ rec · Bijan 81+ rush · B. Robinson 25+ rush · London 69+ rec yds · London 1+ TD |
| Tier 3 | 999241744 | BEO Props Builder | $5 | +11000 | Golden o56.5 · Watson o73.5 · Love o7.5 rush yds · Penix o0.5 INT · Wyatt 1+ sack · Van Ness 1+ sack |
- Tier 2 stake $6.48 vs planned $5 — ask Andy the funding source (flagged `needs_confirmation`).
- SuperContest 5 (recommended, on Andy's lines): ATL +5.5 (TNF) · MIA +11.5 · TEN +2.5 · IND +2.5 · CIN −3.5. **Not confirmed submitted** — ask.
- Game-script brief, BEO insurance terms, ladder v1/v2 and all pricing notes: `reports/bets/2026-w03-card.md` (bottom sections). Codex captures: `handoffs/2026-09-24-1230-codex-bkr-…`, `…1615-codex-beo-…`, `…1615-codex-dk-…`.
- **New standing step (Andy):** paste every slip for a leg-by-leg check (player, side, line, market, book, duplicates, final price) before submitting.
- Pricing learned: BEO Prop Shop cut a same-script 4-leg ~30%; BEO priced an anti-correlated leg *above* naive; BEO Props Builder trimmed a 6-leg ~14%; BEO priced Tier 2 legs at +1800 vs BKR +2584; BKR capped/cut a Love-2+TD + GB-WR-TD stack ~50%.

## 4. Open / next (fresh session)
1. **Week 3 favorites longshot parlay (not placed).** Andy wants favorite MLs only + 1–2 confident sides/totals, ≥ +7500, starting with GB ML (so it must be placed before TNF 5:15 PT). Proposal (BKR 9/23 prices): GB ML · PHI ML −228 · CIN ML −188 · BAL ML −175 · NO ML −170 · JAX ML −156 · LAR ML −143 (tier 4, Nacua DNP) · CAR/CLE U42.5 −111 · SEA/WAS U40.5 −112 ≈ +7626; bigger: CIN −3.5 for CIN ML ≈ +9840; no-LAR: +BUF −332 +DET −294 ≈ +7829 (4 legs < −200). **Codex is pulling fresh BEO + BKR lines for comparison** — re-price from those.
2. Under 43.5 straight (TNF) — proposed, not placed.
3. Bills $10 credit and card slots 1–5 (dog RR, master RR, slots 3/4/5) — status unknown; slots 3/4 wait on Nacua Friday.
4. DEV ledger `claude/recommendation-ledger-2026.md` updated with all three TNF tickets; grade D13 + tickets after the game (`npm run pickem:grade -- --week 3` after Sunday/Monday too).
5. Carry-forward: CI-GREEN, props-intel tests update + commit (`scripts/build-player-props-intel.js` WIP still uncommitted), governance "commit to main" pass, worktree/branch cleanup, Supabase sync of Week 2 ticket numbers (needs OK), $6.81 free money unassigned.
6. Small bugs found: FantasyPros availability events carry future `published_at` (timezone parse); `futures-odds-ingest.js` needs the same quota guard; `data/sportsbooks/promotions-2026.json` → update BEO Primetime terms (verified 9/24: 4–5 legs exactly 1 loser, 6–7 up to 2, 8–10 up to 3; $100 cap; Prop Shop/SGP builder only); secondary-matchups roster tags stale (Reed/Mooney/Musgrave/Doubs).

## 5. Resume prompt
```
Resume NFL_Dashboard ("Platinum Rose") — Week 3 THU→FRI. Repo E:\dev\projects\NFL_Dashboard (device_bash $HOME/mnt/dev/projects/NFL_Dashboard), branch main; verify HEAD vs origin/main.
Read: HANDOFF.md → handoffs/2026-09-24-1435-claude-week3-tnf-props-odds-single-source-pickem-handoff.md → reports/bets/2026-w03-card.md (bottom: TNF brief + ladder + placed) → agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md.
First: if before TNF kickoff (5:15 PT Thu), re-price the favorites longshot parlay (§4.1) from Codex's fresh BEO/BKR line pulls; Andy pastes the slip for verification before submitting.
Then: confirm SuperContest 5 + Bills credit + slots 1–5 status; log placed vs proposed in DEV claude/recommendation-ledger-2026.md; Nacua/Darnold Friday status for slots 3/4; pick'em leaderboards → standings; futures review §8; Circa re-price if photos arrive.
Standing constraints: no git add -A; never reset/clean/stash; Supabase writes need per-change OK; no bet placement/account actions; Andy pushes; docs/Futures_Odds/ untracked; no team power ratings as evidence; $6.81 free money unassigned; local scheduled tasks run from this checkout; paste-slip-before-submit check on every ticket.
```
