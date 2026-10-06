# Handoff — Mon 2026-10-05 17:20 PT — MNF ATL@NO: prop planner upgrades, expert prop intel, tickets live

**Team:** Claude Team 2 (resumed from the H2C2 packet `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/H2C2_START_HERE.md`).
**Lane worked:** MNF live close-out (plus planner UX and expert intel Andy asked for along the way).
**Git:** `main`, pushed through the commit that adds this file (session range `32bf89d..HEAD`, 13 commits). Commit only via the temp-index method (briefing §7); the real `.git/index` is still stale.
**Next session (Andy, 17:19 PT):** fresh session to gather **post-mortem data on each team's performance this weekend** (Week 4). Settle MNF first if it is final.

---

## 1. What changed this session

### Prop parlay planner (`scripts/props/build-prop-planner.py`)
- Market pills are **multi-select**; a selected market's sections load **expanded**; open/closed state and scroll survive adding/removing legs.
- Pills follow the **Game (book) filter** (BEO has no Over/Under player lines, so those pills drop when BEO is selected; a hidden selection is pruned).
- "Add more captured lines" moved under the builder in a sticky right column; the market list grows with the page (no inner scroller).
- **Expert picks panel** (`--experts FILE [FILE...]`): verified **player-prop** picks only for the game, matched to the closest BEO/BKR leg with "line moved" notes and Add/remove buttons; anytime TD, 2+ TD, first TD / first-team TD (mapped to game first TD with a note), O/U + ladder rungs. Each player pick passes a roster gate (ESPN full rosters + availability; same rules as `roster_vet.py`) — a BLOCK gets no Add button.
- **Source filter**: outlet pills with counts + expert dropdown; article title on every card.
- Rebuild command (ATL@NO):
  ```
  python3 scripts/props/build-prop-planner.py --game "ATL @ NO" --captured "2026-10-05 ~12:10 PT (MNF Week 4)" \
    --beo docs/Player_Prop_Odds_Weekly/Week4/BEO_Week4_ATL_NOS_v3 --bkr docs/Player_Prop_Odds_Weekly/Week4/BKR_Week4_ATL_NOS \
    --experts data/generated/master-intel/w04-expert-verified.json data/generated/master-intel/w04-mnf-prop-articles.json \
    --out reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html
  ```
  Output: `reports/analysis/prop-planner/player-prop-parlay-planner-2026-w04-atl-no.html` (1,309 selections, **56 expert prop picks**, all roster-gated, all with board legs).

### Expert prop intel for ATL@NO — `data/generated/master-intel/w04-mnf-prop-articles.json` (52 rows, `sources_checked` lists every article read)
- **BettingPros:** Fanelli TD scorers (Bijan first-team TD/2+ TD, Olave first-team TD, London ATD, Juwan ATD/2+ TD); Servodidio SGP (Olave 80+, Vele 45+, London 70+ rec yds).
- **VSiN:** Cohen London o76.5 rec yds (lean only).
- **Action Network** (archive/1 + PRO via Andy's signed-in browser-pane session): Farley (Pitts/London/Shough yds), Gallant (Juwan ATD, Penix INT), Ammirante SGP (Pitts yds, Kamara carries), Neiffer (Juwan/Fant ATD), Planovsky Kalshi (Juwan), Kolodziej PRO (Brian Robinson Jr. o27.5 rush, Kamara o10.5 carries, Kendre Miller o25.5 rush). Slate-wide pieces checked: no ATL@NO props.
- **Andy's X bookmarks** (read in the browser pane; **no Gemini, no Supabase**): xEP, Cody Brown, Dan's AI, Harry Lock, The Prop Dealer TD model, Sal Bets (Sal's #1 = **Penix UNDER 0.5 INT**, #3 = **Shough UNDER 254.5**, opposing Andy's slip legs).
- Method: manual in-session extraction, no paid model calls.

### Tickets logged — `data/official-picks/user-placed-wagers-2026.json` (backups `*.bak-claude-20261005-pre-mnf-kalshi`, `*-pre-mnf-tickets`)
| Ticket | Book | Legs | Stake → to win | Odds |
|---|---|---|---|---|
| Kalshi F92AF9DCBF8 | Kalshi | Hooper 1+ TD, Fant 1+ TD, NO D/ST 1+ TD | $9.81 → $4,156.85 | +42,374 |
| #1002759127 | BetOnline | 8 (London o5.5 rec, Bijan TD, Bijan 19+ car, Kendre Miller TD, Blackmon o4.5 T+A, Vele o3.5 rec, Za'Darius Smith sack, **Penix U30.5 att**) | $6.00 → $552.00 | +9,200 |
| #1002756348 | BetOnline | 6 (Kamara 10+ car, Zaccheaus TD, Juwan TD, Pitts o2.5 rec, Shough 253+, Vele o45.5) | $4.00 → $560.00 | +14,000 |
| #1002754993 + #1002746959 (merged row) | BetOnline | 7 (Jordan sack, Juwan TD, London o5.5 rec, London TD, Bijan TD, Penix o0.5 INT, Shough 252+) | $11.61 → $1,320.32 ($6.61→$740.32 + $5.00→$580.00) | ≈+11,372 |
| BKR #739813995 | Bookmaker | NO −1 / Over 46 | $26.39 → $67.82 | +257 |

MNF cash risk **$57.81**. Per-leg BEO prices filled from the 12:10 board where captured (`price_source` on each leg); 4 legs not captured (Blackmon T+A, Penix U30.5 att, Shough 253+, Vele o45.5). The Kalshi combo is the same 3-leg combo as The Prop Dealer's "+40,000 NFL Touchdown Lotto" (noted in sources; not written to the ticket).

### Trackers
- Desktop tracker rebuilt (`public/live-tracker-sunday.html`, `docs/tracked-wagers/live-tracker-sunday.html`).
- Phone tracker: the old artifact `R4qQo7h1…` could not be read from this session (not found), so a **new private artifact** was published: https://claude.ai/artifact/Y4oDBNroarX4rLN3tGauKB. Andy only needs the phone tracker for Sunday afternoon games.

### Other
- ESPN roster snapshot refreshed 2026-10-05 21:17 UTC (`data/nfl-rosters/espn-full-rosters-latest.json`).
- `scripts/props/build-prop-planner.py` patch script left in `scratch/patch_prop_planner_experts.py` (untracked; generator changes are committed).
- Twitter bookmarks agent can't reach X from the device sandbox (all fetches fail; it fell back to its sample pass). Its sample output was moved to `_to_delete/`. Both modes of that agent make **paid Gemini calls** (`--dry-run` still calls Gemini; it only skips Supabase).

## 2. Open items (in order)
1. **Settle MNF** after the final: `scripts/reconcile-settlement.mjs` + check against `data/fantasy/boxscores/espn-*.json`. **Manual:** Kalshi NO D/ST TD leg; Blackmon T+A; Penix pass attempts. Rule: player missing from the box score = LOST leg (Fant was questionable).
2. **Pick'em:** `picks-2026-w04.json` only has TNF PIT as submitted; every other game falls back to the plan (ATL@NO split by pool). Get Andy's real picks before `node scripts/pickem-grade.mjs --week 4`.
3. **Post-mortem (next session):** team-by-team Week 4 performance data.
4. Carried from the briefing §6: grade the 11 AI paper tickets + Week 4 recommendation-ledger section; end-of-week analysis; CHI@GB 10:00 time fix in `BKR_current_lines_1005_1205` provenance/buildfmt; BEO reloads + BUF SB capture; Week 5 boards (MIN@NO, BAL@ATL, BUF@LAR); Bills credit goes on BUF@LAR.
5. Windows cleanup Andy must do (bridge can't delete): `.git/HEAD.lock.stale-20261005*` (now a–p), `.git/main.lock.stale-20261004`, `.git/index.lock`, `.git/index.tmpcopy`, `_to_delete/`; then `git read-tree HEAD` only after confirming nothing is staged on purpose.

## 3. Environment notes
- Claude in Chrome was **not connected** to this session (no browsers listed). The desktop app's browser pane works and keeps sign-ins: **Action Network (Pro) and X are signed in** there; actionnetwork.com, x.com and bettingpros.com are allowed sites.
- WebFetch is blocked on actionnetwork.com and serves a stale 2025 cache of `/nfl/archive/1`; use the browser pane.

## 4. Resume prompt (post-mortem session)
```
You are Claude Team 2 continuing NFL_Dashboard ("Platinum Rose"). Read handoffs/2026-10-05-1720-claude-mnf-planner-experts-tickets-handoff.md, then run git status -sb / git log -5 --oneline in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). If MNF ATL@NO is final and not yet settled, settle the 5 MNF ticket rows from ESPN first (manual: Kalshi NO D/ST TD, Blackmon T+A, Penix pass attempts). Then gather Week 4 post-mortem data on each team's performance this weekend. Guardrails per the H2C2 briefing §7: read-only sportsbooks, no Supabase writes or paid model calls without Andy's per-action OK, ledger changes only record what Andy reports, commit via the temp index only.
```
