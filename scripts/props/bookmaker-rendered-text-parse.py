#!/usr/bin/env python3
"""Parse Andy-supplied Bookmaker.eu RENDERED PAGE TEXT captures (select-all/copy of a game page).
Read-only. This is NOT the EVENT|T|I sgp-dump format and is not validated by bookmaker-sgp-dump-parse.mjs.
Usage: bkr_rendered_parse.py --date 2026-10-03 --out-dir DIR FILE [FILE...]
"""
import argparse, json, re, hashlib, pathlib, datetime, collections
ap = argparse.ArgumentParser()
ap.add_argument('--date', required=True); ap.add_argument('--out-dir', required=True); ap.add_argument('files', nargs='+')
a = ap.parse_args()
LINE_ODDS = re.compile(r'^([+-]?\d+(?:\.\d+)?)([+-]\d{3,5})$')
ODDS = re.compile(r'^([+-]\d{3,5})$')
SUBLABEL = re.compile(r'^(\+ \d+ (Spread|Total)|Spread|Total|Money Line)$')
CLOCK = re.compile(r'(\d{2}:\d{2}:\d{2}) UTC([+-]\d{2}:\d{2})')
LADDER = re.compile(r'^(.*\S) (\d+)\+$')
OU = re.compile(r'^(.*\S) - (Over|Under)$')
def kind(title):
    t = title.split(': ', 1)[-1]
    if title == 'Game' or re.search(r'(First|Second) (Half|Quarter)$|(Third|Fourth) Quarter$', title) and ': ' not in title: return 'game_period_lines'
    if re.search(r'Team Total', t): return 'team_total'
    if re.search(r'\b(Total (Passing|Pass|Receiving|Rushing|Receptions|Carries)|Total Passing Touchdowns)', t): return 'player_total_ou'
    if re.search(r'(Passing Yards|Pass Completions|Receiving Yards|Receptions|Rushing Yards|Carries|Passing Touchdowns|TD Passes)$', t): return 'player_ladder'
    if re.search(r'Touchdown|TD Scorer|Scorer', t): return 'touchdown_scorer'
    return 'game_prop'
games, all_rows = [], []
for f in a.files:
    p = pathlib.Path(f); raw = p.read_bytes(); txt = raw.decode('utf-8-sig').replace('\r\n', '\n').replace('\r', '\n')
    L = [x.strip() for x in txt.split('\n')]
    m = CLOCK.search(txt); clock = (m.group(1) + ' UTC' + m.group(2)) if m else None
    # header: "<away>" "@" "<home>" after "Back to Schedule"; kickoff line like 10/0406:30
    away = home = kickoff = None
    for i, x in enumerate(L):
        if x == '@' and i > 0: away, home = L[i-1], L[i+1]; 
        if away and re.match(r'^\d{2}/\d{2}\d{2}:\d{2}$', x): kickoff = x[:5] + ' ' + x[5:]; break
    start = next((i for i in range(len(L)-1) if L[i+1] == 'SGP'), None)
    end = next((i for i, x in enumerate(L) if x == 'Bet Slip'), len(L))
    secs, cur, i = [], None, start
    notes = []
    while start is not None and i < end:
        x = L[i]
        if not x: i += 1; continue
        is_title = (L[i+1] == 'SGP' if i+1 < end else False) or (' vs ' in x)
        if is_title:
            cur = {'title': x, 'sgp': L[i+1] == 'SGP', 'kind': kind(x), 'items': []}; secs.append(cur)
            i += 2 if cur['sgp'] else 1; sub = None; continue
        if SUBLABEL.match(x):
            sub = x; i += 1; continue
        if LINE_ODDS.match(x) or ODDS.match(x):
            notes.append(f'orphan price line {x!r} at line {i+1} in {cur and cur["title"]!r}'); i += 1; continue
        nxt = L[i+1] if i+1 < end else ''
        mo = LINE_ODDS.match(nxt); mo2 = ODDS.match(nxt)
        it = {'submarket': sub, 'selection': x, 'line': None, 'odds': None, 'priced': False, 'raw_price': None}
        if mo: it.update(line=float(mo.group(1)), odds=int(mo.group(2)), priced=True, raw_price=nxt); i += 2
        elif mo2: it.update(odds=int(mo2.group(1)), priced=True, raw_price=nxt); i += 2
        else: i += 1
        ml = LADDER.match(x); mou = OU.match(x)
        if cur['kind'] in ('player_total_ou',) and mou: it['player'], it['side'] = mou.group(1), mou.group(2)
        elif cur['kind'] == 'player_ladder' and ml: it['player'], it['threshold'] = ml.group(1), int(ml.group(2))
        elif cur['kind'] == 'touchdown_scorer': it['player'] = x
        cur['items'].append(it)
    sec_out = []
    for s in secs:
        n_p = sum(1 for t in s['items'] if t['priced'])
        s['priced_count'], s['unpriced_count'] = n_p, len(s['items']) - n_p
        s['state'] = 'empty' if not s['items'] else ('priced' if n_p == len(s['items']) else ('no_price' if n_p == 0 else 'partially_priced'))
        sec_out.append(s)
        for t in s['items']:
            all_rows.append({'game_file': p.name, 'event': f'{away} @ {home}', 'section_title': s['title'], 'sgp_badge': s['sgp'], 'section_kind': s['kind'], **t, 'available': t['priced']})
    sg = [s for s in secs if s['sgp']]
    summ = {'source_file': str(p).split('NFL_Dashboard/')[-1], 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
            'event': f'{away} @ {home}', 'kickoff_display': kickoff, 'page_clock_at_capture': clock,
            'body_found': start is not None, 'bet_slip_terminator_found': end < len(L),
            'sections_total': len(secs), 'sgp_sections': len(sg),
            'sgp_sections_with_any_price': sum(1 for s in sg if s['priced_count'] > 0),
            'sgp_sections_no_price': sum(1 for s in sg if s['priced_count'] == 0),
            'sgp_sections_partially_priced': sum(1 for s in sg if 0 < s['priced_count'] < len(s['items'])),
            'selections_total': sum(len(s['items']) for s in secs), 'selections_priced': sum(s['priced_count'] for s in secs),
            'sgp_selections_priced': sum(s['priced_count'] for s in sg),
            'by_kind': dict(collections.Counter(s['kind'] for s in secs)),
            'unpriced_sgp_section_titles': [s['title'] for s in sg if s['priced_count'] == 0],
            'parser_notes': notes}
    games.append({'summary': summ, 'sections': sec_out})
out = pathlib.Path(a.out_dir); out.mkdir(parents=True, exist_ok=True)
doc = {'schema': 'bookmaker_rendered_text_v1', 'derived_from': 'Andy-supplied Bookmaker.eu rendered page text (copy of rendered page); NOT the EVENT|T|I sgp-dump format',
       'capture_date': a.date, 'generated_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
       'caveats': ['SGP badge = section displayed as SGP-eligible at capture time; it does not guarantee any combination is accepted or keeps its price.',
                   'Prices are a read-only reference snapshot, not proof of executable price after capture.',
                   'Alt-line expanders (+ N Spread / + N Total) were not expanded in the source; only displayed main lines are present.',
                   'A selection with no price means none was displayed at capture time (pulled/unpriced); it is a status question, not an injury fact.'],
       'games': [g['summary'] for g in games]}
(out / f'bookmaker-rendered-{a.date}-week4.summary.json').write_text(json.dumps(doc, indent=1))
(out / f'bookmaker-rendered-{a.date}-week4.json').write_text(json.dumps({**doc, 'rows': all_rows}, indent=1))
for g in games:
    s = g['summary']; print(f"{s['source_file'].split('/')[-1]:24} {s['event'][:44]:44} clock={s['page_clock_at_capture']} sec={s['sections_total']:3} sgp={s['sgp_sections']:3} sgp_priced={s['sgp_sections_with_any_price']:3} sgp_noprice={s['sgp_sections_no_price']:3} partial={s['sgp_sections_partially_priced']} sel={s['selections_total']:4} priced={s['selections_priced']:4} notes={len(s['parser_notes'])} kinds={s['by_kind']}")
