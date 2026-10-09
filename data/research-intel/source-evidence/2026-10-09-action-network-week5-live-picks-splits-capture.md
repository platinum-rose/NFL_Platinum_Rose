# Action Network — Week 5 live picks and split capture

- Captured: `2026-10-09T19:41:08.878Z`
- Source views: `https://www.actionnetwork.com/nfl/picks/game` and `https://www.actionnetwork.com/nfl/picks`
- Raw rendering inspected: page-embedded `__NEXT_DATA__` payload on the game-indexed view.
- Scope: scheduled Week 5 games only. The completed TB @ DAL game is deliberately excluded from the active-pick and split tables below.
- Status: source evidence only; not a recommendation, official card, ticket, bankroll, or portfolio record.

## Pick inventory audit

The source payload contained **263 scheduled-game picks** across 14 remaining Week 5 games. Each raw pick object exposed: Action pick id, analyst/profile, username, creation time, play text, market type, line/value, American price, source book id, units, optional note, and game id. It did not expose a human-readable sportsbook name for every numeric `book_id` in this view.

| Game | Game id | Scheduled picks | Profiles represented |
|---|---:|---:|---|
| PHI @ JAC | 290820 | 11 | 5 |
| NYG @ WAS | 290904 | 16 | 6 |
| HOU @ TEN | 290905 | 13 | 7 |
| MIN @ NO | 290906 | 14 | 6 |
| CIN @ MIA | 290907 | 18 | 5 |
| CLE @ NYJ | 290908 | 19 | 9 |
| IND @ PIT | 290909 | 25 | 12 |
| LV @ NE | 290910 | 19 | 3 |
| CHI @ GB | 290914 | 23 | 9 |
| DEN @ LAC | 290911 | 21 | 10 |
| SF @ SEA | 290912 | 24 | 11 |
| DET @ ARI | 290913 | 20 | 9 |
| BAL @ ATL | 290915 | 23 | 10 |
| BUF @ LA | 290916 | 17 | 7 |

## Action split snapshot

The table is the current source snapshot carried under Action numeric `book_id: 15`; Action’s page payload did not label that book by name. `T/M` is ticket share / money share. These are observational public-betting fields, not executable prices or a signal to wager.

| Game | Spread (T/M) | Total (T/M) | Moneyline (T/M) |
|---|---|---|---|
| PHI @ JAC | JAC -7.5 -110 (60/57); PHI +7.5 -110 (40/43) | O41.5 -111 (40/37); U41.5 -108 (60/63) | JAC -387 (70/67); PHI +300 (30/33) |
| NYG @ WAS | WAS -4.5 -110 (26/25); NYG +4.5 -112 (74/75) | O41.5 -113 (77/70); U41.5 -109 (23/30) | WAS -200 (54/45); NYG +162 (46/55) |
| HOU @ TEN | HOU -7.5 -106 (70/66); TEN +7.5 -114 (30/34) | O38 -109 (77/70); U38 -109 (23/30) | HOU -390 (94/91); TEN +305 (6/9) |
| MIN @ NO | MIN -2.5 -110 (56/52); NO +2.5 -108 (44/48) | O41.5 -111 (76/73); U41.5 -110 (24/27) | MIN -143 (75/69); NO +119 (25/31) |
| CIN @ MIA | CIN -7 -112 (75/87); MIA +7 -108 (25/13) | O43.5 -108 (71/79); U43.5 -111 (29/21) | CIN -325 (95/96); MIA +260 (5/4) |
| CLE @ NYJ | CLE +2.5 -109 (84/74); NYJ -2.5 -110 (16/26) | O39.5 -113 (73/63); U39.5 -109 (27/37) | CLE +114 (69/66); NYJ -137 (31/34) |
| IND @ PIT | IND +2.5 -105 (65/61); PIT -2.5 -116 (35/39) | O43.5 -114 (73/64); U43.5 -106 (27/36) | IND +122 (41/51); PIT -146 (59/49) |
| LV @ NE | LV +3.5 -109 (72/77); NE -3.5 -110 (28/23) | O45.5 -104 (74/81); U45.5 -113 (26/19) | LV +160 (36/65); NE -198 (64/35) |
| CHI @ GB | CHI -1.5 -110 (57/46); GB +1.5 -110 (43/54) | O45.5 -111 (74/68); U45.5 -109 (26/32) | CHI -120 (72/66); GB -100 (28/34) |
| DEN @ LAC | DEN -3.5 -103 (54/54); LAC +3.5 -117 (46/46) | O41.5 -117 (69/61); U41.5 -107 (31/39) | DEN -181 (86/81); LAC +149 (14/19) |
| SF @ SEA | SF +3 -104 (82/88); SEA -3 -118 (18/12) | O46.5 -105 (71/73); U46.5 -113 (29/27) | SF +137 (54/42); SEA -166 (46/58) |
| DET @ ARI | DET -5.5 -109 (54/56); ARI +5.5 -110 (46/44) | O54.5 -108 (56/58); U54.5 -110 (44/42) | DET -250 (92/97); ARI +202 (8/3) |
| BAL @ ATL | BAL +3.5 -119 (53/41); ATL -3.5 -101 (47/59) | O44 -110 (72/73); U44 -109 (28/27) | BAL +150 (49/39); ATL -177 (51/61) |
| BUF @ LA | BUF +3.5 -110 (73/61); LA -3.5 -112 (27/39) | O54.5 -110 (62/69); U54.5 -110 (38/31) | BUF +149 (55/36); LA -179 (45/64) |

## Integrity notes

- This is an Action-site snapshot, not a live execution board. A numeric `book_id` and Action-displayed price must not be treated as a verified available offer.
- The embedded payload supplies the full pick objects, but the page’s visual cards can hide or truncate fields. Do not use the visible card count alone to infer a pick’s exact market or price.
- All 263 raw individual pick rows are preserved in `2026-10-09-action-network-week5-live-picks-raw.jsonl`. The rows remain source evidence until analyst attribution and market fields are independently reviewed; this capture itself does not promote any row.
