# NFL_Dashboard handoff, Mon 2026-10-19 ~17:40 PT: MNF tickets logged, W6 wrap-up and W7 intel next

HEAD = 3b604b2 on claude/w5-prop-cards-2026-10-11 (pushed to origin). Previous HEAD e6ebfcb.
Repo access only via mcp__remote-devices__device_bash ($HOME/mnt/dev/projects/NFL_Dashboard). Keep the dirty checkout untouched: no git add -A, no full git status, git commit --only, mv stale .git/*.lock aside (done at 17:35; HEAD.lock and next-index-19.lock moved to stale-*-20261019-1735).
Dirty state still present and NOT ours: staged deletions of betonline-w6-baseline-2026-10-13_2315PT.pregate.raw.txt, bookmaker-live-2026-10-14-week6.json/.raw.txt; modified week5 prop capture files. Leave alone.

## What was committed (3b604b2, 7 files)
- data/official-picks/user-placed-wagers-2026.json (now 202 records)
- public/live-tracker-sunday.html, docs/tracked-wagers/live-tracker-sunday.html (regenerated, week 6)
- data/odds/BKR_current_lines_1019_1204_buildfmt (+ .provenance.md): BKR game lines board Oct 19-26
- data/research-intel/source-evidence/2026-10-19-bkr-sgp-live-week6.raw.txt and 2026-10-19-bookmaker-week6-sgp-parsed.json
data/generated/props/ is gitignored for new files, so tonight's BKR/BEO/DKP prop captures live on disk only (bookmaker-live-2026-10-19-*.json, draftkings-predictions-feed-2026-10-19-*.json, betonline-live-2026-10-19-week6.pregate.raw.txt). Backups of the wagers file before each entry are in scratch/ (user-placed-wagers-2026.pre-*.bak).

## MNF WAS @ SF (Mon 10/19 5:15 PM PT) live tickets, all PENDING
| Ticket | Book | Stake | To win |
|---|---|---|---|
| 740279274 teaser (SF -1.5 teased) | BKR | $30.00 | $70.50 |
| 740416960 SuperContest (SF -7 -123, 5-team) | BKR | $25.00 | $543.13 |
| bet_20261019_dkp_6pick_combo_was_sf (Daniels ATD, Kittle ATD, Okonkwo 3+ rec, McLaurin 4+ rec, Williams 2+ rec, Kittle 60+ yds) | DK Predictions | $10.37 | $448.63 |
| bet_20261019_dkp_6pick_combo_was_sf_cmc_sf_ml (Williams 20+ rec yds, McCaffrey 60+ rush, McCaffrey ATD, Daniels 30+ rush, Kittle 5+ rec, SF ML; +30% boost) | DK Predictions | $9.99 | $148.21 |
| bet_20261019_beo_8leg_mnf_was_sf_17900 (Evans ATD, Daniels INT, Styles 7+ T+A, McCaffrey 54+ rush, McLaurin 51+ rec yds, Williams 22+ rec yds, Okonkwo 3+ rec, Diggs ATD; +17900) | BEO | $10.17 | $1,820.43 |
| bet_20261019_dkp_6pick_combo_was_sf_final_boost25 (McLaurin 40+ rec yds, Okonkwo 3+, Daniels 20+ rush, McCaffrey ATD, Kittle 40+ yds, Williams 2+ rec; +25% boost) | DK Predictions | $9.94 | $83.83 |
| 1007037537 SGP 6-leg (McCaffrey ATD, Purdy 225+ pass yds, Daniels ATD, Daniels INT, Pineiro 2+ FG, McLaurin 40+ rec yds; BEO Primetime Parlay Insurance, 6-7 legs refund up to 2 losing legs) | BEO | $10.00 | $280.00 |
| 740512242 Flex SGP 6-team cross-week (WAS +7.5 / Under 52 SGP; Bears / Over 50.5 SGP; KC +3.5 -158; MIN ML -248) | BKR | $15.00 | $353.39 |
Mike Evans is on SF (not WAS). WSH @ SF is the game string used in the file; team codes WAS and SF.
Cross-week ticket 740512242: legs 1-2 grade tonight, legs 3-6 are Week 7 (NE @ CHI Thu 10/22, KC @ SEA and IND @ MIN Sun 10/25). Filed under week 6. Leg 3 "Chicago Bears" had no line on the pasted slip: logged as ML (sgp_moneyline), flagged in needs_confirmation. Ask Andy to confirm ML vs spread.
All prop tickets were placed after inactives (Diggs and Evans active; SF out Deebo Samuel, Nick Bosa; WAS out Mariota and others). Wind forecast was not confirmed.

## Open items for the next session
1. After MNF ends: grade the MNF tickets from ESPN final box scores, settle per the wager-leg rules, run `node scripts/check-wager-legs.mjs --week 6` then `node scripts/generate-live-tracker.mjs --week 6`.
2. BEO 1007037537 insurance: if it loses on 1-2 legs, expect a $10 cash refund (settled payout $10, profit $0). Confirm BEO paid it.
3. Unlogged DK 5 Pick Combo 41516472 (lost, -$24.06) still needs Andy's go-ahead to log. Week 6 non-MNF close was +$1,216.95 logged (+$1,192.89 with the DK 5-pick).
4. Confirm leg 3 on 740512242 (Bears ML vs spread) and its funding_type.
5. Week 6 wrap-up: final W6 P&L including the MNF tickets, SuperContest standing, teaser result, CLV and a short postmortem.
6. Week 7 analytic data collection: BKR/BEO/DKP prop and game-line captures once boards post, injury and inactives sourcing by live search (not the repo availability file), rosters via data/nfl-rosters/espn-full-rosters-latest.json, W7 intel gathering per the W6 pattern. Do not spend TheOddsAPI, Gemini, AssemblyAI or OpenAI.

## Learned this session
- BKR SGP builder blocks a QB's completions with his own receivers' receptions; same-market two-line legs also rejected.
- BEO builder haircut was driven mostly by same-player pairs (Okonkwo ATD + Okonkwo 3+ rec): swapping dropped the haircut from 34.6% to about -5%.
- DK Predictions combos price close to the product of the legs (about 10% haircut at most) and take a profit boost on profit only (boosted payout = stake + 1.25 x profit).
- Naive price = product of leg decimals; no-vig factor 0.9634 per leg for hit probability.
- Side quest: Parakeet transcription evaluation prompt delivered (project doc claude/parakeet-transcription-evaluation-2026-10-19.md).
- Dkp capture command: `node scripts/props/dkp-event-feed-capture.mjs --game WAS@SF --keep-raw` (CDP port 9224).
