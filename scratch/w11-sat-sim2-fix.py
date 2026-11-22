p = 'scratch/w11-sat-sim2.mjs'
s = open(p, encoding='utf-8').read()
reps = [
 (".filter(f => f.endsWith('.json'));", ".filter(f => /^[A-Z]{2,3}\\.json$/.test(f));"),
 ("const NEUTRAL = new Set(['MIN@SF']); const HFA = 1.5;", "const NEUTRAL = new Set(['MIN@SF']); const HFA = 1.5; const REG = 0.5; // regress 9-game EPA halfway to league mean"),
 ("  const hExp = (h.off_epa - MEAN.off_epa) + (a.def_epa - MEAN.def_epa), aExp = (a.off_epa - MEAN.off_epa) + (h.def_epa - MEAN.def_epa);",
  "  const hExp = REG * ((h.off_epa - MEAN.off_epa) + (a.def_epa - MEAN.def_epa)), aExp = REG * ((a.off_epa - MEAN.off_epa) + (h.def_epa - MEAN.def_epa));"),
 ("(offense EPA/play + opponent defense EPA/play allowed, each vs league mean, times the offense's plays/game,",
  "(offense EPA/play + opponent defense EPA/play allowed, each vs league mean and regressed ${REG * 100}% toward it, times the offense's plays/game,"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]; s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('fixed')
