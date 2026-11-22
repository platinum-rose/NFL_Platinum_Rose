import json, sys
sys.path.insert(0, 'scripts/master-intel')
import sc_review as R
C = {9: {'ai': ['ARI +12.5', 'TB +6.5', 'CLE +3', 'IND +5.5', 'SF -9.5']},
     10: {'ai': ['KC -3.5', 'SF -4.5', 'BAL -4.5', 'JAX -10.5', 'ARI +9.5']}}
for w in (9, 10):
    off = json.load(open(f'data/supercontest/locked-card-week-{w}.json', encoding='utf-8'))
    for lab, picks in (('AI', C[w]['ai']), ('OFFICIAL', off)):
        g = R.grade_picks(w, picks)
        print(w, lab, R.score_picks(g)['summary'])
        for x in g: print('   ', json.dumps(x, ensure_ascii=False))
