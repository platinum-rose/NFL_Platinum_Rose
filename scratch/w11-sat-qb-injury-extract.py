import json, collections, sys
TEAMS = "MIA BUF NO CHI TEN DAL TB DET ARI KC PIT PHI BAL CAR NYJ LAC LV DEN JAX NYG MIN SF CIN WAS".split()
st = json.load(open('data/projected-starters/2026/latest.json', encoding='utf-8'))
av = json.load(open('data/player-availability/latest.json', encoding='utf-8'))
print('QB1 by projected starters:')
for t in TEAMS:
    q = [p for p in st['players'] if p['team'] == t and p['position'] == 'QB' and p.get('role') == 'starter']
    print(' ', t, [(p['player_name'], p.get('starter_confidence'), p.get('source_file')) for p in q])
ev = av['events']
print('event keys', list(ev[0].keys()))
best = {}
for e in ev:
    if e.get('source') != 'ESPN injuries API': continue
    t = e.get('primary_team') or e.get('team_abbr')
    if t not in TEAMS: continue
    key = (t, e['player_name'])
    if key not in best or (e.get('published_at') or '') > (best[key].get('published_at') or ''):
        best[key] = e
status_field = 'status_raw'
print('status field', status_field)
out = collections.defaultdict(list)
for (t, n), e in best.items():
    s = str(e.get(status_field) or e.get('availability_status') or '')
    if any(x in s.lower() for x in ('out', 'doubt', 'quest', 'ir', 'reserve')):
        out[t].append(f"{n} {e.get('position')} {s} ({(e.get('published_at') or '')[:16]})")
for t in TEAMS:
    print(t, '|', '; '.join(sorted(out[t])))
q=json.load(open('scratch/w11-game-synthesis-queue-sides.json',encoding='utf-8'));q=q.get('packets',q)
for x in q: print('QBNOTE',x['matchup'],json.dumps(x.get('qb_operator_notes'))[:400])
