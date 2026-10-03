# 2026-10-03 14:15 PT — Claude (Cowork): Week 4 full-text article pass + context lanes

Andy's ask: articles were being missed (Evan Abrams' weekly primer, a dozen-plus Action Network archive pieces,
VSiN best-bets columns). The fix is to read them in full, extract picks/trends/news per game, verify them, and update the write-ups.

## What changed
1. **Local full-text archive** — `scripts/intel/archive_week_articles.mjs` pulls the week's Supabase notes (read-only) plus the
   Action Network NFL archive pages, re-fetches betting outlets in full (r.jina.ai, falls back to direct HTML when jina returns its
   rate-limit JSON), and saves `data/intel/articles/2026-w04/<source>/<slug>.md` (gitignored, local only). Index:
   `data/intel/articles/2026-w04/index.json` + `reports/intel/article-archive-2026-w04.md`. W4: 604 articles; 33 Supabase bodies were
   truncated at the 20k cap and 78 are over 20k locally. Flags: `--max N --an-pages N --refetch --refetch-small` (keep ~20/call; the bridge times out).
2. **Abrams primer** is an embedded app; `scripts/intel/primer_feed.py` reads its public JSON feed into
   `data/intel/extracted/2026-w04-primer-intel.json` (169 trend notes, 32 system plays, per-game QBs/coaches/referee/public splits).
   Kept local (verbatim notes; gitignored).
3. **Hand-extracted picks** — `data/intel/extracted/2026-w04-article-picks.json`: 118 picks with person, url, market, line, flags, short quote
   (Erickson primer, Makinen, Tuley, Reynolds, Youmans, Cohen, Shepardson, Walsh PRO, Radowitz, Pulver, AN previews, Giffen, Conner, Servodidio, PFF, BettingPros SGP legs).
4. **Verifier** (`verify_expert_rows.py`) loads them as `kind=article` (117/118 verified; Pulver "Bengals ML +120" rejected for the wrong side),
   adds context lanes (159 trends, 31 systems, ~80 news headlines matched by nickname and dated after the team's last game), handles `pass`/`alt`/`best` flags.
5. **build.py** adds per-game "📊 Trends & systems" and "📰 News & angles" rollups; per-expert block shows passes.
6. **Narratives** updated for all 15 games with the new named experts, systems/trends and news. **NE@BUF projection moved BUF by 8 → BUF by 6**
   and the lean flipped to NE +7 (6–4 named experts plus five NE systems). Other leans unchanged; counts/updated lists noted in each Why.
7. `non-player-names.json`: + Matt Youmans, Trent Conner (analysts), Mike Vrabel (coaches). Roster gate PASS; `--no-export` build OK (4200 lines); dist restored.

## Not committed on purpose
`scripts/master-intel/build_site.py` (someone else's uncommitted change), roster fetch outputs (`espn-full-rosters-latest.json`, `roster-map-latest.json`), primer feed files.

## Open
- Ingestion tickets: raise the 3-picks/article extractor cap; raise the 20k Supabase body cap (or store full text locally as here); make pull.mjs read bodies;
  add the jina-error check to research-intel-ingest; schedule archive_week_articles + primer_feed weekly (Thu and Sat).
- Coaching-staff file `data/nfl-rosters/coaching-staff-2026.json` (primer gives HCs/referees; coordinators needed); coaching trends for Week 5.
- Expert season records (needs a read-only W2 pull). The card + ticket names (Andy's go-ahead). Optional Obsidian mirror of the archive.
- Stale `.git/HEAD.lock` / `.git/index.lock` and `_to_delete/` need deleting by Andy (bridge can't delete).

## Addendum (evening, same day)
- `553e261` article classifier (`scripts/intel/classify_week_articles.py`): W4 archive = 244 preview · 173 team news · 122 W3 recap · 64 general · 1 out of window. News lane + digests skip recaps.
- `e6d6988` caps: body 20k → 200k chars (`BODY_MAX_CHARS`, `htmlToText`), body picks 8 → 60, analytical 8/16 → 48/60.
- `f57656b` every feed's article body now goes through the pick-language-gated parser (`agents/lib/analytical-picks.js`); colon-cue bug fixed ("Pick:" never matched). W4 archive check: 61/66 known picks from 66 lines (old open regex: 50/66 from 134). RSS teasers keep the old extractor.
- Not yet observed on a live ingest run (code + unit tests + archive replay only). Check the next run's research_pick_signals counts per source.
- Still open: schedule archive_week_articles + primer_feed weekly; coaching-staff file; Week 5 coaching trends; expert season records; the card.
