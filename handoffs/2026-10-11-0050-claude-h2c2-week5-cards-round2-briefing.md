# H2C2 detailed briefing — Week 5 Sunday cards: Opus reruns + Master Intel report DONE → next team recaptures and builds final cards

Written Sun 2026-10-11 ~00:45 PT by Claude Team 2 (Cowork session, linked to Andy's laptop). Required first read is the start brief: `reports/handoff-snapshots/2026-10-11-h2c2-week5-cards/H2C2_START_HERE.md`. This file is the detail behind it. The previous briefing (`handoffs/2026-10-10-2310-claude-h2c2-team2-week5-sunday-briefing.md`) still describes the pipeline; this one supersedes its state.

## 1. Git state at handoff

- Repo `E:\dev\projects\NFL_Dashboard`, branch `main`, ahead of origin (nothing pushed; Andy runs `git push`). The checkout is intentionally dirty (~950 entries from other lanes): commit explicit paths only, never `git add -A`, reset, clean or stash.
- Commits this session (oldest first): `588d225` Lane B (ESPN roster IR/Out group in status fetch + packets, validator BEO-expiry check, prompt number-check rules); `fb2ad66` rebuilt packets (BKR 06:21:29Z / BEO 06:24:03Z); `2660814` 14 Opus per-game outputs; `f04d69f` slate merge + decision-support; `6fe334b` Master Intel inputs; `14dde03` research-only lean restore; `cc2ae6c` + `aaafb25` report/site layout; plus the handoff commit on top.
- Git here leaves `.git/*.lock` and `tmp_obj_*` files after each commit (deletes blocked). Move locks aside: `mv .git/X.lock .git/stale-X-$(date +%s)`. Live Git wins over this prose.

## 2. What happened

1. Andy answered: CHI starter = **Bagent**; no Codex tickets were placed; IND@PIT weather-only Under = research_only; do Lane B first.
2. **Lane B** done (588d225): `roster_ir_out_unconfirmed` group per team in `espn-status-w05.json` and in each packet (AVAILABILITY warning), plus validator FAIL if a tier 2/2− output was generated after the BEO window expired.
3. Andy ran BKR and BEO captures Saturday night (BKR 14 matchups; BEO 1118 rows, 14 games, 130 players, 24 markets, strict sign-off). Packets rebuilt against them.
4. **All 14 games re-run as Opus** on the fresh packets (older Saturday copies in `_superseded/`, `*.sat.*`). Result: every game pass/skip, conflicted, or price moved at skip/research_only. Edges ~0 everywhere (largest: PHI@JAX +0.5, MIN@NO −0.5, LV@NE total +0.5, CHI@GB total −0.5, IND@PIT total −0.5). DEN@LAC conflicted/2− with no pick. Each JSON has a `props` array of 1–4 usage-context candidates.
5. **Slate merge** run: all 14 `stale_for_recommendation`, no rankings; SuperContest five (TEN +7.5, GB +3, PIT −2.5, BAL +3.5, LAC +3.5) + alternates (MIN −2.5, LAR −3, MIA +7, JAX −7.5, SEA −3) with tie-break basis in `reports/bets/2026-w05-opus-decision-support.md`.
6. **Master Intelligence reports** built (`python scripts/master-intel/build.py --week 5 --date 2026-10-11`, needs Python 3.12: `uv run --python 3.12 --with python-docx --with markdown --with beautifulsoup4 ...`). Outputs in `dist/nfl_week5_master_packet/` (gitignored): master + SuperContest md/html/docx/json/pdf, single-file `Platinum_Rose_NFL_Week5_Intel.html`, multi-page `site/`. PDFs need Chromium, which the device VM lacks: render in the cloud (`scripts/master-intel/export_pdf.py`) and commit the file back.
7. Andy asked for a usable parlay menu, not only SuperContest picks. The digest `scratch/w05-synthesis-digest-sat.md` now carries Codex's Saturday leans as **research-only 2− leans** with a `CAUTION Opus rerun: <disposition>, tier <t>, edge ~0` note in the source column (never put a `|` in that column; it breaks the parser). Report now ranks 10 sides, 9 totals, 56 props, and the props pool has 11–33 legs per game. Original Codex digest is at `reports/intel/_bak/w05-synthesis-digest-sat.codex.md`.
8. Layout asks from Andy: game page order = Projection & game script first; the jump bar is no longer sticky; props pool grouped by category then matchup; Props Lab matchup groups are collapsible (closed by default; search opens matches).
9. **Andy's decision (00:30 PT): keep using the already captured BKR/BEO prices; he will not recapture until the morning.**

## 3. Standing facts and caveats

- **Nothing in any output is a live price.** Captures: BKR 06:21:29Z, BEO 06:24:03Z (Sat 23:21/23:24 PT). Use each packet's `expires_for_recommendation_at`; do not recompute. PHI@JAX window lapses ~02:21 PT; the 10:00 PT games ~04:00 PT; later games per their packet field.
- The Master report's ranked sides/totals/props are **research-only menu items at stale prices**, not recommendations. No sportsbook tickets exist on `reports/bets/2026-w05-card.md`.
- Narratives (`reports/intel/master-intel-narratives-2026-w05.md`): the "Why" paragraphs say any lean is research-only. Codex's originals are in `reports/intel/_bak/`.
- The roster gate passed on the last build (`ROSTER VET: PASS`, 56 digest legs resolved, ESPN rosters 06:35Z). Rerun after any recapture and before any player-specific card.
- Known gaps in the report: no survivor pick-popularity file, no DK Predictions saves for the 14 games, no card tickets.
- Weather file is from 10-10 17:56Z; refresh needs Andy's OK. Flagged: CLE@NYJ (rain, gusts), CHI@GB (gusts), IND@PIT (gusts 58 km/h), NYG@WAS (rain).
- Kickoffs (PT): PHI@JAX Sun 06:30; CHI@GB, HOU@TEN, CIN@MIA, LV@NE, MIN@NO, CLE@NYJ, IND@PIT, NYG@WAS Sun 10:00; DEN@LAC 13:05; DET@ARI, SF@SEA 13:25; BAL@ATL 17:20; BUF@LAR Mon 17:15.

## 4. Open items for Andy

1. Recapture BKR + BEO in the morning: before ~05:00 PT for PHI@JAX if he still wants it, ~07:00 PT for the 10:00 games, ~10:00 PT for the 13:05/13:25 games. Commands: `npm run props:bkr:launch` + `props:bkr:cron`; `npm run props:bol:launch` + `props:bol:cron`.
2. OK to refresh weather.
3. SuperContest label swap for six reversed matchups (see `reports/bets/2026-w05-sunday-card-reconciliation-DRAFT.md`).
4. `git push` (nothing pushed).
5. Optional: tickets he places must be reported with book/price/time; recording one needs his explicit authorization.

## 5. Next team's lanes

### 5.1 After Andy's recapture (first, time-critical)
`python3 scripts/intel/fetch-espn-status.py` → `npm run roster:vet -- --week 5 --date 2026-10-11 --strict` → `python3 scripts/intel/build-w05-game-packets.py` (add `--exclude` for any game already final) → commit packets + evidence by explicit path → note new short SHA.

### 5.2 Re-run only games whose line or availability changed
Move that model's old outputs to `_superseded/`, then one Opus agent (or Astra) per game per `prompts/2026-w05-game-synthesis.md` (GAME, GK, MODEL, HEAD), run `scripts/intel/week5-preflight.py --expect-head`, then `validate-game-output.py --model M --game G`, then hand-check numbers. Re-run the slate merge (`prompts/2026-w05-slate-merge.md`) only on a full 14-game set.

### 5.3 Final cards and Master report refresh
Cards need prices inside their windows, roster-gate pass and ESPN roster-group check on every player leg. Refresh the digest tiers/leans from the new Opus outputs (drop the CAUTION text only where an output now supports a tier), rebuild with `build.py`, re-export, render PDFs in the cloud, commit explicit paths. The "no more re-running packets" instruction applied to the Saturday night session; ask Andy before rebuilding packets again except for the recapture above.

## 6. Guardrails (unchanged)
Read-only on sportsbooks, no bets or account actions, no TheOddsAPI, no paid Gemini or Supabase writes unless Andy runs them, no database deletes. Proposed ≠ placed. Don't ask Andy to confirm publicly announced player statuses.
