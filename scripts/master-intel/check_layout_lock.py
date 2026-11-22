#!/usr/bin/env python3
"""Master Intel layout lock (Andy, Sun 11/22/2026 12:42 AM PT): the Week 11 layout is the standard from Week 12 on.
Run after build_site.py, before sending:  python scripts/master-intel/check_layout_lock.py --week 12
Exit 1 if the built site drifts from the locked layout. Spec: docs/specs/MASTER_INTEL_LAYOUT_LOCK.md"""
import argparse, glob, os, re, sys
from bs4 import BeautifulSoup as B
a = argparse.ArgumentParser(); a.add_argument('--week', type=int, required=True); a = a.parse_args()
D = f'dist/nfl_week{a.week}_master_packet/'; S = D + 'site/'
fails, notes = [], []
NFULL = 0
def need(ok, msg): (None if ok else fails.append(msg))
pages = {os.path.basename(f): B(open(f, encoding='utf-8').read(), 'html.parser') for f in glob.glob(S + '*.html')}
need(bool(pages), f'no site pages in {S}')
if not pages: print('\n'.join('FAIL ' + f for f in fails)); sys.exit(1)
# 1 links: every internal link resolves (Props Lab game links, SuperContest footnotes, etc.)
ids = {p: {t.get('id') for t in s.find_all(id=True)} for p, s in pages.items()}
broken = set()
for p, s in pages.items():
    for x in s.find_all('a', href=True):
        h = x['href']
        if h.startswith(('http', 'mailto', 'data:')) or h == '#': continue
        m = re.match(r'^([\w.-]+\.html)?(?:#(.+))?$', h)
        if not m: continue
        tp, fr = m.group(1) or p, m.group(2)
        if tp not in pages or (fr and fr not in ids[tp]): broken.add(f'{p} -> {h}')
need(not broken, f'{len(broken)} broken links, e.g. ' + '; '.join(sorted(broken)[:5]))
# 2 Props Lab: one page title; filterable board first; per-category sort/filter bars; no card grid
pr = pages.get('props.html')
need(pr is not None, 'props.html missing')
if pr:
    h2 = pr.find_all('h2'); need(len(h2) == 1, f'Props Lab has {len(h2)} h2 headers (locked: 1)')
    pool = pr.find(id='prop-pool'); kids = [c.get('id') for c in pool.find_all(recursive=False)] if pool else []
    need(kids[:1] == ['props-lab-legs'], f'Props Lab must open on the board (props-lab-legs); order is {kids}')
    need('research-props' not in kids or kids.index('research-props') == len(kids) - 1, 'research reference table must come last in Props Lab')
    need(pr.find(id='props-gtmh') is None and not pr.select('.g3-card'), 'staggered Gun to my head card grid is back in Props Lab (locked: rows in the board)')
    lf = pr.find(id='legs-filter'); need(lf is not None, 'board filter bar (#legs-filter) missing')
    for i in ('lf-gtmh', 'lf-strong', 'lf-q', 'lf-card'): need(pr.find(id=i) is not None, f'board filter #{i} missing')
    need(len(pr.select('#legs-filter .lf-kind')) >= 8, 'category chips missing (All + 7 categories)')
    cats = pr.select('.prop-category-group'); full = [c for c in cats if c.select('.prop-card')]
    need(len(cats) == 7, f'{len(cats)} prop categories (locked: 7, empty ones stay visible)')
    for c in full:
        for k in ('cat-tools', 'ct-sort', 'ct-mkt', 'ct-side', 'ct-tier'):
            need(c.select_one('.' + k) is not None, f'{c.get("id")}: per-category sort/filter bar missing .{k}')
    NFULL = len(full)
    rows = pr.select('.prop-card'); need(len(rows) > 0, 'Props Lab board has 0 rows')
    gt_rows = [r for r in rows if r.get('data-gtmh')]
    need(all('no-bm' in r['class'] or r.get('data-card') == '1' or r.select('.leg-src li') for r in gt_rows), 'GTMH rows lost their isolation')
    for g in {r.get('data-game') for r in rows}:
        need(f'props-{g.lower().replace("@", "-")}' in ids['props.html'], f'#props-{g} anchor missing (game pages link to it)')
# 3 tickets: parlays and prop stacks on the Picks page and in Props Lab
ix = pages.get('index.html')
if ix:
    for i, lab in (('rec-parlays', 'parlays'), ('rec-props', 'prop stacks')):
        d = ix.find(id=i); n = re.search(r'(\d+) tickets', d.find('summary').get_text() if d else '')
        need(bool(n) and int(n.group(1)) > 0, f'Picks page has no {lab} (card tickets section empty: build reports/bets/<season>-w<NN>-card.md)')
# 4 single file: site header is the only nav (legacy tab bar suppressed)
one = glob.glob(D + f'Platinum_Rose_NFL_Week{a.week}_Intel.html')
need(bool(one), 'single-file report missing')
if one:
    t = open(one[0], encoding='utf-8').read()
    need('window.__mtInit = true' in t, 'single file would build the duplicate "Master Intel" tab bar (build_single.py guard missing)')
    need(t.count('class="cat-tools') >= NFULL, 'single file lacks the per-category sort/filter bars')
for f in fails: print('FAIL ', f)
print(f'Layout lock (Week {a.week}): ' + ('PASS' if not fails else f'FAIL ({len(fails)})'))
sys.exit(1 if fails else 0)
