# Handoff — Claude Team 3, Week 5 prop cards pickup (2026-10-12 ~19:15)

Branch: `claude/w5-prop-cards-2026-10-11`. Code commit: `050eb21`. All picks are proposed-only research. No Supabase writes were made (Andy runs the sync).

## CRITICAL
1. **Ledger settlements need verification.** Another actor settled 13+ tickets overnight (PENDING -> SETTLED) in `data/official-picks/user-placed-wagers-2026.json`. Re-check them against ESPN box scores before trusting P/L. Week 5 state at last read: 27 tickets, 20 settled, 7 pending.
2. **NYG@WSH finished 27-27 (OT tie).** WAS spread/ML legs need the book's tie rule (push vs loss) before they are graded.
3. **CIN won by exactly 7.** The SuperContest CIN -7 pick pushes on #740087500 and #740087501. Confirm how they were graded.
4. **BUF@LAR (MNF, Oct 12, 5:15 PM PT) is still pending.** Legs on it stay open.

## IMPORTANT
- **Live Tracker grading bug fixed** in `scripts/generate-live-tracker.mjs` (3 blocks). Market matching now accepts `rec_yds`/`pass_yds` (`/yard|yds/`) and `pass_cmp` (`/complet|cmp/`). Backup: `scripts/generate-live-tracker.mjs.bak-claude-20261011-pre-ydsfix`. Anti-pattern logged in `docs/ANTI_PATTERNS.md` (Live Tracker section). When adding a market slug, grep all three grading blocks.
- **New tickets logged:**
  - #1004549505 (BetOnline 5-team parlay)
  - #740111777 (BKR 5-team parlay)
  - #1004562475 (BetOnline)
  - #1004561835 (BetOnline; 7th leg DET ML, **leg count unconfirmed**)
  - `bet_20261011_betonline_snf_island_6leg` (BAL@ATL island, +6100, $5 to return $310; ticket_number is `pending-not-supplied`, get the real number from Andy)
- Tuten yardage leg settled as a win. PHI@JAX legs settled.
- **Opus synthesis grade:** done in chat only, not written to a file. Rebuild from `reports/bets/2026-w05-opus-decision-support.md` plus the ledger if needed.
- **Tracker display:** Andy's "new tickets not showing" report was not reproducible. The file contains them and a headless render shows 20 cards. Advise a hard refresh and a check of the filters. The page has no auto-reload.
- Concentration watch: Taylor, JSN, Gibbs, McCaffrey, ATL, LV, CIN, WAS, DEN. Week 4: 5+ leg straight parlays went 0 for 58.

## Blockers / not done
- **Test suite not verified.** The background vitest run produced no output (killed with the shell). Suite: not completed.
- `docs/tracked-wagers/reconciliation-latest.json/.md` were modified by another process and are intentionally **not committed**. Other lanes' dirty files and untracked `.bak-*` files are also excluded.
- **Git mount is slow.** `git commit` hits the shell timeout and leaves a zero-byte `.git/index.lock`. Remove it only after confirming no git process is running. Commit via plumbing instead: `git write-tree`, `git commit-tree`, `git update-ref`.

## Resume prompt
```
Continue Claude Team 3 Week 5 prop cards. HEAD <fill after push> on branch claude/w5-prop-cards-2026-10-11 (code commit 050eb21). Suite: not completed (rerun `npx vitest run`).
Read handoffs/2026-10-12-1915-claude-team3-w5-prop-cards-pickup-handoff.md. Do NOT re-run packets or Opus synthesis. No Supabase writes. Never `git add -A`; stage explicit paths only. Proposed-only research.
First ask Andy for the MNF BUF@LAR result and any pasted slips. Then: verify the overnight ledger settlements and the NYG@WSH tie and CIN -7 push grading, settle the remaining legs (append-only with backup), run `node scripts/generate-live-tracker.mjs`, and stage the ledger and both tracker HTML copies explicitly.
```
