"""Verify the Grok E10 CSV: decode X snowflake IDs vs claimed post times, and check players against ESPN rosters."""
import csv, json, re, datetime
rows = list(csv.DictReader(open('data/vault-seed/manual/grok-week11-threads/grok-twitter-picks-2026-11-21-e10.csv', encoding='utf-8')))
r = json.load(open('data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))['players']
def norm(s): return re.sub(r'\b(jr|sr|ii|iii|iv)\b', '', re.sub(r"[.'’]", '', s.lower())).strip()
ks = {}
for k in r: ks.setdefault(norm(k), k)
TEAMS = {'MIA@BUF', 'NO@CHI', 'TEN@DAL', 'TB@DET', 'ARI@KC', 'PIT@PHI', 'BAL@CAR', 'NYJ@LAC', 'LV@DEN', 'JAX@NYG', 'MIN@SF', 'CIN@WAS'}
seen = set()
for x in rows:
    tid = int(x['tweet_url'].rsplit('/', 1)[1])
    real = datetime.datetime.fromtimestamp(((tid >> 22) + 1288834974657) / 1000, datetime.timezone.utc)
    game, claimed = [s.strip() for s in x['rationale'].split('|')[:2]]
    dt = abs((real - datetime.datetime.fromisoformat(claimed.replace('Z', '+00:00'))).total_seconds())
    if x['tweet_url'] not in seen:
        seen.add(x['tweet_url'])
        print(f"ID {tid}: decoded {real.isoformat(timespec='seconds')} vs claimed {claimed} -> {'MATCH' if dt < 120 else 'MISMATCH %ds' % dt}")
    k = ks.get(norm(x['team_or_market']))
    teams = [(y['team'], y['position']) for y in r[k]] if k else None
    a, h = game.split('@')
    ok = teams and any(t[0] in (a, h, 'WSH' if 'WAS' in (a, h) else '') for t in teams)
    print(f"   {game:8} {x['team_or_market']:18} -> {k} {teams} {'OK' if ok else '** CHECK **'} {'' if game in TEAMS else '** GAME NOT ON SLATE **'}")
