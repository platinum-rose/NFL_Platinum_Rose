import json, collections
p = json.load(open('data/intel/articles/2026-w11/reviewed-podcast-picks.json', encoding='utf-8'))
by = collections.defaultdict(list)
keys = collections.Counter()
for s in p['sources']:
    for k in s:
        keys[k] += 1
    for lst in [k for k in s if isinstance(s[k], list)]:
        for r in s[lst]:
            g = r.get('game') or '?'
            by[g].append((lst, s.get('analyst'), s.get('outlet'), s.get('published_at'), r.get('market'), r.get('side') or r.get('player'), r.get('selection'), r.get('line'), r.get('posted_price'), r.get('timestamp_seconds'), r.get('label') or r.get('context')))
print('source keys', dict(keys))
tot = 0
for g in sorted(by):
    print('==', g, len(by[g])); tot += len(by[g])
    for r in by[g]:
        print('   ', r)
print('total', tot)
