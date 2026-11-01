# Week 8 SuperContest source reconciliation

The saved Week 8 sheet matches all 14 matchups, favorites, home teams and spreads on [Westgate’s official Week 8 sheet](https://www.westgateresorts.com/supercontest/download/2026%20SUPERCONTEST%20GAME%20SHEET%20WEEK%208.pdf?contest=/2026/SuperContest/Card). The local `latest.json` pointer was updated from Week 7 to the existing Week 8 file; the prior pointer is backed up here.

The market values below are the **saved BetOnline capture from 10:10 AM Pacific on October 29**. They are historical observations, not current executable offers or closing lines. A positive difference favors the contest favorite; a negative difference favors the contest underdog. Prices can move.

| Matchup | Contest favorite line | Saved BEO favorite line | Difference (contest minus BEO) |
|---|---:|---:|---:|
| CAR @ GB | GB -3.5 | GB -3.5 (-110) | 0 |
| MIN @ DET | DET -3.5 | DET -3.5 (+100) | 0 |
| LV @ NYJ | NYJ -1.5 | NYJ -1 (-116) | -0.5 |
| ARI @ DAL | DAL -6.5 | DAL -7 (-113) | +0.5 |
| ATL @ TB | TB -2.5 | TB -1 (-128) | -1.5 |
| BAL @ BUF | BUF -3.5 | BUF -3 (-116) | -0.5 |
| IND @ JAX | JAX -9.5 | JAX -10 (-110) | +0.5 |
| TEN @ CIN | CIN -10.5 | CIN -11.5 (-110) | +1 |
| CLE @ PIT | PIT -3.5 | PIT -3 (-125) | -0.5 |
| LAC @ LAR | LAR -6.5 | LAR -6.5 (-108) | 0 |
| KC @ DEN | KC -1 | KC -1 (-115) | 0 |
| NE @ MIA | NE -7 | NE -7 (-107) | 0 |
| PHI @ WSH | WSH -5.5 | WSH -5.5 (-115) | 0 |
| CHI @ SEA | SEA -3 | SEA -3 (-114) | 0 |

The separately saved DraftKings/FanDuel comparison is labeled Week 8 but its underlying snapshot was captured **October 28 at 2:00 PM Pacific**, before the manual Week 8 sheet capture. Its `synced_at` timestamp on October 29 does not make the underlying odds fresh; its `clv` fields are differences against that historical snapshot, not verified closing-line value.

The full live Thursday cadence has not been rerun or certified. There were no Supabase, account, wager, ledger or paid operations in this reconciliation.
