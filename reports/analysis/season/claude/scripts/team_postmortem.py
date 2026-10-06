#!/usr/bin/env python3
"""Week N team-by-team post-mortem from cached ESPN summaries (data/fantasy/boxscores/espn-*.json).

Read-only. No network, no Supabase, no paid models. Market line = ESPN pickcenter (DraftKings) as cached
in the summary at fetch time; treat it as a near-close proxy, not a verified closing line.

  python3 team_postmortem.py --week 4            -> out/week-04-teams.json, .csv, -summary.md
"""
import argparse, csv, glob, json, os, re
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), *[".."] * 5))
BOX = os.path.join(ROOT, "data", "fantasy", "boxscores")
OUT = os.path.join(os.path.dirname(__file__), "..", "out")

def num(v):
    try: return float(v)
    except Exception: return None

def frac(v):  # "5-12" -> (5,12)
    m = re.match(r"(\d+)-(\d+)", str(v or ""))
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)

def mmss(v):
    m = re.match(r"(\d+):(\d+)", str(v or ""))
    return int(m.group(1)) * 60 + int(m.group(2)) if m else None

def load_games():
    games = []
    for f in sorted(glob.glob(os.path.join(BOX, "espn-*.json"))):
        try: d = json.load(open(f, encoding="utf-8"))
        except Exception: continue
        h = d.get("header", {}); c = (h.get("competitions") or [{}])[0]

        games.append((f, d, h, c))
    return games

def player_lines(d, abbr):
    out = {"qb": None, "rush": None, "rec": None, "def_sacks": 0.0, "def_int": 0}
    for side in d.get("boxscore", {}).get("players", []):
        if side["team"]["abbreviation"] != abbr: continue
        for grp in side["statistics"]:
            labels = grp.get("labels", []); ath = grp.get("athletes", [])
            rows = [(a["athlete"]["displayName"], dict(zip(labels, a.get("stats", [])))) for a in ath]
            if grp["name"] == "passing" and rows:
                n, s = max(rows, key=lambda r: int(str(r[1].get("C/ATT", "0/0")).split("/")[-1] or 0))
                out["qb"] = f"{n} {s.get('C/ATT')} {s.get('YDS')}y {s.get('TD')}TD {s.get('INT')}INT sk {s.get('SACKS')} QBR {s.get('QBR')}"
            elif grp["name"] == "rushing" and rows:
                n, s = max(rows, key=lambda r: num(r[1].get("YDS")) or -99)
                out["rush"] = f"{n} {s.get('CAR')}-{s.get('YDS')} {s.get('TD')}TD"
            elif grp["name"] == "receiving" and rows:
                n, s = max(rows, key=lambda r: num(r[1].get("YDS")) or -99)
                out["rec"] = f"{n} {s.get('REC')}/{s.get('TGTS', '?')}-{s.get('YDS')} {s.get('TD')}TD"
            elif grp["name"] == "defensive":
                out["def_sacks"] = sum(num(s.get("SACKS")) or 0 for _, s in rows)
            elif grp["name"] == "interceptions":
                out["def_int"] = sum(int(num(s.get("INT")) or 0) for _, s in rows)
    return out

def drive_stats(d, abbr):
    ds = [x for x in d.get("drives", {}).get("previous", []) if x.get("team", {}).get("abbreviation") == abbr]
    res = [str(x.get("displayResult") or x.get("result") or "").upper() for x in ds]

    td = sum(1 for r in res if "TOUCHDOWN" in r or r == "TD")
    fg = sum(1 for r in res if r in ("FIELD GOAL", "FG"))
    to = sum(1 for r in res if any(k in r for k in ("INTERCEPTION", "FUMBLE", "DOWNS")))
    three_out = sum(1 for x, r in zip(ds, res) if r == "PUNT" and (x.get("offensivePlays") or 0) <= 3)
    starts = []
    for x in ds:
        t = x.get("start", {}).get("text", "") or ""
        m = re.match(r"([A-Z]{2,3})\s+(\d+)", t); yl = x.get("start", {}).get("yardLine")
        if m and yl is not None:
            starts.append(int(m.group(2)) if m.group(1) == abbr else 100 - int(m.group(2)))
    return {"drives": len(ds), "td_drives": td, "fg_drives": fg, "giveaway_drives": to, "three_and_outs": three_out,
            "avg_start_own": round(sum(starts) / len(starts), 1) if starts else None}

def team_rows(d, h, c):
    comps = c.get("competitors", [])
    if len(comps) != 2: return []
    stats = {t["team"]["abbreviation"]: {s["name"]: s["displayValue"] for s in t.get("statistics", [])}
             for t in d.get("boxscore", {}).get("teams", [])}
    pc = (d.get("pickcenter") or [{}])[0]
    home = next(x for x in comps if x["homeAway"] == "home"); away = next(x for x in comps if x["homeAway"] == "away")
    hs, as_ = int(home.get("score") or 0), int(away.get("score") or 0)
    spread_home = num(pc.get("spread")); total = num(pc.get("overUnder"))
    hml = num((pc.get("homeTeamOdds") or {}).get("moneyLine")); aml = num((pc.get("awayTeamOdds") or {}).get("moneyLine"))
    rows = []
    for me, op, ms, os_, line, ml in ((home, away, hs, as_, spread_home, hml), (away, home, as_, hs, -spread_home if spread_home is not None else None, aml)):
        a, o = me["team"]["abbreviation"], op["team"]["abbreviation"]
        s, so = stats.get(a, {}), stats.get(o, {})
        margin = ms - os_
        ats = None if line is None else ("W" if margin + line > 0 else "L" if margin + line < 0 else "P")
        tdc, tda = frac(s.get("thirdDownEff")); rzc, rza = frac(s.get("redZoneAttempts"))
        ypp, oypp = num(s.get("yardsPerPlay")), num(so.get("yardsPerPlay"))
        to_, oto = int(num(s.get("turnovers")) or 0), int(num(so.get("turnovers")) or 0)
        ls = [int(num(l.get("displayValue")) or 0) for l in me.get("linescores", [])]
        ols = [int(num(l.get("displayValue")) or 0) for l in op.get("linescores", [])]
        pl = player_lines(d, a); dr = drive_stats(d, a)
        sk_taken = frac(str(s.get("sacksYardsLost", "")).replace("-", "-", 1))[0]
        r = {
            "week": h.get("week"), "event_id": h.get("id"), "date_utc": c.get("date"),
            "team": a, "opp": o, "home_away": me["homeAway"], "record_after": next((x["summary"] for x in me.get("record", []) if x.get("type") == "total"), None),
            "pts": ms, "opp_pts": os_, "margin": margin, "su": "W" if margin > 0 else "L" if margin < 0 else "T",
            "line": line, "ml": ml, "ats": ats, "cover_margin": None if line is None else margin + line,
            "total": total, "game_pts": ms + os_, "ou": None if total is None else ("O" if ms + os_ > total else "U" if ms + os_ < total else "P"),
            "implied_pts": None if (line is None or total is None) else round((total - line) / 2, 1),
            "q_pts": ls, "h1": sum(ls[:2]), "h2_ot": sum(ls[2:]), "opp_h1": sum(ols[:2]), "opp_h2_ot": sum(ols[2:]),
            "plays": int(num(s.get("totalOffensivePlays")) or 0), "yards": int(num(s.get("totalYards")) or 0), "ypp": ypp,
            "opp_yards": int(num(so.get("totalYards")) or 0), "opp_ypp": oypp, "ypp_diff": None if ypp is None or oypp is None else round(ypp - oypp, 2),
            "pass_yds": int(num(s.get("netPassingYards")) or 0), "cmp_att": s.get("completionAttempts"), "ypa": num(s.get("yardsPerPass")),
            "rush_yds": int(num(s.get("rushingYards")) or 0), "rush_att": int(num(s.get("rushingAttempts")) or 0), "ypc": num(s.get("yardsPerRushAttempt")),
            "first_downs": int(num(s.get("firstDowns")) or 0), "third_down": s.get("thirdDownEff"), "third_pct": round(tdc / tda, 3) if tda else None,
            "fourth_down": s.get("fourthDownEff"), "red_zone": s.get("redZoneAttempts"), "rz_td_pct": round(rzc / rza, 3) if rza else None,
            "sacks_taken": sk_taken, "sacks_made": pl["def_sacks"], "giveaways": to_, "takeaways": oto, "to_margin": oto - to_,
            "def_td": int(num(s.get("defensiveTouchdowns")) or 0), "penalties": s.get("totalPenaltiesYards"), "top_sec": mmss(s.get("possessionTime")), "top": s.get("possessionTime"),
            **dr, "pts_per_drive": round(ms / dr["drives"], 2) if dr["drives"] else None,
            "qb_line": pl["qb"], "top_rusher": pl["rush"], "top_receiver": pl["rec"],
        }
        flags = []
        if r["su"] == "W" and (r["ypp_diff"] or 0) <= -0.75: flags.append("won despite YPP deficit")
        if r["su"] == "L" and (r["ypp_diff"] or 0) >= 0.75: flags.append("lost despite YPP edge")
        if abs(r["to_margin"]) >= 2: flags.append(f"TO margin {r['to_margin']:+d}")
        if r["def_td"]: flags.append("defensive/ST TD")
        if r["cover_margin"] is not None and abs(r["cover_margin"]) <= 1.5: flags.append("ATS within 1.5")
        if r["h1"] - r["opp_h1"] <= -10 and r["su"] == "W": flags.append("came back from 10+ at half")
        if r["h1"] - r["opp_h1"] >= 10 and r["su"] == "L": flags.append("blew 10+ halftime lead")
        if r["rz_td_pct"] is not None and (r["red_zone"] or "").split("-")[-1] not in ("0",) and r["rz_td_pct"] <= 0.34 and frac(r["red_zone"])[1] >= 3: flags.append("red-zone stalls")
        r["flags"] = flags
        rows.append(r)
    return rows

def season_context(games, week):
    ctx = defaultdict(lambda: {"su": [0, 0, 0], "ats": [0, 0, 0], "ou": [0, 0, 0], "pf": 0, "pa": 0, "g": 0, "ypp_for": [], "ypp_against": [], "to_margin": 0})
    for f, d, h, c in games:
        if (h.get("week") or 99) > week: continue
        if c.get("status", {}).get("type", {}).get("name") != "STATUS_FINAL": continue
        for r in team_rows(d, h, c):
            x = ctx[r["team"]]; k = {"W": 0, "L": 1, "T": 2, "P": 2, "O": 0, "U": 1}
            x["su"][k[r["su"]]] += 1
            if r["ats"]: x["ats"][k[r["ats"]]] += 1
            if r["ou"]: x["ou"][k[r["ou"]]] += 1
            x["pf"] += r["pts"]; x["pa"] += r["opp_pts"]; x["g"] += 1; x["to_margin"] += r["to_margin"]
            if r["ypp"] is not None: x["ypp_for"].append(r["ypp"])
            if r["opp_ypp"] is not None: x["ypp_against"].append(r["opp_ypp"])
    out = {}
    for t, x in ctx.items():
        avg = lambda l: round(sum(l) / len(l), 2) if l else None
        out[t] = {"games": x["g"], "su": "-".join(map(str, x["su"][:2])) + (f"-{x['su'][2]}" if x["su"][2] else ""),
                  "ats": "-".join(map(str, x["ats"][:2])) + (f"-{x['ats'][2]}" if x["ats"][2] else ""),
                  "ou": "-".join(map(str, x["ou"][:2])) + (f"-{x['ou'][2]}" if x["ou"][2] else ""),
                  "ppg": round(x["pf"] / x["g"], 1), "papg": round(x["pa"] / x["g"], 1), "pt_diff": x["pf"] - x["pa"],
                  "ypp_for": avg(x["ypp_for"]), "ypp_against": avg(x["ypp_against"]), "to_margin": x["to_margin"]}
    return out

def fmt_line(x):
    return "PK" if x == 0 else (f"{x:+g}" if x is not None else "n/a")

def write_md(path, week, rows, pending):
    by_ev = {}
    for r in rows: by_ev.setdefault(r["event_id"], []).append(r)
    L = [f"# Week {week} team post-mortem (Claude Team 2)", "",
         f"Generated by `reports/analysis/season/claude/scripts/team_postmortem.py --week {week}` from cached ESPN summaries. "
         "Line/total = ESPN pickcenter (DraftKings) at fetch time, a near-close proxy, not a verified BKR/BEO close. Read-only; no wagers touched.", ""]
    if pending: L += ["**Pending (not final / not cached):** " + ", ".join(p["matchup"] + f" ({p['status']})" for p in pending), ""]
    fav = [r for r in rows if r["line"] is not None and r["line"] < 0]
    home = [r for r in rows if r["home_away"] == "home"]
    c = lambda l, k, v: sum(1 for r in l if r[k] == v)
    games = list(by_ev.values())
    L += ["## League snapshot", "",
          f"- Games final: {len(games)}. Favorites SU {c(fav,'su','W')}-{c(fav,'su','L')}, ATS {c(fav,'ats','W')}-{c(fav,'ats','L')}-{c(fav,'ats','P')}. "
          f"Home SU {c(home,'su','W')}-{c(home,'su','L')}, ATS {c(home,'ats','W')}-{c(home,'ats','L')}-{c(home,'ats','P')}.",
          f"- Totals: Over {sum(1 for g in games if g[0]['ou']=='O')}, Under {sum(1 for g in games if g[0]['ou']=='U')}, Push {sum(1 for g in games if g[0]['ou']=='P')}. "
          f"Avg game points {sum(g[0]['game_pts'] for g in games)/len(games):.1f} vs avg posted total {sum(g[0]['total'] or 0 for g in games)/len(games):.1f}.",
          f"- Underdogs winning outright: " + (", ".join(f"{r['team']} ({fmt_line(r['line'])}) over {r['opp']}" for r in rows if (r['line'] or 0) > 0 and r['su']=='W') or "none") + ".",
          f"- Teams that won the YPP battle went {sum(1 for r in rows if (r['ypp_diff'] or 0)>0 and r['su']=='W')}-{sum(1 for r in rows if (r['ypp_diff'] or 0)>0 and r['su']=='L')} SU; "
          f"teams with a positive turnover margin went {sum(1 for r in rows if r['to_margin']>0 and r['su']=='W')}-{sum(1 for r in rows if r['to_margin']>0 and r['su']=='L')}.", ""]
    L += ["## Games", "", "| Matchup | Final | Line (home) | Total | ATS winner | O/U | Yds (A–H) | YPP (A–H) | TO (A–H) |", "|---|---|---|---|---|---|---|---|---|"]
    for g in games:
        a = next(r for r in g if r["home_away"] == "away"); h = next(r for r in g if r["home_away"] == "home")
        atsw = a["team"] if a["ats"] == "W" else h["team"] if h["ats"] == "W" else "push"
        L.append(f"| {a['team']} @ {h['team']} | {a['pts']}–{h['pts']} | {h['team']} {fmt_line(h['line'])} | {h['total']} | {atsw} ({a['cover_margin'] if a['ats']=='W' else h['cover_margin']:+g}) | {h['ou']} ({h['game_pts']}) | {a['yards']}–{h['yards']} | {a['ypp']}–{h['ypp']} | {a['giveaways']}–{h['giveaways']} |")
    L += ["", "## Teams (alphabetical)", "", "| Team | Res | Score | Line | ATS | Pts vs implied | YPP diff | TO± | 3rd | RZ | Pts/drive | Sacks for/against | Season SU / ATS / O-U | Notes |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: r["team"]):
        s = r["season_thru_week"] or {}
        imp = "" if r["implied_pts"] is None else f"{r['pts'] - r['implied_pts']:+.1f}"
        L.append(f"| {r['team']} | {r['su']} vs {'@' if r['home_away']=='away' else ''}{r['opp']} | {r['pts']}–{r['opp_pts']} | {fmt_line(r['line'])} | {r['ats']} ({r['cover_margin']:+g}) | {imp} | {r['ypp_diff']:+.2f} | {r['to_margin']:+d} | {r['third_down']} | {r['red_zone']} | {r['pts_per_drive']} | {r['sacks_made']:g}/{r['sacks_taken']} | {s.get('su')} / {s.get('ats')} / {s.get('ou')} | {'; '.join(r['flags'])} |")
    L += ["", "## Key individual lines", "", "| Team | QB | Top rusher | Top receiver |", "|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: r["team"]):
        L.append(f"| {r['team']} | {r['qb_line']} | {r['top_rusher']} | {r['top_receiver']} |")
    L += ["", "Flags are mechanical (YPP ±0.75 vs result, |TO margin| ≥ 2, non-offensive TD, ATS within 1.5, 10+ halftime swings, red zone ≤ 1/3 on 3+ trips). One game is noise; use them as prompts for film/notes, not conclusions.", ""]
    open(path, "w", encoding="utf-8").write("\n".join(L))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--week", type=int, required=True); a = ap.parse_args()
    games = load_games()
    wk = [(f, d, h, c) for f, d, h, c in games if h.get("week") == a.week and (h.get("season", {}).get("type") in (None, 2))]
    rows, pending = [], []
    for f, d, h, c in wk:
        st = c.get("status", {}).get("type", {}).get("name")
        if st != "STATUS_FINAL":
            pending.append({"event_id": h.get("id"), "matchup": " @ ".join(x["team"]["abbreviation"] for x in sorted(c.get("competitors", []), key=lambda x: x["homeAway"] != "away")), "status": st}); continue
        rows.extend(team_rows(d, h, c))
    ctx = season_context(games, a.week)
    for r in rows: r["season_thru_week"] = ctx.get(r["team"])
    rows.sort(key=lambda r: (r["date_utc"] or "", r["event_id"], r["home_away"] != "away"))
    os.makedirs(OUT, exist_ok=True); tag = f"week-{a.week:02d}-teams"
    json.dump({"week": a.week, "source": "ESPN summary cache data/fantasy/boxscores (line = ESPN pickcenter DraftKings, near-close proxy)",
               "teams_final": len(rows), "pending_games": pending, "rows": rows}, open(os.path.join(OUT, tag + ".json"), "w"), indent=1)
    flat = [k for k in rows[0] if k not in ("season_thru_week", "flags", "q_pts")] if rows else []
    with open(os.path.join(OUT, tag + ".csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh); w.writerow(flat + ["q_pts", "flags", "season_su", "season_ats", "season_ou", "season_pt_diff", "season_ypp_for", "season_ypp_against", "season_to_margin"])
        for r in rows:
            s = r["season_thru_week"] or {}
            w.writerow([r[k] for k in flat] + ["-".join(map(str, r["q_pts"])), "; ".join(r["flags"]), s.get("su"), s.get("ats"), s.get("ou"), s.get("pt_diff"), s.get("ypp_for"), s.get("ypp_against"), s.get("to_margin")])
    write_md(os.path.join(OUT, tag + "-summary.md"), a.week, rows, pending)
    print(f"wrote {tag}.json/.csv: {len(rows)} team rows, pending {pending}")

if __name__ == "__main__":
    main()
