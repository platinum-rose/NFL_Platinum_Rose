#!/usr/bin/env python3
"""Evan Abrams' Action Network NFL Betting Primer, read from the public JSON feeds its page loads.

The article at actionnetwork.com/nfl/nfl-betting-primer-trends-stats-systems-for-every-game is an embedded app
(https://nfl-primer.pages.dev) since 2026, so the article text is only an intro. The app pulls its content from
primer-feed.evanhabrams.workers.dev; this script saves those feeds into the week's article archive and writes
normalized rows for the Master Intel build: trends/notes per game, Bet Labs systems that fire on a game, the slate
notes, and per-game QB / head coach / referee / public splits.
usage: python3 scripts/intel/primer_feed.py --week 4 [--season 2026] [--no-fetch]
"""
import argparse, json, os, subprocess, datetime
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--season', type=int, default=2026)
ap.add_argument('--no-fetch', action='store_true'); a = ap.parse_args()
WW = f'{a.week:02d}'
D = f'data/intel/articles/{a.season}-w{WW}/action-network/primer-feed'; os.makedirs(D, exist_ok=True)
BASE = 'https://primer-feed.evanhabrams.workers.dev'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36'
FEEDS = {'nfl-primer.json': '/feed/nfl-primer', f'nfl-primer-notes_w{a.week}.json': f'/feed/nfl-primer-notes/w{a.week}', 'nfl-primer-extra.json': '/feed/nfl-primer-extra', 'meta.json': '/meta/nfl-primer'}
if not a.no_fetch:
    for f, p in FEEDS.items():
        subprocess.run(['curl', '-sS', '-m', '40', '-A', UA, '-H', 'Origin: https://nfl-primer.pages.dev', '-o', f'{D}/{f}', BASE + p], check=False)
J = lambda f: json.load(open(f'{D}/{f}', encoding='utf-8'))
meta, main, notes, extra = J('meta.json'), J('nfl-primer.json'), J(f'nfl-primer-notes_w{a.week}.json'), J('nfl-primer-extra.json')
FIX = {'LA': 'LAR', 'JAC': 'JAX', 'WSH': 'WAS', 'LVR': 'LV'}
fx = lambda t: FIX.get(t, t)
def gid(s): a_, h_ = s.split('@'); return f'{fx(a_)}@{fx(h_)}'
FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
URL = 'https://www.actionnetwork.com/nfl/nfl-betting-primer-trends-stats-systems-for-every-game'
rows = []
for n in notes['notes']:
    g = 'SLATE' if n['game'] == 'SLATE' else gid(n['game'])
    rows.append(dict(kind='trend', game=g, team=fx(n['team']) if n.get('team') else None, category=n.get('category'), market=n.get('market') or '',
                     text=n['text'], top=bool(n.get('top')), person='Evan Abrams', outlet='Action Network', url=URL, published=notes.get('published'), id=n['id']))
wk_dates = set()
for g in main['games']:
    d = g.get('kickoffEt', '')[:10]
    if d: wk_dates.add(datetime.date.fromisoformat(d).strftime('%-m/%-d/%y'))
for s in extra.get('systems', []):
    for p in s.get('plays') or []:
        if p['date'] not in wk_dates: continue
        A, H = FULL.get(p['away']), FULL.get(p['home'])
        if not A or not H: continue
        play = p['play'].replace('Play on ', '')
        side = 'Under' if play == 'Under' else 'Over' if play == 'Over' else FULL.get(play, play)
        rows.append(dict(kind='system', game=f'{A}@{H}', side=side, group=s['group'], label=s['label'].replace('$$$:', '').replace('$$$', '').strip(),
                         record=s['record'], units=s.get('money'), line=p.get('line'), person='Evan Abrams', outlet='Action Network (Bet Labs)', url=URL,
                         published=meta.get('published')))
games = {}
for k, v in (extra.get('qb') or {}).items():
    aw, hm, wk = k.split('|')
    if int(wk) != a.week: continue
    games[f'{FULL[aw]}@{FULL[hm]}'] = dict(away_qb=v.get('aQB'), home_qb=v.get('hQB'), away_qb_backup=v.get('aBk'), home_qb_backup=v.get('hBk'),
                                            away_coach=v.get('aCoach'), home_coach=v.get('hCoach'), referee=v.get('ref'), note=v.get('note'))
for g in main['games']:
    k = f"{fx(g['a'])}@{fx(g['h'])}"
    games.setdefault(k, {}).update(dict(public=g.get('pub'), total_open=g.get('totalOpen'), fav=fx(g.get('fav') or ''), spread=g.get('spread'), total=g.get('total'),
                                        final=g.get('final'), roof=(g.get('venue') or {}).get('roof')))
out = dict(schema='primer_intel_v1', season=a.season, week=a.week, source=URL, feed_published=meta.get('published'), notes_published=notes.get('published'),
           counts=dict(trends=sum(r['kind'] == 'trend' for r in rows), systems=sum(r['kind'] == 'system' for r in rows)), games=games, rows=rows)
os.makedirs('data/intel/extracted', exist_ok=True)
json.dump(out, open(f'data/intel/extracted/{a.season}-w{WW}-primer-intel.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(out['counts'], 'games', len(games))
