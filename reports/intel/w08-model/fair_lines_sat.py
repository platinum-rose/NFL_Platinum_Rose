"""Week 8 Saturday quant refresh (pre-delta): Friday synthesis judgment adjustments (unchanged, same caps) on
CURRENT Bookmaker lines (data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt, Sat ~2:26 PM PT capture).
Shows how edges move with the market alone; games whose synthesis re-runs (delta rules) supersede their rows.
Writes reports/intel/w08-model/fair-lines-w08-sat.json. Run from repo root: python3 reports/intel/w08-model/fair_lines_sat.py"""
import json, glob, re, subprocess
SOFT, HARD = 2.0, 3.0
LINES = 'data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt'
cur = {}
for ln in open(LINES):
    m = re.match(r'^(\w+)@(\w+) \S+ [+-]?[\d.]+ \S+ \| \S+ ([+-]?[\d.]+) \S+ \| o([\d.]+)', ln)
    if m: cur[f'{m.group(1)}@{m.group(2)}'] = (float(m.group(3)), float(m.group(4)))
fri = {o['game']: o for o in json.load(open('reports/intel/w08-model/fair-lines-w08-synth.json'))}
out = []
for f in sorted(glob.glob('data/research-intel/proposed/games-w08/2026-w08-game-*-sides.json')):
    d = json.load(open(f)); g = d['game']; a = d.get('adjustments', {})
    if g not in cur: continue
    hl, tot = cur[g]
    madj, tadj = float(a.get('margin_adj') or 0), float(a.get('total_adj') or 0)
    if any(abs(v) > HARD for v in (madj, tadj)): raise SystemExit(f'{g}: adjustment over hard cap')
    j = json.loads(subprocess.run(['node', '-e', f"import('./scripts/intel/margin-simulator.mjs').then(m=>{{const c=m.loadCalibration();console.log(JSON.stringify(m.analyzeGame({{homeLine:{hl},total:{tot},marginAdj:{madj},totalAdj:{tadj}}},c)))}})"],
                                 capture_output=True, text=True, check=True).stdout)
    fo = fri.get(g, {})
    out.append(dict(game=g, fri_home_line=fo.get('bkr_home_line'), fri_total=fo.get('bkr_total'), bkr_home_line=hl, bkr_total=tot,
                    margin_adj=madj, total_adj=tadj, fair_home_line=round(hl - madj, 2), fair_total=round(tot + tadj, 2),
                    over_soft_cap=[k for k, v in (('margin', madj), ('total', tadj)) if abs(v) > SOFT], fri_sim=fo.get('sim'), sim=j))
json.dump(out, open('reports/intel/w08-model/fair-lines-w08-sat.json', 'w'), indent=1)
print(json.dumps(out[0]['sim'])[:600])
for o in out:
    print(f"{o['game']:8} line {o['fri_home_line']}->{o['bkr_home_line']} tot {o['fri_total']}->{o['bkr_total']} adj {o['margin_adj']}/{o['total_adj']}")
