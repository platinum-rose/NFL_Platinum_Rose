import json, shutil
p = 'data/intel/extracted/2026-w11-chrome-article-picks.json'
shutil.copy(p, p + '.bak-claude-20261121-sat-sel')
d = json.load(open(p, encoding='utf-8'))
n = 0
for r in d['picks']:
    if not r.get('selection'):
        who = r.get('player') or r.get('team') or ''
        mk = str(r.get('market') or '').replace('_', ' ')
        r['selection'] = ' '.join(x for x in (who, mk, str(r.get('side') or '').title()) if x)
        n += 1
    if r.get('caveat') and r['caveat'] not in (r.get('rationale') or ''):
        r['rationale'] = f"{r['caveat']}. {r.get('rationale') or ''}".strip()
    r.setdefault('url', r.get('episode'))
    r.setdefault('outlet', 'X @CodyBrownBets' if r.get('speaker') == 'Cody Brown' else r.get('speaker'))
json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
print('selection added', n)
