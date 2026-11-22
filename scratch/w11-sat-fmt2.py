import json
d = json.load(open('data/generated/team-dossiers/2026-w11/NYJ.json', encoding='utf-8'))
for k, v in d['ftn']['team_tables'].items(): print(k, json.dumps(v, ensure_ascii=False)[:420])
b = json.load(open('data/generated/props/bookmaker-live-2026-11-21-week11.json', encoding='utf-8'))
gl = [r for r in b['rows'] if r.get('market') == 'game_lines']
print(len(gl)); [print(json.dumps(r, ensure_ascii=False)[:420]) for r in gl[:3]]
print(json.dumps(b['games'][0], ensure_ascii=False)[:600] if b.get('games') else '')
