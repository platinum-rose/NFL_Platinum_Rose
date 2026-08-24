# Futures Intel Report — Phased Build Plan & Spec

**Owner:** ATLAS / NFL Dashboard · **Created:** 2026-06-25 (S221) · **Status:** Phase 1 ✅, Phase 2 in progress

On-demand, fully-analyzed NFL futures report regenerable at will throughout the season,
surfaced in the dashboard's **Futures Report** tab and via a Claude Desktop skill.

## Tracked futures categories (8)
Super Bowl winner · Conference winners · Division winners · Total team wins ·
To make the playoffs · Super Bowl exact matchup · Most wins · Least wins.

## Architecture
- **Engine:** `agents/futures-intel-report-v2.js` — assembles odds consensus, 7d line
  movement, sharp/public divergence, futures-relevant intel notes, pick signals, and
  sharp tweets into a structured model; renders Markdown + styled HTML.
- **Storage:** Supabase `futures_reports` (migration 026) — html + markdown + JSON model
  + coverage audit. Also writes Markdown to `vault_notes` (`NFL/Futures/FuturesIntel-*`).
- **Trigger:** `.github/workflows/futures-intel-report.yml` (schedule + `workflow_dispatch`)
  → run v2 agent. On-demand UI button → `supabase/functions/dispatch-futures-report`
  (holds GitHub PAT) → workflow_dispatch.
- **UI:** `src/components/futures/FuturesIntelReport.jsx` — reads latest report, renders in
  isolated iframe, Regenerate button + poll.

## Data ingest source status (verified S221)
| Source | Agent | Status |
|---|---|---|
| Sportsbook futures odds | futures-odds-ingest.js | ✅ daily; books DK/FD/BetMGM/Caesars/BetOnline/Bookmaker |
| Articles / RSS (9 feeds) | research-intel-ingest.js | ✅ 2×/day |
| Podcasts (4 feeds) | podcast-ingest.js | ✅ weekly (needs GROQ_API_KEY confirmed pre-week-1) |
| Tweets | tweet-ingest.js | ⚠️ manual paste only |
| Sharp X accounts | x-sharp-ingest.js | ❌ DORMANT (needs self-hosted RSSHub on M6) |
| **Email newsletters** | — | ❌ **none — DEFERRED** |

Coverage audit in every report makes the above visible per-run (covered / no-data / deferred).

## Phases
- **Phase 1 — Engine + HTML ✅** (S221): 8 categories, coverage audit, expert grouping,
  hybrid Claude narrative (light), Markdown + HTML, Supabase storage. Most/Least/Total wins
  currently use a **proxy** ranking (see Phase 1.5).
- **Phase 2 — Delivery plumbing (in progress):** Futures-tab Intel Report panel + Regenerate
  button; workflow_dispatch; dispatch edge function.
- **Phase 3 — Claude Desktop skill:** `nfl-futures-report` runs ingest → v2 engine → report,
  regenerable on demand all season.
- **Phase 1.5 — Win-total line capture:** add `totals`-market parsing + a `line` column to
  futures_odds_snapshots so Total/Most/Least wins use real win-total numbers instead of the
  Super Bowl proxy. Needs live TheOddsAPI response-shape verification.
- **Phase 4 — Deep Analysis Engine (the product):** upgrade the narrative layer into a full
  LLM analyst pass over the entire assembled corpus.

## Phase 4 — Deep Analysis Engine requirements (confirmed with Andy, S221)
The report's purpose is *reasoned recommendations*, not just stats. The analyst pass must produce:
1. **Recommended position + conviction** — per category/team, a clear side (or "pass") with a
   conviction/confidence rating.
2. **Detailed, evidence-cited argument** — multi-point reasoning that explicitly cites the
   supporting/refuting expert signals (by source), line movement, and sharp/public divergence.
3. **Cross-market best-bets summary** — top-of-report executive synthesis ranking the
   highest-conviction plays across all 8 categories.
4. **Contrarian / fade angles + stake sizing** — where public money is overweight (fade spots),
   plus suggested unit/stake guidance per play.

Design note: the v2 engine's structured model is the intended LLM **input corpus**. Phase 4 adds
a multi-pass flow: assemble evidence → LLM analyst → structured recommendations → render.

## Deferred / backlog
- Email-newsletter ingest agent (Gmail/IMAP).
- RSSHub-backed automated sharp-tweet ingestion (x-sharp-ingest revival).
- Win-total line capture (Phase 1.5).

## Notes / hazards
- **NTFS-mount truncation** hit during S221: the Linux↔Windows mount served a stale/truncated
  copy of a large agent file mid-edit. Authoritative edits go through the file tools; verify on
  M6/GHA, not the sandbox mount (see vault `CLAUDE.md`).
