"""Unit test for operator_overrides.apply (no network, no files). Run: python3 scripts/nfl-rosters/test_operator_overrides.py"""
import copy, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import operator_overrides as O
snap = {'per_team': {'ARI': 50, 'HOU': 50, 'DEN': 50}, 'players': {
    'Marvin Harrison Jr.': [{'team': 'ARI', 'position': 'WR', 'group': 'offense', 'status': 'active'}],
    'Troy Franklin': [{'team': 'DEN', 'position': 'WR', 'group': 'offense', 'status': 'active'}],
    'Already Moved': [{'team': 'HOU', 'position': 'WR', 'group': 'offense', 'status': 'active'}]}}
E = [{'id': 't1', 'kind': 'team_change', 'player': 'Marvin Harrison Jr.', 'from_team': 'ARI', 'to_team': 'HOU'},
     {'id': 's1', 'kind': 'status', 'player': 'Troy Franklin', 'team': 'DEN', 'status': 'Injured Reserve'},
     {'id': 't2', 'kind': 'team_change', 'player': 'Already Moved', 'from_team': 'ARI', 'to_team': 'HOU'},
     {'id': 'x', 'kind': 'status', 'player': 'Nobody Here', 'team': 'DEN', 'status': 'Injured Reserve'}]
a = copy.deepcopy(snap); log = O.apply(a, E)
h = a['players']['Marvin Harrison Jr.'][0]; f = a['players']['Troy Franklin'][0]
assert h['team'] == 'HOU' and h['team_before_override'] == 'ARI' and h['operator_override'] == 't1'
assert a['per_team'] == {'ARI': 49, 'HOU': 51, 'DEN': 50}
assert f['group'] == 'injuredReserveOrOut' and f['status'] == 'Injured Reserve' and f['group_before_override'] == 'offense'
assert a['players']['Already Moved'][0]['operator_override'] == 't2' and a['per_team']['HOU'] == 51   # no double move
assert any('not in snapshot' in l for l in log)
b = copy.deepcopy(a); O.apply(b, E)                       # idempotent
assert b['players'] == a['players'] and b['per_team'] == a['per_team']
print('operator_overrides tests: PASS')
