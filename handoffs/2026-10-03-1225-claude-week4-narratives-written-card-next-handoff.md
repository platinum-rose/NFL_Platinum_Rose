# Week 4 narratives written → card next (fresh session or Andy)

**Date:** Sat 2026-10-03, ~12:05–12:25 PT · **Agent:** Claude (Cowork) · **Branch:** `main`.
**Session result:** `reports/intel/master-intel-narratives-2026-w04.md` written for all 15 remaining games (PIT@CLE excluded). Roster gate **PASS** (`npm run roster:vet -- --week 4 --date 2026-10-03 --fetch --strict`, ESPN rosters 19:13Z, 2,544 players). No card, digest, survivor file, publish, Supabase write, paid model call or sportsbook click.

## Andy's decisions this session

1. **Card:** none exists yet → narratives written with evidence leans; ticket names/numbers added in a short pass once `reports/bets/2026-w04-card.md` exists. `## TICKETS` / `## SUPERCONTEST` blocks are not written yet (they depend on the card).
2. **BKR date:** build on **2026-10-03**. Created `data/generated/props/bookmaker-live-2026-10-03-week4.json` (gitignored, like the 10-02 file).

## What was done

- **New script** `scripts/master-intel/bkr_live_from_rendered.py` builds `bookmaker-live-<date>-week<N>.json` (schema `bookmaker_live_markets_v1`) from the build-format board paste (game lines) + the normalized rendered captures (player props). Regenerate with:
  ```
  python3 scripts/master-intel/bkr_live_from_rendered.py --week 4 --date 2026-10-03 \
    --board data/odds/BKR_current_lines_1003_1046_buildfmt --board-time 2026-10-03T17:46:00Z \
    --fallback-date 2026-10-02 --no-carry IND@WAS,NYJ@CHI,GB@TB,ARI@NYG
  ```
  - Game lines: 10:46 PT board for all 15 games (`capturedAt` 17:46Z is the save time; the paste has no clock).
  - Props: rendered pages (09:29–09:59 PT; per-game page clock used as `capturedAt`). Unpriced selections kept as `available: false`.
  - Carry-forward from 10-02 only for a game×market with nothing priced on 10/03, never for the four QB-change games. In practice only DET@CAR qualified, and its 10-02 rows were unpriced too, so DET@CAR has **no priced player props** in either capture. ATL@NO has none (not captured either day). Rows carry `carried_from`.
  - Period lines, team totals and game props are not emitted (build.py doesn't read them).
- **Narratives**: 15 blocks, ~270–350 words each, to the §3 minimum except card tickets (see decision 1). Every block names experts on each side, the AN splits (Fri 23:30 PT), the AN-open → BKR-now move, the shortest TD prices / main lines, the secondary tier, the 10/03 ESPN injury feed (lower-case status words), and weather where it matters. Projections start at the market-implied score and move only for cited evidence; where a projection disagrees with the expert majority (IND@WAS, LAR@PHI) the block says so.
- **Roster gate:** first run BLOCKed on my own phrasing ("Recheck Evans" read as one name); reworded the sentence, no name changed. Added 15 analyst/podcast names from this week's evidence (Steve Fezzik, Ross Tucker, Kendra Middleton, Andrew Erickson, Brandon Kravitz, Doug Kezirian, Sean Koerner, Grant Neiffer, Gilles Gallant, Matt Moore, Pat Fitzmaurice, Derek Brown, Evan Abrams, John Jastremski, Derrik Klassen) to `data/nfl-rosters/non-player-names.json` after confirming none is on the ESPN 2026 roster.
- **build.py fix:** the expert linker split full names around one-word aliases ("<a>Ross</a> Tucker", "Andrew <a>Erickson</a>"). New `src_pat()` links the whole name when an alias is part of one; used by the §6 narrative cite, §4/§7 `link_sources` and the SuperContest `link_sources`.
- **Build check:** `build.py --week 4 --date 2026-10-03 --no-export` runs clean; all 15 games show projection, line-movement box ("Action Network open, Sun 9/27 5:00 PM PT → Bookmaker now") and the narrative. Afterwards I **restored `dist/nfl_week4_master_packet/` from the 04:31 copy**, so the packet on disk is unchanged until someone runs the real build.

## Leans in the narratives (for the card builder; not bets)

| Game | Projection | Lean |
|---|---|---|
| IND@WAS | IND 26–20 | pass side; Josh Downs receiving |
| NE@BUF | BUF 28–20 | BUF ML/teaser, not −7; James Cook III TD; total pass (slight under) |
| NYJ@CHI | CHI 23–20 | NYJ +3.5 |
| JAX@CIN | CIN 27–25 | JAX +2.5 / ML +129 (sharp gap); JAX +8.5 Wong leg; Parker Washington receiving |
| ARI@NYG | ARI 24–20 | ARI −2.5 / ML −143 (big money) |
| LAR@PHI | LAR 23–18 | LAR and under (against expert majority, with money + PHI WR outs); Kyren Williams TD |
| GB@TB | GB 21–16 | under 39.5; GB −3 only at 3 |
| TEN@BAL | BAL 26–16 | TEN +11.5 or BAL 1H |
| DAL@HOU | HOU 26–22 | HOU ML as parlay leg (−3 price gone); Nico Collins receiving |
| MIA@MIN | MIN 22–14 | MIA +10; under is right but 4 pts gone |
| KC@LV | KC 25–22 | LV +4.5; Brock Bowers receiving |
| DEN@SF | SF 24–23 | DEN +2.5 / ML +126; McCaffrey receiving; small under |
| LAC@SEA | SEA 24–16 | SEA ML leg + under (−7 is the key number) |
| DET@CAR | DET 28–24 | side ≈ pass; Jameson Williams + Darren Waller receiving (price-check: BKR menu unpriced) |
| ATL@NO | NO 25–23 | ATL +2.5 / ML +112 (big money); rewrite Monday after inactives |

## Evidence caveats found while writing

- **IND Keenan Allen is out** on the 10/03 17:51Z ESPN feed; `data/player-availability` (used by build.py's context bullet) still says questionable. WAS McLaurin is doubtful.
- **MIN QB:** ESPN lists Kyler Murray active, but BKR had **no MIN passing market** at the 10/03 capture (BetOnline priced him 183+ on 10/02; BKR had him on 10/01). Treat as a status question at the 11:35 PT inactives.
- **CHI QB:** BKR prices Tyson Bagent; the BettingPros CHI pick was written around Case Keenum (also listed active).
- Registry text that conflicts with rosters and was **not** used: an Action Network GB@TB note citing "Jayden Daniels" (means Jalon Daniels), a BettingPros KC note citing "Kareem Walker", podcast names "Domnite Meyers" / "Emmanuel Wilson" / "Steve Fezik", and BKR's "Cameron Skattebo" / "Mar'Keise Irving" (not on the ESPN roster; the gate lists them as info).
- Reconciliation rows from Gemini have some game tags wrong (e.g. Jonathan Taylor and Darren Waller rows filed under ARI@NYG). I only used rows whose content matched the game.
- AN splits show IND@WAS total at 92% under on tickets, which looks odd; the block doesn't rely on it.

## Still open

1. **Card** `reports/bets/2026-w04-card.md` (Andy's go-ahead), then a short pass adding ticket names to each "Why the card leans" section plus the `## TICKETS` and `## SUPERCONTEST` blocks (SuperContest lines: `data/supercontest/week-04-lines.json`).
2. Saturday digest `scratch/w04-synthesis-digest-sat.md`, survivor `data/survivor/pick-intel-2026-w04.json`.
3. Full build + `build_site.py` + republish to the same artifact URL, only with Andy's go-ahead.
4. Game day: 90-minute inactives (05:00 / 08:30 / 11:35 / 11:55 / 15:50 PT; Mon 15:45) and weather re-pulls; rewrite any block whose QB or key player changes. Rerun the roster gate after any edit.

## Commit

Staged by explicit path only: the narratives, `bkr_live_from_rendered.py`, `build.py`, `non-player-names.json`, this handoff and `HANDOFF.md`. Left alone: `scripts/master-intel/build_site.py` (another team's edits) and every other pre-existing dirty file.

## Resume prompt (fresh session)

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard on main.
Read-only on sportsbooks; no Supabase writes, no paid models, no bets.
Start: git fetch; git status --short --branch; git rev-list --left-right --count '@{u}...HEAD'. Never reset/clean/stash/git add -A.
Read: HANDOFF.md → handoffs/2026-10-03-1225-claude-week4-narratives-written-card-next-handoff.md → reports/intel/master-intel-narratives-2026-w04.md.
Next (only with Andy's go-ahead): build reports/bets/2026-w04-card.md per docs/NFL_WEEKLY_CARD_PROCESS.md using the leans table in that handoff, then add ticket names to each narrative block plus the ## TICKETS / ## SUPERCONTEST blocks. Build date is 2026-10-03 (data/generated/props/bookmaker-live-2026-10-03-week4.json; regenerate with scripts/master-intel/bkr_live_from_rendered.py if missing).
After any narrative edit: npm run roster:vet -- --week 4 --date 2026-10-03 --fetch --strict; stop on BLOCK; never repair names from memory; status words lower case.
Do not publish without Andy's go-ahead.
```
