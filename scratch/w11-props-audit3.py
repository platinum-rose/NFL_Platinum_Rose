import csv, json, collections
r = list(csv.DictReader(open('data/archive/2026/season/player-games.csv', encoding='utf-8')))
print('weeks', sorted({int(x['week']) for x in r}))
d = json.load(open('data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json', encoding='utf-8'))
print('DKP markets', collections.Counter(x.get('market') for x in d['rows']).most_common(40))
for m in ('tackles_assists', 'sacks', 'interceptions', 'solo_tackles', 'kicking_points', 'fg_made'):
    ex = [x for x in d['rows'] if x.get('market') == m][:1]
    if ex: print(m, json.dumps(ex[0], ensure_ascii=False)[:500])
ro = json.load(open('data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))
print('\nrosters', type(ro).__name__, list(ro)[:8] if isinstance(ro, dict) else len(ro))
t = ro.get('teams') if isinstance(ro, dict) else None
if isinstance(t, dict): k = next(iter(t)); print(k, json.dumps(t[k], ensure_ascii=False)[:500])
elif isinstance(t, list): print(json.dumps(t[0], ensure_ascii=False)[:500])
a = json.load(open('data/player-availability/latest.json', encoding='utf-8'))
ev = a.get('events', []); print('\navailability events', len(ev), json.dumps(ev[0], ensure_ascii=False)[:500] if ev else '')
print(collections.Counter(e.get('status') for e in ev).most_common(10))
