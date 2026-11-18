"""Season bankroll under each definition found in the repo/handoffs, by week. Read-only.
Run from repo root: python3 reports/analysis/midseason-2026/w10/bankroll_reconcile.py"""
import json, collections
L = json.load(open('data/official-picks/user-placed-wagers-2026.json'))
def f(x):
    try: return float(x)
    except (TypeError, ValueError): return 0.0
def promo(w): return w.get('funding_type') in ('promo_credit', 'free_bet') or bool(w.get('is_promo_credit'))
def exempt(w): return bool(w.get('bankroll_exempt') or w.get('exclude_from_andy_bankroll') or w.get('exclude_from_bankroll'))
def share(w):
    s = w.get('ownership_shares')
    if isinstance(s, dict) and 'Andy' in s: return f(s['Andy'])
    if w.get('is_split'): return 1 / (w.get('split_count') or 2)
    return 1.0
def profit(w): return f(w.get('profit_usd'))
def cash_net(w): return (f(w.get('settled_payout_usd')) - f(w.get('stake_usd'))) if not promo(w) else 0.0   # scorecard (lib): full ticket, cash only
D = {
 'A profit_usd x Andy share, excl bankroll_exempt (handoff recipe)': lambda w: 0 if exempt(w) else profit(w) * share(w),
 'B profit_usd full ticket, excl bankroll_exempt': lambda w: 0 if exempt(w) else profit(w),
 'C scorecard lib: cash tickets, payout - stake, full ticket': cash_net,
 'D scorecard cash, x Andy share': lambda w: cash_net(w) * share(w),
 'E scorecard cash, excl exempt, x share': lambda w: 0 if exempt(w) else cash_net(w) * share(w),
 'F exempt tickets only: profit_usd': lambda w: profit(w) if exempt(w) else 0,
 'G exempt tickets only: profit x share': lambda w: profit(w) * share(w) if exempt(w) else 0,
 'H promo tickets: profit_usd': lambda w: profit(w) if promo(w) else 0,
}
S = [w for w in L if w.get('status') == 'SETTLED']
print('settled', len(S), 'of', len(L), '| pending:', [(w['week'], w['id'][-40:]) for w in L if w.get('status') != 'SETTLED'])
wk = sorted({w['week'] for w in S})
print(f"{'def':66s}" + ''.join(f'{"W"+str(k):>9s}' for k in wk) + f'{"W1-9":>10s}{"W1-10":>10s}')
res = {}
for name, fn in D.items():
    by = collections.defaultdict(float)
    for w in S: by[w['week']] += fn(w)
    res[name] = {k: round(v, 2) for k, v in by.items()}
    print(f'{name:66s}' + ''.join(f'{by[k]:9.2f}' for k in wk) + f'{sum(by[k] for k in wk if k<=9):10.2f}{sum(by[k] for k in wk if k<=10):10.2f}')
# field coverage
c = collections.Counter()
for w in S:
    c[('exempt' if exempt(w) else 'counted', 'promo' if promo(w) else 'cash', 'shares' if isinstance(w.get('ownership_shares'), dict) else ('is_split' if w.get('is_split') else 'solo/unknown'), str(w.get('book'))[:22])] += 1
for k, v in sorted(c.items()): print(v, k)
# promo tickets not flagged exempt, cash tickets flagged exempt, split tickets w/o ownership_shares
print('\npromo & not exempt:', sum(1 for w in S if promo(w) and not exempt(w)), 'profit', round(sum(profit(w) for w in S if promo(w) and not exempt(w)), 2))
print('split (is_split) without ownership_shares:', sum(1 for w in S if w.get('is_split') and not isinstance(w.get('ownership_shares'), dict)),
      'profit', round(sum(profit(w) for w in S if w.get('is_split') and not isinstance(w.get('ownership_shares'), dict)), 2))
print('profit_usd missing on settled:', [w['id'] for w in S if w.get('profit_usd') is None])
bad = [(w['week'], w['id'][-38:], w.get('profit_usd'), round(f(w.get('settled_payout_usd')) - f(w.get('stake_usd')), 2), w.get('funding_type')) for w in S
       if not promo(w) and abs(profit(w) - (f(w.get('settled_payout_usd')) - f(w.get('stake_usd')))) > 0.02]
print('cash tickets where profit_usd != payout - stake:', len(bad), 'sum diff', round(sum(b[2] - b[3] for b in bad if b[2] is not None), 2))
for b in bad[:25]: print('  ', b)
json.dump(res, open('reports/analysis/midseason-2026/w10/bankroll_reconcile.json', 'w'), indent=1)
