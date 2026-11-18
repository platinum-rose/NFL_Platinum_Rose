"""Run the standard podcast grader for W10 before the weekly archive exists: same code as
scripts/master-intel/grade_podcast_picks.py, with the gamesum read from reports/bets/season-recap/w10gamesum.json.
Writes reports/intel/w10-podcast-pick-grades.json (the file the Tuesday step would write). Run from repo root."""
import sys, os
src = open('scripts/master-intel/grade_podcast_picks.py', encoding='utf-8').read()
old = "os.path.join(ROOT, f'data/archive/2026/week-{W}/betting/w{wk}gamesum.json')"
assert old in src
src = src.replace(old, "os.path.join(ROOT, f'reports/bets/season-recap/w{wk}gamesum.json')")
src = src.replace("os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))", "os.path.abspath('.')")
sys.argv = ['grade_podcast_picks.py', '--week', '10']
exec(compile(src, 'grade_podcast_picks.py', 'exec'), {'__name__': '__main__'})
