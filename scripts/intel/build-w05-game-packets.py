#!/usr/bin/env python3
"""Build one self-contained evidence packet per remaining Week 5 game.

Zero-cost and deterministic: reads local files only (no network, no Supabase, no paid calls).
Output: data/research-intel/game-packets/2026-w05/<AWAY>@<HOME>.{json,md}, _slate-context.md, _slate-index.json

Usage: python3 scripts/intel/build-w05-game-packets.py [--now ISO] [--out DIR]
"""
import argparse, datetime as dt, hashlib, json, os, re, subprocess, sys
from collections import defaultdict

WEEK = 5
ROOT = os.getcwd()
P = {
    'schedule': 'public/schedule.json',
    'bkr': None,  # set below from newest capture
    'beo': None,
    'quant': 'data/research-intel/proposed/2026-w05-quantitative-synthesis.json',
    'elig': 'data/research-intel/proposed/2026-w05-tier-eligible-rows.json',
    'verified': 'data/generated/master-intel/w05-expert-verified.json',
    'digest': 'scratch/w05-synthesis-digest-sat.md',
    'splits': 'data/research-intel/source-evidence/2026-10-09-action-network-week5-betting-splits-raw.json',
    'openers': 'data/odds/actionnetwork-openers-2026-w05.json',
    'weather': 'data/research-intel/review/2026-w05-weather-venue.json',
    'secondary': 'data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json',
    'power': 'data/generated/team-profiles/team-power-ratings-2026.json',
    'avail': 'data/player-availability/impact-digest-latest.json',
    'ftn': 'data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json',
    'supercontest': 'data/supercontest/week-05-2026-verified-lines.json',
    'sim': 'scripts/intel/margin-simulator.mjs',
    'starters': 'data/projected-starters/2026/latest.json',
    'operator': 'data/research-intel/operator-confirmed-starters-2026-w05.json',
    'espn': 'data/research-intel/source-evidence/espn-status-w05.json',
}
DIV = {
    'AFC East': ['BUF', 'MIA', 'NE', 'NYJ'], 'AFC North': ['BAL', 'CIN', 'CLE', 'PIT'],
    'AFC South': ['HOU', 'IND', 'JAX', 'TEN'], 'AFC West': ['DEN', 'KC', 'LAC', 'LV'],
    'NFC East': ['DAL', 'NYG', 'PHI', 'WAS'], 'NFC North': ['CHI', 'DET', 'GB', 'MIN'],
    'NFC South': ['ATL', 'CAR', 'NO', 'TB'], 'NFC West': ['ARI', 'LAR', 'SEA', 'SF'],
}
TEAM_DIV = {t: d for d, ts in DIV.items() for t in ts}
ALIAS = {'JAC': 'JAX', 'LA': 'LAR', 'WSH': 'WAS'}
FULL = {}



def _latest_capture(prefix):
    import glob as _g, json as _j
    best = None
    for p in _g.glob('data/generated/props/%s-live-2026-10-*-week5.json' % prefix):
        if 'failed' in p:
            continue
        try:
            c = _j.load(open(p, encoding='utf-8')).get('capturedAt') or ''
        except Exception:
            continue
        if best is None or c > best[0]:
            best = (c, p.replace('\\', '/'))
    return best[1]

P['bkr'] = _latest_capture('bookmaker')
P['beo'] = _latest_capture('betonline')


def load(key):
    with open(P[key], encoding='utf-8') as f:
        return json.load(f)


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for ch in iter(lambda: f.read(1 << 20), b''):
            h.update(ch)
    return h.hexdigest()


def parse_ts(s):
    return dt.datetime.fromisoformat(s.replace('Z', '+00:00'))


def expiry(cap, kick):
    ws = kick - dt.timedelta(hours=6)
    if cap + dt.timedelta(hours=3) < ws:
        return min(cap + dt.timedelta(hours=6), ws)
    return cap + dt.timedelta(hours=3)


def fnum(x):
    if x is None:
        return None
    return int(x) if float(x) == int(x) else x


# ---------------- schedule / standings ----------------
def build_standings(games):
    rec = {}
    for g in games:
        if g.get('status') != 'post' or g.get('season_type') != 2:
            continue
        for t, o, pf, pa, home in ((g['home'], g['visitor'], g['homeScore'], g['visitorScore'], True),
                                   (g['visitor'], g['home'], g['visitorScore'], g['homeScore'], False)):
            r = rec.setdefault(t, {'w': 0, 'l': 0, 't': 0, 'pf': 0, 'pa': 0, 'games': [], 'home': [0, 0, 0], 'away': [0, 0, 0], 'div': [0, 0, 0]})
            res = 'W' if pf > pa else ('L' if pf < pa else 'T')
            idx = {'W': 0, 'L': 1, 'T': 2}[res]
            r[('w', 'l', 't')[idx]] += 1
            r['pf'] += pf
            r['pa'] += pa
            r['home' if home else 'away'][idx] += 1
            if TEAM_DIV.get(t) == TEAM_DIV.get(o):
                r['div'][idx] += 1
            r['games'].append({'week': g['week'], 'kickoff_utc': g['kickoff_utc'], 'opp': o, 'site': 'H' if home else 'A', 'pf': pf, 'pa': pa, 'result': res})
    for t in TEAM_DIV:
        rec.setdefault(t, {'w': 0, 'l': 0, 't': 0, 'pf': 0, 'pa': 0, 'games': [], 'home': [0, 0, 0], 'away': [0, 0, 0], 'div': [0, 0, 0]})
    for r in rec.values():
        r['games'].sort(key=lambda x: x['kickoff_utc'])
    return rec


def winpct(r):
    n = r['w'] + r['l'] + r['t']
    return (r['w'] + 0.5 * r['t']) / n if n else 0.0


def rstr(a):
    return '%d-%d%s' % (a[0], a[1], '-%d' % a[2] if a[2] else '')


def recstr(r):
    return '%d-%d%s' % (r['w'], r['l'], '-%d' % r['t'] if r['t'] else '')


def team_block(t, rec, games, kick):
    r = rec[t]
    opp_w = opp_l = opp_t = 0
    for g in r['games']:
        o = rec[g['opp']]
        opp_w += o['w']; opp_l += o['l']; opp_t += o['t']
    prior = [g for g in r['games'] if g['kickoff_utc'] < kick.strftime('%Y-%m-%dT%H:%M:%S')]
    last = prior[-1] if prior else None
    rest = round((kick - parse_ts(last['kickoff_utc'])).total_seconds() / 86400.0, 1) if last else None
    played_weeks = {g['week'] for g in r['games']}
    mine = [g for g in games if t in (g['home'], g['visitor']) and g.get('season_type') == 2]
    bye_weeks_all = sorted(set(range(1, 19)) - {g['week'] for g in mine})
    fut = sorted([g for g in mine if g.get('status') != 'post' and g['week'] >= WEEK and g['kickoff_utc'] > kick.strftime('%Y-%m-%dT%H:%M:%S')], key=lambda g: g['kickoff_utc'])
    upcoming = [{'week': g['week'], 'opp': g['visitor'] if g['home'] == t else g['home'], 'site': 'H' if g['home'] == t else 'A',
                 'kickoff_utc': g['kickoff_utc'], 'opp_division': TEAM_DIV.get(g['visitor'] if g['home'] == t else g['home'])} for g in fut[:4]]
    n = r['w'] + r['l'] + r['t']
    return {
        'team': t, 'division': TEAM_DIV[t], 'record': recstr(r), 'games_played': n,
        'points_for': r['pf'], 'points_against': r['pa'], 'point_diff': r['pf'] - r['pa'],
        'ppg': round(r['pf'] / n, 1) if n else None, 'papg': round(r['pa'] / n, 1) if n else None,
        'home_record': rstr(r['home']), 'away_record': rstr(r['away']), 'division_record': rstr(r['div']),
        'results': [dict(g, opp_record=recstr(rec[g['opp']])) for g in r['games']],
        'opponents_record_to_date': '%d-%d%s' % (opp_w, opp_l, '-%d' % opp_t if opp_t else ''),
        'rest_days_before_this_game': rest,
        'bye_weeks_already_used': [w for w in bye_weeks_all if w < WEEK and w not in played_weeks],
        'bye_weeks_remaining': [w for w in bye_weeks_all if w > WEEK],
        'upcoming_after_this_game': upcoming,
    }


def division_table(div, rec):
    rows = []
    for t in DIV[div]:
        r = rec[t]
        rows.append({'team': t, 'record': recstr(r), 'pct': round(winpct(r), 3), 'point_diff': r['pf'] - r['pa'], 'div': rstr(r['div'])})
    rows.sort(key=lambda x: (-x['pct'], -x['point_diff']))
    for i, x in enumerate(rows, 1):
        x['rank'] = i
    return rows


def conference_order(conf, rec):
    ts = [t for d, l in DIV.items() if d.startswith(conf) for t in l]
    rows = [{'team': t, 'record': recstr(rec[t]), 'pct': round(winpct(rec[t]), 3), 'point_diff': rec[t]['pf'] - rec[t]['pa']} for t in ts]
    rows.sort(key=lambda x: (-x['pct'], -x['point_diff']))
    for i, x in enumerate(rows, 1):
        x['order'] = i
    return rows


# ---------------- markets ----------------
def book_lines(book, away_full, home_full):
    ev = '%s @ %s' % (away_full, home_full)
    out = {'spread': [], 'total': [], 'moneyline': []}
    for r in book['rows']:
        if (r.get('event') or r.get('game')) != ev or r.get('market') != 'game_lines' or r.get('bet') not in out:
            continue
        side = r.get('side') or r.get('team')
        if r['bet'] == 'moneyline':
            out['moneyline'].append({'side': side, 'odds': r.get('odds'), 'available': r.get('available')})
        else:
            out[r['bet']].append({'side': side, 'line': r.get('line'), 'odds': r.get('odds'), 'available': r.get('available')})
    return out


def run_sim(home_line, total, mode='margin'):
    out = []
    for adj in (-3, -2, -1, 0, 1, 2, 3):
        try:
            p = subprocess.run(['node', P['sim'], '--home-line', str(home_line), '--total', str(total), '--margin-adj', str(adj if mode == 'margin' else 0), '--total-adj', str(adj if mode == 'total' else 0)], capture_output=True, text=True, timeout=60)
            j = json.loads(p.stdout)
            out.append({('home_margin_edge_pts' if mode == 'margin' else 'total_edge_pts'): adj, 'home_cover': round(j['home_cover'], 4), 'away_cover': round(j['away_cover'], 4),
                        'side_push': round(j['side_push'], 4), 'over': round(j['over'], 4), 'under': round(j['under'], 4), 'total_push': round(j['total_push'], 4)})
        except Exception as e:  # noqa
            out.append({('home_margin_edge_pts' if mode == 'margin' else 'total_edge_pts'): adj, 'error': str(e)[:120]})
    return out



# Static stadium reference (stable facts, NOT a captured source): roof type by home team. Fixed domes are enclosed; retractable roofs need a game-day status check.
ROOF = {'DET': 'fixed dome', 'MIN': 'fixed dome', 'NO': 'fixed dome', 'LV': 'fixed dome',
        'ATL': 'retractable roof (status must be checked)', 'DAL': 'retractable roof (status must be checked)', 'HOU': 'retractable roof (status must be checked)',
        'IND': 'retractable roof (status must be checked)', 'ARI': 'retractable roof (status must be checked)',
        'LAR': 'covered but open-sided (weather can still matter)', 'LAC': 'covered but open-sided (weather can still matter)'}


def venue_block(home, sched_row):
    roof = ROOF.get(home, 'outdoor')
    note = 'static stadium table, not a live capture; the schedule data has no venue field, so neutral-site or relocated games are NOT detected here (check the source quotes)'
    return {'home_team_stadium_roof': roof, 'indoor_for_weather': roof == 'fixed dome', 'venue_field_in_schedule_data': any(k in (sched_row or {}) for k in ('venue', 'stadium', 'neutral_site')), 'note': note}


def power_label_check(pw_team, tm):
    """The power-rating attribution text says prior-season results; test whether net points per game equals the 2026 four-game average."""
    try:
        net = pw_team['power_rating']['net_points_per_game']
        calc = round(tm['point_diff'] / tm['games_played'], 2)
        return {'net_ppg': net, 'recomputed_2026_point_diff_per_game': calc, 'matches_2026': abs(net - calc) < 0.01}
    except Exception:  # noqa
        return {'matches_2026': None}


def wx_row_guard(weather, key):
    r = next((x for x in weather['rows'] if x.get('game') == key), None)
    if r and str(r.get('materiality', '')).startswith('review_required'):
        return r['materiality']
    return None


def scr_reversed(scr, away, home):
    return bool(scr) and scr.get('away_team') == home and scr.get('home_team') == away


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--now', default=None)
    ap.add_argument('--out', default='data/research-intel/game-packets/2026-w05')
    ap.add_argument('--exclude', default='TB@DAL', help='comma list of AWAY@HOME already final (schedule.json status can lag)')
    a = ap.parse_args()
    now = parse_ts(a.now) if a.now else dt.datetime.now(dt.timezone.utc)
    os.makedirs(a.out, exist_ok=True)

    sched = load('schedule')
    patched = []
    for f in (load('espn').get('finals') or []):
        for g in sched:
            if g['visitor'] == f['visitor'] and g['home'] == f['home'] and g.get('week') == WEEK and g.get('status') != 'post':
                g['status'], g['visitorScore'], g['homeScore'] = 'post', f['visitorScore'], f['homeScore']
                patched.append('%s@%s %s-%s (ESPN final, schedule.json said pre)' % (f['visitor'], f['home'], f['visitorScore'], f['homeScore']))
    print('schedule patched from ESPN finals:', patched)
    rec = build_standings(sched)
    w5 = [g for g in sched if g.get('week') == WEEK and g.get('season_type') == 2 and g.get('status') != 'post']
    excl = {x.strip() for x in a.exclude.split(',') if x.strip()}
    w5 = [g for g in w5 if '%s@%s' % (g['visitor'], g['home']) not in excl]
    w5.sort(key=lambda g: g['kickoff_utc'])
    bkr, beo, quant = load('bkr'), load('beo'), load('quant')
    elig, ver = load('elig'), load('verified')
    splits, openers = load('splits'), load('openers')
    weather, sec, power, avail, ftn = load('weather'), load('secondary'), load('power'), load('avail'), load('ftn')
    sc = load('supercontest')
    starters, operator, espn = load('starters'), load('operator'), load('espn')
    bkr_cap, beo_cap = parse_ts(bkr['capturedAt']), parse_ts(beo['capturedAt'])
    digest = open(P['digest'], encoding='utf-8').read().splitlines()
    vrows = ver['rows']
    elig_idx = {e['index'] for e in elig['eligible']}
    near_idx = set(elig.get('near_miss_rows', []))
    names = {}
    for g in sched:
        names[g['home']] = g['homeName']; names[g['visitor']] = g['visitorName']

    index = {'generated_at': now.isoformat(), 'week': WEEK, 'packets': [], 'inputs': {k: {'path': v, 'sha256': sha(v)} for k, v in P.items() if k not in ('sim',) and os.path.exists(v)}}
    index['inputs']['sim'] = {'path': P['sim'], 'sha256': sha(P['sim'])}

    for g in w5:
        key = '%s@%s' % (g['visitor'], g['home'])
        kick = parse_ts(g['kickoff_utc'])
        away, home = g['visitor'], g['home']
        # market
        bk = book_lines(bkr, g['visitorName'], g['homeName'])
        be = book_lines(beo, g['visitorName'], g['homeName'])
        market = {
            'BKR': {'source_path': P['bkr'], 'captured_at': bkr['capturedAt'], 'expires_for_recommendation_at': expiry(bkr_cap, kick).isoformat(), 'fresh_at_build': now < expiry(bkr_cap, kick), 'lines': bk},
            'BEO': {'source_path': P['beo'], 'captured_at': beo['capturedAt'], 'expires_for_recommendation_at': expiry(beo_cap, kick).isoformat(), 'fresh_at_build': now < expiry(beo_cap, kick), 'lines': be},
        }
        def home_spread(lines):
            for x in lines['spread']:
                if x['side'] == g['homeName'] and x.get('line') is not None:
                    return x['line']
            return None
        def total_of(lines):
            for x in lines['total']:
                if x.get('line') is not None:
                    return x['line']
            return None
        hl_b, tot_b = home_spread(bk), total_of(bk)
        hl_e, tot_e = home_spread(be), total_of(be)
        conflict = None
        if hl_b is not None and hl_e is not None and abs(hl_b - hl_e) >= 1.0:
            conflict = 'BKR home line %s vs BEO %s (>=1.0 pt apart); recapture before relying on either' % (hl_b, hl_e)
        if tot_b is not None and tot_e is not None and abs(tot_b - tot_e) >= 1.5:
            conflict = (conflict + '; ' if conflict else '') + 'BKR total %s vs BEO %s' % (tot_b, tot_e)
        market['book_conflict'] = conflict
        if hl_b is not None and tot_b is not None:
            fav_home = hl_b < 0
            s = abs(hl_b)
            market['market_implied_score'] = {home: round((tot_b + (s if fav_home else -s)) / 2, 2), away: round((tot_b - (s if fav_home else -s)) / 2, 2), 'basis': 'BKR home line %s total %s' % (hl_b, tot_b)}
        # openers / splits
        op = None
        og = openers.get('games', {})
        for k, v in (og.items() if isinstance(og, dict) else og):
            if k == key:
                op = v
        sp = None
        for r in splits['records']:
            if ALIAS.get(r['away_team'], r['away_team']) == away and ALIAS.get(r['home_team'], r['home_team']) == home:
                sp = r
        # supercontest
        scr = None
        for r in (sc.get('games') or sc.get('rows') or sc.get('lines') or []):
            txt = json.dumps(r)
            if away in txt and home in txt:
                scr = r
        # quant
        qg = next((q for q in quant['games'] if q['away'] == away and q['home'] == home), None)
        simrows = run_sim(hl_b, tot_b) if (hl_b is not None and tot_b is not None) else []
        simtot = run_sim(hl_b, tot_b, 'total') if (hl_b is not None and tot_b is not None) else []
        # digest rows
        drows = [l for l in digest if l.startswith(key + ' |')]
        # evidence rows
        ev = []
        for i, r in enumerate(vrows):
            if r.get('game') != key or r.get('verdict') != 'verified':
                continue
            e = {'row': 'w05-expert-verified.json#rows[%d]' % i, 'kind': r.get('kind'), 'outlet': r.get('outlet'), 'persons': r.get('persons'),
                 'market': r.get('market'), 'side': r.get('side'), 'line': r.get('line'), 'price': r.get('price'), 'published': r.get('published'),
                 'best_bet': r.get('best_bet'), 'tier_eligible': i in elig_idx, 'near_miss': i in near_idx}
            if i in elig_idx or i in near_idx:
                e['url'] = r.get('url'); e['quote'] = r.get('quote')
            ev.append(e)
        counts = defaultdict(int)
        for e in ev:
            counts['tier_eligible' if e['tier_eligible'] else ('near_miss' if e['near_miss'] else 'corroboration_only')] += 1
        # context slices
        wx = next((r for r in weather['rows'] if r.get('game') == key), None)
        secm = [m for m in sec['matchups'] if m.get('game_id') == g['game_id']]
        pw = {t: next((r for r in power['rows'] if r.get('team_abbr') == t), None) for t in (away, home)}
        av = {}
        for t in (away, home):
            td = avail['teams'].get(t, {})
            av[t] = {k: td.get(k) for k in ('event_count', 'qb_events', 'offensive_line_worsening', 'defensive_front_worsening', 'top_score')}
            av[t]['top_events'] = [{k: e.get(k) for k in ('player_name', 'position', 'unit', 'event_type', 'availability_trend', 'impact_bucket', 'score', 'signal')} for e in (td.get('top_events') or [])[:8]]
        ft = {}
        for t in (away, home):
            recs = (ftn['team_context'].get(t) or {}).get('records', [])
            team_level = [r for r in recs if 'Player' not in (r.get('metrics') or {})]
            ft[t] = {'record_count': len(recs), 'team_level_tables': team_level}
        # quarterbacks: operator-confirmed starter + projected-starter QB rows (stale rows are labelled by their own evidence text)
        qbs = {}
        for t in (away, home):
            rows_q = []
            for pl in starters.get('players', []):
                if pl.get('team') == t and pl.get('position') == 'QB':
                    srcs = pl.get('sources') or []
                    rows_q.append({'player': pl.get('player_name'), 'role': pl.get('role'), 'starter_confidence': pl.get('starter_confidence'),
                                   'latest_source': {k: srcs[-1].get(k) for k in ('source', 'published_at', 'evidence')} if srcs else None})
            qbs[t] = {'operator_confirmed_starter': (operator.get('starters') or {}).get(t), 'operator_confirmed_at': operator.get('confirmed_at') if (operator.get('starters') or {}).get(t) else None,
                      'espn_qb_depth': (espn.get('teams', {}).get(t) or {}).get('qb_depth'), 'espn_qb_starter': (espn.get('teams', {}).get(t) or {}).get('qb_starter'),
                      'espn_qb_flag': (espn.get('teams', {}).get(t) or {}).get('qb_flag'), 'espn_qb_note': (espn.get('teams', {}).get(t) or {}).get('qb_note'), 'espn_fetched_at': espn.get('fetched_at'),
                      'resolved_starter': (operator.get('starters') or {}).get(t) or (espn.get('teams', {}).get(t) or {}).get('qb_starter'),
                      'resolved_from': 'operator' if (operator.get('starters') or {}).get(t) else ('ESPN depth chart + injury report' if (espn.get('teams', {}).get(t) or {}).get('qb_starter') else 'unresolved'),
                      'projected_starter_qb_rows': rows_q, 'note': 'Operator confirmation is stated, not verified; official inactives decide. Projected-starter rows can be weeks old: read their latest_source.'}
        warnings = []
        for t in (away, home):
            e = espn.get('teams', {}).get(t) or {}
            op = (operator.get('starters') or {}).get(t)
            if e.get('qb_flag') == 'AMBIGUOUS':
                warnings.append('QB %s: ESPN lists %s (Questionable/Doubtful); starter is ambiguous%s' % (t, e.get('qb_note'), ' -- operator says ' + op if op else ' -- no operator confirmation'))
            elif op and e.get('qb_starter') and op != e.get('qb_starter'):
                warnings.append('QB %s: operator says %s but ESPN depth/injury resolves %s' % (t, op, e.get('qb_starter')))
            elif not e:
                warnings.append('QB %s: no ESPN status file; starter unresolved' % t)
        for t in (away, home):
            e = espn.get('teams', {}).get(t) or {}
            nonact = e.get('injury_report_non_active') or []
            outs = ['%s %s' % (r['player'], r['pos']) for r in nonact if (r['status'] or '').lower() in ('out', 'suspended')]
            irs = ['%s %s' % (r['player'], r['pos']) for r in nonact if (r['status'] or '').lower() == 'injured reserve']
            qs = ['%s %s' % (r['player'], r['pos']) for r in nonact if (r['status'] or '').lower() in ('questionable', 'doubtful')]
            warnings.append('AVAILABILITY %s (ESPN %s): Out: %s | Questionable/Doubtful: %s | IR: %s' % (t, espn.get('fetched_at'), ', '.join(outs) or 'none', ', '.join(qs) or 'none', ', '.join(irs) or 'none'))
        if conflict:
            warnings.append('BOOK CONFLICT: ' + conflict)
        if wx_row_guard(weather, key):
            warnings.append('WEATHER: ' + wx_row_guard(weather, key))
        if scr_reversed(scr, away, home):
            warnings.append('SUPERCONTEST LABELS REVERSED for this game: use its favorite/spread fields, not its away/home labels')
        nm = sum(1 for e in ev if e['near_miss'])
        if nm:
            warnings.append('%d near-miss source row(s) (verbatim but not self-identifying): context only' % nm)
        if not market['BKR']['fresh_at_build']:
            warnings.append('BKR capture already stale at build')
        if not market['BEO']['fresh_at_build']:
            warnings.append('BEO capture already stale at build')
        packet = {
            'schema': 'w05_game_packet_v1', 'game': key, 'built_at': now.isoformat(), 'kickoff_utc': g['kickoff_utc'],
            'away': {'abbr': away, 'name': g['visitorName']}, 'home': {'abbr': home, 'name': g['homeName']},
            'line_convention': 'spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points',
            'teams': {away: team_block(away, rec, sched, kick), home: team_block(home, rec, sched, kick)},
            'standings': {'divisions': {d: division_table(d, rec) for d in sorted({TEAM_DIV[away], TEAM_DIV[home]})},
                          'conference_order_by_record_then_point_diff': {c: conference_order(c, rec) for c in sorted({TEAM_DIV[away][:3], TEAM_DIV[home][:3]})},
                          'note': 'Order is win% then point differential only; official NFL tiebreakers are not applied. Includes any Week 5 game ESPN lists as final at the ESPN fetch time (schedule.json status can lag; see espn-status-w05.json finals).'},
            'same_division_game': TEAM_DIV[away] == TEAM_DIV[home],
            'market': market, 'action_network_opener': op, 'action_network_splits': sp, 'action_network_splits_captured_at': splits.get('captured_at'), 'supercontest_row': scr,
            'quantitative_row': qg, 'simulator_edge_sweep': simrows, 'simulator_total_sweep': simtot, 'quarterbacks': qbs, 'injury_report_non_active': {t: (espn.get('teams', {}).get(t) or {}).get('injury_report_non_active') for t in (away, home)}, 'espn_status_fetched_at': espn.get('fetched_at'), 'game_warnings': warnings,
            'simulator_note': 'Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.',
            'digest_rows': drows, 'source_rows': {'counts': dict(counts), 'rows': ev},
            'weather_venue_row': wx, 'secondary_matchups': secm, 'power_ratings': pw, 'availability': av, 'ftn_team_level': ft,
            'files_to_read_directly': {
                'weather_detail': 'data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to %s)' % key,
                'prop_markets': 'BKR/BEO rows for event "%s @ %s" with market != game_lines' % (g['visitorName'], g['homeName']),
                'player_stats': 'data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for %s and %s' % (away, home),
                'projected_starters': 'data/projected-starters/2026/latest.json (teams.%s, teams.%s)' % (away, home)},
        }
        base = os.path.join(a.out, key.replace('@', '_at_'))
        packet['venue'] = venue_block(home, g)
        packet['power_label_check'] = {t: power_label_check(pw.get(t), packet['teams'][t]) for t in (away, home)}
        if packet['venue']['indoor_for_weather']:
            packet['game_warnings'].append('VENUE: %s is a fixed dome (static table); outdoor weather does not apply' % home)
        elif 'retractable' in packet['venue']['home_team_stadium_roof']:
            packet['game_warnings'].append('VENUE: %s has a retractable roof; check game-day roof status before using weather' % home)
        with open(base + '.json', 'w', encoding='utf-8') as f:
            json.dump(packet, f, indent=1)
        md = render_md(packet)
        with open(base + '.md', 'w', encoding='utf-8') as f:
            f.write(md)
        index['packets'].append({'game': key, 'kickoff_utc': g['kickoff_utc'], 'json': base + '.json', 'md': base + '.md',
                                 'sha256_json': sha(base + '.json'), 'bkr_fresh_at_build': market['BKR']['fresh_at_build'], 'beo_fresh_at_build': market['BEO']['fresh_at_build'],
                                 'book_conflict': conflict, 'source_rows': dict(counts)})
        print('wrote', base + '.json', os.path.getsize(base + '.json'), 'bytes; rows', dict(counts))

    # slate context: one standings table, shared
    L = ['# Week 5 slate context (shared, read once)', '', 'Built %s. Records include Week 5 games ESPN lists as final at fetch time. Order is win%% then point differential only.' % now.isoformat(), '']
    for d in DIV:
        L += ['## %s' % d, '', '| # | Team | Record | PF-PA | Div |', '|---:|---|---|---:|---|']
        for x in division_table(d, rec):
            r = rec[x['team']]
            L.append('| %d | %s | %s | %d-%d | %s |' % (x['rank'], x['team'], x['record'], r['pf'], r['pa'], x['div']))
        L.append('')
    with open(os.path.join(a.out, '_slate-context.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))
    with open(os.path.join(a.out, '_slate-index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=1)
    print('wrote index with', len(index['packets']), 'packets')


def table(rows, cols):
    out = ['| ' + ' | '.join(cols) + ' |', '|' + '|'.join('---' for _ in cols) + '|']
    for r in rows:
        out.append('| ' + ' | '.join(str(r.get(c, '')) for c in cols) + ' |')
    return out


def render_md(p):
    A, H = p['away']['abbr'], p['home']['abbr']
    L = ['# %s packet — %s @ %s' % (p['game'], p['away']['name'], p['home']['name']), '',
         'Kickoff %s UTC. Built %s. %s' % (p['kickoff_utc'], p['built_at'], p['line_convention']), '']
    if p['same_division_game']:
        L += ['**Division game** (%s).' % p['teams'][A]['division'], '']
    L += ['## Market', '']
    for b in ('BKR', 'BEO'):
        m = p['market'][b]
        L += ['**%s** captured %s; recommendation window ends %s; fresh at build: %s' % (b, m['captured_at'], m['expires_for_recommendation_at'], m['fresh_at_build'])]
        for k in ('spread', 'total', 'moneyline'):
            L.append('- %s: %s' % (k, '; '.join('%s %s %s' % (x['side'], x.get('line', ''), x['odds']) for x in m['lines'][k])))
        L.append('')
    if p['market'].get('book_conflict'):
        L += ['**BOOK CONFLICT:** ' + p['market']['book_conflict'], '']
    if p['market'].get('market_implied_score'):
        L += ['Market-implied score: ' + json.dumps(p['market']['market_implied_score']), '']
    if p['action_network_opener']:
        L += ['Action Network opener: ' + json.dumps(p['action_network_opener']), '']
    if p['action_network_splits']:
        L += ['Action Network splits (captured %s): ' % p.get('action_network_splits_captured_at') + json.dumps(p['action_network_splits']), '']
    if p['supercontest_row']:
        L += ['SuperContest row (contest line, not a book price; labels may be reversed): ' + json.dumps(p['supercontest_row']), '']
    if p.get('game_warnings'):
        L += ['## Warnings that touch this game', ''] + ['- ' + w for w in p['game_warnings']] + ['']
    L += ['## Quarterbacks', '']
    for t, q in p['quarterbacks'].items():
        L.append('- %s: RESOLVED STARTER %s (from %s). ESPN depth %s, flag %s %s [ESPN fetched %s]. Operator-confirmed: %s (at %s). Older projected-starter rows (may be weeks old, context only): %s' % (t, q['resolved_starter'], q['resolved_from'], q['espn_qb_depth'], q['espn_qb_flag'], q['espn_qb_note'], q['espn_fetched_at'], q['operator_confirmed_starter'], q['operator_confirmed_at'], json.dumps(q['projected_starter_qb_rows'])))
    L += ['', q['note'], '', '## ESPN injury report, non-Active entries (fetched %s)' % p.get('espn_status_fetched_at'), '']
    for t, rows_i in p['injury_report_non_active'].items():
        L.append('- %s: %s' % (t, '; '.join('%s %s %s (%s)' % (r['player'], r['pos'], r['status'], r['date']) for r in (rows_i or [])) or 'none listed'))
    L += ['', 'Players not on this list are not reported injured by ESPN. Only Questionable/Doubtful are genuinely ambiguous; official inactives decide.', '']
    L += ['## Team state: schedule, results and standings', '']
    for t in (A, H):
        b = p['teams'][t]
        L += ['### %s (%s) %s' % (t, b['division'], b['record']),
              '- PF %s / PA %s (diff %+d); PPG %s / PAPG %s; home %s, away %s, division %s' % (b['points_for'], b['points_against'], b['point_diff'], b['ppg'], b['papg'], b['home_record'], b['away_record'], b['division_record']),
              '- Opponents faced to date have a combined record of %s; rest before this game: %s days; byes used: %s; byes remaining: %s' % (b['opponents_record_to_date'], b['rest_days_before_this_game'], b['bye_weeks_already_used'] or 'none', b['bye_weeks_remaining'] or 'none'), '']
        L += table(b['results'], ['week', 'site', 'opp', 'opp_record', 'result', 'pf', 'pa'])
        L += ['', 'Next games: ' + '; '.join('wk%s %s %s' % (u['week'], u['site'], u['opp']) for u in b['upcoming_after_this_game']), '']
    L += ['## Standings context', '']
    for d, rows in p['standings']['divisions'].items():
        L += ['**%s**' % d] + table(rows, ['rank', 'team', 'record', 'point_diff', 'div']) + ['']
    for c, rows in p['standings']['conference_order_by_record_then_point_diff'].items():
        L += ['**%s order (top 8)**: ' % c + ', '.join('%d %s %s' % (x['order'], x['team'], x['record']) for x in rows[:8]), '']
    L += [p['standings']['note'], '']
    q = p['quantitative_row']
    if q:
        L += ['## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)', '',
              'Means: %s' % json.dumps(q['means']), 'Simulation: %s' % json.dumps(q['simulation']), 'Features: %s' % json.dumps(q['features']), '']
    L += ['## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)', ''] + table(p['simulator_edge_sweep'], ['home_margin_edge_pts', 'home_cover', 'away_cover', 'side_push', 'over', 'under', 'total_push']) + ['', p['simulator_note'], '', '**Total-edge sweep (margin edge 0):**', ''] + table(p['simulator_total_sweep'], ['total_edge_pts', 'over', 'under', 'total_push']) + ['']
    L += ['## Power ratings', '', json.dumps(p['power_ratings']), '', 'Label check (the attribution text says prior-season, but these rows are tested against the 2026 point differential): ' + json.dumps(p['power_label_check']) + ' -- if matches_2026 is true, the ratings are 2026 four-game values and the attribution wording is stale.', '', '## Weather / venue', '', json.dumps(p['weather_venue_row']), '', 'Venue (' + p['venue']['note'] + '): ' + json.dumps({k: v for k, v in p['venue'].items() if k != 'note'}), '']
    L += ['## Availability digest (top events per team)', '', json.dumps(p['availability']), '']
    L += ['## Secondary matchup context (manual; capped, never a dominant driver)', '']
    for m in p['secondary_matchups']:
        L.append('- ' + json.dumps({k: m.get(k) for k in ('offense_team', 'defense_team', 'vulnerability', 'severity_score', 'severity_tier', 'summary') if k in m}))
    L += ['', '## FTN team-level tables (names preserved)', '', json.dumps(p['ftn_team_level']), '']
    L += ['## Digest rows for this game (research digest; tier labels are strict)', ''] + ['    ' + x for x in p['digest_rows']] + ['']
    L += ['## Source rows (verified only): counts %s' % json.dumps(p['source_rows']['counts']), '',
          'Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.', '']
    L += table(p['source_rows']['rows'], ['row', 'kind', 'outlet', 'market', 'side', 'line', 'tier_eligible', 'near_miss'])
    for e in p['source_rows']['rows']:
        if e.get('quote'):
            L += ['', '- %s (%s) %s: "%s"' % (e['row'], e['outlet'], e.get('url'), e['quote'])]
    L += ['', '## Read directly if needed', ''] + ['- %s: %s' % (k, v) for k, v in p['files_to_read_directly'].items()]
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    main()
