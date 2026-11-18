"""A4: closing-line value on what the capture recovered (W1-10). Main-line legs only for the headline
(price taken between -118 and +105 and not a live bet, so alt lines / bought points do not count as 'beating the close').
Also: does CLV predict results, and how good is ESPN's DK close vs our own BKR captures (sanity check).
Output: w10/a4_clv.json. Run from repo root."""
import json, sys, collections, glob, re
sys.path.insert(0, 'reports/analysis/season/claude/scripts'); import lib
M = 'reports/analysis/midseason-2026/'
D = json.load(open('data/official-picks/closing-line-values-2026.json')); GL = json.load(open('data/official-picks/closing-lines-2026.json'))['games']
legs = D['legs']
def main_line(r):
    d = lib.dec(r.get('price_taken'))
    if re.search(r'live|hedge', str(r.get('ticket_id')).lower()): return False   # live numbers are not comparable with a pre-game close
    return d is not None and 1.85 <= d <= 2.05   # -118 to +105: a bought half-point (-120 to -135) beats the close by construction, so it is not counted
def uq(rows):
    s = {}
    for r in rows: s[(r['week'], r['game'], r['market'], r.get('team'), r.get('direction'), r.get('line_taken'), str(r.get('price_taken')))] = r
    return list(s.values())
def summ(rows):
    p = [r for r in rows if r.get('clv_points') is not None]; n = len(p)
    if not n: return dict(n=0)
    g = [r for r in p if str(r.get('leg_status')).upper() in ('WON', 'LOST')]
    def rate(x): 
        w = sum(str(r['leg_status']).upper() == 'WON' for r in x); return f'{w}-{len(x) - w}' if x else None
    return dict(n=n, beat=sum(r['clv_points'] > 0 for r in p), equal=sum(r['clv_points'] == 0 for r in p), worse=sum(r['clv_points'] < 0 for r in p),
                avg_clv_pts=round(sum(r['clv_points'] for r in p) / n, 2), beat_pct=round(sum(r['clv_points'] > 0 for r in p) / n, 3),
                record_when_beat=rate([r for r in g if r['clv_points'] > 0]), record_when_equal=rate([r for r in g if r['clv_points'] == 0]), record_when_worse=rate([r for r in g if r['clv_points'] < 0]),
                small_n=n < 20)
placed = uq([r for r in legs if r['ledger'] == 'placed']); paper = uq([r for r in legs if r['ledger'] == 'paper'])
out = dict(coverage=dict(games=len(GL), games_with_close=sum(1 for g in GL if g.get('spread_home_close') is not None), legs=len(legs), unique_placed=len(placed), unique_paper=len(paper), skipped=D['summary']['skipped']),
           placed_all_lines=summ(placed), placed_main_lines=summ([r for r in placed if main_line(r)]), placed_alt_or_unpriced=summ([r for r in placed if not main_line(r)]),
           placed_main_by_market={m: summ([r for r in placed if main_line(r) and r['market'] == m]) for m in ('spread', 'total')},
           placed_main_by_period={k: summ([r for r in placed if main_line(r) and r['week'] in ws]) for k, ws in (('W1-4', range(1, 5)), ('W5-9', range(5, 10)), ('W10', [10]))},
           paper_main_lines=summ([r for r in paper if main_line(r)]))
ml = [r for r in placed if r['market'] == 'moneyline' and r.get('clv_prob') is not None]
out['placed_moneylines'] = dict(n=len(ml), beat=sum(r['clv_prob'] > 0.005 for r in ml), worse=sum(r['clv_prob'] < -0.005 for r in ml), avg_clv_prob=round(sum(r['clv_prob'] for r in ml) / max(1, len(ml)), 4))
# line movement toward / against our main-line picks: open -> close
mv = [r for r in placed if main_line(r) and r.get('line_open') is not None and r.get('clv_points') is not None]
out['timing'] = dict(n=len(mv), note='clv vs the OPEN shows whether waiting helped: positive = our number was better than the opener too',
                     better_than_open=sum(((r['line_taken'] - r['line_open']) if r['market'] == 'spread' else ((r['line_open'] - r['line_taken']) if r.get('direction') == 'over' else (r['line_taken'] - r['line_open']))) > 0 for r in mv))
# sanity check: ESPN DK close vs our BKR Saturday captures (W9, W10)
chk = []
for wk, p in ((9, 'reports/intel/w09-model/bkr-lines-2026-11-07.json'), (10, 'reports/intel/w10-model/bkr-lines-2026-11-13.json')):
    try: b = json.load(open(p))
    except Exception: continue
    rows = b.get('games') if isinstance(b, dict) and 'games' in b else ([dict(game=k, home_line=v[0], total=v[1]) for k, v in b.items() if isinstance(v, list) and len(v) >= 2] if isinstance(b, dict) else b)
    for g in rows or []:
        gid = (g.get('game') or '').replace(' ', ''); 
        if '@' not in gid: continue
        a, h = [lib.T(x) for x in gid.split('@')]
        e = next((x for x in GL if x['week'] == wk and lib.T(x['away']) == a and lib.T(x['home']) == h), None)
        hl = next((g[k] for k in ('home_line', 'bkr_home_line', 'spread_home', 'home_spread') if g.get(k) is not None), None); tt = next((g[k] for k in ('total', 'bkr_total') if g.get(k) is not None), None)
        if e and hl is not None and e.get('spread_home_close') is not None: chk.append((wk, gid, float(hl), e['spread_home_close'], None if tt is None else float(tt), e.get('total_close')))
if chk:
    out['espn_close_vs_bkr_capture'] = dict(games=len(chk), spread_within_1pt=sum(abs(c[2] - c[3]) <= 1 for c in chk), spread_mean_abs_diff=round(sum(abs(c[2] - c[3]) for c in chk) / len(chk), 2),
                                            total_within_1_5=sum(1 for c in chk if c[4] is not None and c[5] is not None and abs(c[4] - c[5]) <= 1.5),
                                            total_mean_abs_diff=round(sum(abs(c[4] - c[5]) for c in chk if c[4] is not None and c[5] is not None) / max(1, sum(1 for c in chk if c[4] is not None and c[5] is not None)), 2),
                                            biggest_gaps=sorted(chk, key=lambda c: -abs(c[2] - c[3]))[:5])
json.dump(out, open(M + 'w10/a4_clv.json', 'w'), indent=1)
for k, v in out.items(): print(k, json.dumps(v)[:600])
