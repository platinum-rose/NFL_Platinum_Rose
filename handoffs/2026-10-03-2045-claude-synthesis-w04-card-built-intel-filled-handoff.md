# Week 4 card built + Master Intel filled (WEEKLY_SYNTHESIS_SESSION, Sat 2026-10-03 ~8:45 PM PT)

**Brief:** `handoffs/2026-10-03-2030-claude-synthesis-w04-fill-master-intel-brief.md`. **Mode:** FRI-SAT (no futures review; STOP C not reached).
**Nothing placed. No Supabase writes.** First kickoff: Sun 6:30 AM PT (IND@WAS, London).

## Done
- **STOP A:** 3 stale rows in the preflight (legacy podcast file, team power ratings, promotions). None feeds a ticket, so not blocking. Supabase `player_injuries` was last captured 10/02 14:59 PT; the ESPN injury feed of 10/03 10:51 PT was used instead.
- **Digest:** `scratch/w04-synthesis-digest-sat.md` (31 lean rows). **STOP B:** Andy said "Go as proposed".
- **Card:** `reports/bets/2026-w04-card.md`
  - 14 tickets, $174.95. Builder and self-check: `scratch/w04-card-build.py` (prices BKR 10/03 10:46 PT, BEO 10/02).
  - Game tickets:
    - Slot 2 Dog-ML RR (JAX, DEN, ATL, LV, NYJ, TEN)
    - Slot 3 Morning parlay: ARI, LAR, SEA + DET ML SNF cap
    - Slot 4 Afternoon parlay: HOU, DEN, SEA + DET ML cap
    - Slot 5 Hybrid: ARI ML, MIA +10, NE +7, DEN ML
    - Singles MIA +10 / GB-TB U39.5 / NYJ +3.5
    - 2-leg ARI + JAX ML
    - 6-pt Wong teaser JAX/DEN/ATL (price est.)
    - SuperContest A/B split stake
  - Prop tickets: 7a and 7b QB-market stacks, 8b 2+ TD.
  - Master RR skipped.
  - Island SNF/MNF deferred to Sunday: BKR had no DET@CAR or ATL@NO props priced.
- **SuperContest:** Andy and Amanda haven't picked yet. Card proposes five: ARI −1.5, MIA +10.5, LAR −3, TEN +11.5, DEN +2.5. Alternates: HOU −2.5, LV +4.5, GB −3.5, NYJ +3.5, NE +6.5.
- **Bills credits:** two unused $10 credits (last week + this week). Andy decides after the report; options are listed in the card.
- **Narratives:**
  - Every Why section names its tickets, or says why the card passes the game.
  - `## TICKETS` and `## SUPERCONTEST` blocks added.
  - Roster gate PASS (card 10 player legs, digest 11).
- **Survivor:** `data/survivor/pick-intel-2026-w04.json`, built from the local article archive: ESPN selection % (Wednesday), plus Action Network / ESPN / VSiN notes. SurvivorGrid wasn't reachable (the fetch permission timed out), so there's no EV score.
  - `build.py`: the survivor footer labels now come from `sources.pick_pct_label` / `note_label`. They used to be hardcoded "SurvivorGrid/Covers". Content only, not a style change.
- **Rebuild:**
  - The digest, card and survivor GAPs are gone. Remaining GAPs: YouTube digest, DK Predictions.
  - Dashboard: "18 picks in 14 games", 11 parlay/RR tickets, 3 prop tickets. `ranked.html` has rows and the filters work.
  - QA: 0 broken links, 0 console errors, no horizontal scroll at 390 px.
  - PDF exported in the cloud: `dist/.../nfl_week4_master_betting_intelligence_summary.pdf`.
- **Review artifact republished, version 3:** https://claude.ai/artifact/Ba1F5icQmPZf96U3N4Bxth

## Open / Sunday (SUN mode)
- **Concentration:** about $85 of cash touches DEN@SF across six tickets, and $80 touches ARI@NYG. Andy may want to trim.
- **Inactives:**
  - ~05:00 PT for IND@WAS (McLaurin doubtful, Keenan Allen out).
  - ~08:30 PT for the 10:00 games: Flowers Q, Ray Davis Q, Mike Evans GTD.
  - ~11:35 PT for the afternoon games.
  - Re-run the roster gate before placing.
- **Prices:** re-check every price on the slip. BKR is 10:46 Sat; BEO is Fri.
- **Island ladders:** SNF DET@CAR and MNF ATL@NO, once the Sunday BKR board posts.
- **Ledger:** after Andy places tickets, log them to `data/official-picks/user-placed-wagers-2026.json` (his flow). Then update the recommendation ledger (DEV project `claude/recommendation-ledger-2026.md`) with proposed vs placed.
- **Data-quality note (not fixed):** the article tier-1 prop feed carries a stale Week 3 line from Cohen's VSiN column ("Justin Herbert over 219.5 … vs. Bills"). The build shows it under LAC@SEA in the props pool.
- `scripts/master-intel/build_site.py` is still dirty with Andy's nav work. Not staged.
- **Unpushed commits:** local main was 3 ahead of origin at session start, all from the UX session. This session doesn't push. Andy decides.

Resume: Platinum Rose NFL, main. Week 4 card built and the Master Intel report filled (review artifact v3). Next: SUN mode. Run inactives and the roster gate, re-price the slips, build the SNF/MNF island ladders, log Andy's placements and update the ledger.
