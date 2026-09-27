"""Rebuild data/secondary-matchups/manual/{secondary,receiver}-roles-2026.json against the live ESPN
rosters + depth charts (the July seeds were written from an old depth chart: 69 wrong-team rows found
2026-09-27). Rules, per team:
  * keep an existing seed row only if ESPN has that player on that team (any roster group except
    practice squad) - its hand-set tier/tags are kept;
  * add every current depth-chart starter (DB: LCB/RCB/NB/FS/SS; pass catchers: WR1-3, TE1) that has
    no row yet. A starter who has a row on ANOTHER team (traded) takes that row's tier/tags over
    ("moved" note); a new starter gets a neutral default (impact 'starter' / target tier 'medium'
    ['high' for WR1]) and a "default - verify" note;
  * drop everything else (players not on the team, practice squad, not on any roster).
Writes both files in place (old versions are in git) and prints a change log.
Usage: python3 scripts/nfl-rosters/fetch_espn_rosters.py && python3 scripts/nfl-rosters/rebuild_matchup_seeds.py
"""
import json, re, urllib.request, pathlib, datetime, collections
ROOT = pathlib.Path(__file__).resolve().parents[2]
MAN = ROOT / 'data/secondary-matchups/manual'
FIX = {'WAS': 'WSH'}
fx = lambda t: FIX.get(t, t)
def norm(n):
    n = re.sub(r"[.'’]", '', (n or '').lower()); n = re.sub(r'\b(jr|sr|ii|iii|iv|v)\b', '', n)
    return re.sub(r'\s+', ' ', n).strip()
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as r: return json.load(r)
E = json.load(open(ROOT / 'data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))
by_id, on_team = {}, collections.defaultdict(dict)   # espn_id -> (name, team); team -> norm -> rec
for n, recs in E['players'].items():
    for r in recs:
        by_id[str(r['espn_id'])] = (n, r['team'])
        on_team[r['team']][norm(n)] = dict(r, name=n)
TODAY = datetime.date.today().isoformat()
SRC = 'https://www.espn.com/nfl/team/depth/'
teams = get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams')['sports'][0]['leagues'][0]['teams']
depth = {}
for t in teams:
    ab = fx(t['team']['abbreviation']); tid = t['team']['id']
    d = get(f'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/teams/{tid}/depthcharts')
    pos = {}
    for it in d.get('items', []):
        for k, p in it['positions'].items():
            ids = [a['athlete']['$ref'].split('/')[-1].split('?')[0] for a in sorted(p['athletes'], key=lambda a: a.get('rank', 99))]
            pos.setdefault(k, [by_id[i][0] for i in ids if i in by_id and by_id[i][1] == ab])
    depth[ab] = pos
log = collections.defaultdict(list)
def rebuild(fname, key_slots, make_default):
    old = json.load(open(MAN / fname, encoding='utf-8'))
    old_by_name = {norm(r['player_name']): r for r in old}
    out, have = [], set()
    for r in old:
        t = fx(r['team']); rec = on_team[t].get(norm(r['player_name']))
        if rec and rec['group'] != 'practiceSquad':
            out.append(dict(r, team=r['team'])); have.add((t, norm(r['player_name'])))
        else:
            where = [x['team'] + '/' + x['group'] for x in E['players'].get(r['player_name'], [])] or ['no roster']
            log[fname].append(f"DROP  {t:3s} {r['player_name']} ({', '.join(where)})")
    for t, pos in sorted(depth.items()):
        for slot, idx, role in key_slots:
            names = pos.get(slot) or []
            if len(names) <= idx: continue
            n = names[idx]
            if (t, norm(n)) in have: continue
            prev = old_by_name.get(norm(n))
            if prev:
                row = dict(prev, team=('WAS' if t == 'WSH' else t), notes=f"{prev.get('notes','')} [moved from {prev['team']} per ESPN roster {TODAY}]".strip())
                log[fname].append(f"MOVE  {t:3s} {n} (was {prev['team']})")
            else:
                row = make_default(t, n, role, on_team[t][norm(n)]['position'])
                log[fname].append(f"ADD   {t:3s} {n} ({role}, default)")
            out.append(row); have.add((t, norm(n)))
    out.sort(key=lambda r: (fx(r['team']), r['player_name']))
    json.dump(out, open(MAN / fname, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    return len(old), len(out)
CB = {'outside_cb1': (['alpha_x'], ['outside_wr_boost', 'boundary_wr_boost'], 'boundary'),
      'outside_cb2': (['z_receiver'], ['outside_wr_boost'], 'field'),
      'slot_cb': (['slot'], ['slot_wr_boost', 'inside_seam_boost'], 'slot'),
      'free_safety': (['field_stretcher'], ['deep_pass_boost'], 'middle'),
      'strong_safety': (['te_middle'], ['te_middle_boost'], 'middle')}
def db_default(t, n, role, position):
    a, w, side = CB[role]
    return {'team': 'WAS' if t == 'WSH' else t, 'player_name': n, 'position': position, 'role': role, 'side': side, 'impact_tier': 'starter',
            'receiver_archetypes_impacted': a, 'weakness_tags': w, 'source': 'espn_depth_chart_2026', 'source_url': SRC,
            'notes': f'{t} depth-chart starter per ESPN {TODAY}; default tier - verify.'}
RR = {'WR1': (['alpha_x'], 'high', ['boundary', 'intermediate']), 'WR2': (['z_receiver'], 'medium', ['boundary']),
      'WR3': (['slot'], 'medium', ['middle', 'short']), 'TE1': (['te_middle'], 'medium', ['middle'])}
def rec_default(t, n, role, position):
    roles, tier, tags = RR[role]
    return {'team': 'WAS' if t == 'WSH' else t, 'player_name': n, 'position': position, 'roles': roles, 'target_share_tier': tier,
            'route_area_tags': tags, 'source': 'espn_depth_chart_2026', 'source_url': SRC,
            'notes': f'{t} {role} per ESPN depth chart {TODAY}; default role - verify.'}
a = rebuild('secondary-roles-2026.json', [('lcb', 0, 'outside_cb1'), ('rcb', 0, 'outside_cb2'), ('nb', 0, 'slot_cb'), ('fs', 0, 'free_safety'), ('ss', 0, 'strong_safety')], db_default)
b = rebuild('receiver-roles-2026.json', [('wr', 0, 'WR1'), ('wr', 1, 'WR2'), ('wr', 2, 'WR3'), ('te', 0, 'TE1')], rec_default)
for f, lines in log.items():
    c = collections.Counter(l.split()[0] for l in lines)
    print(f'\n== {f}: {dict(c)}'); print('\n'.join(lines))
print(f'\nsecondary rows {a[0]} -> {a[1]}; receiver rows {b[0]} -> {b[1]}')
