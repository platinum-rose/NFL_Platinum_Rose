import json, re
r = json.load(open('data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))['players']
def norm(s): return re.sub(r'\b(jr|ii|iii|iv)\b', '', re.sub(r"[.'â€™]", '', s.lower())).strip()
ks = {}
for k in r: ks.setdefault(norm(k), k)
names = ['Isaiah Likely','Justice Hill','Tetairoa McMillan','Khalil Shakir','Darius Cooper','Mason Taylor','Kenyon Sadiq','Jakobi Meyers','Courtland Sutton','J.K. Dobbins','Ashton Jeanty','Marvin Mims','Aaron Jones','Chase Brown','Samaje Perine','Stefon Diggs','Treylon Burks','Chase McLaughlin','Josh Downs','T.J. Hockenson','Pat Freiermuth','Dallas Goedert','Sam LaPorta','Breece Hall','Braelon Allen','Malik Washington','Josh Allen','Trevor Lawrence','Kirk Cousins','Joe Burrow']
for n in names:
    k = ks.get(norm(n))
    print(n, '->', k, [(x['team'], x['position'], x['status']) for x in r[k]] if k else 'NOT FOUND')

