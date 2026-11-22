import json, urllib.request, datetime
TEAMS = "MIA BUF NO CHI TEN DAL TB DET ARI KC PIT PHI BAL CAR NYJ LAC LV DEN JAX NYG MIN SF CIN WAS".split()
ESPN = {'WAS': 'wsh'}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20) as r:
        return json.load(r)
out = {'captured_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'source': 'ESPN site API depth charts', 'teams': {}}
for t in TEAMS:
    u = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{ESPN.get(t, t.lower())}/depthcharts"
    try:
        d = get(u)
        qbs = []
        for dc in d.get('depthchart', []):
            for pk, pos in (dc.get('positions') or {}).items():
                if pk.lower() == 'qb':
                    qbs = [a.get('displayName') for a in pos.get('athletes', [])]
        out['teams'][t] = {'url': u, 'qb_depth': qbs}
        print(t, qbs[:3])
    except Exception as e:
        out['teams'][t] = {'url': u, 'error': str(e)}
        print(t, 'ERR', e)
json.dump(out, open('scratch/w11-sat-espn-qb-depth.json', 'w', encoding='utf-8'), indent=1)
