"""Apply Andy-reported player facts (data/nfl-rosters/operator-status-overrides.json) to an ESPN roster snapshot.
ESPN's public feeds lag trades and IR moves; the roster gate and everything built on the snapshot must not revert them.
  kind=team_change : moves the player's record from from_team to to_team (no-op if the snapshot already has to_team).
  kind=status      : sets group='injuredReserveOrOut' and status to the override status, so roster_vet.py treats the player
                     as NOT_ACTIVE (blocking for card legs) and the availability layer lists him as operator-reported IR/out.
Every touched record gets 'operator_override': <id> (and the prior group/team). Idempotent. Never touches ESPN's feed itself.
Usage: python3 scripts/nfl-rosters/operator_overrides.py --apply-to data/nfl-rosters/espn-full-rosters-latest.json | --list
"""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
OVERRIDES = ROOT / 'data/nfl-rosters/operator-status-overrides.json'

def load():
    return (json.load(open(OVERRIDES, encoding='utf-8')) if OVERRIDES.exists() else {}).get('entries', [])

def apply(snapshot, entries=None):
    """Mutates snapshot['players'] in place; returns list of human-readable change lines."""
    entries = load() if entries is None else entries
    players, per_team, log = snapshot.get('players', {}), snapshot.get('per_team'), []
    for e in entries:
        recs = players.get(e['player'])
        if not recs:
            log.append(f"{e['id']}: {e['player']} not in snapshot (no change)"); continue
        if e['kind'] == 'team_change':
            if any(r['team'] == e['to_team'] for r in recs):
                log.append(f"{e['id']}: snapshot already has {e['player']} on {e['to_team']}")
                for r in recs:
                    if r['team'] == e['to_team']: r.setdefault('operator_override', e['id'])
                continue
            hit = [r for r in recs if r['team'] == e['from_team']]
            for r in hit:
                if r.get('operator_override') == e['id']: continue
                r['operator_override'] = e['id']; r['team_before_override'] = r['team']; r['team'] = e['to_team']
                if per_team:
                    per_team[e['from_team']] = per_team.get(e['from_team'], 1) - 1; per_team[e['to_team']] = per_team.get(e['to_team'], 0) + 1
                log.append(f"{e['id']}: moved {e['player']} {e['from_team']} -> {e['to_team']}")
        elif e['kind'] == 'status':
            for r in recs:
                if r['team'] != e['team'] or r.get('operator_override') == e['id']: continue
                r['operator_override'] = e['id']; r['group_before_override'] = r.get('group'); r['status_before_override'] = r.get('status')
                r['group'] = 'injuredReserveOrOut'; r['status'] = e['status']
                log.append(f"{e['id']}: {e['player']} {e['team']} group {r['group_before_override']} -> injuredReserveOrOut ({e['status']})")
        else:
            log.append(f"{e.get('id')}: unknown kind {e.get('kind')} ignored")
    snapshot['operator_overrides_applied'] = [e['id'] for e in entries]
    return log

if __name__ == '__main__':
    if '--list' in sys.argv:
        for e in load(): print(e['id'], '|', e['kind'], '|', e['player']); sys.exit(0)
    if '--apply-to' in sys.argv:
        p = pathlib.Path(sys.argv[sys.argv.index('--apply-to') + 1]); p = p if p.is_absolute() else ROOT / p
        snap = json.load(open(p, encoding='utf-8')); lines = apply(snap)
        json.dump(snap, open(p, 'w', encoding='utf-8'), indent=1); print('\n'.join(lines) or 'no changes'); sys.exit(0)
    print(__doc__)
