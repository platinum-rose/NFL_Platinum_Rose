"""Grade Master Intel + SuperContest pitches (W7-9; what went to clients). Output pitch_grades.jsonl"""
import json, re, csv
fix = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}
R = {}
for r in csv.DictReader(open('data/archive/2026/season/team-weeks.csv')):
    R[(int(r['week']), fix.get(r['team'], r['team']))] = (float(r['pts']), float(r['opp_pts']))
NICK = {}
SC = {}
for w in (7, 8, 9):
    for g in json.load(open(f'data/supercontest/week-{w:02d}-lines.json'))['games']:
        fav, dog, L = g['favorite_abbr'], g['underdog_abbr'], abs(float(g['contest_line']))
        SC[(w, fix.get(fav, fav))] = -L; SC[(w, fix.get(dog, dog))] = L
rows = []
for kind in ('master', 'supercontest'):
    for w in (7, 8, 9):
        d = json.load(open(f'reports/intel/{kind}-pitches-2026-w{w:02d}.json'))
        for k, v in d['picks'].items():
            game = (v.get('game') or k).split('|')[0]; pick = v.get('pick') or v.get('side') or v.get('selection') or ''
            if not pick and isinstance(k, str) and not '@' in k: pick = k
            m = re.match(r'\s*(Over|Under)\s+(\d+(?:\.\d+)?)', pick, re.I); res = 'U'; det = ''
            if m and '@' in game:
                a, h = game.split('@'); s = R.get((w, fix.get(h, h)))
                if s:
                    t = s[0] + s[1]; L = float(m.group(2)); over = m.group(1).lower() == 'over'
                    res = 'P' if t == L else ('W' if (t > L) == over else 'L'); det = f'total {t:g} vs {L}'
            else:
                m = re.match(r'\s*([A-Z]{2,3})\s*([+-]\d+(?:\.\d+)?|ML|PK|pick)?', pick)
                if m and (w, fix.get(m.group(1), m.group(1))) in R:
                    tm = fix.get(m.group(1), m.group(1)); pf, pa = R[(w, tm)]
                    L = 0.0 if not m.group(2) or m.group(2) in ('ML', 'PK', 'pick') else float(m.group(2))
                    if kind == 'supercontest' and not m.group(2): L = SC.get((w, tm), 0.0); pick = f'{tm} {L:+g} (contest line)'
                    adj = pf - pa + L; res = 'P' if adj == 0 else ('W' if adj > 0 else 'L'); det = f'{tm} {pf:g}-{pa:g} ({L:+g})'
            rows.append(dict(week=w, kind=kind, game=game, pick=pick, result=res, detail=det))
with open('reports/analysis/midseason-2026/pitch_grades.jsonl', 'w') as f:
    for r in rows: f.write(json.dumps(r) + '\n')
for r in rows: print(r)
