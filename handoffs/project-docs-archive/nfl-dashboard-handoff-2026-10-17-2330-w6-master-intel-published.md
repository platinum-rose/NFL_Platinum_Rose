# NFL Dashboard handoff — 2026-10-17 23:30 PT — W6 Master Intel published; layout is the W7 baseline

## State
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `aa8efb0` (committed with `--only`, pushed; origin matches). Checkout still very dirty: never `git add -A`, never a full `git status`; commit with `git commit --only -- <paths>`.
- Git locks: the commit left `.git/HEAD.lock` and `.git/next-index-19.lock`; moved to `.git/stale-head-lock-aa8efb0` and `.git/stale-next-index-lock-aa8efb0` (the shell cannot delete without approval). Expect the same after the next commit: mv them aside, then push.
- Committed in `aa8efb0`: `scripts/master-intel/build.py`, `build_single.py`, `convert_summary.py`, shell sources `scratch/mt/mt_css.css` + `mt_js.js`, and the official report `scratch/w06-master-intel-1017-2200.html`. Not committed: `*.bak.py` backups, `scratch/mt/*.pre-grid.*`, the stray untracked `scripts/master-intel/youtube_digest_from_staging.py` (also shows a staged delete; left alone).

## Official W6 Master Intel report
- `scratch/w06-master-intel-1017-2200.html`: one self-contained HTML (~1.7 MB; no external scripts/fonts/images; works offline; citation links need internet). Published by Andy as the official W6 report.
- Layout (keep for W7): tab shell (phone bottom bar); Games tab with 14-card grid and matchup pop-ups (logos on both sides, market lines centered incl. QB row, splits as bars, secondary-matchup callout, bulleted Game Script / Why / What breaks it, Sides fave/dog and Totals O/U sentiment camps, uniform prop lines); Market tab (splits, line movement, Steam/RLM badges); experts grouped by show with agree/disagree and search; every expert's picks on the Experts tab; glossary hover definitions; citation pop-ups with external links; props pool with filters (only types that have props, with counts) and prop boards with Over/Under and recommendation; At-a-Glance split into Sides and Totals groups; collapsed Wong teaser and survivor definitions; compact "+ Card" bookmarking limited to real pick tables.
- Build: `(nohup uv run --python 3.12 --with python-docx --with markdown --with beautifulsoup4 python scripts/master-intel/build.py --week N --date YYYY-MM-DD > scratch/<log> 2>&1 &); sleep 168` (about 165 s; device Python is 3.10, so use uv 3.12). Output: `dist/nfl_week6_master_packet/nfl_week6_master_betting_intelligence_summary.html` (the folder name is still week6; check the output path and any week-6 literals before trusting a W7 build).
- CSS/JS live in `convert_summary.py` (`CITE_CSS`, `MT_CSS`, `MT_JS` are raw-string constants; the page template is an f-string so literal braces are doubled). Edit `scratch/mt/mt_*` then re-embed.

## Known gaps / W7 to-do
- No defensive props: the 2026-10-18 BetOnline capture (`data/generated/props/betonline-live-2026-10-18-week6.json`, 1000 rows, 24 markets) has no tackles+assists, sacks or def-INT markets, and only HOU@JAX, BUF@LV and DAL@GB got full player-prop pulls; CHI@ATL has 4 rows. Earlier captures (beo-w04.json) had those markets, so the extractor must open the defensive tabs for all games. The Props filter hides empty types and says so.
- Remaining UI nits: sticky "← All games" bar can cover the card header on deep links; "Built…" line repeats on every tab; some leans show Pick and Lean with similar text; "My Card" button can overlap on phones; untested on real phone/Safari/screen reader; PDF cannot be regenerated here (needs Chromium).
- Possible W7 week-literals to scrub: leftover WSH@SF mention, Dog-ML round-robin block assumes 2 legs from the Sharp or Square ticket.
- Unanswered offers: Top 12 + every game's lean as a table at top of Picks; compare-two-games; Experts sub-nav; About-tab pagination.

## Still open for W6 (from the 16:45 handoff)
- Sunday AM: Williams decision, `fetch_espn_rosters.py`, `npm run roster:vet -- --week 6 --date 2026-10-17 --strict`; unblock CHI@ATL Astra synthesis.
- Refresh before kickoff: official inactives, A.J. Brown, Barkley hedge, Likely price, WAS@SF wind/gust, IND/ATL roof.
- Andy and Amanda's official SuperContest five -> `data/supercontest/locked-card-week-6.json`.
- Build the W6 betting cards (singles, parlays/round robins, teasers, prop stacks, SuperContest five) from the 13 Astra outputs and the published report. Everything is a proposal; nothing is placed.

## Standing constraints
- No spend on Gemini/AssemblyAI/OpenAI. Nothing placed, promoted or written to Supabase by Claude. Sportsbooks read-only. Hold all CHI cards until the Williams decision.
- Andy prefs: viewable files in-session; copy-paste text inline in a code block.

## Resume prompt
Resume NFL_Dashboard. HEAD `aa8efb0` on `claude/w5-prop-cards-2026-10-11` (pushed). The W6 Master Intel report is published (`scratch/w06-master-intel-1017-2200.html`, layout is the W7 baseline). Read the project handoff `claude/nfl-dashboard-handoff-2026-10-17-2330-w6-master-intel-published.md` and `claude/nfl-dashboard-handoff-2026-10-17-1645-w6-astra-synthesis-done.md` first. Keep the dirty checkout untouched (no `git add -A`, no full `git status`; use `git commit --only`; mv stale `.git/*.lock` files aside). Do the Sunday-morning refresh (Williams, rosters, roster vet, inactives), unblock CHI@ATL, then build the W6 betting cards from the Astra outputs and the report. Everything is a proposal; await direction.
