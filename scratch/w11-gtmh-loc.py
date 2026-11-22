import re
for i, l in enumerate(open('scripts/master-intel/build.py', encoding='utf-8'), 1):
    if re.search(r"## \d|passing on|section-1b|'section-2'|id=\"section-|# -{4,} \d", l):
        print(i, l.strip()[:170])
