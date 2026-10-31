"""Week 8 quant refresh (step 4): BKR lines (from each sides synthesis' baseline sim run) + the synthesis
judgment adjustments (sourced, capped soft 2.0 / hard 3.0) -> simulator. Supersedes the Friday SRS-only
baseline (fair-lines-w08.json), whose MIN adj of -3.08 broke the hard cap.
Run from repo root: python3 reports/intel/w08-model/fair_lines_synth.py"""
import json, glob, re, subprocess
SOFT, HARD = 2.0, 3.0
def baseline(runs):
    for r in runs:
        if 'args' in r:
            m = re.search(r'--home-line (\S+) --total (\S+)', r['args'])
            if m: return float(m.group(1)), float(m.group(2))
        if 'home_line' in r and 'total' in r: return float(r['home_line']), float(r['total'])
    raise ValueError('no baseline')
out = []
for f in sorted(glob.glob('data/research-intel/proposed/games-w08/2026-w08-game-*-sides.json')):
    d = json.load(open(f)); a = d.get('adjustments', {})
    hl, tot = baseline(d.get('sim_runs', []))
    madj, tadj = float(a.get('margin_adj') or 0), float(a.get('total_adj') or 0)
    flags = [k for k, v in (('margin', madj), ('total', tadj)) if abs(v) > SOFT]
    if any(abs(v) > HARD for v in (madj, tadj)): raise SystemExit(f"{d['game']}: adjustment over hard cap")
    j = json.loads(subprocess.run(['node', '-e', f"import('./scripts/intel/margin-simulator.mjs').then(m=>{{const c=m.loadCalibration();console.log(JSON.stringify(m.analyzeGame({{homeLine:{hl},total:{tot},marginAdj:{madj},totalAdj:{tadj}}},c)))}})"],
                                 capture_output=True, text=True, check=True).stdout)
    out.append(dict(game=d['game'], bkr_home_line=hl, bkr_total=tot, margin_adj=madj, total_adj=tadj,
                    fair_home_line=round(hl - madj, 2), fair_total=round(tot + tadj, 2), over_soft_cap=flags,
                    adj_reasons=a.get('reasons'), sim=j))
json.dump(out, open('reports/intel/w08-model/fair-lines-w08-synth.json', 'w'), indent=1)
for o in out:
    s = json.dumps(o['sim'])
    print(f"{o['game']:8} line {o['bkr_home_line']:>5} adj {o['margin_adj']:>5} fair {o['fair_home_line']:>6} | tot {o['bkr_total']} adj {o['total_adj']:>4} fair {o['fair_total']} | {'SOFTCAP:'+','.join(o['over_soft_cap']) if o['over_soft_cap'] else ''} {s[:150]}")
