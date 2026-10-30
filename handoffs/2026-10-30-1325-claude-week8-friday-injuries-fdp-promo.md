# Claude handoff — Week 8 Friday: injury re-check, defensive pass, FDP promo (October 30, 2026, ~1:25 PM PT)

## Resume
1. Read `HANDOFF.md`, reconcile live Git. Branch `claude/w5-prop-cards-2026-10-11`. Local commits on top of pushed `97ec2ff`: `c132558` (atomic-file-write helper) and this handoff's commit. **Not pushed**; Andy pushes. Use `git -c core.fsmonitor=false`.
2. The VM cannot delete files: git lock files renamed to `.git/stale-*-lock-claude-*` (Andy can delete them).
3. Dirty tree = scheduled-job outputs (Thu PM to Fri AM) plus Codex's uncommitted atomic-write repairs in `scripts/build-player-availability.js` and `scripts/sync-live-market-lines.mjs` (+ `tests/unit/cadenceFileWrites.test.js`, 12/12 pass with those edits). Preserve.

## Done this session
- **Bug fix `c132558`:** committed `scripts/lib/atomic-file-write.js`. The committed `build-defensive-props.mjs` and `backtest-defensive-props.mjs` imported it while it was untracked, so a clean checkout (M6) could not run `npm run defense:props`. Codex's test and script repairs left uncommitted (the test needs them).
- **Defensive boards run** (`node scripts/props/defense-boards-run.mjs --week 8 --skip-dkp`): 0 failed steps. 113 priced offers, but all are TNF (BEO) plus 5 DKP MNF sack rows. **No Sunday defensive prices yet.**
- **Expected-plays finding:** `data/defensive-props/expected-plays-model-2026.json` shows total/spread do NOT predict opponent plays (walk-forward r = −0.01; MAE no better than league mean). Rule 3 in `docs/defensive-props/defensive-intel-findings-2026-w07.md` ("get expected volume from total, spread, pace") should be dropped. Vacated tackles remain the only reliable bump.
- **Friday 1 PM injury re-check** appended to `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md`. No slot changes. All live BKR player legs clear. Jihaad Campbell (PHI) OUT → Zack Baun bump (8.2 → ~9.6).
- **FanDuel Predicts (FDP):** Andy placed a $1.80 cash 5-leg ML combo (CIN, JAX, NE, DAL, LAR), order 01A18E49-03BA-74AF-A764-2AF75539834C, $1.68 + $0.12 fee, pays $6.00 (3.57x displayed, 3.33x net; fair 4.0x). **Not yet logged** in `data/official-picks/user-placed-wagers-2026.json` or the recommendation ledger (asked Andy).
- **FDP promo plan:** `reports/bets/2026-w08-fdp-promo-plan.md` (DEV project `claude/fdp-promo-plan-2026-10-30.md`). Five one-shot scheduled tasks push a re-priced slip to Andy's phone: Sat 10:17 AM, Sun 8:40 AM, Mon 10:23 AM, Tue 10:19 AM, Wed 10:11 AM PT. **The posted terms say the promotion period ended Oct 20, 2026**; treat the $100 as unconfirmed until the first $20 lands.
- **Twitter bookmarks** (Andy ran it): 55 ingested. Sal Bets WTF TD parlay: Kyren Williams 2+ TD, Javonte Williams 2+ TD, Tuten 2+ TD, DJ Moore ATD. OCR mis-tagged teams (Tuten "VT", Javonte "DEN", Moore "CHI") in 4 `research_pick_signals` rows; correction needs Andy's Supabase OK. Andy is transcribing Sal's "Way Too Early 5 Best Bets Week 8" video himself (x.com/salbets_/status/2115481971044331576). Neither the VM nor the cloud container can reach video.twimg.com.

## Open for Andy
1. Push `claude/w5-prop-cards-2026-10-11` when ready.
2. OK to log the FDP ticket (wagers file + ledger)? OK to fix the 4 OCR team tags in Supabase?
3. Paste Sal's 5 Week 8 picks.
4. Rerun `npm run props:dkp:defense` Saturday evening/Sunday morning (see `handoffs/2026-10-30-0930-claude-week8-tnf-graded-defense-boards-pools.md`). Connect Claude in Chrome and give BetOnline's parlay-builder tab label to capture Sunday tackle ladders.

## Next
1. After the 3 PM Windows Friday cadence: `npm run defense:props` (Campbell OUT gets into the gated sheet).
2. Saturday: DK defensive rerun; price Sunday defensive legs against the sheet (LB T+A overs, vacated roles).
3. Sunday ~8:30 AM PT: inactives (questionables: Landman, B. Jones, Downs, M. Wilson, Kincaid, DJ Moore, A.J. Brown, Gainwell, Henderson), refresh prices, enter pools (duma 3–9/11–16, Yahoo, CBS), tiebreaker.
4. Sunday: BKR weekend parlays tracking; PHI hedge watch (PHI is badly depleted at WR).

## Guardrails
- No wager, account, Supabase, paid call or publication without Andy's per-action OK.
- No player-named output without a current strict roster gate.
- Stage narrowly; never `git add -A`.

Resume prompt:
```
Resume Platinum Rose NFL. Branch claude/w5-prop-cards-2026-10-11 (local commits on top of pushed 97ec2ff; check whether Andy pushed). Friday injury re-check done; no pool slot changes; live BKR legs clear; FDP promo reminders scheduled. Next: defense:props rebuild after the 3 PM cadence, DK defensive rerun Saturday, Sunday inactives and entries. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-30-1325-claude-week8-friday-injuries-fdp-promo.md.
```

## Addendum 1:35 PM PT — Sal Bets "Way Too Early 5 Best Bets Week 8" (video; Andy transcribed)
Source: x.com/salbets_/status/2115481971044331576 (posted Oct 28). Sal's graded history in `expert-history-graded-w04-w07.json` is tiny (2-3 graded, 3 ungraded).
| Pick | Check (1:30 PM PT) |
|---|---|
| Bijan Robinson over 79.5 rush yds (ATL @ TB) | BEO Thu: o80.5 −107. ATL RB2 Brian Robinson ruled OUT → more Bijan carries. Supports. |
| A.J. Brown over 59.5 rec yds (NE @ MIA) | **Questionable** (ankle/knee; DNP Thu). Only after inactives (~11:55 AM PT Sun for the 1:25 PM game). Missing player = busted leg. |
| Jacoby Brissett over 249.5 pass yds (ARI @ DAL) | ESPN depth chart QB1. BEO Thu: o257.5 +100; 248+ at −145. DAL −7, total 54.5 → ARI trailing script. Correlates with the DAL ML legs. |
| Jared Goff under 274.5 pass yds (MIN @ DET) | Total 46.5; MIN pass D strong (SharpFootball: 3 passing TDs allowed all season). No board price captured. |
| Ollie Gordon II under 59.5 rush yds (NE @ MIA) | MIA RB1 on depth chart. MIA +7 → trailing script, fewer carries. Correlates with the NE ML legs. No board price captured. |
Not logged to Supabase or the ledger; proposal-only notes.
