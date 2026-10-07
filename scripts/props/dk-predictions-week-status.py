#!/usr/bin/env python3
"""Week checklist for DraftKings Predictions page saves: parse every saved .mhtml, merge the
saves for each game into one JSON, and show which games / sections are still missing.

Saves go in docs/Player_Prop_Odds_Weekly/Week<N>/DK/ (Ctrl+S on the main event page, then the
Passing tab). The game list comes from data/supercontest/week-<NN>-lines.json.

usage: python3 scripts/props/dk-predictions-week-status.py --week 3 [--played GB,ATL] [--no-write]

Read-only against DraftKings: this only reads files already saved on disk. DK prices are contract
percentages, not sportsbook odds; never compare them to BKR/BEO without the fee/spread check.
"""
import argparse, datetime, glob, importlib.util, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('dkp', os.path.join(ROOT, 'scripts/props/dk-predictions-mhtml-parse.py'))
dkp = importlib.util.module_from_spec(spec); spec.loader.exec_module(dkp)

# section -> markets that prove it was captured
SECTIONS = {'game lines': ['game_spread', 'game_total', 'game_moneyline'],
            'TD scorers': ['atd_1_plus'],
            'passing': ['pass_yds', 'pass_td'],
            'rushing': ['rush_yds'],
            'receiving': ['rec_yds', 'rec']}


def mascot(s):
    return s.split()[-1].lower()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--week', type=int, required=True)
    ap.add_argument('--played', default='', help='comma list of team abbrs whose games are already over')
    ap.add_argument('--no-write', action='store_true', help='report only; do not write merged JSON')
    a = ap.parse_args()
    os.chdir(ROOT)
    lines = json.load(open(f'data/supercontest/week-{a.week:02d}-lines.json'))
    played = {x.strip().upper() for x in a.played.split(',') if x.strip()}
    files = sorted(glob.glob(f'docs/Player_Prop_Odds_Weekly/Week{a.week}/DK/*.mhtml'))

    by_game, bad = {}, []
    for f in files:
        try:
            d = dkp.parse(f)
        except Exception as e:
            bad.append((os.path.basename(f), f'{type(e).__name__}: {e}')); continue
        key = frozenset((mascot(d['away']), mascot(d['home'])))
        g = by_game.setdefault(key, {'d': d, 'files': [], 'rows': [], 'seen': set(), 'mtime': 0})
        g['files'].append(os.path.basename(f)); g['mtime'] = max(g['mtime'], os.path.getmtime(f))
        for r in d['rows']:
            k = (r.get('market'), r.get('player'), r.get('team'), r.get('side'), r.get('line'), r.get('kind'))
            if k not in g['seen']:
                g['seen'].add(k); g['rows'].append(r)

    print(f"DraftKings Predictions saves — Week {a.week}  ({len(files)} files in docs/Player_Prop_Odds_Weekly/Week{a.week}/DK/)\n")
    done = todo = 0
    matched = set()
    for x in lines['games']:
        away, home = x['away_team'], x['home_team']
        abbrs = {x['favorite_abbr'], x['underdog_abbr']}
        home_abbr = x['favorite_abbr'] if x['favorite_team'] == home else x['underdog_abbr']
        away_abbr = (abbrs - {home_abbr}).pop()
        label = f"{away_abbr} @ {home_abbr} ({x['kickoff_day']} {x['kickoff_time_et']} ET)"
        key = frozenset((mascot(away), mascot(home)))
        g = by_game.get(key)
        if g is None:
            if abbrs & played:
                print(f"  --   {label}: already played, skipped"); continue
            todo += 1; print(f"  [ ]  {label}: NOT SAVED"); continue
        matched.add(key)
        mk = {r['market'] for r in g['rows']}
        missing = [s for s, need in SECTIONS.items() if not any(m in mk for m in need)]
        out = None
        if not a.no_write:
            d = dict(g['d']); d['source_file'] = g['files']; d['rows'] = g['rows']
            d['summary'] = {k: sum(1 for r in g['rows'] if r['market'] == k) for k in sorted(mk)}
            slug = re.sub(r'[^a-z0-9]+', '-', f"{mascot(d['away'])}-at-{mascot(d['home'])}")
            day = datetime.datetime.fromtimestamp(g['mtime']).strftime('%Y-%m-%d')
            out = f'data/generated/props/dk-predictions-{day}-{slug}.json'
            json.dump(d, open(out, 'w'), indent=1)
        mark = '[x]' if not missing else '[~]'
        done += not missing; todo += bool(missing)
        print(f"  {mark}  {label}: {len(g['rows'])} rows from {len(g['files'])} file(s)"
              + (f" — MISSING {', '.join(missing)}" if missing else '') + (f"  -> {out}" if out else ''))
    for key, g in by_game.items():
        if key not in matched:
            print(f"  ??   {g['d']['event']}: saved but not on the Week {a.week} slate ({', '.join(g['files'])})")
    for n, e in bad:
        print(f"  !!   {n}: could not parse ({e}) — re-save the page with the sections expanded")
    print(f"\n{done} complete, {todo} still to save or fix.")
    print('Reminder: DK % are contract prices before fees, not sportsbook odds.')


if __name__ == '__main__':
    sys.exit(main())
