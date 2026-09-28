"""T2-C: source and decision analysis. AI-proposed vs Andy's own picks (origin tags from Team 1's leg tables, W1-3),
AI props vs AI sides, the ledger divergences D1-D11, and expert agreement as a filter. Output ../t2c_sources.json."""
import json, os, collections
from core import *

KEEP = {'salbets_', 'thejoeholkashow', 'CodyBrownBets', 'HarryLockPicks'}
FADE = {'DanGambleAI', 'SharpieMatters', 'FirstTDBets'}
def rec(rows):
    w = sum(r['result'] == 'W' for r in rows); n = len(rows)
    pr = [r for r in rows if r.get('dec')]; wp = sum(r['result'] == 'W' for r in pr)
    be = sum(1 / r['dec'] for r in pr) / len(pr) if pr else None
    roi = (sum(r['dec'] for r in pr if r['result'] == 'W') - len(pr)) / len(pr) if pr else None
    z = zscore(wp, len(pr), be) if pr else 0.0
    return dict(w=w, n=n, hit=w / n if n else None, ci=wilson(w, n), priced=len(pr), wp=wp, be=be, roi=roi, z=z, evidence=evidence(z) if len(pr) >= 15 else 'thin (hypothesis)')
def last(s): return norm(s).split()[-1] if s and norm(s).split() else ''
def main():
    D = load_all()
    U = [u for u in unique_positions(D['legs']) if u['result'] in ('W', 'L') and u['kind'] != 'cfb']
    A = [a for a in unique_positions(D['ai_only']) if a['result'] in ('W', 'L')]
    for u in U: u['who'] = 'AI-proposed, placed' if u['origin'] == 'agree' else 'Andy (own / not in AI log)'
    for a in A: a['who'] = 'AI-proposed, not placed'
    ALL = U + A
    who = {w: {g: rec([x for x in ALL if x['who'] == w and (g == 'all' or (g == 'props') == (x['grp'] != 'side/total'))]) for g in ('all', 'sides', 'props')}
           for w in ('AI-proposed, placed', 'Andy (own / not in AI log)', 'AI-proposed, not placed')}
    ai = [x for x in ALL if x['who'] != 'Andy (own / not in AI log)']
    ai_split = {g: rec([x for x in ai if x['grp'] == g]) for g in sorted({x['grp'] for x in ai})}
    andy_split = {g: rec([x for x in U if x['who'].startswith('Andy') and x['grp'] == g]) for g in sorted({x['grp'] for x in U})}
    by_cat = {}
    for c in sorted({x['cat'] for x in ALL}):
        by_cat[c] = {w: rec([x for x in ALL if x['cat'] == c and x['who'] == w]) for w in ('AI-proposed, placed', 'Andy (own / not in AI log)', 'AI-proposed, not placed')}
    wk = {w: {k: rec([x for x in ALL if x['week'] == w and x['who'] == k]) for k in ('AI-proposed, placed', 'Andy (own / not in AI log)', 'AI-proposed, not placed')} for w in (1, 2, 3)}
    # --- expert agreement filter
    C = jl(os.path.join(OUT, 't2b_props_collapsed.json'))
    EX = collections.defaultdict(set)
    for c in C:
        k = c['key']; k = 'first_td' if k in ('first_td', 'first_team_td') else k
        EX[(c['week'], last(c.get('player')), k, c.get('dir') or 'over')].add(c['h'])
    tags = collections.defaultdict(list)
    for x in ALL:
        if x['kind'] != 'prop': continue
        k = x.get('key'); k = 'atd' if k == 'atd' else k
        hs = EX.get((x['week'], last(x.get('player')), k, x.get('dir') or 'over'), set())
        x['experts'] = sorted(hs)
        if not hs: t = 'no expert'
        elif hs & KEEP and not hs & FADE: t = 'keep-list expert'
        elif hs & FADE and not hs & KEEP: t = 'fade-list expert only'
        else: t = 'other / mixed expert'
        x['xtag'] = t; tags[t].append(x)
        if hs: tags['any expert'].append(x)
    filt = {t: rec(v) for t, v in tags.items()}
    filt_placed = {t: rec([x for x in v if x['who'] != 'AI-proposed, not placed']) for t, v in tags.items()}
    n_exp = collections.Counter()
    for x in ALL:
        if x['kind'] == 'prop': n_exp[min(len(x.get('experts') or []), 2)] += 1
    by_nexp = {k: rec([x for x in ALL if x['kind'] == 'prop' and min(len(x.get('experts') or []), 2) == k]) for k in (0, 1, 2)}
    # --- ledger divergences (Week 3, D1-D11) graded leg-by-leg from ESPN box scores / the ledger
    ledger = [
        dict(d='D1', what='Love INT: Claude U0.5 INT, Andy swapped to 1+ INT', winner='Andy', note='Love threw an INT; ticket lost on other legs'),
        dict(d='D2', what='Golden: Claude ATD (+200) in early draft, placed 57+ rec yds', winner='both hit', note='Golden 100 yds and a TD; ticket lost elsewhere'),
        dict(d='D3', what='GB ML swapped for ATL/GB U43.5', winner='neither', note='GB lost outright; total 49'),
        dict(d='D4', what='Claude flagged GB -4 / BUF -6.5 as overpriced; Andy placed', winner='Claude', note='GB lost 14-35; $60 ticket dead'),
        dict(d='D5', what='739211245 open spots PHI ML / BAL ML', winner='moot', note='ticket died before spots were filled'),
        dict(d='D6', what='Official 4-leg (SF -7.5 + 3 Unders) vs placed 5-leg (SF -7, +BUF -6.5)', winner='neither', note='both lost on CIN/PIT U43.5 (57)'),
        dict(d='D7', what='7b rebuilt to a 6-leg +5500 (Andy wanted +2000 or longer)', winner='Claude (legs)', note='dropped Roquan 8+ T+A and Cousins 2+ pass TD both hit; placed 6-leg lost'),
        dict(d='D8', what='Slot 4: Andy bought half-points and took BAL ML over BAL -3.5', winner='neither', note='ticket lost on U45 / TB ML'),
        dict(d='D9', what='Stack A swaps (Kittle ATD, Wiggins T+A out; Jeanty carries, Andrews 45+, Henry 83+, a Dallas safety tackles leg in)', winner='Claude (legs)', note='Kittle ATD and Wiggins 4+ both hit; Andrews and the safety tackles leg (swapped in) lost'),
        dict(d='D10', what='Stack B: Corum dropped, Nix INT / Dak 2+ TD / Shough rush / Juwan ATD boosters added', winner='neither', note='ticket lost'),
        dict(d='D11', what='SNF Tier 3: Andy rejected 1H U22.5 (halftime-kill risk)', winner='Claude (leg)', note='LAR led 16-0 at half: the Under hit, but Tier 3 still lost on Adams/Engram/Turner'),
    ]
    tally = collections.Counter(x['winner'] for x in ledger)
    out = dict(who=who, ai_split=ai_split, andy_split=andy_split, by_cat=by_cat, by_week=wk, filter=filt, filter_placed=filt_placed, by_nexp=by_nexp,
               ledger=ledger, ledger_tally=tally,
               caveat='W1-W2 legs not in the AI logs are tagged "unlogged" by Team 1 and grouped with Andy here; W3 has explicit andy/agree tags. AI-only legs are mostly unpriced in W1.')
    json.dump(out, open(os.path.join(OUT, 't2c_sources.json'), 'w'), indent=1, default=str)
    return out
if __name__ == '__main__':
    o = main()
    def f(r): return f"{r['w']}/{r['n']} ({(r['hit'] or 0)*100:.0f}%) priced {r['wp']}/{r['priced']} be {r['be'] and round(r['be']*100)}% roi {r['roi'] if r['roi'] is None else round(r['roi']*100)}% z {r['z']:.2f}"
    for w, v in o['who'].items(): print(w, '|', ' || '.join(f"{g}: {f(r)}" for g, r in v.items()))
    print('AI split'); [print('  ', g, f(r)) for g, r in o['ai_split'].items()]
    print('Andy split'); [print('  ', g, f(r)) for g, r in o['andy_split'].items()]
    print('WEEKS'); [print('  ', w, ' || '.join(f"{k[:8]} {f(r)}" for k, r in v.items())) for w, v in o['by_week'].items()]
    print('FILTER'); [print('  ', t, f(r)) for t, r in o['filter'].items()]
    print('FILTER placed'); [print('  ', t, f(r)) for t, r in o['filter_placed'].items()]
    print('NEXP'); [print('  ', t, f(r)) for t, r in o['by_nexp'].items()]
    print('CAT'); [print('  ', c, ' || '.join(f"{k[:8]} {v['w']}/{v['n']} roi {v['roi'] if v['roi'] is None else round(v['roi']*100)}" for k, v in d.items() if v['n'])) for c, d in o['by_cat'].items()]
    print(o['ledger_tally'])
