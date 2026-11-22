"""Gun to my head PROPS (Andy 2026-11-21 22:53): top 5 prop leans per matchup, every market eligible
(passing, rushing, receiving, touchdowns, fantasy, defense, kicking, team/game TD and FG totals).
Leans only (endorsed=false, execution_eligible=false). Same family-vote method as gun_to_my_head.py:

  1 production   last 5 games vs the line AND season average on the same side (>=4/5 Over or <=1/5; min 4 games)
  2 volume       usage trend, last 3 weeks vs season (+/-15%)
  3 matchup      opponent unit rank from FTN team tables (rank 1 = best; >=23 favors the offense side, <=10 against)
  4 game script  team projected points (sim center) vs season PPG (+/-3) and projected margin (+/-7)
  5 experts      distinct expert calls on the same player and market (net >= 1)
  6 availability Questionable = condition; Out/IR/Doubtful = excluded; fresh QB change = Under for that team's receivers
  7 weather      venue review materiality: passing, receiving, kicking Under; rushing Over
Tiers: Strong (3+ for, none against, no condition), Lean (2+ for and more for than against). Top 5 per game by
strength with at most 2 picks per category and 2 per player. Prices: Bookmaker 5:43 PM and BetOnline 5:46 PM (fresh);
DraftKings Predictions Thursday rows only where no fresh book offers the market (defense and kicker props), flagged stale.

Usage: python scripts/master-intel/gtmh_props.py --week 11
"""
import argparse, collections, csv, datetime, glob, json, os, re, statistics, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.dirname(__file__)); os.chdir(ROOT)
ALIAS = {'WSH': 'WAS', 'JAC': 'JAX', 'LVR': 'LV', 'LA': 'LAR'}
ab = lambda t: ALIAS.get(t, t)
SUF = re.compile(r'\b(jr|sr|ii|iii|iv|v)\b\.?')
def norm(n): return re.sub(r'\s+', ' ', SUF.sub('', re.sub(r"[^a-z ]", '', str(n or '').lower().replace('-', ' ')))).strip()


def J(p, d=None):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except (OSError, ValueError): return d


def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None


# market key -> (category, label, stat function over a log row or None for team/game markets, unit kind)
def _ppr(r):
    g = lambda k: num(r.get(k)) or 0
    return g('pass_yds') * .04 + g('pass_td') * 4 - g('pass_int') * 2 + (g('rush_yds') + g('rec_yds')) * .1 + (g('rush_td') + g('rec_td')) * 6 + g('rec') - g('fum_lost') * 2
MK = {
    'pass_yds': ('Passing', 'passing yards', lambda r: num(r.get('pass_yds'))), 'pass_cmp': ('Passing', 'completions', lambda r: num(r.get('pass_cmp'))),
    'pass_att': ('Passing', 'pass attempts', lambda r: num(r.get('pass_att'))), 'pass_td': ('Passing', 'passing TDs', lambda r: num(r.get('pass_td'))),
    'pass_int': ('Passing', 'interceptions thrown', lambda r: num(r.get('pass_int'))),
    'rush_yds': ('Rushing', 'rushing yards', lambda r: num(r.get('rush_yds'))), 'carries': ('Rushing', 'carries', lambda r: num(r.get('rush_car'))),
    'longest_rush': ('Rushing', 'longest rush', lambda r: num(r.get('rush_long'))),
    'rec': ('Receiving', 'receptions', lambda r: num(r.get('rec'))), 'rec_yds': ('Receiving', 'receiving yards', lambda r: num(r.get('rec_yds'))),
    'targets': ('Receiving', 'targets', lambda r: num(r.get('targets'))), 'longest_rec': ('Receiving', 'longest reception', lambda r: num(r.get('rec_long'))),
    'rush_rec_yds': ('Rushing', 'rush + rec yards', lambda r: (num(r.get('rush_yds')) or 0) + (num(r.get('rec_yds')) or 0) if (r.get('rush_yds') or r.get('rec_yds')) else None),
    'atd_1_plus': ('Touchdowns', 'anytime TD', lambda r: (num(r.get('rush_td')) or 0) + (num(r.get('rec_td')) or 0) if (r.get('rush_car') or r.get('targets') or r.get('rec')) else None),
    'fantasy_points': ('Fantasy', 'fantasy points (PPR)', lambda r: _ppr(r) if any(r.get(k) for k in ('pass_att', 'rush_car', 'targets')) else None),
    'tackles_assists': ('Defense', 'tackles + assists', lambda r: num(r.get('tackles'))), 'sacks': ('Defense', 'sacks', lambda r: num(r.get('sacks'))),
    'fg_made': ('Kicking', 'field goals made', lambda r: num(r.get('fg_made'))),
    'team_fg_total': ('Kicking', 'team field goals', None), 'game_fg_total': ('Kicking', 'game field goals', None),
    'team_td_total': ('Touchdowns', 'team touchdowns', None), 'game_td_total': ('Touchdowns', 'game touchdowns', None),
}
PASS_MK = {'pass_yds', 'pass_cmp', 'pass_att', 'pass_td', 'rec', 'rec_yds', 'targets', 'longest_rec'}
RUSH_MK = {'rush_yds', 'carries', 'longest_rush'}
VOL_MK = {'pass_yds', 'pass_cmp', 'pass_att', 'pass_td', 'rush_yds', 'carries', 'rec', 'rec_yds', 'targets', 'rush_rec_yds', 'fantasy_points', 'atd_1_plus'}
OFF_MK = VOL_MK | {'longest_rec', 'longest_rush', 'team_td_total', 'team_fg_total', 'fg_made'}
BAD_STATUS = {'IR', 'Injured Reserve', 'Out', 'OUT', 'Doubtful', 'PUP', 'Suspended'}


def load_offers(W, NAME, roster_team):
    """[(gid, player|None, team|None, market, side, line, price, book, at, fresh)]"""
    out = []
    b = J('data/generated/props/bookmaker-live-2026-11-21-week11.json', {}) or {}
    for r in b.get('rows', []):
        mk = r.get('market')
        if mk not in MK or not r.get('player') or r.get('side') not in ('Over', 'Under') or num(r.get('line')) is None: continue
        aw, hm = (r.get('event') or ' @ ').split(' @ '); gid = f'{NAME.get(aw)}@{NAME.get(hm)}'
        out.append((gid, r['player'], roster_team(r['player'], gid), mk, r['side'], float(r['line']), r.get('odds'), 'Bookmaker', 'Sat 5:43 PM PT', True))
    o = J('data/generated/props/betonline-live-2026-11-22-week11.json', {}) or {}
    for r in o.get('rows', []):
        mk = r.get('market')
        if mk not in MK: continue
        aw, hm = (r.get('event') or ' @ ').split(' @ '); gid = f'{NAME.get(aw)}@{NAME.get(hm)}'
        side = r.get('side'); line = num(r.get('line'))
        if mk == 'atd_1_plus':
            if str(side).lower() not in ('yes', 'over'): continue   # 2026-11-22: BEO 'No' rows were read as Over (Cook showed +160 = the No price; Yes is -200)
            side, line = 'Over', 0.5
        if side not in ('Over', 'Under') or line is None: continue
        team = ab(r.get('team') or '') or None
        if mk in ('team_fg_total', 'team_td_total'):
            t = re.search(r'^(.*?)\s+(?:Total|Team)', r.get('marketTitle') or '')
            team = NAME.get(t.group(1)) if t else team
            out.append((gid, None, team, mk, side, line, r.get('odds'), 'BetOnline', 'Sat 5:46 PM PT', True)); continue
        if mk == 'game_fg_total' or mk == 'game_td_total':
            out.append((gid, None, None, mk, side, line, r.get('odds'), 'BetOnline', 'Sat 5:46 PM PT', True)); continue
        if not r.get('player'): continue
        out.append((gid, r['player'], ab(team) if team else roster_team(r['player'], gid), mk, side, line, r.get('odds'), 'BetOnline', 'Sat 5:46 PM PT', True))
    # DK Predictions (Thursday): defense and kicker milestones only (no fresh book offers them tonight)
    d = J('data/generated/props/draftkings-predictions-feed-2026-11-19-week11.json', {}) or {}
    for r in d.get('rows', []):
        mk = r.get('market')
        if mk not in ('tackles_assists', 'sacks', 'fg_made') or not r.get('player'): continue
        line = num(r.get('lineEquiv')) if r.get('lineEquiv') is not None else (0.5 if str(r.get('label')) == '0.5+' else None)
        if line is None or r.get('american') is None: continue
        out.append((r.get('game'), r['player'], ab(r.get('team') or ''), mk, 'Over', line, int(r['american']), 'DK Predictions', 'Thu 1:12 PM PT', False))
    return out


def build(season, W):
    sched = J('public/schedule.json', {}); games = [g for g in (sched.get('games', sched) if isinstance(sched, dict) else sched) if int(g.get('week', 0)) == W]
    NAME = {}
    for g in games: NAME[g['visitorName']] = ab(g['visitor']); NAME[g['homeName']] = ab(g['home'])
    sim = J('reports/intel/w11-model/sim-w11-sat.json', {}) or {}; SG = sim.get('games', {})
    gids = [g for g in SG]
    kick = {f"{ab(g['visitor'])}@{ab(g['home'])}": g.get('kickoff_utc') for g in games}
    # rosters
    ro = J('data/nfl-rosters/espn-full-rosters-latest.json', {}) or {}; RN = collections.defaultdict(list)
    for name, recs in (ro.get('players') or {}).items():
        for x in recs: RN[norm(name)].append((ab(x.get('team')), x.get('position'), 'ir' if x.get('group') == 'injuredReserveOrOut' else x.get('status')))   # 2026-11-22: ESPN puts IR/out in group, status can still say day-to-day (Pat Bryant)
    def roster_team(player, gid):
        teams = set(gid.split('@')) if gid and '@' in gid else set()
        c = [t for t, _, _ in RN.get(norm(player), []) if t in teams]
        return c[0] if c else None
    def roster_pos(player, team):
        return next((p for t, p, _ in RN.get(norm(player), []) if t == team), None)
    # availability: latest event per player
    av = {}
    for e in sorted((J('data/player-availability/latest.json', {}) or {}).get('events', []), key=lambda e: e.get('published_at') or ''):
        av[(norm(e.get('player_name')), ab(e.get('team_abbr') or ''))] = e.get('normalized_status') or e.get('status_raw')
    # logs
    LOG = collections.defaultdict(list); TEAMG = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in csv.DictReader(open('data/archive/2026/season/player-games.csv', encoding='utf-8')):
        r['week'] = int(r['week']); LOG[norm(r['player'])].append(r); TEAMG[ab(r['team'])][r['week']].append(r)
    for k in LOG: LOG[k].sort(key=lambda r: r['week'])
    def team_series(team, mk):
        out = []
        for wk in sorted(TEAMG[team]):
            rows = TEAMG[team][wk]
            if mk == 'team_fg_total': out.append(sum(num(r.get('fg_made')) or 0 for r in rows))
            elif mk == 'team_td_total': out.append(sum((num(r.get(k)) or 0) for r in rows for k in ('rush_td', 'rec_td', 'def_td', 'int_td', 'kr_td', 'pr_td')))
        return out
    def game_series(gid, mk):
        aw, hm = gid.split('@'); base = 'team_fg_total' if mk == 'game_fg_total' else 'team_td_total'
        a, h = team_series(aw, base), team_series(hm, base)
        n = min(len(a), len(h)); return [a[-n + i] + h[-n + i] for i in range(n)] if n else []
    # usage trends
    UT = {}
    for k, v in ((J('data/generated/player-usage-trends-2026.json', {}) or {}).get('players') or {}).items():
        UT[(norm(v.get('player_name')), ab(v.get('team')))] = [x for _, x in sorted(((int(w), x) for w, x in (v.get('weekly') or {}).items()), key=lambda t: t[0]) if x is not None]
    # team context
    ppg = {}
    for f in glob.glob('data/generated/team-dossiers/2026-w11/*.json'):
        if re.match(r'^[A-Z]{2,3}\.json$', os.path.basename(f)):
            d = J(f, {}) or {}; ppg[ab(d.get('team'))] = ((d.get('season_profile_espn') or {}).get('ppg'), (d.get('season_profile_espn') or {}).get('red_zone_td_pct'))
    wx = {r['game']: r for r in (J('data/research-intel/review/2026-w11-weather-venue.json', {}) or {}).get('rows', [])}
    # QB change: manual Week 11 starter differs from the team's top passer in its most recent game
    qbman = {ab(p['team']): p['player_name'] for p in (J('data/projected-starters/2026/manual/qb-starters-2026-w11.json', {}) or {}).get('players', []) if p.get('role') == 'starter'}
    qbchange = {}
    for t, qb in qbman.items():
        wk = max(TEAMG[t]) if TEAMG[t] else None
        if wk is None: continue
        top = max(TEAMG[t][wk], key=lambda r: num(r.get('pass_att')) or 0)
        if norm(top['player']) != norm(qb): qbchange[t] = (top['player'], qb)
    # experts on props
    import extra_inputs as xi
    yt = J('data/podcasts/youtube-extracted-picks-2026-w11.json', {}) or {}
    try:
        import twitter_picks as tp; yt = tp.merge(yt, ROOT, season, str(W))
    except Exception as e: print('WARN twitter merge', e)
    yt = xi.merge_reviewed_podcasts(yt, ROOT, season, W, [])
    EXP = collections.defaultdict(dict)  # (norm player) -> {speaker: (market text, side)}
    def ex_add(spk, player, mtext, side):
        if not spk or not player: return
        s = 'Over' if re.search(r'\bover\b|\byes\b|\banytime\b|\+$', f'{side} {mtext}', re.I) else ('Under' if re.search(r'\bunder\b', f'{side} {mtext}', re.I) else None)
        if s: EXP[norm(player)][re.sub(r'\s+', ' ', str(spk)).strip() + '|' + str(mtext).lower()] = (str(mtext).lower(), s)
    for p in yt.get('picks', []):
        raw = p.get('raw') or {}
        pl = p.get('player') or raw.get('player')
        if pl: ex_add(p.get('speaker'), pl, f"{p.get('market') or raw.get('market') or ''} {p.get('pick') or ''}", p.get('side') or raw.get('side') or '')
    for f in glob.glob(f'data/vault-seed/manual/grok-week{W}-threads/*.csv'):
        for r in csv.DictReader(open(f, encoding='utf-8-sig')):
            if (r.get('bet_type') or '').startswith(('player', 'parlay')) and r.get('team_or_market'):
                ex_add(r.get('author'), r['team_or_market'], r.get('market') or '', r.get('selection') or '')
    for r in (J(f'data/intel/extracted/{season}-w{W}-chrome-article-picks.json', {}) or {}).get('picks', []):
        if r.get('player'): ex_add(r.get('speaker'), r['player'], r.get('market') or '', r.get('side') or '')
    MKWORDS = {'pass_yds': 'pass', 'pass_cmp': 'complet', 'pass_att': 'attempt', 'pass_td': 'pass', 'pass_int': 'intercept', 'rush_yds': 'rush', 'carries': 'carr|rush att',
               'rec': 'reception|catches|rec$', 'rec_yds': 'receiving|rec yd|rec_yds', 'targets': 'target', 'atd_1_plus': 'anytime|td|touchdown', 'rush_rec_yds': 'rush.*rec|scrimmage',
               'tackles_assists': 'tackle', 'sacks': 'sack', 'fg_made': 'field goal|fg', 'fantasy_points': 'fantasy', 'longest_rec': 'longest', 'longest_rush': 'longest'}
    def experts_for(player, mk, side):
        calls = [(k.split('|')[0], s) for k, (mt, s) in EXP.get(norm(player), {}).items() if re.search(MKWORDS.get(mk, '^$'), mt)]
        f = sorted({sp for sp, s in calls if s == side}); a = sorted({sp for sp, s in calls if s != side})
        return f, a

    offers = load_offers(W, NAME, roster_team)
    # group by (gid, player, team, market)
    G = collections.defaultdict(list); DISP = {}
    for o in offers:
        gid, pl, team, mk, side, line, price, book, at, fresh = o
        if gid not in SG or price is None: continue
        k = norm(pl) if pl else None
        if pl and (k not in DISP or len(pl) > len(DISP[k])): DISP[k] = pl
        G[(gid, k, team, mk)].append(dict(side=side, line=line, price=int(price), book=book, at=at, fresh=fresh))
    imp0 = lambda p: -p / (-p + 100) if p < 0 else 100 / (p + 100)
    def main_lines(offs):
        # per book: the two-way line priced closest to even; one-way markets: -200..+400, milestone nearest even money
        keep = []
        for book in {o['book'] for o in offs}:
            bo = [o for o in offs if o['book'] == book]
            two = collections.defaultdict(dict)
            for o in bo: two[o['line']][o['side']] = o
            pairs = [(ln, d) for ln, d in two.items() if 'Over' in d and 'Under' in d]
            if pairs:
                ln, d = min(pairs, key=lambda t: abs(imp0(t[1]['Over']['price']) - .5) + abs(imp0(t[1]['Under']['price']) - .5))
                keep += [d['Over'], d['Under']]
            else:
                ok = [o for o in bo if -200 <= o['price'] <= 400]
                if ok: keep.append(min(ok, key=lambda o: abs(imp0(o['price']) - .5)))
        return keep
    picks = collections.defaultdict(list); excluded = collections.Counter()
    for (gid, pk, team, mk), offs in G.items():
        aw, hm = gid.split('@'); pl = DISP.get(pk) if pk else None
        offs = main_lines(offs)
        if not offs: excluded['no main line'] += 1; continue
        if pl:
            if not team: excluded['not on either roster'] += 1; continue
            st = av.get((norm(pl), team))
            if st in BAD_STATUS: excluded[f'status {st}'] += 1; continue
            if not any(t == team and (s or 'active') not in ('injured reserve', 'ir') for t, _, s in RN.get(norm(pl), [])): excluded['roster status'] += 1; continue
        # fresh books first; DKP only if no fresh offer exists for this market
        fresh = [o for o in offs if o['fresh']]; offs = fresh or offs
        opp = (hm if team == aw else aw) if team else None
        g = SG[gid]; cat, label, fn = MK[mk]
        # series of the stat
        if pl:
            rows = [r for r in LOG.get(norm(pl), []) if fn(r) is not None]
            series = [fn(r) for r in rows]
        elif mk in ('team_fg_total', 'team_td_total'): series = team_series(team, mk) if team else []
        else: series = game_series(gid, mk)
        last5 = series[-5:]
        for side in ('Over', 'Under'):
            so = [o for o in offs if o['side'] == side and o.get('price') is not None]
            if not so: continue
            best = sorted(so, key=lambda o: ((o['line'] if side == 'Over' else -o['line']), -(o['price'] or -999)))[0]
            line = best['line']; F = {}; conds = []
            # 1 production
            if len(series) >= 4:
                hits = sum(1 for x in last5 if (x > line if side == 'Over' else x < line)); avg = statistics.mean(series)
                good = hits >= 4 and (avg > line if side == 'Over' else avg < line); bad = hits <= 1 and (avg < line if side == 'Over' else avg > line)
                F['Production'] = ('for' if good else ('against' if bad else None),
                                   f"{side} {line:g} hit in {hits} of the last {len(last5)} games; season average {avg:.1f} over {len(series)} games.")
            else: F['Production'] = (None, f'Only {len(series)} logged games; too thin to score.')
            # 2 volume
            u = UT.get((norm(pl), team)) if pl else None
            if u and len(u) >= 5 and mk in VOL_MK:
                l3, sa = statistics.mean(u[-3:]), statistics.mean(u)
                ch = (l3 - sa) / sa if sa else 0
                d = 'Over' if ch >= .15 else ('Under' if ch <= -.15 else None)
                F['Volume'] = ('for' if d == side else ('against' if d else None), f"Usage last 3 weeks {l3:.1f} vs season {sa:.1f} ({ch:+.0%}).")
            # 3 matchup
            mt = (g.get('matchup') or {}); R = (mt.get('ranks') or {})
            def rk(t, k): return (R.get(t) or {}).get(k)
            md = None; mtxt = None
            if team and opp:
                if mk in PASS_MK: r_ = rk(opp, 'def_pass'); mtxt = f'{opp} pass defense ranks #{r_} in EPA per dropback allowed'
                elif mk in RUSH_MK or mk == 'rush_rec_yds': r_ = rk(opp, 'def_rush'); mtxt = f'{opp} run defense ranks #{r_} in EPA per carry allowed'
                elif mk == 'pass_int': r_ = rk(opp, 'def_to'); mtxt = f'{opp} defense ranks #{r_} in takeaway rate'
                elif mk == 'sacks': r_ = rk(opp, 'off_sack'); mtxt = f'{opp} offense ranks #{r_} in sack rate allowed (1 = fewest)'
                elif mk == 'tackles_assists': r_ = rk(opp, 'plays'); mtxt = f'{opp} offense ranks #{r_} in plays per game'
                else: r_ = rk(opp, 'def_epa'); mtxt = f'{opp} defense ranks #{r_} in EPA per play allowed'
                if r_:
                    if mk == 'pass_int': md = 'Over' if r_ <= 10 else ('Under' if r_ >= 23 else None)
                    elif mk == 'sacks': md = 'Over' if r_ >= 23 else ('Under' if r_ <= 10 else None)
                    elif mk == 'tackles_assists': md = 'Over' if r_ <= 10 else ('Under' if r_ >= 23 else None)
                    else: md = 'Over' if r_ >= 23 else ('Under' if r_ <= 10 else None)
            elif mk.startswith('game_') and mt:
                ra, rh = rk(aw, 'def_epa'), rk(hm, 'def_epa')
                if ra and rh: mtxt = f'Defenses rank #{ra} ({aw}) and #{rh} ({hm}) in EPA per play allowed'; md = 'Over' if ra + rh >= 44 else ('Under' if ra + rh <= 22 else None)
            if mk in ('team_fg_total', 'game_fg_total', 'fg_made') and team:
                rz = (ppg.get(team) or (None, None))[1]
                if rz is not None: mtxt = f'{team} converts {rz:.0%} of red-zone trips into TDs'; md = 'Over' if rz < .5 else ('Under' if rz > .65 else None)
            if mtxt: F['Matchup'] = ('for' if md == side else ('against' if md else None), mtxt + '.')
            # 4 game script
            if g.get('center_line') is not None:
                L_, T_ = g['center_line'], g['center_total']; hp, ap = (T_ - L_) / 2, (T_ + L_) / 2
                if team:
                    tp_, op_ = (ap, hp) if team == aw else (hp, ap); margin = tp_ - op_; base = (ppg.get(team) or (None,))[0]
                    votes = []
                    if base and mk in OFF_MK: votes.append('Over' if tp_ - base >= 3 else ('Under' if tp_ - base <= -3 else None))
                    if mk in ('pass_att', 'pass_cmp', 'pass_yds', 'pass_int'): votes.append('Over' if margin <= -7 else ('Under' if margin >= 7 else None))
                    if mk in ('carries', 'rush_yds'): votes.append('Over' if margin >= 7 else ('Under' if margin <= -7 else None))
                    if mk == 'sacks': votes.append('Over' if margin >= 7 else None)
                    v = {x for x in votes if x}; d = next(iter(v)) if len(v) == 1 else None
                    F['Game script'] = ('for' if d == side else ('against' if d else None),
                                        f"Projected {team} {tp_:.1f}, {opp} {op_:.1f} ({team} {'by' if margin >= 0 else 'trailing by'} {abs(margin):.1f})" + (f"; {team} season scoring average {base:.1f}" if base and mk in OFF_MK else '') + '.')
                elif mk.startswith('game_'):
                    pass
            # 5 experts
            if pl:
                fe, ae = experts_for(pl, mk, side)
                if fe or ae:
                    d = 'for' if len(fe) > len(ae) else ('against' if len(ae) > len(fe) else None)
                    F['Experts'] = (d, f"{len(fe)} expert call(s) on this side" + (f" ({', '.join(fe[:3])})" if fe else '') + (f", {len(ae)} on the other" if ae else '') + '.')
            # 6 availability / QB
            if pl and av.get((norm(pl), team)) == 'Questionable': conds.append(f'{pl} is Questionable: confirm he is active.')
            if team in qbchange and mk in {'rec', 'rec_yds', 'targets', 'longest_rec'}:
                F['QB change'] = ('for' if side == 'Under' else 'against', f"{team} starts {qbchange[team][1]} after {qbchange[team][0]} took the most snaps last game.")
                conds.append(f'{team} quarterback change: {qbchange[team][1]} expected to start.')
            if team in ('TB',): conds.append('Mayfield Questionable: if Jalon Daniels starts, treat TB passing-game props as void.')
            if team in ('ARI',): conds.append('Josh Johnson preparing to start (Beck Q): ARI passing-game props assume Johnson.')
            # 7 weather
            w = wx.get(gid)
            if w and str(w.get('materiality') or 'none') not in ('none', ''):
                d = 'Under' if (mk in PASS_MK or mk in ('pass_int', 'fg_made', 'team_fg_total', 'game_fg_total', 'longest_rec')) else ('Over' if mk in RUSH_MK else None)
                if d: F['Weather'] = ('for' if d == side else 'against', f"Weather review flags it: {w.get('precip_prob_pct')}% rain, gusts {round((w.get('gust_kmh') or 0) * .621)} mph.")
            nf = sum(1 for v in F.values() if v[0] == 'for'); na = sum(1 for v in F.values() if v[0] == 'against')
            if nf < 2 or nf <= na: continue
            tier = 'Strong lean' if nf >= 3 and na == 0 and not conds else 'Lean'
            strength = abs(statistics.mean(series) - line) / max(line, 1) if series else 0
            other = [o for o in offs if o['side'] != side and o['book'] == best['book'] and o['line'] == line and o.get('price') is not None]
            imp = lambda p: -p / (-p + 100) if p < 0 else 100 / (p + 100)
            nv = (imp(best['price']) / (imp(best['price']) + imp(other[0]['price']))) if other else None
            name = pl or (f'{team} ' if team else '') + label
            picks[gid].append(dict(game=gid, player=pl, team=team, market=mk, category=cat, label=label, side=side, line=line,
                                   call=f"{name} {side} {line:g} {label}" if pl or team else f"{side} {line:g} {label}",
                                   best=dict(book=best['book'], price=best['price'], at=best['at'], fresh=best['fresh']),
                                   books=sorted({f"{o['book']} {o['side']} {o['line']:g} ({o['price']:+d})" for o in offs if o['side'] == side and o.get('price') is not None}),
                                   implied=imp(best['price']), no_vig=nv, tier=tier, n_for=nf, n_against=na, strength=strength, conditions=sorted(set(conds)),
                                   evidence=[dict(family=k, direction=v[0], detail=v[1]) for k, v in F.items()],
                                   endorsed=False, execution_eligible=False))
    out = {}
    for gid in sorted(SG, key=lambda x: (kick.get(x) or '', x)):
        cand = sorted(picks.get(gid, []), key=lambda p: (p['tier'] != 'Strong lean', -(p['n_for'] - p['n_against']), -p['n_for'], not p['best']['fresh'], -p['strength']))
        chosen, cat_n, ply_n, seen = [], collections.Counter(), collections.Counter(), set()
        for p in cand:
            key = (p['player'] or p['team'] or p['game'], p['market'])
            if key in seen or cat_n[p['category']] >= 2 or (p['player'] and ply_n[p['player']] >= 2): continue
            chosen.append(p); seen.add(key); cat_n[p['category']] += 1
            if p['player']: ply_n[p['player']] += 1
            if len(chosen) == 5: break
        out[gid] = dict(game=gid, kickoff_utc=kick.get(gid), picks=chosen, candidates=len(cand))
    return dict(schema='gtmh_props_v1', season=season, week=W, generated_at=datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                label='Lean · No Platinum Rose endorsement', qb_changes={k: list(v) for k, v in qbchange.items()}, excluded=dict(excluded), games=out)


if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('--season', type=int, default=2026); a.add_argument('--week', type=int, required=True); a = a.parse_args()
    doc = build(a.season, a.week)
    p = f'data/research-intel/review/{a.season}-w{a.week:02d}-gtmh-props.json'
    json.dump(doc, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('wrote', p, '| excluded', doc['excluded'], '| qb changes', doc['qb_changes'])
    for gid, g in doc['games'].items():
        print(f"{gid:8} {len(g['picks'])}/{g['candidates']}  " + ' || '.join(f"{p['call']} [{p['tier'][0]}{p['n_for']}-{p['n_against']} {p['best']['book'][:3]} {p['best']['price']:+d}]" for p in g['picks']))
