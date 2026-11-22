import csv, json, glob, os
d = json.load(open('data/generated/team-dossiers/2026-w11/NYJ.json', encoding='utf-8'))
def show(o, depth=0, pre=''):
    if depth > 2: return
    if isinstance(o, dict):
        for k, v in list(o.items())[:40]:
            print('  ' * depth + f'{k}: ' + (type(v).__name__ + (f'[{len(v)}]' if isinstance(v, (list, dict)) else '') if isinstance(v, (list, dict)) else str(v)[:90]))
            if isinstance(v, dict): show(v, depth + 1)
            elif isinstance(v, list) and v and isinstance(v[0], dict) and depth < 1: show(v[0], depth + 1)
print('DOSSIER'); show(d)
F = 'data/research-intel/source-evidence/2026-11-20-ftn-stats-iq/'
for n in ['stats-iq-team-defense-efficiency.csv', 'stats-iq-team-defense-overview.csv', 'stats-iq-pass-rush-overview.csv', 'stats-iq-pass-protection-overview.csv']:
    r = list(csv.reader(open(F + n, encoding='utf-8')))
    print('\n', n, len(r) - 1, 'rows', r[0][:30]); print('  ', r[1][:30])
b = json.load(open('data/generated/props/bookmaker-live-2026-11-21-week11.json', encoding='utf-8'))
print('\nBKR keys', list(b)[:10] if isinstance(b, dict) else type(b))
rows = b.get('rows') or b.get('markets') or b.get('lines') or []
gl = [r for r in rows if str(r.get('market', '')).lower() in ('spread', 'total', 'moneyline', 'game_spread', 'game_total')][:4]
print('game-line sample', json.dumps(gl, ensure_ascii=False)[:900])
print('market values', sorted({str(r.get('market')) for r in rows})[:40])
