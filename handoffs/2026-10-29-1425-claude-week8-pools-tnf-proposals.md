# Claude handoff — Week 8 pools and TNF proposals, October 29, 2026 2:25 PM PT

## Resume

Read `HANDOFF.md`, reconcile live Git, then `AGENTS.md` / `CLAUDE.md`. Branch `claude/w5-prop-cards-2026-10-11`, HEAD `d6356c3` (matches the locally recorded upstream; the remote was not fetched). Suite: no tests were run this session; the last broad run was 2,046 passed / 27 failed, which is not a full pass. Nothing was staged, committed or pushed. The dirty tree went from 887 to 890 entries: two new proposal files and one new report folder. All prior dirty work was preserved.

## Done this session (local files only)

- **Duma rules (Andy, 2:15 PM PT):** the "quarterly" prize is a rolling four-week window (this week plus the previous three), paid every week. The "four-game segment" prize is the same thing. Scale is 3–16 this week. Andy said the saved duma picks (GB 4, ATL 3, ...) are **placeholders**. Nothing is entered yet in Yahoo or CBS.
- `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md`: full duma 3–16 sheet (EV 92.6 vs placeholders 91.8), plus Yahoo and CBS. **Tonight: duma GB 10, Yahoo GB 8, CBS GB.** No CAR leverage, because a crude rolling-window model shows less than 1 pp gain. Andy is 14th and 19 back in the 5–8 window, but 5th and 17 back in the 6–9 window.
- `reports/bets/2026-w08-tnf-sgp-proposals-2026-10-29.md` (**HOLD**):
  - P1: Watson ATD + Love o1.5 pass TD (variant: Kraft ATD).
  - P2: CAR +3.5 + Hubbard o66.5 rush (optional Under 47).
  - P3: Jacobs ATD + Jacobs o76.5 rush+rec.
  - Individual BEO prices are from 10:10 AM PT. No combined odds. Strict roster vet PASS.
  - The paste source was read at its original path (after a granted folder-access request) and was not copied into the repo.
- `reports/engineering/week8-pools-tnf-2026-10-29/`: roster-vet output and log, a named-player roster check, and a backup of the prior `w08-roster-vet.json`, which was restored after the vet run.
- Freshness: official injury report read about 2:05 PM PT. Golden is questionable and reported as expected/trending to play, with the final call about 90 minutes before kickoff. Kalshi GB 63–64%.

## Open / next

1. About 3:45 PM PT: check the inactive list (Golden; Green Bay core starters). Then Andy enters GB in all three pools before 5:15 PM PT, and gets real SGP quotes if he wants a TNF ticket. Slip check before purchase.
2. Update `data/pickem/pools-2026.json` duma entry (scale (17−N)..16, rolling four-week prize). Not done, because the file has uncommitted concurrent edits. Needs Andy's OK.
3. Sunday: refresh moneylines and injuries (DET Gibbs/St. Brown, BAL QB), re-slot duma 3–9/11–16 and Yahoo; decide the Yahoo LV1/KC2 and CBS LV options.
4. Afternoon article intake and pasted Action picks are still **not ingested**, and their Supabase presence is unchecked.
5. Futures items are unchanged; see `handoffs/2026-10-29-0215-claude-futures-hedge-planning.md`.

## Guardrails

No wager, account action, ledger, Supabase, paid call or publication without Andy's per-action OK. No staging, commit, push, transfer or cleanup without scoped approval. A passing strict roster gate is required before player-named output.

Resume prompt:
```
Resume Platinum Rose NFL. HEAD = d6356c3 (claude/w5-prop-cards-2026-10-11). Suite: not run this session (last broad run 2,046 passed / 27 failed). Week 8 pool proposals and TNF SGP proposals are written locally (HOLD); duma rolling 4-week rule confirmed. Next: post-inactives TNF check, then the Sunday re-slot. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-29-1425-claude-week8-pools-tnf-proposals.md.
```
