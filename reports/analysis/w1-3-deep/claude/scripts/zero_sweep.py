"""Sweep wagers-file legs graded LOST with actual_stat 0 and compare with the ESPN box score (lookup-failure detector)."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from box import load_games, find, norm, ROOT
G = load_games()
d = json.load(open(os.path.join(ROOT, 'data/official-picks/user-placed-wagers-2026.json'), encoding='utf-8'))
KEY = [(r'recept', 'receiving', 'REC'), (r'receiving y', 'receiving', 'YDS'), (r'rushing y|rush y', 'rushing', 'YDS'),
       (r'carries|rush att', 'rushing', 'CAR'), (r'passing y|pass y', 'passing', 'YDS'), (r'passing t|pass t', 'passing', 'TD'),
       (r'complet', 'passing', 'C/ATT'), (r'tackles', 'defensive', 'TOT'), (r'sack', 'defensive', 'SACKS'),
       (r'interception', 'passing', 'INT'), (r'field goal', 'kicking', 'FG')]
sus = []
for t in d:
    wk = t.get('week')
    for l in t.get('legs') or []:
        if l.get('status') != 'LOST' or l.get('actual_stat') not in (0, '0', 0.0) or not l.get('player'): continue
        sel = (l.get('selection') or '') + ' ' + (l.get('market') or '')
        hits = [(g, pn, p) for g, pn, p in find(G, l['player']) if g['week'] == wk]
        if not hits: sus.append((wk, t.get('id'), l['player'], sel, 'NOT IN BOX (DNP?)')); continue
        g, pn, p = hits[0]
        val = None
        if re.search(r'touchdown|1\+ td|anytime', sel, re.I) and not re.search(r'pass', sel, re.I):
            val = sum(1 for s in g['scoring'] if norm(pn) in norm(s.split(' pass from ')[0].split(' Yd ')[0]))
        else:
            for rx, cat, k in KEY:
                if re.search(rx, sel, re.I):
                    if rx == 'interception' and not re.search(r'thrown|pass', sel, re.I) and 'passing' not in p: cat, k = 'interceptions', 'INT'
                    val = (p.get(cat) or {}).get(k); break
        try: vnum = float(str(val).split('/')[0]) if val is not None else None
        except ValueError: vnum = None
        if vnum: sus.append((wk, t.get('id'), l['player'], sel.strip(), f'box={val}'))
for s in sus: print(*s, sep=' | ')
print(len(sus), 'suspicious')
