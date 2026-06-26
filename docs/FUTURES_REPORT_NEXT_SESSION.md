# Futures Intel Report — Next-Session Task List

> **Purpose:** pick up the NFL Futures Intel Report build in a fresh session without prior chat context.
> Read this top-to-bottom first. Repo root: `~/projects/NFL_Dashboard` (M6 canonical) / `E:\dev\projects\NFL_Dashboard` (Windows Cowork clone).
> **HEAD at handoff:** `d1b9e58` on `main` (pushed + pulled to M6).

---

## 1. Status snapshot (2026-06-25)

**Done & live**
- Migrations `026_futures_reports` + `027_win_totals_line` **applied** in Supabase (also bundled in `supabase/APPLY_futures_migrations.sql`).
- Report engine `agents/futures-intel-report-v2.js` (8 categories, coverage audit, expert grouping, hybrid Claude narrative, Markdown + styled HTML). Verified via `--sample`.
- Bookmaker futures **ingested** to `futures_odds_snapshots`: **155 rows @ `snapshot_time='2026-06-25T00:00:00Z'`** (SB 32, conf 16/16, divisions 4×7, playoffs 32, wins 31). AFC East had no odds in the export (expected).
- Parser `scripts/ingest_bookmaker_docx.py` (+ staged data `data/futures-imports/bookmaker-2026-06-25.json`).
- Manual win-totals path `agents/win-totals-ingest.js` + `data/win-totals/2026.template.json`.
- Most/Fewest-wins outright keys added to `agents/futures-odds-ingest.js`.
- Workflow `futures-intel-report.yml` → runs v2, has `workflow_dispatch` (inputs: trigger, season, dry_run).
- UI tab **Futures Report** (`src/components/futures/FuturesIntelReport.jsx`, wired in `App.jsx` + `Header.jsx`).
- Dispatch edge function `supabase/functions/dispatch-futures-report/index.ts`.
- Skill `skills/nfl-futures-report/SKILL.md`. Plan `docs/FUTURES_REPORT_PLAN.md`.

**Built but NOT yet deployed/active**
- Dispatch edge function — **not deployed** (`supabase functions deploy dispatch-futures-report`) and secret `GITHUB_DISPATCH_TOKEN` **not set**.
- `ANTHROPIC_API_KEY` — **not yet in GitHub Actions secrets** (needed for live narratives in the scheduled/dispatched workflow).
- Dashboard with the new tab — **not built/deployed** to M6 yet.
- Parser uniform-keys fix in `scripts/ingest_bookmaker_docx.py` — **committed? NO.** Edited on Windows disk after the `d1b9e58` push; **uncommitted**. See Task A0.

**Data state**
- `futures_odds_snapshots`: 155 Bookmaker rows (one date). Consensus is **single-book** → sharp/public divergence + value-spots stay empty until a 2nd book loads.
- `futures_reports`: empty (report not generated against live data yet).

---

## 2. Environment gotchas (read before touching anything)

- **NTFS↔Linux mount truncation (sandbox only).** The Cowork sandbox served stale/truncated copies of actively-edited files. Authoritative edits go through the file tools (Windows `E:\dev`). **Never `git commit`/`push` from the sandbox** — it would capture truncated files + spurious diffs. Push from **Windows**; pull on M6.
- **`docs/Futures_Odds/` is gitignored.** Raw `.docx`/screenshots do NOT sync via git. Pattern: parse to `data/futures-imports/<book>-<date>.json` (tracked) and ingest that on M6.
- **PostgREST bulk upsert needs uniform keys** (`PGRST102 "All object keys must match"`). All objects in one POST must share the same key set. Parser fix addresses this going forward (Task A0); the manual REST snippet normalizes keys client-side.
- **PowerShell line continuation is a backtick `` ` ``**, not `\`. Give Windows commands as single lines.
- **Sandbox network egress is blocked** to Supabase / TheOddsAPI (HTTP 000). GitHub is reachable for read (`git ls-remote`) but do not push from sandbox (see truncation). DB writes run on M6 or via allowlisting Supabase in Capabilities + a fresh session.
- **Unique constraint:** `futures_odds_snapshots` upserts on `(market_type, team, book, snapshot_time)` — idempotent per book per date.

---

## 3. Tasks

### A. Unblock & data ingestion

**A0 — Commit the parser uniform-keys fix (FIRST).**
`scripts/ingest_bookmaker_docx.py` `to_snapshot_rows()` now emits all keys (line/over_price/under_price/implied_prob default `None`) so the script's own upsert won't hit `PGRST102`. It's edited on Windows but uncommitted.
- From **Windows** `E:\dev\projects\NFL_Dashboard`: `git add scripts/ingest_bookmaker_docx.py; git commit -m "fix: uniform keys in bookmaker ingest"; git push`
- Accept: M6 `git pull` then `python3 scripts/ingest_bookmaker_docx.py --file <docx> --dry-run` shows all rows with identical keys.

**A1 — BetOnline screenshots → schema (HIGH VALUE).**
Files: `docs/Futures_Odds/BEO_*_0602.png` (Jun 2, 2026): `BEO_SB`, `BEO_Conf`, `BEO_Div1/2`, `BEO_RegWins1/2/3`, `BEO_ToMakePlayoffs1/2/3`.
- These are **images** → need a vision/OCR extraction pass (read each PNG, transcribe team/odds; win-total PNGs carry line + o/u).
- Map to `book='betonline'`, `snapshot_time='2026-06-02T00:00:00Z'`.
- Output `data/futures-imports/betonline-2026-06-02.json` (uniform keys), ingest via the REST snippet (Section 4) or the script.
- **Why:** second sharp book → unlocks the report's sharp/public divergence + value-spot logic; second date → real line movement.
- Accept: `select book,count(*) from futures_odds_snapshots group by 1` shows betonline rows; report value-spots populate.

**A2 — `BKR_Odds_0602` (older Bookmaker, Jun 2).**
File: `docs/Futures_Odds/BKR_Odds_0602` (no extension, ~2.8 KB). Confirm format (text? docx? json?) then ingest as `book='bookmaker'`, `snapshot_time='2026-06-02T00:00:00Z'` → gives a Bookmaker **two-date movement** baseline vs the 2026-06-25 rows.

**A3 — Recurring ingest flow.** Decide the cadence for future exports. Options: (a) parse on Windows/sandbox → commit JSON → M6 ingests; (b) allowlist Supabase domain in Cowork Capabilities + fresh session → push from sandbox directly. Document chosen flow in `docs/FUTURES_REPORT_PLAN.md`.

### B. Deploy the report end-to-end (so the tab/button work)

**B1 — Deploy dispatch edge function.**
`supabase functions deploy dispatch-futures-report`; then `supabase secrets set GITHUB_DISPATCH_TOKEN=<fine-grained PAT, Actions:read+write on platinum-rose/NFL_Platinum_Rose>`. Optional secret `GITHUB_REPO` (defaults to `platinum-rose/NFL_Platinum_Rose`).
- Accept: `curl -X POST <func-url>` (anon) triggers a workflow run.

**B2 — GitHub Actions secret.** Add `ANTHROPIC_API_KEY` to repo secrets (Settings → Secrets → Actions) so scheduled/dispatched runs produce live narratives. Optional repo var `FUTURES_NARRATIVE_MODEL` (default `claude-sonnet-4-6`).

**B3 — Generate the first live report.** On M6: `node agents/futures-intel-report-v2.js --season 2026 --trigger manual` (needs `SUPABASE_*` + optional `ANTHROPIC_API_KEY` in `.env`). Confirm a `futures_reports` row + `NFL/Futures/FuturesIntel-Latest.md` vault note + `.nfl/reports/FuturesIntel-*.html` artifact.

**B4 — Build & deploy dashboard.** Build the app and deploy to M6 (per existing deploy flow / `deploy.yml`) so the **Futures Report** tab renders the stored HTML and the **Regenerate** button hits the edge function. Verify `VITE_VAULT_BACKEND=supabase` on M6.
- Accept: tab loads latest report; Regenerate triggers a build and the report refreshes.

### C. Phase 1.5b — automated win-total capture (TheOddsAPI)

**C1 —** When TheOddsAPI opens `americanfootball_nfl_season_wins` (~Jul–Aug), grab one live JSON sample on M6: `curl "https://api.the-odds-api.com/v4/sports/americanfootball_nfl_season_wins/odds?regions=us&markets=totals&oddsFormat=american&apiKey=$ODDS_API_KEY"`. Inspect shape (teams-as-events vs outcomes; where the `point`/line lives).
**C2 —** Add a `totals`-market parser to `agents/futures-odds-ingest.js` (currently only parses `outrights`) → write `line` + `over_price` + `under_price` for `market_type='wins'`. Also verify whether `most_wins`/`least_wins` dedicated keys return data; if not, the engine already derives them from win-total lines.
- Accept: scheduled `ingest-futures` populates win-total lines automatically; report Total/Most/Least-wins use live multi-book data.

### D. Phase 4 — Deep Analysis Engine (THE PRODUCT)

Upgrade the narrative from short verdicts into a full analyst pass over the assembled corpus. Confirmed requirements (Andy):
1. **Recommended position + conviction** per category/team (or "pass").
2. **Detailed, evidence-cited argument** — cite supporting/refuting expert signals (by source), line movement, sharp/public divergence.
3. **Cross-market best-bets summary** — ranked highest-conviction plays across all 8 categories (top of report).
4. **Contrarian / fade angles + stake sizing** — where public is overweight, plus unit guidance.
- Design: multi-pass — assemble evidence → LLM analyst (Claude) → structured recommendations JSON → render into HTML/MD. Store recommendations in the `futures_reports.model`.
- Prereq for full value: ≥2 books loaded (so divergence is real) and live intel/podcast/tweet data in-window.

### E. Coverage / sources (deferred items surfaced in every report's audit)
- **E1 — Email-newsletter ingest** (Gmail/IMAP agent) — none today.
- **E2 — Automated sharp-tweet ingest** — `x-sharp-ingest.js` dormant; needs self-hosted RSSHub on M6 (`RSSHUB_BASE_URL`). Manual tweet paste works now.
- **E3 — Confirm `GROQ_API_KEY`** in GitHub secrets pre-week-1 (podcast transcription).

---

## 4. Handy commands

**Ingest a parsed JSON to Supabase (M6, stdlib only):**
```bash
python3 - <<'PY'
import json, urllib.request, urllib.error
env={}
for l in open('.env'):
    l=l.strip()
    if l and not l.startswith('#') and '=' in l:
        k,v=l.split('=',1); env[k]=v.strip().strip('"').strip("'")
url=env['SUPABASE_URL'].rstrip('/')+'/rest/v1/futures_odds_snapshots?on_conflict=market_type,team,book,snapshot_time'
key=env['SUPABASE_SERVICE_ROLE_KEY']
KEYS=['snapshot_time','captured_at','season','book','market_type','team','selection','odds','price','implied_prob','line','over_price','under_price']
rows=[{k:r.get(k) for k in KEYS} for r in json.load(open('data/futures-imports/FILE.json'))]
req=urllib.request.Request(url,data=json.dumps(rows).encode(),headers={'apikey':key,'Authorization':f'Bearer {key}','Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},method='POST')
try: print('OK',urllib.request.urlopen(req,timeout=30).status,len(rows))
except urllib.error.HTTPError as e: print('HTTP',e.code,e.read().decode()[:600])
PY
```

**Parse a Bookmaker docx → JSON:** `python3 scripts/ingest_bookmaker_docx.py --file docs/Futures_Odds/<file>.docx --dry-run --out data/futures-imports/<name>.json`

**Run the report:** `node agents/futures-intel-report-v2.js --season 2026 --trigger manual` (or `--sample` offline, `--dry-run` no-write).

**Verify ingest:** `select book, market_type, count(*) from futures_odds_snapshots group by 1,2 order by 1,2;`

---

## 5. Suggested order for next session
A0 (commit fix) → A1 (BetOnline, highest value) → B1–B4 (deploy so the tab works) → B3 (first live report) → A2/A3 → C (when markets open) → D (the analysis engine). E-items as you go.
