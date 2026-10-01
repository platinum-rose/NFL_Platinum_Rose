"""Fetch full current NFL rosters (active, IR/out, suspended, practice squad) from ESPN's public
team-roster API for all 32 teams -> data/nfl-rosters/espn-full-rosters-latest.json.
This is the roster ground truth for scripts/nfl-rosters/roster_vet.py (the older roster-map-latest.json
is a partial ~800-player map and can't catch a traded player). Free, read-only.
Usage: python3 scripts/nfl-rosters/fetch_espn_rosters.py
"""
import json, urllib.request, datetime, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json'
FIX = {'WSH': 'WSH', 'WAS': 'WSH'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'curl/8.5.0'}), timeout=30) as r:
        return json.load(r)
teams = get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams')['sports'][0]['leagues'][0]['teams']
players, per_team = {}, {}
for t in teams:
    tid = t['team']['id']; ab = FIX.get(t['team']['abbreviation'], t['team']['abbreviation'])
    d = get(f'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{tid}/roster')
    n = 0
    for g in d.get('athletes', []):
        for a in g.get('items', []):
            n += 1
            rec = {'team': ab, 'position': (a.get('position') or {}).get('abbreviation'), 'group': g.get('position'),
                   'status': (a.get('status') or {}).get('type') or (a.get('status') or {}).get('name'), 'espn_id': a.get('id')}
            players.setdefault(a['fullName'], []).append(rec)
    per_team[ab] = n
json.dump({'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'source': 'ESPN site.api teams/{id}/roster',
           'team_count': len(per_team), 'player_count': sum(per_team.values()), 'per_team': per_team, 'players': players},
          open(OUT, 'w', encoding='utf-8'), indent=1)
print(f'wrote {OUT.relative_to(ROOT)}: {len(per_team)} teams, {sum(per_team.values())} players')
if len(per_team) != 32 or min(per_team.values()) < 45: sys.exit('WARN: incomplete roster pull')
