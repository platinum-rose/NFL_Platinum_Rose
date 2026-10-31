# Week 8 Final Data Checklist — before card synthesis and the Intel Report builds

> Reusable version: `python3 scripts/master-intel/final_gate_check.py --week <N> --stage friday|saturday` (writes `reports/intel/gates/`). This file is the Week 8 human-readable snapshot.

Status as of **Fri Oct 30, 9:00 PM PT** (Andy's 8:49 PM answers applied; analysis layer §0 added) (preflight `node scripts/weekly-synthesis-preflight.mjs --week 8` + live checks this session).
Legend: ✅ ready · 🔄 refresh scheduled · ⚠️ needs action · ❌ missing · ➖ optional / not used by the weekly report
Owner: **C** = Claude · **A** = Andy · **C+A** = Andy runs/logs in, Claude processes.
"When" = latest useful refresh: **Sat PM** = Saturday-night build window; **Sun AM** = before 10:00 AM PT Sunday.

## 0. Analysis layer — what turns the data into recommendations (order matters)
| # | Item | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 0.1 | Week 8 slate (13 Sun/Mon games; TNF final) | `data/generated/team-dossiers/w08-slate.json` | ✅ confirmed by Andy 8:49 PM (`operator_confirmed: true`) | — | — | — |
| 0.2 | Team dossiers (32 teams / 14 matchups) | `data/generated/team-dossiers/2026-w08/` | ✅ built Fri | Rebuild only if injuries/QBs change | C | Sat if needed |
| 0.3 | Matchup analytics in every game packet: power ratings/SRS, secondary vulnerability, FTN context, coaching trends, splits, openers, prediction markets, weather, availability, projected starters, props intel, article review | sliced into the synthesis queue | ✅ all sources present (sides queue: 0 missing) | Refresh sources Sat → rebuild queue | C | Sat PM |
| 0.4 | Sides synthesis queue (one packet per game) | `scratch/w08-game-synthesis-queue-sides.json` | ✅ built 8:55 PM, 13 packets, BKR lines from tonight's capture (`bookmaker-gamelines-2026-10-31-week8.raw.txt`) | Rebuild after YouTube + Grok ingest so packets carry them | C | before dispatch |
| 0.5 | **Per-game sides syntheses** (13 sessions, `agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md`; sim + fair line + Pitch/Pushback inputs) | `reports/intel/` per-game outputs | ❌ **not run for Week 8** (Fri card used a baseline model only) | Dispatch 13 game sessions; every run completes, gate issues noted only | C | Sat (after 4.5, 4.10) |
| 0.6 | Props synthesis queue | `scratch/w08-game-synthesis-queue-props.json` | ⚠️ built, but BEO props thin on 8 games | Rebuild after Sat BEO capture | C | Sat PM |
| 0.7 | **Per-game props syntheses** (13 sessions) | per-game outputs | ❌ not run | Dispatch after 0.6 rebuild | C | Sat PM |
| 0.8 | Quantitative layer (fair lines, margin simulator) | `reports/intel/w08-model/` | ✅ baseline (no injury adj.) | Rerun on Sat lines; syntheses supply injury/judgment adjustments | C | Sat PM |
| 0.9 | Synthesis digest (roll-up of 0.5 + 0.7) | `scratch/w08-synthesis-digest-sat.md` | ⚠️ Friday baseline version | Rewrite from per-game syntheses | C | Sat PM |
| 0.10 | Game narratives (13) | `reports/intel/master-intel-narratives-2026-w08.md` | ⚠️ Friday draft (baseline model) | Rewrite from per-game syntheses + news flags (2.6) | C | Sat PM |
| 0.11 | Card: Platinum Rose recs (Pitch/Pushback), Leans, parlays, prop stacks | `reports/bets/2026-w08-card.md`, `reports/intel/master-pitches-2026-w08.json` | ⚠️ Friday baseline (MIN +3.5 only) | Re-derive from 0.5/0.7 + 0.8 | C | Sat PM |
| 0.12 | SuperContest pitches (AI five) → SC Intel report → Andy & Amanda lock five | `reports/intel/supercontest-pitches-2026-w08.json` | ✅ Fri; refresh from 0.5 | SC report precedes the official five; the five is NOT a prerequisite for either report | C → A | Sat PM |

## 1. Lines and markets (the card is priced off these)
| # | Source | File / location | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 1.1 | Bookmaker SGP + game lines (13 games) | `data/generated/props/bookmaker-live-2026-10-31-week8.json` + per-game | ✅ 6:52 PM Fri, unparsed=0 unknown=0 | Recapture Sat night (same browser flow) so build `--date` reflects final numbers | C | Sat PM |
| 1.2 | Action Network consensus lines + splits | `reports/engineering/week8-an-browser-pull-2026-10-31/raw.json` → `w08-pull.json` splits | ✅ 7:06 PM Fri, 14 games | Re-pull Sat night and Sun AM (Chrome, no download needed) | C | Sat PM + Sun AM |
| 1.3 | Action Network openers (line-move baseline) | `data/odds/actionnetwork-openers-2026-w08.json` | ✅ Fri 3:49 PM | None — openers are fixed for the week | — | — |
| 1.4 | BetOnline game lines | `data/odds/betonline-mainlines-2026-w08-2026-10-31.json` | ✅ 7:43 PM Fri (main lines only) | Comes with 1.5 rerun | C+A | Sat PM |
| 1.5 | BetOnline player props | `npm run props:bol:cron` → `data/generated/props/betonline-live-*` | 🔄 scraper works; BEO has not posted Sunday player props yet (8:07/8:14 PM runs: 13 games, lines + TD-scorer only, 370 rows < 500 gate). Thu's 522 rows were mostly the TNF game | Rerun Sat afternoon (last week's Sat 2:15 PM run passed with full boards); the scheduled run around that time should catch it | C+A | Sat PM |
| 1.6 | DraftKings Predictions | DKP cron → `data/generated/props/dk-predictions-*` | ❌ cron logged out since Oct 28 | Manual assist: `npm run props:dkp:launch` → log in → `npm run props:dkp:cron` (+ `npm run props:dkp:defense`). There is no `futures:dkp` script. Chrome extension blocks DK domains | A + C | Sat PM |
| 1.7 | Prediction markets (Kalshi/Polymarket) + coherence | `data/prediction-markets/latest.json` | ✅ Fri 3 PM cadence, 4,141 contracts | Picked up by the Sat cadence | C | Sat PM |
| 1.8 | SuperContest lines | `data/supercontest/live-market-comparison.json` | ✅ 14 games compared | None (SC lines are locked Wed) | — | — |
| 1.9 | Line-move triggers | MIN @ DET only rec | ⚠️ MIN +3.5 now −118 (AN) / −120 (BEO); BKR moved to +3 | Re-run `reports/intel/w08-model/fair_lines.py` on Sat lines; re-decide MIN if +3.5 disappears or a QB changes | C | Sat PM |

## 2. Rosters, injuries, starters (stale injuries = wrong report)
| # | Source | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 2.1 | ESPN full 2026 rosters | `data/nfl-rosters/espn-full-rosters-latest.json` | ✅ Fri 1:44 PM, 2,558 players | build.py refetches (`--fetch --strict`) | C | each build |
| 2.2 | Roster gate | `data/generated/master-intel/w08-roster-vet.json` | ✅ PASS, 0 blocking | Re-runs inside build.py; BLOCK = fix source names, never `--allow-roster-issues` without Andy | C | each build |
| 2.3 | Player availability (injury report) | `data/player-availability/latest.json` | ✅ Fri ~4 PM, 1,158 events | Refresh Sat after final reports; known misclassification bugs → spot-check card players by live search | C | Sat PM + Sun AM |
| 2.4 | Projected starters | `data/projected-starters/2026/projected-starters-2026-10-30.json` | ✅ Fri | Refresh Sat | C | Sat PM |
| 2.5 | Inactives | live (team sites / news) | 🔄 not yet available | Check at ~9:30 AM PT Sun before pools and parlays | C+A | Sun AM |
| 2.6 | News flags to resolve | — | ⚠️ open | **Quenton Nelson** traded IND→SEA (Oct 27) — not in IND@JAX / CHI@SEA narratives. **Lamar Jackson** (ankle) expected to play per Rapoport Oct 28 — confirm final status. **RJ Harvey** props pulled at BKR — check status. **DeForest Buckner** trade report unverified | C | Sat PM |

## 3. Stats and analytics
| # | Source | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 3.1 | ESPN box scores | `data/fantasy/boxscores/` | ✅ 109 of ~112 files | Confirm the 3 gaps are byes/TNF-in-progress, not missing games | C | Sat PM |
| 3.2 | Usage trends (season) | `data/generated/player-usage-trends-2026.json` | ⚠️ flagged STALE (82h) but runs through Wk 7 = correct for Wk 8 | No action; age flag is expected mid-week | — | — |
| 3.3 | Team power / DVOA (SRS for fair lines) | `data/generated/team-profiles/team-power-ratings-2026.json` | ✅ through Wk 7 | None | — | — |
| 3.4 | FTN Stats IQ | weekly | ✅ Oct 28, through Wk 7 incl. MNF | None (weekly-only; no mid-week refresh) | — | — |
| 3.5 | Secondary matchups | `data/secondary-matchups/latest.json` | ✅ Wk 8 | Rebuild seeds only if roster gate flags them | C | if needed |
| 3.6 | Alpha packet | `data/alpha/alpha-packet-2026.json` | ✅ Fri | Sat cadence | C | Sat PM |
| 3.7 | Team dossiers | see 0.2 | ✅ slate confirmed | — | — | — |
| 3.8 | Fair-line model | `reports/intel/w08-model/fair-lines-w08.json` | ⚠️ baseline ignores injuries; no per-game deep syntheses | Re-run on Sat lines; note the method caveat in the report | C | Sat PM |
| 3.9 | Defensive prop boards (tackles/sacks) | `data/defensive-props/boards/defensive-boards-week-08.json` | ✅ Fri 11:43 AM | Re-run DK defensive after DKP login (1.6) | C+A | Sat PM |

## 4. Expert, media and article intel
| # | Source | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 4.1 | Article notes / research signals (Supabase pull) | `data/generated/master-intel/w08-pull.json` | ✅ pulled Fri 3:34 PM; 214 signals, 94 expert picks | Re-run `node scripts/master-intel/pull.mjs --week 8` Sat night (read-only) | C | Sat PM |
| 4.2 | Feed health | same file | ⚠️ Action Network RSS "not parseable" (1 failure); others OK | Covered by Chrome pulls (1.2); recheck in Sat pull | C | Sat PM |
| 4.3 | BettingPros articles | `reports/intel/bettingpros-articles-2026-w08.md` | ✅ 7:55 PM Fri (Maher, Radowitz, Krebs) | Re-check Maher's column Sat (parlays "coming soon") | C | Sat PM |
| 4.4 | Expert picks section (all picks, best bets marked; per-expert narratives) | built from pull + narratives | ⚠️ `reports/intel/expert-narratives-2026-w08.md` missing | Write per-expert narrative summaries (Andy's Oct 23 ask); verify every expert/article against the actual matchup | C | Sat PM |
| 4.5 | YouTube / podcast picks (Gemini) | `data/podcasts/youtube-extracted-picks-2026-w08.json` | 🔄 **approved (Andy 8:49 PM)**; discovery found 14 Week 8 betting episodes | Andy's terminal runs extraction (1–8 min/episode); Claude cleans → picks file; merge with 4.6 | A + C | tonight / Sat AM |
| 4.6 | Podcast transcripts (audio pipeline) | pull: 14 processed | ✅ processed, 0 promoted | Merge with 4.5 — same pick from the same show counts once | C | Sat PM |
| 4.7 | Twitter bookmarks | scheduled sync → Supabase signals | ✅ ingesting through Fri | Thread content comes via Grok (4.10) | — | — |
| 4.8 | Expert dossiers / host citations | `data/expert-dossiers/`, `data/generated/host-citations-latest.json` | ✅ rebuilt Fri (inputs unchanged) | None | — | — |
| 4.10 | **Grok thread extraction (every week)** | prompt `data/research-intel/grok-thread-prompt-latest.md` (30 Week 8 threads) → CSV `data/vault-seed/manual/grok-week08-threads/grok-twitter-picks-2026-10-30.csv` → `node scripts/load-external-intel-picks.mjs --dry-run` then `--replace` | ⚠️ prompt ready, not run | Paste prompt into Grok, save CSV; Claude ingests (Supabase write) | A + C | tonight / Sat AM |
| 4.9 | Coaching staff + trends | repo data file | ✅ in place since Wk 5 | Confirm no coordinator changes this week | C | Sat PM |

## 5. Weather and venue
| # | Source | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 5.1 | Forecasts | `data/research-intel/review/2026-w08-weather-venue.json` | ✅ Fri 6 PM — NE@MIA 80% rain, ~20 mph wind; ATL@TB 45% rain | Refresh Sun AM (built-in browser workaround; APIs blocked from the shell) | C | Sun AM |

## 6. Pools, SuperContest, survivor
| # | Item | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 6.1 | SuperContest pitches (AI five) | `reports/intel/supercontest-pitches-2026-w08.json` | ✅ Fri | None until lock | — | — |
| 6.2 | SuperContest official five | `data/supercontest/locked-card-week-8.json` | 🔄 after the SC Intel report | Not a prerequisite for either report. After lock: write file, rebuild SC report, gate PASS | A → C | after SC report |
| 6.3 | SC standings | `data/supercontest/standings-week-08-2026-10-29.md` | ✅ through Wk 7 | None | — | — |
| 6.4 | Pool picks (BUK BUK straight-up, Confidence) | `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md` | ✅ proposal | Fold in Radowitz confidence order + inactives; finalize Sun AM | C | Sun AM |
| 6.5 | Survivor intel | `data/survivor/pick-intel-2026-w08.json` | ✅ (research/history only) | None | — | — |

## 7. Bankroll, tickets, futures
| # | Item | File | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 7.1 | Live weekend tickets (2 BKR parlays) + hedge tables | `reports/bets/2026-w08-card.md` | ✅ on card with WSH SNF-cap hedge tables | Hedge Watch Sunday | C | Sun |
| 7.2 | Futures portfolio ledger | `data/futures-imports/andy-portfolio-ledger-2026.json` | ✅ updated tonight (+$17.01 free money) — preflight's 219h flag reads the `as_of` field | Bump `as_of` when positions are re-reconciled | C+A | when reconciled |
| 7.3 | BetOnline futures board | `data/futures-imports/betonline-2026-10-30.json` (144 rows) | ✅ Fri 8:21 PM capture; **Supabase backfill applied 8:33 PM** (Andy OK): 10-20, 10-21, 10-27, 10-30 now persisted; 39/40 files reconciled | Exactas: BEO posts Tue–Thu and can vanish before Thu AM — strike when posted | — | — |
| 7.4 | Bookmaker futures board | `data/futures-imports/bookmaker-2026-10-07.json` | ⚠️ 23 days old | Capture only if futures are being shopped this weekend | A | optional |
| 7.5 | Promotions | `data/sportsbooks/promotions-2026.json` | ✅ Wed | Add FDP / Pick 6 bonus status if relevant | C | Sat |
| 7.6 | DK Pick 6 bonus conversion | `handoffs/2026-10-30-2010-claude-pick6-bonus-conversion.md` | 🔄 split to separate session | — | separate session | — |

## 9. Deliverables that depend on this data (added 8:40 PM so nothing falls through)
| # | Item | Source / file | Status now | Action | Owner | When |
|---|---|---|---|---|---|---|
| 9.1 | Platinum Rose recs with Pitch / Pushback; "Leans: not elevated" section | `reports/bets/2026-w08-card.md`, `reports/intel/master-pitches-2026-w08.json` | ✅ Fri build (1 rec: MIN +3.5) | Re-decide after fair-line rerun (1.9) | C | Sat PM |
| 9.2 | 7e Anytime TD 7-leg + 8a First TD parlay recs (always included) | BKR TD boards (1.1) | ✅ TD boards captured for all 13 games | Rebuild on Sat capture; roster + inactive check | C | Sat PM |
| 9.3 | Player-prop stacks, one leg per game (Prop Stack Agent; BEO cross-game) | `agents/dev/PROP_STACK_AGENT.md`; needs BEO props (1.5) + defensive boards (3.9) | ⚠️ blocked until BEO posts Sunday props | Build after Sat BEO capture | C | Sat PM |
| 9.4 | Weekend parlays (morning / afternoon templates, SNF ML cap last-resolving) | `reports/bets/2026-w08-weekend-parlay-proposal-2026-10-29.md` | ✅ proposal; 2 BKR parlays live | Refresh legs on Sat lines | C | Sat PM |
| 9.5 | Island games: SNF PHI@WAS, MNF CHI@SEA prop parlays (3-tier template) | island template; BKR/BEO boards | ❌ not started for Wk 8 Sun/Mon | Build Sun (SNF) / Mon (MNF) | C | Sun / Mon |
| 9.6 | Client edition of Master Intel + SC report | Week 7 editions are the starting template (Andy 8:49 PM) | ✅ decided | Build Week 8 client editions from the Week 7 format | C | Sat PM |
| 9.7 | SuperContest Intelligence report | `dist/.../nfl_week8_supercontest_intelligence_summary.*` | ✅ Fri build; spread-only format locked | Rebuild + gate PASS after official five (6.2) | C | on lock |
| 9.8 | FDP promo daily qualifiers + bonus stacks | `reports/bets/2026-w08-fdp-promo-plan.md` | 🔄 Day 1 placed; Day 2 Sat midday; Day 3 Sun before 10 AM | Re-price each day before placing | C+A | Sat / Sun AM |
| 9.9 | Hedge Watch (tracker banner) for tickets down to last leg | mobile Live Tracker | 🔄 Sunday | Check before each kickoff window + SNF halftime | C | Sun |
| 9.10 | Grok thread research | see 4.10 | ✅ every week from now on | — | — | — |
| 9.11 | Kalshi positions (DET SB) | separate from sportsbook ledger | ➖ not used by weekly report | None | — | — |
| 9.12 | Weekly settlement + end-of-week betting analysis | wagers file, bankroll, recommendation ledger | 🔄 after MNF | Settle all tickets; paper recs to the recommendation ledger only | C | Tue |

## 8. Build gates (in order, Saturday night)
1. Preflight → no unexplained STALE rows (expected: usage trends, futures `as_of`, Week 8 BEO tackle boards ➖).
2. Lines recapture (1.1, 1.2, 1.5) → `--date` = new BKR capture date.
3. Injury / roster refresh (2.3, 2.4) → resolve all 2.6 news flags.
4. Re-run fair lines (1.9, 3.8) → re-decide MIN +3.5 and the Leans list.
5. Rewrite narratives for any game whose line / QB / injury changed (incl. Nelson trade games).
6. Expert section: pull refresh (4.1), expert narratives (4.4), YouTube only with OK (4.5).
7. `python3 scripts/master-intel/build.py --week 8 --date <capture date>` — roster gate must PASS.
8. PDF export in the cloud container → commit the pdf back.
9. QA (runbook §6). SuperContest gate PASS before any SC send.
10. Publish / Drive archive / client send / git push — **each only with Andy's OK**.
