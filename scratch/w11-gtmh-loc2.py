import re
L = open('scripts/master-intel/build.py', encoding='utf-8').read().split('\n')
for i, l in enumerate(L, 1):
    if re.search(r"'rec-(straight|leans|parlays|props|supercontest|passes)'|rec-gtmh|gtmh_section|Platinum Rose Recommendations", l):
        print(i, l.strip()[:200])
