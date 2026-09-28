"""T2-A: burn taxonomy for Weeks 1-3 (same six cause groups as Team 1's w3burnt.json) + structural-vs-variance tests.
Outputs: ../t2a_burn.json (all burnt unique positions with cause) and ../t2a_summary.json."""
import json, os, math, itertools, collections, random
from core import *

GROUP6 = ['Side or total lost', 'TD went to someone else', "Player didn't get the volume", "Sack / INT / tackle didn't happen",
          'QB game script', 'Volume there, production not']
def cause(l):
    g, k = l['grp'], l.get('key')
    if g == 'side/total' or l['kind'] in ('ml', 'spread', 'total', 'team_total', 'half_total', 'cfb'):
        return 'Side or total lost'
    if g == 'TD scorer': return 'TD went to someone else'
    if g == 'defense': return "Sack / INT / tackle didn't happen"
    if g == 'QB' and not (k == 'rush_yds'): return 'QB game script'
    thr = float(l.get('thr') or 0)
    if l.get('dnp'): return "Player didn't get the volume"
    if k == 'rec':
        return "Player didn't get the volume" if (l.get('tg') or 0) < 1.4 * thr else 'Volume there, production not'
    if k == 'rec_yds':
        return "Player didn't get the volume" if (l.get('tg') or 0) < max(4, thr / 10) else 'Volume there, production not'
    if k in ('rush_yds',):
        return "Player didn't get the volume" if (l.get('car') or 0) < thr / 4.3 else 'Volume there, production not'
    if k == 'carries': return "Player didn't get the volume"
    return 'Volume there, production not'
def near(l):
    m = l.get('margin')
    if not isinstance(m, (int, float)): return False
    k = l.get('key'); a = abs(m)
    if l['kind'] in ('spread', 'total', 'team_total', 'half_total'): return a <= 3
    if l['kind'] == 'ml': return a <= 3
    if k in ('rec', 'carries', 'tackles', 'completions', 'pass_att', 'pass_td', 'sacks'): return a <= 1
    if k in ('rec_yds', 'rush_yds', 'pass_yds'): return a <= max(5, 0.1 * float(l.get('thr') or 0))
    return False

def main():
    D = load_all(); U = unique_positions(D['legs'])
    for l in U: l['src'] = 'placed'
    AI = unique_positions(D['ai_only'])
    for l in AI: l['src'] = 'AI-only'
    allpos = [l for l in U + AI if l['result'] in ('W', 'L')]
    burnt = [l for l in allpos if l['result'] == 'L']
    for l in burnt: l['cause'] = cause(l); l['near'] = near(l)
    # validation vs Team 1 W3 hand classification
    t1 = jl(os.path.join(ROOT, 'reports/bets/season-recap/work/container/exp/w3burnt_c.json'))
    MAP = {'TD went elsewhere': 'TD went to someone else', "Defensive stat didn't come": "Sack / INT / tackle didn't happen", 'Side lost': 'Side or total lost',
           'Total went over': 'Side or total lost', 'Low target volume': "Player didn't get the volume", 'Low carry volume': "Player didn't get the volume",
           'QB script / volume': 'QB game script', 'Targets there, catches not': 'Volume there, production not', 'Carries there, yards not': 'Volume there, production not'}
    t1c = collections.Counter(MAP[b['cause']] for b in t1)
    w3c = collections.Counter(l['cause'] for l in burnt if l['week'] == 3)
    t1lab = {(b['label'].lower()): MAP[b['cause']] for b in t1}
    agree = [l['cause'] == t1lab[l['label'].lower()] for l in burnt if l['week'] == 3 and l['label'].lower() in t1lab]
    by_week = {w: collections.Counter(l['cause'] for l in burnt if l['week'] == w) for w in (1, 2, 3)}
    placed_by_week = {w: collections.Counter(l['cause'] for l in burnt if l['week'] == w and l['src'] == 'placed') for w in (1, 2, 3)}
    # --- per-cause: near-miss share, tickets killed
    percause = {}
    for c in GROUP6:
        B = [l for l in burnt if l['cause'] == c]
        percause[c] = dict(n=len(B), near=sum(l['near'] for l in B), ticket_hits=sum(l.get('n', 1) for l in B if l['src'] == 'placed'))
    # --- category hit rate vs break-even (placed + AI-only unique priced positions)
    cats = {}
    for c in sorted({l['cat'] for l in allpos}):
        P = [l for l in allpos if l['cat'] == c]
        pr = [l for l in P if l.get('dec')]
        w = sum(l['result'] == 'W' for l in P); n = len(P)
        be = sum(1 / l['dec'] for l in pr) / len(pr) if pr else None
        wp = sum(l['result'] == 'W' for l in pr)
        roi = (sum(l['dec'] for l in pr if l['result'] == 'W') - len(pr)) / len(pr) if pr else None
        z = zscore(wp, len(pr), be) if pr else 0
        cats[c] = dict(w=w, n=n, hit=w / n, priced=len(pr), wp=wp, be=be, flat_roi=roi, z=z, evidence=evidence(z) if pr else 'unpriced',
                       ci=wilson(w, n), grp=P[0]['grp'])
    # --- game-level clustering test (overdispersion of hits within game-weeks), placed unique positions
    gw = collections.defaultdict(list)
    for l in allpos:
        if l['kind'] == 'cfb' or not l.get('_g'): continue
        gw[(l['week'], l['_g'])].append(l)
    p = sum(l['result'] == 'W' for ls in gw.values() for l in ls) / sum(len(ls) for ls in gw.values())
    chi = 0; df = 0
    for ls in gw.values():
        n = len(ls)
        if n < 2: continue
        h = sum(l['result'] == 'W' for l in ls); chi += (h - n * p) ** 2 / (n * p * (1 - p)); df += 1
    # permutation test: shuffle outcomes across all positions within week, recompute chi
    random.seed(7); perm = []
    keys = [k for k, ls in gw.items() if len(ls) >= 2]
    for _ in range(2000):
        pool = collections.defaultdict(list)
        for k in keys: pool[k[0]] += [l['result'] == 'W' for l in gw[k]]
        for w in pool: random.shuffle(pool[w])
        it = {w: iter(v) for w, v in pool.items()}; c2 = 0
        for k in keys:
            n = len(gw[k]); h = sum(next(it[k[0]]) for _ in range(n)); c2 += (h - n * p) ** 2 / (n * p * (1 - p))
        perm.append(c2)
    pval = sum(x >= chi for x in perm) / len(perm)
    # pairwise same-game correlation of outcomes (phi), props only and all
    def phi(pairs):
        a = sum(1 for x, y in pairs if x and y); b = sum(1 for x, y in pairs if x and not y); c = sum(1 for x, y in pairs if not x and y); d = sum(1 for x, y in pairs if not x and not y)
        den = math.sqrt((a + b) * (c + d) * (a + c) * (b + d)) or 1
        return (a * d - b * c) / den, len(pairs)
    same = []
    for ls in gw.values():
        for x, y in itertools.combinations(ls, 2): same.append((x['result'] == 'W', y['result'] == 'W'))
    # --- script dependence: props by team result & by first-half margin
    props = [l for l in allpos if l['kind'] == 'prop' and l.get('team_margin') is not None and l['cat'] not in ('Sacks', 'Tackles+Ast', 'Defensive INT')]
    def hr(ls):
        w = sum(l['result'] == 'W' for l in ls); pr = [l for l in ls if l.get('dec')]
        be = sum(1 / l['dec'] for l in pr) / len(pr) if pr else None
        return dict(w=w, n=len(ls), hit=w / len(ls) if ls else None, be=be, z=zscore(sum(l['result'] == 'W' for l in pr), len(pr), be) if pr else 0)
    script = {'team won': hr([l for l in props if l['team_margin'] > 0]), 'team lost': hr([l for l in props if l['team_margin'] < 0]),
              'led at half': hr([l for l in props if l['half_margin'] > 0]), 'trailed at half': hr([l for l in props if l['half_margin'] < 0])}
    # WR/TE receiving legs vs team pass volume; RB rushing legs vs team run volume
    rec = [l for l in allpos if l.get('key') in ('rec', 'rec_yds') and l.get('team_patt')]
    rush = [l for l in allpos if l.get('key') in ('rush_yds', 'carries') and l.get('team_ratt') and l['cat'] != 'QB rushing yds']
    vol = {'receiving legs, team threw >=35': hr([l for l in rec if l['team_patt'] >= 35]), 'receiving legs, team threw <35': hr([l for l in rec if l['team_patt'] < 35]),
           'rushing legs, team ran >=28': hr([l for l in rush if l['team_ratt'] >= 28]), 'rushing legs, team ran <28': hr([l for l in rush if l['team_ratt'] < 28])}
    # defense legs vs opponent volume
    sk = [l for l in allpos if l.get('key') == 'sacks' and l.get('opp_patt')]
    tk = [l for l in allpos if l.get('key') == 'tackles' and l.get('opp_patt') is not None]
    defn = {'sack legs, opp threw >=35': hr([l for l in sk if l['opp_patt'] >= 35]), 'sack legs, opp threw <35': hr([l for l in sk if l['opp_patt'] < 35])}
    # --- TD concentration: lost ATD legs - did the player's team score 2+ TDs (went elsewhere) or 0-1 (script)?
    atd = [l for l in allpos if l['cat'] in ('Anytime TD', '2+ TD', 'First TD')]
    atd_l = [l for l in atd if l['result'] == 'L']
    tdconc = dict(lost=len(atd_l), team_scored_2plus=sum(1 for l in atd_l if (l.get('team_tds') or 0) >= 2),
                  team_scored_0_1=sum(1 for l in atd_l if (l.get('team_tds') or 0) <= 1),
                  hit_when_team_3plus=hr([l for l in atd if (l.get('team_tds') or 0) >= 3 and l['cat'] == 'Anytime TD']),
                  hit_when_team_0_2=hr([l for l in atd if (l.get('team_tds') or 0) <= 2 and l['cat'] == 'Anytime TD']))
    # --- same-game stack exposure per ticket: tickets whose legs span <=2 games vs more
    stack = collections.Counter(); stack_w = collections.Counter()
    for t in D['tickets']:
        if not is_cash(t): continue
        gs = collections.Counter(l.get('game') for l in t['legs']); top = max(gs.values())
        share = top / len(t['legs'])
        b = 'single-game (SGP/island)' if len(gs) == 1 else ('>=50% one game' if share >= .5 else 'spread across games')
        stack[b] += 1; stack_w[b] += 1 if RET.get(t['id'], 0) > 0 else 0
    # co-burn: when one leg in a game burns on a ticket, how often do other same-game legs on that ticket burn too
    co = [0, 0]
    for t in D['tickets']:
        byg = collections.defaultdict(list)
        for l in t['legs']: byg[l.get('game')].append(l['result'])
        for g, rs in byg.items():
            if len(rs) < 2: continue
            for i, r in enumerate(rs):
                if r != 'L': continue
                others = [x for j, x in enumerate(rs) if j != i and x in ('W', 'L')]
                co[0] += sum(x == 'L' for x in others); co[1] += len(others)
    allres = [l['result'] for t in D['tickets'] for l in t['legs'] if l['result'] in ('W', 'L')]
    base_loss = sum(r == 'L' for r in allres) / len(allres)
    # most-burnt game-weeks
    gb = collections.Counter((l['week'], l.get('_g') or l.get('game')) for l in burnt)
    out = dict(n_positions=len(allpos), n_burnt=len(burnt), by_week=by_week, placed_by_week=placed_by_week, season=collections.Counter(l['cause'] for l in burnt),
               w3_team1=t1c, w3_team2=w3c, w3_label_agreement=(sum(agree), len(agree)), percause=percause, cats=cats,
               clustering=dict(p=p, chi=chi, df=df, perm_p=pval, perm_mean=sum(perm) / len(perm), same_game_phi=phi(same)),
               script=script, volume=vol, defense=defn, tdconc=tdconc, stack=dict(tickets=stack, cashed=stack_w),
               coburn=dict(rate=co[0] / co[1] if co[1] else None, n=co[1], base_loss=base_loss),
               top_games=[(f'W{w} {g}', n) for (w, g), n in gb.most_common(12)])
    json.dump(out, open(os.path.join(OUT, 't2a_summary.json'), 'w'), indent=1, default=str)
    keep = ['week', 'game', '_g', 'label', 'src', 'kind', 'key', 'cat', 'grp', 'thr', 'dir', 'actual', 'margin', 'n', 'origin', 'cause', 'near',
            'tg', 'car', 'team', 'team_margin', 'half_margin', 'team_patt', 'team_ratt', 'opp_patt', 'team_tds', 'dec', 'price_src']
    json.dump([{k: l.get(k) for k in keep} for l in burnt], open(os.path.join(OUT, 't2a_burn.json'), 'w'), indent=1, default=str)
    return out
if __name__ == '__main__':
    o = main()
    for k in ('n_positions', 'n_burnt', 'by_week', 'season', 'w3_team1', 'w3_team2', 'w3_label_agreement', 'percause', 'clustering', 'script', 'volume', 'defense', 'tdconc', 'stack', 'coburn', 'top_games'):
        print(k, json.dumps(o[k], default=str))
    for c, v in sorted(o['cats'].items(), key=lambda x: x[1]['z']):
        print(f"{c:18s} {v['w']:3d}/{v['n']:<3d} hit {v['hit']:.2f} priced {v['wp']}/{v['priced']} be {v['be'] if v['be'] is None else round(v['be'],3)} roi {v['flat_roi'] if v['flat_roi'] is None else round(v['flat_roi'],2)} z {v['z']:.2f} {v['evidence']}")
