# Handoff: Week 3 intel refresh, pick-extraction fixes, futures review + Circa run plan

**Date:** 2026-09-22 18:07 PT → 2026-09-23 00:55 PT (Tue→Wed, Week 3 TUE-WED mode)
**Branch:** `wip/yahoo-sync` · **Author:** Claude
**Commits:** `229042d`, `45c52e7`, `d438484`, `de8145e`, `75e85a5` (pushed) + this handoff commit.
**Resume trigger:** Andy's proxy (his sister) is at Circa Wed 9/23 afternoon and will send live Circa odds/photos. Reconvene then.

## 1. Synthesis session state
- Still pre-Phase 2 (no evidence digest yet). Andy wants intel complete before the digest.
- Preflight: **2 stale of 21** — only Week 3 prop boards (FRI+) and the legacy podcast-recs file. Refreshed this session: roster map (`npm run article:player-props`, ESPN; the GH workflow only refreshes Supabase `nfl_rosters`), alpha packet, player availability (982 events), BKR current lines (`data/odds/BKR_current_lines_0922_1859`, Andy paste).
- Supabase `player_injuries` next scheduled run Wed 07:00 PT (Tue has no cron) — fine.
- Article queue for the digest: `scratch/w03-article-queue.md` (5 ready-to-parse, incl. Action Network betting primer; AN RSS only exposes ~12 items so most AN Week 3 content never reaches `research_intel_notes`). Not yet parsed.

## 2. pick-extraction.js (commits 229042d, d438484, de8145e, 75e85a5)
- Week-scoped: target week = earliest unfinished game (`PICK_WEEK` override); transcript window; only picks matching a target-week game promoted; out-of-window transcripts untouched. `agents/lib/pick-week-scope.js`.
- WSH/WAS, LA/LAR, JAC/JAX normalisation (Washington picks were silently dropped all season).
- Teaser legs relabelled `pick_type: 'teaser'` (incl. Wong detection) at the teased line, rationale prefixed `[TEASER — 6-pt Wong teaser leg: …]`; `picksDatabase.gradePick` grades teaser like spread; tracker shows "(teaser leg)". `agents/lib/pick-normalize.js`.
- Same-episode/same-host dedupe (sides keyed on resolved team code).
- Tests: `tests/unit/pickWeekScope.test.js`, `tests/unit/pickNormalize.test.js`; 108/108 in related suites; eslint clean.
- **Not yet run for real.** Andy's dry run (pre-teaser fix) looked right: 6 transcripts in window, 25 untouched. Expect ~6 teasers, ~4 duplicates on re-run. Real run = Supabase write → Andy's call. GH Actions uses `main`, so the fix isn't live in automation until merged.
- Sharp or Square YouTube picks (9, host-attributed) live in `podcast_gemini_intel`, never promoted to `user_picks` by design.

## 3. Futures review
- Antigravity 9-bet expansion dossier (`handoffs/2026-09-22-futures-portfolio-math-audit-dossier.md`) audited: `handoffs/2026-09-22-2230-claude-futures-exactas-strategic-audit.md` + `scratch/claude-futures-audit-2026-09-22.py` / `scratch/claude-futures-fair-2026-09-22.json` (fair = de-vigged Circa/BKR/BEO + Polymarket).
- Framework agreed with Andy: fair price is a ruler, not a gate; normal premium OK; above-normal only with a thesis.
- **Actionable venues for exactas: Kalshi, BetUS, Circa (via Andy's sister, cash ticket, no proxy concern).** BKR never offers exactas; BEO currently has none. Outrights/conf/div/playoffs/wins at all books.
- Andy's thesis: **Ravens 14-3 or 15-2, strong shot at #1 seed.** Holding Patriots until after Week 4 (buy-low).
- BetUS full futures board saved (gitignored dir): `docs/Futures_Odds/BetUS_Odds_0922` (compare vs `BetUS_Odds_0916`; 198/256 matchups repriced).
- Circa division board (32 teams + rotation #s) added to `data/futures-imports/circa-2026-09-22-live-futures-markets.json` (`marketSnapshots.division`, `rotationNumbers.division`). Circa conference boards carry ~18% hold; division boards ~8%.

## 4. Circa run plan (Wed afternoon) — cheat sheet
Doc: **"Circa Run Cheat Sheet — Wed 9/23"** (claude.ai Docs, https://claude.ai/code/artifact/f0663899-2a00-4bdc-a1d2-f6b1cd6a8e10). $100 total:
| Bet | Stake | Price | Walk away if |
|---|---|---|---|
| Ravens × Packers (14557+14577) | $10 | +10525 | To win < $1,030 |
| Ravens × Eagles (14557+14573) | $15 | +4900 | To win < $686 |
| Ravens over 11.5 wins | $40 | Circa unknown | Circa < +130 → Andy places Kalshi 12+ ≤42¢ or BetUS +125 |
| #2: SEA NFC + BAL AFC N + DET NFC N | $10 | +3664 | legs below mins |
| B: BAL N + DET N + LAR W + HOU S | $15 | +4505 | |
| A: LAR NFC + BAL N + HOU S + KC W + PHI E | $10 | +6505 | |
Open questions for the live board: Circa win-total line/price for Ravens; whether Circa takes 4-/5-leg futures parlays and div×conf mixes; any price drift. Noted: Circa Packers NFC North +500 (vs +350/+380 elsewhere, likely RT injury) and Giants NFC East +975 (Dart injury; other books stale).

## 5. Next session
1. Read this handoff + the cheat sheet doc (read it via the Docs connector; Andy may edit it).
2. When live Circa photos arrive: re-price every planned leg, confirm parlay leg limits, adjust tickets, update the doc.
3. After tickets are placed: Andy logs them; update the recommendation ledger in DEV project doc `claude/recommendation-ledger-2026.md` (proposed vs placed).
4. Then resume synthesis: Phase 2a → 2b digest (parse `scratch/w03-article-queue.md` items), Bills-credit play (lands Wed by 7pm ET), TNF early read (ATL@GB).
5. Pending Andy decisions: real `pick-extraction.js` run; Supabase sync of 19 Week 2 ticket numbers (from prior handoff).

## Guardrails honoured
No bets placed, no Supabase writes, no `git add -A`; only this session's files staged. `docs/Futures_Odds/` is gitignored (left untracked). Pre-existing untracked `betonline-2026-09-09.json` / `price-watch-list-2026.json` left alone.
