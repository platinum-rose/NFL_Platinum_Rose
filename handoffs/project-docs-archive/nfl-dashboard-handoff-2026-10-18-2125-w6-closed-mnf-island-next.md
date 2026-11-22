# NFL Dashboard handoff — 2026-10-18 21:25 PT — W6 closed (non-MNF), pivot to MNF Island

## State
- Repo: `$HOME/mnt/dev/projects/NFL_Dashboard` (via `mcp__remote-devices__device_bash` only). Branch `claude/w5-prop-cards-2026-10-11`.
- HEAD `e6ebfcb` "W6: settle all non-MNF tickets, log SNF hedges, park SuperContest partial parlay". Pushed to origin; 0 ahead. The push also carried the previously unpushed `eae6b66` (DK Predictions per-event feed capture).
- Checkout is still dirty. Rules: no `git add -A`, no full `git status`, `git commit --only -- <paths>`. Deletion is not permitted in the folder, so git leaves `.lock` files after commit/push; `mv` them aside (`HEAD.lock`, `next-index-*.lock` moved to `.git/stale-*` this session). Never `mv` under `.git/refs`.
- Standing: no spend on Gemini/AssemblyAI/OpenAI. Everything is a proposal; place/log nothing unless Andy says so.

## Week 6 result
- Closed profit on logged tickets: **+$1,216.95**. Including the unlogged DK 5 Pick Combo (position 41516472, lost, -$24.06): **+$1,192.89**. Logged cash risk $932.38.
- SNF final: DAL 13 @ GB 23 (GB by 10, total 36). Net on the game +$1,416.31 (GB ML tickets +1,632.30; hedges net -215.99).
- Settled wins: 740291356 (+1,248.23), 740441886 (+384.07), 740479908 (+101.08), 740483956 (+35.71), 740488148 (+41.60), free bet 1005591415 (+9.09).
- Losses: 740482284, 740483359, 740487866, DKP DAL +3.5, 740418415, 740440846, 740456086. Dead tickets with unrelated legs left ungraded (existing precedent): 740418657, 740444569, 1006732445, DKP 6-pick.

## Alive for MNF (WAS @ SF, Mon 10/19 5:15 PM PT) — both depend on SF, so they are correlated
- 740279274 teaser: TB +8.5 and KC -2 legs WON; SF -1.5 (teased) pending.
- 740416960 SuperContest 3-leg partial parlay: GB -1 and KC -7 WON; SF -7 (-123) pending. Stake 25, +2173 as placed, win $543.13 as placed (uncertain, two intended slots were never filled).
- MNF grid (base +1,192.89): teaser W + SC W = +1,806.52; teaser W + SC L = +1,238.39; teaser L + SC W = +1,706.02; both L = +1,137.89.

## Parked
- `data/official-picks/proposals/parked/supercontest-w6-partial-parlay-740416960.json` (status `PARKED_FOR_FUTURE_USE`). Stores the structure, the placed legs, the unfilled CLE +5.5 / CAR +1.5 slots, and future-use notes (place early-certain picks first, hold slots for contest lines that beat the book, fill before kickoff, check the book accepts live legs on the same ticket).
- Caveat: "filed for future use" was interpreted as a reference record in the repo, not a live ticket. The live ticket 740416960 stays open on SF -7.

## Open items
- DK 5 Pick Combo (41516472, -$24.06) is not logged in the wager file; waiting on Andy's go-ahead.
- Dead tickets' unrelated legs left ungraded.
- DK feed spread rows come out flipped (parser bug flagged, unfixed).
- Official inactives were never verified by Claude this session.
- WAS @ SF wind/gust concern at SF: check the forecast before building.
- The `handoff` skill is ATLAS-specific (E:\dev\ATLAS); it does not apply to this repo.

## Lessons
- Live model had the GB edge sign wrong while DAL was favored (corrected to -1.0). Re-check the sign whenever the favorite flips.
- The scores feed lagged repeatedly; confirm with Andy's reports before settling.
- Wager file convention: `json.dumps(indent=2, ensure_ascii=False)`, NO trailing newline, back up to `scratch/` first, confirm round-trip equals the raw text before writing.
- If a ticket is placed: log per wager-leg rules, run `node scripts/check-wager-legs.mjs --week 6`, then `node scripts/generate-live-tracker.mjs --week 6`.

## Next task
MNF Island parlay proposals for WAS @ SF using the locked 3-tier player-prop template (project memory `nfl_dashboard_island_game_parlay_template.md`). Note existing SF exposure (teaser leg + SuperContest leg). Vet rosters (`scripts/nfl-rosters/roster_vet.py --fetch --strict`) and pull real injury reports before any prop. Show arithmetic in code, lead with numbers.

## Resume prompt
```
Resume NFL_Dashboard. HEAD = e6ebfcb on claude/w5-prop-cards-2026-10-11 (pushed). W6 non-MNF tickets settled (+$1,216.95 logged; +$1,192.89 incl. unlogged DK 5-pick). Alive: teaser 740279274 and SuperContest 740416960, both on SF (WAS @ SF Mon 5:15 PM PT). Task: build MNF Island parlay proposals using the locked 3-tier template. Repo access only via mcp__remote-devices__device_bash ($HOME/mnt/dev/projects/NFL_Dashboard); keep the dirty checkout untouched (no git add -A, no full git status, git commit --only, mv stale .git/*.lock aside). No spend on Gemini/AssemblyAI/OpenAI. Everything is a proposal; do not place or log anything unless I say so. Read claude/nfl-dashboard-handoff-2026-10-18-2125-w6-closed-mnf-island-next.md first.
```
