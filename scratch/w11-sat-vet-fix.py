import json, shutil
p = 'data/nfl-rosters/non-player-names.json'
shutil.copy(p, p + '.bak-claude-20261121-sat')
d = json.load(open(p, encoding='utf-8'))
for k, names in {'terms': ['Mayfield Questionable', 'Platinum Rose'], 'places': ['Mexico City', 'Soldier Field']}.items():
    d.setdefault(k, [])
    for n in names:
        if n not in d[k]: d[k].append(n)
json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
q = 'reports/intel/master-intel-narratives-2026-w11.md'
s = open(q, encoding='utf-8').read()
for a, b in [('BetOnline Under 48.5 is the better number.', 'The better number is 48.5 at BetOnline.'),
             ('Take Tennessee only at +8 or better', 'Tennessee is a play only at +8 or better'),
             ('flipped from the Friday Philadelphia lean', 'flipped from the Philadelphia lean on Friday'),
             ('flipped from the Friday Washington lean', 'flipped from the Washington lean on Friday')]:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(q, 'w', encoding='utf-8').write(s)
print('ok')
