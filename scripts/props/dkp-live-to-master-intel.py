#!/usr/bin/env python3
"""Convert draftkings-predictions-live-<date>-<away>-at-<home>.json (cron-dkp-scrape.mjs output,
schema draftkings_predictions_v1) into dk-predictions-<date>-<away>-at-<home>.json
(dk_predictions_markets_v1) which scripts/master-intel/build.py reads. Read-only on the source.
Usage: python3 scripts/props/dkp-live-to-master-intel.py 2026-10-17"""
import glob, json, os, sys
date = sys.argv[1]
base = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'generated', 'props')
def amer(p):  # contract price -> american (pre-fee)
    return round(-100 * p / (1 - p)) if p >= .5 else round(100 * (1 - p) / p)
n = 0
for f in sorted(glob.glob(os.path.join(base, f'draftkings-predictions-live-{date}-*-at-*.json'))):
    d = json.load(open(f, encoding='utf-8'))
    away, home = [s.strip() for s in d['event'].split('@')]
    ab = {away.split()[0]: away, home.split()[0]: home}
    rows = []
    for r in d['rows']:
        if not r.get('available', True): continue
        m, p = r['market'], r['probability']
        if m == 'game_lines':
            b = r['bet']
            side = ab.get(r['side'], r['side']) if b != 'total' else r['side']
            rows.append({'market': 'game_' + b, 'side': side, 'line': r.get('line'), 'prob': p, 'american_gross': r.get('odds', amer(p))})
        elif m in ('atd_1_plus', 'first_td', 'two_plus_td'):
            rows.append({'market': 'td_2_plus' if m == 'two_plus_td' else m, 'side': r['player'], 'line': None, 'prob': p, 'american_gross': r.get('odds', amer(p))})
    from collections import Counter
    out = {'schema': 'dk_predictions_markets_v1', 'source_file': os.path.basename(f), 'event': d['event'], 'away': away, 'home': home,
           'captured_at': d['capturedAt'],
           'note': 'prob = DK Predictions contract buy price per side (not sportsbook odds); american_gross is pre-fee. Converted from cron-dkp-scrape live capture. Game lines + TD scorer boards only (no yardage ladders in this capture).',
           'summary': dict(Counter(x['market'] for x in rows)), 'rows': rows}
    slug = os.path.basename(f).split(f'{date}-')[1]
    json.dump(out, open(os.path.join(base, f'dk-predictions-{date}-{slug}'), 'w', encoding='utf-8'), indent=1)
    n += 1
print('converted', n)
