"""Saturday delta: Friday BKR market (fair-lines-w11.json) vs Saturday BetOnline game lines.
Writes scratch/w11-sat-delta.json. Book-to-book comparison: a 0.5 gap can be noise (runbook)."""
import json
NICK = {'Miami Dolphins': 'MIA', 'Buffalo Bills': 'BUF', 'New Orleans Saints': 'NO', 'Chicago Bears': 'CHI',
        'Tennessee Titans': 'TEN', 'Dallas Cowboys': 'DAL', 'Pittsburgh Steelers': 'PIT', 'Philadelphia Eagles': 'PHI',
        'Baltimore Ravens': 'BAL', 'Carolina Panthers': 'CAR', 'New York Jets': 'NYJ', 'Los Angeles Chargers': 'LAC',
        'Las Vegas Raiders': 'LV', 'Denver Broncos': 'DEN', 'Jacksonville Jaguars': 'JAX', 'New York Giants': 'NYG',
        'Minnesota Vikings': 'MIN', 'San Francisco 49ers': 'SF', 'Cincinnati Bengals': 'CIN', 'Washington Commanders': 'WAS'}
fl = {g['game']: g for g in json.load(open('reports/intel/w11-model/fair-lines-w11.json', encoding='utf-8'))['games']} if isinstance(json.load(open('reports/intel/w11-model/fair-lines-w11.json', encoding='utf-8')), dict) else {g['game']: g for g in json.load(open('reports/intel/w11-model/fair-lines-w11.json', encoding='utf-8'))}
b = json.load(open('data/generated/props/betonline-live-2026-11-21-week11.json', encoding='utf-8'))
bol = {}
for r in b['rows']:
    if r['market'] != 'game_lines': continue
    a, h = r['game'].split(' @ ')
    if a not in NICK or h not in NICK: continue
    key = f"{NICK[a]}@{NICK[h]}"
    d = bol.setdefault(key, {})
    if r['bet'] == 'spread' and r.get('team') == h: d['home_line'] = float(r['line']); d['home_spread_odds'] = r['odds']
    if r['bet'] == 'spread' and r.get('team') == a: d['away_spread_odds'] = r['odds']
    if r['bet'] == 'total' and r.get('side') == 'Over': d['total'] = float(r['odds']) if False else None
    if r['bet'] == 'total':
        # parser puts the total number in line? fall back to odds column order seen in dump
        d.setdefault('total_rows', []).append((r.get('side'), r.get('line'), r.get('odds')))
out = []
for g, f in fl.items():
    if g == 'IND@HOU': continue
    s = bol.get(g, {})
    tot = None
    for side, line, odds in s.get('total_rows', []):
        # dump shows total rows as line=None, odds=<number>; the number column is the total itself when abs>20
        cand = line if line not in (None, '') else odds
        try:
            v = float(cand)
            if abs(v) > 20: tot = v
        except Exception: pass
    row = {'game': g, 'fri_bkr_home_line': f['market_home_line'], 'fri_bkr_total': f['market_total'],
           'fair_home_line': round(f['fair_home_line'], 1), 'fair_total': round(f['fair_total'], 1),
           'sat_bol_home_line': s.get('home_line'), 'sat_bol_total': tot,
           'sat_bol_home_spread_odds': s.get('home_spread_odds'), 'sat_bol_away_spread_odds': s.get('away_spread_odds')}
    if s.get('home_line') is not None:
        row['spread_move'] = round(s['home_line'] - f['market_home_line'], 1)
        lo, hi = sorted([abs(s['home_line']), abs(f['market_home_line'])])
        row['crosses_key'] = any(lo < k < hi or (lo != hi and k in (lo, hi) and lo != k) for k in (3, 7)) if lo != hi else False
        row['home_edge_vs_sat'] = round(s['home_line'] - f['fair_home_line'], 1)
    if tot is not None:
        row['total_move'] = round(tot - f['market_total'], 1)
        row['total_edge_over_vs_sat'] = round(f['fair_total'] - tot, 1)
    row['rerun'] = (s.get('home_line') is None) or abs(row.get('spread_move', 0)) >= 0.5 or abs(row.get('total_move', 0)) >= 0.5 or row.get('crosses_key', False)
    out.append(row)
    print(json.dumps(row))
json.dump({'built_at_note': 'Saturday 2026-11-21; BOL capturedAt ' + b['capturedAt'], 'rows': out}, open('scratch/w11-sat-delta.json', 'w', encoding='utf-8'), indent=1)
