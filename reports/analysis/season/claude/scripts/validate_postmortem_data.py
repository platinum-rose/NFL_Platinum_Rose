"""Post-mortem data validator (Claude Team 2). Read-only on every input.

  python validate_postmortem_data.py --weeks 1-4 [--fetch-supabase]

Primary source: raw ESPN summaries in data/fantasy/boxscores/espn-<event>.json (athlete ids, team stats, scoring plays).
Checks, per week:
  R  raw boxes      : one final box per game, linescores = final, scoring plays reconcile to the final, player sums = team
                      stats, duplicate display names / last-name+initial look-alikes inside a game (grading-collision risk)
  D  derived files  : season-recap wNgames.json / wNgamesum.json, out/week-NN-teams.json, archive team-weeks.csv and the
                      cached Supabase game_results all agree with the raw finals
  X  nflverse       : cached Supabase player_stats (nflverse) vs ESPN player lines for the stats our legs grade on
  L  legs           : every placed leg in the wagers file graded by BOTH graders (season-recap/scripts/grade.py and
                      season/claude/scripts/lib.py); disagreements, ungradable legs, ledger-vs-box leg status,
                      ticket-level consistency, stored wNlegs.json vs a fresh grade, paper/real separation
Writes out/data-validation.md and out/data-validation.json. Exit code 1 if any ERROR.
--fetch-supabase refreshes data/xcheck/ with read-only REST GETs (anon key); nothing is written to Supabase.
"""
import argparse, collections, csv, glob, importlib, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib  # noqa: E402

ROOT = lib.ROOT
RECAP = os.path.join(ROOT, 'reports/bets/season-recap')
XCHECK = os.path.join(lib.HERE, 'data/xcheck')
FULL = {'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF',
        'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI', 'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE',
        'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
        'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX', 'Kansas City Chiefs': 'KC',
        'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA',
        'Minnesota Vikings': 'MIN', 'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG',
        'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT', 'San Francisco 49ers': 'SF',
        'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WSH'}
F = []  # findings


def add(sev, area, week, msg, **kw):
    F.append(dict(sev=sev, area=area, week=week, msg=msg, **kw))


def n(x):
    return lib.num(x)


# ------------------------------------------------------------------ R: raw boxes
def raw_games(week):
    out = {}
    for f in sorted(glob.glob(os.path.join(lib.BOX, 'espn-*.json'))):
        d = lib.jl(f); h = d.get('header', {})
        if h.get('week') != week or (h.get('season') or {}).get('year') != 2026:
            continue
        out.setdefault(str(h.get('id') or os.path.basename(f)[5:-5]), []).append((f, d))
    return out


def check_raw(week):
    games = {}
    for ev, lst in raw_games(week).items():
        if len(lst) > 1:
            add('WARN', 'R', week, f'event {ev}: {len(lst)} cached boxes ({", ".join(os.path.basename(x[0]) for x in lst)})')
        f, d = lst[0]
        comp = d['header']['competitions'][0]; cs = {c['homeAway']: c for c in comp['competitors']}
        a, h = lib.T(cs['away']['team']['abbreviation']), lib.T(cs['home']['team']['abbreviation']); key = f'{a}@{h}'
        if not comp.get('status', {}).get('type', {}).get('completed'):
            add('ERROR', 'R', week, f'{key}: box not final', event=ev)
        sc = {a: int(n(cs['away']['score'])), h: int(n(cs['home']['score']))}
        for side, tm in (('away', a), ('home', h)):
            ls = [n(x.get('value', x.get('displayValue'))) for x in cs[side].get('linescores', [])]
            if int(sum(ls)) != sc[tm]:
                add('ERROR', 'R', week, f'{key}: {tm} linescore sum {sum(ls):g} != final {sc[tm]}', event=ev)
        sp = d.get('scoringPlays') or []
        if not sp:
            add('ERROR', 'R', week, f'{key}: no scoring plays', event=ev)
        else:
            last = sp[-1]
            if (int(last.get('awayScore', -1)), int(last.get('homeScore', -1))) != (sc[a], sc[h]):
                add('ERROR', 'R', week, f"{key}: last scoring play {last.get('awayScore')}-{last.get('homeScore')} != final {sc[a]}-{sc[h]}", event=ev)
            pa = ph = 0
            for s in sp:
                da, dh = int(s['awayScore']) - pa, int(s['homeScore']) - ph; pa, ph = int(s['awayScore']), int(s['homeScore'])
                if min(da, dh) < 0 or (da and dh) or max(da, dh) not in (1, 2, 3, 6, 7, 8):
                    add('ERROR', 'R', week, f"{key}: odd scoring increment {da}/{dh} at '{s.get('text', '')[:60]}'", event=ev)
        tstat = {lib.T(t['team']['abbreviation']): {s['name']: s['displayValue'] for s in t['statistics']} for t in d['boxscore']['teams']}
        names = collections.defaultdict(set); pteam = collections.defaultdict(collections.Counter)
        for tb in d['boxscore']['players']:
            tm = lib.T(tb['team']['abbreviation'])
            for c in tb['statistics']:
                lab = c.get('labels') or []
                for at in c['athletes']:
                    st = dict(zip(lab, at.get('stats', []))); nm = at['athlete']['displayName']
                    names[nm].add((str(at['athlete'].get('id')), tm))
                    if c['name'] == 'passing':
                        ca = (st.get('C/ATT') or '0/0').split('/')
                        pteam[tm]['cmp'] += n(ca[0]); pteam[tm]['att'] += n(ca[1]); pteam[tm]['pyds'] += n(st.get('YDS'))
                        pteam[tm]['sky'] += n((st.get('SACKS') or '0-0').split('-')[-1])
                    if c['name'] == 'rushing':
                        pteam[tm]['ryds'] += n(st.get('YDS')); pteam[tm]['rcar'] += n(st.get('CAR'))
                    if c['name'] == 'receiving':
                        pteam[tm]['rec'] += n(st.get('REC')); pteam[tm]['recyds'] += n(st.get('YDS'))
        for tm, ts in tstat.items():
            p = pteam[tm]; ca = (ts.get('completionAttempts') or '0/0').split('/')
            chk = [('rushing yds', p['ryds'], n(ts.get('rushingYards'))), ('rush att', p['rcar'], n(ts.get('rushingAttempts'))),
                   ('completions', p['cmp'], n(ca[0])), ('pass att', p['att'], n(ca[1])),
                   ('receptions vs completions', p['rec'], n(ca[0])), ('rec yds vs pass yds', p['recyds'], p['pyds']),
                   ('net pass yds', p['pyds'] - p['sky'], n(ts.get('netPassingYards')))]
            for lab, got, want in chk:
                if abs(got - want) > 0.01:
                    add('WARN', 'R', week, f'{key} {tm}: {lab} players {got:g} vs team {want:g}', event=ev)
        for nm, ids in names.items():
            if len({i for i, _ in ids}) > 1:
                add('ERROR', 'R', week, f'{key}: two players share the box name "{nm}" {sorted(ids)}; name-keyed files collapse them', event=ev)
        by = collections.defaultdict(set)
        for nm in names:
            q = lib.norm(nm).split()
            if q:
                by[(q[-1], q[0][0])].add(nm)
        for v in by.values():
            if len(v) > 1:
                add('INFO', 'R', week, f'{key}: look-alike names {sorted(v)} (same last name + initial); fuzzy name matching can mix them', event=ev, names=sorted(v))
        # every TD scoring play must credit a player who is in the box under that exact name (ATD / first-TD grading)
        boxn = {lib.norm(x) for x in names}
        tp = lib.td_plays(dict(scoring=[dict(text=s.get('text', ''), team=lib.T(s['team']['abbreviation']), type=s['type']['text']) for s in sp]))
        for who, t in tp:
            if lib.norm(who) not in boxn:
                add('ERROR', 'R', week, f"{key}: TD scorer '{who}' ({t}) has no exact box-score name; ATD/first-TD legs on him would mis-grade", event=ev)
        games[key] = dict(event=ev, away=a, home=h, score=sc, file=os.path.basename(f), names=names)
    return games


# ------------------------------------------------------------------ D: derived files
def check_derived(week, G, sb_games):
    byev = {g['event']: k for k, g in G.items()}
    for fn, label in ((f'w{week}games.json', 'games'), (f'w{week}gamesum.json', 'gamesum')):
        p = os.path.join(RECAP, fn)
        if not os.path.exists(p):
            add('WARN', 'D', week, f'{fn} missing'); continue
        seen = set()
        for r in lib.jl(p):
            ev = str(r.get('event') or ''); k = byev.get(ev) or f"{lib.T(r['away'])}@{lib.T(r['home'])}"
            g = G.get(k)
            if not g:
                add('ERROR', 'D', week, f'{fn}: {k} not in raw boxes'); continue
            seen.add(k)
            s = (int(n(r['away_score'])), int(n(r['home_score']))) if 'away_score' in r else tuple(int(n(x)) for x in r['score'])
            if s != (g['score'][g['away']], g['score'][g['home']]):
                add('ERROR', 'D', week, f'{fn}: {k} score {s} != raw {g["score"]}')
            if label == 'games':
                got, raw_n = len(r.get('players') or {}), len(g['names'])
                if got != raw_n:
                    add('WARN', 'D', week, f'{fn}: {k} has {got} players vs {raw_n} distinct names in the raw box')
        if set(G) - seen:
            add('ERROR', 'D', week, f'{fn}: missing games {sorted(set(G) - seen)}')
    p = os.path.join(lib.OUT, f'week-{week:02d}-teams.json')
    if os.path.exists(p):
        T = lib.jl(p)
        for r in T['rows']:
            k = [x for x in G if r['team'] in (G[x]['away'], G[x]['home'])]
            if not k:
                add('ERROR', 'D', week, f'teams.json: {r["team"]} has no raw game'); continue
            g = G[k[0]]
            if (r['pts'], r['opp_pts']) != (g['score'][r['team']], g['score'].get(r['opp'])):
                add('ERROR', 'D', week, f'teams.json: {r["team"]} {r["pts"]}-{r["opp_pts"]} != raw {g["score"]}')
        if len(T['rows']) != 2 * len(G):
            add('ERROR', 'D', week, f'teams.json rows {len(T["rows"])} != 2 x {len(G)} games')
    else:
        add('WARN', 'D', week, f'week-{week:02d}-teams.json missing')
    p = os.path.join(ROOT, 'data/archive/2026/season/team-weeks.csv')
    if os.path.exists(p):
        rows = [r for r in csv.DictReader(open(p, encoding='utf-8')) if r['week'] == str(week)]
        if len(rows) != 2 * len(G):
            add('ERROR', 'D', week, f'team-weeks.csv rows {len(rows)} != {2 * len(G)}')
        for r in rows:
            tm, op = lib.T(r['team']), lib.T(r['opp']); k = [x for x in G if tm in (G[x]['away'], G[x]['home'])]
            if not k or (int(n(r['pts'])), int(n(r['opp_pts']))) != (G[k[0]]['score'].get(tm), G[k[0]]['score'].get(op)):
                add('ERROR', 'D', week, f'team-weeks.csv: {tm} {r["pts"]}-{r["opp_pts"]} vs raw {G[k[0]]["score"] if k else "?"}')
    if sb_games is not None:
        rows = [r for r in sb_games if r['week'] == week]
        if len(rows) != len(G):
            add('WARN', 'D', week, f'Supabase game_results has {len(rows)} rows vs {len(G)} raw games')
        for r in rows:
            a, h = FULL.get(r['away_team'], r['away_team']), FULL.get(r['home_team'], r['home_team']); k = f'{a}@{h}'
            g = G.get(k)
            if not g:
                add('ERROR', 'D', week, f'Supabase game_results {k} not in raw boxes'); continue
            if (r['away_score'], r['home_score']) != (g['score'][a], g['score'][h]) or r.get('status') != 'final':
                add('ERROR', 'D', week, f'Supabase game_results {k} {r["away_score"]}-{r["home_score"]} ({r.get("status")}) != raw {g["score"]}')


# ------------------------------------------------------------------ X: nflverse cross-check
XMAP = [('rushing', 'YDS', 'player_rush_yds'), ('rushing', 'CAR', 'player_rush_attempts'), ('receiving', 'REC', 'player_receptions'),
        ('receiving', 'YDS', 'player_reception_yds'), ('passing', 'YDS', 'player_pass_yds'), ('passing', 'TD', 'player_pass_tds'),
        ('passing', 'INT', 'player_pass_interceptions')]


def check_nflverse(week, LG, ps, leg_players):
    if ps is None:
        return {}
    idx = collections.defaultdict(list)
    for r in ps:
        if r['week'] == week:
            idx[(lib.T(r['team']), lib.norm(r['player_name']))].append(r)
    if not idx:
        add('INFO', 'X', week, 'no nflverse rows for this week in the snapshot yet (Tuesday toolbox loads them); cross-check skipped')
        return {}
    tot = mism = unmatched = 0
    for (wk, key), g in LG.items():
        if wk != week:
            continue
        for nm, p in g['players'].items():
            rs = idx.get((p['team'], lib.norm(nm)))
            if not rs:
                if any(p.get(c) for c in ('rushing', 'receiving', 'passing')):
                    unmatched += 1
                    if lib.norm(nm) in leg_players:
                        add('WARN', 'X', week, f'{key} {nm} ({p["team"]}): on a graded leg but not found in nflverse by team + name')
                continue
            r = rs[0]
            for cat, lab, col in XMAP:
                if cat not in p:
                    continue
                tot += 1; e = n(p[cat].get(lab)); v = n(r.get(col))
                if abs(e - v) > 0.01:
                    mism += 1; on = lib.norm(nm) in leg_players
                    add('WARN' if on else 'INFO', 'X', week, f"{key} {nm} {cat}.{lab}: ESPN {e:g} vs nflverse {v:g}" + (' (player on a graded leg)' if on else ''))
    return dict(compared=tot, mismatches=mism, unmatched_players_with_offense=unmatched)


# ------------------------------------------------------------------ L: legs
def recap_grader(week):
    os.environ['WEEK'] = str(week); os.environ['RECAP_DIR'] = RECAP
    sd = os.path.join(RECAP, 'scripts')
    if sd not in sys.path:
        sys.path.insert(0, sd)
    import grade, parse_placed  # noqa: E401
    importlib.reload(grade); importlib.reload(parse_placed)
    return parse_placed


def check_legs(week, LG, W, paper_ids):
    pp = recap_grader(week); leg_players = set()
    m = {'W': 'WON', 'L': 'LOST', 'P': 'PUSH'}
    stats = collections.Counter(); fresh = collections.defaultdict(list)
    for w in [x for x in W if str(x.get('week')) == str(week)]:
        if w.get('is_paper') or w['id'] in paper_ids:
            add('ERROR', 'L', week, f"paper ticket in the real wagers file: {w['id']}")
        res = []
        for l in w.get('legs') or []:
            s = pp.parse_leg(l)
            if (l.get('market') or '') == 'open_slot' or not s and (l.get('market') or '') == 'open_slot':
                continue
            stats['legs'] += 1
            if l.get('player'):
                leg_players.add(lib.norm(l['player']))
            a = m.get(pp.grade_spec(s)['result']) if s else None
            nl = lib.norm_leg(l, w); g = lib.game_for(LG, week, nl['game'])
            b, btxt, _ = lib.grade(nl, g)
            if s and s.get('kind') == 'cfb':
                a = b = 'CFB'
            fresh[w['id']].append(a)
            sel = (l.get('selection') or '')[:60]
            if g and l.get('player') and nl['kind'] == 'prop' and nl['key'] != 'dst_td':
                pl = lib.norm(l['player'])
                if not any(lib.norm(pn) == pl for pn in g['players']):
                    pn, _ = lib.player_in(g, l['player'], nl.get('team'))
                    if pn:
                        add('WARN', 'L', week, f"leg player matched by last name + initial only: '{l['player']}' -> box '{pn}' ({w['id'][-36:]})"); stats['fuzzy'] += 1
                    else:
                        stats['no_box_line'] += 1
                        add('INFO', 'L', week, f"leg player has no box line (graded LOST): '{l['player']}' ({nl['game']}, {w['id'][-36:]})")
            if a is None and b is None:
                add('ERROR', 'L', week, f"ungradable leg (both graders): {w['id'][-36:]} | {sel} | {btxt}"); stats['ungradable'] += 1
            elif a is None or b is None:
                add('WARN', 'L', week, f"one grader cannot grade ({'recap' if a is None else 'lib: ' + str(btxt)}): {w['id'][-36:]} | {sel}"); stats['one_grader'] += 1
            elif a != b:
                add('ERROR', 'L', week, f"graders disagree: {w['id'][-36:]} | {sel} | recap {a} vs lib {b} ({btxt})"); stats['disagree'] += 1
            led = (l.get('status') or '').upper(); best = a or b
            if led in ('WON', 'LOST', 'PUSH') and best in ('WON', 'LOST', 'PUSH') and led != best:
                add('ERROR', 'L', week, f"ledger leg {led} but box says {best}: {w['id'][-36:]} | {sel}"); stats['ledger_wrong'] += 1
            elif led in ('', 'PENDING', 'OPEN') and w.get('status') == 'SETTLED':
                stats['ledger_pending_in_settled'] += 1
            res.append(best)
        if w.get('status') != 'SETTLED':
            add('WARN', 'L', week, f"ticket not settled: {w['id']}"); continue
        r = w.get('result'); rr = bool(w.get('round_robin')) or 'round_robin' in w['id']
        if not rr and res and 'CFB' not in res and None not in res:
            if r == 'win' and any(x == 'LOST' for x in res):
                add('ERROR', 'L', week, f"ticket marked win but a leg lost: {w['id']}")
            if r == 'loss' and all(x in ('WON', 'PUSH') for x in res):
                add('ERROR', 'L', week, f"ticket marked loss but every leg won/pushed: {w['id']}")
        pay = w.get('settled_payout_usd') or 0
        if r == 'win' and not pay > 0:
            add('ERROR', 'L', week, f"won ticket without a payout: {w['id']}")
        if r == 'loss' and pay > 0 and not rr:
            add('WARN', 'L', week, f"lost ticket with payout {pay}: {w['id']}")
    if stats['ledger_pending_in_settled']:
        add('WARN', 'L', week, f"{stats['ledger_pending_in_settled']} legs still PENDING inside settled tickets (ticket results stand; leg statuses are stale)")
    p = os.path.join(RECAP, f'w{week}legs.json')
    if os.path.exists(p):
        D = lib.jl(p); stale = 0; ids = {w['id'] for w in W if str(w.get('week')) == str(week)}
        for t in D['tickets']:
            if t['id'] not in ids:
                add('WARN', 'L', week, f"w{week}legs.json ticket not in the wagers file: {t['id']}"); continue
            cand = fresh.get(t['id'], [])
            for i, l in enumerate(t['legs']):
                if i < len(cand) and cand[i] not in (None, 'CFB') and m.get(l['result'], l['result']) != cand[i]:
                    stale += 1
                    add('WARN', 'L', week, f"w{week}legs.json stale: {t['id'][-36:]} | {l['label'][:50]} stored {l['result']} vs fresh {cand[i]}")
        stats['stored_stale'] = stale
    else:
        add('WARN', 'L', week, f'w{week}legs.json missing (no post-mortem leg table for this week)')
    # other copies of the week's leg table elsewhere under reports/bets (e.g. week3-recap/) that disagree with the canonical one
    for q in glob.glob(os.path.join(ROOT, 'reports/bets/**/', f'w{week}legs.json'), recursive=True):
        if os.path.abspath(q) == os.path.abspath(p) or not os.path.exists(p):
            continue
        A, B = lib.jl(q), lib.jl(p)
        ka = {(x['ticket'], x['label']): x['result'] for x in A['legs']}; kb = {(x['ticket'], x['label']): x['result'] for x in B['legs']}
        diff = sum(1 for k in ka if k in kb and ka[k] != kb[k]) + len(set(ka) ^ set(kb))
        if diff:
            add('INFO', 'L', week, f'superseded copy {os.path.relpath(q, ROOT)} differs from the canonical season-recap table in {diff} legs ({len(A["tickets"])} vs {len(B["tickets"])} tickets); use season-recap/w{week}legs.json')
    return stats, leg_players


def fetch_supabase():
    env = {}
    for line in open(os.path.join(ROOT, '.env'), encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1); env[k] = v.strip().strip('"\'')
    url, key = env['SUPABASE_URL'].rstrip('/'), env['VITE_SUPABASE_ANON_KEY']

    def get(path):
        out, off = [], 0
        while True:
            r = urllib.request.Request(f"{url}/rest/v1/{path}&offset={off}&limit=1000", headers={'apikey': key, 'Authorization': 'Bearer ' + key})
            d = json.load(urllib.request.urlopen(r, timeout=60)); out += d
            if len(d) < 1000:
                return out
            off += 1000
    os.makedirs(XCHECK, exist_ok=True)
    json.dump(get('game_results?select=*&season=eq.2026'), open(os.path.join(XCHECK, 'sb_game_results.json'), 'w'))
    json.dump(get('player_stats?select=*&season=eq.2026'), open(os.path.join(XCHECK, 'sb_player_stats.json'), 'w'))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--weeks', default='1-4'); ap.add_argument('--fetch-supabase', action='store_true')
    a = ap.parse_args()
    lo, hi = (int(x) for x in a.weeks.split('-')) if '-' in a.weeks else (int(a.weeks), int(a.weeks))
    if a.fetch_supabase:
        try:
            fetch_supabase()
        except Exception as e:  # offline or key missing: fall back to the cached snapshot
            add('INFO', 'X', 0, f'Supabase snapshot refresh failed ({str(e)[:120]}); using the cached copy')
    gp, pp = os.path.join(XCHECK, 'sb_game_results.json'), os.path.join(XCHECK, 'sb_player_stats.json')
    sbg = lib.jl(gp) if os.path.exists(gp) else None
    sbp = lib.jl(pp) if os.path.exists(pp) else None
    if sbg is None:
        add('INFO', 'D', 0, 'no Supabase snapshot in data/xcheck (run with --fetch-supabase)')
    W = lib.load_wagers()
    pw = os.path.join(ROOT, 'data/official-picks/paper-wagers-2026.json')
    paper_ids = {p['id'] for p in lib.jl(pw)} if os.path.exists(pw) else set()
    summary = {}
    for wk in range(lo, hi + 1):
        G = check_raw(wk)
        if len(G) not in (13, 14, 15, 16):
            add('ERROR', 'R', wk, f'{len(G)} raw games for the week')
        check_derived(wk, G, sbg)
        LG = lib.load_games({wk})
        ls, players = check_legs(wk, LG, W, paper_ids)
        xs = check_nflverse(wk, LG, sbp, players)
        summary[wk] = dict(games=len(G), legs=dict(ls), nflverse=xs)
    c = collections.Counter(f['sev'] for f in F)
    os.makedirs(lib.OUT, exist_ok=True)
    json.dump(dict(summary=summary, counts=dict(c), findings=F), open(os.path.join(lib.OUT, 'data-validation.json'), 'w'), indent=1, default=str)
    L = [f'# Post-mortem data validation, weeks {lo}-{hi}', '',
         f'Generated by `reports/analysis/season/claude/scripts/validate_postmortem_data.py`. ERROR {c["ERROR"]} · WARN {c["WARN"]} · INFO {c["INFO"]}.', '',
         '| Week | Games | Legs | Ungradable | One grader only | Grader disagreements | Fuzzy name matches | No box line | Ledger leg wrong | Ledger PENDING in settled | Stored legs stale | nflverse compared / mismatched |',
         '|---|---|---|---|---|---|---|---|---|---|---|---|']
    for wk, s in summary.items():
        l = s['legs']; x = s['nflverse'] or {}
        L.append(f"| {wk} | {s['games']} | {l.get('legs', 0)} | {l.get('ungradable', 0)} | {l.get('one_grader', 0)} | {l.get('disagree', 0)} | {l.get('fuzzy', 0)} | {l.get('no_box_line', 0)} | {l.get('ledger_wrong', 0)} | "
                 f"{l.get('ledger_pending_in_settled', 0)} | {l.get('stored_stale', '—')} | {x.get('compared', '—')} / {x.get('mismatches', '—')} |")
    for sev in ('ERROR', 'WARN', 'INFO'):
        rows = [f for f in F if f['sev'] == sev]
        if rows:
            L += ['', f'## {sev} ({len(rows)})', ''] + [f"- W{f['week']} [{f['area']}] {f['msg']}" for f in rows[:500]]
    open(os.path.join(lib.OUT, 'data-validation.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print('\n'.join(L[:12])); print(dict(c))
    sys.exit(1 if c['ERROR'] else 0)


if __name__ == '__main__':
    main()
