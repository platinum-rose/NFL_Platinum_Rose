# Futures Intel Report — Next-Session Task List

> **Purpose:** pick up the NFL Futures Intel Report build in a fresh session without prior chat context.
> Read this top-to-bottom first. Repo root: `~/projects/NFL_Dashboard` (M6 canonical) / `E:\dev\projects\NFL_Dashboard` (Windows Cowork clone).
> **HEAD at handoff:** `983feb7` on `main` (pushed + pulled to M6). Prior milestones: `d1b9e58` (S221 engine build), `436ffd7` (S220).

---

## 1. Status snapshot (2026-06-26, S222)

**Done & live**
- **A0 ✅** Parser uniform-keys fix (`scripts/ingest_bookmaker_docx.py`) committed `f219eb6`.
- **A1 ✅** BetOnline 06-02 screenshots vision-extracted → `data/futures-imports/betonline-2026-06-02.json` (158 rows: SB 32, conf 16/16, div 32 incl. AFC East, wins 31, playoffs 31 — GB missing in wins/playoffs, cut at screenshot boundary). Ingested clean @ `2026-06-02T00:00:00Z`. A junk prior betonline snapshot (`12:00Z`, 220 rows / 156 polluted team names) was deleted.
- **A2 ✅** `BKR_Odds_0602` (plain text, outrights only) → `data/futures-imports/bookmaker-2026-06-02.json` (96 rows). Matched a pre-existing clean 06-02 snapshot; deleted a duplicate `12:00Z`. Also backfilled `BKR_Futures_20260517` → `data/futures-imports/bookmaker-2026-05-17.json` (96 rows), ingested clean.
- **Engine redesign ✅** `agents/futures-intel-report-v2.js` reworked for offseason analysis:
  - Fetch keyed off **`snapshot_time` + season** (full history, paginated past PostgREST's 1000-row cap), not `captured_at ≥ now−14d`. Optional `ODDS_SINCE` ISO floor.
  - **"Current" = latest snapshot per book** (was: last-24h bucket — that was the real cause of "3/8 categories"). Now resolves conference/division/playoffs/wins even when the newest book obs is weeks old.
  - **Movement = net since opening**, computed per-book then averaged; plus a forward-filled consensus **trajectory + unicode sparkline** and the date window.
  - Win totals reworked the same way (latest line per book, line-delta movement).
- **Reusable ingest ✅** `scripts/ingest_futures_json.py <file.json> [--dry-run]` is now the standard path (stdlib only, idempotent upsert). Replaces the hand-pasted REST snippet.
- First live report generated on M6 (`--trigger manual`): **7/8 categories present**, movement trajectories populating from the 05-17→06-25 Bookmaker series. `futures_reports` row + vault notes written.

**Data state (`futures_odds_snapshots`, all de-duplicated)**
- `betonline` 06-02 (158) — 2nd sharp book.
- `bookmaker` 05-17 (96 outrights) · 06-02 (96 outrights) · 06-25 (155, full incl. wins/playoffs).
- `draftkings` / `fanduel` / `betmgm` — **Super Bowl only**, captured daily (TheOddsAPI).
- → Two sharp books, multiple offseason dates. **Retention is safe** — nothing prunes the table (append-only).

**Built but NOT yet deployed/active** (Phase 2 plumbing)
- Dispatch edge function `dispatch-futures-report` — **not deployed**; secret `GITHUB_DISPATCH_TOKEN` **not set**.
- `ANTHROPIC_API_KEY` — **not in GitHub Actions secrets** (needed for live narratives in scheduled/dispatched runs).
- Dashboard with the Futures Report tab — not rebuilt/redeployed to M6 since the engine redesign.

---

## 2. Environment gotchas (read before touching anything)

- **NTFS↔Linux mount truncation (sandbox only) — confirmed live this session.** The Cowork sandbox served a truncated 186-line copy of a 199-line script and could not execute it. **Authoritative edits go through the file tools (Windows `E:\dev`); never `git commit`/`push` from the sandbox.** Push from **Windows**; pull on **M6**.
- **`docs/Futures_Odds/` is gitignored.** Raw `.docx`/`.png`/text exports do NOT sync. Pattern: parse → `data/futures-imports/<book>-<YYYY-MM-DD>.json` (tracked) → ingest that on M6.
- **Sandbox network egress is blocked** to Supabase / TheOddsAPI. All DB writes + report runs happen on **M6**.
- **Dated historical imports set `captured_at = snapshot_time`** (the export's real date). The engine now windows on `snapshot_time` so these no longer age out.
- **Unique index `uq_futures_odds_snapshot`** on `(market_type, team, book, snapshot_time)` — idempotent per book per snapshot. Intra-day duplicates (e.g. a stray `12:00Z`) are distinct rows; clean them with a targeted `delete ... where snapshot_time='...'`.
- **PowerShell ≠ bash.** Heredocs (`python3 - <<'PY'`) only work in the M6 bash shell, not Windows PowerShell. Use `scripts/ingest_futures_json.py` instead.

---

## 3. Remaining tasks

### B. Deploy end-to-end (so the tab/button work)
- **B1 —** `supabase functions deploy dispatch-futures-report`; `supabase secrets set GITHUB_DISPATCH_TOKEN=<fine-grained PAT, Actions:read+write on platinum-rose/NFL_Platinum_Rose>`. Optional `GITHUB_REPO`.
- **B2 —** Add `ANTHROPIC_API_KEY` to GitHub repo secrets (live narratives). Optional repo var `FUTURES_NARRATIVE_MODEL` (default `claude-sonnet-4-6`).
- **B3 — DONE** (first live report generated 2026-06-26). Re-run anytime: `node agents/futures-intel-report-v2.js --season 2026 --trigger manual`.
- **B4 —** Build + deploy the dashboard to M6 so the **Futures Report** tab renders the new HTML (sparklines included — it renders stored report HTML in an iframe, so no React work needed) and **Regenerate** hits the edge function. Verify `VITE_VAULT_BACKEND=supabase` on M6.

### Value-spots / divergence (expectation correction)
- Value-spots are **sharp-vs-public** divergence. We have two **sharp** books (betonline, bookmaker) but the **public** books (DK/FD/BetMGM) only price the **Super Bowl**. So divergence currently can only fire on SB. To populate conf/div/playoffs/wins value-spots, add **public-book exports** for those markets (or wait for sportsbooks to open them pre-season). Empty Value Spots today is correct, not a bug.

### History
- **No Feb–Apr source data exists** (confirmed with Andy). Earliest export is `BKR_Futures_20260517`. Series baseline = **mid-May**. Forward retention is automatic. If older exports surface, parse → `data/futures-imports/` → `ingest_futures_json.py`.

### C. Phase 1.5b — automated win-total capture (TheOddsAPI, ~Jul–Aug)
- When `americanfootball_nfl_season_wins` opens, grab a live sample on M6, then add a `totals`-market parser to `agents/futures-odds-ingest.js` (writes `line`+`over_price`+`under_price` for `market_type='wins'`).

### D. Phase 4 — Deep Analysis Engine (THE PRODUCT)
- Upgrade the narrative into a full analyst pass: recommended position + conviction per category, evidence-cited argument (expert signals by source, line movement, divergence), cross-market best-bets summary (top of report), contrarian/fade angles + stake sizing. Multi-pass: assemble evidence → Claude analyst → structured recommendations JSON → render; store in `futures_reports.model`. Now has real multi-date, multi-book input to reason over.

### E. Coverage / sources (deferred)
- E1 Email-newsletter ingest (none). E2 Automated sharp-tweet ingest (`x-sharp-ingest.js` dormant; needs self-hosted RSSHub on M6). E3 Confirm `GROQ_API_KEY` in GitHub secrets pre-week-1.

---

## 4. Handy commands

**Ingest a parsed JSON (M6):** `python3 scripts/ingest_futures_json.py data/futures-imports/<book>-<date>.json` (add `--dry-run` to preview).

**Parse a Bookmaker docx → JSON:** `python3 scripts/ingest_bookmaker_docx.py --file docs/Futures_Odds/<file>.docx --dry-run --out data/futures-imports/<name>.json`

**Run the report (M6):** `node agents/futures-intel-report-v2.js --season 2026 --trigger manual` (`--sample --dry-run` = offline smoke test; `ODDS_SINCE=2026-05-01` floors the window).

**Verify ingest:** `select book, snapshot_time::date, count(*) from futures_odds_snapshots group by 1,2 order by 1,2;`

---

## 5. Suggested order for next session
B1–B2 (deploy dispatch + secrets) → B4 (dashboard rebuild so the tab shows the redesigned report) → D (the analysis engine). Add public-book exports whenever available to light up value-spots. C when TheOddsAPI season-wins opens.
