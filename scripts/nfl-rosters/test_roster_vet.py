"""Regression test for the roster gate: every Week 3 (2026-09-27) roster error must BLOCK, and valid legs
must not. Run: python3 scripts/nfl-rosters/test_roster_vet.py   (needs the ESPN roster snapshot)"""
import json, subprocess, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]; FX = ROOT / 'tests/fixtures/roster-vet'
r = subprocess.run([sys.executable, str(ROOT / 'scripts/nfl-rosters/roster_vet.py'), '--week', '3', '--date', '2026-09-26', '--strict', '--quiet',
                    '--max-age-h', '100000', '--narratives', str(FX / 'narratives-w03-before-fix.md'), '--card', str(FX / 'card-bad.md')],
                   cwd=ROOT, capture_output=True, text=True)
res = json.load(open(ROOT / 'data/generated/master-intel/w03-roster-vet.json'))
blocked = {(b[0], b[2]) for b in res['blocking']}
must_block = [('narratives', 'A.J. Brown'), ('narratives', 'Mike Evans'), ('narratives', 'Rachaad White'), ('narratives', 'DeAndre Hopkins'),
              ('narratives', 'Joey Aguilar'), ('card', 'A.J. Brown'), ('card', 'Rachaad White'), ('card', 'Mike Evans'),
              ('card', 'Joey Aguilar'), ('card', 'Brandon Aiyuk'), ('card', 'DeAndre Hopkins')]
must_pass = [('card', 'Kyren'), ('card', 'D.Smith'), ('card', 'CIN')]
fail = [f'NOT BLOCKED: {x}' for x in must_block if x not in blocked] + [f'FALSE BLOCK: {x}' for x in must_pass if x in blocked]
print(f'exit code {r.returncode} (expect 1); blocking={len(blocked)}')
print('\n'.join(fail) or 'ALL ROSTER-GATE REGRESSION CHECKS PASS')
# restore the real week's vet file
subprocess.run([sys.executable, str(ROOT / 'scripts/nfl-rosters/roster_vet.py'), '--week', '3', '--date', '2026-09-26', '--quiet'], cwd=ROOT, capture_output=True)
sys.exit(1 if fail or r.returncode != 1 else 0)
