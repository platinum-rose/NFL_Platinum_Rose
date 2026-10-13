DraftKings lines for the two Week 6 games BKR had not posted (ARI@LAR, BUF@LV). NOT BKR.

- Source: Supabase `game_odds_snapshots`, book=draftkings, captured_at 2026-10-13 14:00:00Z (07:00 PT), written by the Tuesday cadence (agents/game-odds-ingest.js, TheOddsAPI).
- Spread/total/ML copied unchanged. Total juice not carried (shown as -110 placeholder; the synthesis ignores prices). Spread juice as stored.
- Cross-book check at same capture: FanDuel LAR -12.5, total 52.5; BetMGM LAR -12.5, total 52.5. BUF@LV: FanDuel LV +5.5 / total 53.5; BetMGM LV +6 / total 53.0.
- Use only as a stand-in until BKR posts these games. Pass after the BKR board so BKR overrides: --bkr data/odds/DKSNAP_current_lines_1013_0700_buildfmt,data/odds/BKR_current_lines_<new>_buildfmt (later wins). Currently BKR has neither game, so order is irrelevant.
