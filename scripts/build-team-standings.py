#!/usr/bin/env python3
"""Offline team standings from cached ESPN summaries -> data/generated/team-profiles/team-standings-<season>-w<NN>.json

usage: python3 scripts/build-team-standings.py --week 5 [--season 2026]

Inputs (read-only, no network): reports/analysis/season/claude/out/week-NN-teams.json (one row per team-game, built by
team_postmortem.py from data/fantasy/boxscores/espn-*.json) and the same box scores for conference/division membership.
Order inside a division/conference is win% then point differential. It is NOT the NFL tiebreaker procedure; treat ties as unresolved.
Cross-check: records are compared with ESPN's own division tables from the newest box score that lists each team.
"""
import argparse, glob, json, os, re, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--season', type=int, default=2026); a = ap.parse_args()
OUT = os.path.join(ROOT, 'reports/analysis/season/claude/out')
games = []
for w in range(1, a.week + 1):
    games += json.load(open(os.path.join(OUT, f'week-{w:02d}-teams.json'), encoding='utf-8'))['rows']
# membership + ESPN reference (newest file wins per team)
files = []
for f in glob.glob(os.path.join(ROOT, 'data/fantasy/boxscores/espn-*.json')):
    d = json.load(open(f, encoding='utf-8')); files.append((d['header']['competitions'][0]['date'], d))
files.sort(key=lambda t: t[0])
div, espn = {}, {}
for dt, d in files:
    for g in d['standings']['groups']:
        for e in g['standings']['entries']:
            t = re.search(r'/name/([a-z]+)/', e['link']).group(1).upper()
            st = {s['name']: s['displayValue'] for s in e['stats']}
            conf = g['conferenceHeader'].replace('American Football Conference', 'AFC').replace('National Football Conference', 'NFC')
            div[t] = (conf, g['divisionHeader'].split(' ', 1)[1] if ' ' in g['divisionHeader'] else g['divisionHeader'])
            espn[t] = {'as_of': dt, 'record': f"{st['wins']}-{st['losses']}-{st['ties']}", 'pf': int(st['pointsFor']), 'pa': int(st['pointsAgainst'])}
assert len(div) == 32, f'division map has {len(div)} teams'
by = collections.defaultdict(list)
for g in sorted(games, key=lambda r: (r['week'], r['date_utc'] or '')): by[g['team']].append(g)
def rec(gs):
    c = collections.Counter(g['su'] for g in gs); return f"{c['W']}-{c['L']}-{c['T']}"
teams = {}
for t, gs in by.items():
    c = collections.Counter(g['su'] for g in gs); n = len(gs)
    ats = collections.Counter(g['ats'] for g in gs); ou = collections.Counter(g['ou'] for g in gs)
    sameconf = [g for g in gs if div[g['opp']][0] == div[t][0]]; samediv = [g for g in gs if div[g['opp']] == div[t]]
    streak = 1; last = gs[-1]['su']
    for g in reversed(gs[:-1]):
        if g['su'] == last: streak += 1
        else: break
    pf = sum(int(g['pts']) for g in gs); pa = sum(int(g['opp_pts']) for g in gs)
    teams[t] = {'team': t, 'conference': div[t][0], 'division': div[t][1], 'games': n, 'record': f"{c['W']}-{c['L']}-{c['T']}",
        'win_pct': round((c['W'] + 0.5 * c['T']) / n, 3), 'pf': pf, 'pa': pa, 'diff': pf - pa,
        'home': rec([g for g in gs if g['home_away'] == 'home']), 'away': rec([g for g in gs if g['home_away'] == 'away']),
        'division_record': rec(samediv), 'conference_record': rec(sameconf),
        'ats': f"{ats['W']}-{ats['L']}-{ats['P']}", 'ou': f"{ou['O']}-{ou['U']}-{ou['P']}",
        'streak': f"{last}{streak}", 'last5': [f"W{g['week']} {g['su']} {g['pts']}-{g['opp_pts']} {'@' if g['home_away']=='away' else 'vs'} {g['opp']}" for g in gs[-5:]],
        'weeks_played': [g['week'] for g in gs], 'byes': [w for w in range(1, a.week + 1) if w not in [g['week'] for g in gs]]}
    e = espn.get(t)
    teams[t]['espn_check'] = {'record': e['record'], 'pf': e['pf'], 'pa': e['pa'], 'as_of': e['as_of'], 'match': e['record'] == teams[t]['record'] and e['pf'] == pf and e['pa'] == pa} if e else None
key = lambda x: (-x['win_pct'], -x['diff'])
for scope, sel in (('division_rank', lambda x: (x['conference'], x['division'])), ('conference_rank', lambda x: x['conference'])):
    grp = collections.defaultdict(list)
    for x in teams.values(): grp[sel(x)].append(x)
    for g in grp.values():
        for i, x in enumerate(sorted(g, key=key), 1): x[scope] = i
tie_note = [t for t, x in teams.items() if any(y is not x and y['division'] == x['division'] and y['conference'] == x['conference'] and y['win_pct'] == x['win_pct'] and y['diff'] == x['diff'] for y in teams.values())]
import datetime
payload = {'meta': {'season': a.season, 'through_week': a.week, 'generated_at': datetime.datetime.utcnow().isoformat() + 'Z', 'source': 'ESPN summary cache via reports/analysis/season/claude/out/week-NN-teams.json',
    'ordering': 'win pct then point differential; NOT official NFL tiebreakers', 'unresolved_exact_ties': tie_note, 'write_mode': 'local_json_only',
    'espn_check_mismatches': [t for t, x in teams.items() if x['espn_check'] and not x['espn_check']['match']]}, 'rows': sorted(teams.values(), key=lambda x: (x['conference'], x['division'], x['division_rank']))}
os.makedirs(os.path.join(ROOT, 'data/generated/team-profiles'), exist_ok=True)
p = os.path.join(ROOT, f'data/generated/team-profiles/team-standings-{a.season}-w{a.week:02d}.json'); json.dump(payload, open(p, 'w', encoding='utf-8'), indent=1)
print('wrote', os.path.relpath(p, ROOT), len(teams), 'teams; ESPN mismatches:', payload['meta']['espn_check_mismatches'])
for x in payload['rows']: print(f"{x['conference']} {x['division']:<6} {x['division_rank']} {x['team']:<3} {x['record']:<6} {x['pf']:>3}-{x['pa']:<3} {x['streak']} div {x['division_record']} byes {x['byes']}")
