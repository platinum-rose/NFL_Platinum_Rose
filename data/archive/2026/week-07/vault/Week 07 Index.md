---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 7"
created: "2026-10-27T14:58:02.793Z"
modified: "2026-10-27T14:58:02.793Z"
season: 2026
week: 7
type: "week-index"
tags: ["nfl", "season-2026", "week-07", "nfl/week-index"]
games: 14
favorites_ats: "8-6-0"
overs: 9
unders: 5
---
# NFL 2026 — Week 7

Favorites ATS 8-6-0 · Overs 9 of 14 · archived 2026-10-27T14:58Z

## Games

- [[NFL/2026/Week 07/Games/NE @ CHI|NE 24 @ CHI 30]]
- [[NFL/2026/Week 07/Games/PIT @ NO|PIT 16 @ NO 10]]
- [[NFL/2026/Week 07/Games/CIN @ BAL|CIN 35 @ BAL 13]]
- [[NFL/2026/Week 07/Games/CLE @ TEN|CLE 27 @ TEN 24]]
- [[NFL/2026/Week 07/Games/IND @ MIN|IND 10 @ MIN 16]]
- [[NFL/2026/Week 07/Games/MIA @ NYJ|MIA 28 @ NYJ 25]]
- [[NFL/2026/Week 07/Games/NYG @ HOU|NYG 27 @ HOU 21]]
- [[NFL/2026/Week 07/Games/SF @ ATL|SF 20 @ ATL 29]]
- [[NFL/2026/Week 07/Games/TB @ CAR|TB 43 @ CAR 13]]
- [[NFL/2026/Week 07/Games/DEN @ ARI|DEN 30 @ ARI 16]]
- [[NFL/2026/Week 07/Games/GB @ DET|GB 17 @ DET 20]]
- [[NFL/2026/Week 07/Games/LAR @ LV|LAR 35 @ LV 21]]
- [[NFL/2026/Week 07/Games/KC @ SEA|KC 3 @ SEA 20]]
- [[NFL/2026/Week 07/Games/DAL @ PHI|DAL 38 @ PHI 21]]

## Teams

[[NFL/2026/Week 07/Teams/ARI|ARI]] · [[NFL/2026/Week 07/Teams/ATL|ATL]] · [[NFL/2026/Week 07/Teams/BAL|BAL]] · [[NFL/2026/Week 07/Teams/CAR|CAR]] · [[NFL/2026/Week 07/Teams/CHI|CHI]] · [[NFL/2026/Week 07/Teams/CIN|CIN]] · [[NFL/2026/Week 07/Teams/CLE|CLE]] · [[NFL/2026/Week 07/Teams/DAL|DAL]] · [[NFL/2026/Week 07/Teams/DEN|DEN]] · [[NFL/2026/Week 07/Teams/DET|DET]] · [[NFL/2026/Week 07/Teams/GB|GB]] · [[NFL/2026/Week 07/Teams/HOU|HOU]] · [[NFL/2026/Week 07/Teams/IND|IND]] · [[NFL/2026/Week 07/Teams/KC|KC]] · [[NFL/2026/Week 07/Teams/LAR|LAR]] · [[NFL/2026/Week 07/Teams/LV|LV]] · [[NFL/2026/Week 07/Teams/MIA|MIA]] · [[NFL/2026/Week 07/Teams/MIN|MIN]] · [[NFL/2026/Week 07/Teams/NE|NE]] · [[NFL/2026/Week 07/Teams/NO|NO]] · [[NFL/2026/Week 07/Teams/NYG|NYG]] · [[NFL/2026/Week 07/Teams/NYJ|NYJ]] · [[NFL/2026/Week 07/Teams/PHI|PHI]] · [[NFL/2026/Week 07/Teams/PIT|PIT]] · [[NFL/2026/Week 07/Teams/SEA|SEA]] · [[NFL/2026/Week 07/Teams/SF|SF]] · [[NFL/2026/Week 07/Teams/TB|TB]] · [[NFL/2026/Week 07/Teams/TEN|TEN]]

## Fantasy & contests

- [[NFL/2026/Week 07/Fantasy/2026 -  The League|2026 -  The League]]
- [[NFL/2026/Week 07/Fantasy/The Honey Badgers|The Honey Badgers]]
- [[NFL/2026/Week 07/Fantasy/Rose Bowl XIX|Rose Bowl XIX]]
- [[NFL/2026/Week 07/Fantasy/CC Bowl XV CHAMPIONS LEAGUE|CC Bowl XV CHAMPIONS LEAGUE]]
- [[NFL/2026/Week 07/Fantasy/RFI XIX|RFI XIX]]
- [[NFL/2026/Week 07/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 07/Betting|Betting]]

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
WHERE type = "team-week" AND week = 7 AND contains(string(flags), "despite")
```
