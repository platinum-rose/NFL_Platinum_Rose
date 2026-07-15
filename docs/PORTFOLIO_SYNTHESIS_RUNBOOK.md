# NFL Portfolio Synthesis Runbook (A/B) — S274

**Built:** 2026-07-15 · **Run from:** Windows PowerShell · **Repo:** `E:\dev\projects\NFL_Dashboard`

Two-stage pipeline that turns everything the futures report ingests (odds across all
books, line movement, expert/podcast/article intel) into a **ranked, reviewable
betting portfolio** produced by two top-tier models and diffed for conviction.

> **Decision support only.** The system proposes; you decide. Nothing here places a
> bet or moves money. Every play carries its single strongest *disconfirming factor*
> — read that first. Sizing and whether to play at all are entirely your call.

## Why two stages

1. **`agents/portfolio-dossier.js`** — reads Supabase and pre-computes the decision-
   relevant structure so the models reason over *signal*, not raw rows: per market/team
   it derives the vig-stripped fair probability (median across books), the best price +
   which book holds it, `value_gap` (fair minus best-price implied — positive = you're
   getting a better number than fair), cross-book divergence, per-book line movement,
   and an aggregated article/expert/podcast lean. Writes `dossier-<date>.json` (+ `.md`).

2. **`agents/portfolio-synthesize.js`** — sends the dossier to **Opus 4.8** and
   **Fable 5** under a strict output contract (market, price, fair prob, edge, confidence,
   thesis, *disconfirming factor*, and a Week-1 timing layer), then **diffs** them:
   plays both models surface = high conviction; plays only one surfaces = flagged for your
   judgment. Writes `portfolio-<date>.html` (+ `.md`, + `.raw.json` for audit).

## The Week-1 correlation / timing layer

Each futures view is assessed for whether a near-term result is a **price catalyst**:
- `timing.action = "wait"` — a Week-1 result will likely give a materially better number;
  the play lists the trigger (e.g. "Team loses Week 1") and expected move.
- `timing.action = "bet_now"` — the value is now and won't improve.
- `correlated_week1` — Week-1 sides/totals correlated with the futures thesis, as a
  complement or a hedge.

This is exactly your "wait for better odds after a particular Week-1 result" ask.

## Prereqs

```powershell
cd E:\dev\projects\NFL_Dashboard
Test-Path .env      # must be True — needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
```
Run **after** the futures ingest so the odds are current (they are, as of the S273 batch).

## Run it

```powershell
# 1. Assemble the dossier (reads Supabase; no model calls, no cost)
node agents\portfolio-dossier.js --season 2026
#    optional: --since 2026-06-01  to bound the snapshot history

# 2. Synthesize the A/B portfolio (calls Opus 4.8 + Fable 5 — this is the metered step)
node agents\portfolio-synthesize.js --dossier .nfl\portfolio\dossier-<date>.json
#    the dossier step prints the exact --dossier path to paste here

# 3. Open the portfolio
Start-Process (Get-ChildItem .nfl\portfolio\portfolio-*.html | Sort-Object LastWriteTime | Select-Object -Last 1).FullName
```

Useful flags on the synthesis step:
- `--only opus` (or `--only fable`) — run a single model first to sanity-check cheaply
  before spending the metered Fable run.
- `--max-plays 12` — cap the core portfolio size (default 15).
- `--models claude-opus-4-8,claude-fable-5` — override the model set.

**Cheap dry pattern:** run `node agents\portfolio-dossier.js` (free), eyeball
`dossier-<date>.md`, then `node agents\portfolio-synthesize.js --only opus ...` before
the full A/B run.

## Read the output

- **High conviction (both models)** — green cards; both Opus and Fable independently
  surfaced the play. Strongest signal.
- **Flagged (one model only)** — amber; a real divergence to resolve with your own read.
- **Watch list** — on the radar, not yet a play.
- **Construction notes** — each model's take on correlation clusters and coverage gaps.

Offseason caveat: only the Super Bowl market is broadly multi-book right now; division/
conference/awards/playoffs coverage is thin until preseason, so confidence there is
correctly lower. Re-run weekly as markets open and the podcast re-extraction backfills
richer intel.

## Fallback — no Anthropic API credits

Anthropic **API credits are separate from any Claude subscription**. If the key's org
is unfunded you'll get `HTTP 400 … credit balance is too low`. Two options:

1. Fund it: [console.anthropic.com](https://console.anthropic.com) → Plans & Billing → add
   credits / auto-reload for the org that issued the key, then run the Opus + Fable A/B.
2. Run on GPT-4o now (your OpenAI key is funded) and rerun the true A/B later:
   ```powershell
   node agents\portfolio-synthesize.js --models gpt-4o --dossier .nfl\portfolio\dossier-<date>.json
   ```
   Models starting `gpt-`/`o1-`/`o3-` route to OpenAI; everything else to Anthropic. You
   can also mix once funded: `--models claude-opus-4-8,gpt-4o` for a cross-vendor A/B.

## Notes

- Both default models are Anthropic, so `ANTHROPIC_API_KEY` covers the standard A/B pass;
  `OPENAI_API_KEY` powers the gpt-4o fallback.
- Non-destructive: writes only to `.nfl/portfolio/` (gitignored working artifacts).
- To add later: route the podcast **re-extraction** first (fuller intel), and once you
  add the Fable branch there, the same A/B pattern extends end-to-end.
- **Never auto-bet.** Consistent with ADR-0011 / propose-don't-approve — human read gate
  is mandatory, no money moves without you.
