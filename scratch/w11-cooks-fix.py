import json, shutil
p = 'data/secondary-matchups/manual/receiver-roles-2026.json'
shutil.copy(p, p + '.bak-claude-20261121-sat-cooks')
d = json.load(open(p, encoding='utf-8'))
removed = []
def prune(o):
    if isinstance(o, list):
        keep = []
        for x in o:
            if isinstance(x, dict) and any('Brandin Cooks' == str(v) for v in x.values()):
                removed.append(x); continue
            prune(x); keep.append(x)
        o[:] = keep
    elif isinstance(o, dict):
        for v in o.values(): prune(v)
prune(d)
print('removed', json.dumps(removed, ensure_ascii=False)[:400])
json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
