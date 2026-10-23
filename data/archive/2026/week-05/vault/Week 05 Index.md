---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 5"
created: "2026-10-15T13:00:56.959Z"
modified: "2026-10-15T13:00:56.959Z"
season: 2026
week: 5
type: "week-index"
tags: ["nfl", "season-2026", "week-05", "nfl/week-index"]
games: 15
favorites_ats: "7-8-0"
overs: 8
unders: 7
---
# NFL 2026 — Week 5

Favorites ATS 7-8-0 · Overs 8 of 15 · archived 2026-10-15T13:00Z

## Games

- [[NFL/2026/Week 05/Games/TB @ DAL|TB 24 @ DAL 16]]
- [[NFL/2026/Week 05/Games/PHI @ JAX|PHI 17 @ JAX 19]]
- [[NFL/2026/Week 05/Games/CIN @ MIA|CIN 31 @ MIA 24]]
- [[NFL/2026/Week 05/Games/CLE @ NYJ|CLE 12 @ NYJ 17]]
- [[NFL/2026/Week 05/Games/HOU @ TEN|HOU 26 @ TEN 3]]
- [[NFL/2026/Week 05/Games/IND @ PIT|IND 22 @ PIT 34]]
- [[NFL/2026/Week 05/Games/LV @ NE|LV 17 @ NE 45]]
- [[NFL/2026/Week 05/Games/MIN @ NO|MIN 23 @ NO 13]]
- [[NFL/2026/Week 05/Games/NYG @ WSH|NYG 27 @ WSH 27]]
- [[NFL/2026/Week 05/Games/CHI @ GB|CHI 7 @ GB 31]]
- [[NFL/2026/Week 05/Games/DEN @ LAC|DEN 23 @ LAC 17]]
- [[NFL/2026/Week 05/Games/DET @ ARI|DET 45 @ ARI 21]]
- [[NFL/2026/Week 05/Games/SF @ SEA|SF 32 @ SEA 29]]
- [[NFL/2026/Week 05/Games/BAL @ ATL|BAL 30 @ ATL 23]]
- [[NFL/2026/Week 05/Games/BUF @ LAR|BUF 37 @ LAR 34]]

## Teams

[[NFL/2026/Week 05/Teams/ARI|ARI]] · [[NFL/2026/Week 05/Teams/ATL|ATL]] · [[NFL/2026/Week 05/Teams/BAL|BAL]] · [[NFL/2026/Week 05/Teams/BUF|BUF]] · [[NFL/2026/Week 05/Teams/CHI|CHI]] · [[NFL/2026/Week 05/Teams/CIN|CIN]] · [[NFL/2026/Week 05/Teams/CLE|CLE]] · [[NFL/2026/Week 05/Teams/DAL|DAL]] · [[NFL/2026/Week 05/Teams/DEN|DEN]] · [[NFL/2026/Week 05/Teams/DET|DET]] · [[NFL/2026/Week 05/Teams/GB|GB]] · [[NFL/2026/Week 05/Teams/HOU|HOU]] · [[NFL/2026/Week 05/Teams/IND|IND]] · [[NFL/2026/Week 05/Teams/JAX|JAX]] · [[NFL/2026/Week 05/Teams/LAC|LAC]] · [[NFL/2026/Week 05/Teams/LAR|LAR]] · [[NFL/2026/Week 05/Teams/LV|LV]] · [[NFL/2026/Week 05/Teams/MIA|MIA]] · [[NFL/2026/Week 05/Teams/MIN|MIN]] · [[NFL/2026/Week 05/Teams/NE|NE]] · [[NFL/2026/Week 05/Teams/NO|NO]] · [[NFL/2026/Week 05/Teams/NYG|NYG]] · [[NFL/2026/Week 05/Teams/NYJ|NYJ]] · [[NFL/2026/Week 05/Teams/PHI|PHI]] · [[NFL/2026/Week 05/Teams/PIT|PIT]] · [[NFL/2026/Week 05/Teams/SEA|SEA]] · [[NFL/2026/Week 05/Teams/SF|SF]] · [[NFL/2026/Week 05/Teams/TB|TB]] · [[NFL/2026/Week 05/Teams/TEN|TEN]] · [[NFL/2026/Week 05/Teams/WSH|WSH]]

## Fantasy & contests

- [[NFL/2026/Week 05/Fantasy/2026 -  The League|2026 -  The League]]
- [[NFL/2026/Week 05/Fantasy/The Honey Badgers|The Honey Badgers]]
- [[NFL/2026/Week 05/Fantasy/Rose Bowl XIX|Rose Bowl XIX]]
- [[NFL/2026/Week 05/Fantasy/CC Bowl XV CHAMPIONS LEAGUE|CC Bowl XV CHAMPIONS LEAGUE]]
- [[NFL/2026/Week 05/Fantasy/RFI XIX|RFI XIX]]
- [[NFL/2026/Week 05/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 05/Betting|Betting]]

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
WHERE type = "team-week" AND week = 5 AND contains(string(flags), "despite")
```
