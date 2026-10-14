# H2C2 detailed briefing — Week 6 Wednesday → Claude Team 2

Written Wed 2026-10-14 ~11:00 PT by Claude Team 1 (Cowork, linked to Andy's laptop). Required first read: `reports/handoff-snapshots/2026-10-14-h2c2-week6-wed/H2C2_START_HERE.md`. Load only the section for your lane.

## 1. Verified Git state

- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. HEAD before this handoff commit: `dbf8225`. Six local commits are unpushed (origin tip `50c5396`); Andy pushes.
- Checkout is dirty and shared. Never `git add -A`, reset, clean, stash. Never run `git status` casually (2+ min, can leave `index.lock`).
- The real index is stale against HEAD. Commit with a temporary index: `export GIT_INDEX_FILE=$HOME/tmp-index-N; git read-tree HEAD; git update-index --add -- <paths>; T=$(git write-tree); C=$(echo "$MSG" | git commit-tree $T -p $OLD); git update-ref refs/heads/<branch> $C $OLD`. Use `git add -f` semantics for gitignored paths. `update-ref` leaves a zero-byte `.git/HEAD.lock` that cannot be deleted: `mv .git/HEAD.lock .git/stale-head-lock-N`. Commit trailers: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01EkakkL51ci6YPE6bgmyih9`.
- device_bash: Linux VM, folder at `$HOME/mnt/dev`, max timeout 180000 ms, no repo-wide `find` (times out), cannot reach Andy's Chrome CDP ports.

## 2. What Team 1 did (10/13 evening – 10/14 morning)

1. Committed the live BEO futures capture (842 rows / 131 markets; 31 `Win Total:` markets, no Ravens because the site does not post one; 32 `To Make Playoffs:`; SB winner 32; exact matchup 256).
2. Spot-checked Packers/Bills exacta prices and compared them to the portfolio in chat. Nothing written to the ledger. Ledger anomalies noticed: ticket number 994540980 shared by more than one row; the book for the Bears exactas is unconfirmed.
3. Logged an $11.90 BEO free-spin win. `promotions-2026.json` item `beo-casino-free-slots`: balance log has 9/23 $3.96 and 10/13 $11.90; total $15.86. Andy first said he would put it on exactas, then said he has not decided, so the $11.90 is recorded as **unassigned**. `andy-portfolio-ledger-2026.json` still lists only $3.96 in `available_futures_funding` (unchanged on purpose).
4. BEO props baseline: `npm run bolp -- --week 6` returned 246 rows, only SEA@DEN has props, gate (>=500) failed as expected; the pre-gate dump was committed as the baseline.
5. BKR W6 lines for all 14 games (10/14 00:20 PT), including ARI@LAR and BUF@LV which were missing earlier. Reran `scripts/build-w05-quantitative-synthesis.mjs --week 6`. Top model signals: ARI +13.5 (56.8% cover), JAX -2.5 (55.1%), SF side (54.4%). **Provisional and unbacktested, not recommendations.**
6. Refreshed ESPN rosters (`scripts/nfl-rosters/fetch_espn_rosters.py`), rewrote seeds (`rebuild_matchup_seeds.py`), rebuilt `npm run secondary-matchups`. Tiers unchanged; `target_receivers` changed in 9 matchups. 11 rows are placeholders (8 WR3, 3 SS).
7. Wednesday cadence: article intel review + YouTube sweep (4 new candidates; file now modified/uncommitted).
8. Tried the Gemini extraction on 5 episodes: all failed `402 RESOURCE_EXHAUSTED: prepayment credits depleted` (cost $0, nothing saved). Andy then ran the same job in Antigravity (no API): see §4.A.

## 3. Open decisions (Andy)

- Top up Gemini credits, or accept Antigravity transcript extractions for podcast picks.
- Where the $15.86 BEO free-slots balance goes (exactas vs. other).
- Real ticket numbers: `bet_20261011_betonline_snf_island_6leg` (`pending-not-supplied`), DK promo combos; MNF slips; SuperContest W6 lines; exacta ticket numbers if he places them.
- Whether to rebuild W6 dossiers + quant synthesis on the refreshed seeds (offered, not authorized).

## 4. Lanes

### A. Podcast picks (Even Money, Sharp or Square)
- "Even Money" is the channel labeled **Ross Tucker** in `data/podcasts/youtube-discovery-candidates-2026.json` (show names are mapped in `scripts/build-podcast-narratives.js`). The sweep skipped its weekly pick shows for Gemini because default `--gemini-scope futures` only runs episodes it scores as futures (picks shows score 0).
- Staging (untracked, unvalidated): `data/shadow-harness/antigravity-staging/`, snapshot copy under the H2C2 `copies/`. Summary: `youtube-EC4r_E6mc0E` Even Money W6 BETS (23 picks, 5 notes, reached end), `youtube-Di8EC4Nu_XE` Even Money W6 PICKS (14 pickem_pick, 5 notes), `youtube-0XtOHyz2LRs` Sharp or Square W6 BETS (7 picks, 5 notes, 69 min). `youtube-slfl5V7gaOY`, `youtube-b_vEEqWIg2c` (BettingPros) and `youtube-06-42WRzKQI` (Action Network futures) are `no_transcript` (YouTube HTTP 429).
- Next: validate against the schema in `scripts/run_gemini_youtube_shadow.py` (`build_prompt`): every pick has `source_timestamp`, a verbatim `quote` that really appears, `week` set, player-award markets name the player, no invented lines/prices. Spot-check teams/lines against the BKR board. Roster-gate player names. Then, with Andy's go-ahead, wrap as observations in `data/shadow-harness/observations/` marked source `antigravity-transcript` (not Gemini video; do not score them as equivalent) and commit by explicit path.
- The 3 failed episodes need a transcript retry later or Gemini credits. Never run `--run-gemini` without Andy's go.
- Also pending: commit the modified `youtube-discovery-candidates-2026.json` (Andy has not asked yet).

### B. BEO props re-run
- Andy runs `npm run bolp -- --week 6` in PowerShell (VM cannot reach port 9223). Parser `scripts/props/betonline-prop-dump-parse.mjs` (`parseBetOnlineDump(raw, dateStr, week)`); it saves `.pregate.raw.txt` before the gate. Diff vs `data/generated/props/betonline-w6-baseline-2026-10-13_2315PT.pregate.raw.txt`. Commit pregate dump even if the gate fails.

### C. Rebuild dossiers + quant synthesis on refreshed seeds
- Ask Andy first. Dossiers/postmortems were built before the seed refresh (d0addbd lineage). Find the dossier builder from `handoffs/2026-10-13-0040-claude-w6-team-dossiers-built-handoff.md`. Synthesis: `node scripts/build-w05-quantitative-synthesis.mjs --week 6 [--bkr <path>]` (defaults to newest `BKR_current_lines_*_buildfmt`).

### D. Dossier availability/priors layer
- Run the roster gate (`npm run roster:vet -- --week 6 --date <game date> --strict`) and use `data/nfl-rosters/espn-full-rosters-latest.json` before naming any player. Note the Week 5 lesson: ESPN roster IR/Out group was missing from packets (`reports/intel/games/2026-w05-espn-roster-ir-out-gap.md`).

### E. Ledger hygiene (read-only)
- Report, do not edit: shared ticket 994540980, Bears exactas book, `available_futures_funding` vs the promo ledger. Edits only when Andy states the facts.

### F. Placeholder tiers
- 11 placeholder rows in the seed files (8 WR3, 3 SS); hand-set only if Andy wants them.

## 5. Corrections to earlier prose

- `HANDOFF.md` pickup block of 10/13 21:45 is superseded by this handoff (futures output reviewed and committed).
- The 10/13 handoff said the live futures run might have predated the naming fix; verified: `Win Total:` / `To Make Playoffs:` names are correct.

## 6. Resume prompt

```
You are Claude Team 2 continuing NFL_Dashboard ("Platinum Rose"), Week 6. Read HANDOFF.md, then reports/handoff-snapshots/2026-10-14-h2c2-week6-wed/H2C2_START_HERE.md. Run git rev-parse --short HEAD and git branch --show-current in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard, 20 s timeout; no git status). Pick one lane and read only its section of handoffs/2026-10-14-1100-claude-h2c2-team2-week6-wednesday-briefing.md. Guardrails: sportsbooks read-only; no paid calls (incl. Gemini --run-gemini), no Supabase writes, no ledger/portfolio changes without Andy's explicit go; roster gate before naming players; never git add -A; commit locally via temp index, Andy pushes.
```
