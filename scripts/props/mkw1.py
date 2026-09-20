#!/usr/bin/env python3
"""Build w1.json (Week 1 per-player box stats) from repo ESPN boxscores."""
import json, glob, os, sys
BOX = sys.argv[1]; OUT = sys.argv[2]
WANT = {
 "passing":      [("C/ATT","pass_ca"),("YDS","pass_yds"),("TD","pass_td"),("INT","pass_int")],
 "rushing":      [("CAR","car"),("YDS","rush_yds"),("TD","rush_td")],
 "receiving":    [("REC","rec"),("YDS","rec_yds"),("TD","rec_td"),("TGTS","tgts")],
 "defensive":    [("TOT","tot_tkl"),("SOLO","solo"),("SACKS","sacks"),("TFL","tfl")],
}
players = {}
for f in sorted(glob.glob(os.path.join(BOX,"espn-*.json"))):
    d = json.load(open(f))
    hdr = d.get("header") or {}
    if (hdr.get("week") or d.get("week")) != 1: continue
    for tm in (d.get("boxscore") or {}).get("players", []):
        abbr = tm.get("team",{}).get("abbreviation")
        for grp in tm.get("statistics", []):
            name = (grp.get("name") or "").lower()
            if name not in WANT: continue
            keys = [k.upper() for k in grp.get("keys", [])] or [l.upper() for l in grp.get("labels",[])]
            labels = [l.upper() for l in grp.get("labels", [])]
            for ath in grp.get("athletes", []):
                nm = (ath.get("athlete") or {}).get("displayName")
                if not nm: continue
                vals = ath.get("stats") or []
                rec = players.setdefault(nm.lower(), {"team": abbr})
                for lbl, slug in WANT[name]:
                    idx = labels.index(lbl) if lbl in labels else (keys.index(lbl) if lbl in keys else -1)
                    if idx < 0 or idx >= len(vals): continue
                    v = vals[idx]
                    if slug == "pass_ca": rec[slug] = v; continue
                    try: rec[slug] = float(v)
                    except (TypeError, ValueError): pass
json.dump(players, open(OUT,"w"), indent=0)
print(f"{len(players)} players -> {OUT}", file=sys.stderr)
