#!/usr/bin/env python3
"""Weekly team-input refresh + team dossiers (gate A2). Runs in the Tuesday cadence after the post-mortem
(which caches ESPN box scores). Generalizes the one-off week8/week9 profile refreshes (2026-11-13, Andy: "we NEED this every week").

  python scripts/intel/weekly_team_refresh.py                 # finished week = current NFL week - 1 (Tuesday)
  python scripts/intel/weekly_team_refresh.py --week 9        # inputs through W9, dossiers for W10

Steps (each logged; a later step runs only if the earlier ones left usable inputs):
 1. Best-effort nflverse fetch of games + team_stats into reports/engineering/weekly-team-refresh/wNN/nflverse/ (never in place).
 2. games.csv: append missing completed 2026 REG games (weeks <= N) from that fetch, else from cached ESPN finals
    (data/fantasy/boxscores/espn-*.json). Never edits existing rows. Backup first.
 3. team_stats.csv: append missing 2026 team-week rows (weeks <= N) from the fetch. Backup first. Warn if week N is still missing.
 4. Builders: power ratings, analytics / coaching / regression snapshots (--week N), standings (--week N).
 5. Team dossiers for week N+1 (scripts/build-team-dossiers.mjs) + validation. Exit 1 if fewer than 2 files per team."""
import argparse, csv, datetime, glob, json, os, shutil, subprocess, sys, zoneinfo
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)
GAMES, TEAM = 'data/vault-seed/nflverse/games.csv', 'data/vault-seed/nflverse/team_stats.csv'
FIX = {'WSH': 'WAS', 'LAR': 'LA'}
PY = sys.executable

def current_week():
    w1 = datetime.datetime(2026, 9, 8, tzinfo=datetime.timezone.utc)
    return max(1, min(18, 1 + (datetime.datetime.now(datetime.timezone.utc) - w1).days // 7))

def run(cmd):
    print('  $', ' '.join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=600)
    tail = (r.stdout or '').strip().splitlines()[-2:] + (r.stderr or '').strip().splitlines()[-2:]
    for t in tail:
        if 'UNDICI' not in t and 'trace-warnings' not in t: print('    ' + t)
    return r.returncode == 0

def read(p):
    with open(p, newline='', encoding='utf-8') as f:
        rd = csv.DictReader(f); return list(rd), list(rd.fieldnames)

def write(p, rows, fields):
    with open(p, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator='\n'); w.writeheader(); w.writerows(rows)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int); ap.add_argument('--no-fetch', action='store_true')
    a = ap.parse_args(); N = a.week or current_week() - 1; WW = f'{N:02d}'
    work = f'reports/engineering/weekly-team-refresh/w{WW}'; os.makedirs(f'{work}/backups', exist_ok=True)
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    print(f'== Weekly team refresh: inputs through Week {N}, dossiers for Week {N + 1}')
    # 1. fetch
    fetched = False
    if not a.no_fetch:
        fetched = run([PY, 'scripts/fetch_nflverse_data.py', '--years', '2026', '--datasets', 'games', 'team_stats', '--force', '--out-dir', f'{work}/nflverse'])
    # 2. games
    rows, fields = read(GAMES); have = {r['game_id'] for r in rows}
    shutil.copy2(GAMES, f'{work}/backups/games.csv.{stamp}')
    add = []
    nv = f'{work}/nflverse/games.csv'
    if os.path.exists(nv):
        for r in read(nv)[0]:
            if r.get('season') == '2026' and r.get('game_type') == 'REG' and r.get('week', '').isdigit() and int(r['week']) <= N \
               and r.get('home_score') not in (None, '') and r['game_id'] not in have:
                x = {f: r.get(f, '') for f in fields}
                if 'source_provider' in fields: x.update(source_provider='nflverse games', source_artifact=nv, source_updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
                add.append(x); have.add(r['game_id'])
    ET = zoneinfo.ZoneInfo('America/New_York')
    for f in sorted(glob.glob('data/fantasy/boxscores/espn-*.json')):
        if '.truncated' in f: continue
        try: d = json.load(open(f, encoding='utf-8'))
        except (OSError, ValueError): continue
        h = d.get('header', {}); c = (h.get('competitions') or [{}])[0]
        if h.get('season', {}).get('year') != 2026 or h.get('season', {}).get('type') != 2: continue
        w = h.get('week'); w = w.get('number') if isinstance(w, dict) else w
        if not isinstance(w, int) or w > N or not c.get('status', {}).get('type', {}).get('completed'): continue
        side = {x['homeAway']: x for x in c.get('competitors', [])}
        if set(side) != {'home', 'away'}: continue
        ab = lambda t: FIX.get(t['team']['abbreviation'], t['team']['abbreviation'])
        aw, hm = ab(side['away']), ab(side['home']); sa, sh = int(side['away']['score']), int(side['home']['score'])
        gid = f'2026_{w:02d}_{aw}_{hm}'
        if gid in have: continue
        k = datetime.datetime.fromisoformat(c['date'].replace('Z', '+00:00')).astimezone(ET)
        x = {f_: '' for f_ in fields}
        x.update(game_id=gid, season='2026', game_type='REG', week=str(w), gameday=k.strftime('%Y-%m-%d'), weekday=k.strftime('%A'), gametime=k.strftime('%H:%M'),
                 away_team=aw, away_score=str(sa), home_team=hm, home_score=str(sh), location='Neutral' if c.get('neutralSite') else 'Home',
                 result=str(sh - sa), total=str(sh + sa), espn=str(h.get('id', '')))
        if 'source_provider' in fields: x.update(source_provider='ESPN saved final summary', source_artifact=f.replace('\\', '/'),
                                                 source_updated_at=datetime.datetime.fromtimestamp(os.path.getmtime(f), datetime.timezone.utc).isoformat())
        x = {f_: x.get(f_, '') for f_ in fields}; add.append(x); have.add(gid)
    if add:
        write(GAMES, rows + add, fields)
    cur = [r for r in rows + add if r.get('season') == '2026' and r.get('game_type') == 'REG']
    print(f'  games.csv: +{len(add)} rows; 2026 REG games through week {max(int(r["week"]) for r in cur)}: {len(cur)}')
    # 3. team_stats
    trows, tfields = read(TEAM); shutil.copy2(TEAM, f'{work}/backups/team_stats.csv.{stamp}')
    tkey = lambda r: (r.get('season'), r.get('week'), r.get('team'))
    thave = {tkey(r) for r in trows}; tadd = []
    nvt = f'{work}/nflverse/team_stats.csv'
    if os.path.exists(nvt):
        for r in read(nvt)[0]:
            if r.get('season') == '2026' and r.get('week', '').isdigit() and int(r['week']) <= N and (r.get('season_type', 'REG') == 'REG') and tkey(r) not in thave:
                tadd.append({f_: r.get(f_, '') for f_ in tfields}); thave.add(tkey(r))
    if tadd: write(TEAM, trows + tadd, tfields)
    weeks = {int(r['week']) for r in trows + tadd if r.get('season') == '2026' and r.get('week', '').isdigit()}
    print(f'  team_stats.csv: +{len(tadd)} rows; 2026 weeks present: {min(weeks)}-{max(weeks)}')
    if N not in weeks: print(f'  WARN: no team_stats rows for week {N} yet (nflverse lag); snapshots will use what exists. Re-run Wed/Thu.')
    # 4. builders
    ok = all([run(['node', 'scripts/build-power-ratings.js', '--season', '2026']),
              run(['node', 'scripts/build-team-analytics-snapshots.js', '--season', '2026', '--week', str(N)]),
              run(['node', 'scripts/build-coaching-tendency-snapshots.js', '--season', '2026', '--week', str(N)]),
              run(['node', 'scripts/build-regression-signals.js', '--season', '2026', '--week', str(N)]),
              run([PY, 'scripts/build-team-standings.py', '--week', str(N), '--season', '2026'])])
    if not ok: print('ERROR: a team-profile builder failed; dossiers not rebuilt.'); sys.exit(1)
    # 5. dossiers
    run(['node', 'scripts/build-team-dossiers.mjs', f'--week={N + 1}'])
    run(['node', 'scripts/validate-team-dossiers.mjs', f'--week={N + 1}'])
    out = f'data/generated/team-dossiers/2026-w{N + 1:02d}'
    n = len(glob.glob(f'{out}/*.json'))
    print(f'== Dossiers: {n} team json files in {out}')
    sys.exit(0 if n >= 28 else 1)

if __name__ == '__main__': main()
