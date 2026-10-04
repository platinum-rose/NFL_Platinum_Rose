# Week 4 Sunday card, tracker, and AI-benchmark handoff — 2026-10-04

## Purpose

Claude team is taking ownership of the Week 4 Sunday card after this handoff. The work in this commit records Andy's placed tickets, the still-unbooked AI recommendations used for accuracy tracking, and the current BKR-priced proposal card. It does **not** place bets, write Supabase, or sync a bankroll/ledger service.

## Read in this order

1. `reports/bets/2026-w04-card.md` — current card proposals and BKR re-pricing.
2. `reports/bets/2026-w04-ai-recommendations-unbooked.md` — 11 paper recommendations and the 46 legs to grade.
3. `data/official-picks/user-placed-wagers-2026.json` — the user-entered placed-ticket ledger; these are real tickets, all pending at handoff.
4. `data/official-picks/paper-wagers-2026.json` — `is_paper: true` records for unbooked AI calls only.
5. `public/live-tracker-sunday.html` — generated live tracker; duplicate output is `docs/tracked-wagers/live-tracker-sunday.html`.
6. `reports/intel/podcast-gemini-props-screen-2026-w04.md` — original podcast screening evidence, including Waller (CAR) four voices and Jameson Williams (DET) three.

## Current execution reality

The card report still calls itself a proposal artifact. That is intentional: it must not be treated as an official ticket ledger. The placed-ticket ledger and live tracker now contain 13 pending tickets supplied by Andy:

- Six Bookmaker tickets: `739714646`, `739714534`, `739714258`, `739713560`, `739713279`, `739713278`.
- Six BetOnline tickets: `1002306890`, `1002306799`, `1002306704`, `1002306303`, `1002304945`, `1002303293`.
- One late BetOnline ticket: `1002396982`.

The latest ticket is an eight-leg prop parlay, stake $5.00, to win $735.00: Mahomes over 1.5 passing TDs; Burrow over 1.5 passing TDs; CeeDee Lamb anytime TD; Trey McBride anytime TD; McCaffrey 32+ receiving yards; Lukas Van Ness over 0.5 sacks; D'Andre Swift anytime TD; Bhayshul Tuten over 57.5 rushing yards.

Do not infer that any recommendation was booked solely because it appears on the card. Conversely, do not alter an entered ticket's accepted price or stake from later board prices.

## Card changes made this session

- Removed every card section titled `2-team RR`, at Andy's direction.
- Replaced the card's former `house rule` wording with `playbook proposal`; proposal bullets are not standing rules unless Andy confirms them.
- Re-priced the card from Andy's 2026-10-04 BKR board. No BEO board was supplied, no `game_odds_snapshots` was used, and no TheOddsAPI credits were spent.
- Slot 3 current BKR proposal: NE +7, NYJ +3.5, GB/TB under 38.5, SEA ML, DET ML (+1319; $20 returns profit $263.83).
- Slot 4 current BKR proposal: ARI ML, LAR ML, MIA +9.5, DEN +2.5, DET ML (+1378; $20 returns profit $275.57).
- Morning and hybrid prop stacks were rebuilt with the available prop lines. Their proposed/paper versions are separated from booked equivalents in the unbooked report.
- Full-game unders are permissible under the confirmed card template.

## AI recommendation benchmark

`paper-wagers-2026.json` contains 11 Week 4 entries, all `is_paper: true`, totaling $110.00 hypothetical stake and $5,301.54 potential profit. The unbooked report describes each ticket and excludes exact booked equivalents while retaining similar-but-not-identical proposed legs. This benchmark is for grading accuracy; it is not a betting ledger and must never be presented as placed action.

## Checks performed

- `npm test` was run before the card work: 1,918 total, 1,903 passed, 15 failed across 21 failing test files. Treat this as pre-existing/repository-wide noise unless a changed scoped test demonstrates otherwise.
- Latest roster gate command: `npm run roster:vet -- --week 4 --date 2026-10-04 --fetch --strict`.
- Latest roster gate result: PASS, zero blocking findings, 22 card players resolved, digest 11. The roster data timestamp was `2026-10-03T19:13Z` (about 16 hours old at the run), so it is a gate result, not proof of final inactives.
- `git diff --check` passed for the hand-edited scoped files before staging.
- Live tracker was regenerated with `node scripts/generate-live-tracker.mjs --week 4`; it includes all 13 entered tickets and all 11 paper records. The generator reported that live ESPN scoreboard fetch failed during its build; it did not block static tracker generation. Recheck grading data against a live scoreboard before settling anything.

## Time-sensitive follow-up

- The planned exact inactive checks around 05:00 and 11:35 PT were not completed at those windows. Earlier context: McLaurin was expected out/doubtful, Mike Evans was questionable/game-time, Maye was expected to play with no designation, and Winston was confirmed NYG starter. Re-verify from an authoritative current source before changing any card/player status.
- Specifically recheck IND/WAS McLaurin, SF Mike Evans, NE Maye, NYG Winston, plus Denver's six-ticket exposure and Arizona's $80 exposure if continuing card analysis.
- All entered tickets were pending at the handoff. Grade only after final game/player results are verified.

## Safe continuation boundaries

- Read-only sportsbooks; no placement or account actions.
- No Supabase reads/writes for board pricing or tracker updates unless Andy expressly changes that instruction.
- Keep user-placed tickets, AI paper recommendations, and card proposals separate.
- This checkout is heavily dirty with concurrent/unrelated work. Stage only explicit paths. Do not stage, modify, reset, stash, or clean unrelated files; specifically do not stage `scripts/master-intel/build_site.py`.
- The placed-ticket ledger is normally ignored. It is intentionally included in this commit only because Andy explicitly asked to stage, commit, and push the tracker update.

## Git state after this handoff commit

The commit deliberately contains only these paths:

- `data/official-picks/user-placed-wagers-2026.json`
- `data/official-picks/paper-wagers-2026.json`
- `reports/bets/2026-w04-card.md`
- `reports/bets/2026-w04-ai-recommendations-unbooked.md`
- `public/live-tracker-sunday.html`
- `docs/tracked-wagers/live-tracker-sunday.html`
- this handoff file

It was created with a temporary Git index because the regular repository lock state has been unreliable. Do not try to repair the large unrelated working tree as part of this card handoff.
