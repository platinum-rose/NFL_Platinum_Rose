"""Mid-season post-mortem step 1: one graded row per pick across layers (Weeks 1-9). Read-only on inputs.
Run from repo root: python3 reports/analysis/midseason-2026/build_picks.py
Inputs: reports/bets/season-recap/w{N}legs.json (placed legs + AI-only legs, graded by the weekly pipeline),
        w{N}paper.json (paper tickets), reports/intel/w{NN}-podcast-pick-grades.json (podcast picks).
Output: reports/analysis/midseason-2026/picks.jsonl, tickets.jsonl, coverage.json"""
import json, os, sys, collections
sys.path.insert(0, 'reports/analysis/season/claude/scripts')
import lib  # cash_stake / cash_return / family / legs_bucket, the same helpers scorecard.py uses
R = 'reports/bets/season-recap'; OUT = 'reports/analysis/midseason-2026'
rows, tickets, cov = [], [], collections.defaultdict(dict)
res_map = {'W': 'W', 'L': 'L', 'P': 'P', 'won': 'W', 'lost': 'L', 'push': 'P', 'win': 'W', 'loss': 'L'}
for w in range(1, 10):
    p = f'{R}/w{w}legs.json'
    if os.path.exists(p):
        d = json.load(open(p))
        orig = collections.defaultdict(set)
        for l in d.get('legs', []): orig[l.get('ticket')].add(l.get('origin'))
        for l in d.get('legs', []):
            rows.append(dict(week=w, layer='placed_leg', source=l.get('origin'), ai_src=l.get('ai_src') or [], game=l.get('game'), kind=l.get('kind'),
                             cat=l.get('cat'), group=l.get('group'), player=l.get('player'), key=l.get('key'), thr=l.get('thr'), dir=l.get('dir'),
                             label=l.get('label'), result=res_map.get(l.get('result'), l.get('result')), margin=l.get('margin'), ticket=l.get('ticket')))
        for l in d.get('ai_only', []):
            rows.append(dict(week=w, layer='ai_unplaced', source='ai', ai_src=[l.get('src')], game=l.get('game'), kind=l.get('kind'), cat=l.get('cat'),
                             group=l.get('group'), player=l.get('player'), key=l.get('key'), thr=l.get('thr'), dir=l.get('dir'), label=l.get('label'),
                             result=res_map.get(l.get('result'), l.get('result')), margin=l.get('margin')))
        cov[w]['placed_legs'] = len(d.get('legs', [])); cov[w]['ai_unplaced'] = len(d.get('ai_only', [])); cov[w]['tickets'] = len(d.get('tickets', []))
    p = f'{R}/w{w}paper.json'
    if os.path.exists(p):
        P = json.load(open(p)); n = 0
        for t in P:
            for l in t.get('legs', []):
                n += 1
                rows.append(dict(week=w, layer='paper_leg', source='paper', ticket=t.get('id') or t.get('name'), kind=l.get('kind'), key=l.get('key'),
                                 thr=l.get('thr'), player=l.get('player'), label=l.get('label'), result=res_map.get(l.get('result'), l.get('result')), margin=l.get('margin')))
        cov[w]['paper_legs'] = n
    p = f'reports/intel/w{w:02d}-podcast-pick-grades.json'
    if os.path.exists(p):
        G = json.load(open(p)); n = 0
        for g in G['grades']:
            if g.get('duplicate_of_earlier'): continue
            n += 1
            rows.append(dict(week=w, layer='podcast', source=g.get('outlet'), expert=g.get('speaker'), show=g.get('show'), game=g.get('game'),
                             kind=g.get('market'), label=g.get('pick'), line=g.get('line_stated'), price=g.get('price_stated'),
                             result=('V' if str(g.get('detail', '')).startswith('not in final box score') else {'ungradable': 'U'}.get(g['result'], g['result'])),
                             units=None if str(g.get('detail', '')).startswith('not in final box score') else g.get('units')))
        cov[w]['podcast'] = n
old = f'{OUT}/podcast_old_grades.jsonl'  # W3/W7 older formats (grade_podcasts_old.py)
if os.path.exists(old):
    for l in open(old):
        r = json.loads(l); rows.append(r); cov[r['week']]['podcast'] = cov[r['week']].get('podcast', 0) + 1
# tickets from the ledger with the scorecard's own cash rules (W1-4 legs files lack cash fields)
for x in lib.load_wagers():
    if x.get('status') != 'SETTLED' or not x.get('week') or x['week'] > 9: continue
    cash = lib.is_cash(x)
    tickets.append(dict(week=x['week'], id=x['id'], book=x.get('book'), family=lib.family(x), cash=cash, legs_bucket=lib.legs_bucket(x),
                        stake=round(lib.cash_stake(x), 2) if cash else 0.0, returned=round(lib.cash_return(x), 2) if cash else 0.0,
                        credit_stake=float(x.get('stake_usd') or 0) if not cash else 0.0, credit_return=round(lib.credit_return(x), 2) if not cash else 0.0,
                        result=x.get('result'), n_legs=len(x.get('legs') or []), title=x.get('game_title')))
with open(f'{OUT}/picks.jsonl', 'w') as f:
    for r in rows: f.write(json.dumps(r) + '\n')
with open(f'{OUT}/tickets.jsonl', 'w') as f:
    for t in tickets: f.write(json.dumps(t) + '\n')
json.dump({str(k): v for k, v in sorted(cov.items())}, open(f'{OUT}/coverage.json', 'w'), indent=1)
print(len(rows), 'pick rows;', len(tickets), 'tickets')
for k, v in sorted(cov.items()): print(k, v)
