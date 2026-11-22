from bs4 import BeautifulSoup as B
import re, html
D = 'dist/nfl_week11_master_packet/'
s = B(open(D + 'site/props.html', encoding='utf-8').read(), 'html.parser')
top = s.find(id='prop-pool')
kids = [c.get('id') or c.name for c in top.find_all(recursive=False)] if top else None
print('props.html prop-pool children order:', kids)
g = s.find(id='props-gtmh')
print('section', bool(g), '| cards', len(g.select('.g3-card')) if g else 0, '| picks', len(g.select('.g3-pick')) if g else 0, '| logos', len(g.select('.g3-team .tl')) if g else 0,
      '| bm-btn', len(g.select('.bm-btn')) if g else 'n/a', '| style ok', bool(g and g.find('style') and not g.find('style').find('p')))
r = s.find(id='research-props'); print('research heading:', r.find('h3').get_text() if r else None)
t = re.sub(r'\s+', ' ', g.get_text(' ')) if g else ''
print('None/NaN in section:', len(re.findall(r'\bNone\b|\bNaN\b|undefined', t)))
c = g.select('.g3-card')[1]; print('--- card 2:', re.sub(r'\s+', ' ', c.get_text(' '))[:900])
m = B(open(D + 'nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read(), 'html.parser')
print('summary has section:', bool(m.find(id='props-gtmh')), '| single-file cards:', open(D + 'Platinum_Rose_NFL_Week11_Intel.html', encoding='utf-8').read().count('id="gtmh-props-'))
