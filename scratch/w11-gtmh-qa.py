import re, html, glob
D = 'dist/nfl_week11_master_packet/'
s = open(D + 'nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read()
print('section', s.count('id="rec-gtmh"'), '| cards', s.count('class="gtmh-card"'), '| radios', s.count('name="gtmh-f"'), '| css', s.count('.gtmh-filter input'),
      '| escaped-tags', s.count('&lt;details class="gtmh-card'), '| panel lines', s.count('<b>Gun to my head</b>'))
body = re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)
t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(body)))
print('None/NaN', len(re.findall(r'\bNone\b|\bundefined\b|\bNaN\b', t)), '| banner', t.count('Saturday provisional:'), '| IND final', 'IND 3, HOU 26' in t)
i = t.find('Gun to my head: a side and a total call'); print(t[i:i + 700])
j = t.find('TEN @ DAL ·', i); print('---', t[j:j + 1300])
for f in glob.glob(D + 'site/*.html'):
    x = open(f, encoding='utf-8').read()
    if 'rec-gtmh' in x: print('site page with section:', f.split('site')[-1], '| bm buttons in gtmh:', len(re.findall(r'gtmh-card[^>]*>(?:(?!</details>).)*bm-btn', x, re.S)))
