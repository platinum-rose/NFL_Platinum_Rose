# Handoff — Week 4 pick'em, podcast props screen, betting-rules cleanup

**Date:** Sun 2026-10-04 ~03:00 PT · **From:** Claude (Cowork) · **Branch:** `main` · Nothing placed, no Supabase writes.

## CRITICAL (for the Sunday card session)
- **Slot 3 Morning parlay does not fit Andy's template** (1–2 morning sides/totals → 1–2 easy afternoon MLs → SNF ML cap). Rebuild it. Proposed (BKR 10/03 10:46, unconfirmed): GB/TB Under 39.5 −119 + NYJ +3.5 −103 → SEA ML −319 → DET ML −191 (~+594); NE +7 −113 is the alternate morning side. Not yet written into `reports/bets/2026-w04-card.md`.
- **There is no "no full-game unders in parlays" rule.** It was a Week 4 playbook *proposal*; the card mislabeled it "house rule" (left-off section still says so — fix the wording). See `docs/ANTI_PATTERNS.md` → Betting Rules & Card Building.
- **Rules removed by Andy 10/04:** data rules "props on the side you expect to win", "2-leg tickets/2-team RRs first; 5+ leg straights = $5 moonshots", "moonshot ATD stacks lose"; playbook items "max 4 legs on anything over $5", "drop first TD/sacks/QB rushing"; "2-team round robins → Bookmaker" ("there is no such thing as a 2-team round robin"). Updated in `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` (§5 renumbered 1–7, §7.2), `HANDOFF.md`, `docs/claude-project-dev/week4-playbook-2026.md` + DEV project doc.
- **Open question for Andy:** what to call (or whether to keep) the tickets still named "2-team RR" — §7.1 slot "Dog 2-team RR", SuperContest "$10 2-team RR" split stake, this week's "Slot 2 Dog-ML 2-team RR" and "SuperContest B 2-team RR".

## IMPORTANT
- **Pick'em W4** committed `710a2be`: `data/pickem/{odds-bkr-2026-w04-1003_1046,leans-2026-w04,picks-2026-w04,plan-2026-w04}.json`, `reports/pickem/2026-w04-pickem.md`. TNF PIT@CLE: PIT locked (lost) in all 3 pools, slot 4 in both confidence pools. Remaining picks are proposals — mark `submitted` only when Andy confirms. Yahoo: LV heavy fade @3 + ATL flip @1; CBS: ATL flip. Pools' standings are null (Andy to supply). Grade after MNF: `node scripts/pickem-grade.mjs --week 4`.
- **Podcast intel (17 Gemini episodes):** new `scripts/master-intel/podcast_gemini_normalize.py` (read-only Supabase GET; roster-mapped games, side re-coding, CFB drop, ladder grouping, BEO/BKR pricing). Outputs `reports/intel/podcast-gemini-props-screen-2026-w04.md` and `data/generated/master-intel/w04-podcast-gemini-normalized.json` (gitignored; rerun the script). Notes delta vs the card: `reports/intel/podcast-gemini-delta-2026-w04.md`.
  - Multi-voice props: Darren Waller (CAR) 4 voices, Jameson Williams (DET) 3 → SNF island ticket candidates. McCaffrey, Downs, P. Washington, J. Meyers, Pollard 2 each.
  - Side splits vs card: podcasts NYG 5–1 (card ARI $80), PHI 5–2 (card LAR), DAL 4–2 (card HOU); agree on DEN, TEN, NE, JAX, NYJ, LV.
  - Market notes: pros on ATL (supports), pros on KC (counter to LV — weakest pick'em call is the Yahoo LV fade).
  - Antigravity handoff errors: "DEN vs KC" (SF), "Rams +2.5" (−2.5), "BAL vs Bills" (TEN); 5 CFB rows; 4 unknown players; Anderson "MIN −1.5 vs NO" garbled.

## Blockers / Sunday to-do
- Fresh BKR board + inactives (~05:00, ~11:35 PT) before anything is placed; prices on the card are from Sat 10:46.
- SNF DET@CAR and MNF ATL@NO island tickets unbuilt.
- Bills credits ×2 undecided.

## Resume
Resume Platinum Rose NFL. HEAD = (see `git log -1`) (main). Week 4 Sunday card: rebuild Slot 3 to template, fix "house rule" wording, decide 2-team RR naming, build SNF/MNF islands with the podcast props screen, re-price on the Sunday BKR board, roster gate --strict. Read HANDOFF.md, reconcile live Git, then this handoff.
