---
name: WEEKLY_SYNTHESIS_SESSION
role: Fresh-session prompt — weekly sides/totals + player-prop card and futures review for Platinum Rose
category: dev
docsOnly: true
supersedes: agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md for weekly card / prop-stack / futures-review sessions (that file is reference-only; this prompt does not depend on it)
created: 2026-09-22 (built from the Week 1-2 record, the Week 2 post-mortem, the futures ledger and a live source inventory)
---

# Weekly Synthesis Session — Platinum Rose (NFL 2026)

## Activation (paste as the first message of a fresh session)

```
Run the Platinum Rose weekly synthesis session for 2026 Week <N> (<mode: TUE-WED | THU | FRI-SAT | SUN | MON>).
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Supabase: aambmuzfcojxqvbzhngp.
Read ONLY agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md first and follow it exactly, phase by phase.
Do not open any other file until the prompt tells you to.
```

---

## 1. Mission

Produce two things for Andy, as proposals he reacts to. Nothing gets placed, promoted or written to Supabase by you.

1. **The Week N card.** Sides, totals, round robins and player-prop stacks, built on the strategies that actually made money in Weeks 1–2 (§5), with every leg sourced (§6).
2. **A futures review.** It covers exposure by outcome for the current portfolio, add/enhance options inside the caps, hedge paths (including the playoff hedge ladder), and any new position that is actionable at a current price.

Honesty over volume. A short card of legs that each earn their place beats a full card. If the evidence for a slot is thin, say so and leave it empty.

## 2. Session modes (do only the phases your mode needs)

| Mode | When | Scope |
|---|---|---|
| TUE-WED | After MNF | Phases 0–3 + Futures (§8) + Bills-credit play + TNF early read. **No prop stacks yet.** Boards aren't posted. |
| THU | TNF day | TNF island props (slot 9 ladder) + refresh the futures lines that moved. |
| FRI-SAT | Full slate | Everything: RRs, sides/totals, prop stacks, SuperContest 5. |
| SUN | Game day | Morning card → availability refresh (~10:30, ~11:15 PT) → afternoon card → SNF card. Use the live-leg availability rules (§7.4). |
| MON | MNF | MNF card; availability refresh first. |

## 3. Token discipline (hard rules)

- **Never `cat` a JSON file or dump a whole doc.** Use `python3`/`jq` one-liners that print only the fields you need, and cap the output (`| head -40`). Prefer SQL aggregates over row dumps.
- **Load order is fixed.** Only open a file when the phase that needs it starts. Every file below lists what to pull from it.
- **Budget:** Phases 0–1 ≤ 10k tokens. Digest ≤ 25k. Card build ≤ 25k. Futures ≤ 10k. **Target ≤ 60k per session; stop and report to Andy at 80k.** TUE-WED and THU modes should use well under half of that.
- **Hard checkpoints. Stop and wait for Andy at each:**
  - **STOP A (after Phase 1):** if any source a slot depends on is STALE, send the stale table and the refresh asks, then wait. Only proceed with slots whose inputs are fresh, and only if Andy says to.
  - **STOP B (after the digest, before any tickets):** send a ≤ 15-line digest summary (top leans by tier, QB/injury flags, games you'd skip). Build tickets only after Andy's go.
  - **STOP C (before futures recommendations):** if the division/conference/playoff/win-total boards are older than 7 days, deliver only the exposure matrix and the Super Bowl price check, then ask for fresh boards.
- **Keep a scratch digest** at `scratch/w<N>-synthesis-digest.md`: one line per finding with its source. Build the card from the digest, not by re-reading sources.
- The device VM has **no network**. The cloud container reaches the web via WebSearch/WebFetch/Firecrawl only. Don't retry blocked fetches. Ask Andy to refresh instead (§4).
- One `device_bash` call per logical step. After a git command, check `ls .git/*.lock`. Only remove a lock after confirming no git process is running (`pgrep -a git` shows none, and the lock is zero-byte and older than the command that just finished) **and** after Andy has granted delete permission on `E:\dev` this session. If in doubt, report the lock and leave it.

## 4. Phase 0–1 — Orientation and freshness gate

**Phase 0 (≤ 3 calls):**
1. `HANDOFF.md` — read "Current Pick Up Here", "Needs Andy / Stop Conditions" and "Active Guardrails" only. Then `git status -sb | head -3` and `git log --oneline -3`. Live git beats handoff prose.
2. Open the dated handoff that `HANDOFF.md` names as latest. Skim only its open-items section.

**Phase 1 — preflight (1 call):** `node scripts/weekly-synthesis-preflight.mjs`
It prints `WEEK_START`/`WEEK_END` (use them in every SQL filter below) and ok/STALE for every local input. Then run **Q1** (Supabase feed freshness).

**If a source is STALE, don't work around it.** List the stale sources for Andy in one table with the fix, then **STOP A** (§3). If Andy says to go ahead anyway, build only the slots whose inputs are fresh and mark the rest "provisional":

| Source | Refresh (Andy runs; VM has no network) |
|---|---|
| Player availability / projected starters | `npm run player-availability:live` · `npm run projected-starters` |
| Secondary matchups (must be current week) | `npm run secondary-matchups` |
| Prediction markets + coherence | `node scripts/build-prediction-markets.js` → `npm run prediction-markets:map` → `npm run prediction-markets:coherence` |
| Roster map | NFL Roster Refresh workflow (GitHub Actions) |
| Alpha packet (gated: fails on stale inputs) | `npm run alpha:packet` after the above |
| Prop boards | Andy pastes BEO boards into `docs/Player_Prop_Odds_Weekly/Week<N>/`, or live capture via `scripts/props/betonline-live-parser.mjs` (see `scripts/props/README.md`) |
| BKR current lines | Andy's capture into `data/odds/BKR_current_lines_<MMDD>` |
| BEO/BKR futures boards | Andy screenshots/exports → `npm run futures:ingest-beo-screenshots` (Supabase `futures_odds_snapshots` only carries **Super Bowl** prices) |
| Podcasts | Podcast Ingest workflow. **Check the AssemblyAI balance first:** it was negative on 9/21, and every episode errors until it's topped up. |
| Articles / X bookmarks | `research-intel-ingest` / bookmarks cron (normally automatic) |

## 5. Phase 2a — What the record says (read once, ~2k tokens)

Season through Week 2: **−$587.76 on $799.56**. 5 of 61 tickets paid. Unique legs 142-154-1 (48%) against ~55% needed at the prices paid.
Source: `docs/tracked-wagers/week2_2026_analysis.md`. Read only "Patterns to use for Week 3", plus the scorecard tables if you need a number.

**Build rules that come from the data. Apply them to every leg.**

| # | Rule | Evidence (season, unique legs) |
|---|---|---|
| 1 | **No −120 to −100 connector legs** unless sourcing tier 1–2 (§6). Take −121 or longer, or plus money. | 31-45-1, 41% vs 53% needed, −23% (n=76), bad both weeks |
| 2 | **No points on underdogs.** If you like the dog, use the ML (singles or the dog-ML RR). | Spread dogs 10-20, −44%; dog MLs +21% |
| 3 | **Lean on tackles+assists and passing TDs.** Keep sacks and receiving yards to a minimum. | T+A 9-4 +22%, pass TD 8-3 +14%; rec yds −27%, receptions −18%, sacks 2-3 |
| 4 | **Props go on the side you expect to win.** Never stack an offense you fade elsewhere on the card. | 56% vs 39% (Week 2) |
| 5 | **Each starting QB is one shared risk** across every leg on his offense. Count those legs as one exposure. | MNF Dart injury: Giants legs 4-15 |
| 6 | **ML chalk ≤ −290 is not a free anchor.** Flag it; one per ticket at most. | 6-4 vs ~78% implied; TB −410, BAL −379, LAC −292 all lost |
| 7 | **Structure:** 2-leg tickets and 2-team RRs first. Straight parlays of 5+ legs are moonshots only ($5, one or two a week). | All 3 Week 2 winners were 2-leg or 2-team; 5+ leg straights 0-26 |
| 8 | **Receptions are tight to the line.** Only for proven target share on the expected winner. Yardage is bimodal, so don't pay −110 to −120 for a median line. | 9 of 12 rec losses were within 1.5 catches |
| 9 | **Moonshot ATD stacks lose.** One long-priced TD (+150 or longer) is fine as a single or in an RR. | ATD moonshots 0-11 on scorers; +150-or-longer band +20% |
| 10 | Bookmaker vs BetOnline: **no edge either way** (50% vs 49% after the 9/22 book correction). Choose the book by rule and price, not habit. | — |

**Also known:** the quant prop model **failed validation** (Brier skill −3.3%, calibration inverted). Never use a model "edge %" to select or size legs (`docs/BETTING_LESSONS_LEARNED.md` §"quant prop model FAILED"). Build from verified role: who got the touches last week.

**Claude's own track record (be humble):** in the Week 2 ledger, Claude's shared afternoon picks sank every ticket, while Andy's divergent legs went 5-6. Every proposed-but-unplaced Week 2 stack would have lost. So present reasoning Andy can check, not confidence.

## 6. Phase 2b — Evidence digest (sources, in order)

For each source: pull **only** what's listed, and write a one-line digest entry per finding (`game | market | lean | source | tier`).

**Sourcing tier** (tag every leg; from `docs/NFL_WEEKLY_CARD_PROCESS.md`):
1. Matchup-data hit: secondary-matchup HIGH/MED vulnerability, or a verified role/usage edge.
2. Named expert, week-specific pick (podcast / article / X), with 2+ independent sources for "consensus".
3. Prediction-market price beats the book.
4. Price only. Allowed, but labeled **"price-driven"**.

| # | Source | Pull | How |
|---|---|---|---|
| a | Slate + lines | 16 games, kickoff PT, open→current spread, total, ML | **Q2**. Books there are DK/FD/MGM; Andy's real prices come from BKR lines / BEO boards |
| b | Injuries | QB/RB/WR/TE Out/Doubtful/Questionable by team | **Q5**, then `data/player-availability/latest.json` for `improving`/conflicted rows only. **Game-day truth = team reports/live search near kickoff.** The file has known misclassifications |
| c | QB starters | Any team with a QB change or doubt | `data/projected-starters/2026/<latest>` (filter `position=='QB'`). Known false positives: "will be the backup" phrasing |
| d | Rosters | Only for players you'll propose | `data/nfl-rosters/roster-map-latest.json` with a normalized first-initial+surname match (Cam/Cameron, Jr./II). **Never judge a player's team from memory.** If it's surprising, check live before calling anything "contamination" |
| e | Role/usage | Targets, carries, snaps, trend for candidate players | `data/generated/player-usage-trends-2026.json` (`players[...]`, filter by name); box scores in `data/fantasy/boxscores/espn-*.json` for exact lines |
| f | Secondary matchups | HIGH/MED vulnerabilities for this week | `data/secondary-matchups/latest.json` → `matchups[]` where tier HIGH/MEDIUM (must say `week == N`) |
| g | Consensus signals | Leans with ≥2 distinct sources | **Q3**. Dedupe handle vs display name (e.g. "Sal Bets" = "salbets_"). Drop anything about games not on this week's slate |
| h | Expert podcast picks | Picks created this week, matched to the slate | **Q4**. `game_date`/`commence_time` are usually NULL, so match on home/visitor names. Recap episodes cite last week's games: drop them |
| i | Expert reliability | Who to weight | `data/expert-dossiers/<slug>.json` → `tendency_signals` only, for experts who appear in g/h |
| j | Prediction markets | Game/total/player contracts that beat the book | `data/prediction-markets/latest.json` → contracts with `net_american_odds` for slate games/players only |
| k | SuperContest | This week's lines + locked-card format | `data/supercontest/live-market-comparison.json` (games[]) |
| l | Prop boards (FRI+) | Parsed boards | `python3 scripts/props/beo.py docs/Player_Prop_Odds_Weekly/Week<N> data/generated/props/beo.json`, then query `beo.json`. **Pull boards fresh on game day**; Week 2's were 8.5 h stale |
| m | Team context (optional) | Only if a side read hinges on it | `data/generated/team-profiles/*2026*.json`. **Do not use `public/weekly_stats.json`: it is 2025 data.** |

Key traps: nflverse codes the Rams `LA` (roster map `LAR`); odds tables use `WSH` (elsewhere `WAS`). Supabase `game_odds_snapshots` has stale preseason rows labeled with this week, so always filter by kickoff window (Q2 does).

## 7. Phase 3 — Build the card

### 7.1 Slots (from `docs/NFL_WEEKLY_CARD_PROCESS.md`, reweighted by §5 rule 7)

Order: RRs first, then sides/totals, then props.
- **Dog-ML 2-team RR** (Bookmaker): 6 selections × $1.33 = $20. Dogs you'd bet as singles. No points.
- **Prop 2-team RR**: 5 selections from different games × $2 = $20. T+A / passing TD / legs you'd play as singles, −105 to −250. Confirm the book allows prop RRs. BKR props are same-game only; if BKR RR is impossible, say so.
- **Master RR** (slot 1): only if 8 legs survive §5 filters. Otherwise say it's skipped and why.
- **2-leg tickets / singles** for the highest-margin reads (`BETTING_LESSONS_LEARNED.md`: fire best reads standalone, don't bury them).
- **SuperContest 5**: from Andy's contest picks. Flag half-point buys.
- **Prop stacks** (slot 7): at most 1–2 straight stacks of 5+ legs, $5 moonshots. Otherwise 3–4 leg stacks split by kickoff window, and one night-game leg in hybrids for live hedges.
- **Island ladder** (TNF/SNF/MNF): the Tier 1/2/3 ladder, diversified legs, no shared anchor. BEO Primetime Parlay Insurance goes on Tier 3 if its terms are verified (`data/sportsbooks/promotions-2026.json`).

Stakes follow the card-process doc. Flag any deviation; never invent new staking.

### 7.2 Hard constraints (Andy's standing rules)

- **Leg barrier −350.** Flag any stack with **more than two legs shorter than −200**.
- **QB rushing / INT props are allowed only with a stated matchup fit** (mobile QB vs man/blitz-heavy D, QB expected to trail, young QB vs ball-hawking secondary). BKR SGPs don't take INT legs.
- **Player missing from the final box score = leg LOST.** Avoid questionable players in stacks unless the price covers it.
- **Books:** 2-team round robins → Bookmaker. BKR props → **same-game only**. Multi-game prop stacks → BetOnline.
- **BEO correlation trim** starts above 2 legs per game (Week 2: 5 same-game legs cut the price 15.4%). Keep ≤2 legs per game on BEO multi-game stacks.
- One leg per game where possible; props independent of the sides/totals parlays; no exact duplicate legs across live tickets.
- The Bills free-bet credit ($10, **sides/totals ~−110 only**, stake not returned, lands Wed by 7 pm ET). Andy's default is **Bills' opponent + points**. Rule 2 says avoid spread dogs, so show both Andy's default and the best −110 side/total on the slate. Andy picks.

### 7.3 Per-leg fields (every proposed leg, one table row)

`game | market & line | book | price | band (−350…+) | tier 1-4 | side-expected-to-win? | QB exposure | availability tier | one-line why`

### 7.4 Game-day availability (SUN/MON modes)

Use `scripts/props/availability.mjs`. A player is only "spoken for" if he has a **pending leg on a ticket that can still win**. Dead parlays free their players. RR alive ⟺ losses ≤ N−K.
- **HARD**: same player/market/line → skip.
- **SOFT**: same player, different market → allowed, flagged.
- **FREE**: no pending leg on a live ticket.

Leg states come from the tracker export or Andy's mid-day reconcile. The VM can't reach ESPN; use Firecrawl on the ESPN summary API (`maxAge: 0`) for spot checks.

### 7.5 Self-check before presenting (run it; don't eyeball)

A short python pass over the proposed-card table that counts, per ticket:
- legs in −120..−100 without tier 1–2
- spread-dog legs
- ML ≤ −290 legs
- legs shorter than −200 (>2 = flag)
- legs per game (>2 on BEO = flag)
- QB-shared exposure

Then show the combined American price computed, not estimated. Fix or flag every hit.

## 8. Futures review (TUE-WED mode; one pass, ~15k tokens)

1. **Portfolio:** `data/futures-imports/andy-portfolio-ledger-2026.json` → `positions[]` (id, selection, stake, price, cap), `limits`. As of 9/21: 12 open positions, $238.51 staked. BUF SB $59.09 @ blended +992 (cap $200). GB SB $40 @ +2500 (cap $200). Six SB exactas (GB–BUF $45 @ +8300 is the big one). BUF O10.5 wins. GB make playoffs. `open_parlays` are **unverified contingent assets**: never count them as hedge capacity.
2. **Exposure matrix:** compute with python (not by hand) the net P&L for each plausible SB outcome: each held team wins, each exacta pairing, and neither. Also note the win-total / playoffs legs, which settle in the regular season.
3. **Current prices:**
   - **Q6** gives SB prices (BEO + best book, and the BEO price 7 days ago).
   - Division / conference / playoffs / win totals: latest BEO/BKR import in `data/futures-imports/` (**stale since 9/08–09**; ask Andy for fresh screenshots before any recommendation there).
   - Prediction markets (j) cover division, conference, make-playoffs and win totals for cross-checks.
4. **Recommend** (each with price, stake, cap room after, and what it does to the matrix):
   - **Add/enhance:** only where the current price ≥ entry, or the thesis strengthened with evidence. Respect caps ($200 per SB anchor; $500 primary planned).
   - **Hedge paths:** use the formulas, pivot windows and portfolio rules in `docs/FUTURES_HEDGE_REFERENCE.md` (~50 lines). Now (Week 3–5) is an *overreaction/buy* window, not a hedge window. Lay out the playoff hedge ladder: at which round and price each position gets a full or 50% lock-in, and roughly what cash reserve that needs.
   - **New positions:** only if actionable at a current, placeable price with independent support (tier 1–3). Otherwise watchlist (`futures-watchlist-2026.json` rules: exactas are monitor-only unless a secondary market exists to price-shop).
   - **Funding sources:** BEO reloads $2.85 (Packers SB only if ≥ +2500), BKR BetPoints 6,899 (check cash rate), Bills-win credits (first winner clears the $9.09 BUF boost).
5. **Never run `agents/portfolio-synthesize.js` or any paid synthesis** without Andy's explicit per-run OK.

## 9. Output

1. **`reports/bets/2026-w<NN>-card.md`** with these sections, in order:
   - Freshness table (from Phase 1)
   - Bills-credit play
   - RRs
   - 2-leg/singles
   - Sides/totals
   - SuperContest
   - Prop stacks by window
   - Island ladder
   - Futures (matrix, adds, hedge ladder, new/watch)
   - "Left off and why"
   - Self-check results

   Every leg uses the §7.3 row.
2. **A chat summary for Andy of ≤ 25 lines:** the top 5 plays, anything that needs his decision, and stale-data caveats. Don't paste the report.
3. **After Andy places tickets:** update the recommendation ledger: proposed vs placed, divergences D-numbered, graded after the week.
   - **It is not a repo file.** It is a doc in Andy's claude.ai Project **"DEV"**, at path `claude/recommendation-ledger-2026.md`. Claude sessions attached to that project use the Projects tool: `project_read` the doc, then `project_write` the full updated text back to the same path.
   - **Don't create a repo copy.** Non-Claude agents (Codex etc.), or a Claude session not attached to the DEV project, write the Week N ledger section into their dated handoff under a `## Recommendation ledger — pending import` heading, for the next DEV-attached Claude session to merge.
4. **End of session:** a dated handoff in `handoffs/YYYY-MM-DD-HHMM-claude-<topic>-handoff.md`. `HANDOFF.md` gets a short pickup update only, never a transcript.

## 10. Guardrails (non-negotiable)

- **Supabase writes need Andy's per-change OK.** Reads are fine.
- No bet placement or account actions. Browser use on sportsbook sites is read-only and needs Andy's go-ahead.
- Git:
  - No `git add -A`; stage narrow, reviewed file sets only.
  - `data/official-picks/user-placed-wagers-2026.json` and its public copy are gitignored on purpose.
  - Preserve the dirty checkout; never clean, reset or stash.
- Don't write to `public/`, `data/futures-imports/*` or official picks directly. Placed wagers are logged by Andy's flow, then `scripts/sync-placed-wagers-to-bankroll.mjs` (use `--dry-run` first; it upserts all rows).
- If data contradicts this prompt (a rule, a number, a file path), trust the live data, and say what changed.

---

## Appendix — SQL (Supabase `aambmuzfcojxqvbzhngp`; replace WS/WE with preflight's WEEK_START/WEEK_END)

**Q1 — feed freshness**
```sql
select 'intel_notes' src, max(captured_at) latest, count(*) filter (where captured_at >= 'WS') since_ws from research_intel_notes
union all select 'pick_signals', max(captured_at), count(*) filter (where captured_at >= 'WS') from research_pick_signals
union all select 'expert_picks', max(created_at), count(*) filter (where created_at >= 'WS') from user_picks where source='EXPERT'
union all select 'podcast_transcripts', max(processed_at), count(*) filter (where processed_at >= 'WS') from podcast_transcripts
union all select 'podcast_errors', max(discovered_at), count(*) filter (where status='error' and pub_date >= timestamptz 'WS' - interval '7 days') from podcast_episodes
union all select 'game_odds', max(captured_at), count(*) filter (where captured_at >= 'WS') from game_odds_snapshots
union all select 'futures_odds_SB', max(captured_at), count(*) filter (where captured_at >= 'WS') from futures_odds_snapshots
union all select 'injuries', max(captured_at), count(*) filter (where captured_at >= now() - interval '24 hours') from player_injuries;
```

**Q2 — slate with open→current consensus (DK/FD/MGM median)**
```sql
with g as (select * from game_odds_snapshots where season=2026 and commence_time >= 'WS' and commence_time < 'WE'),
cur as (select distinct on (game_id, book, market) * from g order by game_id, book, market, captured_at desc),
opn as (select distinct on (game_id, book, market) * from g order by game_id, book, market, captured_at asc)
select c.away_team||' @ '||c.home_team game, to_char(min(c.commence_time) at time zone 'America/Los_Angeles','Dy HH24:MI') pt,
 percentile_cont(0.5) within group (order by o.spread) filter (where c.market='spread') open_home_spread,
 percentile_cont(0.5) within group (order by c.spread) filter (where c.market='spread') home_spread,
 percentile_cont(0.5) within group (order by c.total) filter (where c.market='total') total,
 percentile_cont(0.5) within group (order by c.home_price) filter (where c.market='moneyline') home_ml,
 percentile_cont(0.5) within group (order by c.away_price) filter (where c.market='moneyline') away_ml,
 max(c.captured_at)::timestamp(0) as_of
from cur c join opn o using (game_id, book, market) group by 1 order by min(c.commence_time);
```

**Q3 — multi-source consensus signals this week**
```sql
select bet_type, event_ref, team_or_market, lean, count(*) n, count(distinct source) srcs, string_agg(distinct coalesce(author, source), '; ') who
from research_pick_signals where captured_at >= timestamptz 'WS' - interval '1 day'
 and bet_type in ('spread','moneyline','spread_or_ml','total','player_prop')
group by 1,2,3,4 having count(distinct source) >= 2 order by srcs desc, n desc limit 40;
```

**Q4 — expert podcast picks created this week (match to slate by team names)**
```sql
select expert, pick_type, selection, line, visitor||' @ '||home game, left(rationale,90) why
from user_picks where source='EXPERT' and created_at >= timestamptz 'WS' - interval '1 day'
order by home, pick_type limit 60;
```

**Q5 — skill-position injuries (latest per player, last 48 h)**
```sql
with cur as (select distinct on (espn_player_id) team_abbr, player_name, position, injury_status, reported_at
  from player_injuries where captured_at > now() - interval '48 hours' order by espn_player_id, captured_at desc)
select team_abbr, string_agg(player_name||' '||position||' '||injury_status, '; ' order by position) out_q
from cur where position in ('QB','RB','WR','TE') and injury_status in ('Out','Doubtful','Questionable','Injured Reserve')
 and reported_at > now() - interval '10 days' group by 1 order by 1;
```

**Q6 — Super Bowl futures: BEO vs best book, and BEO a week ago**
```sql
with cur as (select distinct on (team, book) team, book, odds, captured_at from futures_odds_snapshots
  where season=2026 and market_type='superbowl' and captured_at > now() - interval '3 days' order by team, book, captured_at desc),
wk as (select distinct on (team, book) team, book, odds from futures_odds_snapshots
  where season=2026 and market_type='superbowl' and captured_at between now() - interval '10 days' and now() - interval '6 days'
  order by team, book, captured_at desc)
select c.team, max(c.odds) filter (where c.book='betonline') beo, max(c.odds) best,
 (array_agg(c.book order by c.odds desc))[1] best_book, max(w.odds) filter (where w.book='betonline') beo_7d_ago,
 max(c.captured_at)::timestamp(0) as_of
from cur c left join wk w using (team, book) group by c.team order by beo nulls last limit 20;
```
