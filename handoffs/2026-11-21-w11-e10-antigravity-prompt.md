# Week 11 E10 chase: Antigravity prompt (podcasts and articles)

Work in `E:/dev/projects/NFL_Dashboard` on the existing branch. Do not switch branches, reset, stash, clean, stage, commit or push. Do not write to Supabase. Do not place wagers or touch ledgers or official picks. Do not spend money on paid APIs. The Gemini audio feeds show `billing_depleted`, so do not run Gemini extraction. Work from published show notes, episode descriptions, chapter markers, free transcripts, article text you can read, and audio you can play and listen to directly.

## Goal
Find the Week 11 (NFL 2026) picks of these seven preferred experts. The Saturday gate check E10 still lists them as missing:

| Expert | Where they usually publish |
|---|---|
| Doug Kezirian | Action Network / ESPN betting podcast and articles |
| Collin Wilson | Action Network articles and podcasts |
| Jason Radowitz | BettingPros articles |
| Rich Hribar | Sharp Football articles and podcast |
| Kendra Middleton | podcast |
| Joe Madden | articles |
| Daniel Jeremiah & Bucky Brooks | NFL.com "Move the Sticks" podcast |

Only these 12 games count: MIA@BUF, NO@CHI, TEN@DAL, TB@DET, ARI@KC, PIT@PHI, BAL@CAR, NYJ@LAC, LV@DEN, JAX@NYG, MIN@SF (Mexico City), CIN@WAS. IND@HOU is over; ignore it. Accept only content published 2026-11-16 or later that clearly refers to Week 11.

## Output
1. Append verified records to `data/intel/articles/2026-w11/reviewed-podcast-picks.json`, following that file's existing `sources[]` structure: `analyst`, `outlet`, `url`, `published_at`, `reviewed_at`, plus `game_picks[]` / `picks[]` with `timestamp_seconds` where audio applies. Back the file up first as `.bak-antigravity-20261121-e10`. Write article picks with their published line and price exactly as printed. Never invent a line, price or timestamp.
2. Write `reports/intel/antigravity-w11-e10-expert-chase.md`. For each of the seven experts, record either the picks found with links, or "no Week 11 card found" with exactly where you looked (URLs, episode titles, dates).
3. Label each item: standalone pick, contest card (e.g. SuperContest), winner forecast, team total, or parlay leg. Only standalone picks count as picks.

## Rules
- TB@DET items must carry the caveat "Mayfield Questionable". ARI@KC items must carry "Josh Johnson preparing to start (Beck Q)".
- Check each player name against `data/nfl-rosters/espn-full-rosters-latest.json`. Never write a player's team from memory.
- Paywalled content you cannot read counts as "not readable"; say so. Do not guess its contents.
- Target finish: 7:00 pm PT Saturday. Partial results are fine; list what remains.

When done, tell Andy the report path. Claude will re-run `python scripts/master-intel/final_gate_check.py --week 11 --stage saturday` and move any expert with no card into the gate's no-card exception, using your report as evidence.
