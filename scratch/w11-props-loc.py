import re
L = open('scripts/master-intel/build.py', encoding='utf-8').read().split('\n')
for i, l in enumerate(L, 1):
    if re.search(r'\bPBP\b|section-2-box|Props Lab|props-by-position|td-menu', l):
        print(i, l.strip()[:190])
S = open('scripts/master-intel/build_site.py', encoding='utf-8').read().split('\n')
for i, l in enumerate(S, 1):
    if re.search(r"props\.html|prop_research|section-2-box|public_picks|'Props Lab'", l):
        print('site', i, l.strip()[:190])
R = open('scripts/master-intel/research_evidence.py', encoding='utf-8').read().split('\n')
for i, l in enumerate(R[505:542], 506): print('re', i, l.strip()[:200])
