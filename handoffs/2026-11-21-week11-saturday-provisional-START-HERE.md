# Week 11 Saturday finalization: PROVISIONAL (gate RED, 7 required failures)

Claude, Sat Nov 21 2026, ~12:00 pm PT. Shared checkout `E:/dev/projects/NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11` at HEAD 1e9f9732. Nothing was staged, committed or pushed. Unrelated dirty work was left untouched.

## Done

- Refreshed: availability and starters (Sat 11:08 am), Master Intel pull (articles through 11:33 am; Supabase splits 8:37 am, newer than the backup, so not restored), BetOnline (`betonline-live-2026-11-21-week11.json`, 1,436 rows, 11 games; no TB@DET or ARI@KC), weather/venue (`2026-w11-weather-venue.json`; MIN@SF is in Mexico City).
- Rebuilt both synthesis queues with `--date 2026-11-19`. Friday backups: `*.bak-claude-20261121-sat-prerebuild`.
- Saturday delta appended to all 12 sides and props write-ups and to the RUNLOG. Friday text is byte-identical; backups are `*.bak-claude-20261121-sat`.
- QB, injury and news evidence: `reports/intel/w11-qb-injury-news-check-2026-11-21.md`. Manual gate flags were **not** set; they need Andy's confirmation.
- Cody Brown media item processed: 15-leg FanDuel SGP+ graphic, 0 standalone picks.
- Strict roster vet `--date 2026-11-19 --fetch --strict`: PASS, 0 blocking.
- Public-source picks regenerated with `--date 2026-11-19 --stage saturday --as-of 2026-11-21T11:52:52-08:00` (27 conditional, 82 source-only). `build_site.py` rebuilt `Platinum_Rose_NFL_Week11_Intel.html`.
- Conditional-pick recheck: `reports/intel/w11-conditional-picks-recheck-2026-11-21.md`.
- `check_sc_report.py --week 11`: PASS on the unchanged Friday HTML.

## Blocking (gate RED)

L1 Bookmaker (Andy login), S2 props queue (follows L1), E8 X bookmarks (Andy's X account), E10 expert cards 20/37, and the three manual confirmations. The canonical build, PDF and publication are all withheld.

## Next

1. Andy logs into be.bookmaker.eu. Then run runbook §2 capture, the parser, and the L2 game-lines file.
2. Rebuild queues with the new date, then strict vet, then the gate.
3. Confirm QBs: TB Mayfield at inactives, ARI Beck. Confirm injuries and news.
4. Once green: `build.py`, `check_sc_report`, browser QA, `public_source_picks` with the new date, `build_site`.
5. Revisit SC AI picks NO +11.5 and WAS +6.5; both were downgraded Saturday.

## Update Sat 1:20 pm PT: lines refreshed

- Bookmaker was captured by `npm run props:bkr:cron` on the logged-in `.chrome-bkr` CDP Chrome (port 9222; "Browser 1" in Claude in Chrome). Output: `bookmaker-live-2026-11-21-week11.json`, 12 games, 2,548 rows, capturedAt 21:10:25Z, plus `bookmaker-gamelines-2026-11-21-week11.raw.txt`. The 444 unparsed rows are game-special sections (e.g. Team to Score First). TD-scorer markets were not posted yet. A balance reading was appended to `data/bankroll`.
- BetOnline was re-run at 1:16 pm: 13/13 games, 816 board rows plus 848 props-builder rows. TB@DET and ARI@KC now have game lines only.
- Queues were rebuilt with `--date 2026-11-21`. A Bookmaker recheck was appended to all 12 sides files, the props files and the RUNLOG.
- Gate: RED with 6 required failures. L1 and L2 now pass. Still failing: S2 (TB@DET and ARI@KC prop boards are thin at both books, a market-status issue), E8, E10, and the three manual confirmations.
- Use `--date 2026-11-21` for the build, the strict vet and `public_source_picks` once the gate is green.

## Update Sat 5:40 pm PT: gate RED on S2 only

- Manual items confirmed by Andy at 3:29 pm: injuries, news, and QB status with caveats. TB carries "Mayfield Questionable"; ARI carries "Josh Johnson preparing to start (Beck Q)". These tags go on every TB/ARI recommendation, especially props.
- E8: fresh local bookmark digest (3 passes). Four image posts from pass 3 are unread (Chrome disconnected); see `unread_items` in `data/intel/extracted/2026-w11-chrome-article-picks.json`.
- E10: cleared at 32/37 found plus 6 excused (`experts_no_card` in `w11-gate-manual.json`). The gate now also reads `reviewed-podcast-picks.json` and the bookmark digest (Andy OK; backup `final_gate_check.py.bak-claude-20261121-sat-e10`). GBERGFF alias added for Marc Gartenberg. **Prop Dealer is a TEMPORARY exception: he publishes Sunday morning. Re-check @thepropdealer, load his picks, and remove him from `experts_no_card`.**
- Projected starters: ARI QB1 is Josh Johnson (needs review); `qb-starters-2026-w11.json` added.
- Remaining blocker, S2: TB@DET and ARI@KC prop boards are thin at both Bookmaker and BetOnline. Recapture Sunday morning after QB news (`npm run props:bkr:cron` on the logged-in `.chrome-bkr` Chrome, port 9222; `npm run props:bol:cron`). Then rebuild queues (`--date` = new capture date), run the strict vet and the gate, and if green, do the canonical build plus QA.

## Status 6:27 PM PT - provisional Saturday build done (HTML only)

- Synthesis applied as approved: Platinum Rose pick NYJ +3 (-103); leans JAX -5.5, PIT -4, CIN -6, MIN@SF Under 46.5, NO@CHI Under 48; all else pass. SC five TB +7, TEN +8, NYJ +3.5, SF -3, MIA +16.5; alternates CAR -2.5, DEN -10.
- Inputs written: scratch/w11-synthesis-digest-sat.md, master-pitches (NYJ@LAC|Side), reports/bets/2026-w11-card.md, supercontest-pitches-2026-w11.json (7 entries, Friday copy in .bak-claude-20261121-sat-prebuild), master-intel-narratives (12 "Saturday update:" paragraphs, TICKETS/SUPERCONTEST/GAPS rewritten).
- Strict roster vet: PASS. Added non-player names Mayfield Questionable, Platinum Rose, Mexico City, Soldier Field (backup .bak-claude-20261121-sat).
- build.py edits (backups .bak-claude-20261121-sat-speaker / -sat-banner): guard for pick rows with speaker=None (crashed cite()); Saturday provisional banner in Slate Status driven by the saturday gate file (disappears when the gate is PASS).
- chrome-article-picks.json: added selection/url/outlet to the 9 Cody Brown rows (rendered as "Prop None"); ARI caveat folded into rationale.
- public_source_picks regenerated (saturday stage): 31 conditional, 83 source-only. Site rebuilt (28 pages).
- Browser QA (Browser 1, local server): both reports load, no overflow, no mojibake/None/TODO, IND@HOU final preserved, banner present, Mayfield caveat shown.
- STILL OPEN: check_sc_report FAILS on one item - missing Week 10 season review (#sc-week-review-10). data/supercontest/dashboard-ai-review-2026.json has Week 9 pending and no Week 10 row; Friday covered this with review_gap placeholders that only apply in Friday mode. Needs Andy's call: grade Weeks 9-10 into the review file, or extend the placeholder to Saturday.
- No PDF, no publication, no commits, no Supabase writes.

Sunday: after inactives recapture BKR/BOL, load Prop Dealer and drop his temporary no-card, read the 4 unread X images, rebuild queues, strict vet, gate; if green, final build + QA.

## Update 6:55 PM PT - SuperContest review resolved

- Graded Weeks 9-10 into data/supercontest/dashboard-ai-review-2026.json from saved ESPN box scores via sc_review.py (backup .bak-claude-20261121-sat-w9w10). W9: AI 4, official 3. W10: AI 3 (Saturday re-rank five), official 4. Official season total 24.5 matches Amanda Rose on the Nov 20 standings.
- check_sc_report.py --week 11: PASS. Reports rebuilt (provisional, HTML only).

## Update 7:37 PM PT - margin simulation added

- Ran scripts/intel/margin-simulator.mjs on all 12 games (scratch/w11-sat-sim.mjs -> reports/intel/w11-model/sim-w11-sat.json). Center = Bookmaker 5:43 pm line moved 50% toward the raw Week 11 model (no QB/injury/weather adjustments).
- Andy kept every pick, lean and SC pitch as approved (NO@CHI U48 kept as a weather lean despite sim 50.1% < 51.5% BE). Sim figures added to the digest (game-card conf %), narratives and SC pitches (backups .bak-sat-sim). SC format gate PASS; reports rebuilt (provisional).
- Sunday final build: re-run scratch/w11-sat-sim.mjs with the Sunday capture lines (edit NOW table) and refresh the figures.

## Update 8:08 PM PT - extra inputs folded into the build

- New scripts/master-intel/extra_inputs.py, hooked into build.py (backup .bak-claude-20261121-sat-extra):
  - merge_reviewed_podcasts: reviewed-podcast-picks.json -> expert pool (70 rows from 13 shows, 5 dupes skipped; 5 speaker-less Favorites Podcast contest-card rows labeled Kendra Middleton by episode). Kezirian, Middleton, Hribar, Erickson, Dan Freddy, Skooshi, SGPN, Lock & Cash (Jeff), Welsh now in the expert registry and agreement counts.
  - load_context + panel: per-game 'Model, sim & conditions' panel (fair-lines-w11.json, latest sim-w11-*.json, weather review, manual QB file, Andy's caveat tags from w11-gate-manual.json). 12/12 panels render; domes handled.
- Picks/leans/SC unchanged. SC format gate PASS. Browser QA (Browser 1): grid shows sim conf on 6 cards, NYJ@LAC panel renders, no overflow.
- Sunday: re-run the sim with Sunday lines (new sim-w11-*.json is picked up automatically as the latest file).

## Update 8:30 PM PT - double shrink + FTN matchup analytics

- scratch/w11-sat-sim2.mjs -> reports/intel/w11-model/sim-w11-sat.json (v2; v1 kept as .bak-v1-singleshrink). Main view now uses the pipeline-standard double shrink (point shrink 50% to the model, then 50/50 blend with the no-vig market probability from both Bookmaker prices; contest lines blend with the market-only sim). NYJ +3 53.9% (was 58.9%).
- Analytics sensitivity: FTN EPA/play matchup projection (offense + opposing defense vs league mean, regressed 50%, x plays/game, +1.5 HFA; MIN@SF neutral) through the same steps. Sensitivity only; weights untested. FTN team tables are through Week 9 (team dossiers).
- Each game panel: sim (double shrink), matchup-analytics projection, rec/SC analytics numbers, and a matchup table (10 metrics, league ranks, edge flag when ranks differ by 8+). Panel has class no-bm (keeps site card buttons out).
- Digest conf %, narratives and SC pitches regenerated from v2 (backups .bak-sat-sim2). Picks/leans/SC unchanged; with the double shrink the approved SC five are the top five sides by expected points.
- Sunday: update NOW in scratch/w11-sat-sim2.mjs with Sunday lines and point the BKR capture path at the new file; re-run, then scratch/w11-sat-sim2-apply.py logic (strip + re-add) before the final build.

## Update 9:52 PM PT - Gun to my head built (first run)

- Spec docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md (Andy decisions 11/20) was never implemented; built tonight: scripts/master-intel/gun_to_my_head.py -> data/research-intel/review/2026-w11-gun-to-my-head.json + ledger data/research-intel/gun-to-my-head-ledger-2026.json (24 calls pending; run --grade after finals). Spec updated with implementation notes (backup .bak-claude-20261121-impl).
- W11 Saturday result: 3 Strong lean (TEN +7, NO@CHI Under 48, JAX@NYG Under 46), 16 Lean, 4 Coin flip (ARI@KC side, LV@DEN side, BAL@CAR total, NYJ@LAC total), 1 Official pick (NYJ +3). JAX@NYG side leans NYG +5.5 and is flagged 'Disagrees with the card lean' (card: JAX -5.5).
- Rendered inside the recommendations box (site Dashboard page) via extra_inputs.gtmh_section, CSS-only tier filter (verified in Browser 1), no-bm; each game panel has a one-line GTMH summary. build.py hook after rec-passes (backup .bak-claude-20261121-sat-gtmh).
- Sunday: re-run gun_to_my_head.py after the Sunday sim (needs the Sunday BKR/BOL paths in SRC and the sim re-run), then the build.

## Update 10:16 PM PT - Gun to my head layout

- Andy: GTMH moved right below the Platinum Rose straight bets (build.py hook after rec-straight; backup .bak-claude-20261121-sat-gtmh2), then redesigned as matchup cards (extra_inputs.gtmh_section; old layout kept as gtmh_section_full; backup .bak-sat-gtmh3): team logos, projected score (sim center), side and total picks with tier, best number, sim vs break-even, and the backing data bullets; coin flips show what would tip them. Quick-reference tables and tier filter removed in the card layout.

## Update 11:03 PM PT - Gun to my head props + roster fix

- New scripts/master-intel/gtmh_props.py -> data/research-intel/review/2026-w11-gtmh-props.json: top 5 prop leans per matchup (59 total), all markets eligible, main line per book (two-way closest to even; one-way -200..+400), families production/volume/matchup/game script/experts/QB change/weather; tiers like GTMH; max 2 per category and per player. Defensive player props exist only on DKP Thursday (flagged recheck).
- Rendered first in Props Lab (extra_inputs.gtmh_props_section; build.py GPROPS hook before PBP; build_site keeps 'props-gtmh' and pins it first). Research table relabeled 'Player prop research reference (not picks)' with a legend for 'Reference only · PASS' (research_evidence.py). Backups .bak-claude-20261121-sat-props.
- ROSTER: the 11:01 PM ESPN refresh dropped Brandin Cooks from SF (no availability event). Strict gate blocked on the receiver-roles seed; removed only his row (backup .bak-claude-20261121-sat-cooks) and re-ran npm run secondary-matchups (local files only). Vet PASS. Verify Cooks's status Sunday.
- Sunday: re-run gtmh_props.py after the Sunday BKR/BOL recapture (update the capture paths in load_offers), then the build.
