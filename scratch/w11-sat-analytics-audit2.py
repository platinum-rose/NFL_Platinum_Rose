import glob, json, re
d = json.load(open('data/research-intel/proposed/games-w11/2026-w11-game-NYJ_at_LAC-sides.json', encoding='utf-8'))
print('ADJUSTMENTS', json.dumps(d['adjustments'], ensure_ascii=False)[:700])
for r in d['sim_runs']: print('SIM', json.dumps(r, ensure_ascii=False)[:400])
print('REC reasons', json.dumps(d['recommendations'][0]['reasons'], ensure_ascii=False)[:600])
print('SOURCES', [s['path'] for s in d['sources']])
t = open('reports/intel/games/2026-w11-game-NYJ_at_LAC-sides.md', encoding='utf-8').read()
m = re.search(r'## Analytics and market baseline\n(.*?)\n## ', t, re.S); print('\nANALYTICS SECTION:\n', m.group(1)[:1800] if m else 'n/a')
m = re.search(r'## Game script\n(.*?)\n## ', t, re.S); print('\nGAME SCRIPT:\n', m.group(1)[:900] if m else 'n/a')
# Across all 12 sides packets: any non-null analytics adjustment? model_prob values
for f in sorted(glob.glob('data/research-intel/proposed/games-w11/*-sides.json')):
    p = json.load(open(f, encoding='utf-8'))
    r = (p.get('recommendations') or [{}])[0]
    print(f"{p['game']:9} adj={p['adjustments'].get('margin_adj')}/{p['adjustments'].get('total_adj')} sel={r.get('selection')} tier={r.get('tier')} raw={r.get('model_prob_raw')} shrunk={r.get('model_prob')}")
# FTN synthesis context: what metrics
c = json.load(open('data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json', encoding='utf-8'))
print('\nFTN CONTEXT keys', list(c)[:12])
tm = c.get('teams') or c.get('team_context') or {}
if isinstance(tm, dict) and tm: k = next(iter(tm)); print(k, json.dumps(tm[k], ensure_ascii=False)[:900])
elif isinstance(tm, list) and tm: print(json.dumps(tm[0], ensure_ascii=False)[:900])
