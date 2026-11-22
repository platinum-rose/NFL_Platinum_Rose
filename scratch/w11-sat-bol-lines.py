import json, collections
b = json.load(open('data/generated/props/betonline-live-2026-11-21-week11.json', encoding='utf-8'))
rows = b['rows']
print('games', sorted(set(r['game'] for r in rows)))
print('summary', json.dumps(b.get('summary'))[:600])
for r in rows:
    if r['market'] == 'game_lines':
        print(r['game'], r['startTime'], '|', r['bet'], '|', r.get('side'), r.get('team'), r['line'], r['odds'], r.get('available'))
