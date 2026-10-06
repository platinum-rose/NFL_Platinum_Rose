---
sensitivity: green
owner_project: nfl-dashboard
source_system: weekly-archive
source_type: week-index
canonical_status: generated
title: "NFL 2026 Week 3"
created: "2026-10-06T04:27:09.509Z"
modified: "2026-10-06T04:27:09.509Z"
season: 2026
week: 3
type: "week-index"
tags: ["nfl", "season-2026", "week-03", "nfl/week-index"]
games: 16
favorites_ats: "5-9-2"
overs: 8
unders: 8
---
# NFL 2026 — Week 3

Favorites ATS 5-9-2 · Overs 8 of 16 · archived 2026-10-06T04:27Z

## Games

- [[NFL/2026/Week 03/Games/ATL @ GB|ATL 35 @ GB 14]]
- [[NFL/2026/Week 03/Games/CAR @ CLE|CAR 18 @ CLE 21]]
- [[NFL/2026/Week 03/Games/CIN @ PIT|CIN 27 @ PIT 30]]
- [[NFL/2026/Week 03/Games/HOU @ IND|HOU 17 @ IND 19]]
- [[NFL/2026/Week 03/Games/KC @ MIA|KC 24 @ MIA 10]]
- [[NFL/2026/Week 03/Games/LAC @ BUF|LAC 16 @ BUF 24]]
- [[NFL/2026/Week 03/Games/NYJ @ DET|NYJ 24 @ DET 31]]
- [[NFL/2026/Week 03/Games/SEA @ WSH|SEA 31 @ WSH 33]]
- [[NFL/2026/Week 03/Games/TEN @ NYG|TEN 7 @ NYG 12]]
- [[NFL/2026/Week 03/Games/NE @ JAX|NE 6 @ JAX 35]]
- [[NFL/2026/Week 03/Games/ARI @ SF|ARI 30 @ SF 36]]
- [[NFL/2026/Week 03/Games/MIN @ TB|MIN 23 @ TB 16]]
- [[NFL/2026/Week 03/Games/BAL @ DAL|BAL 34 @ DAL 31]]
- [[NFL/2026/Week 03/Games/LV @ NO|LV 35 @ NO 27]]
- [[NFL/2026/Week 03/Games/LAR @ DEN|LAR 26 @ DEN 30]]
- [[NFL/2026/Week 03/Games/PHI @ CHI|PHI 7 @ CHI 27]]

## Teams

[[NFL/2026/Week 03/Teams/ARI|ARI]] · [[NFL/2026/Week 03/Teams/ATL|ATL]] · [[NFL/2026/Week 03/Teams/BAL|BAL]] · [[NFL/2026/Week 03/Teams/BUF|BUF]] · [[NFL/2026/Week 03/Teams/CAR|CAR]] · [[NFL/2026/Week 03/Teams/CHI|CHI]] · [[NFL/2026/Week 03/Teams/CIN|CIN]] · [[NFL/2026/Week 03/Teams/CLE|CLE]] · [[NFL/2026/Week 03/Teams/DAL|DAL]] · [[NFL/2026/Week 03/Teams/DEN|DEN]] · [[NFL/2026/Week 03/Teams/DET|DET]] · [[NFL/2026/Week 03/Teams/GB|GB]] · [[NFL/2026/Week 03/Teams/HOU|HOU]] · [[NFL/2026/Week 03/Teams/IND|IND]] · [[NFL/2026/Week 03/Teams/JAX|JAX]] · [[NFL/2026/Week 03/Teams/KC|KC]] · [[NFL/2026/Week 03/Teams/LAC|LAC]] · [[NFL/2026/Week 03/Teams/LAR|LAR]] · [[NFL/2026/Week 03/Teams/LV|LV]] · [[NFL/2026/Week 03/Teams/MIA|MIA]] · [[NFL/2026/Week 03/Teams/MIN|MIN]] · [[NFL/2026/Week 03/Teams/NE|NE]] · [[NFL/2026/Week 03/Teams/NO|NO]] · [[NFL/2026/Week 03/Teams/NYG|NYG]] · [[NFL/2026/Week 03/Teams/NYJ|NYJ]] · [[NFL/2026/Week 03/Teams/PHI|PHI]] · [[NFL/2026/Week 03/Teams/PIT|PIT]] · [[NFL/2026/Week 03/Teams/SEA|SEA]] · [[NFL/2026/Week 03/Teams/SF|SF]] · [[NFL/2026/Week 03/Teams/TB|TB]] · [[NFL/2026/Week 03/Teams/TEN|TEN]] · [[NFL/2026/Week 03/Teams/WSH|WSH]]

## Fantasy & contests

- _Yahoo data not captured this run_
- [[NFL/2026/Week 03/Contests|Pick'em & survivor]]
- [[NFL/2026/Week 03/Betting|Betting]]

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
WHERE type = "team-week" AND week = 3 AND contains(string(flags), "despite")
```
