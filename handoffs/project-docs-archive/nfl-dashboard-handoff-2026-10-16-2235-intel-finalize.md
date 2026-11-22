# NFL Dashboard handoff: W6 intel finalize (Fri 2026-10-16, 22:35 PT)

Bridge reconnected; all intel sources are final.

## State
- HEAD = 1cd0d1b (parent ee5b4c4) (local, not pushed): W6 YouTube digest (124 picks, 75 notes, 14 episodes), build.py guard (stops with no synthesis digest/card; `--allow-empty-card` overrides), ONLY_TITLE_SUBSTRINGS filter in agents/podcast-ingest.js, scripts/master-intel/youtube_digest_from_staging.py, antigravity-staging files.
- Committed in 1cd0d1b: agents/lib/gemini-audio-transcribe.js, which now salvages truncated JSON from Gemini and logs finishReason (tested on a fake response).
- UNCOMMITTED (not mine): agents/podcast-gemini-intel.js, agents/portfolio-dossier.js, agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md and others.
- Articles current (sweep inserted 0 new). Twitter bookmarks: all 20 new ingested (9:13 PM PT). w06-pull refreshed 9:27 PM PT (191 signals / 715 notes). Roster gate PASS.
- Report HTML shows "0 bets" because scratch/w06-synthesis-digest*.md and reports/bets/2026-w06-card.md do not exist yet (the synthesis step). Not a UI regression.

## Resolved (late Fri 10/16)
- Sharp Football preview c14ce2db re-ingested via Gemini: 8,476 words, 29 turns, full 52 min, 0 picks, 18 intel. Zero looks genuine (matchup analysis). Old partial row backed up in data/podcasts/backups/.
- Expert picks refreshed: real `pick-extraction.js` upserted 19 picks into user_picks (source EXPERT); verify_expert_rows.py: 82 verified / 18 rejected; pull.mjs --week 6 now expert=40 (was 21), signals 191, notes 715.
- Gemini salvage fix committed (1cd0d1b, local, not pushed).

## Findings worth keeping
- PFF NFL Podcast 10/14 (2c16e4bc) transcribed fully via Gemini (15,832 words, 65 turns, $0.03): 0 picks, 25 intel items. Not a betting show (no spread/parlay/moneyline mentions).
- Antigravity Batch B report disagrees with its JSONs (151 picks not 147; speaker names and timestamps differ; quotes not all contiguous). Use the JSONs.
- Roster conflicts dropped from the digest for a human check: Isaiah Likely (roster NYG), Najee Harris (roster NYG).
- Dry-run of agents/twitter-bookmarks-agent.js writes local vault reports and makes a later real run skip those bookmarks; use --refresh-ids to redo them.
- GitHub token in the cloud container is invalid; trigger workflows from the device or fix GH_TOKEN.
- AssemblyAI is unfunded; Gemini is topped up and verified (HTTP 200).

## Then
1. Rerun pull.mjs --week 6.
2. Weekly synthesis session (agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md, FRI-SAT mode): digest, card.
3. Roster gate, build.py --week 6 --date 2026-10-16, export PDF, check the HTML shows bets and props.
4. Hold CHI cards until Sunday's Caleb Williams decision; rerun the roster gate Sunday morning.
