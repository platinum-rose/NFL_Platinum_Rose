# Prop Stack Agent (Platinum Rose) — v1, 2026-10-24

**Purpose.** Find the single best player/kicker/defense prop in *every* game of the slate from the whole intel build, then assemble diversified, non-correlated lottery stacks (one leg per game) plus the standard slot-7/8 tickets. Built at Andy's request (Sat 10/24 9:17 PM) after the Week 7 card's stacks clustered on three or four games and ignored kicking, IDP and QB-pressure angles.

## Two stages
1. **Per-game analyst** (one agent per game or small group of games). Reads the game's data pack and intel, scores every candidate in every category, writes `scratch/w<NN>-prop-agent/<AWAY>_at_<HOME>.json`.
2. **Stack builder** (main session). Reads all analyst files, picks one leg per game by score, enforces book and correlation rules, writes the tickets into the card (`### name — BOOK — **$x** — price — return` format) and the Master rebuild picks them up.

## Inputs (per game)
- Data pack `scratch/w<NN>-prop-packs/<AWAY>_at_<HOME>.json` (built by `scratch/w07_build_prop_packs.py`): 2026 ESPN box-score logs for every player by category (passing C/ATT, YDS, TD, INT, SACKS; rushing; receiving incl. TGTS; **defensive TOT/SOLO/SACKS/TFL/QB HTS**; **interceptions**; **kicking FG made/att, LONG**), team profiles (FG made, sacks taken, INTs thrown, defensive sacks and INTs per game), captured boards (BKR, BEO, BKR FG markets), availability rows.
- Synthesis files listed in the pack: `-sides.md` (simulator, fair lines, game script, splits), `-props.md` (recommendation box, TD lists, counter-case), the Saturday recheck table in the narratives file, team dossiers (EPA, sack rate allowed/generated, FTN INTW%, pressure notes), secondary matchups.
- DK Predictions contract board (`data/generated/props/draftkings-predictions-live-*-week<N>.json`) for TD probabilities (reference, before fees).
- Rosters: `data/nfl-rosters/roster-map-latest.json` (never place a player on a team from memory; search the web if a player is missing).

## Categories to score in every game (at least one candidate each where data exists)
QB passing (yards/TD/completions) · **QB pressure: INT thrown Over 0.5 and sacks taken** (use sacks-taken per game, opponent sacks generated, FTN INTW%/TWP, first-start or backup QBs, OL injuries, wind) · RB · WR · TE · **K / team field goals** (team FG made per game, red-zone TD rate from the dossier, wind/dome, game total lean) · **IDP: tackles+assists, sacks, defensive INT** (box-score TOT and SACKS logs; opponent run rate/plays; even when no market is posted, give a projected line and say "price at recapture") · anytime TD · first TD.

## Scoring (each candidate)
- `p_hit`: your probability from the logs (hit rate over the last 6, adjusted for matchup and script), never just the book price.
- `fair_odds` from p_hit; `best_price` and `book` from captured boards; `edge = p_hit × decimal(best_price) − 1`.
- `confidence`: A/B/C. Cite evidence (file + figure). Name the counter-case.
- Tags: `script` (e.g. "NYJ red-zone stalls", "trailing pass volume"), `correlates_with` (other legs in the same game that move together), `availability_risk`.
- Barriers: no leg shorter than -350; flag legs shorter than -200; Andy avoids median-line overs (use alternates); receptions overs only for the expected winner.

## Output JSON (per game)
`{game, best_leg:{...}, best_non_td_leg:{...}, best_contrarian_leg:{...}, categories:{qb_pass:[...], qb_pressure:[...], rb:[...], wr:[...], te:[...], k:[...], idp_tackles:[...], idp_sacks:[...], idp_int:[...], atd:[...], first_td:[...]}, notes:[...]}`; each candidate: `{player, team, market, line, side, best_price, book, p_hit, fair_odds, edge, confidence, evidence:[{text,source}], counter, tags, executable:true|false}`.

## Stack rules (stage 2)
- **One leg per game** in every cross-game lottery ticket; legs from different games are treated as independent. No leg may conflict with a Platinum Rose recommendation (e.g. no Over yardage in a game where the card's rec is the Under unless the script supports it) and no exact duplicate of a live ticket leg.
- **Books:** **BEO (BetOnline) is Andy's cross-game prop book** (Andy 2026-10-24: his 8-leg cross-game prop parlay — passing TDs, rushing yards, anytime TDs, a team field-goal total — was BEO). BEO posts player props for every game, but our BEO scraper only parsed three games' player props in Week 7, so most BEO prices must be read at the slip; quote BKR/DKP prices as references. BKR = player props same-game only (SGPs; BKR QB INT props are not allowed in BKR SGPs, so never use them). DK Predictions = TD markets (contract prices before fees). Andy has no Bovada account: never use Bovada.
- **Templates:** 13-leg "Perfect Lottery" (best leg per game) and a 7-8 leg "Core" (highest p_hit legs, one per game); window tickets 7a (morning) / 7b (afternoon) with a night leg last; 7d Hybrid 8-leg; 7e Anytime TD 7-leg; 8a First TD 3-leg; 8b 2+ TD 3-leg; a **Pressure ticket** (QB INT/sack + IDP sack legs across games) and a **Field-goal ticket** (kicking legs where red-zone stalls are the script). Units: $10 parlays.
- Report naive product prices as estimates; request the live combo price.
