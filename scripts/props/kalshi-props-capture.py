#!/usr/bin/env python3
"""Kalshi NFL player-prop capture (read-only, public trade API; no account). Added 2026-11-14 (Claude, Andy asked).

Kalshi lists player props as ladders ("Jared Goff: 250+ passing yards" = Over 249.5). Each row keeps the yes bid/ask
(dollars = probability), last trade, and an American price for buying Yes at the ask *including* Kalshi's taker fee
(~0.07 * p * (1 - p) per contract), so it can be compared with sportsbook prices.

Usage:  python scripts/props/kalshi-props-capture.py --week 10 [--date 2026-11-14]
Writes: data/generated/props/kalshi-props-<date>-week<N>.json   (date = Pacific capture day by default)
"""
import argparse, datetime, json, re, urllib.request, zoneinfo
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
API = 'https://api.elections.kalshi.com/trade-api/v2'
SERIES = {  # series ticker -> our market key
    'KXNFLPASSYDS': 'pass_yds', 'KXNFLPASSTDS': 'pass_td', 'KXNFLPASSCOMP': 'pass_cmp', 'KXNFLPASSATT': 'pass_att',
    'KXNFLRSHYDS': 'rush_yds', 'KXNFLRSHATT': 'carries', 'KXNFLRECYDS': 'rec_yds', 'KXNFLREC': 'rec', 'KXNFLRRYDS': 'rush_rec_yds',
    'KXNFLTD': 'atd_1_plus', 'KXNFLANYTD': 'atd_1_plus', 'KXNFL2TD': 'td_2_plus', 'KXNFLFIRSTTD': 'first_td', 'KXNFLGAMETD': 'atd_1_plus',
    'KXNFLPASSINT': 'pass_int', 'KXNFLLONGREC': 'longest_rec', 'KXNFLLONGRSH': 'longest_rush', 'KXNFLTKL': 'tackles', 'KXNFLSACK': 'sacks',
}
ALIAS = {'JAC': 'JAX', 'LA': 'LAR', 'WSH': 'WAS'}
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30))
def f(x):
    try: return float(x)
    except (TypeError, ValueError): return None
def american(p):
    if not p or p <= 0 or p >= 1: return None
    return round(-100 * p / (1 - p)) if p >= 0.5 else round(100 * (1 - p) / p)
def game_of(event_ticker):
    m = re.search(r'-\d{2}[A-Z]{3}\d{2}([A-Z]+)$', event_ticker)
    return m.group(1) if m else None

ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--date'); a = ap.parse_args()
now = datetime.datetime.now(datetime.timezone.utc)
date = a.date or now.astimezone(zoneinfo.ZoneInfo('America/Los_Angeles')).date().isoformat()
sched = [g for g in json.load(open(ROOT / 'public/schedule.json', encoding='utf-8')) if g.get('season') == 2026 and g.get('week') == a.week and g.get('season_type') == 2]
teams = {}
for g in sched:
    aw = (g.get('visitor') or g.get('away') or {}); hm = (g.get('home') or {})
    aw = aw.get('abbr') if isinstance(aw, dict) else aw; hm = hm.get('abbr') if isinstance(hm, dict) else hm
    if aw and hm: teams[(ALIAS.get(aw, aw) + ALIAS.get(hm, hm)).replace(' ', '')] = f"{ALIAS.get(aw, aw)}@{ALIAS.get(hm, hm)}"
rows, seen_series = [], {}
for s, mk in SERIES.items():
    try: evs = get(f'{API}/events?series_ticker={s}&status=open&limit=200&with_nested_markets=true').get('events', [])
    except Exception as e: print(s, 'ERR', e); continue
    seen_series[s] = len(evs)
    for ev in evs:
        code = game_of(ev['event_ticker'])
        if not code: continue
        # Kalshi uses JAC / LA etc.; map "NEDET" style to our "NE@DET"
        gid = None
        for k, v in teams.items():
            if code == k or code == k.replace('JAX', 'JAC').replace('LAR', 'LA').replace('WAS', 'WSH'): gid = v; break
        if gid is None: continue
        for m in ev.get('markets', []):
            if m.get('status') not in (None, 'active', 'open'): continue
            sub = m.get('yes_sub_title') or ''
            player = sub.split(':')[0].strip() if ':' in sub else sub.strip()
            strike = f(m.get('floor_strike'))
            bid, ask, last = f(m.get('yes_bid_dollars')), f(m.get('yes_ask_dollars')), f(m.get('last_price_dollars'))
            fee = 0.07 * ask * (1 - ask) if ask else None
            rows.append(dict(book='KAL', source='kalshi_trade_api_v2', series=s, ticker=m['ticker'], event_ticker=ev['event_ticker'], event=gid, game=gid,
                             market=mk, player=player, side='Over' if strike is not None else 'Yes', line=strike,
                             milestone=(int(strike + 0.5) if strike is not None else None), yes_bid=bid, yes_ask=ask, last=last,
                             prob=ask, american_ask=american(ask), american_ask_with_fee=american(ask + fee) if ask else None,
                             ask_size=f(m.get('yes_ask_size_fp')), volume=f(m.get('volume_fp')), title=m.get('title'), selection=m.get('title')))
for r in rows:  # KXNFLTD is one ladder: 1+ / 2+ / 3+ touchdowns
    if r['series'] in ('KXNFLTD', 'KXNFLANYTD', 'KXNFLGAMETD') and r['line'] is not None:
        r['market'] = {0.5: 'atd_1_plus', 1.5: 'td_2_plus', 2.5: 'td_3_plus'}.get(r['line'], r['market']); r['side'] = 'Yes'
out = dict(schema='kalshi_props_v1', book='KAL', capturedAt=now.isoformat().replace('+00:00', 'Z'), date=date, week=a.week,
           series_counts=seen_series, totalRows=len(rows), rows=rows)
p = ROOT / f'data/generated/props/kalshi-props-{date}-week{a.week}.json'
p.write_text(json.dumps(out, indent=1), encoding='utf-8')
from collections import Counter
print('series with open events:', {k: v for k, v in seen_series.items() if v})
print('rows', len(rows), 'games', len({r['game'] for r in rows}), Counter(r['market'] for r in rows).most_common())
print('wrote', p)
