"""Fold the settled Week 3 MNF (PHI @ CHI) results into the Team 1 baseline for the T2 scripts.

Team 1's cum.json was built before MNF: it holds the Sunday tickets' PHI@CHI legs as 'pending' and does not hold the
MNF-only tickets (five BetOnline prop parlays, Novig credit #2). This reads the settled wagers file and
  1. resolves pending cum legs from the wagers-file leg status (same ticket id + selection),
  2. appends MNF-only tickets and their legs in Team 1's schema (origin 'agree' for Claude-recommended tickets,
     per reports/analysis/season/claude/provenance.json),
  3. adds any MNF cash payout to RET.
Disable with INCLUDE_MNF=0.
"""
import os, sys, json
HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '../../../season/claude/scripts')))
import lib as S  # season library (norm_leg, dec)

KEYMAP = {'tds': 'atd'}
RESMAP = {'WON': 'W', 'LOST': 'L', 'PUSH': 'P'}


def patch(tickets, legs, RET):
    W = S.load_wagers()
    prov = json.load(open(os.path.join(S.HERE, 'provenance.json')))['tickets']
    byid = {w['id']: w for w in W}
    status = {(w['id'], l.get('selection')): l for w in W for l in (w.get('legs') or [])}
    resolved = 0
    for l in legs:
        if l.get('result') == 'pending':
            wl = status.get((l.get('tid'), l.get('label')))
            if wl and wl.get('status') in RESMAP:
                l['result'] = RESMAP[wl['status']]; l['actual'] = wl.get('actual_stat'); resolved += 1
    have = {t['id'] for t in tickets}
    added = []
    for w in W:
        if w.get('week') != 3 or w['id'] in have or w.get('status') != 'SETTLED': continue
        if 'PHI @ CHI' not in (w.get('game') or '') and 'PHI' not in (w.get('game_title') or ''): continue
        origin = 'agree' if prov.get(w['id'], {}).get('by') in ('claude', 'mixed') else 'andy'
        tl = []
        for l in S.real_legs(w):
            n = S.norm_leg(l, w)
            if l.get('status') not in RESMAP: continue
            thr = n['need'] if n['need'] is not None else n['line']
            key = KEYMAP.get(n['key'], n['key']) if n['kind'] == 'prop' else None
            if n['key'] == 'tds': thr = n['need']
            leg = dict(label=l.get('selection'), kind=n['kind'], key=key, player=n['player'], team=n['team'], thr=thr,
                       dir=n['dir'] if n['kind'] in ('prop', 'total', 'team_total') else None, result=RESMAP[l['status']],
                       actual=l.get('actual_stat'), margin=None, game='PHI @ CHI', price=l.get('price'), team_won=None,
                       origin=origin, week=3, tid=w['id'])
            tl.append(leg); legs.append(leg)
        t = dict(week=3, id=w['id'], num=w.get('ticket_number'), book=w.get('book'), type=w.get('ticket_type'), title=w.get('game_title'),
                 stake=w.get('stake_usd'), funding=w.get('funding_type'), odds=w.get('odds_american'), placed_at=w.get('placed_at'), legs=tl)
        tickets.append(t); added.append(w['id'])
    for w in W:
        if w.get('week') == 3 and w.get('status') == 'SETTLED' and S.is_cash(w) and (w.get('settled_payout_usd') or 0) > 0:
            RET.setdefault(w['id'], float(w['settled_payout_usd']))
    return dict(resolved=resolved, added=added)
