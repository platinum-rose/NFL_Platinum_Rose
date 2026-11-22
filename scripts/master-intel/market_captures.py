"""Read the newest weekly saved captures by capture time, never mix stale prices."""
import json
import html
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
NICKS = dict(zip(
    'Cardinals Falcons Ravens Bills Panthers Bears Bengals Browns Cowboys Broncos Lions Packers Texans Colts Jaguars Chiefs Raiders Chargers Rams Dolphins Vikings Patriots Saints Giants Jets Eagles Steelers 49ers Seahawks Buccaneers Titans Commanders'.lower().split(),
    'ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LV LAC LAR MIA MIN NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS'.split()))

def team(name):
    words = str(name or '').split()
    return NICKS.get(words[-1].lower()) if words else None

def newest(prefix, week, date):
    found = []
    for path in (ROOT / 'data/generated/props').glob(f'{prefix}-*-week{int(week)}.json'):
        data = json.loads(path.read_text(encoding='utf-8'))
        stamp = data.get('capturedAt')
        if not stamp:
            continue
        at = datetime.fromisoformat(stamp.replace('Z', '+00:00'))
        if at.tzinfo is None: at = at.replace(tzinfo=timezone.utc)
        # --date is the requested capture day, not the date printed on an event.
        # 2026-11-14 (Claude): compare in Pacific time; --date is a PT day, so a 4:30 PM PT capture (00:30Z next day) belongs to it.
        at_pt = at.astimezone(ZoneInfo('America/Los_Angeles'))
        if at_pt.date().isoformat() > date or at_pt.year != int(date[:4]): continue
        found.append((at, str(path), data))
    if not found: return None, None
    _, path, data = max(found, key=lambda item: (item[0], item[1]))
    return path, data

def beo_rows(week, date):
    path, data = newest('betonline-live', week, date)
    if data is None:
        legacy = ROOT / f'data/generated/props/beo-w{int(week):02d}.json'
        return (str(legacy), json.loads(legacy.read_text(encoding='utf-8'))) if legacy.exists() else (None, [])
    rows = []
    for row in data.get('rows', []):
        parts = str(row.get('event') or row.get('game') or '').split(' @ ')
        if len(parts) != 2: continue
        away, home = map(team, parts)
        if not away or not home: continue
        rows.append(dict(row, game=f'{away}_{home}', market='atd' if row.get('market') == 'atd_1_plus' else row.get('market'),
                         capturedAt=row.get('capturedAt') or data.get('capturedAt'), line_kind='ou'))
    return path, rows

def _feed_as_live(data):
    """2026-11-14 (Claude, Andy OK'd): the DKP capture now writes draftkings-predictions-feed-<date>-week<N>.json
    (scripts/props/dkp-event-feed-capture.mjs, schema draftkings_predictions_feed_master_v1). Convert its rows to the
    older draftkings-predictions-live shape so build.py / site_extras.py read them unchanged.
    Game lines -> market 'game_lines' + bet spread/total/moneyline (side = team code or Over/Under).
    Player props -> the 'Over'/'Yes' side only (consumers price every DKP prop as over/yes); milestones use lineEquiv
    (e.g. 70+ -> 69.5). 1H/1Q lines, team totals, Under sides and 'No Touchdown Scorer' are left out."""
    bets = {'spread': 'spread', 'game_total': 'total', 'moneyline': 'moneyline'}
    names, rows = {}, []
    for r in data.get('rows', []):
        gid, m, side = r.get('game'), r.get('market'), r.get('side')
        if not gid or '@' not in gid: continue
        try: pct = int(str(r.get('pct') or '').rstrip('%'))
        except ValueError: pct = None
        base = dict(book='DKP', source='dkp_event_feed', event=gid, game=gid, available=True, player=r.get('player'), team=r.get('team'),
                    odds=r.get('american'), price=pct, probability=(pct / 100 if pct is not None else None),
                    sectionTitle=r.get('marketName'), marketTitle=r.get('marketName'), capturedAt=data.get('capturedAt'))
        if m in bets:
            if m != 'game_total':
                code = team(r.get('label'))
                if not code: continue
                names[code] = r.get('label'); side = code
            line = r.get('line')
            sel = f"{side} {'' if line is None else format(line, '+g') if m == 'spread' else line} ({r.get('pct')})".replace('  ', ' ')
            rows.append(dict(base, market='game_lines', bet=bets[m], side=side, line=line, selection=sel))
        elif r.get('player'):
            if r.get('kind') == 'milestone': side, line = 'Over', r.get('lineEquiv')
            elif side in ('Over', 'Yes'): line = r.get('line')
            else: continue
            rows.append(dict(base, market=m, bet='prop', side=side, line=line,
                             selection=f"{r['player']} {r.get('marketName')} {r.get('label') if r.get('kind') == 'milestone' else (side + ('' if line is None else ' ' + str(line)))} ({r.get('pct')})"))
    events = {}
    for row in rows:
        a, h = row['game'].split('@')
        ev = events.setdefault(row['game'], dict(away=names.get(a, a), home=names.get(h, h), capturedAt=data.get('capturedAt'), rows=[]))
        ev['rows'].append(row)
    return dict(data, events=list(events.values()), rows=rows)

def dkp_events(week, date):
    path, data = newest('draftkings-predictions-live', week, date)
    if data is None:
        path, data = newest('draftkings-predictions-feed', week, date)
        if data is not None: data = _feed_as_live(data)
    if data is None: return None, []
    events = []
    for event in data.get('events', []):
        away, home = team(event.get('away')), team(event.get('home'))
        if not away or not home: continue
        rows = []
        for row in event.get('rows', []):
            market = 'game_' + row['bet'] if row.get('market') == 'game_lines' else row.get('market')
            rows.append(dict(row, market=market, prob=row.get('probability'), capturedAt=data.get('capturedAt')))
        events.append(dict(event, gid=f'{away}@{home}', rows=rows, capturedAt=data.get('capturedAt')))
    return path, events

def reference_boards(week, date):
    """Complete saved menus, separate from recommendations and priced by source."""
    blocks = ['<section id="captured-market-menus"><h3>Latest captured menus — BKR, BEO, DKP and Kalshi</h3><p>Captured offers are reference material, not additional AI picks. Missing rows are not filled from older boards. DKP percentages are contract prices before fees, not sportsbook odds.</p>']
    for book, prefix in [('BKR', 'bookmaker-live'), ('BEO', 'betonline-live'), ('DKP', 'draftkings-predictions-live'), ('KAL', 'kalshi-props')]:
        path, data = newest(prefix, week, date)
        if data is None and book == 'DKP':  # 2026-11-14: event-feed capture fallback (see _feed_as_live)
            path, data = newest('draftkings-predictions-feed', week, date)
            if data is not None: data = _feed_as_live(data)
        if data is None: continue
        rows = data.get('rows') or [r for e in data.get('events', []) for r in e.get('rows', [])]
        grouped = defaultdict(list)
        for row in rows: grouped[row.get('event') or row.get('game') or 'Unknown game'].append(row)
        blocks.append(f'<details class="rollup-box"><summary>{book}: {len(grouped)} games · {len(rows)} captured rows · {html.escape(str(data.get("capturedAt")))}</summary><div class="rollup-content">')
        for event, entries in grouped.items():
            blocks.append(f'<details class="rollup-box"><summary>{html.escape(event)} · {len(entries)} rows</summary><div class="rollup-content"><table><thead><tr><th>Market</th><th>Selection</th><th>Price</th><th>Source</th></tr></thead><tbody>')
            for row in entries:
                market = row.get('sectionTitle') or row.get('marketTitle') or row.get('market') or ''
                selection = row.get('selection') or row.get('player') or row.get('side') or ''
                if row.get('available') is False: price = 'Unavailable at capture'
                elif book == 'DKP': price = f'{row.get("price")}% contract · before fees' if row.get('price') is not None else 'Price not captured'
                elif book == 'KAL': price = f'{round((row.get("yes_ask") or 0) * 100)}¢ ask · {row.get("american_ask_with_fee"):+d} incl. fee' if row.get('american_ask_with_fee') is not None else 'No ask'
                else: price = f'{row["odds"]:+g}' if row.get('odds') is not None else 'Price not captured'
                url = row.get('eventUrl') or ''
                source = f'<a href="{html.escape(url, quote=True)}">{book} captured market</a>' if url.startswith('https://') else f'{book} saved capture'
                blocks.append(f'<tr><td>{html.escape(market)}</td><td>{html.escape(selection)}</td><td>{html.escape(price)}</td><td>{source}</td></tr>')
            blocks.append('</tbody></table></div></details>')
        blocks.append('</div></details>')
    return ''.join(blocks) + '</section>'
