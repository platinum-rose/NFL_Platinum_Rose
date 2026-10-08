# Handoff — 2026-10-08 PT — Codex: Futures intake, exactas, and TNF prop-intel next

**Status:** Local futures-import and portfolio-tracking work is committed on the current branch. No sportsbook, cashier, Supabase, official-pick, or wager-placement action was taken.

## Current state

- All supplied root items from `docs/Futures_Odds/` were parsed into local `data/futures-imports/` artifacts and moved to the ignored `_processed/` folder. The local intake report is `docs/FUTURES_ODDS_INGESTION_2026-10-07.md`; it records 42 futures source files, 1,871 normalized rows, and one non-futures Circa teaser slip excluded from the futures data.
- The 2026-10-07 comparison data are `data/futures-imports/betonline-2026-10-07.json`, `betus-2026-10-07.json`, and `bookmaker-2026-10-07.json`. Their `source` fields retain individual document provenance.
- The futures portfolio is `data/futures-imports/andy-portfolio-ledger-2026.json`. It now records two official, pending 2026-10-08 Super Bowl exactas supplied by Andy: Chicago Bears vs Kansas City Chiefs +5500 ($20 to win $1,100) and Chicago Bears vs Buffalo Bills +5400 ($20 to win $1,080). Both were supplied with ticket number `1003471850`; sportsbook identity was not supplied and is intentionally not inferred.
- Exacta totals after those additions: 17 position entries, $179.42 stake, and $23,966.42 aggregate listed to-win. These are alternative outcomes, not additive payouts.
- `data/sportsbooks/promotions-2026.json` records the reported $4.83 reload balance (unreconciled handoff evidence) and the $3.96 BetOnline free-slots cash as `available_unplaced` futures-portfolio funding. The $3.96 is not a ticket or exposure.

## Next session: TNF player-prop parlay intelligence

1. Reconcile live Git first. The shared checkout is dirty; preserve unrelated modifications and untracked artifacts. Do not broad-stage, reset, clean, stash, or delete.
2. Treat TB @ DAL player-prop work as evidence gathering only until fresh lines and player availability are captured. Run the documented roster/player-availability gate before giving player-specific narrative or parlay analysis.
3. Collect current mainstream-book prices and eligible market rules, keeping raw capture separate from normalized props. For Bookmaker SGP, only call a capture analysis-ready when `unparsed=0` and `unknown=0`; do not invent odds.
4. Do not place wagers, access a cashier, write Supabase, mutate official picks, or treat a proposed parlay as placed without specific current authorization. Report executable price, restrictions, stake, and accepted ticket separately when supplied.

## Guardrails

- Sportsbooks and pool sites are read-only. Do not call TheOddsAPI.
- No paid model calls or Supabase writes without per-action approval.
- Ledger changes record only user-reported accepted tickets or settled box-score outcomes.
- Commit through a temporary index with explicit paths; never use `git add -A`.
- The do-not-commit list remains excluded: `scratch/`, `*.bak*`, test-injury Gmail summaries, `.eml`, root scratch files, and unrelated survivor/tracker/research artifacts.

## 📋 Resume Prompt

```markdown
Resume NFL Dashboard development from handoff: `handoffs/2026-10-08-codex-futures-intake-exactas-tnf-props-handoff.md`.

Context snapshot:
- Futures_Odds evidence was locally ingested with document-level provenance; see `docs/FUTURES_ODDS_INGESTION_2026-10-07.md`.
- The futures portfolio includes the two official 2026-10-08 CHI exactas; neither their sportsbook nor any execution beyond Andy's supplied accepted-ticket text should be inferred.
- $3.96 of BetOnline free-slots cash is recorded as available, unplaced futures funding, not a position.
- Next work is read-only TB @ DAL TNF player-prop/parlay intelligence, requiring current lines and roster/availability evidence.

Standing constraints:
- Preserve the dirty shared checkout; use explicit-path temporary-index commits only.
- Sportsbook pages are read-only. Do not place bets, make cashier changes, call TheOddsAPI, write Supabase, or promote analysis into an official ticket without current authorization.
- Keep raw capture, normalized analysis, proposed parlays, and confirmed placed tickets separate.

Reconcile live Git, capture fresh TB @ DAL player-prop prices and availability evidence, then report a clearly labeled analysis-only prop-parlay shortlist.
```
