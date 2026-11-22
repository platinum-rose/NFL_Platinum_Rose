import shutil, re
# ---- 1. build.py: move the hook from after rec-passes to right after the straight-bets block ----
p = 'scripts/master-intel/build.py'; shutil.copy(p, p + '.bak-claude-20261121-sat-gtmh2')
s = open(p, encoding='utf-8').read()
old = ("    if XI:  # 2026-11-21: Gun to my head section, inside the recommendations box (docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md)\n"
       "        try: L += _xi.gtmh_section(str(ROOT), a.season, WW)\n"
       "        except Exception as _e: print(f'WARN gtmh section: {_e}')\n")
assert s.count(old) == 1; s = s.replace(old, '')
anchor = "    L += ['</div>'] + RE\n    L += soft_block('rec-leans', 'section-rec')\n"
assert s.count(anchor) == 1
s = s.replace(anchor, "    L += ['</div>'] + RE\n"
                      "    if XI:  # 2026-11-21: Gun to my head, right below the Platinum Rose straight bets (Andy) - docs/specs/GUN_TO_MY_HEAD_PICKS_SPEC.md\n"
                      "        try: L += _xi.gtmh_section(str(ROOT), a.season, WW)\n"
                      "        except Exception as _e: print(f'WARN gtmh section: {_e}')\n"
                      "    L += soft_block('rec-leans', 'section-rec')\n")
open(p, 'w', encoding='utf-8').write(s)
# ---- 2. extra_inputs.py: card ids + quick-reference header (all sides, all totals) ----
p = 'scripts/master-intel/extra_inputs.py'; shutil.copy(p, p + '.bak-sat-gtmh2')
s = open(p, encoding='utf-8').read()
a = "        cards.append(f'<details class=\"gtmh-card\" data-tiers=\"{tiers}\"><summary>{summ}</summary>'"
assert s.count(a) == 1
s = s.replace(a, "        cards.append(f'<details class=\"gtmh-card\" id=\"gtmh-{_gslug(gid)}\" data-tiers=\"{tiers}\"><summary>{summ}</summary>'")
a = "    filt = ('<div class=\"gtmh-filter\">'"
assert s.count(a) == 1
s = s.replace(a, "    quick = _gtmh_quick(d)\n" + a)
a = "            '<div class=\"rollup-content\">', '', ' '.join(_GTMH_CSS.split()), f'<p style=\"font-size:.9rem\">{intro}</p>', filt, '', '</div>', '</details>', '']"
assert s.count(a) == 1
s = s.replace(a, "            '<div class=\"rollup-content\">', '', ' '.join(_GTMH_CSS.split()), f'<p style=\"font-size:.9rem\">{intro}</p>', quick, '', filt, '', '</div>', '</details>', '']")
helper = r'''

def _gslug(gid):
    return re.sub(r'[^a-z0-9]+', '-', str(gid).lower()).strip('-')


_BK = {'Bookmaker': 'BKR', 'BetOnline': 'BOL', 'DK Predictions': 'DKP'}


def _gtmh_quick(d):
    """Quick-reference header: every side call and every total call in two compact tables (kickoff order)."""
    e = html.escape
    def note(c):
        o = c.get('official') or ''
        if o.startswith('Official pick'): n = 'Official pick (Platinum Rose)'
        elif o.startswith('Card lean'): n = 'Card lean ' + o.split(':', 1)[-1].strip().split(' (')[0] + (' · <b>disagrees</b>' if c.get('official_conflict') else '')
        else: n = ''
        if c.get('supercontest'): n = (n + ' · ' if n else '') + 'SC: ' + e(c['supercontest'])
        if c.get('conditions'): n = (n + ' · ' if n else '') + '<i>conditional</i>'
        if c['call'] == 'Coin flip' and c.get('tips'): n = (n + ' · ' if n else '') + 'tips: ' + e(c['tips'][0])
        return n
    def best(c):
        b = c.get('best')
        if not b: return '—'
        ln = b['line']; ln = (('PK' if ln == 0 else f'{ln:+g}') if c['market'] == 'side' else f'{ln:g}')
        return f"{_BK.get(b['book'], b['book'])} {ln}" + (f" ({b['price']:+d})" if b.get('price') is not None else '')
    def table(market, title):
        rows = [c for c in d['calls'] if c['market'] == market]
        head = '<tr><th style="text-align:left">Game</th><th style="text-align:left">Call</th><th>Tier</th><th>Best fresh number</th><th style="text-align:left">Notes</th></tr>'
        body = ''.join(
            f'<tr><td style="text-align:left"><a href="#gtmh-{_gslug(c["game"])}">{e(c["game"].replace("@", " @ "))}</a> <small style="opacity:.65">{e(_pt(c.get("kickoff_utc")))}</small></td>'
            f'<td style="text-align:left"><b>{e(c["call"])}</b></td>'
            f'<td><span class="gtmh-badge t-{_TIER_CLS.get(c["tier"], "lean")}">{e(c["tier"])}</span></td>'
            f'<td>{e(best(c))}</td><td style="text-align:left">{note(c)}</td></tr>' for c in rows)
        return (f'<div style="font-weight:700;margin:10px 0 4px">{title} ({len(rows)})</div>'
                '<div style="overflow-x:auto"><table class="gtmh-quick-t" style="font-size:.85rem;width:100%;border-collapse:collapse;text-align:center">' + head + body + '</table></div>')
    return ('<div class="gtmh-quick"><div style="font-weight:700;font-size:1rem;margin-top:6px">Quick reference</div>'
            '<div class="gtmh-small">Every call at a glance, grouped by market in kickoff order. Tap a game for its full card below (why, for and against, prices, conditions).</div>'
            + table('side', 'All sides') + table('total', 'All totals') + '</div>')
'''
s = s.replace('\n\ndef gtmh_section(root, season, ww):', helper + '\n\ndef gtmh_section(root, season, ww):', 1)
assert '_gtmh_quick(d)' in s and 'def _gtmh_quick' in s
open(p, 'w', encoding='utf-8').write(s)
print('moved + quick reference')
