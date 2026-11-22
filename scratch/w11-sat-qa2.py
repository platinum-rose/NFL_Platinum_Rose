import re, html
D = 'dist/nfl_week11_master_packet/'
s = open(D + 'nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read()
body = re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)
t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(body)))
print('panels', body.count('class="gs-model"'), '| None/NaN', len(re.findall(r'\bNone\b|\bundefined\b|\bNaN\b', t)), '| banner', t.count('Saturday provisional:'), '| IND final', 'IND 3, HOU 26' in t)
i = t.find('Model, sim & conditions', t.find('NYJ@LAC') if 'NYJ@LAC' in t else 0)
for g in ['NYJ', 'TB', 'ARI', 'MIN']:
    j = [m.start() for m in re.finditer('Model, sim & conditions', t)]
for j in [m.start() for m in re.finditer('Model, sim & conditions', t)][:12]:
    seg = t[j:j + 900]
    if any(x in seg for x in ('NYJ +3 (-103)', 'CAVEAT TB', 'CAVEAT ARI', 'Mexico')): print('---', seg[:900])
for n in ['Doug Kezirian', 'Kendra Middleton', 'Rich Hribar', 'Andrew Erickson', 'Dan Freddy', 'Skooshi', 'SGPN on-air recap', 'Jeff', 'Chris Welsh']:
    print(f'{n:18} mentions {t.count(n):3}  registry anchor {len(re.findall("id=\"exp-" + re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-") + "\"", s))}')
