#!/usr/bin/env python3
"""Runbook §3a matchup splits for every game of a week (checks 3-6 automated; 1-2 flagged manual).
usage: python3 scripts/analysis/matchup_splits.py --week 12 [--ftn-dir data/research-intel/source-evidence/<date>-ftn-stats-iq]
Inputs: data/nflverse/2026/{play_by_play_2026.csv.gz, snap_counts_2026.csv, ftn_charting_2026.csv}, public/schedule.json,
        latest FTN Stats IQ capture (team-defense-pass-rush BLZ%, receiving-efficiency YPRR, rushing-usage).
Outputs: data/generated/matchup-splits/2026-wNN.json and reports/bets/2026-wNN-matchup-splits.md
Blitz from FTN charting = n_blitzers>0 on dropbacks. Alignment and coverage shell are NOT in any of these inputs."""
import argparse, json, glob, os, csv, re
import pandas as pd
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--ftn-dir'); a = ap.parse_args()
WK = a.week; N = 'data/nflverse/2026/'
FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LA','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
fx = lambda t: {'LAR': 'LA', 'WSH': 'WAS'}.get(t, t)
disp = lambda t: 'LAR' if t == 'LA' else t
p = pd.read_csv(N + 'play_by_play_2026.csv.gz', low_memory=False); p = p[(p.season_type == 'REG') & (p.week < WK)]
fc = pd.read_csv(N + 'ftn_charting_2026.csv', low_memory=False)[['nflverse_game_id', 'nflverse_play_id', 'n_blitzers', 'n_pass_rushers', 'n_defense_box', 'is_play_action', 'is_qb_out_of_pocket', 'is_screen_pass', 'is_motion']]
p = p.merge(fc, left_on=['game_id', 'play_id'], right_on=['nflverse_game_id', 'nflverse_play_id'], how='left')
p['blitz'] = (p.n_blitzers > 0).where(p.n_blitzers.notna())
sn = pd.read_csv(N + 'snap_counts_2026.csv')
ab = lambda n: (lambda s: s[0][0] + '.' + ' '.join(s[1:]) if len(s) > 1 else s[0])(str(n).replace(' Jr.', '').replace(' III', '').replace(' II', '').split())
pos = sn.assign(ab=sn.player.map(ab), tm=sn.team.map(fx)).groupby(['tm', 'ab']).position.agg(lambda x: x.mode()[0]).to_dict()
abj = lambda n: ab(n)  # same normaliser for FTN names
run = p[(p.play_type == 'run') & (p.qb_scramble != 1)]; db = p[p.qb_dropback == 1]; pa = p[p.play_type == 'pass'].copy()
pa['pos'] = [pos.get((t, ab(r) if isinstance(r, str) and ' ' in r else r)) or pos.get((t, r)) for t, r in zip(pa.posteam, pa.receiver_player_name)]
G = p.groupby('posteam').game_id.nunique(); GD = p.groupby('defteam').game_id.nunique()
def rk(s, asc=False): return s.rank(ascending=asc, method='min').astype(int)
T = pd.DataFrame(index=sorted(G.index))
T['games'] = G
T['off_ypc'] = run.groupby('posteam').yards_gained.mean(); T['def_ypc'] = run.groupby('defteam').yards_gained.mean()
T['off_epa_rush'] = run.groupby('posteam').epa.mean(); T['def_epa_rush'] = run.groupby('defteam').epa.mean()
T['def_box_avg'] = run.groupby('defteam').n_defense_box.mean(); T['off_ypc_8box'] = run[run.n_defense_box >= 8].groupby('posteam').yards_gained.mean()
T['off_epa_db'] = db.groupby('posteam').epa.mean(); T['def_epa_db'] = db.groupby('defteam').epa.mean()
for ps in ('WR', 'TE', 'RB'):
    T[f'def_{ps}_yds_g'] = pa[pa.pos == ps].groupby('defteam').receiving_yards.sum() / GD
T['def_TE_td'] = pa[pa.pos == 'TE'].groupby('defteam').pass_touchdown.sum()
for loc in ('left', 'middle', 'right'):
    T[f'def_epa_{loc}'] = pa[pa.pass_location == loc].groupby('defteam').epa.mean()
T['def_blitz_rate_ftnchart'] = db.groupby('defteam').blitz.mean(); T['def_5plus_rush'] = (db.n_pass_rushers >= 5).groupby(db.defteam).mean()
T['def_scr_rate_allowed'] = db.groupby('defteam').qb_scramble.mean(); T['def_scr_yds_g'] = db[db.qb_scramble == 1].groupby('defteam').yards_gained.sum() / GD
T['off_scr_rate'] = db.groupby('posteam').qb_scramble.mean(); T['off_oop_rate'] = db.groupby('posteam').is_qb_out_of_pocket.mean()
T['off_pa_rate'] = db.groupby('posteam').is_play_action.mean()
T['off_epa_vs_blitz'] = db[db.blitz == True].groupby('posteam').epa.mean(); T['off_epa_no_blitz'] = db[db.blitz == False].groupby('posteam').epa.mean()
T['def_epa_when_blitz'] = db[db.blitz == True].groupby('defteam').epa.mean(); T['def_epa_no_blitz'] = db[db.blitz == False].groupby('defteam').epa.mean()
T = T.infer_objects().fillna(0)
for c, asc in [('off_ypc', 0), ('def_ypc', 0), ('def_WR_yds_g', 0), ('def_TE_yds_g', 0), ('def_RB_yds_g', 0), ('def_TE_td', 0), ('def_blitz_rate_ftnchart', 0), ('def_epa_db', 0), ('off_scr_rate', 0)]:
    T[c + '_rk'] = rk(T[c], bool(asc))  # rank 1 = highest value (most allowed / most blitz / best YPC)
# FTN Stats IQ capture (latest dated folder unless given)
fd = a.ftn_dir or sorted(glob.glob('data/research-intel/source-evidence/*-ftn-stats-iq'))[-1]
def rcsv(n):
    f = os.path.join(fd, f'stats-iq-{n}.csv'); return list(csv.DictReader(open(f, encoding='utf-8-sig'))) if os.path.exists(f) else []
for r in rcsv('team-defense-pass-rush'):
    t = FULL.get(r['Team'])
    if t in T.index: T.loc[t, 'ftn_blz_pct'] = float(r['BLZ%'].strip('%') or 0); T.loc[t, 'ftn_press_pct'] = float(r['PRESS%'].strip('%') or 0)
yprr = {}
for r in rcsv('receiving-efficiency'):
    t = FULL.get(r['Team'], r['Team']); yprr[(fx(t), ab(r['Player']))] = (r.get('YPRR'), r.get('TPRR'), r.get('RTE'))
# coverage shell (FTN, added 2026-11-24): team-defense/coverage + receiving/coverage-types (raw prefixed export)
pct = lambda v: float(str(v).replace('%', '').replace(',', '') or 'nan') if str(v).strip() not in ('', '-') else float('nan')
def rawcsv(cat_sub):
    f = glob.glob(os.path.join(fd, 'raw', f'ftn_{cat_sub}_2026_REG.csv')); return list(csv.DictReader(open(f[0], encoding='utf-8-sig'))) if f else []
SHELL = {}
for r in rawcsv('team-defense_coverage'):
    t = FULL.get(r['NAME'])
    if t: SHELL[t] = {k: pct(r[f'{k} RATE']) for k in ('Man Coverage', 'Zone Coverage', 'Single High', 'Two High')} | {k + ' EPA': pct(r[f'{k} EPA/DB']) for k in ('Man Coverage', 'Zone Coverage', 'Single High', 'Two High')}
CT = {}
for r in rawcsv('receiving_coverage-types'):
    t = FULL.get(r['TEAM'])
    if t: CT[(t, ab(r['NAME']))] = {k: (pct(r[f'{k} RATE']), pct(r[f'{k} YPRR'])) for k in ('Man Coverage', 'Zone Coverage', 'Single High', 'Two High')}
SH_RK = {}
if SHELL:
    sd = pd.DataFrame(SHELL).T
    for c in ('Man Coverage', 'Single High'): SH_RK[c] = sd[c].rank(ascending=False, method='min').astype(int).to_dict()
def shell_fit(off_team, name, def_team, base_yprr):
    c = CT.get((off_team, name)); d = SHELL.get(def_team)
    if not c or not d: return None
    out = {}
    for a, b in (('Man Coverage', 'Zone Coverage'), ('Single High', 'Two High')):
        ra, rb = d[a], d[b]; ya, yb = c[a][1], c[b][1]
        if any(pd.isna(x) for x in (ra, rb, ya, yb)) or ra + rb == 0: continue
        exp = (ra * ya + rb * yb) / (ra + rb); out[a.split()[0].lower() + '_' + b.split()[0].lower()] = round(exp, 2)
        out[f'yprr_{a.split()[0].lower()}'] = ya; out[f'yprr_{b.split()[0].lower()}'] = yb
    try: base = float(base_yprr)
    except (TypeError, ValueError): base = None
    if base and out:
        e = [v for k, v in out.items() if k in ('man_zone', 'single_two')]; avg = sum(e) / len(e); out['matchup_yprr'] = round(avg, 2); out['vs_season'] = round(avg / base - 1, 3)
        out['verdict'] = 'FAVOURED' if avg / base - 1 >= 0.10 else ('FLAG worst-shell' if avg / base - 1 <= -0.15 else 'neutral')
    return out
# roster status tag (ESPN latest + operator overrides already applied by roster:vet)
RS = {}
try:
    for nm, L in json.load(open('data/nfl-rosters/espn-full-rosters-latest.json'))['players'].items():
        for r in L: RS[(fx(r['team']), ab(nm))] = 'OUT' if r['group'] == 'injuredReserveOrOut' else ('PS' if r['group'] == 'practiceSquad' else '')
except Exception: pass
# players
lw = sorted(p.week.unique())[-3:]
def players(t, dteam=None):
    o = pa[pa.posteam == t]; rr = run[run.posteam == t]
    rec = o.groupby('receiver_player_name').agg(tg=('play_id', 'size'), yds=('receiving_yards', 'sum'), td=('pass_touchdown', 'sum'), adot=('air_yards', 'mean'), rz=('yardline_100', lambda x: int((x <= 20).sum()))).sort_values('tg', ascending=False).head(8)
    l3 = o[o.week.isin(sorted(o.week.unique())[-3:])].receiver_player_name.value_counts()
    vb = o[o.blitz == True].groupby('receiver_player_name').epa.mean(); nb = o[o.blitz == False].groupby('receiver_player_name').epa.mean()
    R = []
    for n, x in rec.iterrows():
        y = yprr.get((t, n), (None, None, None))
        R.append(dict(status=RS.get((t, n), 'check-roster'), shell=shell_fit(t, n, dteam, y[0]) if dteam else None, name=n, pos=pos.get((t, n)), tg=int(x.tg), tg_last3=int(l3.get(n, 0)), yds=int(x.yds), td=int(x.td), adot=round(x.adot, 1), rz_tg=x.rz, yprr=y[0], tprr=y[1], epa_tgt_vs_blitz=round(vb.get(n, float('nan')), 2), epa_tgt_no_blitz=round(nb.get(n, float('nan')), 2)))
    ru = rr.groupby('rusher_player_name').agg(c=('play_id', 'size'), y=('yards_gained', 'sum'), td=('rush_touchdown', 'sum')).sort_values('c', ascending=False).head(5)
    l3r = rr[rr.week.isin(sorted(rr.week.unique())[-3:])].rusher_player_name.value_counts()
    i10 = rr[rr.yardline_100 <= 10].rusher_player_name.value_counts(); i5 = rr[rr.yardline_100 <= 5].rusher_player_name.value_counts()
    B = [dict(status=RS.get((t, n), 'check-roster'), name=n, car=int(x.c), ypc=round(x.y / x.c, 2), td=int(x.td), car_last3=int(l3r.get(n, 0)), in10=int(i10.get(n, 0)), in5=int(i5.get(n, 0))) for n, x in ru.iterrows()]
    return R, B
sched = json.load(open('public/schedule.json')); sched = sched if isinstance(sched, list) else sched.get('games', [])
games = [(fx(g.get('visitor') or g.get('away')), fx(g.get('home'))) for g in sorted(sched, key=lambda g: g.get('kickoff_utc') or '') if str(g.get('week')) == str(WK)]
f2 = lambda v: None if pd.isna(v) else round(float(v), 3)
def side(o, d):
    a_, b_ = T.loc[o], T.loc[d]; fl = []
    if b_.def_blitz_rate_ftnchart_rk >= 23 and a_.off_scr_rate >= 0.06: fl.append(f'#3 LOOK: {disp(d)} low-blitz (rk {b_.def_blitz_rate_ftnchart_rk}/32) vs {disp(o)} scramble rate {a_.off_scr_rate:.1%} -> QB rush overs')
    else: fl.append(f'#3 no look: {disp(d)} blitz rk {b_.def_blitz_rate_ftnchart_rk}/32 (FTN BLZ% {b_.get("ftn_blz_pct", float("nan"))}), {disp(o)} scr rate {a_.off_scr_rate:.1%}')
    if (b_.def_TE_yds_g_rk <= 10 and b_.def_TE_td_rk <= 10) or b_.def_TE_yds_g_rk <= 5 or b_.def_TE_td_rk <= 5: fl.append(f'#4 LOOK: {disp(d)} TE leak (TE yds/g rk {b_.def_TE_yds_g_rk}, TE TD rk {b_.def_TE_td_rk}) -> price {disp(o)} TE ATD')
    else: fl.append(f'#4 no leak: {disp(d)} TE yds/g rk {b_.def_TE_yds_g_rk}, TE TD rk {b_.def_TE_td_rk}')
    if a_.off_ypc_rk >= 21 and b_.def_ypc_rk >= 21: fl.append(f'#5 FADE RUN: {disp(o)} YPC rk {a_.off_ypc_rk} vs {disp(d)} YPC-allowed rk {b_.def_ypc_rk} (both bad for run) -> fade RB yds, lean pass + correlated QB/WR')
    elif a_.off_ypc_rk <= 12 and b_.def_ypc_rk <= 12: fl.append(f'#5 RUN EDGE: {disp(o)} YPC rk {a_.off_ypc_rk} vs {disp(d)} allows rk {b_.def_ypc_rk} -> RB yds/ATD lean')
    else: fl.append(f'#5 neutral: {disp(o)} YPC rk {a_.off_ypc_rk}, {disp(d)} YPC-allowed rk {b_.def_ypc_rk}')
    if b_.def_WR_yds_g_rk >= 25: fl.append(f'#1 partial: {disp(d)} suppresses WRs (WR yds/g rk {b_.def_WR_yds_g_rk}) -> {disp(o)} WR yds overs flagged against alignment pending slot/outside data')
    elif b_.def_WR_yds_g_rk <= 8: fl.append(f'#1 partial: {disp(d)} leaks to WRs (rk {b_.def_WR_yds_g_rk}); alignment split manual')
    sh = SHELL.get(d)
    if sh: fl.append(f"#2 shell: {disp(d)} man {sh['Man Coverage']:.1f}% (rk {SH_RK['Man Coverage'][d]}) / zone {sh['Zone Coverage']:.1f}%, single-high {sh['Single High']:.1f}% (rk {SH_RK['Single High'][d]}) / two-high {sh['Two High']:.1f}%; EPA/db man {sh['Man Coverage EPA']} zone {sh['Zone Coverage EPA']} 1-high {sh['Single High EPA']} 2-high {sh['Two High EPA']}")
    else: fl.append('#2 coverage shell: no FTN row')
    R, B = players(o, d)
    keys = ['off_ypc', 'off_epa_rush', 'off_ypc_8box', 'off_epa_db', 'off_scr_rate', 'off_oop_rate', 'off_pa_rate', 'off_epa_vs_blitz', 'off_epa_no_blitz']
    dkeys = ['def_ypc', 'def_epa_rush', 'def_box_avg', 'def_epa_db', 'def_WR_yds_g', 'def_TE_yds_g', 'def_TE_td', 'def_RB_yds_g', 'def_epa_left', 'def_epa_middle', 'def_epa_right', 'def_blitz_rate_ftnchart', 'ftn_blz_pct', 'ftn_press_pct', 'def_5plus_rush', 'def_epa_when_blitz', 'def_epa_no_blitz', 'def_scr_rate_allowed']
    return dict(offense=disp(o), defense=disp(d), off={k: f2(a_.get(k)) for k in keys}, deff={k: f2(b_.get(k)) for k in dkeys}, ranks={k: int(v) for k, v in pd.concat([a_[[c for c in a_.index if c.startswith('off_') and c.endswith('_rk')]], b_[[c for c in b_.index if c.startswith('def_') and c.endswith('_rk')]]]).items()}, flags=fl, receivers=R, rushers=B)
out = dict(schema='matchup_splits_v1', season=2026, week=WK, through_week=int(p.week.max()), games_in_pbp=int(p.game_id.nunique()), ftn_capture=fd, note='Checks 2-6 automated (#2 from FTN coverage tables); #1 partial (defense split only, no player alignment). Blitz = FTN charting n_blitzers>0.', games=[])
for aw, hm in games:
    out['games'].append(dict(game=f'{disp(aw)}@{disp(hm)}', sides=[side(aw, hm), side(hm, aw)]))
jp = f'data/generated/matchup-splits/2026-w{WK:02d}.json'; json.dump(out, open(jp, 'w'), indent=1, default=str)
L = [f'# W{WK} matchup splits — all games (runbook §3a, auto)', '', f'Built from nflverse PBP through week {out["through_week"]} ({out["games_in_pbp"]} games) + FTN charting + FTN Stats IQ `{fd}`. Ranks: 1 = most (yards allowed / blitz / YPC). Proposals only.', '', '**#2 coverage shell now from FTN team-defense/coverage + receiving/coverage-types (shell-fit YPRR = receiver YPRR weighted by opponent man/zone and 1-high/2-high mix; FAVOURED >= +10% vs season, FLAG <= -15%). #1 player alignment still not in any input.**', '']
for g in out['games']:
    L.append(f'## {g["game"]}')
    for s in g['sides']:
        L.append(f'### {s["offense"]} offense vs {s["defense"]} defense'); L += ['- ' + f for f in s['flags']]
        o, d = s['off'], s['deff']
        L.append(f'- Run: {s["offense"]} YPC {o["off_ypc"]} (vs 8+ box {o["off_ypc_8box"]}) | {s["defense"]} allows {d["def_ypc"]}, avg box {d["def_box_avg"]}')
        L.append(f'- Pass: {s["offense"]} EPA/db {o["off_epa_db"]} (vs blitz {o["off_epa_vs_blitz"]}, no blitz {o["off_epa_no_blitz"]}) | {s["defense"]} EPA/db allowed {d["def_epa_db"]}, L/M/R {d["def_epa_left"]}/{d["def_epa_middle"]}/{d["def_epa_right"]}, blitz {d["def_blitz_rate_ftnchart"]} (FTN BLZ% {d["ftn_blz_pct"]}), WR/TE/RB rec yds/g {d["def_WR_yds_g"]}/{d["def_TE_yds_g"]}/{d["def_RB_yds_g"]}')
        L.append('- Targets: ' + '; '.join(f'{r["name"]}{" ["+r["status"]+"]" if r["status"] else ""} {r["pos"] or "?"} {r["tg"]}t (L3 {r["tg_last3"]}) aDOT {r["adot"]} YPRR {r["yprr"]} EPA/t blitz {r["epa_tgt_vs_blitz"]} / none {r["epa_tgt_no_blitz"]}' + (f' | shell-fit YPRR {r["shell"]["matchup_yprr"]} ({r["shell"]["vs_season"]:+.0%}, {r["shell"]["verdict"]}; man {r["shell"].get("yprr_man")}/zone {r["shell"].get("yprr_zone")}/1H {r["shell"].get("yprr_single")}/2H {r["shell"].get("yprr_two")})' if r.get('shell') and r['shell'].get('matchup_yprr') else ' | shell: n/a') for r in s['receivers'][:6]))
        L.append('- #6 backs: ' + '; '.join(f'{b["name"]}{" ["+b["status"]+"]" if b["status"] else ""} {b["car"]}c {b["ypc"]}ypc {b["td"]}TD L3 {b["car_last3"]}c in10 {b["in10"]} in5 {b["in5"]}' for b in s['rushers'][:4]))
    L.append('')
mp = f'reports/bets/2026-w{WK:02d}-matchup-splits.md'; open(mp, 'w').write('\n'.join(L))
print('wrote', jp, mp, 'games', len(out['games']), 'thru wk', out['through_week'])
