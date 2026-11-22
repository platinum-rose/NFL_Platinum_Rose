import json, re
p = 'reports/intel/supercontest-pitches-2026-w11.json'
d = json.load(open(p, encoding='utf-8')); P = d['picks']
P['NYJ']['pushback'][1]['text'] = '75% of BetMGM money was on the Chargers -3 (John Ewing), and the Jets travel three time zones to the West Coast, so the public and the travel spot both lean against New York.'
P['TEN']['pushback'][0]['text'] = "Tennessee's pass defense ranks last in the NFL (xEP Network rates Dak Prescott's matchup 100/100), and RB Tyjae Spears went to IR on Saturday, concentrating the backfield on Tony Pollard."
for t, v in P.items():
    for k in ('pitch', 'pushback'):
        for i, b in enumerate(v[k], 1):
            x = b['text']
            if len(x) < 120 or not re.search(r'\d', x) or re.search(r'(?i)(rushing|passing|receiving) yards', x): print('BAD', t, k, i, len(x))
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('ok')
