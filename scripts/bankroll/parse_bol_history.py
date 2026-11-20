#!/usr/bin/env python3
"""Parse BetOnline 'Transactions' table exports (tab-separated: ID, Date, Type, Product, Description, Amount).
  python scripts/bankroll/parse_bol_history.py data/bankroll/raw/bol-transaction-history-*.txt [...] [--out data/bankroll/bol-history.json]
Several files (pages / date ranges) are merged and de-duplicated by transaction ID; date gaps over 7 days are reported."""
import sys, re, json, datetime as dt, collections
args = [a for a in sys.argv[1:] if not a.startswith('--')]; out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else 'data/bankroll/bol-history.json'
args = [a for a in args if a != out]
rows = {}
for f in args:
    for line in open(f, encoding='utf-8', errors='replace'):
        p = [x.strip() for x in line.rstrip('\n').split('\t')]
        if len(p) < 6 or not p[0].isdigit(): continue
        amt = float(p[5].replace('$', '').replace(',', '').replace(' ', ''))
        rows[p[0]] = dict(id=p[0], at=dt.datetime.strptime(p[1], '%m/%d/%y %I:%M %p').isoformat(), type=p[2], product=p[3], desc=p[4], amount=amt)
R = sorted(rows.values(), key=lambda r: r['at'])
def kind(r):
    if r['type'] == 'Deposit': return 'deposit'
    if r['type'].startswith('Withdraw'): return 'withdrawal'
    if r['type'] == 'Bonus': return 'bonus'
    if r['product'] == 'Casino': return 'casino'
    if r['product'] == 'Contest': return 'contest'
    if r['type'] == 'Wager (Debit)': return 'wager_debit'
    if r['type'] == 'Wager (Credit)': return 'wager_credit'
    return 'other'
S = collections.defaultdict(lambda: [0, 0.0])
for r in R: r['kind'] = kind(r); S[r['kind']][0] += 1; S[r['kind']][1] += r['amount']
gaps = [(a['at'][:16], b['at'][:16]) for a, b in zip(R, R[1:]) if (dt.datetime.fromisoformat(b['at']) - dt.datetime.fromisoformat(a['at'])).days >= 7]
json.dump(dict(sources=args, rows=R, totals={k: dict(n=v[0], amount=round(v[1], 2)) for k, v in S.items()}, gaps=gaps), open(out, 'w'), indent=1)
print(f"{len(R)} rows  {R[0]['at'][:10]} .. {R[-1]['at'][:10]}")
for k, (n, a) in sorted(S.items()): print(f"  {k:13} {n:4}  ${a:10,.2f}")
print('  net change      ', f"${sum(r['amount'] for r in R):,.2f}")
print('gaps >= 7 days:', gaps or 'none'); print('->', out)
