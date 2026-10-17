Resume Platinum Rose NFL Week 6 Astra synthesis preparation.

Live state at handoff (Sat 2026-10-17, ~12:50 PM PT):
- Repo: E:\dev\projects\NFL_Dashboard
- Branch / HEAD: claude/w5-prop-cards-2026-10-11 @ ea74728 (pushed)
- Test suite: unverified in this handoff; do not claim a passing test count.
- Scope: queue and validate evidence for Astra synthesis across the 13 remaining Week 6 games: HOU@JAX, NYJ@NE, PIT@TB, BAL@CLE, CHI@ATL, TEN@IND, CAR@PHI, NO@NYG, ARI@LAR, BUF@LV, LAC@KC, DAL@GB, WAS@SF. SEA@DEN is final; exclude it everywhere (including its dossier file and the "Event not found" row in live-market-comparison.json).
- No wagers, sportsbook clicks, TheOddsAPI calls, Supabase writes, paid model calls (Gemini, AssemblyAI, OpenAI), ledger/portfolio changes, official-pick promotion, Survivor work, or publishing.

Start safely:
1. Read HANDOFF.md.
2. Verify only:
   git rev-parse --short HEAD
   git branch --show-current
   git log -3 --oneline
   Do not run git status unless preparing a scoped commit.
3. Read:
   - handoffs/2026-10-16-0845-claude-w6-intel-gathering-handoff.md
   - docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md
   - docs/MASTER_INTEL_REPORT_FORMAT.md
   - docs/MASTER_INTEL_REPORT_RUNBOOK.md
   - reports/analysis/week6-intel/w06-intel-evaluation-2026-10-15.md
   - reports/analysis/week6-intel/team-dossier-schema-v1.md
   - handoffs/2026-10-17-1215-claude-sc-report-v3-locked-handoff.md (newest handoff; the SuperContest report v3 layout is locked, do not change it)

Treat live files as authoritative over handoff prose. Preserve the dirty shared checkout: never reset, clean, stash, broad-stage, or use git add -A.

Objective:
Create a dry-run Astra queue: one evidence manifest per remaining Week 6 matchup, using every applicable captured dataset. This is preparation for later synthesis, not a recommendation or card build.

Superseded inputs (do NOT use as evidence):
- scratch/w06-synthesis-digest-sat.md and reports/bets/2026-w06-card.md (built ~1 AM PT Sat, before the 12:33-12:48 PM prop captures and the 11:14 AM splits refresh).
- data/generated/team-dossiers/2026-w06/matchups/LAR@ARI.json and LV@BUF.json (10/13, reversed duplicates of ARI@LAR and BUF@LV).
- data/generated/team-dossiers/2026-w06/matchups/SEA@DEN.json (game is final).

Authoritative source layers to reconcile:
- Slate and team/matchup dossiers:
  data/generated/team-dossiers/w06-slate.json (lists 14 games; drop SEA@DEN)
  data/generated/team-dossiers/2026-w06/
  data/generated/team-dossiers/2026-w06/matchups/ (use the 13 current files dated 10/17 02:04 UTC)
- Fresh weekly pull and roster verification:
  data/generated/master-intel/w06-pull.json
  data/generated/master-intel/w06-roster-vet.json
  data/generated/master-intel/w06-expert-verified.json
- Availability, starter, injury, and weather evidence:
  data/research-intel/availability/2026-w06-availability-layer.json
  data/research-intel/operator-confirmed-starters-2026-w06.json (covers only PHI McKee, BAL Huntley, TB Daniels; CHI Caleb Williams: 'expected to play' but NOT confirmed by the team as of Sat 13:13 PT, resolved only on Sunday morning)
  data/research-intel/source-evidence/espn-status-w06.json
  data/research-intel/review/2026-w06-weather-venue.json (refreshed Sat 10/17 1:16 PM PT from Open-Meteo; source: data/research-intel/source-evidence/2026-10-17-week6-weather-openmeteo.json; the 10/16 version is backed up as *.2026-10-16-1504pt.bak.json: do not use it. Forecast, not observation: refresh again near kickoff. Review flags now: HOU@JAX gusts 42.8 km/h only; DAL@GB wind eased to 14/30 km/h gusts. CHI@ATL and TEN@IND are retractable roofs and BUF@LV is a fixed dome: no outdoor weather applies without a roof confirmation)
- Analytics:
  data/research-intel/proposed/2026-w06-quantitative-synthesis.json
  reports/intel/2026-w06-quantitative-synthesis.md
  data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (10/16 3:00 PM PT: STALE, still needs a refresh)
  data/secondary-matchups/secondary-matchup-vulnerability-2026-w06.json
- Expert, article, podcast, and extracted-transcript evidence:
  reports/intel/expert-verification-2026-w06.md
  reports/intel/master-intel-narratives-2026-w06.md (game scripts and projections; known error: the CAR@PHI text says "TNF rule applies", which is wrong; do not repeat it)
  data/podcasts/youtube-extracted-picks-2026-w06.json (status pending_andy_review: context only, not picks; Ross Tucker's picks predate the Hurts/Mayfield/Lamar news)
  data/shadow-harness/antigravity-staging/ (trust the JSONs, not the batch report text)
  data/research-intel/source-evidence/2026-10-17-*
- Market evidence:
  data/odds/actionnetwork-openers-2026-w06.json (opening-line baseline)
  data/odds/BKR_current_lines_1017_1240_buildfmt (Bookmaker game lines, Sat ~12:40 PM PT; the 1 AM file BKR_current_lines_1017_0100_buildfmt is superseded)
  data/supercontest/live-market-comparison.json
  data/generated/master-intel/w06-splits-all.json (ALL splits, 13 games: spread and total from the Sat 11:14 AM PT Action Network refresh; moneyline from the Thu-night Supabase pull, flagged STALE; built from public/betting_splits.json and w06-pull.json)
  public/betting_splits.json (raw source of the spread/total splits)
  data/supercontest/week-06-lines.json (locked SuperContest lines, captured 10/15 2:29 PM PT; includes final SEA@DEN)
  data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json (12:40 PM PT; 13 games; thin for BAL@CLE and CAR@PHI at 60 rows each; no TD-scorer rows)
  data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json (12:33 PM PT; only HOU@JAX, CHI@ATL, BUF@LV, DAL@GB have full player props; the other nine games are game lines and a few markets only)
  data/research-intel/source-evidence/2026-10-17-draftkings-predictions-week6-props-parsed.json (12:48 PM PT; TD contracts only: anytime, first-TD, 2+ TD)

Known facts and cautions to carry into the packets:
- Jalen Hurts (PHI) is OUT; Tanner McKee starts. Millman's CAR +1.5 was placed before Hurts was ruled out; the line is now about CAR -3. Label it "pre-Hurts-OUT", not a sign error.
- Lamar Jackson (BAL) and Baker Mayfield (TB) are out per ESPN/FantasyPros; Huntley and Daniels are recorded on operator approval. Official inactives decide.
- Caleb Williams (CHI) is unresolved until Sunday morning: CHI@ATL cannot be `ready`. Hold all CHI-dependent cards.
- Saquon Barkley's OUT status is a reporter hedge mapped to OUT: treat as unconfirmed.
- A.J. Brown (NE) is ESPN day-to-day: needs a status check before any Brown leg.
- Isaiah Likely and Najee Harris: roster map says NYG, speakers said BAL/PIT. Human check before any use.
- Roster-map team codes use WSH; schedule uses WAS. Staging pick lines may be missing ("line not stated"): reprice before use.
- Line baseline: use data/odds/BKR_current_lines_1017_1240_buildfmt (Bookmaker game lines captured ~12:40 PM PT Sat; supersedes the 1 AM file). The quantitative model and narratives were built on the Fri 7:33 PM board and are stale for CHI@ATL (now CHI -1 / ATL +1, total 52.5; it was ATL -1 at 1 AM) and WSH@SF (now 8, ML +324/-390), with small juice-only moves elsewhere; TEN@IND total is 44.5 (model says 44). The quantitative table drops signs ('PHI 3' means PHI +3) and live-market-comparison.json also drops them; read direction from the BKR file.
- Prediction-market contracts (DraftKings Predictions) are reference-only, not sportsbook-executable prices.

Before queueing, produce a compact freshness matrix: source, timestamp, scope, and verdict. Stop and flag any source that is stale, incomplete, internally contradictory, non-executable, or does not cover a particular game/market.

For each of the 13 remaining games, prepare an Astra input packet with:
- matchup, kickoff, and source timestamps;
- market baseline and line movement (opener -> current), explicitly distinguishing executable row-verified prices from reference-only observations;
- team dossier and FTN/quantitative signals;
- confirmed quarterback, injury, availability, and weather context;
- expert/podcast/article agreement and disagreement, preserving attribution and quote quality;
- betting splits (spread-only for SuperContest; flag the moneyline-split source age);
- player-prop coverage only where a current, row-verified price exists;
- counter-case, material conflicts, missing inputs, and what would change the thesis;
- a final `synthesis_status`: ready, conditional, or blocked.

Do not infer player roles/statuses from memory. Run the strict Week 6 roster gate before any player-specific narrative is presented (npm run roster:vet -- --week 6 --date 2026-10-17 --fetch --strict; if the machine has no network, run it without --fetch and flag the rosters' age). A BLOCK ends the run.

Write only dry-run queue artifacts under:
- scratch/w06-astra-synthesis-queue.md
- scratch/w06-astra-synthesis-queue.json

Do not invoke Astra yet. The queue must make a later Astra run reproducible and show exactly which games are ready versus blocked. Finish with a concise readiness summary and the exact refreshes needed before requesting authorization for the real Astra synthesis. Expected refreshes: FTN context, a kickoff-day weather refresh, rerun the quantitative synthesis and narratives against the 12:40 PM Bookmaker lines, roster vet with --fetch, A.J. Brown status, Andy's review of the YouTube picks, and (Sunday morning) the Caleb Williams decision followed by a final roster-gate rerun.
