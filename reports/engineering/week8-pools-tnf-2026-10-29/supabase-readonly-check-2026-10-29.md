# Supabase read-only check — October 29, 2026, about 3:05 PM PT

Approved by Andy at 3:00 PM PT ("run the Supabase check (read-only)"). Project aambmuzfcojxqvbzhngp. Five SELECT queries; no writes. Results are summarized below; the raw rows were not saved.

## Afternoon article intake (47 feed deltas + 1 Action supplement)

- **All 48 URL hashes have a row in `research_intel_notes`.** The scheduled ingest, which runs every 30 minutes (rows captured at :03/:33), already stored them.
- **34 rows are current (captured Oct 29)**, all with nonempty bodies. That includes the Action Network TNF preview (note 10167, 10,766 characters), so the direct-RSS 403 seen locally did not block the database pipeline.
- **14 rows are older versions of URLs that are reused or updated in place.** The database holds an earlier capture, not today's content: ESPN items 9, 11, 12, 17 (11, 12 and 17 have no body) and the Sharp evergreen pages 35–43. The affected Sharp pages are the referee assignments, the TNF worksheet (note 9911, Oct 27), fantasy rankings, odds/picks, player props, weather, implied team totals, SGP picks and matchups. VSiN's betting hub (44) is also an older version. Today's Week 8 content of those pages exists only in the local afternoon capture.
- Item 19 (Simmons trade, ESPN) is stored as a 15:01 UTC version; the feed later showed 18:23 UTC. Body equality was not checked.

## Pasted Action Network expert picks (33 rows)

- **Not present.** No `research_pick_signals` row since Oct 27 matches the pasted prop selections (Hubbard, Okereke, Etienne, Coker, Kraft, Golden, Jacobs, Watson, McMillan, Waller, Williams, Love props). Authors from the paste appear only 4 times since Oct 28, and those are article-level rows (for example Koerner's TNF preview, note 10134).
- `user_picks` since Oct 27 has 8 CAR/GB-related rows from BettingPros, Jeremiah & Brooks, Even Money and Sharp or Square. None are from the paste.

## CAR @ GB signals already in the database (useful context)

- CAR +3.5: Walter Football (0 units), VSiN best bet, Erickson (BettingPros).
- CAR +4 and CAR ML: Zachary Cohen (VSiN).
- Under 48: Walter Football. Walter predicts GB 23–20; PFT predicts GB 27–16.
- GB −3.5 −112: Action Network (Lanfranca, from the preview).
- Props: Kraft over 3.5 receptions (Linemate, X bookmark); McMillan over 49.5 receiving yards (Harry Lock Picks).
- Trend: road divisional underdogs vs a team off a bye, 32–19 ATS (Lock & Cash). Its applicability to this game is unverified.

## Newer notes than the local intake (captured 19:03–21:33 UTC)

These were not in the local afternoon capture:
- Action "Packers vs Panthers Odds, Picks, Parlay" (10185)
- Action "Week 8 First Touchdown Model" (10190)
- Sharp "Week 8 Best Bets: ATS & totals" (10193)
- Steve Makinen (VSiN) Week 8 best bets (10203)

Practice notes:
- **Amon-Ra St. Brown logged a full practice Thursday** (10199).
- Lamar Jackson had another full practice (10204, 10207).
- Dalton Kincaid limited (10206). DJ Moore officially limited (10208).
- A.J. Brown a confirmed non-participant (10198).
- Ja'Marr Chase had no limitations (10209).
- TreVeyon Henderson sat with illness (10197).
- Travis Kelce limited (10219). Rashee Rice limited (10218).

Read-only. No insert, update or delete was run.
