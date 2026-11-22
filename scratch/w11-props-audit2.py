import csv, json, collections
for f in ['data/archive/2026/season/player-games.csv', 'data/archive/2026/season/fantasy-player-weeks.csv']:
    r = list(csv.DictReader(open(f, encoding='utf-8')))
    print('\n==', f, len(r), 'rows; weeks', sorted({x.get('week') for x in r})[-4:])
    print(list(r[0].keys()))
    pos = collections.Counter(x.get('position') or x.get('pos') for x in r); print('positions', pos.most_common(14))
    k = [x for x in r if (x.get('player') or x.get('player_name') or '').startswith('Cameron Dicker') or (x.get('position') in ('K',))][:1]; print('K sample', k)
    d = [x for x in r if (x.get('position') or x.get('pos')) in ('LB', 'ILB', 'OLB', 'DE', 'CB', 'S')][:1]; print('DEF sample', d)
for f, nm in [('data/generated/props/bookmaker-live-2026-11-21-week11.json', 'BKR'), ('data/generated/props/betonline-live-2026-11-22-week11.json', 'BOL')]:
    b = json.load(open(f, encoding='utf-8'))
    mk = collections.Counter(r.get('market') for r in b['rows']); print('\n', nm, dict(mk))
    for m in ('game_special', 'unknown', 'fantasy_points', 'tackles', 'sacks', 'fg', 'kicking_points', 'interceptions'):
        ex = [r for r in b['rows'] if r.get('market') == m][:2]
        if ex: print(' ', m, [ (x.get('sectionTitle') or x.get('marketTitle'), x.get('selection')) for x in ex])
    titles = collections.Counter((r.get('marketTitle') or r.get('sectionTitle') or '').split(':')[-1].strip()[:40] for r in b['rows'] if r.get('market') in ('game_special', 'unknown'))
    print('  special titles', titles.most_common(25))
