# Handoff 2026-11-04 5:40 PM PT: post-mortem pipeline built (tasks 1-5), TNF JAX@BAL waits on Thursday gates (START HERE)

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11` (last commit b0747be). Nothing placed, no ledger edits,
no Supabase writes, nothing published or pushed. Previous handoff: `handoffs/2026-11-04-1640-week8-closed-week9-build-START-HERE.md`.

## Priority 1: TNF JAX @ BAL (Thu 11/5, 5:15 PM PT): not built yet, gated
- Boards on disk (Wed ~2:10-2:20 PM PT): BEO `data/generated/props/betonline-live-2026-11-04-week9.pregate.raw.txt` = game lines + team totals only
  (JAX -10 / total 39.5 / JAX TT 26.5 / BAL TT 16.5 u-150; 1H JAX -6.5, 20.5). DK Predictions `...-2026-11-04-week9.last-capture.raw.txt` = game lines +
  TD scorers only (no PLAYER PROPS / O-U tabs captured). **No BKR Week 9 capture.** No player-prop prices anywhere yet.
- Thursday order: Andy runs `runbkrprops.cmd`, `rundkprops.cmd` (props tabs), `runbolprops.cmd` -> Claude parses and drafts cash C1/C2 + promo builds ->
  inactives ~3:45 PM PT (Tuten Q) -> roster gate on every named player -> Andy pastes each slip.
- Constraints: cash tickets add no Henry / Strange / Lawrence (N1, N2a, N2b hold them); promo may reuse. Cash rules C1-C5 below are now machine-checked.
  Rule C4 is registered for this game: no totals or BAL/JAX same-team prop stacks on a cash ticket before 3:45 PM PT.
- Candidate lanes (card theses): Roquan 8+ T+A, Oluokun 7+ T+A, Fagnano pass-yds Under / 1+ INT (BEO/DK only), Rodriguez rushing, Henry rush Under,
  BAL TT Under 16.5. **Log every proposal at proposal time:** `python3 reports/bets/season-recap/scripts/ai_record.py add --week 9 --file <json>`.
  Already logged: `w09-tnf-candidates-wed` (Roquan 8+, Oluokun 7+, Fagnano 1+ INT, BAL TT U16.5) and `w09-fdp-n2-branch-b` (promo).

## Priority 2: post-mortem setup: all five tasks done
One command: `python3 reports/bets/season-recap/scripts/postmortem.py --week N [--fetch]`, also Tuesday cadence step 8
(`node scripts/toolbox.mjs --cadence tuesday`) and standalone `--cadence postmortem [--week N] [--force] [--no-page]`. Read-only on both ledgers.
Steps: ESPN fetch -> espn_week -> **crosscheck (stops on blocking)** -> build (placed regrade) -> paper -> rules check -> scorecard -> page.
Run index lands in `reports/bets/season-recap/work/wN/postmortem_wN.md`. First full run: **Week 9, Tue 11/10**.

1. **Tuesday step + fixed scorecard** (`scripts/scorecard.py`, section added to every page): cash net; legs per ticket vs won; P&L by family (lib.py);
   AI-backed vs Andy-only vs unplaced AI (unique positions + cash tickets by builder); near misses; projection error (fair-lines file); cash vs promo;
   season to date; rules check.
2. **Machine-readable AI picks** (`scripts/ai_record.py`; `data/official-picks/ai-proposals/2026-wNN.json`, tracked). `build.py` reads it; falls back to
   `ai_recs_wN.py`, then to the paper ledger (Week 7). Round-trip tested on Week 8: 0 origin differences; 128 AI legs grade 65-62-1 under both graders.
   Standing instruction added to CLAUDE.md, AGENTS.md and `docs/NFL_WEEKLY_CARD_PROCESS.md`.
3. **Lessons -> rules loop** (`scripts/rules.py`, registry `reports/bets/season-recap/rules/rules-2026.json`): C1 max 4 legs, C2 one read on <=3 cash
   tickets, C3 receiving at lowest rung (proxy check), C4 shaky-QB game (JAX@BAL registered), C5 no master RR; all effective Week 9. Each check reports
   followed / violators vs compliant net / what the same tickets did before the rule. `rules.py propose` caps new rules at 3 per week; Andy accepts with `rules.py accept`.
4. **Grader cross-check** (`scripts/crosscheck.py`): grade.py vs lib.py vs stored, placed + paper + AI record. **Week 8 reconciled: 38-60 is right.**
   grade.py read Pick 6 "More/Less" as overs (Nix Less 1.5 pass TD x2, Goff Less 0.5 INT -> W; Elliott Less 7.5 kicking pts -> L). Other fixes found on W1-W8:
   tied ML = push (W5 NYG@WSH 27-27); `TOTAL u52` crash (W7); 2+ TD / completions aliases; TD count uses box TD columns (W5 Gibbs 2+ TD);
   lib.py canonical keys, Less, QB INT read as defensive INT, rush+rec. Now **0 blocking for Weeks 1-8**. One adjudication: W5 Cameron Thomas half sack = book push.
   Backups `*.bak-claude-20261104-crosscheck`.
5. **Backfill**: `week5/6/7-post-mortem.html` built (auto-draft cfg + recaps; regenerated while the AUTO DRAFT header stays). W5/W6 have no AI record
   (AI section shows everything as "not in AI record"); W7 uses its 43 paper tickets (152 AI legs). No fair lines for W5-W7.
- Week 8 page rebuilt: placed legs and every published number unchanged; 4 paper legs corrected; scorecard added. Previous copy in `work/w8/*.prev-*`.
  W8 summary line updated locally and in DEV `claude/w08-postmortem-summary-2026-11-04.md`.

## Things Andy decides (not acted on)
- Week 8 items unchanged: DK booking basis, 5 PENDING legs, `weekly-archive.mjs --week 8 --refresh`, Supabase sync of Q5/N1/N2a/N2b.
- New: Week 5 has 9 legs still PENDING inside settled tickets that the box score now settles (5 2+ TD L, 2 rush yds L, 1 rush yds W, 1 rec yds W).
  Ledger edit, so it waits for an OK. List: `reports/bets/season-recap/work/w5/crosscheck_w5.md` (WARN section).
- Optional: build a W5/W6 AI record from the cards so those pages get an AI-vs-Andy split.

## Known limits
- first_td still relies on scoring-play text; play-by-play-form TD text can miss a first-TD scorer.
- lib.py can't place 9 W8 placed legs (warnings only; recap grader + stored agree).
- The remote bridge can't delete files (git lock files), so commits go through Andy on Windows. Copying a re-edited file must use a new staged name.

## Commit batch (Andy, scoped; never `git add -A`)
Post-mortem tooling + backfill:
  reports/bets/season-recap/scripts/{ai_record,crosscheck,scorecard,rules,paper,postmortem,gen_cfg,build,grade,parse_placed,gen_week,page_week}.py
  reports/bets/season-recap/scripts/crosscheck-adjudications.json  reports/bets/season-recap/scripts/cfg_w{5,6,7}.py
  reports/bets/season-recap/recaps_w{5,6,7}.py  reports/bets/season-recap/rules/rules-2026.json
  reports/bets/season-recap/w{5,6,7}{legs,paper}.json  reports/bets/season-recap/w8{legs,paper,games,gamesum}.json
  reports/bets/season-recap/week{5,6,7,8}-post-mortem.html  reports/bets/season-recap/work/w{5,6,7,8}/{crosscheck,rules,scorecard,postmortem}_w*.*
  reports/analysis/season/claude/scripts/lib.py  reports/analysis/week8-postmortem/w08-postmortem-summary-2026-11-04.md
  scripts/toolbox.mjs  data/official-picks/ai-proposals/2026-w09.json  CLAUDE.md AGENTS.md docs/NFL_WEEKLY_CARD_PROCESS.md
  handoffs/2026-11-04-1740-postmortem-pipeline-built-tnf-thursday.md
(Leave out `*.bak-*`, `*.prev-*`, `__pycache__`, `work/w9/w09-seed-proposals.json` is optional.)
