import re, html
D = 'dist/nfl_week11_master_packet/'
s = open(D + 'nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read()
print('conf badges', re.findall(r'gg-conf">([\d.]+)%', s))
t = re.sub(r'<[^>]+>', ' ', html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)))
print('Margin sim', t.count('Margin sim'), 'None/NaN', len(re.findall(r'\bNone\b|\bundefined\b|\bNaN\b', t)), 'banner', t.count('Saturday provisional:'), 'IND final', 'IND 3, HOU 26' in t)
c = open(D + 'nfl_week11_supercontest_intelligence_summary.html', encoding='utf-8').read()
ct = re.sub(r'<[^>]+>', ' ', html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>', '', c, flags=re.S)))
for m in re.finditer(r'\bNone\b|\bundefined\b|\bNaN\b', ct): print('   ', re.sub(r'\s+', ' ', ct[m.start() - 70:m.end() + 20]))
print('SC margin sim', ct.count('margin sim'), 'None/NaN', len(re.findall(r'\bNone\b|\bundefined\b|\bNaN\b', ct)))
