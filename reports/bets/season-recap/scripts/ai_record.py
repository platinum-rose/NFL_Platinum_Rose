#!/usr/bin/env python3
"""Machine-readable AI record: every card, ladder and proposal writes its legs here at proposal time.

File per week: data/official-picks/ai-proposals/2026-wNN.json  (tracked; proposals only, never wagers or cash).
Replaces the hand-built reports/bets/season-recap/ai_recs_wN.py from Week 9 on (load_ai() falls back to ai_recs_wN.py
for older weeks that have no JSON record).

Proposal: {"id": "w09-tnf-c1", "title": "...", "family": "island_ladder|card_template|game_line_parlay|prop_parlay|single|round_robin|straight|candidates|other",
           "funding": "cash|promo", "source_doc": "reports/bets/2026-w09-card.md", "book": "BKR", "price": "+450", "stake": 10,
           "status": "proposed|superseded|withdrawn", "created_at": ISO (stamped if missing), "note": "...", "legs": [leg, ...]}
Leg (prop): {"game": "JAX @ BAL", "kind": "prop", "player": "Roquan Smith", "key": "tackles", "line": 8, "dir": "over", "price": "-140"}
   over = actual >= line (write 8 or 7.5 for "8+"); under = actual < line.  key: rush_yds rec rec_yds rush_rec_yds pass_yds pass_td
   completions pass_att carries int_thrown sacks tackles def_int atd tds first_td fgm kicking_points
Leg (side): {"game": "JAX @ BAL", "kind": "ml|spread|total|team_total", "team": "JAX", "line": -3.5, "dir": "under"}
Week-level optional key "projections": {"AWAY@HOME": [away_pts, home_pts]} (Master Intel fair lines, for projection error).

CLI
  python3 scripts/ai_record.py add --week 9 --file proposal.json      # one proposal or a list; upsert by id; validates every leg
  python3 scripts/ai_record.py show --week 9 [--id w09-tnf-c1]
  python3 scripts/ai_record.py status --week 9 --id w09-tnf-c1 --set superseded
  python3 scripts/ai_record.py import-py --week 8                      # convert a legacy ai_recs_w8.py (one proposal per source tag)
"""
import argparse, datetime, importlib, json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
DIR = os.path.join(ROOT, 'data', 'official-picks', 'ai-proposals')
PROP_KEYS = {'rush_yds', 'rec', 'rec_yds', 'rush_rec_yds', 'pass_yds', 'pass_td', 'completions', 'pass_att', 'carries', 'int_thrown',
             'sacks', 'tackles', 'def_int', 'atd', 'tds', 'first_td', 'fgm', 'kicking_points'}
SIDE_KINDS = {'ml', 'spread', 'total', 'team_total'}
FAMILIES = {'island_ladder', 'card_template', 'game_line_parlay', 'prop_parlay', 'single', 'round_robin', 'straight', 'candidates', 'other'}  # candidates = a list of reads, not a ticket
LEDGER_MARKET = {'rush_yds': 'rushing_yards', 'rec': 'receptions', 'rec_yds': 'receiving_yards', 'rush_rec_yds': 'rushing_receiving_yards',
                 'pass_yds': 'passing_yards', 'pass_td': 'passing_touchdowns', 'completions': 'pass_completions', 'pass_att': 'pass_attempts',
                 'carries': 'rush_attempts', 'int_thrown': 'interceptions_thrown', 'sacks': 'sacks', 'tackles': 'tackles_assists',
                 'def_int': 'def_interceptions', 'atd': 'anytime_touchdown', 'tds': 'two_plus_touchdowns', 'first_td': 'first_touchdown',
                 'fgm': 'field_goals_made', 'kicking_points': 'kicking_points'}


def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')


def path(week, season=2026): return os.path.join(DIR, f'{season}-w{int(week):02d}.json')


def load(week):
    p = path(week)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else dict(season=2026, week=int(week), proposals=[])


def load_proposals(week): return load(week)['proposals']


def save(doc):
    os.makedirs(DIR, exist_ok=True)
    doc['proposals'].sort(key=lambda p: (p.get('created_at') or '', p['id']))
    tmp = path(doc['week']) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(doc, f, indent=1, ensure_ascii=False)
    os.replace(tmp, path(doc['week']))


def validate_leg(l):
    errs = []
    g = l.get('game') or ''
    if not re.match(r'^[A-Z]{2,3} @ [A-Z]{2,3}$', g): errs.append(f"game must look like 'JAX @ BAL' (got {g!r})")
    k = l.get('kind')
    if k == 'prop':
        if l.get('key') not in PROP_KEYS: errs.append(f"unknown prop key {l.get('key')!r}")
        if not l.get('player'): errs.append('prop leg without player')
        if l.get('key') != 'first_td' and l.get('line') is None: errs.append('prop leg without line')
        if l.get('dir') not in ('over', 'under'): errs.append("dir must be 'over' or 'under'")
    elif k in SIDE_KINDS:
        if k in ('ml', 'spread', 'team_total') and not re.match(r'^[A-Z]{2,3}$', l.get('team') or ''): errs.append(f'{k} leg needs a team abbreviation')
        if k != 'ml' and l.get('line') is None: errs.append(f'{k} leg without line')
        if k in ('total', 'team_total') and l.get('dir') not in ('over', 'under'): errs.append(f'{k} leg needs dir')
    else:
        errs.append(f'unknown kind {k!r}')
    return errs


def label(l):
    if l['kind'] == 'prop':
        t = l.get('line'); u = l['dir'] == 'under'
        return f"{l['player']} {'U' if u else ''}{'' if t is None else format(t, 'g')}{'+' if not u and t is not None else ''} {l['key']}"
    if l['kind'] == 'ml': return f"{l['team']} ML"
    if l['kind'] == 'spread': return f"{l['team']} {l['line']:+g}"
    if l['kind'] == 'team_total': return f"{l['team']} TT {l['dir'].title()} {l['line']:g}"
    return f"{l['game']} {l['dir'].title()} {l['line']:g}"


def to_spec(l, src):
    """-> the dict shape build.py / grade_spec use (same as ai_recs.P / ai_recs.S)."""
    if l['kind'] == 'prop':
        return dict(kind='prop', player=l['player'], key=l['key'], thr=l.get('line'), dir=l['dir'], game=l['game'], src=src, label=label(l))
    return dict(kind=l['kind'], team=l.get('team'), line=l.get('line'), game=l['game'], dir=l.get('dir'), src=src, label=label(l))


def to_ledger_leg(l):
    """-> a wagers-file-shaped leg so both graders (grade.py, lib.py) grade it independently."""
    if l['kind'] == 'prop':
        t = l.get('line'); u = l['dir'] == 'under'
        if l['key'] == 'atd' and not u: sel = f"{l['player']} Anytime TD"
        elif l['key'] == 'tds' and not u: sel = f"{l['player']} {int(t or 2)}+ Touchdowns"
        elif l['key'] == 'first_td': sel = f"{l['player']} First TD"
        elif not u and t is not None and float(t) == int(t): sel = f"{l['player']} {int(t)}+ {l['key']}"
        else: sel = f"{l['player']} {'Under' if u else 'Over'} {t:g} {l['key']}"
        return dict(game=l['game'], player=l['player'], market=LEDGER_MARKET[l['key']], selection=sel, line=t, direction=l['dir'], price=l.get('price'))
    if l['kind'] == 'ml': return dict(game=l['game'], team=l['team'], market='moneyline', selection=f"{l['team']} ML", price=l.get('price'))
    if l['kind'] == 'spread': return dict(game=l['game'], team=l['team'], market='spread', selection=f"{l['team']} {l['line']:+g}", line=l['line'], price=l.get('price'))
    if l['kind'] == 'team_total':
        return dict(game=l['game'], team=l['team'], market='team_total', selection=f"{l['team']} {l['dir'].title()} {l['line']:g}",
                    line=l['line'], direction=l['dir'], price=l.get('price'))
    return dict(game=l['game'], market='total', selection=f"{l['dir'].title()} {l['line']:g}", line=l['line'], direction=l['dir'], price=l.get('price'))


def legacy_module(week):
    for p in (D, RECAP):
        if p not in sys.path: sys.path.insert(0, p)
    try: return importlib.import_module('ai_recs' if str(week) == '3' else f'ai_recs_w{week}')
    except ModuleNotFoundError: return None


def load_ai(week, include_withdrawn=False):
    """Flattened AI legs for build.py: one spec per distinct leg, src = every proposal tag that carried it.
    Falls back to the legacy ai_recs_wN.py (ai_recs.py for Week 3) when no JSON record exists for the week."""
    props = [p for p in load_proposals(week) if include_withdrawn or p.get('status') != 'withdrawn']
    if not props:
        m = legacy_module(week)
        return list(m.AI) if m else []
    out = {}
    for p in props:
        tag = p.get('tag') or p['id']
        for l in p['legs']:
            k = json.dumps({x: l.get(x) for x in ('game', 'kind', 'player', 'key', 'team', 'line', 'dir')}, sort_keys=True)
            if k in out:
                if tag not in out[k]['src'].split(' / '): out[k]['src'] += ' / ' + tag
            else:
                out[k] = to_spec(l, tag)
    return list(out.values())


def projections(week):
    """Fair-line projections {AWAY@HOME: (away_pts, home_pts)}: the JSON record's 'projections', else the legacy PROJ."""
    pj = load(week).get('projections')
    if pj: return {k: tuple(v) for k, v in pj.items()}
    m = legacy_module(week)
    return dict(getattr(m, 'PROJ', {}) or {}) if m else {}


# ------------------------------------------------------------------ CLI
def cmd_add(a):
    doc = load(a.week)
    data = json.load(open(a.file, encoding='utf-8')) if a.file else json.loads(a.json)
    items = data if isinstance(data, list) else [data]; bad = 0
    for p in items:
        errs = [f"proposal {p.get('id')!r}: missing {k}" for k in ('id', 'title', 'legs') if not p.get(k)]
        if p.get('family') and p['family'] not in FAMILIES: errs.append(f"proposal {p.get('id')}: family {p['family']!r} not in {sorted(FAMILIES)}")
        if p.get('funding', 'cash') not in ('cash', 'promo'): errs.append(f"proposal {p.get('id')}: funding must be cash or promo")
        for i, l in enumerate(p.get('legs') or []):
            errs += [f"proposal {p.get('id')} leg {i + 1}: {e}" for e in validate_leg(l)]
        if errs:
            bad += 1; print('\n'.join('  ERROR ' + e for e in errs)); continue
        p.setdefault('created_at', now()); p.setdefault('status', 'proposed'); p.setdefault('funding', 'cash')
        old = next((x for x in doc['proposals'] if x['id'] == p['id']), None)
        if old:
            p['created_at'] = old['created_at']; p['updated_at'] = now(); doc['proposals'].remove(old)
        doc['proposals'].append(p)
        print(f"  {'updated' if old else 'added'} {p['id']} ({p['funding']}, {len(p['legs'])} legs): " + ' / '.join(label(l) for l in p['legs']))
    if bad and not a.partial:
        print(f'{bad} proposal(s) invalid; nothing written (use --partial to write the valid ones)'); sys.exit(1)
    save(doc); print(f'-> {os.path.relpath(path(a.week), ROOT)} ({len(doc["proposals"])} proposals)')


def cmd_show(a):
    for p in load_proposals(a.week):
        if a.id and p['id'] != a.id: continue
        print(f"{p['id']} [{p.get('status')}, {p.get('funding')}, {p.get('family')}] {p['title']} {p.get('price') or ''} ({p.get('source_doc') or ''})")
        for l in p['legs']: print(f"    {l['game']:10} {label(l)}{('  ' + str(l['price'])) if l.get('price') else ''}")


def cmd_status(a):
    doc = load(a.week); p = next((x for x in doc['proposals'] if x['id'] == a.id), None)
    if not p: sys.exit(f'no proposal {a.id}')
    p['status'] = a.set; p['updated_at'] = now(); save(doc); print(f'{a.id} -> {a.set}')


def cmd_import_py(a):
    m = legacy_module(a.week)
    if not m: sys.exit(f'no ai_recs module for week {a.week}')
    groups = {}
    for s in m.AI:
        g = re.sub(r'\s*@\s*', ' @ ', s['game']).strip()
        l = dict(game=g, kind=s['kind'])
        if s['kind'] == 'prop': l.update(player=s['player'], key=s['key'], line=s['thr'], dir=s['dir'])
        else: l.update(team=s.get('team'), line=s.get('line'), dir=s.get('dir'))
        l = {k: v for k, v in l.items() if v is not None}
        for tag in [t.strip() for t in s['src'].split(' / ')]:
            groups.setdefault(tag, []).append(l)
    doc = load(a.week)
    if doc['proposals'] and not a.force: sys.exit(f'{path(a.week)} already has proposals (use --force to replace)')
    doc['proposals'] = [dict(id=f"w{a.week:02d}-legacy-{re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')}", tag=t, title=t, family='other',
                             funding='cash', status='proposed', source_doc=f'reports/bets/season-recap/ai_recs_w{a.week}.py (imported)',
                             created_at='legacy', legs=ls) for t, ls in groups.items()]
    if getattr(m, 'PROJ', None): doc['projections'] = {k: list(v) for k, v in m.PROJ.items()}
    save(doc); print(f'imported {sum(len(v) for v in groups.values())} leg entries in {len(groups)} proposals -> {os.path.relpath(path(a.week), ROOT)}')


def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    x = sp.add_parser('add'); x.add_argument('--week', type=int, required=True); x.add_argument('--file'); x.add_argument('--json')
    x.add_argument('--partial', action='store_true'); x.set_defaults(f=cmd_add)
    x = sp.add_parser('show'); x.add_argument('--week', type=int, required=True); x.add_argument('--id'); x.set_defaults(f=cmd_show)
    x = sp.add_parser('status'); x.add_argument('--week', type=int, required=True); x.add_argument('--id', required=True)
    x.add_argument('--set', required=True, choices=['proposed', 'superseded', 'withdrawn']); x.set_defaults(f=cmd_status)
    x = sp.add_parser('import-py'); x.add_argument('--week', type=int, required=True); x.add_argument('--force', action='store_true'); x.set_defaults(f=cmd_import_py)
    a = ap.parse_args(); a.f(a)


if __name__ == '__main__':
    main()
