#!/usr/bin/env python3
"""Grade a week's podcast-extracted picks against cached ESPN box scores (read-only on inputs).

Usage: python scripts/master-intel/grade_podcast_picks.py --week 8
Inputs : data/podcasts/youtube-extracted-picks-2026-wNN.json
         data/archive/2026/week-NN/betting/wNgamesum.json (event ids / finals)
         data/fantasy/boxscores/espn-<event>.json (full ESPN summaries)
Outputs: reports/intel/wNN-podcast-pick-grades.json + .md
Rules  : grade at the line/price as stated; units at -110 when no price stated;
         player absent from the final box score = LOST (house rule);
         anytime TD = rushing + receiving + return + defensive TDs (passing TDs don't count).
"""
import argparse, glob, json, os, re, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ALIAS = {'WAS': 'WSH', 'JAC': 'JAX', 'LA': 'LAR'}

def T(t): return ALIAS.get(t, t) if t else t
def norm(n):
    n = re.sub(r"[.'’\-]", '', (n or '').lower())
    n = re.sub(r'\b(jr|sr|ii|iii|iv|v)\b', '', n)
    return ' '.join(n.split())
def units(price, result):
    if result == 'P': return 0.0
    if result == 'L': return -1.0
    if result != 'W': return None
    p = price if price is not None else -110
    return round(p / 100 if p > 0 else 100 / abs(p), 3)

def load_game(ev):
    d = json.load(open(os.path.join(ROOT, 'data/fantasy/boxscores', f'espn-{ev}.json'), encoding='utf-8'))
    comp = d['header']['competitions'][0]
    score, half = {}, {}
    for c in comp['competitors']:
        ab = c['team']['abbreviation']; ls = [float(x['displayValue']) for x in c.get('linescores', [])]
        score[ab] = float(c['score']); half[ab] = sum(ls[:2])
    players = {}
    for t in d['boxscore']['players']:
        ab = t['team']['abbreviation']
        for s in t['statistics']:
            for a in s['athletes']:
                nm = norm(a['athlete']['displayName'])
                p = players.setdefault(nm, {'team': ab, 'name': a['athlete']['displayName']})
                for k, v in zip(s['keys'], a['stats']):
                    p[f"{s['name']}.{k}"] = v
    tds = [sp for sp in d.get('scoringPlays', []) if 'touchdown' in (sp.get('scoringType', {}).get('name', '') or '').lower()]
    return {'score': score, 'half': half, 'players': players, 'tds': tds}

def num(p, key):
    v = p.get(key)
    if v in (None, '', '-', '--'): return 0.0
    try: return float(str(v).split('/')[0])
    except ValueError: return 0.0

STAT = {  # market -> (stat fn)
    'rec_yds': lambda p: num(p, 'receiving.receivingYards'),
    'receiving_yards': lambda p: num(p, 'receiving.receivingYards'),
    'player_receiving_yds': lambda p: num(p, 'receiving.receivingYards'),
    'rush_yds': lambda p: num(p, 'rushing.rushingYards'),
    'rushing_yards': lambda p: num(p, 'rushing.rushingYards'),
    'player_rushing_yds': lambda p: num(p, 'rushing.rushingYards'),
    'receptions': lambda p: num(p, 'receiving.receptions'),
    'player_receptions': lambda p: num(p, 'receiving.receptions'),
    'rushing_attempts': lambda p: num(p, 'rushing.rushingAttempts'),
    'player_rushing_attempts': lambda p: num(p, 'rushing.rushingAttempts'),
    'completions': lambda p: num(p, 'passing.completions/passingAttempts'),
    'passing_yards': lambda p: num(p, 'passing.passingYards'),
    'pass_tds': lambda p: num(p, 'passing.passingTouchdowns'),
    'passing_touchdowns': lambda p: num(p, 'passing.passingTouchdowns'),
    'interceptions': lambda p: num(p, 'passing.interceptions'),
    'player_longest_reception': lambda p: num(p, 'receiving.longReception'),
}
def nonpass_tds(p):
    return sum(num(p, k) for k in ('rushing.rushingTouchdowns', 'receiving.receivingTouchdowns',
               'kickReturns.kickReturnTouchdowns', 'puntReturns.puntReturnTouchdowns',
               'defensive.defensiveTouchdowns', 'interceptions.interceptionTouchdowns'))

def ou(val, side, line):
    if val == line: return 'P'
    over = val > line
    return 'W' if (over if side in ('OVER', 'YES') else not over) else 'L'

def grade(pk, g):
    r = pk['raw']; m = r.get('market'); line = r.get('line'); side = (r.get('side') or '').upper()
    if g is None: return 'ungradable', 'game not in Week box scores', None
    sc = g['score']; teams = list(sc)
    if m in ('spread', 'teaser', 'moneyline'):
        tm = T(r.get('team')) if side in ('HOME', 'AWAY', '') else T(r.get('side'))
        if tm not in sc: return 'ungradable', f'team {tm} not in game', None
        opp = [t for t in teams if t != tm][0]; margin = sc[tm] - sc[opp]
        if m == 'moneyline':
            return ('W' if margin > 0 else 'L' if margin < 0 else 'P'), f'{tm} {sc[tm]:.0f}-{sc[opp]:.0f}', None
        if line is None: return 'ungradable', 'line not stated by speaker', None
        adj = margin + line
        return ('W' if adj > 0 else 'L' if adj < 0 else 'P'), f'{tm} {sc[tm]:.0f}-{sc[opp]:.0f} ({line:+g})', None
    if m == 'total':
        tot = sum(sc.values()); return ou(tot, side, line), f'total {tot:.0f} vs {line}', None
    if m == 'team_total':
        tm = T(r.get('team')); return ou(sc[tm], side, line), f'{tm} {sc[tm]:.0f} vs {line}', None
    if m == 'survivor_pick':
        tm = T(r.get('team')); opp = [t for t in teams if t != tm][0]
        return ('W' if sc[tm] > sc[opp] else 'L'), f'{tm} {sc[tm]:.0f}-{sc[opp]:.0f}', None
    if m == 'double_result':
        a, b = [T(x) for x in side.split('/')]
        ho = [t for t in teams if t != a][0]; fo = [t for t in teams if t != b][0]
        ok = g['half'][a] > g['half'][ho] and sc[b] > sc[fo]
        return ('W' if ok else 'L'), f"half {a} {g['half'][a]:.0f}-{g['half'][ho]:.0f}; final {b} {sc[b]:.0f}-{sc[fo]:.0f}", None
    if m in ('super_bowl_winner',):
        return 'ungradable', 'futures market, not decided by a Week 8 box score', None
    # player props
    name = r.get('player'); p = g['players'].get(norm(name))
    if m == 'first_touchdown':
        if not g['tds']: return 'L', 'no TDs', p
        first = g['tds'][0]['text']; hit = norm(first).startswith(norm(name))
        return ('W' if hit else 'L'), f'first TD: {first[:70]}', p
    if p is None:
        return 'L', 'not in final box score (house rule: busted leg)', None
    if m in ('anytime_td', 'anytime_touchdown'):
        n = nonpass_tds(p); need = 2 if (line or 0) >= 1.5 else 1
        return ('W' if n >= need else 'L'), f'{n:.0f} non-passing TD (needs {need})', p
    if m in STAT:
        if line is None: return 'ungradable', 'line not stated by speaker', p
        v = STAT[m](p); return ou(v, side, line), f'{v:g} vs {line}', p
    return 'ungradable', f'market {m} not handled', p

def outlet(show):
    s = show.split(' — ')[0].strip()
    return 'Action Network' if s.startswith('The Action Network') else s

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); a = ap.parse_args()
    wk = a.week; W = f'{wk:02d}'
    picks = json.load(open(os.path.join(ROOT, f'data/podcasts/youtube-extracted-picks-2026-w{W}.json'), encoding='utf-8'))
    gs = json.load(open(os.path.join(ROOT, f'data/archive/2026/week-{W}/betting/w{wk}gamesum.json'), encoding='utf-8'))
    games = {}
    for gm in gs:
        games[(T(gm['away']), T(gm['home']))] = load_game(gm['event'])
    rows, seen = [], collections.Counter()
    for i, pk in enumerate(picks['picks']):
        aw, hm = [T(x) for x in pk['game'].split('@')] if pk.get('game') else (None, None)
        g = games.get((aw, hm))
        res, why, _ = grade(pk, g)
        r = pk['raw']; m = r.get('market')
        no_units = m in ('teaser', 'survivor_pick', 'super_bowl_winner') or res == 'ungradable'
        key = (pk['speaker'], pk.get('game'), m, norm(r.get('player')), (r.get('side') or '').upper(), r.get('line'), T(r.get('team')))
        rows.append({'idx': i, 'game': pk['game'], 'speaker': pk['speaker'], 'show': pk['show'], 'outlet': outlet(pk['show']),
                     'episode': pk['episode'], 'timestamp_url': pk.get('timestamp_url'), 'pick': pk['pick'], 'market': m,
                     'line_stated': r.get('line'), 'price_stated': pk.get('price') if pk.get('price') is not None else r.get('price'),
                     'price_assumed_-110': (pk.get('price') is None and r.get('price') is None and not no_units),
                     'result': res, 'detail': why,
                     'units': None if no_units else units(pk.get('price') if pk.get('price') is not None else r.get('price'), res),
                     '_key': key, 'duplicate_of_earlier': False, 'repeated_in': []})
    # one expert position counted once: canonical row = first copy with a stated price, else first copy
    groups = collections.defaultdict(list)
    for x in rows: groups[x['_key']].append(x)
    for g_ in groups.values():
        canon = next((x for x in g_ if x['price_stated'] is not None), g_[0])
        for x in g_:
            if x is not canon:
                x['duplicate_of_earlier'] = True; x['canonical_idx'] = canon['idx']
                canon['repeated_in'].append(x['episode'])
    for x in rows: x.pop('_key')
    def roll(keyf):
        out = collections.defaultdict(lambda: {'W': 0, 'L': 0, 'P': 0, 'ungradable': 0, 'units': 0.0, 'n': 0})
        for x in rows:
            if x['duplicate_of_earlier']: continue
            o = out[keyf(x)]; o['n'] += 1; o[x['result']] += 1
            if x['units'] is not None: o['units'] = round(o['units'] + x['units'], 3)
        return dict(sorted(out.items(), key=lambda kv: -kv[1]['units']))
    summ = {'by_expert': roll(lambda x: x['speaker']), 'by_outlet': roll(lambda x: x['outlet']),
            'by_market_group': roll(lambda x: 'side/total' if x['market'] in ('spread', 'moneyline', 'total', 'team_total') else
                                    'anytime/first TD' if 'touchdown' in (x['market'] or '') or x['market'] == 'anytime_td' else
                                    'other' if x['market'] in ('teaser', 'survivor_pick', 'super_bowl_winner', 'double_result') else 'player yardage/count'),
            'overall': roll(lambda x: 'all')['all']}
    out = {'week': wk, 'season': 2026, 'source_file': f'data/podcasts/youtube-extracted-picks-2026-w{W}.json',
           'graded_against': 'data/fantasy/boxscores/espn-<event>.json (cached by weekly-archive) + wNgamesum.json',
           'rules': __doc__.split('Rules  :')[1].strip(), 'rollups_exclude_duplicates': 'Rollups count each expert position once (same speaker+game+market+side/player+line), even when repeated across episodes or clip re-cuts.',
           'season_to_date_note': 'No earlier podcast grade files exist under reports/intel/; season-to-date = this week only.',
           'summary': summ, 'grades': rows}
    jp = os.path.join(ROOT, f'reports/intel/w{W}-podcast-pick-grades.json')
    json.dump(out, open(jp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('wrote', jp); print(json.dumps(summ['overall']))

if __name__ == '__main__':
    main()
