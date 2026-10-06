#!/usr/bin/env python3
"""ESPN summary cache -> wNgames.json (grade.py input) + wNgamesum.json (post-mortem game cards).

Replaces the uncommitted container-scratch builders used for Weeks 1-3. Read-only on the cache.
  python3 scripts/espn_week.py --week 4 [--out reports/bets/season-recap]
Only STATUS_FINAL games are written; anything else is listed as pending.
"""
import argparse, glob, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
BOX = os.path.join(ROOT, "data", "fantasy", "boxscores")

def team_stats(t):
    s = {x["name"]: x["displayValue"] for x in t.get("statistics", [])}
    return s

def leaders(players, abbr):
    qb = rb = wr = None
    for side in players:
        if side["team"]["abbreviation"] != abbr: continue
        for grp in side["statistics"]:
            lab = grp.get("labels", []); rows = [(a["athlete"]["displayName"], dict(zip(lab, a.get("stats", [])))) for a in grp.get("athletes", [])]
            if not rows: continue
            f = lambda v: float(v) if str(v).replace(".", "", 1).lstrip("-").isdigit() else -1
            if grp["name"] == "passing":
                n, x = max(rows, key=lambda r: f(str(r[1].get("C/ATT", "0/0")).split("/")[-1]))
                qb = f"{n} {x.get('C/ATT')} {x.get('YDS')} yds {x.get('TD')} TD {x.get('INT')} INT"
            elif grp["name"] == "rushing":
                n, x = max(rows, key=lambda r: f(r[1].get("YDS"))); rb = f"{n} {x.get('CAR')}-{x.get('YDS')} {x.get('TD')} TD"
            elif grp["name"] == "receiving":
                n, x = max(rows, key=lambda r: f(r[1].get("YDS"))); wr = f"{n} {x.get('REC')}-{x.get('YDS')} {x.get('TD')} TD"
    return qb, rb, wr

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--out", default=os.path.join(HERE, "..")); a = ap.parse_args()
    games, gsum, pending = [], [], []
    for f in sorted(glob.glob(os.path.join(BOX, "espn-*.json"))):
        try: d = json.load(open(f, encoding="utf-8"))
        except Exception: continue
        h = d.get("header", {})
        if h.get("week") != a.week: continue
        c = h["competitions"][0]; st = c["status"]["type"]["name"]
        home = next(x for x in c["competitors"] if x["homeAway"] == "home"); away = next(x for x in c["competitors"] if x["homeAway"] == "away")
        A, H = away["team"]["abbreviation"], home["team"]["abbreviation"]
        if st != "STATUS_FINAL": pending.append(f"{A}@{H} {st}"); continue
        als = [l.get("displayValue") for l in away.get("linescores", [])]; hls = [l.get("displayValue") for l in home.get("linescores", [])]
        scoring = []
        for s in d.get("scoringPlays", []):
            q = s["period"]["number"]; ql = f"Q{q}" if q <= 4 else "OT"
            scoring.append(dict(type=s["type"]["text"], text=s["text"], team=s.get("team", {}).get("abbreviation"), period=q, clock=s["clock"]["displayValue"], away=s["awayScore"], home=s["homeScore"],
                                line=f"{ql} {s['clock']['displayValue']} {s.get('team', {}).get('abbreviation')} {s['text']} ({s['awayScore']}-{s['homeScore']})"))
        players = {}
        for side in d.get("boxscore", {}).get("players", []):
            for grp in side["statistics"]:
                lab = grp.get("labels", [])
                for at in grp.get("athletes", []):
                    players.setdefault(at["athlete"]["displayName"], {"team": side["team"]["abbreviation"]})[grp["name"]] = dict(zip(lab, at.get("stats", [])))
        games.append(dict(event=h["id"], away=A, home=H, away_score=away["score"], home_score=home["score"], away_ls=als, home_ls=hls, scoring=scoring, players=players))
        pc = (d.get("pickcenter") or [{}])[0]
        g = dict(event=h["id"], date=c.get("date"), away=A, home=H, score=[int(away["score"]), int(home["score"])], ls=[als, hls],
                 espn_line=dict(details=pc.get("details"), ou=pc.get("overUnder"), provider=(pc.get("provider") or {}).get("name")), scoring=[s["line"] for s in scoring])
        bt = {t["team"]["abbreviation"]: team_stats(t) for t in d.get("boxscore", {}).get("teams", [])}
        for T in (A, H):
            s = bt.get(T, {}); qb, rb, wr = leaders(d.get("boxscore", {}).get("players", []), T)
            g[T] = dict(yds=s.get("totalYards"), pass_=s.get("netPassingYards"), rush=s.get("rushingYards"), ratt=s.get("rushingAttempts"), ca=s.get("completionAttempts"),
                        to=s.get("turnovers"), sacks=s.get("sacksYardsLost"), top=s.get("possessionTime"), third=s.get("thirdDownEff"), rz=s.get("redZoneAttempts"),
                        plays=s.get("totalOffensivePlays"), ypp=s.get("yardsPerPlay"), pen=s.get("totalPenaltiesYards"), dtd=s.get("defensiveTouchdowns"), qb=qb, rb=rb, wr=wr)
        gsum.append(g)
    key = lambda g: (g.get("date") or "", g["event"])
    gsum.sort(key=key); order = {g["event"]: i for i, g in enumerate(gsum)}; games.sort(key=lambda g: order[g["event"]])
    json.dump(games, open(os.path.join(a.out, f"w{a.week}games.json"), "w"), indent=1)
    json.dump(gsum, open(os.path.join(a.out, f"w{a.week}gamesum.json"), "w"), indent=1)
    print(f"week {a.week}: {len(gsum)} final games written; pending: {pending or 'none'}")

if __name__ == "__main__":
    main()
