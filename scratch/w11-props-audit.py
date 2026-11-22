import json, collections, glob, os
def show(p, n=900):
    try: d = json.load(open(p, encoding='utf-8'))
    except Exception as e: print(p, 'ERR', e); return None
    print('\n==', p, type(d).__name__, (list(d)[:14] if isinstance(d, dict) else len(d)))
    return d
u = show('data/generated/player-usage-trends-2026.json')
if u:
    pl = u.get('players') or u.get('rows') or u
    if isinstance(pl, dict): k = next(iter(pl)); print(k, json.dumps(pl[k], ensure_ascii=False)[:900])
    elif isinstance(pl, list): print(len(pl), json.dumps(pl[0], ensure_ascii=False)[:900])
b = json.load(open('data/generated/props/bookmaker-live-2026-11-21-week11.json', encoding='utf-8'))
c = collections.Counter((r.get('event', '').split(' @ ')[-1][:14], r.get('market')) for r in b['rows'] if r.get('player'))
games = collections.Counter(r.get('event') for r in b['rows'] if r.get('player'))
print('\nBKR player rows by game:', games.most_common(14))
print('BKR markets:', collections.Counter(r.get('market') for r in b['rows'] if r.get('player')).most_common(12))
print('sample', json.dumps([r for r in b['rows'] if r.get('market') == 'rec_yds'][:1], ensure_ascii=False)[:600])
o = json.load(open('data/generated/props/betonline-live-2026-11-22-week11.json', encoding='utf-8'))
print('\nBOL player rows by game:', collections.Counter(r.get('event') for r in o['rows'] if r.get('player')).most_common(14))
print('sample', json.dumps([r for r in o['rows'] if r.get('market') == 'rec_yds'][:1], ensure_ascii=False)[:600])
s = show('data/secondary-matchups/latest.json')
if s: m = s.get('matchups') or []; print(len(m), json.dumps(m[0], ensure_ascii=False)[:700] if m else '')
f = sorted(glob.glob('data/research-intel/source-evidence/2026-11-20-ftn-stats-iq/stats-iq-receiving-usage.csv'))
if f: print('\nFTN receiving usage header:', open(f[0], encoding='utf-8').readline().strip()[:300])
gl = sorted(glob.glob('data/archive/2026/season/*player*'))[:5]; print('\nplayer archives:', gl)
