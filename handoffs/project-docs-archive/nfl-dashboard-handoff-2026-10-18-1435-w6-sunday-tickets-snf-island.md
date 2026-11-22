# NFL Dashboard handoff — 2026-10-18 14:35 PT — W6 Sunday tickets logged, wager-leg guardrails committed; next: SNF Island parlays (DAL@GB)

## State
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `bc72ea3` (committed with `--only`, pushed; origin matches). Checkout still dirty: never `git add -A`, never a full `git status`; commit with `git commit --only -- <paths>`. No stale locks appeared after this commit; if they do, mv them aside.
- `bc72ea3` contains: `data/official-picks/user-placed-wagers-2026.json`, `scripts/add-placed-wager.mjs`, `scripts/generate-live-tracker.mjs`, `scripts/props/betonline-prop-dump-parse.mjs`, new `scripts/check-wager-legs.mjs`, new `scripts/lib/validate-wager-legs.mjs`.

## Wager-leg rules (live tracker only grades legs that follow these)
- Prop legs need `player`, `team` (the player's OWN team), `opponent` and a specific `market`: anytime_touchdown, atd, sacks, receptions, rec_yds, rush_yds, carries, pass_td, field_goals_made, tackles_assists, first_td. Never "player_prop", "prop" or "selection". Game-line legs need no player.
- Keep leg statuses and player names on burnt/settled tickets.
- File format: `json.dumps(indent=2, ensure_ascii=False)`, no trailing newline; confirm re-serializing equals the raw text before writing; back up to `scratch/` first.
- After any edit: `node scripts/check-wager-legs.mjs --week 6` (passes clean, 24 tickets), then `node scripts/generate-live-tracker.mjs --week 6`.

## Tickets logged today (all in the wagers file)
- 740419086 8-team prop stack: SETTLED loss (Tyler Warren out). beo_w6_atd8_td_stack: SETTLED loss. 740404798 and beo_w6_slot3_5leg_parlay: SETTLED loss.
- Live: 740444569 (7-team CHI-ATL Over 50 + props, $15), 740440846 ($25, +1484), 740441886 ($25, +1536), 740456086 (6-team Flex SGP, $10, +6668), BEO #1006732445 (7-leg TD/sack stack, $8.15 to win $423.80), DK Predictions 6-pick combo (BUF/DAL/ARI, $9.98 pays $237), 740418657 first-TD parlay (Stevenson and Warren legs burnt; only J. Williams DAL live; status left for Andy to decide).
- Open ticket numbers still missing: none required.

## Open items
- Andy re-runs the BEO capture script in his own browser tab (parser now classifies "Total Sacks <Team>" as team_sacks; dry run 610 rows, 0 unknown).
- Official inactives for 1:05 PM and later games not verified by Claude (Kyren, McBride, Walker, DAL/GB players).
- Xavier Woods roster-vet blocker; WAS@SF wind/gust (Mon 5:15 PM PT); IND/ATL roof checks.
- Pick'em: Yahoo confidence not set; SSW rank decisions; plan-2026-w06 slot fixes.
- Not started: Master Intel integration file, scratch cleanup, W5 validator.

## Next task: SNF Island parlays (DAL@GB, Sun 5:20 PM PT)
- Use the locked 3-tier island template in project memory (`nfl_dashboard_island_game_parlay_template.md`: odds bands, stakes, diversification rules). Read it first.
- Fresh BEO/BKR props for DAL@GB must be re-pulled (BEO capture had a full DAL@GB player-prop pull at 01:06 PT; BKR 01:10 AM). Reprice before proposing; check inactives for DAL and GB first.
- One leg per game does not matter inside an island ticket (all legs are the same game) but BKR reprices same-game legs as SGP, so price from the SGP builder. Avoid correlation double-count claims.
- Defensive props (sacks, tackles+assists) were absent from the Oct 18 captures except team total sacks; verify before offering them.
- Everything is a proposal; Andy places the bets. Log with the rules above.

## Standing constraints
- No spend on Gemini/AssemblyAI/OpenAI. Nothing placed, promoted or written to Supabase by Claude. Sportsbooks read-only.
- Andy prefs: viewable files in-session; copy-paste text inline in a code block.

## Resume prompt
Resume NFL_Dashboard, Week 6, Sunday 2026-10-18 evening. HEAD `bc72ea3` on `claude/w5-prop-cards-2026-10-11` (pushed). Read project handoff `claude/nfl-dashboard-handoff-2026-10-18-1435-w6-sunday-tickets-snf-island.md` first. Keep the dirty checkout untouched (no `git add -A`, no full `git status`; use `git commit --only`; mv stale `.git/*.lock` files aside). Repo access only via `mcp__remote-devices__device_bash` (`$HOME/mnt/dev/projects/NFL_Dashboard`). No spend on Gemini/AssemblyAI/OpenAI. Task: build SNF Island parlay proposals for DAL@GB (5:20 PM PT) using the locked island template; first check DAL/GB inactives and reprice from fresh BEO/BKR props. Log any tickets Andy places per the wager-leg rules (player/team/opponent/specific market), run `node scripts/check-wager-legs.mjs --week 6`, rebuild the tracker. Everything is a proposal; await direction.
