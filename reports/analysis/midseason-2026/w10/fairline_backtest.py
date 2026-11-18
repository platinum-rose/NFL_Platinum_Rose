#!/usr/bin/env python3
"""Fair-line model backtest, Weeks 3-10 (2026), as-of inputs only. Read-only on every input.

Same core as reports/intel/w10-model/fair_lines_w10.py:
  model margin (home +) = 0.40*SRS diff + 0.40*K_DVOA*(DVOA diff) + 0.20*K_YPP*(net-ypp diff) + HFA 1.5
  fair line = market + 0.50*(model line - market); edge_pts = market - fair (= half the model-market gap)
  fair total = market + 0.50*((pf_h+pa_a)/2 + (pf_a+pa_h)/2 - market)
Differences from the live model, on purpose:
  - NO hand QB/injury adjustments (they were weekly judgment; rebuilding them now would use hindsight).
  - SRS, net ypp, points for/against and the DVOA/YPP->points slopes use only weeks before the game's week.
  - DVOA = the FTN team-efficiency export that existed before that week's first kickoff (table below);
    W3-4 use the Football Outsiders 2026 preseason projection (Supabase team_dvoa_snapshots, 2026-09-01).
Market = DraftKings open and close from data/official-picks/closing-lines-2026.json (ESPN pickcenter).
Run from the repo root:  python3 reports/analysis/midseason-2026/w10/fairline_backtest.py --preseason <fo_preseason.json>
"""
import argparse, collections, csv, json, os, statistics as st

ap = argparse.ArgumentParser()
ap.add_argument('--preseason', required=True, help='FO 2026 preseason projection: [{team, offensive_dvoa, defensive_dvoa}] (nicknames)')
ap.add_argument('--ftn-root', default=os.path.expanduser('~/mnt'), help='folder holding ftn-2026-10-13 / ftn-archive-2026-10-13')
ap.add_argument('--tuesday', help='DK Tuesday ~10 AM PT lines: [{week, home, away, spread_home, total}] (the line you could actually bet)')
ap.add_argument('--out', default='reports/analysis/midseason-2026/w10/fairline_backtest.json')
a = ap.parse_args()

W_SRS, W_DVOA, W_YPP, SHRINK, HFA, CAP = 0.40, 0.40, 0.20, 0.50, 1.5, 24
fix = {'LA': 'LAR', 'WSH': 'WAS', 'JAC': 'JAX'}
SE = 'data/research-intel/source-evidence'
# Week of games -> (label, offense csv, defense csv). Each export predates that week's first kickoff.
FTN = {
    5: ('FTN through W4 (export 10/09)', f'{a.ftn_root}/ftn-archive-2026-10-13/stats-iq-team-offense-efficiency.csv', f'{a.ftn_root}/ftn-archive-2026-10-13/stats-iq-team-defense-efficiency.csv'),
    6: ('FTN through W5 (export 10/13)', f'{a.ftn_root}/ftn-2026-10-13/stats-iq-team-offense-efficiency.csv', f'{a.ftn_root}/ftn-2026-10-13/stats-iq-team-defense-efficiency.csv'),
    7: ('FTN through W5 (export 10/13; no newer export before W7 kickoff)', f'{a.ftn_root}/ftn-2026-10-13/stats-iq-team-offense-efficiency.csv', f'{a.ftn_root}/ftn-2026-10-13/stats-iq-team-defense-efficiency.csv'),
    8: ('FTN through W7 (export 10/28)', f'{SE}/2026-10-28-ftn-stats-iq/stats-iq-team-offense-efficiency.csv', f'{SE}/2026-10-28-ftn-stats-iq/stats-iq-team-defense-efficiency.csv'),
    9: ('FTN through W8 (export 11/05)', f'{SE}/2026-11-05-ftn-stats-iq/stats-iq-team-offense-efficiency.csv', f'{SE}/2026-11-05-ftn-stats-iq/stats-iq-team-defense-efficiency.csv'),
    10: ('FTN through W9 (export 11/11 pm)', f'{SE}/2026-11-11-pm-ftn-stats-iq/stats-iq-team-offense-efficiency.csv', f'{SE}/2026-11-11-pm-ftn-stats-iq/stats-iq-team-defense-efficiency.csv'),
}
NAME = {'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI',
        'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
        'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX', 'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV',
        'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE',
        'New Orleans Saints': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT',
        'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'}
NICK = {full.split()[-1]: ab for full, ab in NAME.items()}

def ftn(path):
    return {NAME[r['Team']]: float(r['DVOA'].replace('%', '')) for r in csv.DictReader(open(path, encoding='utf-8-sig')) if r['Team'] in NAME}
pre = {NICK[r['team']]: float(r['offensive_dvoa']) - float(r['defensive_dvoa']) for r in json.load(open(a.preseason))}

TW = list(csv.DictReader(open('data/archive/2026/season/team-weeks.csv', encoding='utf-8')))
CL = json.load(open('data/official-picks/closing-lines-2026.json'))
GAMES = CL.get('games', CL) if isinstance(CL, dict) else CL
TUE = {}
if a.tuesday:
    for t in json.load(open(a.tuesday)):
        TUE[(t['week'], fix.get(t['home'], t['home']), fix.get(t['away'], t['away']))] = (t['spread_home'], t['total'])
# ESPN's "open" is DK's lookahead line, often set before the prior week's games and news, so it is NOT a fair test;
# 'tue' (Tuesday after MNF) is the first line set with the information the model has. 'close' is the hardest test.

def asof(k):
    """Team numbers using only weeks < k."""
    agg = collections.defaultdict(lambda: collections.defaultdict(list)); games_of = collections.defaultdict(list)
    for r in TW:
        if int(r['week']) >= k: continue
        t = fix.get(r['team'], r['team']); o = fix.get(r['opp'], r['opp'])
        for x in ('pts', 'opp_pts', 'ypp', 'opp_ypp'): agg[t][x].append(float(r[x]))
        games_of[t].append((o, max(-CAP, min(CAP, float(r['pts']) - float(r['opp_pts'])))))
    srs = {t: 0.0 for t in games_of}
    for _ in range(500):
        new = {t: st.mean(m for _, m in g) + st.mean(srs.get(o, 0.0) for o, _ in g) for t, g in games_of.items()}
        mu = st.mean(new.values()); srs = {t: v - mu for t, v in new.items()}
    net_ppg = {t: st.mean(x['pts']) - st.mean(x['opp_pts']) for t, x in agg.items()}
    pf = {t: st.mean(x['pts']) for t, x in agg.items()}; pa = {t: st.mean(x['opp_pts']) for t, x in agg.items()}
    net_ypp = {t: st.mean(x['ypp']) - st.mean(x['opp_ypp']) for t, x in agg.items()}
    return srs, net_ppg, pf, pa, net_ypp

def ols(x, y):
    ts = [t for t in y if t in x]; mx = st.mean(x[t] for t in ts); my = st.mean(y[t] for t in ts)
    return sum((x[t] - mx) * (y[t] - my) for t in ts) / sum((x[t] - mx) ** 2 for t in ts)

rows = []
for k in range(3, 11):
    srs, net_ppg, pf, pa, net_ypp = asof(k)
    if k in FTN:
        label, po, pd = FTN[k]; off, de = ftn(po), ftn(pd); dvoa = {t: off[t] - de[t] for t in off}; tier = 'A: in-season FTN'
    else:
        label, dvoa, tier = 'FO 2026 preseason projection', pre, 'B: preseason DVOA'
    K_DVOA, K_YPP = ols(dvoa, net_ppg), ols(net_ypp, net_ppg)
    for g in GAMES:
        if int(g['week']) != k or g.get('home_score') is None: continue
        aw, hm = fix.get(g['away'], g['away']), fix.get(g['home'], g['home'])
        if aw not in srs or hm not in srs or aw not in dvoa or hm not in dvoa: continue
        mm = W_SRS * (srs[hm] - srs[aw]) + W_DVOA * K_DVOA * (dvoa[hm] - dvoa[aw]) + W_YPP * K_YPP * (net_ypp[hm] - net_ypp[aw]) + HFA
        model_line = -mm; base_tot = (pf[hm] + pa[aw]) / 2 + (pf[aw] + pa[hm]) / 2
        margin = g['home_score'] - g['away_score']; total = g['home_score'] + g['away_score']
        r = dict(week=k, tier=tier, dvoa_source=label, game=f'{aw}@{hm}', model_line=round(model_line, 2), base_total=round(base_tot, 1),
                 home_margin=margin, total=total)
        for mk in ('tue', 'open', 'close'):
            line, tot = (TUE.get((k, hm, aw), (None, None)) if mk == 'tue' else (g.get(f'spread_home_{mk}'), g.get(f'total_{mk}')))
            if line is not None:
                edge = SHRINK * (line - model_line); side = 'home' if edge > 0 else 'away'
                res = margin + line; ats = 'P' if res == 0 or edge == 0 else ('W' if (res > 0) == (side == 'home') else 'L')
                r[f'side_{mk}'] = dict(line=line, edge=round(abs(edge), 2), pick=side, result=ats)
            if tot is not None:
                te = SHRINK * (base_tot - tot); pick = 'over' if te > 0 else 'under'
                res = total - tot; ou = 'P' if res == 0 or te == 0 else ('W' if (res > 0) == (pick == 'over') else 'L')
                r[f'total_{mk}'] = dict(line=tot, edge=round(abs(te), 2), pick=pick, result=ou)
        # did the market move toward the model between open and close? (spread)
        if g.get('spread_home_close') is not None and 'side_tue' in r:   # Tuesday -> close: did the market move toward the model?
            mv = g['spread_home_close'] - r['side_tue']['line']   # negative = moved toward home
            want = -1 if r['side_tue']['pick'] == 'home' else 1
            r['clv_side'] = 'toward' if mv * want > 0 else ('away' if mv * want < 0 else 'none')
        rows.append(r)

def bucket(e): return '2+' if e >= 2 else ('1-1.9' if e >= 1 else '<1')
def rec(rs, key):
    c = collections.Counter(r[key]['result'] for r in rs if key in r)
    w, l = c['W'], c['L']; return dict(W=w, L=l, P=c['P'], pct=round(100 * w / (w + l), 1) if w + l else None,
                                       units_at_110=round(w - 1.1 * l, 1))
out = dict(method=__doc__.strip().splitlines()[0], games=len(rows), summary={})
for tier in sorted({r['tier'] for r in rows}) + ['ALL']:
    T = [r for r in rows if tier == 'ALL' or r['tier'] == tier]
    s = {}
    for key in ('side_tue', 'side_open', 'side_close', 'total_tue', 'total_open', 'total_close'):
        s[key] = {b: rec([r for r in T if key in r and bucket(r[key]['edge']) == b], key) for b in ('2+', '1-1.9', '<1')}
        s[key]['all'] = rec(T, key)
    s['clv_side_2plus'] = dict(collections.Counter(r.get('clv_side') for r in T if 'side_tue' in r and r['side_tue']['edge'] >= 2))
    s['clv_side_all'] = dict(collections.Counter(r.get('clv_side') for r in T if 'side_tue' in r))
    s['games'] = len(T)
    out['summary'][tier] = s
out['by_week'] = {k: dict(games=sum(1 for r in rows if r['week'] == k),
                          side_tue_2plus=rec([r for r in rows if r['week'] == k and 'side_tue' in r and r['side_tue']['edge'] >= 2], 'side_tue'),
                          side_tue_all=rec([r for r in rows if r['week'] == k], 'side_tue'))
                  for k in sorted({r['week'] for r in rows})}
out['rows'] = rows
json.dump(out, open(a.out, 'w'), indent=1)
for tier, s in out['summary'].items():
    print(f"\n== {tier}: {s['games']} games")
    for key in ('side_tue', 'side_open', 'side_close', 'total_tue', 'total_open', 'total_close'):
        print(f"  {key:12s} " + '  '.join(f"{b}: {v['W']}-{v['L']}" + (f" ({v['pct']}%)" if v['pct'] is not None else '') for b, v in s[key].items()))
    print(f"  Tuesday->close moved toward the model (side picks, edge 2+): {s['clv_side_2plus']}   all: {s['clv_side_all']}")
print('\nby week (sides vs Tuesday, edge 2+ | all):')
for k, v in out['by_week'].items(): print(f"  W{k}: {v['games']} games  {v['side_tue_2plus']['W']}-{v['side_tue_2plus']['L']} | {v['side_tue_all']['W']}-{v['side_tue_all']['L']}")
print('wrote', a.out)
