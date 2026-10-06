---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 4"
created: "2026-10-06T04:26:15.596Z"
modified: "2026-10-06T04:26:15.596Z"
season: 2026
week: 4
type: "week-index"
tags: ["nfl", "season-2026", "week-04", "nfl/week-index"]
games: 16
favorites_ats: "4-11-1"
overs: 10
unders: 6
---
# NFL 2026 — Week 4

Favorites ATS 4-11-1 · Overs 10 of 16 · archived 2026-10-06T04:26Z

## Games

- [[NFL/2026/Week 04/Games/PIT @ CLE|PIT 24 @ CLE 27]]
- [[NFL/2026/Week 04/Games/IND @ WSH|IND 30 @ WSH 13]]
- [[NFL/2026/Week 04/Games/ARI @ NYG|ARI 24 @ NYG 36]]
- [[NFL/2026/Week 04/Games/DAL @ HOU|DAL 34 @ HOU 30]]
- [[NFL/2026/Week 04/Games/GB @ TB|GB 17 @ TB 14]]
- [[NFL/2026/Week 04/Games/JAX @ CIN|JAX 22 @ CIN 17]]
- [[NFL/2026/Week 04/Games/LAR @ PHI|LAR 24 @ PHI 20]]
- [[NFL/2026/Week 04/Games/NE @ BUF|NE 29 @ BUF 26]]
- [[NFL/2026/Week 04/Games/NYJ @ CHI|NYJ 12 @ CHI 23]]
- [[NFL/2026/Week 04/Games/TEN @ BAL|TEN 18 @ BAL 24]]
- [[NFL/2026/Week 04/Games/MIA @ MIN|MIA 10 @ MIN 15]]
- [[NFL/2026/Week 04/Games/DEN @ SF|DEN 14 @ SF 24]]
- [[NFL/2026/Week 04/Games/KC @ LV|KC 30 @ LV 27]]
- [[NFL/2026/Week 04/Games/LAC @ SEA|LAC 23 @ SEA 30]]
- [[NFL/2026/Week 04/Games/DET @ CAR|DET 26 @ CAR 32]]
- [[NFL/2026/Week 04/Games/ATL @ NO|ATL 45 @ NO 24]]

## Teams

[[NFL/2026/Week 04/Teams/ARI|ARI]] · [[NFL/2026/Week 04/Teams/ATL|ATL]] · [[NFL/2026/Week 04/Teams/BAL|BAL]] · [[NFL/2026/Week 04/Teams/BUF|BUF]] · [[NFL/2026/Week 04/Teams/CAR|CAR]] · [[NFL/2026/Week 04/Teams/CHI|CHI]] · [[NFL/2026/Week 04/Teams/CIN|CIN]] · [[NFL/2026/Week 04/Teams/CLE|CLE]] · [[NFL/2026/Week 04/Teams/DAL|DAL]] · [[NFL/2026/Week 04/Teams/DEN|DEN]] · [[NFL/2026/Week 04/Teams/DET|DET]] · [[NFL/2026/Week 04/Teams/GB|GB]] · [[NFL/2026/Week 04/Teams/HOU|HOU]] · [[NFL/2026/Week 04/Teams/IND|IND]] · [[NFL/2026/Week 04/Teams/JAX|JAX]] · [[NFL/2026/Week 04/Teams/KC|KC]] · [[NFL/2026/Week 04/Teams/LAC|LAC]] · [[NFL/2026/Week 04/Teams/LAR|LAR]] · [[NFL/2026/Week 04/Teams/LV|LV]] · [[NFL/2026/Week 04/Teams/MIA|MIA]] · [[NFL/2026/Week 04/Teams/MIN|MIN]] · [[NFL/2026/Week 04/Teams/NE|NE]] · [[NFL/2026/Week 04/Teams/NO|NO]] · [[NFL/2026/Week 04/Teams/NYG|NYG]] · [[NFL/2026/Week 04/Teams/NYJ|NYJ]] · [[NFL/2026/Week 04/Teams/PHI|PHI]] · [[NFL/2026/Week 04/Teams/PIT|PIT]] · [[NFL/2026/Week 04/Teams/SEA|SEA]] · [[NFL/2026/Week 04/Teams/SF|SF]] · [[NFL/2026/Week 04/Teams/TB|TB]] · [[NFL/2026/Week 04/Teams/TEN|TEN]] · [[NFL/2026/Week 04/Teams/WSH|WSH]]

## Fantasy & contests

- _Yahoo data not captured this run_
- [[NFL/2026/Week 04/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 04/Betting|Betting]]

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
WHERE type = "team-week" AND week = 4 AND contains(string(flags), "despite")
```
