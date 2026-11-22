p = 'scripts/master-intel/gun_to_my_head.py'; s = open(p, encoding='utf-8').read()
a = "why = f\"The evidence does not separate the two sides: {n_for} families each way\" + (' or too few with data' if n_for == 0 else '') + '. No side is named.'"
b = "why = (f\"The evidence does not separate the two sides: {n_for} {'family' if n_for == 1 else 'families'} each way.\" if n_for else 'No evidence family points either way.') + ' No side is named.'"
assert s.count(a) == 1; s = s.replace(a, b); open(p, 'w', encoding='utf-8').write(s)
p = 'scripts/master-intel/extra_inputs.py'; s = open(p, encoding='utf-8').read()
a = "f\"{'Side' if c['market'] == 'side' else 'Total'}: <b>{e(c['call'])}</b> <span class=\\\"gtmh-badge t-{_TIER_CLS.get(c['tier'], 'lean')}\\\">{e(c['tier'])}</span>\" for c in cs)"
b = "f\"{'Side' if c['market'] == 'side' else 'Total'}: \" + ('' if c['call'] == 'Coin flip' else f\"<b>{e(c['call'])}</b> \") + f\"<span class=\\\"gtmh-badge t-{_TIER_CLS.get(c['tier'], 'lean')}\\\">{e(c['tier'])}</span>\" for c in cs)"
assert s.count(a) == 1, 'summary'; s = s.replace(a, b)
a = "f\"{'side' if c['market'] == 'side' else 'total'} <b>{e(c['call'])}</b> ({e(c['tier'])})\""
b = "(f\"{'side' if c['market'] == 'side' else 'total'} <b>Coin flip</b>\" if c['call'] == 'Coin flip' else f\"{'side' if c['market'] == 'side' else 'total'} <b>{e(c['call'])}</b> ({e(c['tier'])})\")"
assert s.count(a) == 1, 'line'; s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('polished')
