#!/usr/bin/env python3
"""Week N matchup post-mortem: opponent-adjusted unit grades for every team, plus rest-of-season matchup intel.

Read-only on everything except its own outputs. No network, no Supabase, no paid models.
Input: nflverse play-by-play (data/nflverse/2026/play_by_play_2026.csv.gz; refresh with scripts/fetch-nflverse.mjs),
       public/schedule.json (remaining games + current market line where ingested),
       data/projected-starters/2026/latest.json (availability vetoes), team_postmortem out/week-NN-teams.json (market/ATS).

  python3 matchup_postmortem.py --week 9
    -> out/week-09-matchup-grades.json   per team-game grades (W1..N graded on the same scale; week N is the focus)
    -> out/week-09-matchup-intel.json    season unit ratings + every remaining matchup with edges and notes
    -> out/week-09-matchups-data.md      mechanical tables (the written report sits in reports/analysis/weekN-postmortem/)

Method (kept simple on purpose; one week is noise):
  - Scrimmage plays = pass or rush plays with EPA (kneels/spikes excluded). Special teams = special==1 plays.
  - Unit value = EPA/play. Opponent-adjusted value = raw - (opponent's average on the other side, leave-this-game-out) + league avg.
  - Grades = percentile of the adjusted value among all team-games W1..N: A+ >=95, A >=85, B >=65, C >=35, D >=15, F <15.
  - Overall = (adj off EPA/play - adj def EPA/play allowed) x 62 plays + ST EPA (net points-ish).
  - Season ratings are opponent-adjusted the same way and recency-weighted (last 4 weeks count 1.5x).
  - Matchup edges for future games compare one side's unit rating with the opponent's opposite unit (in EPA/play, then in z units).
  - Projected margin = slope x net-rating gap + intercept, fit walk-forward (ratings from weeks < k vs week-k margins, k=5..N).
    A sanity check against the market, not a fair line: QB changes and injuries are not modeled.
"""
import argparse, json, os
import numpy as np, pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), *[".."] * 5))
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "out"))
PBP = os.path.join(ROOT, "data", "nflverse", "2026", "play_by_play_2026.csv.gz")
SCHED = os.path.join(ROOT, "public", "schedule.json")
STARTERS = os.path.join(ROOT, "data", "projected-starters", "2026", "latest.json")
FIX = {"LA": "LAR", "WSH": "WAS"}
PLAYS = 62.0
HFA = 1.5


def T(x):
    return FIX.get(x, x)


def grade(p):
    return "A+" if p >= 95 else "A" if p >= 85 else "B" if p >= 65 else "C" if p >= 35 else "D" if p >= 15 else "F"


def load(week):
    p = pd.read_csv(PBP, low_memory=False)
    p = p[(p.season_type == "REG") & (p.week <= week)].copy()
    for c in ("posteam", "defteam", "home_team", "away_team"):
        p[c] = p[c].map(lambda v: T(v) if isinstance(v, str) else v)
    return p


def team_games(p):
    sc = p[((p["pass"] == 1) | (p["rush"] == 1)) & p.epa.notna() & (p.play_type.isin(["pass", "run"]))].copy()
    sc["explosive"] = ((sc["pass"] == 1) & (sc.yards_gained >= 20)) | ((sc["rush"] == 1) & (sc.yards_gained >= 10))
    sc["early"] = sc.down.isin([1, 2])
    sc["neutral"] = sc.wp.between(0.2, 0.8) & sc.qtr.le(3)
    sc["to"] = (sc.interception.fillna(0) + sc.fumble_lost.fillna(0)).clip(upper=1)
    st = p[(p.special == 1) & p.epa.notna()]
    rows = []
    for (g, team), d in sc.groupby(["game_id", "posteam"]):
        first = p[p.game_id == g].iloc[0]
        opp = first.away_team if first.home_team == team else first.home_team
        home = first.home_team == team
        db = d[d["pass"] == 1]; ru = d[d["rush"] == 1]
        thr = d[d.down == 3]
        drives = p[(p.game_id == g) & (p.posteam == team)].groupby("fixed_drive").agg(
            inside20=("drive_inside20", "max"), result=("fixed_drive_result", "first"))
        rz = drives[drives.inside20 == 1]
        qb = db.passer_player_name.value_counts()
        st_for = st[(st.game_id == g) & (st.posteam == team)].epa.sum() - st[(st.game_id == g) & (st.defteam == team)].epa.sum()
        last = p[p.game_id == g].iloc[-1]
        pts = last.total_home_score if home else last.total_away_score
        opp_pts = last.total_away_score if home else last.total_home_score
        rows.append(dict(
            game_id=g, week=int(first.week), team=team, opp=opp, home=bool(home), pts=int(pts), opp_pts=int(opp_pts),
            spread_line=float(first.spread_line) if pd.notna(first.spread_line) else None,  # nflverse: + = home favored
            total_line=float(first.total_line) if pd.notna(first.total_line) else None,
            plays=len(d), epa=d.epa.mean(), sr=d.success.mean(), pass_epa=db.epa.mean() if len(db) else np.nan,
            rush_epa=ru.epa.mean() if len(ru) else np.nan, dropbacks=len(db), rushes=len(ru),
            sack_rate=db.sack.mean() if len(db) else np.nan, explosive=d.explosive.mean(), early_sr=d[d.early].success.mean(),
            third=(thr.third_down_converted.sum() / len(thr)) if len(thr) else np.nan, third_att=len(thr),
            to=int(d.to.sum()), int_=int(d.interception.fillna(0).sum()),
            rz_trips=len(rz), rz_td=int((rz.result == "Touchdown").sum()),
            neutral_pass=d[d.neutral]["pass"].mean(), proe=d.pass_oe.mean() / 100 if "pass_oe" in d else np.nan,
            qb=qb.index[0] if len(qb) else None, qb_share=float(qb.iloc[0] / qb.sum()) if len(qb) else None,
            st_epa=st_for))
    tg = pd.DataFrame(rows)
    # attach the defense side (what the opponent's offense did in the same game)
    off_cols = ["epa", "sr", "pass_epa", "rush_epa", "sack_rate", "explosive", "early_sr", "third", "to", "rz_trips", "rz_td", "plays", "dropbacks", "rushes", "int_"]
    opp = tg[["game_id", "team"] + off_cols].rename(columns={"team": "opp", **{c: "d_" + c for c in off_cols}})
    return tg.merge(opp, on=["game_id", "opp"], how="left")


def adjust(tg):
    lg = {c: tg[c].mean() for c in ("epa", "pass_epa", "rush_epa", "sr", "sack_rate", "explosive")}
    out = tg.copy()
    for c in ("epa", "pass_epa", "rush_epa", "sr", "sack_rate", "explosive"):
        adj_o, adj_d = [], []
        for _, r in tg.iterrows():
            # opponent's defense allowed (leave this game out) / opponent's offense produced
            od = tg[(tg.team == r.opp) & (tg.game_id != r.game_id)]["d_" + c].mean()
            oo = tg[(tg.team == r.opp) & (tg.game_id != r.game_id)][c].mean()
            adj_o.append(r[c] - (od - lg[c]) if pd.notna(od) else r[c])
            adj_d.append(r["d_" + c] - (oo - lg[c]) if pd.notna(oo) else r["d_" + c])
        out["adj_" + c] = adj_o; out["adj_d_" + c] = adj_d
    out["net_pts"] = (out.adj_epa - out.adj_d_epa) * PLAYS + out.st_epa
    pct = lambda s, asc=True: s.rank(pct=True, ascending=asc) * 100
    out["g_off"] = pct(out.adj_epa).map(grade)
    out["g_def"] = pct(out.adj_d_epa, asc=False).map(grade)
    out["g_pass_o"] = pct(out.adj_pass_epa).map(grade)
    out["g_rush_o"] = pct(out.adj_rush_epa).map(grade)
    out["g_pass_d"] = pct(out.adj_d_pass_epa, asc=False).map(grade)
    out["g_rush_d"] = pct(out.adj_d_rush_epa, asc=False).map(grade)
    out["g_st"] = pct(out.st_epa).map(grade)
    out["g_overall"] = pct(out.net_pts).map(grade)
    out["pct_overall"] = pct(out.net_pts).round(0)
    return out, lg


def season_ratings(adj, week):
    w = np.where(adj.week > week - 4, 1.5, 1.0)
    a = adj.assign(_w=w)
    def wm(d, c):
        m = d[c].notna(); return float(np.average(d.loc[m, c], weights=d.loc[m, "_w"])) if m.any() else np.nan
    rows = []
    for team, d in a.groupby("team"):
        last = d[d.week == d.week.max()].iloc[0]
        qbs = d.groupby("qb").plays.sum().sort_values(ascending=False)
        rows.append(dict(team=team, games=len(d),
            off=wm(d, "adj_epa"), deff=wm(d, "adj_d_epa"), pass_o=wm(d, "adj_pass_epa"), rush_o=wm(d, "adj_rush_epa"),
            pass_d=wm(d, "adj_d_pass_epa"), rush_d=wm(d, "adj_d_rush_epa"),
            sack_allowed=wm(d, "sack_rate"), sack_made=wm(d, "d_sack_rate"),
            expl_o=wm(d, "explosive"), expl_d=wm(d, "d_explosive"), st=d.st_epa.mean(),
            to_pg=d.to.mean(), take_pg=d.d_to.mean(), plays_pg=d.plays.mean(), opp_plays_pg=d.d_plays.mean(),
            neutral_pass=d.neutral_pass.mean(), proe=d.proe.mean(),
            rz_td=(d.rz_td.sum() / d.rz_trips.sum()) if d.rz_trips.sum() else np.nan,
            rz_td_allowed=(d.d_rz_td.sum() / d.d_rz_trips.sum()) if d.d_rz_trips.sum() else np.nan,
            third=d.third.mean(), third_allowed=d.d_third.mean(),
            pts_pg=d.pts.mean(), pts_allowed_pg=d.opp_pts.mean(),
            last4_net=float(d[d.week > week - 4].net_pts.mean()), season_net=float(d.net_pts.mean()),
            w_last_qb=last.qb, qbs={k: int(v) for k, v in qbs.items()},
            qb_splits={q: dict(games=int(len(x)), adj_off_epa=round(float(x.adj_epa.mean()), 3), adj_pass_epa=round(float(x.adj_pass_epa.mean()), 3),
                               sack_rate=round(float(x.sack_rate.mean()), 3), pts_pg=round(float(x.pts.mean()), 1))
                       for q, x in d.groupby("qb")},
            record=f"{int((d.pts > d.opp_pts).sum())}-{int((d.pts < d.opp_pts).sum())}" + (f"-{int((d.pts == d.opp_pts).sum())}" if (d.pts == d.opp_pts).any() else "")))
    r = pd.DataFrame(rows).set_index("team")
    r["net"] = (r.off - r.deff) * PLAYS + r.st
    for c, asc in (("net", False), ("off", False), ("deff", True), ("pass_o", False), ("rush_o", False), ("pass_d", True),
                   ("rush_d", True), ("sack_allowed", True), ("sack_made", False), ("st", False), ("expl_o", False), ("expl_d", True)):
        r["rk_" + c] = r[c].rank(ascending=asc, method="min").astype(int)
    return r


def z(s):
    return (s - s.mean()) / s.std()


def matchups(r, week, vetoes):
    sched = json.load(open(SCHED, encoding="utf-8"))
    zs = {c: z(r[c]) for c in ("pass_o", "rush_o", "pass_d", "rush_d", "sack_allowed", "sack_made", "expl_o", "expl_d", "st", "off", "deff")}
    games = []
    for g in sorted([g for g in sched if g.get("season_type") == 2 and g["week"] > week], key=lambda g: (g["week"], g["kickoff_utc"])):
        a, h = T(g["visitor"]), T(g["home"])
        if a not in r.index or h not in r.index: continue
        def edges(o, d):  # offense o vs defense d; positive = good for offense
            return dict(
                pass_edge=round(float(zs["pass_o"][o] + zs["pass_d"][d]), 2),     # pass_d is EPA allowed: high = bad defense
                rush_edge=round(float(zs["rush_o"][o] + zs["rush_d"][d]), 2),
                protection_edge=round(float(-zs["sack_allowed"][o] - zs["sack_made"][d]), 2),
                explosive_edge=round(float(zs["expl_o"][o] + zs["expl_d"][d]), 2))
        proj_home = float(PROJ["slope"] * (r.net[h] - r.net[a]) + PROJ["intercept"])  # walk-forward calibrated
        live = g.get("odds_source") not in (None, "espn") and g.get("spread") is not None
        mkt_home_margin = -float(g["spread"]) if live else None  # schedule spread is the home line (-2.5 = home favored)
        notes = []
        for side, o, d in (("away", a, h), ("home", h, a)):
            e = edges(o, d)
            if e["pass_edge"] >= 1.5: notes.append(f"{o} pass O ({r.rk_pass_o[o]}) vs {d} pass D ({r.rk_pass_d[d]}): big edge")
            if e["pass_edge"] <= -1.5: notes.append(f"{o} pass O ({r.rk_pass_o[o]}) into {d} pass D ({r.rk_pass_d[d]}): tough spot")
            if e["rush_edge"] >= 1.5: notes.append(f"{o} run game ({r.rk_rush_o[o]}) vs {d} run D ({r.rk_rush_d[d]}): rushing-lane spot")
            if e["rush_edge"] <= -1.5: notes.append(f"{o} run game ({r.rk_rush_o[o]}) into {d} run D ({r.rk_rush_d[d]}): fade rushing overs")
            if e["protection_edge"] <= -1.5: notes.append(f"{d} pass rush (sack rate rk {r.rk_sack_made[d]}) vs {o} protection (rk {r.rk_sack_allowed[o]}): sack/pressure spot")
            if e["explosive_edge"] >= 1.5: notes.append(f"{o} explosives (rk {r.rk_expl_o[o]}) vs {d} (allowed rk {r.rk_expl_d[d]}): long-play spot")
        for t in (a, h):
            for v in vetoes.get(t, []):
                if " QB " in f" {v} ": notes.append(f"{t}: {v}")
        games.append(dict(week=g["week"], game=f"{a}@{h}", away=a, home=h, kickoff_utc=g["kickoff_utc"],
            away_edges=edges(a, h), home_edges=edges(h, a), proj_home_margin=round(proj_home, 1),
            market_home_margin=mkt_home_margin, market_total=float(g["total"]) if live and g.get("total") else None,
            model_minus_market=round(proj_home - mkt_home_margin, 1) if mkt_home_margin is not None else None,
            notes=notes))
    return games


def calibrate(p, wk, first=5):
    """Walk-forward: ratings from weeks < k predict week k margins (k = first..wk). Returns slope, intercept, fit stats."""
    xs, ys, mk = [], [], []
    for k in range(first, wk + 1):
        tgk = team_games(p[p.week < k]); adjk, _ = adjust(tgk); rk = season_ratings(adjk, k - 1)
        for g, d in p[p.week == k].groupby("game_id"):
            h, a, last = d.home_team.iloc[0], d.away_team.iloc[0], d.iloc[-1]
            if h in rk.index and a in rk.index:
                xs.append(rk.net[h] - rk.net[a]); ys.append(last.total_home_score - last.total_away_score)
                mk.append(d.spread_line.iloc[0])
    X = np.array(xs); Y = np.array(ys); M = np.array(mk, dtype=float)
    slope, icpt = np.polyfit(X, Y, 1)
    pred = slope * X + icpt
    return dict(slope=round(float(slope), 3), intercept=round(float(icpt), 2), games=len(X), weeks=f"{first}-{wk}",
                r=round(float(np.corrcoef(X, Y)[0, 1]), 3), mae_model=round(float(np.mean(np.abs(Y - pred))), 2),
                mae_market=round(float(np.nanmean(np.abs(Y - M))), 2),
                r_model_vs_market=round(float(np.corrcoef(X[~np.isnan(M)], M[~np.isnan(M)])[0, 1]), 3))


def render_intel(r, games, sos, vet, wk, cal):
    """Team-indexed intel (every remaining game per team) + next-week board, as markdown."""
    nxt = wk + 1
    L = [f"# Rest-of-season matchup intel after Week {wk} (generated)", "",
         "Edges are z-scores of one unit's season rating plus the opponent's opposite unit (|1.5|+ is flagged). "
         f"Projection = {cal['slope']} x net-rating gap {cal['intercept']:+} (walk-forward fit W{cal['weeks']}, {cal['games']} games: "
         f"MAE {cal['mae_model']} vs market {cal['mae_market']}). QB changes and injuries are NOT in the numbers; read the QB notes.", "",
         f"## Week {nxt} board", "",
         "| Game | Market (home) | Model (home) | Model - market | Total | Flags |", "|---|---|---|---|---|---|"]
    for g in [g for g in games if g["week"] == nxt]:
        m = g["market_home_margin"]
        L.append(f"| {g['game']} | {('%+.1f' % -m) if m is not None else '-'} | {-g['proj_home_margin']:+.1f} | "
                 f"{g['model_minus_market']:+.1f} | {g['market_total'] or '-'} | {'; '.join(g['notes']) or '-'} |" if m is not None else
                 f"| {g['game']} | - | {-g['proj_home_margin']:+.1f} | - | - | {'; '.join(g['notes']) or '-'} |")
    L += ["", "Lines are written as the home team's spread (negative = home favored).", "", "## Teams", ""]
    for t, x in r.sort_values("net", ascending=False).iterrows():
        qb = ", ".join(f"{q} {v['games']}g {v['adj_off_epa']:+.2f}" for q, v in sorted(x.qb_splits.items(), key=lambda kv: -kv[1]["games"]))
        s = sos.get(t, {})
        L.append(f"### {t} ({x.record}) net {x.net:+.1f} (rk {x.rk_net}), last-4 {x.last4_net:+.1f}")
        L.append(f"- Units (rk of 32): off {x.rk_off} (pass {x.rk_pass_o}, rush {x.rk_rush_o}), def {x.rk_deff} (pass {x.rk_pass_d}, rush {x.rk_rush_d}), "
                 f"sacks allowed {x.rk_sack_allowed}, sacks made {x.rk_sack_made}, ST {x.rk_st}; explosives {x.rk_expl_o} / allowed {x.rk_expl_d}.")
        L.append(f"- QBs (adj off EPA/play by starter): {qb}. Last game: {x.w_last_qb}." + (f" Availability: {'; '.join(vet[t])}." if t in vet else ""))
        L.append(f"- Remaining schedule: {', '.join(s.get('remaining', []))} (avg opp net {s.get('avg_opp_net')}, hardest rank {s.get('rank_hardest')}).")
        for g in [g for g in games if t in (g["away"], g["home"])]:
            mine = [n for n in g["notes"] if n.startswith(t + " ") or f" {t} " in n or n.startswith(t + ":")]
            if mine: L.append(f"  - W{g['week']} {g['game']}: " + "; ".join(mine))
        L.append("")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--week", type=int, required=True); a = ap.parse_args()
    wk = a.week; os.makedirs(OUT, exist_ok=True)
    p = load(wk)
    tg = team_games(p)
    adj, lg = adjust(tg)
    r = season_ratings(adj, wk)
    cal = calibrate(p, wk)
    global PROJ
    PROJ = cal
    vet = {}
    try:
        for v in json.load(open(STARTERS, encoding="utf-8"))["meta"].get("availability_vetoes", []):
            t, rest = v.split(" ", 1); vet.setdefault(T(t), []).append(rest)
    except Exception:
        pass
    games = matchups(r, wk, vet)
    sos = {}
    for t in r.index:
        opps = [(g["week"], g["home"] if g["away"] == t else g["away"], "@" if g["away"] == t else "vs") for g in games if t in (g["away"], g["home"])]
        sos[t] = dict(remaining=[f"W{w} {h} {o}" for w, o, h in opps], games=len(opps),
                      avg_opp_net=round(float(np.mean([r.net[o] for _, o, _ in opps])), 2) if opps else None)
    order = sorted([t for t in sos if sos[t]["avg_opp_net"] is not None], key=lambda t: -sos[t]["avg_opp_net"])
    for i, t in enumerate(order, 1): sos[t]["rank_hardest"] = i
    rec = lambda df: json.loads(df.replace({np.nan: None}).to_json(orient="records"))
    meta = dict(week=wk, generated_by="reports/analysis/season/claude/scripts/matchup_postmortem.py", source=os.path.relpath(PBP, ROOT),
                pbp_weeks=sorted(int(x) for x in p.week.unique()), league_avg=lg, plays_per_game=PLAYS,
                projection_calibration=cal,
                projection_note="proj_home_margin = slope x (home net - away net) + intercept, fit walk-forward on prior weeks; a sanity check, not a fair line (QB changes are not modeled)",
                grade_scale="percentile of opponent-adjusted value among all team-games W1..N: A+>=95 A>=85 B>=65 C>=35 D>=15 F<15",
                caveat="One game is noise. Grades say how a unit played relative to the opponent's usual level, not who is good.")
    json.dump(dict(meta=meta, team_games=rec(adj)), open(os.path.join(OUT, f"week-{wk:02d}-matchup-grades.json"), "w"), indent=1)
    rr = r.reset_index()
    json.dump(dict(meta=meta, ratings=rec(rr), vetoes=vet, remaining_schedule=sos, games=games),
              open(os.path.join(OUT, f"week-{wk:02d}-matchup-intel.json"), "w"), indent=1)
    # mechanical tables
    w = adj[adj.week == wk].sort_values(["game_id", "home"])
    L = [f"# Week {wk} matchup grades: data tables", "", meta["caveat"], "",
         "| Game | Team | Score | Off | Pass O | Rush O | Def | Pass D | Rush D | ST | Overall (pct) | adj off EPA/pl | adj def EPA/pl | ST EPA | QB |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for _, x in w.iterrows():
        L.append(f"| {x.game_id[8:]} | {x.team} | {x.pts}-{x.opp_pts} | {x.g_off} | {x.g_pass_o} | {x.g_rush_o} | {x.g_def} | {x.g_pass_d} | {x.g_rush_d} | {x.g_st} | {x.g_overall} ({x.pct_overall:.0f}) | {x.adj_epa:+.3f} | {x.adj_d_epa:+.3f} | {x.st_epa:+.1f} | {x.qb} |")
    L += ["", "## Season ratings (opponent-adjusted, last 4 weeks 1.5x)", "",
          "| Rk | Team | Rec | Net pts/g | Off EPA/pl (rk) | Def EPA/pl (rk) | Pass O | Rush O | Pass D | Rush D | Sack% allowed (rk) | Sack% made (rk) | ST/g | Last-4 net | QB last game |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for t, x in r.sort_values("net", ascending=False).iterrows():
        L.append(f"| {x.rk_net} | {t} | {x.record} | {x.net:+.1f} | {x.off:+.3f} ({x.rk_off}) | {x.deff:+.3f} ({x.rk_deff}) | {x.rk_pass_o} | {x.rk_rush_o} | {x.rk_pass_d} | {x.rk_rush_d} | {x.sack_allowed:.1%} ({x.rk_sack_allowed}) | {x.sack_made:.1%} ({x.rk_sack_made}) | {x.st:+.1f} | {x.last4_net:+.1f} | {x.w_last_qb} |")
    open(os.path.join(OUT, f"week-{wk:02d}-matchups-data.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    open(os.path.join(OUT, f"week-{wk:02d}-matchup-intel.md"), "w", encoding="utf-8").write(render_intel(r, games, sos, vet, wk, cal))
    print(f"week {wk}: {len(w)} team-games graded; {len(games)} remaining games tagged -> {OUT}")
    print("calibration:", cal)


if __name__ == "__main__":
    main()
