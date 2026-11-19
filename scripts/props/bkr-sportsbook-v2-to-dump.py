#!/usr/bin/env python3
"""Convert a Bookmaker "new sportsbook" (Angular /sportsbook, Nov 2026) block capture into the old SGP dump format
(EVENT| / T| / I| lines) read by scripts/props/bookmaker-sgp-dump-parse.mjs. Read-only; written 2026-11-06 when the old
/en/sports/football/nfl/game-lines/ pages started redirecting to /sportsbook.

Input JSON (from the in-page capture): {"games": [{"head": "Back <Away> VS <Home> NOV 8 ...", "url": "...", "at": ISO,
  "blocks": {"<h4 header>": "<block innerText>"}}]}
usage: python3 scripts/props/bkr-sportsbook-v2-to-dump.py <capture.json> <out.raw.txt>"""
import json, re, sys
ODDS = re.compile(r'^([+-]\d+|EV|EVEN)$')
PERIODS = ('First Half', 'Second Half', 'First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter')
def o(x): return '+100' if x in ('EV', 'EVEN') else x
def sp(x): return '+0' if (x or '').upper() in ('PK', 'PICK') else x

def game_block(away, home, lines, title):
    """AWAY / HOME, MONEY LINE, TOTAL, SPREAD, name1, name2, <count>, ml1, ml2, Ov X, o, Un X, o, sp1, o, sp2, o (column-major)."""
    i = lines.index('SPREAD') + 1; n1, n2 = lines[i], lines[i + 1]; rest = lines[i + 2:]
    if rest and re.match(r'^\+\d+$', rest[0]) and len(rest) >= 11: rest = rest[1:]   # "+16" more-markets counter
    ml1, ml2, ov, oo, un, uo, s1, so1, s2, so2 = (rest + [None] * 10)[:10]
    out = [f'T|{title}']
    if s1 and so1 and s2 and so2: out += [f'I|{n1} {sp(s1)}{o(so1)}', f'I|{n2} {sp(s2)}{o(so2)}']   # 2026-11-19: skip a half-posted spread
    if ov and ov.startswith('Ov '): out += [f'I|Over {ov[3:]}{o(oo)}', f'I|Under {un[3:]}{o(uo)}']
    if ml1 and ODDS.match(ml1): out += ['I|Money Line', f'I|{n1} {o(ml1)}', f'I|{n2} {o(ml2)}']
    return out

def generic(header, lines):
    out = [f'T|{header}']; lab = []
    for x in lines:
        if ODDS.match(x):
            if len(lab) >= 2 and re.match(r'^(Ov|Un) ', lab[-1]):
                name = ' '.join(lab[:-1]); side = 'Over' if lab[-1].startswith('Ov') else 'Under'
                out.append(f'I|{name} - {side} {lab[-1][3:]}{o(x)}')
            elif len(lab) == 1 and re.match(r'^(Ov|Un) ', lab[0]):
                out.append(f"I|{'Over' if lab[0].startswith('Ov') else 'Under'} {lab[0][3:]}{o(x)}")
            elif lab:
                out.append(f"I|{' '.join(lab)} {o(x)}")
            lab = []
        else: lab.append(x)
    return out

def main(src, dst):
    cap = json.load(open(src, encoding='utf-8')); L = []; stats = []
    for g in cap['games']:
        h = re.sub(r'^Back\s+', '', g['head'])
        m = re.search(r'^(.*)\s+VS\s+(.+?)\s+[A-Z]{3} \d', h)
        left, home = m.group(1).strip(), m.group(2).strip()
        away = left.split(f' vs {home} ')[-1].strip() if f' vs {home} ' in left else left
        L.append(f"EVENT|{away} @ {home}|{g['url']}|{g['at']}")
        blocks = g['blocks']; nb = 0
        main_key = next((k for k, v in blocks.items() if 'MONEY LINE' in v.split('\n') and 'SPREAD' in v.split('\n') and k not in PERIODS), None)
        order = ([main_key] if main_key else []) + [k for k in blocks if k != main_key]
        for k in order:
            lines = [x.strip() for x in blocks[k].split('\n') if x.strip() and x.strip() != 'SGP']
            if lines and lines[0] == k: lines = lines[1:]
            if 'MONEY LINE' in lines and 'SPREAD' in lines:
                title = 'Game' if k == main_key else f'{away} vs {home} {k}'
                L += game_block(away, home, lines, title)
            else: L += generic(k, lines)
            nb += 1
        stats.append(f'{away} @ {home}: {nb} blocks')
    L.append(f"END|{len(cap['games'])}")
    open(dst, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')  # LF on Windows too: the parser splits on \n
    print('\n'.join(stats)); print(f'-> {dst} ({len(L)} lines)')

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
