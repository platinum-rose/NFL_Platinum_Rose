"""Load the week's Platinum Rose card into the Live Tracker as PAPER (imaginary-money) tickets.

  python scripts/paper_from_card.py --week 7 [--season 2026] [--date 2026-10-25] [--dry-run]

Reads reports/bets/<season>-w<NN>-card.md: sections 3 (singles), 4 (round robins), 5 (parlays),
7h (Prop Stack Agent tickets) and 7e/8a (DK Predictions TD slips), and writes them to
data/official-picks/paper-wagers-<season>.json with is_paper=true (category "AI Recommendation").
The Live Tracker shows them in the Imaginary section and leaves them out of every cash total.
They never touch the bankroll sync. Re-running replaces that week's card-generated paper
tickets (ids paper_w<N>_card_*) and keeps every other entry.
"""
import argparse, itertools, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ('3', '4', '5', '7h', '7i', '7e')  # heading prefixes
TEAM = {'Arizona': 'ARI', 'Atlanta': 'ATL', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Cincinnati': 'CIN',
        'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Green Bay': 'GB', 'Houston': 'HOU', 'Indianapolis': 'IND',
        'Jacksonville': 'JAX', 'Kansas City': 'KC', 'Las Vegas': 'LV', 'Los Angeles Rams': 'LAR', 'Los Angeles Chargers': 'LAC', 'Miami': 'MIA',
        'Minnesota': 'MIN', 'New England': 'NE', 'New Orleans': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ', 'Philadelphia': 'PHI',
        'Pittsburgh': 'PIT', 'San Francisco': 'SF', 'Seattle': 'SEA', 'Tampa Bay': 'TB', 'Tennessee': 'TEN', 'Washington': 'WAS'}
ABBR = set(TEAM.values()) | {'WSH', 'LA'}
NICK = {'Browns': 'CLE', 'Jets': 'NYJ', 'Giants': 'NYG', 'Rams': 'LAR', 'Chargers': 'LAC', 'Packers': 'GB', 'Lions': 'DET', 'Bengals': 'CIN', 'Ravens': 'BAL',
        'Falcons': 'ATL', '49ers': 'SF', 'Saints': 'NO', 'Steelers': 'PIT', 'Chiefs': 'KC', 'Seahawks': 'SEA', 'Raiders': 'LV', 'Broncos': 'DEN',
        'Cardinals': 'ARI', 'Dolphins': 'MIA', 'Vikings': 'MIN', 'Colts': 'IND', 'Texans': 'HOU', 'Buccaneers': 'TB', 'Panthers': 'CAR',
        'Cowboys': 'DAL', 'Eagles': 'PHI', 'Titans': 'TEN'}
# (regex on the market text, market, target_stat)
PROPS = [
    (r'kicker points|kicking points', 'kicker_points', 'kicking_points'),
    (r'longest reception', 'longest_reception', 'longest_reception'),
    (r'pass(?:ing)? TDs?\b|pass TD', 'passing_touchdowns', 'passing_touchdowns'),
    (r'passing yds|passing yards', 'passing_yards', 'passing_yards'),
    (r'rushing yds|rushing yards', 'rushing_yards', 'rushing_yards'),
    (r'receiving yds|receiving yards', 'receiving_yards', 'receiving_yards'),
    (r'completions', 'pass_completions', 'pass_completions'),
    (r'interceptions thrown|\bINT\b', 'pass_interceptions', 'interceptions_thrown'),
    (r'sacks taken', 'sacks_taken', 'sacks_taken'),
    (r'tackles \+ assists|tackles and assists', 'tackles_assists', 'tackles_combined'),
    (r'\bsacks?\b', 'sacks', 'sacks'),
    (r'carries|rushing attempts', 'carries', 'carries'),
    (r'receptions', 'receptions', 'receptions'),
    (r'first TD', 'first_touchdown', 'first_touchdown'),
    (r'anytime TD', 'anytime_touchdown', 'touchdowns'),
    (r'field goals? made|\bFGs?\b', 'field_goals_made', 'field_goals_made'),
]


ROSTER = {}


def player_team(name, away, home):
    if not ROSTER:
        try:
            ROSTER.update(json.loads((ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json').read_text(encoding='utf-8')).get('players', {}))
        except Exception:
            ROSTER['_'] = []
    base = re.sub(r'\s+(Jr\.|Sr\.|II|III|IV)$', '', name or '').strip()
    for cand in (name, base, base + ' Jr.', base + ' Sr.', base + ' III', base + ' II'):
        for e in ROSTER.get(cand, []):
            if e.get('team') in (away, home): return e['team']
    return None


def team_kicker(team):
    player_team('', '', '')  # loads ROSTER
    ks = [n for n, es in ROSTER.items() if n != '_' for e in es if e.get('team') == team and e.get('position') in ('K', 'PK') and e.get('status', 'active') == 'active']
    return ks[0] if len(ks) == 1 else None


def money(s):
    m = re.search(r'\$([\d,]+(?:\.\d+)?)', s or '')
    return float(m.group(1).replace(',', '')) if m else None


def dec(price):
    try:
        a = int(str(price).replace('+', '').replace(',', '').strip())
    except ValueError:
        return None
    return 1 + (a / 100 if a > 0 else 100 / -a)


def game_fmt(g):
    a, _, h = g.partition('@')
    return f'{a.strip()} @ {h.strip()}'


def leg_from(row, n, tid, starts):
    game, mkt, book, price = [c.strip() for c in row[:4]]
    away, home = [t.strip() for t in game.split('@')]
    g = game_fmt(game)
    L = dict(leg_num=n, game=g, team=None, opponent=None, market=None, selection=mkt, line=None, price=price or None,
             game_start=starts.get(g), status='PENDING', key=f'{tid}_{n}', source=book)
    ou = re.search(r'\b(Over|Under|O|U)\s?(\d+(?:\.\d+)?)', mkt)
    direction = ('over' if ou.group(1) in ('Over', 'O') else 'under') if ou else None
    line = float(ou.group(2)) if ou else None
    # game total
    if re.fullmatch(r'(Over|Under) \d+(\.\d+)?', mkt):
        L.update(team=f'{away}/{home}', opponent='', market='total', line=line, direction=direction, target_stat='total')
        return L
    # moneyline
    m = re.match(r'^(\w[\w ]*?) ML\b', mkt)
    if m:
        t = m.group(1).strip(); t = t if t in ABBR else TEAM.get(t, NICK.get(t, t))
        L.update(team=t, opponent=home if t == away else away, market='moneyline', target_stat='moneyline')
        return L
    # spread
    m = re.fullmatch(r'([A-Z][\w .]+?) ([+-]\d+(?:\.\d+)?)', mkt)
    if m and (m.group(1) in TEAM or m.group(1) in ABBR):
        t = TEAM.get(m.group(1), m.group(1))
        L.update(team=t, opponent=home if t == away else away, market='spread', line=float(m.group(2)), target_stat='spread')
        return L
    # team / game props
    if re.match(r'Total field goals, both teams', mkt):
        L.update(team=f'{away}/{home}', opponent='', market='game_field_goals', line=line, direction=direction, target_stat='field_goals_made',
                 team_market=True, grading='manual: total field goals made by both teams from the box score')
        return L
    m = re.match(r'(.+?) team (field goals|touchdowns)', mkt)
    if m:
        nm = m.group(1).strip()
        t = nm if nm in ABBR else NICK.get(nm.split()[-1], TEAM.get(nm, nm)); stat = 'team_field_goals' if 'field' in m.group(2) else 'team_touchdowns'
        L.update(team=t, opponent=home if t == away else away, market=stat, line=line, direction=direction, target_stat=stat, team_market=True,
                 grading=f'manual: count {t} {m.group(2)} from the box score')
        k = team_kicker(t) if stat == 'team_field_goals' else None
        if k:  # team FGs = the kicker's FGs made, so the tracker can grade it live
            L.update(player=k, market='field_goals_made', target_stat='field_goals_made', team_market=False,
                     grading_note=f'Team field goals graded as {k} field goals made (team kicker per ESPN roster).')
            L.pop('grading', None)
        return L
    # player props
    for pat, market, stat in PROPS:
        pm = re.search(pat, mkt, re.I)
        if pm:
            player = mkt[:pm.start()].strip()
            player = re.sub(r'\s+(O|U)\d.*$', '', player).strip()
            if market in ('anytime_touchdown', 'first_touchdown'):
                line, direction = 0.5, 'over'
            L.update(player=player or None, market=market, line=line, direction=direction, target_stat=stat)
            t = player_team(player, away, home)
            if t: L.update(team=t, opponent=home if t == away else away)
            if market in ('longest_reception', 'sacks_taken', 'first_touchdown'):
                L['grading'] = f'manual: {player} {stat.replace("_", " ")} from the box score / play-by-play'
            return L
    L.update(market='other', grading='manual')
    return L


def parse(card, season, week, date, starts):
    lines = card.split('\n')
    out, sec, i = [], None, 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith('## '):
            m = re.match(r'## (\d+[a-z]?|7e/8a)\.', ln); sec = m.group(1) if m else None
            if sec == '7e/8a': sec = '7e'
        if ln.startswith('### ') and sec in SECTIONS and '**$' in ln:
            head = ln[4:]
            parts = [p.strip() for p in head.split(' — ')]
            name, book = parts[0], parts[1]
            stake = money(parts[2])
            rest = ' — '.join(parts[3:])
            rows, flags = [], ''
            j = i + 1
            while j < len(lines) and not lines[j].startswith('#'):
                if lines[j].startswith('| ') and not lines[j].startswith('| Game') and not lines[j].startswith('|---'):
                    rows.append([c.strip() for c in lines[j].strip().strip('|').split('|')])
                if lines[j].startswith('Flags:'): flags = lines[j][6:].strip()
                j += 1
            i = j
            if not rows or stake is None: continue
            tid = 'paper_w%d_card_%s' % (week, re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')[:48])
            legs = [leg_from(r, n, tid, starts) for n, r in enumerate(rows, 1)]
            is_rr = sec == '4'
            w = dict(id=tid, ticket_number=None, is_paper=True, date=date, season=season, week=week,
                     game=f'Week {week} multi-game' if len(legs) > 1 else legs[0]['game'],
                     game_title=f'Platinum Rose AI paper: {name}', book=f'Paper ({book} card price)',
                     ticket_type=('Round Robin' if is_rr else 'Single' if len(legs) == 1 else f'{len(legs)}-Leg Parlay'),
                     category='AI Recommendation', funding_type='paper', cash_risk_usd=stake, stake_usd=stake,
                     odds_american=None, odds_decimal=None, potential_profit_usd=None, potential_payout_usd=None,
                     status='PENDING', result=None, card_section=sec,
                     progress_notes=f'Platinum Rose AI Week {week} card (reports/bets/{season}-w{week:02d}-card.md §{sec}), as proposed Sat 10/24. '
                                    f'Not placed: imaginary money for reference and accuracy, excluded from cash totals and the bankroll. Card line: {rest}. '
                                    + (f'Flags: {flags}' if flags else ''),
                     legs=legs)
            ds = [dec(l['price']) for l in legs]
            if is_rr:
                k = int(re.search(r'by (\d+)s', name).group(1))
                combos = list(itertools.combinations(range(len(legs)), k))
                per = round(stake / len(combos), 2)
                cs = []
                for c in combos:
                    d_ = 1.0
                    for x in c: d_ *= ds[x] or 1.91
                    cs.append(dict(teams=[legs[x].get('team') or legs[x]['selection'] for x in c], leg_nums=[x + 1 for x in c], stake_usd=per, to_win_usd=round(per * d_ - per, 2)))
                w['ticket_type'] = f'Round Robin ({len(legs)} Selections, {k}-Team Combinations, {len(combos)} Parlays)'
                w['round_robin'] = dict(selection_count=len(legs), teams_per_combination=k, combination_count=len(combos), stake_per_combination_usd=per,
                                        combinations=cs, settlement_method=f'sum of winning {k}-leg parlays')
                w['potential_profit_usd'] = round(sum(c['to_win_usd'] for c in cs), 2)
                w['potential_payout_usd'] = round(w['potential_profit_usd'] + stake, 2)
            elif all(ds):
                d_ = 1.0
                for x in ds: d_ *= x
                w['odds_decimal'] = round(d_, 4)
                w['odds_american'] = ('+%d' % round((d_ - 1) * 100)) if d_ >= 2 else ('%d' % round(-100 / (d_ - 1)))
                w['potential_payout_usd'] = round(stake * d_, 2); w['potential_profit_usd'] = round(stake * d_ - stake, 2)
            else:
                pay = re.search(r'returns about \$([\d,]+)', rest)
                if pay:
                    w['potential_payout_usd'] = float(pay.group(1).replace(',', '')); w['potential_profit_usd'] = round(w['potential_payout_usd'] - stake, 2)
                w['needs_confirmation'] = ['no complete price set on the card (DKP contract % or unposted markets); payout is the card estimate']
            out.append(w)
            continue
        i += 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True)
    ap.add_argument('--season', type=int, default=2026)
    ap.add_argument('--date')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    card = (ROOT / f'reports/bets/{a.season}-w{a.week:02d}-card.md').read_text(encoding='utf-8')
    placed = json.loads((ROOT / f'data/official-picks/user-placed-wagers-{a.season}.json').read_text(encoding='utf-8'))
    starts = {}
    for x in placed:
        for L in x.get('legs', []) or []:
            if x.get('week') == a.week and L.get('game_start') and ' @ ' in (L.get('game') or ''): starts.setdefault(L['game'], L['game_start'])
    pp = ROOT / f'data/official-picks/paper-wagers-{a.season}.json'
    paper = json.loads(pp.read_text(encoding='utf-8')) if pp.exists() else []
    new = parse(card, a.season, a.week, a.date or '', starts)
    prefix = f'paper_w{a.week}_card_'
    keep = [p for p in paper if not str(p.get('id', '')).startswith(prefix)]
    for w in new:
        flag = [l['key'] for l in w['legs'] if not l.get('game_start')]
        print(f"{w['id']:<70} ${w['stake_usd']:>5g} {w['ticket_type']:<45} pays {w['potential_payout_usd']}" + (f'  (no start time: {flag})' if flag else ''))
    print(f'{len(new)} paper tickets, ${sum(w["stake_usd"] for w in new):g} imaginary stake')
    if not a.dry_run:
        pp.write_text(json.dumps(keep + new, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'wrote {pp.relative_to(ROOT)} ({len(keep)} kept + {len(new)} new)')


if __name__ == '__main__':
    main()
