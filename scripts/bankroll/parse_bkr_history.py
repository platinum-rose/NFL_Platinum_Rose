#!/usr/bin/env python3
"""Parse a Bookmaker 'Transaction history' copy-paste into wagers and cashier rows (Andy 2026-11-18).
  python scripts/bankroll/parse_bkr_history.py data/bankroll/raw/bkr-transaction-history-<date>.txt [--out data/bankroll/bkr-history-<date>.json]
Wager result amounts are net (Won = profit, Lost = net loss; partial round-robin losses show the net)."""
import re, json, sys, datetime as dt
src = sys.argv[1]; out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else src.replace('/raw/', '/').replace('.txt', '.json')
L = [l.strip() for l in open(src, encoding='utf-8', errors='replace')]
money = lambda s: float(s.replace('$', '').replace(',', '')) if re.fullmatch(r'-?\$[\d,]+(\.\d+)?', s or '') else None
wagers, cash = [], []
for i, l in enumerate(L):
    m = re.match(r'^#(\d+) - \w+, (\w+ \d+), (\d+:\d+ [AP])\.M\.$', l)
    if m:
        d = dt.datetime.strptime(f"{m.group(2)} 2026 {m.group(3)}M", '%B %d %Y %I:%M %p')
        j = i + 1; assert L[j] == 'Wager'; stake = money(L[j + 1]); j += 2
        odds = L[j] if re.fullmatch(r'[+-]\d+', L[j]) else None; j += 1 if odds else 0
        res = L[j]; amt = money(L[j + 1])
        title = L[i - 1]
        if re.match(r'^(Spread betting|Money Line|Total Betting)$', title): title = L[i - 6] if L[i-6].startswith(('Win','Lose','Push')) else title
        k = i - 1
        while k > 0 and not re.match(r'^(Win|Lose|Push|Cancel)', L[k]) and k > i - 8 and not L[k].isupper() and not L[k].startswith(('SGP','COMPACT','2 TEAM','3 TEAM','4 TEAM')) and not re.search(r'PARLAY|TEASER|ROBIN', L[k], re.I): k -= 1
        wagers.append(dict(ticket=m.group(1), placed=d.isoformat(), title=L[k], stake=stake, odds=odds, result=res, net=amt))
        continue
    m = re.match(r'^(\d{2})/(\d{2}) @ (\d+:\d+ [AP])\.M\.$', l)
    if m:
        amt = money(L[i + 1]); ref = L[i - 1]; lab = L[i - 2]
        d = dt.datetime.strptime(f"2026-{m.group(1)}-{m.group(2)} {m.group(3)}M", '%Y-%m-%d %I:%M %p')
        if lab.startswith('Cancelled PO'): kind = 'withdrawal_cancelled_credit'
        elif amt < 0 and 'BTC' in lab: kind = 'withdrawal'
        elif amt < 0: kind = 'withdrawal_request_debit'
        else: kind = 'deposit'
        cash.append(dict(at=d.isoformat(), type=kind, amount=amt, ref=ref.split()[0], label=lab))
wagers.sort(key=lambda w: w['placed']); cash.sort(key=lambda c: c['at'])
json.dump(dict(source=src, wagers=wagers, cashier=cash), open(out, 'w'), indent=1)
dep = sum(c['amount'] for c in cash if c['type'] == 'deposit')
wd = -sum(c['amount'] for c in cash if c['type'] in ('withdrawal', 'withdrawal_request_debit')) - sum(c['amount'] for c in cash if c['type'] == 'withdrawal_cancelled_credit')
net = sum(w['net'] for w in wagers)
print(f"wagers {len(wagers)}  won {sum(w['result']=='Won' for w in wagers)}  lost {sum(w['result']=='Lost' for w in wagers)}  staked ${sum(w['stake'] for w in wagers):,.2f}  net ${net:,.2f}")
print(f"deposits {sum(c['type']=='deposit' for c in cash)} = ${dep:,.2f}   withdrawals (net of cancelled) = ${wd:,.2f}")
print(f"implied balance (settled only) = ${dep - wd + net:,.2f}")
for c in cash: print('  ', c['at'][:16], c['type'], c['amount'])
print('->', out)
