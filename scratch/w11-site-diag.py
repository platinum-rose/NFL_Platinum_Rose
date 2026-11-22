import glob, os, re, collections
from bs4 import BeautifulSoup as B
D = 'dist/nfl_week11_master_packet/site/'
pages = {os.path.basename(f): B(open(f, encoding='utf-8').read(), 'html.parser') for f in glob.glob(D + '*.html')}
ids = {p: {t.get('id') for t in s.find_all(id=True)} for p, s in pages.items()}
broken = collections.Counter()
for p, s in pages.items():
    for a in s.find_all('a', href=True):
        h = a['href']
        if h.startswith(('http', 'mailto', 'data:')) or h == '#': continue
        m = re.match(r'^([\w.-]+\.html)?(?:#(.+))?$', h)
        if not m: continue
        tp, frag = m.group(1) or p, m.group(2)
        if tp not in pages: broken[(p, h, 'missing page')] += 1
        elif frag and frag not in ids[tp]: broken[(p, h, 'missing anchor')] += 1
print('BROKEN LINKS'); [print(' ', k, v) for k, v in sorted(broken.items())[:40]]
s = pages.get('props.html')
print('\nprops.html headings:', [(h.name, h.get_text(' ', strip=True)[:90]) for h in s.find_all(['h1', 'h2', 'h3'])][:12])
print('props.html summaries (top level):', [d.find('summary').get_text(' ', strip=True)[:80] for d in s.select('details') if d.find('summary') and not d.find_parent('details')][:8])
one = B(open('dist/nfl_week11_master_packet/Platinum_Rose_NFL_Week11_Intel.html', encoding='utf-8').read(), 'html.parser')
print('\nsingle-file h1/h2 per page sample:', [(h.name, h.get_text(' ', strip=True)[:70]) for h in one.find_all(['h1', 'h2'])][:40])
