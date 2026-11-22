import re
for f in ['scripts/master-intel/build.py', 'scripts/master-intel/market_captures.py', 'scripts/master-intel/twitter_picks.py']:
    try: s = open(f, encoding='utf-8').read()
    except OSError: continue
    paths = sorted(set(re.findall(r"""['"]((?:data|reports|scratch|public|docs)/[^'"\s]{4,})['"]""", s)))
    fpaths = sorted(set(re.findall(r"""f['"]((?:data|reports|scratch|public|docs)/[^'"\s]{4,})['"]""", s)))
    print('==', f, len(paths) + len(fpaths))
    for p in paths + fpaths: print('  ', p)
