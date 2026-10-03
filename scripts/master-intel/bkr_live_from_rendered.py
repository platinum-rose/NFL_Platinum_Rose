"""Build data/generated/props/bookmaker-live-<date>-week<N>.json (schema bookmaker_live_markets_v1)
from (a) a build-format BKR board paste for the main game lines and (b) the normalized
rendered per-game BKR captures for player props.

Read-only on sportsbooks: it only re-lays out files already in the repo.

Rules:
- game_lines rows (spread/total/moneyline) come from the board paste for every game on it.
- Player props come from the rendered capture. Unpriced selections are kept as available=False, odds=None.
- If a game has NO priced rows for a prop market on the new date, that market's rows are carried forward from
  --fallback-date (keeping their original capturedAt and a carried_from tag; the new date's unpriced rows for that
  market are dropped), except for games listed in --no-carry (QB change, etc.).
- Period lines (halves/quarters), team totals and game props are not emitted (build.py doesn't read them).

Usage:
  python scripts/master-intel/bkr_live_from_rendered.py --week 4 --date 2026-10-03 \
     --board data/odds/BKR_current_lines_1003_1046_buildfmt --board-time 2026-10-03T17:46:00Z \
     --fallback-date 2026-10-02 --no-carry IND@WAS,NYJ@CHI,GB@TB,ARI@NYG
"""
import argparse, json, re, datetime, os
from collections import defaultdict

FULL = {'Arizona Cardinals':'ARI','Atlanta Falcons':'ATL','Baltimore Ravens':'BAL','Buffalo Bills':'BUF','Carolina Panthers':'CAR','Chicago Bears':'CHI','Cincinnati Bengals':'CIN','Cleveland Browns':'CLE','Dallas Cowboys':'DAL','Denver Broncos':'DEN','Detroit Lions':'DET','Green Bay Packers':'GB','Houston Texans':'HOU','Indianapolis Colts':'IND','Jacksonville Jaguars':'JAX','Kansas City Chiefs':'KC','Las Vegas Raiders':'LV','Los Angeles Chargers':'LAC','Los Angeles Rams':'LAR','Miami Dolphins':'MIA','Minnesota Vikings':'MIN','New England Patriots':'NE','New Orleans Saints':'NO','New York Giants':'NYG','New York Jets':'NYJ','Philadelphia Eagles':'PHI','Pittsburgh Steelers':'PIT','San Francisco 49ers':'SF','Seattle Seahawks':'SEA','Tampa Bay Buccaneers':'TB','Tennessee Titans':'TEN','Washington Commanders':'WAS'}
AB = {v: k for k, v in FULL.items()}
OU = {'Total Passing Yards':'pass_yds','Total Receiving Yards':'rec_yds','Total Receptions':'rec','Total Rushing Yards':'rush_yds',
      'Total Carries':'carries','Total Pass Completions':'pass_cmp','Total Passing Touchdowns':'pass_td'}
LAD = {'Passing Yards':'pass_yds','Receiving Yards':'rec_yds','Receptions':'rec','Rushing Yards':'rush_yds','Carries':'carries',
       'Pass Completions':'pass_cmp','Passing Touchdowns':'pass_td'}
TD = {'Player To Score 1+ Touchdown':'atd_1_plus','Player To Score 2+ Touchdown':'td_2_plus','Player To Score 3+ Touchdown':'td_3_plus',
      'Player To Score 1st Touchdown':'first_td'}

def gid(event):
    a, h = event.split(' @ ')
    return f'{FULL[a]}@{FULL[h]}'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True); ap.add_argument('--date', required=True)
    ap.add_argument('--board', required=True); ap.add_argument('--board-time', required=True)
    ap.add_argument('--fallback-date'); ap.add_argument('--no-carry', default='')
    a = ap.parse_args()
    W, D = a.week, a.date
    rend = json.load(open(f'data/generated/props/bookmaker-rendered-{D}-week{W}.json'))
    fb = json.load(open(f'data/generated/props/bookmaker-live-{a.fallback_date}-week{W}.json')) if a.fallback_date else None
    nocarry = {x.strip() for x in a.no_carry.split(',') if x.strip()}
    rows = []; events = {}
    # 1) game lines from the board
    pat = re.compile(r'^(\w+) @ (\w+) \d\d:\d\d\s+\w+ ([+-][\d.]+)([+-]\d+) / \w+ ([+-][\d.]+)([+-]\d+)\s+o([\d.]+)([+-]\d+) u([\d.]+)([+-]\d+)\s+\w+ ([+-]\d+) \w+ ([+-]\d+)')
    for ln in open(a.board, encoding='utf-8'):
        m = pat.match(ln.strip())
        if not m: continue
        A, H, asp, aso, hsp, hso, ot, oo, ut, uo, aml, hml = m.groups()
        ev = f'{AB[A]} @ {AB[H]}'; events[ev] = 1
        base = dict(book='BKR', event=ev, eventUrl=None, sectionTitle='Game', market='game_lines', source='bkr_board_paste:' + os.path.basename(a.board), capturedAt=a.board_time, player=None)
        def R(bet, side, line, odds, sel): rows.append({**base, 'selection': sel, 'bet': bet, 'side': side, 'line': line, 'odds': odds, 'available': True})
        R('spread', AB[A], float(asp), int(aso), f'{AB[A]} {asp}{aso}'); R('spread', AB[H], float(hsp), int(hso), f'{AB[H]} {hsp}{hso}')
        R('total', 'Over', float(ot), int(oo), f'Over {ot}{oo}'); R('total', 'Under', float(ut), int(uo), f'Under {ut}{uo}')
        R('moneyline', AB[A], None, int(aml), f'{AB[A]} {aml}'); R('moneyline', AB[H], None, int(hml), f'{AB[H]} {hml}')
    # 2) props from the rendered capture
    clock = {}
    for g in rend['games']:
        mo, dd = map(int, g['kickoff_display'].split()[0].split('/'))
        hh, mm, ss = g['page_clock_at_capture'].split()[0].split(':')
        clock[g['event']] = datetime.datetime(int(D[:4]), int(D[5:7]), int(D[8:10]), int(hh), int(mm), int(ss), tzinfo=datetime.timezone(datetime.timedelta(hours=-7))).astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    have = defaultdict(int)
    for x in rend['rows']:
        k = x['section_kind']; t = x['section_title'].split(': ', 1)[-1]; p = x.get('player')
        if k == 'touchdown_scorer': mk = TD.get(t); side = 'Yes'; line = None; thr = None
        elif k == 'player_total_ou': mk = OU.get(t.replace(p or '', '').strip()); side = x.get('side'); line = x['line']; thr = None
        elif k == 'player_ladder':
            mk = LAD.get(t.replace(p or '', '').strip()); side = 'Over'; thr = x.get('threshold'); line = (thr - 0.5) if thr is not None else None
        else: continue
        if not mk or not p: continue
        r = dict(book='BKR', event=x['event'], eventUrl=None, sectionTitle=x['section_title'], market=mk, source='bookmaker_rendered_text:' + x['game_file'],
                 capturedAt=clock.get(x['event']), selection=f"{x['selection']} {x['raw_price'] or ''}".strip(), player=p, side=side, line=line,
                 odds=x['odds'] if x['priced'] else None, available=bool(x['priced'] and x['available']))
        if thr is not None: r['threshold'] = thr
        rows.append(r)
        if r['available']: have[(gid(x['event']), mk)] += 1
    # 3) carry forward markets with nothing priced
    carried = defaultdict(int)
    if fb:
        for x in fb['rows']:
            if x['market'] == 'game_lines' or x['market'].endswith('_lines'): continue
            g = gid(x['event'])
            if g in nocarry or have[(g, x['market'])]: continue
            rows.append({**x, 'carried_from': a.fallback_date}); carried[(g, x['market'])] += 1
        # a carried market replaces that game's all-unpriced rows for the same market
        rows = [r for r in rows if r.get('carried_from') or r['market'] == 'game_lines' or (gid(r['event']), r['market']) not in carried]
    out = {'schema': 'bookmaker_live_markets_v1', 'capturedAt': a.board_time, 'games': len(events),
           'derived_from': {'game_lines': a.board, 'props': f'data/generated/props/bookmaker-rendered-{D}-week{W}.json',
                            'carry_forward': f'bookmaker-live-{a.fallback_date}-week{W}.json' if fb else None, 'no_carry': sorted(nocarry)},
           'carried_markets': {f'{g}|{m}': n for (g, m), n in sorted(carried.items())},
           'rows': rows}
    dst = f'data/generated/props/bookmaker-live-{D}-week{W}.json'
    json.dump(out, open(dst, 'w', encoding='utf-8'), indent=1)
    print(dst, len(rows), 'rows;', len(events), 'games; carried:', dict(out['carried_markets']))

main()
