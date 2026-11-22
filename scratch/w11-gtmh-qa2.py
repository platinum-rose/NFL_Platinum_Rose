from bs4 import BeautifulSoup as B
D = 'dist/nfl_week11_master_packet/'
s = B(open(D + 'nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read(), 'html.parser')
g = s.find(id='rec-gtmh'); p = g.parent.parent
print('summary: parent box', p.get('id'))
i = B(open(D + 'site/index.html', encoding='utf-8').read(), 'html.parser')
gi = i.find(id='rec-gtmh')
print('site index: section', bool(gi), '| cards', len(gi.select('.gtmh-card')) if gi else 0, '| radios', len(gi.select('input[name=gtmh-f]')) if gi else 0,
      '| style kept', bool(gi and gi.find('style')), '| card buttons inside', len(gi.select('.bm-btn')) if gi else 'n/a')
one = open(D + 'Platinum_Rose_NFL_Week11_Intel.html', encoding='utf-8').read()
print('single-file: gtmh cards', one.count('class="gtmh-card"'))
