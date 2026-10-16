# Handoff: Week 6 intel gathering, Friday 2026-10-16 08:45 PT

Branch `claude/w5-prop-cards-2026-10-11`. Andy wants the Week 6 Master Intel Report finished **Friday night PT** (not Saturday). Everything below is local-only research; nothing is promoted, no Supabase writes, no paid synthesis run.

## Done this session
- **Lesson recorded**: `docs/BETTING_LESSONS_LEARNED.md` has "Week 6 TNF SEA@DEN (DEN 17, SEA 14 OT)". Rule: total below 41 and no weather means target defensive props; small offensive yardage/volume bars are fine; TDs carry an extreme premium, 1-2 anytime TD legs absolute maximum per parlay. Box-score numbers (ESPN 401872995) are in the doc and not yet checked against graded tickets.
- **Ledger**: old 9-team ticket 740212915 settled loss (-$15). New ticket `bet_20261015_bkr_740291356_9team_parlay_sunday` (PENDING, $15 at +8322, win $1,248.23) logged in `data/official-picks/user-placed-wagers-2026.json`. Legs: CAR ML -188, BUF ML -228, GB ML -118, CLE +5.5 -135, NE ML -344, CHI-ATL o49.5 -144, ARI +14 -129, HOU-JAX o40.5 -137, PIT-TB o37.5 -130.
- **Friday cadence** (`node scripts/toolbox.mjs --cadence friday`, 7:28 AM PT) plus my extras: ESPN status, roster fetch and gate (PASS, 0.0 h), availability layer, impact digest, 32 team dossiers (token warnings only SF, TB, TEN, WAS), Action Network openers, `data/generated/master-intel/w06-pull.json` (signals 132, notes 599, expert 21, splits 14, feeds 11, podcasts 8, gemini 0).
- **YouTube sweep** (`config/youtube-podcast-sources.local.json`, gitignored): 10 channels (TheProsBestBets, Ed Feng, Action Network, Warren Sharp, Ross Tucker, BettingPros, Sharp or Square, Sal Vetri, Evan Miyakawa, Joe Holka). Fantasy Football Today excluded. Sal Bets unverified, Harry Lock and Cody Brown have no harvestable YouTube channel.
- **Antigravity batches 3 and 3b** reviewed. YouTube blocks timedtext with HTTP 429 (IP-level), so Andy copies transcripts by hand into `data/shadow-harness/antigravity-staging/youtube-<id>.captions.txt` and I extract picks myself (no API cost).
- **Extracted (schema JSON, quotes verified verbatim, status extracted, NOT promoted)**:
  - `youtube-5AikVQLaJEg.json` Action Network all-games show (pre-Hurts research).
  - `youtube-tGNDVneDeEQ.json` Warren Sharp (7 picks, 25 notes): Bijan o89.5 rush yds best bet, Corum o9.5 rush att, McBride longest rec under, Freiermuth o3.5 rec, Browns +5, DAL@GB over, GB lean.
  - `youtube-C8cDtGmsRoc.json` Brandon's Playground props (34 picks, 24 notes).
- Builder scripts used for extraction were in `~/xtract` on the device (not in repo): `build.py` (caption parser, segment builder, quote-to-timestamp verifier), `run_warren.py`, `run_action.py`.

## Findings that matter for Andy's ticket 740291356
- PIT-TB over 37.5 is the shakiest leg: Brandon says low-scoring and windy, Sharp weather tool had 17 mph winds with 29 mph gusts (Wed), Brandon expects Daniels not Mayfield.
- HOU-JAX over 40.5: Brandon leans under 42.5 (slowest pace, windy London).
- ARI +14: Brandon is on Rams -12 (his number is -10.5).
- Supports: Gibbs on CLE +5.5; Warren and Brandon on a CHI-ATL shootout/Bijan.

## Open data gaps
- Still no fresh Bookmaker board for the 13 remaining games; the quant synthesis (`node scripts/build-w05-quantitative-synthesis.mjs --week 6`) is still anchored on the stale 10/14 BKR board. Andy to capture BKR plus BetOnline and DK Predictions Sunday props.
- Sunday player-prop prices: props intel has only 1 prop (Tuten rush 50+ -296 HOU@JAX).
- QBs: ESPN (Jackson Q, Williams Q, Mayfield D) vs FantasyPros (Jackson ~7% to play, Williams ~95%, Mayfield OUT). Hurts OUT on both; operator-confirmed file `data/research-intel/operator-confirmed-starters-2026-w06.json` has PHI McKee starting. Availability layer shows replaced starters as OK (add a QB-replaced flag).
- Transcripts not yet obtained: BettingPros `M77HPuZkC5Q` (Andy could not load it), Steelers-Bucs `ji7mGtqc9Ys`, `BlFH_PEwxhc`, `-aQZO-z-wkw`, `YwW6cqRBOao`.
- Weather refresh needs Andy's OK. GitHub Actions splits workflow stopped. Gemini audio-diarization failures and the Gemini credit drain still open. Optional: drop Ed Feng and TheProsBestBets (inactive) from the sweep.

## Plan for tonight
1. Andy captures BKR board (13 games) plus BetOnline and DK Predictions props; transcripts as he finds them.
2. After Friday final injury reports (~2-6 PM PT): rerun availability chain, secondary matchups, `build-player-props-intel.js`, alpha, `actionnetwork_openers.py --week 6`, `roster_vet.py --fetch --strict`.
3. Synthesis `--dry-run` (exclude SEA@DEN), real run only on Andy's explicit go.
4. ~6-10 PM: write 13 game narratives (`reports/intel/master-intel-narratives-2026-w06.md`, `data/survivor/pick-intel-2026-w06.json`), `build.py --week 6 --date <BKR capture date>`, `export_pdf.py`, QA, deliver inline.
5. Apply the TNF rule on Sunday cards: low-total candidates CAR@PHI ~38.5-39, BAL@CLE ~41, LAC@KC ~41.5; cap anytime TD legs at 1-2.

## Standing preferences
- Post every prompt, resume prompt, and generated text inline in chat in a copyable block, same reply that creates the file.
- Roster gate before any player-specific card; never judge teams or injuries from training knowledge.
- Supabase writes, paid synthesis, official-pick promotion, TheOddsAPI: need Andy's explicit go.
