---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 6"
created: "2026-10-22T14:43:27.667Z"
modified: "2026-10-22T14:43:27.667Z"
season: 2026
week: 6
type: "week-index"
tags: ["nfl", "season-2026", "week-06", "nfl/week-index"]
games: 14
favorites_ats: "5-9-0"
overs: 7
unders: 7
---
# NFL 2026 — Week 6

Favorites ATS 5-9-0 · Overs 7 of 14 · archived 2026-10-22T14:43Z

## Games

- [[NFL/2026/Week 06/Games/SEA @ DEN|SEA 14 @ DEN 17]]
- [[NFL/2026/Week 06/Games/HOU @ JAX|HOU 34 @ JAX 31]]
- [[NFL/2026/Week 06/Games/BAL @ CLE|BAL 10 @ CLE 13]]
- [[NFL/2026/Week 06/Games/CAR @ PHI|CAR 25 @ PHI 14]]
- [[NFL/2026/Week 06/Games/CHI @ ATL|CHI 31 @ ATL 23]]
- [[NFL/2026/Week 06/Games/NO @ NYG|NO 34 @ NYG 27]]
- [[NFL/2026/Week 06/Games/NYJ @ NE|NYJ 19 @ NE 26]]
- [[NFL/2026/Week 06/Games/PIT @ TB|PIT 26 @ TB 19]]
- [[NFL/2026/Week 06/Games/TEN @ IND|TEN 26 @ IND 20]]
- [[NFL/2026/Week 06/Games/ARI @ LAR|ARI 18 @ LAR 16]]
- [[NFL/2026/Week 06/Games/BUF @ LV|BUF 33 @ LV 30]]
- [[NFL/2026/Week 06/Games/LAC @ KC|LAC 6 @ KC 22]]
- [[NFL/2026/Week 06/Games/DAL @ GB|DAL 13 @ GB 23]]
- [[NFL/2026/Week 06/Games/WSH @ SF|WSH 17 @ SF 23]]

## Teams

[[NFL/2026/Week 06/Teams/ARI|ARI]] · [[NFL/2026/Week 06/Teams/ATL|ATL]] · [[NFL/2026/Week 06/Teams/BAL|BAL]] · [[NFL/2026/Week 06/Teams/BUF|BUF]] · [[NFL/2026/Week 06/Teams/CAR|CAR]] · [[NFL/2026/Week 06/Teams/CHI|CHI]] · [[NFL/2026/Week 06/Teams/CLE|CLE]] · [[NFL/2026/Week 06/Teams/DAL|DAL]] · [[NFL/2026/Week 06/Teams/DEN|DEN]] · [[NFL/2026/Week 06/Teams/GB|GB]] · [[NFL/2026/Week 06/Teams/HOU|HOU]] · [[NFL/2026/Week 06/Teams/IND|IND]] · [[NFL/2026/Week 06/Teams/JAX|JAX]] · [[NFL/2026/Week 06/Teams/KC|KC]] · [[NFL/2026/Week 06/Teams/LAC|LAC]] · [[NFL/2026/Week 06/Teams/LAR|LAR]] · [[NFL/2026/Week 06/Teams/LV|LV]] · [[NFL/2026/Week 06/Teams/NE|NE]] · [[NFL/2026/Week 06/Teams/NO|NO]] · [[NFL/2026/Week 06/Teams/NYG|NYG]] · [[NFL/2026/Week 06/Teams/NYJ|NYJ]] · [[NFL/2026/Week 06/Teams/PHI|PHI]] · [[NFL/2026/Week 06/Teams/PIT|PIT]] · [[NFL/2026/Week 06/Teams/SEA|SEA]] · [[NFL/2026/Week 06/Teams/SF|SF]] · [[NFL/2026/Week 06/Teams/TB|TB]] · [[NFL/2026/Week 06/Teams/TEN|TEN]] · [[NFL/2026/Week 06/Teams/WSH|WSH]]

## Fantasy & contests

- [[NFL/2026/Week 06/Fantasy/2026 -  The League|2026 -  The League]]
- [[NFL/2026/Week 06/Fantasy/The Honey Badgers|The Honey Badgers]]
- [[NFL/2026/Week 06/Fantasy/Rose Bowl XIX|Rose Bowl XIX]]
- [[NFL/2026/Week 06/Fantasy/CC Bowl XV CHAMPIONS LEAGUE|CC Bowl XV CHAMPIONS LEAGUE]]
- [[NFL/2026/Week 06/Fantasy/RFI XIX|RFI XIX]]
- [[NFL/2026/Week 06/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 06/Betting|Betting]]

## Queries (Dataview)

```dataview
TABLE week, opponent, result, ats, ou, ypp_diff, to_margin, pts_vs_implied
FROM "NFL/2026"
WHERE type = "team-week" AND team = "ATL"
SORT week ASC
```

```dataview
TABLE team, result, ypp_diff, flags
FROM "NFL/2026"
WHERE type = "team-week" AND week = 6 AND contains(string(flags), "despite")
```
