# 2026-07-23 Handoff - Futures Watchlist + Podcast Reconciliation

## Standing guardrails

- Do not make live model/API calls without explicit approval.
- Do not persist production recommendations unless explicitly approved.
- Do not modify open parlay slots.
- Use `npm.cmd` on Windows PowerShell.
- Repo is dirty with many unrelated changes. Do not revert user/unrelated work.

## High-level state

This session finished two connected tracks:

1. Podcast/futures intel report reconciliation:
   - Rebuilt podcast narrative summaries and transcript deep dives from local diarized exports.
   - Published canonical reconciled podcast notes to Obsidian under:
     `E:\data\Obsidian\NFL\Podcasts\_reconciled`
   - Added deterministic speaker-attribution fixes for the July 21 Sharp or Square training camp episode and July 22 The Favorites QB Rankings Part 2 episode.
   - Added/updated watchlist/timing conjecture handling so lines like Simon Hunter's Chiefs "starting 1 and 3" comment can surface as entry-timing intel.

2. Futures analyst human watchlist:
   - Added a durable watchlist file:
     `data/futures-imports/futures-watchlist-2026.json`
   - Wired `agents/portfolio-synthesize.js` to load the watchlist by default or via `--watchlist`.
   - Added deterministic `Human Watchlist Review` rendering to HTML/Markdown/raw JSON so every watchlist target is shown even if the model ignores, kills, or passes it.
   - Added workflow doc:
     `docs/FUTURES_WATCHLIST_WORKFLOW.md`

## Current futures watchlist

`data/futures-imports/futures-watchlist-2026.json` currently contains:

- Giants win total over.
- Bengals ATB:
  - wins over
  - make playoffs
  - AFC North
  - AFC
  - Super Bowl
- Saints make the playoffs only.
- Chiefs:
  - Super Bowl
  - Super Bowl exacta/matchup coverage

The user specifically changed Saints from "win total + division" to only "Make The Playoffs." This is already updated in both the watchlist JSON and workflow doc.

## Latest user-run model output

User ran:

```powershell
node agents\portfolio-synthesize.js --shadow-slim --models gpt-4o --skeptic-model gpt-4o --risk-model gpt-4o --dossier .nfl\portfolio\dossier-2026-07-23.json --no-persist --out-suffix watchlist
```

Output:

- Watchlist loaded: 4 targets.
- Stage 1: 6 plays, 3 watch.
- Skeptic: 2 survived, 4 killed.
- Risk/editor: 1 final, 1 passed.
- Validator: 0 valid, 1 invalidated.
- Valid structures: 1 hedge basket, 1 ladder.
- Final book: 0.
- Report written:
  - `.nfl/portfolio/portfolio-2026-07-23-watchlist.html`
  - `.nfl/portfolio/portfolio-2026-07-23-watchlist.md`
  - `.nfl/portfolio/portfolio-2026-07-23-watchlist.raw.json`

Interpretation:

- The validator correctly prevented negative/unsupported standalone bets from landing in the final book.
- The report still produced a valid Giants ladder and hedge basket, including Chiefs vs Seahawks exacta coverage.
- Before the latest code patch, Bengals ATB and Chiefs SB were under-served in the report because the model did not explicitly address every human watchlist item.

## Important code changes after that run

After the user's run, `agents/portfolio-synthesize.js` was patched to add deterministic watchlist review output:

- `WATCHLIST_PATH`
- `loadWatchlist()`
- `buildWatchlistReview()`
- watchlist row/quote/status helpers
- `Human Watchlist Review` HTML and Markdown section
- `human_watchlist_review` in raw JSON
- TOC link for Human Watchlist

This patch has NOT been exercised by another live model run yet. It has only been verified offline.

## Verification run after latest patches

Offline only:

```powershell
node --check agents\portfolio-synthesize.js
npm.cmd run test:portfolio-corpus
```

Result:

- Syntax check passed.
- Portfolio corpus passed 5/5:
  - fabricated-exacta-quarantine
  - partial-ladder-unresolved-leg
  - reversed-exacta-resolution
  - scenario-book-bills-packers
  - supplemental-outperformers

No live API/model call was made after the watchlist-review patch.

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, WORKING-CONTEXT.md, and handoffs\2026-07-23-futures-watchlist-podcast-reconciliation-handoff.md first. Current state: podcast narrative/deep-dive reports were rebuilt and reconciled notes were published to Obsidian; the futures analyst now has data\futures-imports\futures-watchlist-2026.json with Giants Over wins, Bengals ATB, Saints Make Playoffs only, and Chiefs SB/exacta coverage; agents\portfolio-synthesize.js has a new deterministic Human Watchlist Review section, but that patch has only been verified offline, not by another live model run. Guardrails: do not make a live model/API call, write to Supabase, persist production recommendations, or modify open parlay slots without explicit approval. Recommended next: with approval, rerun the watchlist synthesis using --no-persist and --out-suffix watchlist-v2, then inspect the new Human Watchlist Review section and confirm every watchlist item is visible even if no final bets survive validation.
```

## Recommended next step in fresh session

If the user approves another live model call, rerun:

```powershell
cd E:\dev\projects\NFL_Dashboard
node agents\portfolio-synthesize.js --shadow-slim --models gpt-4o --skeptic-model gpt-4o --risk-model gpt-4o --dossier .nfl\portfolio\dossier-2026-07-23.json --no-persist --out-suffix watchlist-v2
```

Then inspect:

```powershell
Start-Process "E:\dev\projects\NFL_Dashboard\.nfl\portfolio\portfolio-2026-07-23-watchlist-v2.html"
```

Expected improvement:

- The report should include a `Human Watchlist Review` section showing every watchlist item deterministically from the dossier:
  - current quote
  - fair probability
  - edge/value gap
  - sim gap when present
  - status such as `negative current edge`, `simulation below market`, `thin market`, or `reviewable`

## Useful current dossier summary from local check

From `.nfl/portfolio/dossier-2026-07-23.json`:

- Giants Over 7.5:
  - `-103@bookmaker`
  - edge about `-3.45%`
- Bengals ATB:
  - wins over 9.5 `+117@bookmaker`, edge about `-3.74%`
  - playoffs `-200@betonline`, value gap `0`, sim gap about `+1.6%`
  - AFC North `+180@betus`, value gap about `-3.18%`
  - AFC `+1000@betus`, value gap about `-0.87%`
  - Super Bowl `+2200@betmgm`, value gap about `-0.44%`
- Saints Make Playoffs:
  - not rechecked after the last user edit, but should resolve through `playoffs` market on next watchlist review.
- Chiefs:
  - Super Bowl `+1600@betonline`, value gap about `-1.02%`, sim gap about `-1.49%`
  - matchup examples:
    - Chiefs vs Rams `+3000@betus`, sim gap about `+0.13%`
    - Chiefs vs Seahawks `+5000@betus`, sim gap about `-0.68%`

## Key files touched in this thread

Futures/watchlist:

- `agents/portfolio-synthesize.js`
- `data/futures-imports/futures-watchlist-2026.json`
- `docs/FUTURES_WATCHLIST_WORKFLOW.md`

Podcast reconciliation:

- `agents/lib/speaker-attribution.js`
- `agents/podcast-host-summary.js`
- `scripts/build-podcast-narratives.js`
- `scripts/build-podcast-transcript-deep-dives.js`
- `scripts/publish-reconciled-podcast-notes.js`
- `data/podcasts/episode-metadata-overrides.json`
- `tests/unit/speakerAttribution.test.js`
- `tests/unit/podcastHostSummary.test.js`
- generated `docs/podcast-narratives/*`
- generated `docs/podcast-transcript-deep-dives/*`
- Obsidian notes under `E:\data\Obsidian\NFL\Podcasts\_reconciled`

Other files are dirty from prior work; inspect before staging.

## Git/worktree note

The worktree has many modified/untracked files, including unrelated or prior-session changes. Do not use broad `git add -A` or revert anything blindly. Stage only intended files after reviewing `git status --short`.
