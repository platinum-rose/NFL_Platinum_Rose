# Handoff: Platinum Rose Week 7, Sat 2026-10-24 ~10:15 PM PT — Master sent to clients, Prop Stack Agent v1

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. Use `git -c core.fsmonitor=false`; stage named files only (dirty shared checkout).

## What shipped tonight
- **Master Intel report fixed and sent to clients by Andy (as-is, ~10:00 PM).** File: `dist/nfl_week7_master_packet/Platinum_Rose_NFL_Week7_Intel.html` (build Sat 10:20 PM PT; self-contained, verified offline). PDFs re-exported (Master 268 pp, SuperContest 15 pp) into the same folder. SuperContest report byte-identical to the 7:07 PM version Andy approved.
- **Root cause of the "dysfunctional" Master:** no Saturday synthesis digest existed; the build fell back to a 2 KB Friday stub. Fixed by writing `scratch/w07-synthesis-digest-sat.md` in the W6 format (§C = Platinum Rose recs, §L = leans).
- **Build date:** the Sat-evening captures are stamped with the next UTC date. Build with `--date 2026-10-25` (Windows Python 3.14 via Desktop Commander: `cd E:\dev\projects\NFL_Dashboard; $env:PYTHONIOENCODING='utf-8'; & 'C:\Users\andre\AppData\Local\Python\pythoncore-3.14-64\python.exe' scripts/master-intel/build.py --week 7 --date 2026-10-25`). Roster gate PASS.

## Decisions Andy made tonight (do not re-ask)
- **Elevation bar** (sides and totals, every week): model edge ~1.5+ pts vs fair with the simulator agreeing, an independent expert or sharp signal on the same side, no serious contrary evidence. Every rec carries **The Pitch / The Pushback** (`reports/intel/master-pitches-<season>-w<NN>.json`). Leans show muted on game cards and in a "🟡 Leans: not elevated" block on Picks and Ranked. Written into `docs/MASTER_INTEL_REPORT_FORMAT.md`.
- **Week 7 Platinum Rose recs (8):** GB +3.5, NYJ -4, ARI +4.5, KC ML +129 (the last three elevated by Andy at 9:17 PM); Under 41.5 IND/MIN, Under 39 MIA/NYJ, Under 47 CIN/BAL, Over 44.5 TB/CAR (only if Mayfield active). NYG +10, KC +3 (spread) and TB@CAR side are leans.
- **SuperContest report format + function locked** as of the W7 build (see format doc §8).
- **Units:** $10 for all parlays/round robins, $20 singles. Master RR (8 legs by 4s, $70) and Dog ML RR ($20; LV only if Nacua is inactive) built. Two hybrids without the Paris game (Hybrid A/B, BEO).
- **Props:** at least two per position per game (card §7f), one ATD per team and one first TD per game (§7g), plus the Prop Stack Agent tickets (§7h).
- **Books:** Andy's cross-game prop book is **BEO** (his +23,607 8-leg ticket was BEO). No Bovada account: never use Bovada. BKR QB INT props are not allowed in BKR SGPs: ignore them (Andy will capture them later).
- **Client edition:** Andy wants a client-safe edition of the Master starting **Week 8** (strip Andy/Amanda names, live-ticket/exposure notes, repo file paths). This week went out as-is.

## Prop Stack Agent v1
- Spec: `agents/dev/PROP_STACK_AGENT.md`. Data packs: `scratch/w07_build_prop_packs.py` → `scratch/w07-prop-packs/*.json` (2026 ESPN box scores, all positions incl. K and IDP; team FG / sacks taken / INT profiles). Analyst outputs: `scratch/w07-prop-agent/*.json` (13 games). Stack builder: `scratch/w07_stack_builder.py` → card §7h.
- Tickets ($10, BEO, one leg per game): Perfect Lottery 13-leg, Core 7-leg, Field-Goal 7-leg, QB Pressure 8-leg (pending markets), IDP Tackles 7-leg (pending markets), 7a Morning 6-leg, 7b Afternoon 4-leg. Headings show book-implied odds and the (optimistic, small-sample) log-based estimate.
- Gaps found: the roster map has offense only (defenders/kickers verified against `espn-full-rosters-latest.json`); pack availability rows have null status; **our BEO scraper only parsed player props for 3 games** although BEO posts them for every game; no IDP or sack markets posted anywhere Saturday; some team packs miss a game (KC 4, DAL 5).

## Still open
1. **Drive:** replace the Week 07 files in place (HTML `1zS8FI1eFdHabzDHPF9H9b8YHdxRWGsCh`, DOCX `1aFw0l66vEHEvDKceE3CGXD92z5pC6K0P`, MD `1l3-itOic8PoPRei9R7xsB_J3xqUNr7C6`, JSON `1s6istCiewgqkIVHcbszp4fiiauAKhLv_`, folder `1zj8ibctIp8QcyxCVH2I3aNUvskXmR7Fe`). Claude's Drive connector cannot see these IDs (different account) and cannot upload new versions; Andy or the account that created them must do it. Add the two new PDFs.
2. **SuperContest 5-teamer stake:** template $15 + $10 RR vs $10 + $10 at the new unit — unanswered. Official five (Andy + Amanda) still unconfirmed; save to `data/supercontest/locked-card-week-7.json` once confirmed.
3. **Card placement review:** nothing placed. Andy marks up `reports/bets/2026-w07-card.md` before anything is placed.
4. **Sunday:** 5:00 AM PT Paris inactives + wind (wind-driven PIT@NO legs drop a tier if gusts < 30 km/h); 8:30 AM inactives (Mayfield → TB Over / Hybrid B swap to DEN@ARI U43.5; Hall → Braelon Allen legs); ~11:55 AM (Nacua → LV in dog RR, Rams TD legs; Bowers, Jacobs); 3:50 PM SNF; Mon 3:45 PM MNF (Barkley, Goedert). Recapture BEO/BKR props, price the IDP and QB-pressure legs when posted. Aaron Jones carries +161 was set before Mason was ruled out.
5. **Pool sheet:** `reports/bets/2026-w07-pool-picks-fri.md` already reserves CHI at Duma 7 / Kenny 5 (Saturday 1:30 PM note); table not re-audited tonight.
