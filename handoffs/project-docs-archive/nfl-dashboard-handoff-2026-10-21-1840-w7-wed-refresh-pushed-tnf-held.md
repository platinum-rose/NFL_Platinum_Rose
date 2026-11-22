# NFL Dashboard handoff, Wed 2026-10-21 6:40 PM PT: W7 Wednesday refresh pushed, TNF draft HELD

Repo `E:\dev\projects\NFL_Dashboard` (bridge: `$HOME/mnt/dev/projects/NFL_Dashboard`), branch `claude/w5-prop-cards-2026-10-11`. **Origin = aecd94b** (all pushed: 3d58678 and aecd94b on top of 6d62b76).

## Guardrails (standing)
No Gemini/AssemblyAI/OpenAI/TheOddsAPI spend. Never touch `data/official-picks/` or ledger files. Never `git add -A` / full `git status`. Commit/push only when Andy says so, path-limited (`git add -- paths` then `git commit --only -F msgfile -- paths`; move leftover `.git/*.lock` to `.git/stale-*`; the Windows mount is slow, use `timeout`). Commit trailers: Co-Authored-By Claude Sonnet 5.5 + Claude-Session link. Statistical context only. Do not circumvent robots.txt (Action Network disallowed). Andy is on Pacific time; **TNF NE @ CHI is Thu 10/22, 5:15 PM PT (00:15Z)**.

## State
- W6 closed: 70-66 leg record (sides 16-4, totals 8-5); W6 cash net +1,178.83 on $1,006.91; season through W6 -530.30 on $3,118.65. Ticket 740512242 retagged to W7.
- Pushed this session: 6d62b76 (wagers ledger fixes), 3d58678 (article-intel parser fix + dispositions, TNF working notes, W6 closeout docs, Chig alias), aecd94b (W7 Wednesday refresh: 32 dossiers, availability, Bookmaker/DKP captures, W7 weather/venue).
- Wed refresh chain run at 10/21 ~6:20 PM PT: roster:fetch, ESPN status, player-availability:live, impact-digest, roster:vet (PASS, 0 blocking), dossier build + validate (0 errors, 0 warnings).
- Article intel review: 0 unresolved.

## TNF NE @ CHI facts (ESPN as of 10/21 6:21 PM PT, forecast not observation)
- Lines: Bookmaker CHI -3 (-103), total 50.5, ML CHI -153 / NE +138; BetOnline CHI -3 (-110), 50.5; DK consensus CHI -2.5 / 51.5 (pre-fee probabilities, not executable).
- NE Out: Carlton Davis III, Channing Canada, Karon Prunty (3 CBs), Ben Brown (C), Vera-Tucker (G). IR: Bryant (OT), Doubs. Questionable: Elliss, Byard, Woodson, Moses. OL tag = cluster. A.J. Brown and Webb no longer on the report (verify they were cleared).
- CHI Out: Monangai (RB), Sanborn (LB). Doubtful: T.J. Edwards. Questionable: Stevenson. IR: Odeyingbo, A. Johnson Jr. Sweat flagged suspension.
- QBs: Maye (NE), C. Williams (CHI), both `ok`, no operator confirmation on file yet.
- Weather Soldier Field ~56F, 0% precip, wind 5 km/h, no flag.
- Podcast leads (unverified): Sharp or Square and Even Money lean Bears (Even Money Bears -3 at -102); BettingPros "walking wounded" Patriots; Move the Sticks / Even Money stat claims checked vs nflverse OK.
- Working notes: `claude/w07-tnf-ne-chi-working-notes-2026-10-21.md`.

## Data coverage findings
- Analytics (standings, nflverse efficiency, regression, power) current through W6 for all 32. Secondary-matchup is W7.
- FTN: CAR/CIN/DET/KC/MIA/MIN show `stale_1wk` but that is a builder false flag (GP compares to calendar week, not games played). They had byes (CIN/DET/MIA/MIN W6; CAR/KC W5), so 5 GP is correct. No re-pull needed. Optional fix in `build-team-dossiers.mjs`.
- Coaching snapshot is historical context only (14 fields null: FTN charting join failed). Do not use for W7 claims.
- W7 weather/venue file: `data/research-intel/review/2026-w07-weather-venue.json`. Only flag: PIT vs NO at Stade de France (Paris), gusts 47.9 km/h. Retractable roofs needing confirmation: SF@ATL, NYG@HOU, DEN@ARI. Fixed domes: IND@MIN, GB@DET, LAR@LV.
- QB flags AMBIGUOUS (Questionable): BAL Lamar Jackson, GB Jordan Love, TB Baker Mayfield. Need Andy's confirmations in `data/research-intel/operator-confirmed-starters-2026-w07.json` (file does not exist yet).

## Open items / next steps
1. **Thursday morning (late)**: rerun the refresh chain: `npm run roster:fetch`; `python scripts/intel/fetch-espn-status.py --out data/research-intel/source-evidence/espn-status-w07.json`; `npm run player-availability:live`; `npm run availability:impact-digest`; `npm run roster:vet -- --week 7 --date 2026-10-22`; `node scripts/build-team-dossiers.mjs --week=7`; `node scripts/validate-team-dossiers.mjs --tag=2026-w07`. Final inactives ~90 min before kickoff (about 3:45 PM PT).
2. Andy runs on his machine (CDP captures): `npm run bolp` (BetOnline, gate needs 500+ rows and all 14 games, Wed was 368 because only TNF-depth markets were posted), `bkrp` (Bookmaker; GB @ DET board closed Wed), `dkp` (DK Predictions; MIA @ NYJ TD board missing Wed), `futures:bol`. Bookmaker futures board is stale (10/13). Also `expert:registry`; then I review NE/CHI counts.
3. Rebuild the weekly pull and alpha packet Thu/Fri (not committed yet).
4. **TNF draft: HOLD** until Andy says all expert, data and analytics reports are verified (Thursday).
5. Needed from Andy: W7 QB confirmations; whether A.J. Brown / Webb are cleared; roof confirmations Sunday morning.

## Left uncommitted on purpose
Other-session leftovers (many staged deletions of W6 files in the index, modified W5 files, `roster-map-latest.json`, `player-props-intel-latest.json`, alpha packet, validator output under `reports/analysis/season/claude/out/`, pregate raw dumps). Do not sweep them in; commit by explicit path only.

## Optional, not requested
`|| 50` fallback patch in `src/lib/predictionMarkets.js`; Bookmaker quarter/half team-total parser entry; turn `scratch/_parser_regress.mjs` into a real test; fix FTN stale flag in the dossier builder; unexplained availability event count drift (1,244 to 947 to 948 to 1,118 source events).
