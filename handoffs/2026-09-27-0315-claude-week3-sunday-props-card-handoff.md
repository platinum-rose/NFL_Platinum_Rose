# Week 3 Sunday player-prop card — handoff (2026-09-27 03:15 PT)

- Scope: player props only. No wager, account, Supabase, TheOddsAPI, or official-pick action. Game-card record unchanged (`reports/bets/week3-game-card-record-2026-09-27.md`).
- Git at start: `main` = `origin/main` at `9c7d301`; tracked edits in HANDOFF.md + synthesis prompt were pre-existing; no locks. Nothing committed this session.
- Prices: no Sunday re-capture existed. Andy pointed to `docs/Player_Prop_Odds_Weekly/Week3`; those are the Saturday captures (BEO ~12:45 PT, BKR SGP JSON ~13:48 PT). Every price used is consolidated in `data/odds/props_w03_candidates_0927_0311.json`; card marks all as confirm-on-slip.
- Card: `reports/bets/2026-w03-sunday-props-2026-09-27.md`. Prop RR (Allen 2+ pass TD, Purdy 2+ pass TD, Schwesinger 9+ T+A, Roquan 8+ T+A, Tuten 53+ rush) · 2-leg Mahomes 2+ TD + Drake Thomas 7+ T+A · singles Downs 7+ T+A, J. Taylor o81.5 (BKR) · 2+TD stack Allen/Henry/McCaffrey $5 · Kittle ATD $5. SNF ladder held (Nacua doubtful; needs a BKR SGP quote).
- Roster vet `--week 3 --date 2026-09-26 --fetch --strict --card <prop card>`: PASS (12 legs). Default vet: PASS.
- Next: inactives at ~8:30 PT (10:00 games) and ~11:45 PT (afternoon games). Re-run the vet, confirm slip prices, then record placements. The recommendation ledger (DEV project `claude/recommendation-ledger-2026.md`) gets updated only after Andy places.

## Update 03:40 PT — v2 per Andy
- Andy: no round robins with player props. Card rebuilt to the slot 7/8 stack templates (7a Morning 6-leg $5, 7b Afternoon 4-leg $5, 7d Hybrid 8-leg $10, 7e ATD 7-leg $5, 8a First TD $5, 8b 2+TD $5; 7c and the SNF island are held). $35 total plus an optional $10 Taylor single. No exact duplicate legs across tickets. Strict roster vet on the v2 card: PASS (22 legs).

## Update 03:25 PT: HOU@IND BEO board
- Andy added `BEO_Week3_HOU_IND` (Sun 03:20 PT). Parsed the full Week3 folder to `data/generated/props/beo-w03-0927_0320.json`. Card v2.1: 7a swaps Chase Brown 54+ rush for J. Taylor 72+ rush −176 (+2352, $5 returns $122.62); 7e swaps Kelce ATD for J. Taylor ATD −167 (+6154, $5 returns $312.70). Strict roster vet re-run on the card.
