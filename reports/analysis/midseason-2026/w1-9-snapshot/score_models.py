"""Score the fair-line model + margin simulator (W8, W9 variants) against results. Read-only.
Output: reports/analysis/midseason-2026/model_scores.json"""
import json, csv, glob, os, collections
fix = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}
res = {}
for r in csv.DictReader(open('data/archive/2026/season/team-weeks.csv')):
    if r['home_away'] != 'home': continue
    res[(int(r['week']), f"{fix.get(r['opp'], r['opp'])}@{fix.get(r['team'], r['team'])}")] = (float(r['pts']) - float(r['opp_pts']), float(r['pts']) + float(r['opp_pts']))
def load(path, week):
    d = json.load(open(path)); out = []
    G = d['games'] if isinstance(d, dict) else d
    for g in G:
        gid = g['game'].replace(' ', '')
        if isinstance(d, dict):
            line, tot, fl, ft = g['market_home_line'], g['market_total'], g['fair_line'], g['fair_total']; sm = g.get('sim_market', {})
            hc, ov = sm.get('home_cover'), sm.get('over')
        else:
            line = next((g[k] for k in ('home_line', 'bkr_home_line', 'sat_home_line', 'fri_home_line') if g.get(k) is not None), None)
            tot = next((g[k] for k in ('total', 'bkr_total', 'sat_total', 'fri_total') if g.get(k) is not None), None)
            fl, ft = g.get('fair_line', g.get('fair_home_line')), g.get('fair_total')
            sm = next((g[k] for k in ('sim', 'bkr_sim', 'sat_sim', 'fri_sim') if isinstance(g.get(k), dict)), {})
            hc, ov = sm.get('home_cover_excl_push'), sm.get('over_excl_push')
        if (week, gid) not in res or line is None: continue
        m, t = res[(week, gid)]
        out.append(dict(game=gid, line=line, total=tot, fair=fl, fair_total=ft, p_home=hc, p_over=ov, margin=m, final_total=t))
    return out
variants = {}
for w in (8, 9):
    for p in sorted(glob.glob(f'reports/intel/w0{w}-model/fair-lines-w0{w}*.json')):
        if '.bak' in p: continue
        variants[os.path.basename(p)] = (w, load(p, w))
rep = {}
for name, (w, G) in variants.items():
    ats = collections.defaultdict(lambda: [0, 0]); ou = collections.defaultdict(lambda: [0, 0]); brier = [0, 0, 0]; mae = [0, 0, 0]
    for g in G:
        cover = g['margin'] + g['line']  # >0 home covers
        edge = g['line'] - g['fair'] if g['fair'] is not None else 0
        if cover != 0 and abs(edge) >= 0.5:
            for b in (0.5, 1, 2):
                if abs(edge) >= b: ats[b][0] += (edge > 0) == (cover > 0); ats[b][1] += 1
        if g['fair_total'] is not None and g['final_total'] != g['total']:
            te = g['fair_total'] - g['total']
            for b in (1, 2, 3):
                if abs(te) >= b: ou[b][0] += (te > 0) == (g['final_total'] > g['total']); ou[b][1] += 1
        if g['p_home'] is not None and cover != 0:
            y = 1 if cover > 0 else 0; brier[0] += (g['p_home'] - y) ** 2; brier[1] += (0.5 - y) ** 2; brier[2] += 1
        mae[0] += abs(-g['fair'] - g['margin']); mae[1] += abs(-g['line'] - g['margin']); mae[2] += 1
    if not mae[2]: rep[name] = dict(week=w, games=0, note='no games matched'); continue
    rep[name] = dict(week=w, games=len(G), ats_by_edge={str(k): v for k, v in ats.items()}, ou_by_edge={str(k): v for k, v in ou.items()},
                     brier_model=round(brier[0] / brier[2], 4) if brier[2] else None, brier_coinflip=round(brier[1] / brier[2], 4) if brier[2] else None,
                     margin_mae_fair=round(mae[0] / mae[2], 2), margin_mae_market=round(mae[1] / mae[2], 2))
ep = json.load(open('reports/analysis/season/claude/out/week-09-matchup-intel.json'))['meta']['projection_calibration']
rep['epa_matchup_model_walkforward_w5_9'] = ep
json.dump(rep, open('reports/analysis/midseason-2026/model_scores.json', 'w'), indent=1)
for k, v in rep.items(): print(k, v)
