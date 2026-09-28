"""T2-B: expert scorecard v2. Twitter props (Team 1 expert_props.json, ladders collapsed here), first-TD split out of ATD using
bookmark text, BEO board prices (W2/W3), standard-vs-alt from the board main line, Wilson intervals, podcast/YouTube props
(Supabase user_picks via the read-only master-intel pull) and sides by source type. Output ../t2b_experts.json."""
import json, os, re, glob, collections, statistics
from core import *

BE110 = 110 / 210
PODCAST = {'BettingPros', 'Sharp or Square', 'Even Money', 'Action Network', 'The Favorites', 'Robert Mays / The Athletic',
           'PFF (Sam Monson & Steve Palazzolo)', 'Joe Gibbs', 'Warren Sharp', 'PoolGenius'}
YOUTUBE = {'Brandon Anderson', 'Simon Hunter', 'Chad Millman'}
NAMES = {'DanGambleAI': "Dan's AI Sports Picks", 'HarryLockPicks': 'Harry Lock Picks', 'salbets_': 'Sal Bets', 'thejoeholkashow': 'Joe Holka',
         'CodyBrownBets': 'Cody Brown Bets', 'SharpieMatters': 'SharpieMatters', 'ParlayScience': 'ParlayScience', 'NoExpertFS': 'No Expert Fantasy Sports',
         'FirstTDBets': 'FirstTDBets', 'JoeOrrico': 'Joe Orrico', 'GOATedAnalytics': 'GOATed Analytics', 'Capper_Kale': 'Capper_Kale',
         'thepropdealer': 'The Prop Dealer', 'TheDegenWeekly': 'TheDegenWeekly', 'BrknBallsCT': 'Breaking Balls (CT)'}
FTD_RX = re.compile(r'first\s*(td|touchdown)|1st\s*(td|touchdown)|\bftd\b|first to score|first scorer', re.I)
ATD_RX = re.compile(r'anytime|\batd\b|any time', re.I)

def bookmark_index():
    idx = {}
    for f in glob.glob(os.path.join(ROOT, '.nfl/reports/twitter-bookmarks/*.md')):
        m = re.search(r'-(\d{15,})\.md$', f)
        if m: idx.setdefault(m.group(1), []).append(f)
    return idx
def tweet_text(idx, url):
    m = re.search(r'status/(\d{15,})', url or '')
    if not m or m.group(1) not in idx: return None
    return '\n'.join(open(f, encoding='utf-8', errors='ignore').read() for f in idx[m.group(1)])
def ladder_main(B, week, player, key):
    """Board main line = rung priced closest to -115 (BEO ladders are over rungs)."""
    m = BOARDMAP.get(key)
    if not m: return None
    n = norm(player); best = None
    for (w, p, mk, line), odds in B.items():
        if w != week or p != n or mk != m or line is None: continue
        d = abs(dec(odds) - dec(-115))
        if best is None or d < best[0]: best = (d, line)
    return best[1] if best else None

def main():
    D = load_all(); G, B = D['G'], D['B']
    E = jl(os.path.join(SR, 'expert_props.json'))
    idx = bookmark_index()
    # --- first-TD split
    ftd_moved = 0
    for e in E:
        e['key0'] = e['key']
        if e['key'] == 'atd':
            txt = tweet_text(idx, e.get('tweet')) or ''
            mk = (e.get('market') or '') + ' ' + (e.get('lean') or '')
            if FTD_RX.search(mk) or (FTD_RX.search(txt) and not ATD_RX.search(txt)):
                g = game_for(G, e['week'], e.get('game'))
                if g:
                    tds = td_scorers(g); first = tds[0][0] if tds else None
                    pn, _ = player_in(g, e['player'])
                    e['key'] = 'first_td'; e['res'] = 'W' if first and pn and norm(first) == norm(pn) else 'L'; ftd_moved += 1
            elif FTD_RX.search(txt) and ATD_RX.search(txt):
                e['ftd_ambiguous'] = True
    # --- collapse ladders (same expert, tweet, player, market, direction) to the middle rung
    grp = collections.defaultdict(list)
    for e in E:
        grp[(e['h'], e.get('tweet'), e['week'], norm(e.get('player')), e['key'], e.get('dir'))].append(e)
    C = []
    for k, rows in grp.items():
        rows = sorted(rows, key=lambda r: (r.get('thr') or 0)); mid = rows[(len(rows) - 1) // 2]
        c = dict(mid); c['ladder'] = len(rows); C.append(c)
    # --- price + standard/alt
    for c in C:
        k = c['key']; thr = c.get('thr')
        if k == 'atd' and (thr or 1) >= 1.5: c['mk'] = '2+ TD'
        else: c['mk'] = {'atd': 'Anytime TD', 'first_td': 'First TD', 'first_team_td': 'First TD', 'rec': 'Receptions', 'rec_yds': 'Receiving yds',
                         'rush_yds': 'Rushing yds', 'pass_yds': 'Passing yds', 'pass_td': 'Passing TDs'}.get(k, 'Other')
        bp = None
        if c['week'] in (2, 3) and c.get('dir') != 'under':
            bkey = 'atd' if k == 'atd' else k
            bthr = (1 if k == 'atd' and not thr else thr)
            if k == 'atd' and thr and thr < 1: bthr = 1
            bp = board_price(B, c['week'], c.get('player'), bkey, bthr, c.get('dir'))
        c['price'] = bp; c['dec'] = dec(bp)
        line = 'n/a'
        if k in ('rec', 'rec_yds', 'rush_yds', 'pass_yds', 'carries', 'pass_att', 'completions', 'pass_td') and thr is not None:
            main_ = ladder_main(B, c['week'], c.get('player'), k) if c['week'] in (2, 3) else None
            if main_ is not None:
                tol = 1 if k in ('rec', 'carries', 'pass_td', 'pass_att', 'completions') else max(3, 0.1 * main_)
                line = 'standard' if abs(thr - main_) <= tol else ('alt (easier)' if (thr < main_) == (c.get('dir') != 'under') else 'alt (harder)')
                c['main'] = main_
            elif c.get('cushion') is not None:
                cu = c['cushion'] if c.get('dir') != 'under' else -c['cushion']
                line = 'standard' if abs(cu) <= 0.15 else ('alt (easier)' if cu > 0.15 else 'alt (harder)')
        c['line_type'] = line
    C = [c for c in C if c['res'] in ('W', 'L')]
    def rec(rows, ref=None):
        w = sum(r['res'] == 'W' for r in rows); n = len(rows)
        pr = [r for r in rows if r.get('dec')]
        be = sum(1 / r['dec'] for r in pr) / len(pr) if pr else None
        roi = (sum(r['dec'] for r in pr if r['res'] == 'W') - len(pr)) / len(pr) if pr else None
        wp = sum(r['res'] == 'W' for r in pr)
        zp = zscore(wp, len(pr), be) if pr else None
        zs = zscore(w, n, ref) if ref else None
        lo, hi = wilson(w, n)
        return dict(w=w, n=n, hit=w / n if n else None, lo=lo, hi=hi, priced=len(pr), wp=wp, be=be, roi=roi, z_priced=zp, z_ref=zs)
    experts = {}
    for h in sorted({c['h'] for c in C}):
        R = [c for c in C if c['h'] == h]
        if len(R) < 6: continue
        by_mk = {m: rec([r for r in R if r['mk'] == m]) for m in sorted({r['mk'] for r in R})}
        by_line = {t: rec([r for r in R if r['line_type'] == t], BE110 if t == 'standard' else None) for t in ('standard', 'alt (easier)', 'alt (harder)') if any(r['line_type'] == t for r in R)}
        by_wk = {w: rec([r for r in R if r['week'] == w]) for w in (1, 2, 3) if any(r['week'] == w for r in R)}
        experts[h] = dict(name=NAMES.get(h, h), src='YouTube' if h in YOUTUBE or any(r.get('bet_type') == 'youtube' for r in R) else 'Twitter',
                          all=rec(R), by_mk=by_mk, by_line=by_line, by_wk=by_wk, games=len({(r['week'], r.get('game')) for r in R}),
                          ladders=sum(r['ladder'] > 1 for r in R), unders=sum(r.get('dir') == 'under' for r in R))
    # --- verdicts
    for h, x in experts.items():
        a = x['all']; st = x['by_line'].get('standard'); easy = x['by_line'].get('alt (easier)')
        atd = x['by_mk'].get('Anytime TD'); ftd = x['by_mk'].get('First TD')
        pos_weeks = sum(1 for v in x['by_wk'].values() if v['hit'] and v['hit'] > .5)
        # evidence z: priced ROI z if >=10 priced, else standard-line z vs -110, else hit vs 50%
        if a['priced'] >= 10: z, basis = a['z_priced'], f"{a['wp']}/{a['priced']} priced vs {a['be']*100:.0f}% break-even"
        elif st and st['n'] >= 10: z, basis = st['z_ref'], f"standard lines {st['w']}/{st['n']} vs 52.4%"
        else: z, basis = zscore(a['w'], a['n'], .5), f"{a['w']}/{a['n']} vs 50% (no prices)"
        if a['n'] < 15 or x['games'] < 4: v = 'too thin'
        elif ftd and ftd['n'] >= 8 and ftd['n'] >= a['n'] * .5 and (ftd['roi'] or -1) < 0: v = 'fade'
        elif z <= -1.5: v = 'fade'
        elif easy and easy['n'] >= a['n'] * .5 and (not st or (st['hit'] or 0) <= BE110): v = 'screen'
        elif z >= 1.0 and pos_weeks >= 2: v = 'follow'
        elif z >= 0.5: v = 'screen'
        else: v = 'neutral'
        x['verdict'] = v; x['z'] = z; x['basis'] = basis; x['evidence'] = evidence(z) if v not in ('too thin',) else 'too thin'
    # --- podcast / YouTube / Supabase props (read-only pull)
    pull = jl(os.path.join(ROOT, 'data/generated/master-intel/w01-pull.json'))['expert']
    pod = []
    RX = re.compile(r'^(.+?)\s+(OVER|UNDER)\s+(receiving yards|passing yards|passing touchdowns|receptions|rushing yards|interceptions|pass completions|pass attempts)$', re.I)
    KM = {'receiving yards': 'rec_yds', 'passing yards': 'pass_yds', 'passing touchdowns': 'pass_td', 'receptions': 'rec', 'rushing yards': 'rush_yds',
          'interceptions': 'int_thrown', 'pass completions': 'completions', 'pass attempts': 'pass_att'}
    def pstat(p, k):
        pa, ru, re_ = p.get('passing') or {}, p.get('rushing') or {}, p.get('receiving') or {}
        return {'rec_yds': num(re_.get('YDS')), 'pass_yds': num(pa.get('YDS')), 'pass_td': num(pa.get('TD')), 'rec': num(re_.get('REC')), 'rush_yds': num(ru.get('YDS')),
                'int_thrown': num(pa.get('INT')), 'completions': num((pa.get('C/ATT') or '0/0').split('/')[0]), 'pass_att': num((pa.get('C/ATT') or '0/0').split('/')[1])}[k]
    for e in pull:
        if e['pick_type'] != 'player_prop': continue
        gstr = None
        for (w, gk), g in G.items():
            if w == 3 and norm(e['visitor']).split()[-1] in [norm(x) for x in []]: pass
        # map full team names -> week-3 game by home team nickname
        home = norm(e['home']).split()[-1]; g = None
        for (w, gk), gg in G.items():
            if w != 3: continue
            for pn, p in list(gg['players'].items())[:1]: pass
            if any(home in norm(x) for x in [gg['home']]): g = gg
        NICK = {'packers': 'GB', 'broncos': 'DEN', 'steelers': 'PIT', 'lions': 'DET', 'colts': 'IND', 'saints': 'NO', 'browns': 'CLE', 'commanders': 'WSH', 'bills': 'BUF', 'cowboys': 'DAL'}
        hab = NICK.get(home); g = next((gg for (w, gk), gg in G.items() if w == 3 and gg['home'] == hab), None)
        if not g: continue
        m = RX.match(e['selection'].strip())
        tds = td_scorers(g)
        if m:
            pn, p = player_in(g, m.group(1)); k = KM[m.group(3).lower()]; thr = float(e['line'])
            if not p: res = 'L'; a = None
            else:
                a = pstat(p, k); res = 'W' if ((a > thr) if m.group(2).upper() == 'OVER' else (a < thr)) else 'L'
            pod.append(dict(expert=e['expert'], sel=e['selection'], line=e['line'], actual=a, res=res, mk=k, price=None))
        elif 'Anytime TD' in e['selection'] or '2+ TDs multi TD' in e['selection'] and 'SGP' not in e['selection']:
            nm = e['selection'].split(' Anytime')[0].split(' 2+')[0]; pn, p = player_in(g, nm)
            n_td = sum(1 for s, _ in tds if pn and norm(s) == norm(pn)); need = 2 if '2+' in e['selection'] else 1
            pr = e['line'] if e['line'] and abs(e['line']) >= 100 else None
            pod.append(dict(expert=e['expert'], sel=e['selection'], line=None, actual=n_td, res='W' if n_td >= need else 'L', mk='Anytime TD' if need == 1 else '2+ TD', price=pr, dec=dec(pr)))
        else:
            pod.append(dict(expert=e['expert'], sel=e['selection'], line=e['line'], actual=None, res='manual', mk='SGP/other', price=e['line']))
    # manual grades for the three SGPs (ESPN W3 box scores): Henry 89 rush yds, 2 TD, BAL won 34-31; Kyren 15 car / Stafford 55 att
    for p in pod:
        s = p['sel']
        if 'Henry' in s and 'Any TD' in s: p.update(res='L', note='Henry 89 rush yds (<100)'); p['dec'] = dec(249)
        elif 'Henry' in s and '2+ TDs' in s: p.update(res='L', note='Henry 89 rush yds (<100)'); p['dec'] = dec(540)
        elif 'Kyren Williams OVER 52.5' in s:
            gg = next(gg for (w, gk), gg in G.items() if w == 3 and gg['key'] == 'LAR@DEN'); _, kp = player_in(gg, 'Kyren Williams'); _, sp = player_in(gg, 'Matthew Stafford')
            ok = num((kp.get('rushing') or {}).get('YDS')) > 52.5 and pstat(sp, 'pass_att') < 33.5
            p.update(res='W' if ok else 'L', note=f"Kyren {num((kp.get('rushing') or {}).get('YDS')):.0f} rush yds, Stafford {pstat(sp,'pass_att'):.0f} att"); p['dec'] = dec(220)
    podrec = {}
    for ex in sorted({p['expert'] for p in pod}):
        R = [p for p in pod if p['expert'] == ex and p['res'] in ('W', 'L')]
        podrec[ex] = dict(w=sum(p['res'] == 'W' for p in R), n=len(R), picks=[(p['sel'][:70], p['res'], p.get('actual'), p.get('note')) for p in R])
    # --- sides by source type (-110 reference)
    S = jl(os.path.join(SR, 'expert_sides.json'))
    def stype(s):
        if s.get('src') == 'youtube' or s['h'] in YOUTUBE: return 'YouTube'
        if s['h'] in PODCAST: return 'Podcast'
        return 'Twitter'
    sides = {}
    for t in ('Twitter', 'Podcast', 'YouTube'):
        R = [s for s in S if stype(s) == t and s['res'] in ('W', 'L') and s.get('bet_type') not in ('moneyline', 'futures', 'player_prop')]
        w = sum(s['res'] == 'W' for s in R); sides[t] = dict(w=w, n=len(R), hit=w / len(R) if R else None, ci=wilson(w, len(R)), z=zscore(w, len(R), BE110))
    by_h = {}
    for h in {s['h'] for s in S}:
        R = [s for s in S if s['h'] == h and s['res'] in ('W', 'L') and s.get('bet_type') not in ('moneyline', 'futures', 'player_prop')]
        if len(R) >= 8:
            w = sum(s['res'] == 'W' for s in R); by_h[h] = dict(type=stype(R[0]), w=w, n=len(R), hit=w / len(R), ci=wilson(w, len(R)), z=zscore(w, len(R), BE110))
    mk_all = {m: rec([c for c in C if c['mk'] == m]) for m in sorted({c['mk'] for c in C})}
    line_all = {t: rec([c for c in C if c['line_type'] == t], BE110 if t == 'standard' else None) for t in ('standard', 'alt (easier)', 'alt (harder)', 'n/a')}
    out = dict(n_raw=len(E), n_collapsed=len(C), ftd_moved=ftd_moved, ftd_ambiguous=sum(1 for e in E if e.get('ftd_ambiguous')),
               priced=sum(1 for c in C if c.get('dec')), experts=experts, market_all=mk_all, line_all=line_all,
               podcast_props=podrec, sides=sides, sides_by_h=by_h,
               dossiers='data/expert-dossiers/*.json hold host sentiment citations only (no line, no price, no gradeable pick); used as context, not scored.')
    json.dump(out, open(os.path.join(OUT, 't2b_experts.json'), 'w'), indent=1, default=str)
    json.dump(C, open(os.path.join(OUT, 't2b_props_collapsed.json'), 'w'), indent=0, default=str)
    return out
if __name__ == '__main__':
    o = main()
    print({k: o[k] for k in ('n_raw', 'n_collapsed', 'ftd_moved', 'ftd_ambiguous', 'priced')})
    for h, x in sorted(o['experts'].items(), key=lambda kv: -kv[1]['z']):
        a = x['all']
        print(f"{x['name'][:24]:24s} {x['src'][:2]} {a['w']:3d}-{a['n']-a['w']:<3d} {a['hit']*100:4.0f}% [{a['lo']*100:.0f}-{a['hi']*100:.0f}] priced {a['wp']}/{a['priced']} roi {a['roi'] if a['roi'] is None else round(a['roi'],2)} | z {x['z']:.2f} {x['verdict']:8s} {x['evidence']} | {x['basis']} | "
              + ' '.join(f"{m}:{v['w']}/{v['n']}" for m, v in x['by_mk'].items()) + ' || ' + ' '.join(f"{t}:{v['w']}/{v['n']}" for t, v in x['by_line'].items()) + ' || ' + ' '.join(f"W{w}:{v['w']}/{v['n']}" for w, v in x['by_wk'].items()))
    print('MARKETS', json.dumps({k: (v['w'], v['n'], v['priced'], v['roi'] and round(v['roi'], 2), v['be'] and round(v['be'], 3)) for k, v in o['market_all'].items()}))
    print('LINES', json.dumps({k: (v['w'], v['n'], v['z_ref'] and round(v['z_ref'], 2), v['priced'], v['roi'] and round(v['roi'], 2)) for k, v in o['line_all'].items()}))
    print('POD', json.dumps(o['podcast_props'], default=str)[:3000])
    print('SIDES', json.dumps(o['sides'], default=str))
    for h, v in sorted(o['sides_by_h'].items(), key=lambda kv: -kv[1]['hit']): print('  ', h, v['type'], v['w'], v['n'], round(v['hit'], 2), round(v['z'], 2))
