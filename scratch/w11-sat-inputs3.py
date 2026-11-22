import glob, re, html, csv, json
s = open('dist/nfl_week11_master_packet/nfl_week11_master_betting_intelligence_summary.html', encoding='utf-8').read()
t = re.sub(r'<[^>]+>', ' ', html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)))
for n in ['Kezirian', 'Hribar', 'Middleton', 'Ed Feng', 'Holka', 'Gartenberg', 'GBERGFF', 'Cody Brown', 'Erickson', 'Lock & Cash']:
    print(f'{n:12} html mentions {t.count(n)}; expert-registry anchor {len(re.findall("id=\"exp-" + re.sub(r"[^a-z0-9]+", "-", n.lower()), s))}')
for f in glob.glob('data/vault-seed/manual/grok-week11-threads/*.csv'):
    rows = list(csv.DictReader(open(f, encoding='utf-8')))
    print(f, len(rows), list(rows[0].keys())[:12] if rows else '', (rows[0] if rows else ''))
print([l for l in open('scripts/master-intel/twitter_picks.py', encoding='utf-8').read().splitlines() if 'csv' in l.lower() or 'speaker' in l][:14])
d = json.load(open('data/intel/articles/2026-w11/reviewed-podcast-picks.json', encoding='utf-8'))
print('reviewed podcast sources', [(x.get('analyst'), x.get('outlet'), len(x.get('game_picks') or x.get('picks') or [])) for x in d['sources']])
print(json.dumps(d['sources'][-1], ensure_ascii=False)[:600])
