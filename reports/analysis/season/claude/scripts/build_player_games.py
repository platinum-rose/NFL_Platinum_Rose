"""Canonical player-game table from the raw ESPN summaries (Claude Team 2).

  python build_player_games.py            # all cached 2026 regular-season boxes
  python build_player_games.py --week 4   # still rewrites the whole file; --week only limits what is printed

Writes data/archive/2026/season/player-games.csv: one row per player per game, keyed by ESPN athlete id
(event_id + espn_athlete_id is unique). Name-keyed files (season-recap wNgames.json) lose that key; use this table for
any analysis that joins across weeks. nflverse_id is filled when the cached Supabase player_stats snapshot
(reports/analysis/season/claude/data/xcheck/sb_player_stats.json) has the same team + normalised name that week.
tds_total = touchdowns credited to the player in the scoring plays (exact name, same team; how ATD legs are graded);
first_td is 1 for the game's first TD scorer. Read-only on every input.
"""
import argparse, collections, csv, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib  # noqa: E402

OUT = os.path.join(lib.ROOT, 'data/archive/2026/season/player-games.csv')
XPS = os.path.join(lib.HERE, 'data/xcheck/sb_player_stats.json')
COLS = ['week', 'event_id', 'date_utc', 'team', 'opp', 'home_away', 'espn_athlete_id', 'nflverse_id', 'player', 'jersey',
        'pass_cmp', 'pass_att', 'pass_yds', 'pass_td', 'pass_int', 'sacks_taken', 'sack_yds_lost', 'qbr', 'passer_rtg',
        'rush_car', 'rush_yds', 'rush_td', 'rush_long',
        'rec', 'targets', 'rec_yds', 'rec_td', 'rec_long',
        'fum', 'fum_lost',
        'tackles', 'solo', 'sacks', 'tfl', 'pass_def', 'qb_hits', 'def_td', 'def_int', 'int_ret_yds', 'int_td',
        'kr', 'kr_yds', 'kr_td', 'pr', 'pr_yds', 'pr_td',
        'fg_made', 'fg_att', 'fg_long', 'xp_made', 'xp_att', 'kick_pts', 'punts', 'punt_yds',
        'tds_total', 'first_td', 'source_file']


def n(x):
    return lib.num(x)


def split2(x, sep='/'):
    p = (x or '').split(sep)
    return (n(p[0]), n(p[1])) if len(p) == 2 else (0.0, 0.0)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int)
    a = ap.parse_args()
    nv = collections.defaultdict(list)
    if os.path.exists(XPS):
        for r in lib.jl(XPS):
            nv[(r['week'], lib.T(r['team']), lib.norm(r['player_name']))].append(r['player_id'])
    best = {}
    for f in sorted(glob.glob(os.path.join(lib.BOX, 'espn-*.json'))):
        d = lib.jl(f); h = d.get('header', {})
        if (h.get('season') or {}).get('year') != 2026 or (h.get('season') or {}).get('type') not in (2, None):
            continue
        comp = h['competitions'][0]
        done = bool(comp.get('status', {}).get('type', {}).get('completed'))
        ev = str(h.get('id') or os.path.basename(f)[5:-5])
        if ev in best and (best[ev][2] or not done):
            continue
        best[ev] = (f, d, done)
    rows = []; seen = set()
    for ev, (f, d, done) in sorted(best.items(), key=lambda x: (x[1][1]['header']['week'], x[0])):
        h = d['header']; comp = h['competitions'][0]; wk = h['week']
        cs = {c['homeAway']: c for c in comp['competitors']}
        side = {lib.T(cs[s]['team']['abbreviation']): s for s in ('away', 'home')}
        opp = {t: [x for x in side if x != t][0] for t in side}
        tds = [x for x in lib.td_plays(dict(scoring=[dict(text=s.get('text', ''), team=lib.T(s['team']['abbreviation']), type=s['type']['text'])
                                                      for s in d.get('scoringPlays', [])]))]
        first = lib.norm(tds[0][0]) if tds else None
        P = collections.OrderedDict()
        for tb in d['boxscore']['players']:
            tm = lib.T(tb['team']['abbreviation'])
            for c in tb['statistics']:
                lab = c.get('labels') or []
                for at in c['athletes']:
                    aid = str(at['athlete'].get('id')); st = dict(zip(lab, at.get('stats', [])))
                    r = P.setdefault((aid, tm), dict(week=wk, event_id=ev, date_utc=comp.get('date'), team=tm, opp=opp[tm], home_away=side[tm],
                                                     espn_athlete_id=aid, player=at['athlete'].get('displayName'), jersey=at['athlete'].get('jersey'),
                                                     source_file=os.path.basename(f)))
                    k = c['name']
                    if k == 'passing':
                        r['pass_cmp'], r['pass_att'] = split2(st.get('C/ATT')); r['pass_yds'] = n(st.get('YDS')); r['pass_td'] = n(st.get('TD'))
                        r['pass_int'] = n(st.get('INT')); r['sacks_taken'], r['sack_yds_lost'] = split2(st.get('SACKS'), '-')
                        r['qbr'] = st.get('QBR'); r['passer_rtg'] = st.get('RTG')
                    elif k == 'rushing':
                        r['rush_car'] = n(st.get('CAR')); r['rush_yds'] = n(st.get('YDS')); r['rush_td'] = n(st.get('TD')); r['rush_long'] = n(st.get('LONG'))
                    elif k == 'receiving':
                        r['rec'] = n(st.get('REC')); r['targets'] = n(st.get('TGTS')); r['rec_yds'] = n(st.get('YDS')); r['rec_td'] = n(st.get('TD')); r['rec_long'] = n(st.get('LONG'))
                    elif k == 'fumbles':
                        r['fum'] = n(st.get('FUM')); r['fum_lost'] = n(st.get('LOST'))
                    elif k == 'defensive':
                        r['tackles'] = n(st.get('TOT')); r['solo'] = n(st.get('SOLO')); r['sacks'] = n(st.get('SACKS')); r['tfl'] = n(st.get('TFL'))
                        r['pass_def'] = n(st.get('PD')); r['qb_hits'] = n(st.get('QB HTS')); r['def_td'] = n(st.get('TD'))
                    elif k == 'interceptions':
                        r['def_int'] = n(st.get('INT')); r['int_ret_yds'] = n(st.get('YDS')); r['int_td'] = n(st.get('TD'))
                    elif k == 'kickReturns':
                        r['kr'] = n(st.get('NO')); r['kr_yds'] = n(st.get('YDS')); r['kr_td'] = n(st.get('TD'))
                    elif k == 'puntReturns':
                        r['pr'] = n(st.get('NO')); r['pr_yds'] = n(st.get('YDS')); r['pr_td'] = n(st.get('TD'))
                    elif k == 'kicking':
                        r['fg_made'], r['fg_att'] = split2(st.get('FG')); r['fg_long'] = n(st.get('LONG'))
                        r['xp_made'], r['xp_att'] = split2(st.get('XP')); r['kick_pts'] = n(st.get('PTS'))
                    elif k == 'punting':
                        r['punts'] = n(st.get('NO')); r['punt_yds'] = n(st.get('YDS'))
        for (aid, tm), r in P.items():
            r['tds_total'] = sum(1 for who, t in tds if t == tm and lib.norm(who) == lib.norm(r['player']))
            r['first_td'] = int(first is not None and lib.norm(r['player']) == first)
            ids = nv.get((wk, tm, lib.norm(r['player'])), [])
            r['nflverse_id'] = ids[0] if len(ids) == 1 else ''
            if (ev, aid) in seen:
                print('duplicate', ev, aid, r['player'])
            seen.add((ev, aid)); rows.append(r)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=COLS, extrasaction='ignore'); w.writeheader()
        for r in rows:
            w.writerow({c: (('%g' % r[c]) if isinstance(r.get(c), float) else r.get(c, '')) for c in COLS})
    byw = collections.Counter(r['week'] for r in rows); games = collections.Counter(); linked = collections.Counter()
    for r in rows:
        games[(r['week'], r['event_id'])] += 1
        if r['nflverse_id']:
            linked[r['week']] += 1
    for wk in sorted(byw):
        if a.week and wk != a.week:
            continue
        print(f"week {wk}: {sum(1 for k in games if k[0] == wk)} games, {byw[wk]} player-game rows, {linked[wk]} linked to nflverse ids")
    print('wrote', os.path.relpath(OUT, lib.ROOT), len(rows), 'rows')


if __name__ == '__main__':
    main()
