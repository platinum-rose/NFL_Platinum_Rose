# W10 Sunday live: tickets complete, Alejandro tracker live (Claude, 2026-11-15 11:45 PT)

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Previous handoff: `handoffs/2026-11-15-0135-claude-w10-saturday-final-card-building-next.md` (its 02:58 addendum covers the overnight tickets).

## State at 11:45 AM PT
- 10 AM games in progress (Q2/half). NE@DET final (DET; Goff 3 TD, Gibbs 153 rush / 2 TD, Maye 0 TD).
- Ledger `data/official-picks/user-placed-wagers-2026.json`: **every W10 ticket has a ticket/position number** (BKR, BEO, DKP all reconciled against Andy's open-bet pastes). Local only, not in Supabase.
- Week 10 real tickets added since the 01:35 handoff (all logged, tracker rebuilt):
  - DKP promo 8-pick 60232674 ($10 promo → $946), replaces the unplaced BEO +12,800 slip.
  - BKR 5-leg props #741848628 (+2880, $10). BKR teaser NE +8.5 / BUF −2 #741848843 ($42). BKR SGP+ 8-leg #741849069 ($8 → $517.69).
  - BEO ATD 8-leg #1015544828 ($7.65 → $413.10). BEO NE@DET 4-leg SGP #1015545207 (lost). BEO NYJ +9 free bet #1015546951. BEO Happy Hour GB −3 #1014724720 (placed 11/13, newly logged).
  - DKP first-TD 3-pick Cook/Hubbard/D. Henry ($10 → $1,322, cash/solo assumed; position # not supplied).
  - Alejandro splits: boosted 5-pick (Taylor/Corum/Purdy/J. Warren/Cam Ward INT, $9.98 → $319.60, position # not supplied), 8-pick 60555716 ($10 → $376), 7-pick 60689102 ($10 → $946, placed before 10 AM).
- Known overlaps/conflicts: PIT@CIN O46.5 (SGP+) vs U48.5 (master 8-team) → both win only on 47–48. NYJ +9 free bet hedges BUF ML / BUF −2 teaser / SC BUF −7.5.
- Fixed bug: 5 INT legs were logged as market `pass_int` (tracker grades only `*interception*`); renamed to `pass_interceptions`. Use `pass_interceptions` for QB INT legs.

## Built today
1. **Alejandro Live Tracker (Option B, live)** — https://platinum-rose.github.io/alejandro-tickets/ (public repo `platinum-rose/alejandro-tickets`, local clone `E:\dev\projects\alejandro-tickets`).
   - `scripts/generate-live-tracker.mjs --partner Alejandro`: same Ticketboard code as Andy's tracker; only tickets Alejandro shares; all money rewritten to his share; Andy-only sources (SuperContest, fantasy, futures, paper, price watch) never read; SC/Fantasy/Futures tabs, Grade & Settle, History, split toggles, source tags hidden; season ledger block injected; leg notes rendered (`💡`).
   - Leg notes: `data/official-picks/alejandro-leg-notes-2026.json` keyed by leg `key` (26 notes).
   - Publish after any Alejandro ticket change: `npm run tracker:alejandro:publish` (rebuilds, copies index.html + schedule.json, commits, pushes). Andy's normal build is unchanged (verified identical apart from blank note lines).
   - Spec + decisions: `docs/specs/alejandro-live-tracker-spec-2026-11-15.md`. `scripts/generate-alejandro-tracker.mjs` is the superseded standalone prototype (left uncommitted).
2. **Defender tackle model**: `scripts/analysis/def_tackle_split_model.py` (run/pass split + opponent volume). Walk-forward W4–9 (1,384 player-games): volume signal real (proj ≥0.6 above avg → 52% over vs 25% below; base 38%); split adds a small tilt; Poisson overstates ~6 pts. Not tested vs DKP prices (no price history: start saving DKP tackle prices weekly).
3. **Kicking check**: team FG model has **no signal** (walk-forward log loss = constant baseline). Base rates W1–9: team 2+ FGM 54%, game 4+ FGM 48%. Notes: `scratch/w10-kicking-fg-check-2026-11-15.md`.
4. Defensive board rebuilt for W10: `data/defensive-props/defensive-matchups-week-10.json`.

## Andy's track record (season, from ledger legs)
Tackles 39–24 (62%), QB INT 16–7 (70%), kicking 12–9 (57%), sacks 12–26 (32%).

## Open / next
1. Sweat the slate; settle W10 tickets after games (SNF PIT@CIN, MNF LAC@BAL legs keep several tickets open).
2. After settlements, republish Alejandro's page (`npm run tracker:alejandro:publish`).
3. Missing position numbers: DKP first-TD 3-pick, DKP boosted Alejandro 5-pick.
4. Solo/split assumed solo (unconfirmed): BKR 5-leg, BEO ATD 8-leg, NE@DET 4-leg, teaser, SGP+, first-TD 3-pick.
5. Capture browsers: BKR (port 9222) needed a manual login this morning; DKP capture takes ~1 game/min.
6. Optional: hide Add Sunday Slip / Export marks / Hide Imaginary on Alejandro's page; save DKP tackle prices weekly for a price-vs-model backtest; investigate scheduled BOL sync skipping Props Builder (from the 01:35 handoff).
7. Repo has a large set of unrelated uncommitted data/script churn from earlier sessions and crons (not touched by this commit).
