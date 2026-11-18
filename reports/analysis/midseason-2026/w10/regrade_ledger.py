"""Independent re-grade of every NFL leg in the placed ledger (W1-10) from cached ESPN box scores (lib.grade),
compared with the stored leg status and the ticket result. Read-only. Output: w10/ledger_regrade.json
Run from repo root: python3 reports/analysis/midseason-2026/w10/regrade_ledger.py"""
import json, sys, collections
sys.path.insert(0, 'reports/analysis/season/claude/scripts')
import lib
G = lib.load_games(); W = lib.load_wagers()
mis, tick, stats, ungr = [], [], collections.Counter(), collections.Counter()
for w in W:
    wk = w.get('week')
    if not wk or wk > 10: continue
    regr = []
    for l in lib.real_legs(w):
        n = lib.norm_leg(l, w); g = lib.game_for(G, wk, n['game'])
        if not g and l.get('kickoff_utc'):  # cross-week leg
            for dw in (-1, 1):
                g = g or lib.game_for(G, wk + dw, n['game'])
        st, txt, _ = lib.grade(n, g) if n['kind'] != 'cfb' and n['key'] not in ('open', 'other') else (None, 'skip', None)
        stored = str(l.get('status')).upper()
        regr.append(st)
        if st is None: ungr[(wk, n['key'], txt[:30])] += 1; continue
        stats[(wk, 'legs')] += 1
        if stored in ('WON', 'LOST', 'PUSH') and stored != st:
            stats[(wk, 'mismatch')] += 1
            mis.append(dict(week=wk, ticket=w['id'], sel=l.get('selection'), dir=n['dir'], line=n['line'], need=n['need'], stored=stored,
                            regrade=st, actual=txt, stored_actual=l.get('actual_stat'), ticket_result=w.get('result'), note=(l.get('grading_note') or l.get('regrade_note') or '')[:120]))
        elif stored not in ('WON', 'LOST', 'PUSH'):
            stats[(wk, 'stored_' + stored)] += 1
    # ticket-level: straight parlays only
    if w.get('status') == 'SETTLED' and not w.get('round_robin') and 'robin' not in str(w.get('ticket_type')).lower() and len(regr) and None not in regr:
        exp = 'loss' if 'LOST' in regr else 'win'
        if 'pick6' in str(w.get('book')).lower() or 'Pick6' in str(w.get('ticket_type')): continue
        if w.get('result') in ('win', 'loss') and w['result'] != exp:
            tick.append(dict(week=wk, ticket=w['id'], stored=w['result'], regrade=exp, legs=regr, profit=w.get('profit_usd'), type=w.get('ticket_type')))
out = dict(leg_mismatches=mis, ticket_mismatches=tick, stats={f'{k[0]}:{k[1]}': v for k, v in sorted(stats.items())},
           ungradable={f'{k}': v for k, v in sorted(ungr.items(), key=str)})
json.dump(out, open('reports/analysis/midseason-2026/w10/ledger_regrade.json', 'w'), indent=1)
print(json.dumps(out['stats'])); print('leg mismatches', len(mis)); print('ticket mismatches', len(tick))
for m in mis: print(m['week'], m['ticket'][-45:], '|', m['sel'], '| stored', m['stored'], 'regrade', m['regrade'], 'actual', m['actual'], '/', m['stored_actual'], '| tkt', m['ticket_result'], '|', m['note'][:70])
for t in tick: print('TICKET', t)
print('ungradable', sum(ungr.values())); 
for k, v in sorted(ungr.items(), key=lambda x: -x[1])[:25]: print(' ', k, v)
