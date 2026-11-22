from bs4 import BeautifulSoup as B
import re
D = 'dist/nfl_week11_master_packet/'
for name in ('nfl_week11_master_betting_intelligence_summary.html', 'site/index.html'):
    s = B(open(D + name, encoding='utf-8').read(), 'html.parser')
    box = s.find(id='section-rec-box')
    order = [d.get('id') for d in box.find_all('details') if d.get('id') in ('rec-straight', 'rec-gtmh', 'rec-leans', 'rec-parlays', 'rec-props', 'rec-supercontest', 'rec-passes')]
    g = s.find(id='rec-gtmh')
    tabs = g.select('table.gtmh-quick-t')
    rows = [len(t.find_all('tr')) - 1 for t in tabs]
    links = [a['href'] for a in g.select('.gtmh-quick a')]
    missing = [h for h in links if not g.find(id=h[1:])]
    print(name, '| order:', order, '| quick tables rows:', rows, '| broken links:', missing, '| bm-btn:', len(g.select('.bm-btn')), '| <p> inside style:', bool(g.find('style') and g.find('style').find('p')))
    if name.startswith('site'):
        t0 = tabs[0]; print('  sides header:', [th.get_text() for th in t0.find_all('th')])
        for tr in t0.find_all('tr')[1:4]: print('  ', ' | '.join(td.get_text(' ', strip=True) for td in tr.find_all('td')))
        for tr in tabs[1].find_all('tr')[1:3]: print('  ', ' | '.join(td.get_text(' ', strip=True) for td in tr.find_all('td')))
