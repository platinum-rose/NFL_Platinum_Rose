# Operations map: betting, captures, ledgers, futures, pools (NFL_Dashboard)

Where each weekly workflow lives. CLAUDE.md covers the React/Vite app; this file covers the operations side.
Paths are repo-relative. Cloud sessions reach the repo through the device bridge at `$HOME/mnt/dev/projects/NFL_Dashboard`;
they cannot reach the capture Chromes (CDP ports on Andy's Windows machine), so Andy runs the capture commands.
Last verified 2026-11-19.

## Guardrails (always)
- Never place, log or settle a wager without Andy's OK. Nightly settlement stays `--dry-run`.
- Back up a ledger before editing it (`*.bak-claude-<date>-<tag>`).
- `git commit --only <paths>`; never `git add -A`. Andy pushes (the bridge refuses `git push`). Scope `git status` to paths (slow over the bridge).
- Supabase writes and paid runs (Gemini, synthesis) need per-run approval.

## Line and prop captures (Andy runs; Chrome over CDP, signed in)
| Book | Command | Script | CDP port | Output |
|---|---|---|---|---|
| BetOnline props + lines | `.\runbolprops.cmd` | `scripts/props/cron-bol-scrape.mjs` | 9223 | `data/generated/props/betonline-live-<date>-week<N>*`; acceptance gate >= 500 rows (fails midweek until Sunday props post; pregate raw is kept) |
| BetOnline Prop Shop ladders | `.\runbolladders.cmd` | `scripts/props/bol-propshop-ladders.mjs` | 9223 | `data/generated/props/bol-ladders-<date>_<time>.json` |
| BetOnline futures | `npm run futures:bol` | `scripts/props/cron-bol-futures-scrape.mjs` (+ `beo-futures-to-imports.mjs`) | 9223 | `data/futures-imports/betonline-<date>.json` (incl. `superbowl_matchup` exactas when posted) |
| Bookmaker props + lines | `.\runbkrprops.cmd` | `scripts/props/cron-bkr-scrape.mjs` | 9222 | `data/generated/props/bookmaker-live-<date>-*.json`; game lines text via `bkr-gamelines-from-live.py` -> `bookmaker-gamelines-<date>-week<N>.raw.txt` |
| Bookmaker futures | `.\runbkrfutures.cmd` | `scripts/props/cron-bkr-futures-scrape.mjs` | 9222 | reference prices only (BKR offers no exactas) |
| DraftKings Predictions game lines | `.\rundkprops.cmd` | `scripts/props/cron-dkp-scrape.mjs` | 9224 | `draftkings-predictions-live-<date>-week<N>*` |
| DraftKings Predictions per-event feed (leg prices) | `npm run props:dkp:cron` | `scripts/props/dkp-event-feed-capture.mjs` | 9224 | `draftkings-predictions-feed-<date>-<away>-at-<home>.json` |
| Account balances (all three) | `.\runbalances.cmd` | `scripts/props/capture-book-balances.mjs` | all | see Bankroll below |
Launch a capture Chrome: `npm run props:bol:launch` / `props:bkr:launch` / `props:dkp:launch`. Failures leave screenshots/JSON in `data/generated/props/diagnostics/`.
Every capture also records the account balance (`scripts/props/book-balance.mjs`).

## Injuries, starters, play-by-play
- `data/player-availability/latest.json` (built by `scripts/build-player-availability.js`, 3 PM cadence), `data/projected-starters/2026/latest.json`.
- nflverse play-by-play: `data/nflverse/2026/play_by_play_2026.csv.gz`, refresh with `node scripts/fetch-nflverse.mjs` (check it covers the last completed week).
- Matchup post-mortem: `reports/analysis/season/claude/scripts/matchup_postmortem.py --week N`.

## Cadences and intel
- `node scripts/toolbox.mjs --cadence <day>` (Windows Task Scheduler runs these). Logs `logs/toolbox-<day>.log`; reports `logs/cadence-reports/2026-w<NN>-<day>.md` (read these instead of re-running).
- Podcasts: Antigravity staging -> `python scripts/master-intel/youtube_digest_from_staging.py --week N` -> `data/podcasts/youtube-extracted-picks-2026-w<NN>.json` (`status` pending_andy_review until Andy approves).
- Article review: `data/research-intel/review/article-intel-review-latest.json`.

## Synthesis and fair lines
- Fair lines: `reports/intel/w<NN>-model/fair_lines_w<NN>.py` (copy last week's; rebuild the QB/injury ADJ table).
- Synthesis queue: `scripts/intel/build-game-synthesis-queue.py`; per-game prompt `agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md` (PLAY / LEAN / PASS, edge + basis).
- Simulator: `node scripts/intel/margin-simulator.mjs`.

## Cards, rules and pre-buy checks
- Weekly card `reports/bets/2026-w<NN>-card.md`; template `docs/NFL_WEEKLY_CARD_PROCESS.md` (slot 9 = Island stacks); Island proposals `reports/bets/2026-w<NN>-<slate>-island-stacks.md`.
- Pre-buy check (run before anything is placed): `python scripts/cards/check_overlap.py --week N --date <slate> --candidates data/official-picks/candidates-<...>.json`.
- Rules registry: `reports/bets/season-recap/rules/rules-2026.json`, managed by `reports/bets/season-recap/scripts/rules.py` (propose / accept / retire / check; max 3 proposals per week).
- Funding: DKP combos are promo (DKP winnings balance) until it runs out; promo tickets are exempt from cash rules (S1 leg cap, S21 Island band) but not from S5.

## Ledgers
| Ledger | Path | Notes |
|---|---|---|
| Placed wagers | `data/official-picks/user-placed-wagers-2026.json` | log with `scripts/add-placed-wager.mjs`; DKP leg prices `scripts/props/dkp-leg-prices.mjs --week N [--apply]` |
| Paper wagers | `data/official-picks/paper-wagers-2026.json` | never mix with real |
| AI proposals | `data/official-picks/ai-proposals/2026-w<NN>.json` | recorded at proposal time |
| Futures portfolio | `data/futures-imports/andy-portfolio-ledger-2026.json` | futures never go in the placed-wagers file; promo pot in `available_futures_funding` |
| Promotions | `data/sportsbooks/promotions-2026.json` | |

## Bankroll and book reconciliation
- Official bankroll: `node scripts/lib/bankroll.mjs [--week N] [--json]`. DraftKings Predictions, Pick6 and FanDuel Predicts are exempt by book name; everything else counts.
- Balances: `data/bankroll/book-balances-2026.jsonl` (every capture), `book-balances-latest.json`, manual `book-balances-manual-2026.csv`; per-site selector overrides `balance-selectors.json`.
- Deposits/withdrawals/bonuses: `data/bankroll/book-transactions-2026.csv`.
- Book history parsers: `python scripts/bankroll/parse_bkr_history.py <raw>` and `parse_bol_history.py <raw...>` (raw pastes in `data/bankroll/raw/`). Reconciled 11/18: BKR $800.00, BOL $75.12.

## Futures
- Payout matrix: `reports/bets/futures_matrix_w<NN>.py` (copy last week's, point it at the newest `betonline-<date>.json`).
- Kalshi (public API, no key): events `KXNFLSBOUTCOME-27` (ordered "X beats Y"; a matchup = both directions), `KXNFLAFCCHAMP-27`, `KXNFLNFCCHAMP-27`, `KXSB-27`. Taker fee ~0.07 x P x (1-P) per contract.
- Exacta venues: BetOnline (intermittent; prices ~86% of fair), Kalshi, Circa (in person). Bookmaker and BetUS are not venues.
- Weekly review: `reports/bets/2026-w<NN>-futures-review.md`.

## Pick'em and confidence pools
- `node scripts/pickem-card.mjs --week N --odds-file data/pickem/odds/odds-2026-w<NN>-<book>-<mmdd>.json` -> `reports/pickem/2026-w<NN>-pickem.md`, `data/pickem/plan-2026-w<NN>.json`.
- Pool config and standings `data/pickem/pools-2026.json`; weekly captures `data/pickem/<pool>-2026-w<NN>.json`. Duma slots run (17 - games)..16; Yahoo 1..games.

## Post-mortems
- Weekly: `reports/bets/season-recap/scripts/postmortem.py`, `scorecard.py` (Tuesday cadence).
- Mid-season audit: `reports/analysis/midseason-2026/`.
