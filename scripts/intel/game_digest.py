#!/usr/bin/env python3
"""Split every archived betting article for a week into per-game sections and write one digest per game
(local, gitignored) for the intel-extraction read. Usage: python3 scripts/intel/game_digest.py --week 4"""
import argparse, json, os, re, collections, html
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--season', type=int, default=2026)
ap.add_argument('--max-section', type=int, default=2600); a = ap.parse_args()
D = f'data/intel/articles/{a.season}-w{a.week:02d}'
idx = json.load(open(f'{D}/index.json'))
sched = [g for g in json.load(open('public/schedule.json')) if g['season'] == a.season and g['week'] == a.week and g.get('season_type') == 2]
fx = lambda t: {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}.get(t, t)
NAMES = {'ARI':['cardinals','arizona'],'ATL':['falcons','atlanta'],'BAL':['ravens','baltimore'],'BUF':['bills','buffalo'],'CAR':['panthers','carolina'],'CHI':['bears','chicago'],'CIN':['bengals','cincinnati'],'CLE':['browns','cleveland'],'DAL':['cowboys','dallas'],'DEN':['broncos','denver'],'DET':['lions','detroit'],'GB':['packers','green bay'],'HOU':['texans','houston'],'IND':['colts','indianapolis'],'JAX':['jaguars','jags','jacksonville'],'KC':['chiefs','kansas city'],'LV':['raiders','las vegas'],'LAC':['chargers'],'LAR':['rams'],'MIA':['dolphins','miami'],'MIN':['vikings','minnesota'],'NE':['patriots','new england'],'NO':['saints','new orleans'],'NYG':['giants'],'NYJ':['jets'],'PHI':['eagles','philadelphia'],'PIT':['steelers','pittsburgh'],'SF':['49ers','niners','san francisco'],'SEA':['seahawks','seattle'],'TB':['buccaneers','bucs','tampa bay'],'TEN':['titans','tennessee'],'WAS':['commanders','washington']}
def teams(t):
    t = ' ' + t.lower() + ' '
    return {ab for ab, ns in NAMES.items() if any(re.search(r'\b' + re.escape(n) + r'\b', t) for n in ns)}
GAMES = {}
for g in sched:
    A, H = fx(g['visitor']), fx(g['home']); GAMES[f'{A}@{H}'] = {A, H}
def game_of(ts):
    hit = [gid for gid, s in GAMES.items() if s <= ts]
    return hit
BET = ('Action Network', 'BettingPros', 'VSiN', 'Sharp Football', 'PFF', 'Walter Football', 'Pro Football Talk')
SKIP = re.compile(r'week 3|steelers vs\.? browns|browns vs\.? steelers|eagles vs\.? bears|bears vs\.? eagles|monday night football|thursday night football|prediction market vs|week 5|dynasty|draft|recap|grades are live|team of the week|special teams report|waiver', re.I)
out = collections.defaultdict(list)
for r in idx.values():
    if r['source'] not in BET or not r.get('file') or SKIP.search(r['title'] or ''): continue
    if r.get('class') in ('prior_week_recap', 'out_of_window'): continue   # tagged by scripts/intel/classify_week_articles.py
    if r['source'] == 'Pro Football Talk' and not re.search(r'pick|power rank', r['title'] or '', re.I): continue
    txt = open(r['file'], encoding='utf-8').read().split('\n---\n', 1)[-1]
    txt = html.unescape(re.sub(r'!\[[^\]]*\]\([^)]*\)', '', txt))
    txt = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', txt)
    tt = teams(r['title'] or '')
    whole = game_of(tt)
    # sections by markdown headings
    # cut site footers / related-link blocks
    txt = re.split(r'\n\s*(?:\*\*)?(?:Read More PFF|Latest Betting Headlines|Share\[|Related Articles|More NFL Betting|Betting Featured Tools)', txt)[0]
    parts = re.split(r'\n(?=#{1,4} )', txt)
    assigned = False
    cur = None; acc = collections.defaultdict(list)
    for p in parts:
        head = p.split('\n', 1)[0]
        gs = game_of(teams(head))
        if not gs and not head.startswith('#'):
            gs = game_of(teams(p[:300]))[:1]
        if len(gs) == 1: cur = gs[0]
        elif gs: cur = None
        elif head.startswith('#') and teams(head) and not gs and not (cur and teams(head) <= GAMES[cur]): cur = None   # a heading about some other team ends the game block
        if cur: acc[cur].append(p.strip())
    for g, ps in acc.items():
        body = '\n\n'.join(ps)
        out[g].append((r, ps[0].split('\n', 1)[0].strip('# ').strip(), body[:a.max_section * 2])); assigned = True
    if not assigned and len(whole) == 1:
        out[whole[0]].append((r, '(whole article)', txt[:a.max_section * 3]))
os.makedirs(f'{D}/_digests', exist_ok=True)
for g, items in sorted(out.items()):
    L = [f'# {g} — article sections ({len(items)})', '']
    for r, head, body in items:
        L += [f"## {r['source']} · {r.get('author') or '?'} · {(r.get('published') or '')[:10]} · {r['title']}", f"<{r['url']}>", f"### {head}", body, '']
    open(f'{D}/_digests/{g}.md', 'w', encoding='utf-8').write('\n'.join(L))
    print(g, len(items), sum(len(b) for _, _, b in items))
# compact lines: explicit picks, best bets, parlay legs, system plays and trend bullets, per game
PICK = re.compile(r"(pick\s*:|best bet|erickson.s pick|leg \d|play on|prediction:|\bbet\s*:|lean\s*:|i.ll take|i like|give me|\bthe pick\b|our pick|projection|survivor pick|my pick)", re.I)
TREND = re.compile(r"(\d+-\d+(?:-\d+)? (?:ats|su|o/u|straight up|to the over|to the under)|since 20\d\d|since 19\d\d|\d+(?:\.\d)?% |ats in|cover(?:ed)? in \d|last \d+ (?:games|home|road))", re.I)
for g, items in sorted(out.items()):
    L = [f'# {g} — picks and trends (compact)', '']
    for r, head, body in items:
        hits = []
        for ln in body.split('\n'):
            t = ln.strip().strip('*').strip()
            if len(t) < 12: continue
            if PICK.search(t) or (TREND.search(t) and len(t) < 400): hits.append(t[:420])
        if hits:
            L += [f"## {r['source']} · {r.get('author') or '?'} · {(r.get('published') or '')[:10]} · {r['title'][:80]}", f"<{r['url']}>"] + [f'- {h}' for h in dict.fromkeys(hits)] + ['']
    open(f'{D}/_digests/{g}.compact.md', 'w', encoding='utf-8').write('\n'.join(L))
