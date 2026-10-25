"""Read the newest weekly saved captures by capture time, never mix stale prices."""
import json
import html
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

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
        if at.date().isoformat() > date or at.year != int(date[:4]): continue
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

def dkp_events(week, date):
    path, data = newest('draftkings-predictions-live', week, date)
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
    blocks = ['<section id="captured-market-menus"><h2>Latest captured menus — BKR, BEO and DKP</h2><p>Captured offers are reference material, not additional AI picks. Missing rows are not filled from older boards. DKP percentages are contract prices before fees, not sportsbook odds.</p>']
    for book, prefix in [('BKR', 'bookmaker-live'), ('BEO', 'betonline-live'), ('DKP', 'draftkings-predictions-live')]:
        path, data = newest(prefix, week, date)
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
                else: price = f'{row["odds"]:+g}' if row.get('odds') is not None else 'Price not captured'
                url = row.get('eventUrl') or ''
                source = f'<a href="{html.escape(url, quote=True)}">{book} captured market</a>' if url.startswith('https://') else f'{book} saved capture'
                blocks.append(f'<tr><td>{html.escape(market)}</td><td>{html.escape(selection)}</td><td>{html.escape(price)}</td><td>{source}</td></tr>')
            blocks.append('</tbody></table></div></details>')
        blocks.append('</div></details>')
    return ''.join(blocks) + '</section>'
