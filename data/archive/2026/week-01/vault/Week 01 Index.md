---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 1"
created: "2026-10-06T20:08:21.268Z"
modified: "2026-10-06T20:08:21.268Z"
season: 2026
week: 1
type: "week-index"
tags: ["nfl", "season-2026", "week-01", "nfl/week-index"]
games: 16
favorites_ats: "9-6-1"
overs: 9
unders: 7
---
# NFL 2026 — Week 1

Favorites ATS 9-6-1 · Overs 9 of 16 · archived 2026-10-06T20:08Z

## Games

- [[NFL/2026/Week 01/Games/NE @ SEA|NE 10 @ SEA 13]]
- [[NFL/2026/Week 01/Games/SF @ LAR|SF 27 @ LAR 7]]
- [[NFL/2026/Week 01/Games/ATL @ PIT|ATL 13 @ PIT 20]]
- [[NFL/2026/Week 01/Games/BAL @ IND|BAL 41 @ IND 23]]
- [[NFL/2026/Week 01/Games/BUF @ HOU|BUF 36 @ HOU 31]]
- [[NFL/2026/Week 01/Games/CHI @ CAR|CHI 59 @ CAR 37]]
- [[NFL/2026/Week 01/Games/CLE @ JAX|CLE 10 @ JAX 34]]
- [[NFL/2026/Week 01/Games/NO @ DET|NO 30 @ DET 31]]
- [[NFL/2026/Week 01/Games/NYJ @ TEN|NYJ 23 @ TEN 10]]
- [[NFL/2026/Week 01/Games/TB @ CIN|TB 27 @ CIN 33]]
- [[NFL/2026/Week 01/Games/ARI @ LAC|ARI 26 @ LAC 14]]
- [[NFL/2026/Week 01/Games/GB @ MIN|GB 22 @ MIN 39]]
- [[NFL/2026/Week 01/Games/MIA @ LV|MIA 13 @ LV 27]]
- [[NFL/2026/Week 01/Games/WSH @ PHI|WSH 22 @ PHI 24]]
- [[NFL/2026/Week 01/Games/DAL @ NYG|DAL 20 @ NYG 28]]
- [[NFL/2026/Week 01/Games/DEN @ KC|DEN 10 @ KC 31]]

## Teams

[[NFL/2026/Week 01/Teams/ARI|ARI]] · [[NFL/2026/Week 01/Teams/ATL|ATL]] · [[NFL/2026/Week 01/Teams/BAL|BAL]] · [[NFL/2026/Week 01/Teams/BUF|BUF]] · [[NFL/2026/Week 01/Teams/CAR|CAR]] · [[NFL/2026/Week 01/Teams/CHI|CHI]] · [[NFL/2026/Week 01/Teams/CIN|CIN]] · [[NFL/2026/Week 01/Teams/CLE|CLE]] · [[NFL/2026/Week 01/Teams/DAL|DAL]] · [[NFL/2026/Week 01/Teams/DEN|DEN]] · [[NFL/2026/Week 01/Teams/DET|DET]] · [[NFL/2026/Week 01/Teams/GB|GB]] · [[NFL/2026/Week 01/Teams/HOU|HOU]] · [[NFL/2026/Week 01/Teams/IND|IND]] · [[NFL/2026/Week 01/Teams/JAX|JAX]] · [[NFL/2026/Week 01/Teams/KC|KC]] · [[NFL/2026/Week 01/Teams/LAC|LAC]] · [[NFL/2026/Week 01/Teams/LAR|LAR]] · [[NFL/2026/Week 01/Teams/LV|LV]] · [[NFL/2026/Week 01/Teams/MIA|MIA]] · [[NFL/2026/Week 01/Teams/MIN|MIN]] · [[NFL/2026/Week 01/Teams/NE|NE]] · [[NFL/2026/Week 01/Teams/NO|NO]] · [[NFL/2026/Week 01/Teams/NYG|NYG]] · [[NFL/2026/Week 01/Teams/NYJ|NYJ]] · [[NFL/2026/Week 01/Teams/PHI|PHI]] · [[NFL/2026/Week 01/Teams/PIT|PIT]] · [[NFL/2026/Week 01/Teams/SEA|SEA]] · [[NFL/2026/Week 01/Teams/SF|SF]] · [[NFL/2026/Week 01/Teams/TB|TB]] · [[NFL/2026/Week 01/Teams/TEN|TEN]] · [[NFL/2026/Week 01/Teams/WSH|WSH]]

## Fantasy & contests

- [[NFL/2026/Week 01/Fantasy/2026 -  The League|2026 -  The League]]
- [[NFL/2026/Week 01/Fantasy/The Honey Badgers|The Honey Badgers]]
- [[NFL/2026/Week 01/Fantasy/Rose Bowl XIX|Rose Bowl XIX]]
- [[NFL/2026/Week 01/Fantasy/CC Bowl XV CHAMPIONS LEAGUE|CC Bowl XV CHAMPIONS LEAGUE]]
- [[NFL/2026/Week 01/Fantasy/RFI XIX|RFI XIX]]
- [[NFL/2026/Week 01/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 01/Betting|Betting]]

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
WHERE type = "team-week" AND week = 1 AND contains(string(flags), "despite")
```
