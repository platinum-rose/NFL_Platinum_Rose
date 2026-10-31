# H2C2 detailed briefing — Week 8 Master Intel + SuperContest + weekend ops → Claude team 2 (Fri Oct 30, 2026, ~6:15 PM PT)

Start with `reports/handoff-snapshots/2026-10-30-h2c2-week8-master-intel-claude2/H2C2_START_HERE.md`. Load only the section for your lane.

## 0. Verified state at handoff
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Commits this session on top of `402f68b`: `a8f6411` (Week 8 Master/SC build inputs), `8c0734d` (SC standings through Week 7), plus the H2C2 commit containing this file. **Not pushed** (Andy pushes). Live Git beats this file.
- Dirty tree: scheduled-job outputs (Thu PM → Fri), Codex's uncommitted atomic-write repairs (`scripts/build-player-availability.js`, `scripts/sync-live-market-lines.mjs`, `tests/unit/cadenceFileWrites.test.js`), and this session's regenerated `data/expert-dossiers/*`, `docs/antigravity/expert-dossiers/*`, `data/generated/host-citations-latest.json` (rebuilt on unchanged inputs; timestamps only — do not commit unless the content diff is real). Preserve; stage by explicit path only.
- Git locks: the device shell cannot delete files, so git leaves 0-byte `*.lock` files. This session renamed them to `.git/stale-claude-*` (incl. ref locks under `refs/heads/*`, `refs/remotes/origin/*` created by a `git fetch`). After any git command from the device shell, run `find .git -maxdepth 4 -name "*.lock" -size 0 -newermt <now>` and rename them directly under `.git`. Avoid `git fetch` from the device shell (it creates ~12 ref locks). Andy can delete the stale files.

## 1. Environment facts (new this session)
- **build.py needs Python 3.12+.** Device system python is 3.10. A uv venv exists: `export PATH=$HOME/pyenv312/bin:$PATH` (bs4, python-docx installed).
- **Node 22 ignores the proxy** → `pull.mjs` "fetch failed". Prefix `NODE_USE_ENV_PROXY=1`.
- **Blocked from the device shell and the cloud container:** api.actionnetwork.com, api.open-meteo.com, api.weather.gov. Workaround used: the Claude built-in browser (`mcp__remote-devices__Claude_Browser__*`) on the site's origin, JS `fetch`, return compact JSON, write to disk. Raw: `reports/engineering/week8-an-browser-pull-2026-10-30/raw.json`.
- Claude in Chrome was **not connected** all session → no Bookmaker recapture.
- PDF export: device has no Playwright/Chromium; stage the html, run `scripts/master-intel/export_pdf.py` in the cloud container, commit the pdf back.

## 2. Lane A — Master Intel (client report)
**State:** Friday build done. `dist/nfl_week8_master_packet/` (gitignored): master md/html/docx/json/pdf, `site/` (29 pages), `Platinum_Rose_NFL_Week8_Intel.html`. Roster gate PASS. Known gaps: no cleaned YouTube digest; no `reports/intel/expert-narratives-2026-w08.md`.
**Inputs written:** `scratch/w08-synthesis-digest-sat.md` (Friday digest under the Sat filename), `reports/bets/2026-w08-card.md`, `reports/intel/master-intel-narratives-2026-w08.md` (13 games; NE@MIA and ATL@TB weather added 6 PM), `reports/intel/master-pitches-2026-w08.json`, `data/survivor/pick-intel-2026-w08.json`, `reports/intel/w08-model/{fair_lines.py,fair-lines-w08.json}`, `data/odds/actionnetwork-openers-2026-w08.json`.
**Method caveat:** no per-game deep syntheses. Fair = AN consensus moved 35% toward SRS+1.5 HFA (`team-power-ratings-2026.json`, through Wk7); total moved 35% toward PF/PA; `margin-simulator.mjs` cover %. Baseline ignores injuries.
**Card:** one Platinum Rose rec — **MIN +3.5** (fair DET -0.4, sim 58.1%, Sharp or Square). Leans: CIN -12.5, LAR -6.5, PHI +6, CHI +3, BAL +3, KC/DEN U40.5, ATL/TB U43.5, CLE +3.5, MIA +7. Big-money flags: BAL +3, BAL/BUF Over, ARI ML, ATL/TB Under, ATL ML, PHI ML, CHI ML. Both live BKR weekend parlays are on the card with WSH SNF-cap hedge tables.
**Next (Saturday night per runbook):** (1) Andy connects Claude in Chrome → BKR SGP capture (runbook §2) → parse → `--date` = new capture date; (2) BEO/DK saves if Andy provides; (3) refresh AN splits/current line via built-in browser into `w08-pull.json` splits (code pattern in raw.json method note); (4) refresh weather Sunday morning; (5) rewrite any narrative whose line/QB/injury changed; rerun `fair_lines.py` if lines moved; (6) rebuild, PDF, QA §6; (7) summary ≤15 lines.
**Publication:** none done. Hosted client link (format doc §5): https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6 — republish and Drive archive (`Platinum Rose / Master Intel / 2026 / Week 08`) **only with Andy's OK**.

## 3. Lane B — SuperContest Intel
**State:** built; gate **FAIL (1)**: missing Week 8 post-mortem block, which appears once `data/supercontest/locked-card-week-8.json` exists (Andy & Amanda's official five; format = `locked-card-week-7.json`). Standings through Week 7 saved as `data/supercontest/standings-week-08-2026-10-29.md` (dated to the BKR capture so build.py reads it; header explains). If the Saturday rebuild uses `--date 2026-10-31`, it still finds it (≤ date).
**AI five:** CIN -10.5, JAX -9.5, MIN +3.5, DAL -6.5, BAL +3.5; alternates CHI +3, PHI +5.5, LAR -6.5. Pitches: `reports/intel/supercontest-pitches-2026-w08.json` (generated by `scratch/w08_write_pitches.py` — edit the script, rerun, rebuild).
**Standings read (Andy asked):** Amanda 15.5 (48th of 79), 14.5 behind Dan Boyce, 7 behind 5th-place 22.5; quarterly 7.5, 4.5 behind (quarter ends after Week 8). Week 7: Amanda 3/5 vs field avg 2.7; gained 5 places but lost 1 point to 5th and 2 to the leader.
**Next:** when Andy sends the locked five → write locked-card-week-8.json → rebuild → gate PASS → PDF.

## 4. Lane C — Weekend operations (Sunday/Monday)
**Friday Toolbox cadence (3:00 PM PT, exit 0, 7/7 steps)** — report `logs/cadence-reports/2026-w08-friday.md` (snapshot copy in the packet). Fantasy rosters last synced Wed 3:15 AM PT.
Act-on items from the report:
- RFI: Texans DEF on bye (HOU off Week 8); Chiefs, Rams, Patriots DEFs were available Wednesday.
- RFI: A.J. Brown Questionable (ankle/knee) → if ruled out, start Jordan Addison (MIN vs DET is the top secondary mismatch; Kerby Joseph OUT).
- Honey Badgers: Breece Hall Questionable (quad) → Braelon Allen is the bench swap; decide at inactives (LV@NYJ 10 AM PT).
- The League: kicker slot empty; Dicker, Butker, Myers were available Wednesday.
- Bench: RJ Harvey OUT (3 rosters), Wicks OUT, Waddle and Kincaid Q; Deebo and Montgomery on bye; Golden, Love, Kraft, Coker played TNF.
- CC Bowl league missing from the Alpha packet (4 of 5 leagues).
- Open tickets: both BKR weekend parlays alive, TNF legs won. Report's per-leg reads: WAS ML strong tailwind; NE ML/Stevenson TD (Henderson Q helps); LAC-LAR o43 supported; KC-DEN u42 and ATL-TB u46 supported; DAL ML (Pickens Q risk); BUF ML / BAL-BUF o53; IND-JAX u47.5 mixed.
- Prediction markets: Kalshi thin; KC ~60% vs ~54% book, DAL ~72% vs 67%; PHI division (8%) > playoff (5%) coherence violation.
- Props scan: only 2 (Maye o1.5 pass TD -115, Helm o15.5 rec yds -114), both apparently Week 7 article quotes — unconfirmed.

**Corrections to the Toolbox report (ESPN injuries API re-read ~6:05 PM PT Fri; ESPN beats the FantasyPros-driven lines):**
- **Saquon Barkley has NO designation** (hamstring/back; ESPN: "doesn't have an injury designation for Sunday's game at Washington"). The report's "Barkley Q" overstates the WAS ML tailwind.
- **Kyle Hamilton (BAL) has NO designation.** Only S Jaylinn Hawkins is OUT. The report's "BAL missing Hawkins and Hamilton" is wrong.
- **Sauce Gardner (IND) is not out** (practiced in full Thursday). Only CB Justin Walley is OUT.
- **Tyler Warren (IND)** is good to go; **Jeremiyah Love, Michael Wilson (ARI)** and **Tre' Harris (LAC)** have no designation.
**Other Sunday tasks:** pool entries (duma 3–9/11–16, Yahoo 1–14, CBS) after inactives — plan in `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md` (Friday 1 PM re-check); PHI hedge watch for the WSH cap; DK defensive rerun Saturday evening (`npm run props:dkp:defense`; first run returned no tackles); FanDuel Predicts promo on scheduled reminders (`reports/bets/2026-w08-fdp-promo-plan.md`); Monday 9:30 AM PT refresh for MNF/TNF stacks.

## 5. Lane D — Data freshness and missing sources (audit Fri ~6 PM PT)
Fresh: availability/starters/secondary/props-intel/prediction markets/alpha (Friday 3 PM cadence); ESPN rosters (1:44 PM); AN splits + openers (3:40 PM, browser); article notes in Supabase pull (latest 3:33 PM PT); expert picks (latest 8:19 AM PT); research signals (12:27 PM PT); `game_odds_snapshots` bucket 1 PM PT; FTN Stats IQ Week 8 context (Oct 28, through Week 7 incl. MNF); team power (Oct 28, through Week 7); usage trends through Week 7 (correct for Week 8).
Fixed this session: **team dossiers 2026-w08** built (`data/generated/team-dossiers/2026-w08`, 32 teams/14 matchups) from a Claude-drafted `w08-slate.json` (operator_confirmed **false** — Andy to confirm; cross-checked vs AN, BKR, SC sheet, schedule.json); **weather** `data/research-intel/review/2026-w08-weather-venue.json` (NE@MIA 80% rain, 32 km/h wind; ATL@TB 45% rain — review flags); expert dossiers/host citations rebuilt (inputs unchanged since Oct 14 / Jul 31, so no new content).
Still missing / needs Andy:
1. **Bookmaker props**: Thursday capture covers 7 of 13 games → Saturday capture via Claude in Chrome.
2. **DK Predictions cron is logged out**: `draftkings-predictions-live-2026-10-29/-30-week8.last-capture.raw.txt` show "Sign Up or Log In" and no parsed JSON since Oct 28 → Andy logs in to the DKP cron browser (`npm run props:dkp:launch`).
3. **BEO props**: last capture Thu 4:10 PM PT (522 rows).
4. **YouTube/podcast Week 8 picks**: none (no Gemini extraction; Supabase podcast_gemini 0). Sweep needs the OAuth token; extraction is paid (~$0.03/episode) → per-run OK.
5. **Expert narratives file** for Week 8 (hand-written; optional).
6. **Gemini billing check** fails (fetch failed; likely egress) — non-blocking.
7. Futures ledger (Oct 21) and BKR futures board (Oct 7) — not used by the weekly report; Andy-supplied.
8. `docs/Player_Prop_Odds_Weekly/Week8` does not exist (BEO tackle boards, optional).
9. Twitter bookmarks log last line Oct 15, though signals show ingests through today — check the log path if it matters.

## 6. Pending approvals (do not act without Andy's per-action OK)
Log the 5 FDP tickets (wagers file + ledger); OCR team-tag fix in Supabase `research_pick_signals` (Tuten/Javonte/DJ Moore); confirm `w08-slate.json`; any publication (artifact, Drive, client send); git push; paid YouTube extraction.

## 7. Guardrails
No wager, account action, Supabase write, paid call or publication without Andy's per-action OK. Strict roster gate before any player-named output. Stage by explicit path; never `git add -A`; no reset/clean/stash. Sportsbook pages are read-only.
