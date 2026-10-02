# Live market capture session handoff — 2026-10-02 13:40 PT

## Git / workspace

- Branch: `main`, pushed through `cd48156` (`Capture Week 4 Bookmaker SGP lines`) to `origin/main`; remote ref verified at that commit.
- The worktree remains heavily dirty with concurrent, unrelated changes. Do **not** reset, clean, stash, revert, or broadly stage it. This session committed only its two new tracked artifacts.
- `git fetch` could not reach GitHub from the sandbox before push; the subsequent authenticated push and `git ls-remote` succeeded.

## Verified Bookmaker result

- Captured all 15 open Week 4 Bookmaker SGP pages from the authenticated rendered site. PIT @ CLE was intentionally excluded because it had ended.
- Raw browser-download artifact: `data/generated/props/bookmaker-live-2026-10-02-week4.raw.txt` (192,695 bytes). It is generated/ignored and was not committed.
- Parsed output: `data/generated/props/bookmaker-live-2026-10-02-week4.json` plus per-game JSON files; generated/ignored and not committed.
- Main-line snapshot committed: `data/odds/BKR_current_lines_1002_1320`.
- Detailed capture record committed: `handoffs/2026-10-02-1325-codex-week4-bkr-sgp-live-capture.md`.
- Capture method: direct game URLs plus the existing `scripts/props/bookmaker-sgp-extract.browser.js` in the real `be.bookmaker.eu` page context. It read rendered DOM only; no selections, expanders, bet-slip actions, account actions, or wagers occurred.
- Full CDP page context had usable `sessionStorage`; its transient `bkrDump` cache remains only in the Bookmaker tab. It is not account data.

## Parser / roster gate

- Parser command run:
  `node scripts/props/bookmaker-sgp-dump-parse.mjs --in data/generated/props/bookmaker-live-2026-10-02-week4.raw.txt --date 2026-10-02 --week 4`
- Result: 15 games, `unknown=0`. Not fully clean: MIA @ MIN has `unparsed=24`, because Bookmaker rendered first-/second-quarter rows without lines or odds. A direct re-load plus 12-second wait produced the same source state. Do not invent or reconstruct those 24 rows; re-capture later if Bookmaker restores prices.
- `python3 scripts/nfl-rosters/roster_vet.py --week 4 --date 2026-10-02 --fetch --strict` passed: **0 BLOCK**. It reported 13 non-blocking Bookmaker name mismatches; no names were changed from memory.

## Explicitly incomplete market coverage

- **BKR futures / season markets:** not freshly captured in this session. Earlier page observations or user-pasted prices are not a substitute for a new dated raw capture.
- **BEO full game lines, futures, and Props Builder:** not complete. The only local BEO prop artifact from this session is `data/generated/props/betonline-live-2026-10-02-ind-was.ou.raw.txt`, covering IND @ WAS O/U plus user-pasted TD lines. It must not be represented as an all-game BEO capture.
- BEO Props Builder is asynchronous and may reside in an embedded context. Do not reuse the JWT-bearing `troya.xyz` URL previously pasted into chat; treat it as sensitive/expired. For any resumed BEO work, use the user’s currently logged-in BEO page and rendered content only.
- No fresh prediction-market capture was made in this session.

## Safe next steps

1. If clean Bookmaker parser output is required, revisit only MIA @ MIN and re-run the exact page-context extraction once first-/second-quarter prices visibly render; re-download and re-parse. Target remains 15 games, `unparsed=0`, `unknown=0`.
2. Capture BKR futures separately from the authenticated rendered pages, with a dated raw snapshot and a clear inventory of market families.
3. Resume BEO as a separate capture: validate true page context, enumerate game pages, and record each market’s visible rows. Treat page shell/iframe failures as a blocker, not as permission to synthesize lines.
4. Only after independently verified BKR/BEO/futures/prediction-market coverage should any broader market-readiness or intel workflow be considered. Do not run paid synthesis, make recommendations official, place wagers, modify account settings, write Supabase, call TheOddsAPI, or change any ledger without new authorization.

## Guardrails retained

- Sportsbook work is evidence capture only. Prices are displayed market information, not wagers or executable-ticket confirmation.
- Preserve the dirty shared worktree and commit only newly created, scoped artifacts.
- Keep account, bet slip, cashiers, bankroll/ledger, official-pick, Supabase, and external proposal-promotion paths out of scope.
