import glob, json, os, re
# 1. What analytics exist (FTN capture, team-weeks, packets)
ftn = 'data/research-intel/source-evidence/2026-11-20-ftn-stats-iq'
print('FTN capture files:', sorted(os.listdir(ftn))[:30] if os.path.isdir(ftn) else 'missing')
tw = 'data/archive/2026/season/team-weeks.csv'
if os.path.exists(tw):
    hdr = open(tw, encoding='utf-8').readline().strip().split(',')
    print('team-weeks columns', len(hdr), hdr[:60])
# 2. What a game packet carries
pk = sorted(glob.glob('data/research-intel/proposed/games-w11/*NYJ_at_LAC-sides.json'))
if pk:
    d = json.load(open(pk[0], encoding='utf-8'))
    def keys(o, pre='', depth=0):
        if depth > 2: return
        if isinstance(o, dict):
            for k, v in o.items():
                print('  ' * depth + f'{pre}{k}: {type(v).__name__}' + (f'[{len(v)}]' if isinstance(v, (list, dict)) else f' = {str(v)[:80]}'))
                if isinstance(v, dict): keys(v, '', depth + 1)
                elif isinstance(v, list) and v and isinstance(v[0], dict): keys(v[0], '', depth + 1)
    print('PACKET', pk[0]); keys(d)
# 3. How analytics show up in the Friday sides file (quantitative mentions)
f = 'reports/intel/games/2026-w11-game-NYJ_at_LAC-sides.md'
t = open(f, encoding='utf-8').read()
print('\nSIDES FILE headings:', re.findall(r'^#+ .*', t, re.M)[:25])
for m in re.finditer(r'[^.\n]*(EPA|success rate|DVOA|pressure|explosive|yards per|PROE|pass rate|red zone|SRS)[^.\n]*\.', t):
    print('  ·', m.group(0).strip()[:220])
