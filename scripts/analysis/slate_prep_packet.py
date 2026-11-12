#!/usr/bin/env python3
"""Per-game prep packet for a week's slate (research context, not picks). Generalizes the hand-built TNF packet.

  python3 scripts/analysis/slate_prep_packet.py --week 9 [--skip-game JAX@BAL] [--out reports/bets/2026-w09-slate-prep-packet.md]

Read-only. Sources: public/schedule.json (DK snapshot), the newest BetOnline raw capture in data/generated/props/ (current
lines + team totals when present), data/archive/2026/season/{team-weeks,player-games}.csv, data/player-availability/latest.json,
data/podcasts/youtube-extracted-picks-2026-wNN.claude-verified.json.
"""
import argparse, csv, collections, datetime, glob, json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SEASON = os.path.join(ROOT, 'data', 'archive', '2026', 'season')
FIX = {'WSH': 'WAS', 'LA': 'LAR', 'JAC': 'JAX'}
NAME2AB = {'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR',
           'Chicago Bears': 'CHI', 'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN',
           'Detroit Lions': 'DET', 'Green Bay Packers': 'GB', 'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX',
           'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA',
           'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG', 'New York Jets': 'NYJ',
           'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT', 'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA',
           'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'}


def T(a): return FIX.get(a, a)


def f(x):
    try: return float(x)
    except (TypeError, ValueError): return 0.0


def to_pt(u):
    y = u.year
    mar = datetime.datetime(y, 3, 8, 10, tzinfo=datetime.timezone.utc); mar += datetime.timedelta(days=(6 - mar.weekday()) % 7)
    nov = datetime.datetime(y, 11, 1, 9, tzinfo=datetime.timezone.utc); nov += datetime.timedelta(days=(6 - nov.weekday()) % 7)
    return u.astimezone(datetime.timezone(datetime.timedelta(hours=-7 if mar <= u < nov else -8)))


def load_csv(name): return list(csv.DictReader(open(os.path.join(SEASON, name), encoding='utf-8')))


NICK2AB = {v.split(' ')[-1]: k for v, k in NAME2AB.items()}


def sc_lines(week):
    """SuperContest locked lines -> {AWAY@HOME: home line} (2026-11-05)."""
    p = os.path.join(ROOT, 'data', 'supercontest', f'week-{week:02d}-lines.json')
    if not os.path.exists(p): return {}, None
    d = json.load(open(p, encoding='utf-8')); out = {}
    for g in d['games']:
        a, h = NICK2AB.get(g['away_team']), NICK2AB.get(g['home_team'])
        if a and h: out[f'{a}@{h}'] = g['contest_line'] if g['favorite_abbr'] == h else -g['contest_line']
    return out, os.path.relpath(p, ROOT)


def ftn_tables():
    """Newest dated FTN Stats IQ export folder -> {table: {TEAM: row}} for the team-level tables (2026-11-05)."""
    dirs = sorted(d for d in glob.glob(os.path.join(ROOT, 'data', 'research-intel', 'source-evidence', '*-ftn-stats-iq')) if os.path.isdir(d))
    if not dirs: return {}, None
    out = {}
    for f_ in glob.glob(os.path.join(dirs[-1], 'stats-iq-team-*.csv')):
        k = os.path.basename(f_)[len('stats-iq-'):-4]
        out[k] = {NAME2AB.get(r['Team']): r for r in csv.DictReader(open(f_, encoding='utf-8-sig')) if NAME2AB.get(r['Team'])}
    return out, os.path.relpath(dirs[-1], ROOT)


def pct(x):
    try: return float(str(x).replace('%', ''))
    except ValueError: return None


def ftn_block(a, h, F):
    """Offense vs the opposing defense on DVOA, rushing DVOA and pressure (FTN, season to date). Lower defensive DVOA = better defense."""
    if not F: return []
    def rank(tbl, col, team, high_good=True):
        vals = sorted(((pct(r.get(col)), t) for t, r in F.get(tbl, {}).items() if pct(r.get(col)) is not None), reverse=high_good)
        return next((i + 1 for i, (_, t) in enumerate(vals) if t == team), None)
    def v(tbl, team, col): return (F.get(tbl, {}).get(team) or {}).get(col, '?')
    rows = ['| FTN (season) | Offense | vs defense | Offense | vs defense |', '|---|---|---|---|---|']
    def cell(tbl, team, col, hg): r = rank(tbl, col, team, hg); return f"{v(tbl, team, col)}" + (f" (#{r})" if r else '')
    rows.append(f"| | **{a} O** | {h} D | **{h} O** | {a} D |")
    rows.append(f"| DVOA | {cell('team-offense-efficiency', a, 'DVOA', True)} | {cell('team-defense-efficiency', h, 'DVOA', False)} | "
                f"{cell('team-offense-efficiency', h, 'DVOA', True)} | {cell('team-defense-efficiency', a, 'DVOA', False)} |")
    rows.append(f"| Rush DVOA | {cell('team-offense-rushing-analytics', a, 'DVOA', True)} | {cell('team-defense-rush-analytics', h, 'DVOA', False)} | "
                f"{cell('team-offense-rushing-analytics', h, 'DVOA', True)} | {cell('team-defense-rush-analytics', a, 'DVOA', False)} |")
    rows.append(f"| Pressure % (allowed / generated) | {cell('team-offense-pass-protection', a, 'PRESS%', False)} | {cell('team-defense-pass-rush', h, 'PRESS%', True)} | "
                f"{cell('team-offense-pass-protection', h, 'PRESS%', False)} | {cell('team-defense-pass-rush', a, 'PRESS%', True)} |")
    return rows


def beo_lines():
    """Newest BetOnline raw capture -> {AWAY@HOME: dict(spread_away, total, tt_away, tt_home, ml_away, ml_home, captured)}."""
    files = sorted(glob.glob(os.path.join(ROOT, 'data', 'generated', 'props', 'betonline-live-*.raw.txt')), key=os.path.getmtime)
    if not files: return {}, None
    txt = open(files[-1], encoding='utf-8', errors='replace').read(); out = {}
    for blk in re.split(r'(?m)^EVENT\|', txt)[1:]:
        head = blk.split('\n', 1)[0].split('|'); m = re.match(r'(.+?) @ (.+)', head[0])
        if not m: continue
        a, h = NAME2AB.get(m.group(1).strip()), NAME2AB.get(m.group(2).strip())
        if not a or not h: continue
        L = [x.strip() for x in blk.split('\n') if x.strip()]
        d = dict(captured=head[2] if len(head) > 2 else None)
        try:
            i = L.index('Game Period')
            j = next(k for k in range(i, min(i + 30, len(L))) if L[k] == m.group(1).strip())
            d.update(spread_away=L[j + 1], spread_away_px=L[j + 2], ml_away=L[j + 3], total=L[j + 4].replace('O ', ''), ml_home=L[j + 9] if j + 9 < len(L) else None)
        except (ValueError, StopIteration, IndexError): pass
        try:
            i = L.index('Team Points Game')
            seg = L[i:i + 20]
            ka = seg.index(m.group(1).strip()); kh = seg.index(m.group(2).strip())
            d.update(tt_away=seg[ka + 1].replace('O ', ''), tt_home=seg[kh + 1].replace('O ', ''), tt_home_under_px=seg[kh + 4] if kh + 4 < len(seg) else None)
        except (ValueError, IndexError): pass
        out[f'{a}@{h}'] = d
    return out, os.path.relpath(files[-1], ROOT)


def team_block(team, TW, PG):
    rows = sorted([r for r in TW if T(r['team']) == team], key=lambda r: int(r['week']))
    if not rows: return None
    n = len(rows); s = lambda k: sum(f(r[k]) for r in rows)
    su = collections.Counter(r['su'] for r in rows); ats = collections.Counter(r['ats'] for r in rows); ou = collections.Counter(r['ou'] for r in rows)
    last3 = '; '.join(f"W{r['week']} {'v' if r['home_away'] == 'home' else '@'}{T(r['opp'])} {r['pts']}-{r['opp_pts']} {r['ats']}" for r in rows[-3:])
    form = dict(team=team, g=n, wl=f"{su['W']}-{su['L']}" + (f"-{su['T']}" if su['T'] else ''), ats=f"{ats['W']}-{ats['L']}-{ats['P']}",
                ou=f"{ou['O']}-{ou['U']}-{ou['P']}", pf=s('pts') / n, pa=s('opp_pts') / n, ypp=s('ypp') / n, oypp=s('opp_ypp') / n,
                to=int(s('to_margin')), ppd=s('pts_per_drive') / n, last3=last3, last_week=int(rows[-1]['week']))
    P = [r for r in PG if T(r['team']) == team]
    qb = collections.OrderedDict()
    for r in sorted(P, key=lambda r: int(r['week'])):
        if f(r['pass_att']) >= 10: qb.setdefault(r['player'], []).append(int(r['week']))
    form['qbs'] = qb
    wk = sorted({int(r['week']) for r in P}); l3 = set(wk[-3:])
    def agg(name, keys):
        g = [r for r in P if r['player'] == name and int(r['week']) in l3]
        return {k: [int(f(r[k])) for r in sorted(g, key=lambda r: int(r['week']))] for k in keys}
    last_qb = max(qb, key=lambda q: max(qb[q])) if qb else None  # the QB with the most recent start, not the first one
    by = collections.defaultdict(lambda: [0.0, 0.0, 0.0])
    for r in P:
        if int(r['week']) in l3: b = by[r['player']]; b[0] += f(r['rush_car']); b[1] += f(r['targets']); b[2] += f(r['tackles'])
    rbs = [p for p, v in sorted(by.items(), key=lambda x: -x[1][0]) if v[0] >= 6 and p != last_qb][:2]
    wrs = [p for p, v in sorted(by.items(), key=lambda x: -x[1][1]) if v[1] >= 6][:3]
    dfs = [p for p, v in sorted(by.items(), key=lambda x: -x[1][2]) if v[2] >= 10][:3]
    form['usage'] = ([('QB', last_qb, agg(last_qb, ['pass_att', 'pass_yds', 'pass_td', 'pass_int', 'rush_yds']))] if last_qb else []) + \
        [('RB', p, agg(p, ['rush_car', 'rush_yds', 'rec', 'tds_total'])) for p in rbs] + \
        [('REC', p, agg(p, ['targets', 'rec', 'rec_yds', 'tds_total'])) for p in wrs if p not in rbs] + \
        [('DEF', p, agg(p, ['tackles', 'sacks'])) for p in dfs]
    return form


def injuries(team, A):
    # the per-team index can miss events (Mahomes/McCarthy Q on 11/10); also read the flat list by team_abbr (2026-11-10)
    ev = ((A['teams'].get(team) or {}).get('events') or []) + [e for e in A.get('events') or [] if e.get('team_abbr') == team]
    keep = {}
    for e in ev:
        st = e.get('normalized_status') or ''
        if st not in ('OUT', 'DOUBTFUL', 'QUESTIONABLE'): continue
        k = e.get('player_name')
        if k not in keep or (e.get('published_at') or '') > (keep[k].get('published_at') or ''): keep[k] = e
    order = {'OUT': 0, 'DOUBTFUL': 1, 'QUESTIONABLE': 2}
    return sorted(keep.values(), key=lambda e: (order[e['normalized_status']], e.get('position') or ''))


def rest_days(team, S, kick):
    prev = [g for g in S if (g['visitor'] == team or g['home'] == team) and g['kickoff_utc'] < kick and g.get('status') == 'post']
    if not prev: return None
    last = max(prev, key=lambda g: g['kickoff_utc'])
    d = (datetime.datetime.fromisoformat(kick.replace('Z', '+00:00')) - datetime.datetime.fromisoformat(last['kickoff_utc'].replace('Z', '+00:00'))).days
    return d


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--skip-game', action='append', default=[])
    ap.add_argument('--out'); a = ap.parse_args(); wk = a.week
    S = json.load(open(os.path.join(ROOT, 'public', 'schedule.json'), encoding='utf-8'))
    games = sorted([g for g in S if g['week'] == wk and f"{g['visitor']}@{g['home']}" not in a.skip_game and g.get('status') == 'pre'], key=lambda g: g['kickoff_utc'])
    TW = load_csv('team-weeks.csv'); PG = load_csv('player-games.csv')
    A = json.load(open(os.path.join(ROOT, 'data', 'player-availability', 'latest.json'), encoding='utf-8'))
    # podcast picks: the newer of the Claude-verified Pass 1 file and the rebuilt digest (Pass 2a carries units, best_bet, leans)
    cands = [os.path.join(ROOT, 'data', 'podcasts', f'youtube-extracted-picks-2026-w{wk:02d}{x}.json') for x in ('.claude-verified', '')]
    cands = [c_ for c_ in cands if os.path.exists(c_)]
    pp = max(cands, key=os.path.getmtime) if cands else None
    PD = json.load(open(pp, encoding='utf-8')) if pp else {}
    PK, LN = PD.get('picks') or [], PD.get('leans') or []
    BEO, beo_src = beo_lines()
    SC, sc_src = sc_lines(wk)
    F, ftn_src = ftn_tables()
    notes_p = os.path.join(ROOT, 'reports', 'bets', f'2026-w{wk:02d}-slate-qb-notes.md')
    now = to_pt(datetime.datetime.now(datetime.timezone.utc)).strftime('%a %m/%d %I:%M %p PT')
    o = [f'# Week {wk} slate prep packet (2026)', '',
         f'Research context, not picks. Built {now} by `scripts/analysis/slate_prep_packet.py`. {len(games)} games'
         + (f' (skipped: {", ".join(a.skip_game)})' if a.skip_game else '') + '.',
         f'Market: DK snapshot in `public/schedule.json`; BetOnline current lines from `{beo_src}` where the game was captured.',
         'Form: Weeks 1-' + str(max(int(r['week']) for r in TW)) + ' (`team-weeks.csv`); usage: last 3 games (`player-games.csv`); injuries: OUT / DOUBTFUL / QUESTIONABLE from `player-availability/latest.json` '
         f"({A['meta']['generated_at'][:16]}Z). Podcast picks: `{os.path.relpath(pp, ROOT) if pp else 'none'}`. SuperContest: `{sc_src or 'not captured'}`. FTN: `{ftn_src or 'none'}`.", '']
    if os.path.exists(notes_p): o += [open(notes_p, encoding='utf-8').read().strip(), '']
    o += ['## Slate at a glance', '',
         '| Kick (PT) | Game | DK home line / total (snapshot) | BEO now: away line, total, team totals | SuperContest (home line; value vs BEO) | Rest (A/H) | QB flags |', '|---|---|---|---|---|---|---|']
    blocks = []
    for g in games:
        A_, H_ = g['visitor'], g['home']; k = f'{A_}@{H_}'
        kick = to_pt(datetime.datetime.fromisoformat(g['kickoff_utc'].replace('Z', '+00:00'))).strftime('%a %I:%M %p')
        b = BEO.get(f'{T(A_)}@{T(H_)}') or {}
        beo = (f"{A_} {b.get('spread_away', '?')} ({b.get('spread_away_px', '')}), o/u {b.get('total', '?')}, TT {A_} {b.get('tt_away', '?')} / {H_} {b.get('tt_home', '?')}"
               if b else '—')
        fa, fh = team_block(T(A_), TW, PG), team_block(T(H_), TW, PG)
        flags = []
        for fm, tm in ((fa, A_), (fh, H_)):
            if fm and fm['qbs']:
                cur = max(fm['qbs'], key=lambda q: max(fm['qbs'][q])); lw = max(fm['qbs'][cur])
                recent = {q for q, w in fm['qbs'].items() if any(x >= lw - 2 for x in w)}
                if min(fm['qbs'][cur]) >= lw - 1 or len(recent) > 1:  # new starter in the last two games, or a QB carousel
                    flags.append(f"{tm}: {cur} started W{','.join(map(str, fm['qbs'][cur]))}" + (f" (also {', '.join(sorted(recent - {cur}))} recently)" if len(recent) > 1 else ''))
        for fm, tm in ((fa, A_), (fh, H_)):
            for e in injuries(T(tm), A):
                if (e.get('position') or '') == 'QB': flags.append(f"{tm} QB {e['player_name']} {e['normalized_status']}")
        ra, rh = rest_days(A_, S, g['kickoff_utc']), rest_days(H_, S, g['kickoff_utc'])
        sc = SC.get(f'{T(A_)}@{T(H_)}'); sct = '—'
        if sc is not None:
            sct = f"{H_} {sc:+g}"
            try:
                d_ = sc + float(b['spread_away'])  # SC home line minus BEO home line (BEO home = -away)
                sct += ' · ' + (f"{H_} +{d_:g}" if d_ > 0 else f"{A_} +{-d_:g}" if d_ < 0 else 'no edge')
            except (KeyError, TypeError, ValueError): pass
        o.append(f"| {kick} | {k} | {H_} {g.get('spread', 0):+g} / {g.get('total') or '?'} | {beo} | {sct} | {ra}/{rh} | {'; '.join(flags) or '—'} |")
        bl = [f'## {A_} @ {H_} ({kick} PT)', '',
              f"**Market.** DK snapshot {H_} {g.get('spread', 0):+g}, total {g.get('total')} ({(g.get('odds_fetched_at') or '')[:16]}). BEO now: {beo}."
              + (f" ML {A_} {b.get('ml_away')} / {H_} {b.get('ml_home')}." if b.get('ml_away') else ''),
              f"**Rest.** {A_} {ra} days, {H_} {rh} days." + (' Off a bye.' if (ra or 0) >= 13 or (rh or 0) >= 13 else '')
              + (f" **SuperContest:** {sct}." if sc is not None else ''), '',
              '| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |', '|---|---|---|---|---:|---:|---:|---:|---:|---:|---|']
        for fm in (fa, fh):
            if fm: bl.append(f"| {fm['team']} | {fm['wl']} | {fm['ats']} | {fm['ou']} | {fm['pf']:.1f} | {fm['pa']:.1f} | {fm['ypp']:.2f} | {fm['oypp']:.2f} | {fm['to']:+d} | {fm['ppd']:.2f} | {fm['last3']} |")
        for fm in (fa, fh):
            if not fm: continue
            bl += ['', f"**{fm['team']} QB starts (10+ att):** " + '; '.join(f"{q} W{','.join(map(str, w))}" for q, w in fm['qbs'].items()),
                   f"**{fm['team']} usage, last 3 games:**"]
            for role, p, d in fm['usage']:
                bl.append(f"- {role} {p}: " + ', '.join(f"{k_.replace('_', ' ')} {'/'.join(map(str, v))}" for k_, v in d.items()))
        for tm in (A_, H_):
            inj = injuries(T(tm), A)
            bl.append(f"**{tm} injuries:** " + ('; '.join(f"{e['player_name']} ({e.get('position') or '?'}) {e['normalized_status']}" + (f" ({e['injury_type']})" if e.get('injury_type') else '') for e in inj) or 'none listed Q/D/O'))
        fb = ftn_block(T(A_), T(H_), F)
        if fb: bl += [''] + fb
        gk = (k, f'{T(A_)}@{T(H_)}')
        pk = [p for p in PK if (p.get('game') or '').replace(' ', '') in gk and (p.get('verification') or {}).get('verdict') in ('verified', 'corrected', None)]
        if pk:
            bl += ['', '**Podcast picks:**'] + [f"- {'**BEST BET** ' if p.get('best_bet') else ''}{p.get('pick')}" + (f" ({p['units']}u)" if p.get('units') else '')
                                                + f" — {p.get('speaker') or ''}, {p.get('show', '')[:45]}" for p in pk]
        ln = [x for x in LN if (x.get('game') or '').replace(' ', '') in gk]
        if ln:
            bl += ['**Podcast leans (not picks):** ' + '; '.join(f"{x.get('side') or x.get('team') or ''} {x.get('market') or ''} {'' if x.get('line') is None else x.get('line')} ({x.get('speaker') or x.get('show', '')[:20]})".replace('  ', ' ') for x in ln)]
        blocks.append('\n'.join(bl))
    o += ['', *blocks, '', '---', 'Gates before any ticket: roster gate on every named player; Friday injury reports; prop boards captured; Andy pastes each slip.']
    out = a.out or os.path.join(ROOT, 'reports', 'bets', f'2026-w{wk:02d}-slate-prep-packet.md')
    open(out, 'w', encoding='utf-8').write('\n'.join(o) + '\n')
    print(f'{len(games)} games -> {os.path.relpath(out, ROOT)}')


if __name__ == '__main__':
    main()
