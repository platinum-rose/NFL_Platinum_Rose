"""ESPN box-score lookup helper (Claude Team 2). Usage: python box.py "Player Name" [...]"""
import json, glob, os, sys, re, unicodedata
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../..'))
BOX = os.path.join(ROOT, 'data/fantasy/boxscores')
def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"[\.'’]", "", s); s = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", s)
    return ' '.join(re.sub(r"[^a-z ]", " ", s).split())
def load_games():
    out = []
    for f in sorted(glob.glob(os.path.join(BOX, 'espn-*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        h = d.get('header', {}); comp = (h.get('competitions') or [{}])[0]
        teams = {c['homeAway']: c for c in comp.get('competitors', [])}
        a = teams.get('away', {}).get('team', {}).get('abbreviation'); hm = teams.get('home', {}).get('team', {}).get('abbreviation')
        players = {}
        for tb in d.get('boxscore', {}).get('players', []):
            ab = tb['team']['abbreviation']
            for cat in tb.get('statistics', []):
                labels = cat.get('labels') or cat.get('keys') or []
                for ath in cat.get('athletes', []):
                    nm = ath['athlete']['displayName']
                    p = players.setdefault(nm, {'team': ab})
                    p[cat['name']] = dict(zip(labels, ath.get('stats', [])))
        out.append(dict(file=os.path.basename(f), week=h.get('week'), away=a, home=hm,
                        score=(teams.get('away', {}).get('score'), teams.get('home', {}).get('score')),
                        status=comp.get('status', {}).get('type', {}).get('completed'),
                        players=players, scoring=[s['text'] for s in d.get('scoringPlays', [])]))
    return out
def find(games, name):
    n = norm(name); res = []
    for g in games:
        for pn, p in g['players'].items():
            if norm(pn) == n or (norm(pn).split()[-1:] == n.split()[-1:] and norm(pn)[:1] == n[:1]):
                res.append((g, pn, p))
    return res
if __name__ == '__main__':
    G = load_games()
    for nm in sys.argv[1:]:
        for g, pn, p in find(G, nm):
            tds = [s for s in g['scoring'] if norm(pn).split()[-1] in norm(s)]
            print(f"W{g['week']} {g['away']}@{g['home']} {g['score']} | {pn} ({p['team']}) | " + ' ; '.join(f"{k}:{v}" for k, v in p.items() if k != 'team'))
            for s in tds: print('    TD/score:', s)
