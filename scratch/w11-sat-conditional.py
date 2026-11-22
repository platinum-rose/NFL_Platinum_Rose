import json
d = json.load(open('data/research-intel/review/2026-w11-public-source-picks.json', encoding='utf-8'))
print('top', list(d.keys()))
print({k: d[k] for k in d if not isinstance(d[k], (list, dict))})
rows = d.get('picks') or d.get('decisions') or d.get('rows') or []
print('n', len(rows), 'keys', list(rows[0].keys()) if rows else None)
cp = [r for r in rows if r.get('decision') == 'conditional_pick' or r.get('status') == 'conditional_pick' or r.get('classification') == 'conditional_pick']
print('conditional', len(cp))
for r in cp:
    print(json.dumps({k: r.get(k) for k in ('game', 'matchup', 'player', 'market', 'side', 'selection', 'line', 'threshold', 'price', 'source', 'analyst', 'conditions', 'condition', 'support', 'label') if r.get(k) is not None}, ensure_ascii=False)[:420])
