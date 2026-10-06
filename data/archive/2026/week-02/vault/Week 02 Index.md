---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 2"
created: "2026-10-06T20:08:24.544Z"
modified: "2026-10-06T20:08:24.544Z"
season: 2026
week: 2
type: "week-index"
tags: ["nfl", "season-2026", "week-02", "nfl/week-index"]
games: 16
favorites_ats: "8-8-0"
overs: 6
unders: 10
---
# NFL 2026 — Week 2

Favorites ATS 8-8-0 · Overs 6 of 16 · archived 2026-10-06T20:08Z

## Games

- [[NFL/2026/Week 02/Games/DET @ BUF|DET 31 @ BUF 41]]
- [[NFL/2026/Week 02/Games/CAR @ ATL|CAR 34 @ ATL 3]]
- [[NFL/2026/Week 02/Games/CIN @ HOU|CIN 20 @ HOU 6]]
- [[NFL/2026/Week 02/Games/CLE @ TB|CLE 23 @ TB 19]]
- [[NFL/2026/Week 02/Games/GB @ NYJ|GB 20 @ NYJ 17]]
- [[NFL/2026/Week 02/Games/MIN @ CHI|MIN 9 @ CHI 3]]
- [[NFL/2026/Week 02/Games/NO @ BAL|NO 24 @ BAL 17]]
- [[NFL/2026/Week 02/Games/PHI @ TEN|PHI 24 @ TEN 20]]
- [[NFL/2026/Week 02/Games/JAX @ DEN|JAX 13 @ DEN 20]]
- [[NFL/2026/Week 02/Games/LV @ LAC|LV 26 @ LAC 14]]
- [[NFL/2026/Week 02/Games/MIA @ SF|MIA 13 @ SF 35]]
- [[NFL/2026/Week 02/Games/SEA @ ARI|SEA 31 @ ARI 7]]
- [[NFL/2026/Week 02/Games/WSH @ DAL|WSH 20 @ DAL 37]]
- [[NFL/2026/Week 02/Games/IND @ KC|IND 30 @ KC 33]]
- [[NFL/2026/Week 02/Games/PIT @ NE|PIT 3 @ NE 20]]
- [[NFL/2026/Week 02/Games/NYG @ LAR|NYG 6 @ LAR 28]]

## Teams

[[NFL/2026/Week 02/Teams/ARI|ARI]] · [[NFL/2026/Week 02/Teams/ATL|ATL]] · [[NFL/2026/Week 02/Teams/BAL|BAL]] · [[NFL/2026/Week 02/Teams/BUF|BUF]] · [[NFL/2026/Week 02/Teams/CAR|CAR]] · [[NFL/2026/Week 02/Teams/CHI|CHI]] · [[NFL/2026/Week 02/Teams/CIN|CIN]] · [[NFL/2026/Week 02/Teams/CLE|CLE]] · [[NFL/2026/Week 02/Teams/DAL|DAL]] · [[NFL/2026/Week 02/Teams/DEN|DEN]] · [[NFL/2026/Week 02/Teams/DET|DET]] · [[NFL/2026/Week 02/Teams/GB|GB]] · [[NFL/2026/Week 02/Teams/HOU|HOU]] · [[NFL/2026/Week 02/Teams/IND|IND]] · [[NFL/2026/Week 02/Teams/JAX|JAX]] · [[NFL/2026/Week 02/Teams/KC|KC]] · [[NFL/2026/Week 02/Teams/LAC|LAC]] · [[NFL/2026/Week 02/Teams/LAR|LAR]] · [[NFL/2026/Week 02/Teams/LV|LV]] · [[NFL/2026/Week 02/Teams/MIA|MIA]] · [[NFL/2026/Week 02/Teams/MIN|MIN]] · [[NFL/2026/Week 02/Teams/NE|NE]] · [[NFL/2026/Week 02/Teams/NO|NO]] · [[NFL/2026/Week 02/Teams/NYG|NYG]] · [[NFL/2026/Week 02/Teams/NYJ|NYJ]] · [[NFL/2026/Week 02/Teams/PHI|PHI]] · [[NFL/2026/Week 02/Teams/PIT|PIT]] · [[NFL/2026/Week 02/Teams/SEA|SEA]] · [[NFL/2026/Week 02/Teams/SF|SF]] · [[NFL/2026/Week 02/Teams/TB|TB]] · [[NFL/2026/Week 02/Teams/TEN|TEN]] · [[NFL/2026/Week 02/Teams/WSH|WSH]]

## Fantasy & contests

- [[NFL/2026/Week 02/Fantasy/2026 -  The League|2026 -  The League]]
- [[NFL/2026/Week 02/Fantasy/The Honey Badgers|The Honey Badgers]]
- [[NFL/2026/Week 02/Fantasy/Rose Bowl XIX|Rose Bowl XIX]]
- [[NFL/2026/Week 02/Fantasy/CC Bowl XV CHAMPIONS LEAGUE|CC Bowl XV CHAMPIONS LEAGUE]]
- [[NFL/2026/Week 02/Fantasy/RFI XIX|RFI XIX]]
- [[NFL/2026/Week 02/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 02/Betting|Betting]]

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
WHERE type = "team-week" AND week = 2 AND contains(string(flags), "despite")
```
