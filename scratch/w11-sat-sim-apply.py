import json, re, shutil
SIM = json.load(open('reports/intel/w11-model/sim-w11-sat.json', encoding='utf-8'))
R = {r['game']: r for r in SIM['recs']}
SC = {r['pick'].split(' ')[0]: r for r in SIM['supercontest']}
pct = lambda x: f'{100 * x:.1f}%'
TAG = '-sat-sim'
# 1. Digest rows: add 'margin sim conf X%' to the evidence cell (the game grid reads 'conf NN%').
p = 'scratch/w11-synthesis-digest-sat.md'; shutil.copy(p, p + '.bak' + TAG)
s = open(p, encoding='utf-8').read()
for g, r in R.items():
    m = re.search(rf'^\| {re.escape(g)} \|[^|]*\|[^|]*\|([^|]*)\|', s, re.M); assert m, g
    note = f"; margin sim conf {100 * r['p_cover_xp']:.1f}% vs {pct(r['break_even'])} break-even" + (' (no model edge)' if r['edge_pct'] < 0 else '')
    if 'margin sim conf' not in m.group(1):
        s = s[:m.end(1)].rstrip() + note + ' ' + s[m.end(1):]
open(p, 'w', encoding='utf-8').write(s)
# 2. Narratives: one sentence appended to each relevant Saturday update.
p = 'reports/intel/master-intel-narratives-2026-w11.md'; shutil.copy(p, p + '.bak' + TAG)
s = open(p, encoding='utf-8').read()
X = {
 'NYJ@LAC': f"Margin sim (market-centered, model half-shrunk): NYJ +3 covers {pct(R['NYJ@LAC']['p_cover_xp'])} of non-push outcomes vs a {pct(R['NYJ@LAC']['break_even'])} break-even, the largest edge on the card; contest NYJ +3.5 rates {SC['NYJ']['exp_points']:.3f} expected points.",
 'JAX@NYG': f"Margin sim: JAX -5.5 covers {pct(R['JAX@NYG']['p_cover_xp'])} vs a {pct(R['JAX@NYG']['break_even'])} break-even.",
 'PIT@PHI': f"Margin sim: PIT -4 covers {pct(R['PIT@PHI']['p_cover_xp'])} vs a {pct(R['PIT@PHI']['break_even'])} break-even. The model does not adjust for the Philadelphia quarterback change.",
 'CIN@WAS': f"Margin sim: CIN -6 covers {pct(R['CIN@WAS']['p_cover_xp'])} vs a {pct(R['CIN@WAS']['break_even'])} break-even at -113, a thin margin; -6 at a better price would help.",
 'MIN@SF': f"Margin sim: Under 46.5 hits {pct(R['MIN@SF']['p_cover_xp'])} vs a {pct(R['MIN@SF']['break_even'])} break-even; contest SF -3 rates {SC['SF']['exp_points']:.3f} expected points (wins {pct(SC['SF']['p_win'])}, pushes {pct(SC['SF']['p_push'])}).",
 'NO@CHI': f"Margin sim: Under 48 hits only {pct(R['NO@CHI']['p_cover_xp'])} vs a {pct(R['NO@CHI']['break_even'])} break-even. There is no model edge; Andy kept it as a weather lean (rain, wind and three Saints line starters out are not in the model).",
 'TB@DET': f"Margin sim: contest TB +7 is the best side on the slate at {SC['TB']['exp_points']:.3f} expected points (wins {pct(SC['TB']['p_win'])}, pushes {pct(SC['TB']['p_push'])}), assuming Mayfield starts.",
 'TEN@DAL': f"Margin sim: contest TEN +8 rates only {SC['TEN']['exp_points']:.3f} expected points ({pct(SC['TEN']['p_win_xp'])} excluding pushes); the pitch rests on sharp and expert support the model does not see.",
 'MIA@BUF': f"Margin sim: contest MIA +16.5 rates {SC['MIA']['exp_points']:.3f} expected points ({pct(SC['MIA']['p_win_xp'])}); the pitch rests on the three expert calls, not the model.",
 'BAL@CAR': f"Margin sim: contest CAR -2.5 rates {SC['CAR']['exp_points']:.3f} expected points ({pct(SC['CAR']['p_win_xp'])}).",
 'LV@DEN': f"Margin sim: contest DEN -10 rates {SC['DEN']['exp_points']:.3f} expected points ({pct(SC['DEN']['p_win_xp'])} excluding pushes), below even; LV +10 rates {1 - SC['DEN']['exp_points']:.3f}. DEN stays an alternate on expert support only.",
}
for g, t in X.items():
    m = re.search(rf'(## {re.escape(g)}\n.*?### Why the card leans this way\nSaturday update:[^\n]*)', s, re.S); assert m, g
    if 'Margin sim' not in m.group(1): s = s.replace(m.group(1), m.group(1) + ' ' + t, 1)
s = s.replace('## GAPS\n\n', '## GAPS\n\n- Margin simulation (Sat 7:30 pm PT, reports/intel/w11-model/sim-w11-sat.json): the shared calibrated simulator, centered on the 5:43 pm Bookmaker line moved halfway toward the raw team-strength model. The model has no QB, injury or weather adjustments, so the probabilities miss those factors; its totals also run high across the slate and were not used to add plays. Andy kept every pick, lean and SuperContest pitch as approved.\n', 1)
open(p, 'w', encoding='utf-8').write(s)
# 3. SuperContest pitches: sim figure on each entry.
p = 'reports/intel/supercontest-pitches-2026-w11.json'; shutil.copy(p, p + '.bak' + TAG)
d = json.load(open(p, encoding='utf-8')); P = d['picks']
def add(t, k, i, txt):
    b = P[t][k][i]
    if 'margin sim' not in b['text']: b['text'] = b['text'].rstrip() + ' ' + txt
add('TB', 'pitch', 0, f"The margin sim makes TB +7 the best contest side on the slate: {SC['TB']['exp_points']:.3f} expected points, winning {pct(SC['TB']['p_win'])} and pushing {pct(SC['TB']['p_push'])}.")
add('NYJ', 'pitch', 0, f"The margin sim rates NYJ +3.5 at {SC['NYJ']['exp_points']:.3f} expected points ({pct(SC['NYJ']['p_win'])} to cover).")
add('SF', 'pitch', 0, f"The margin sim rates SF -3 at {SC['SF']['exp_points']:.3f} expected points, with a {pct(SC['SF']['p_push'])} push chance on exactly 3.")
add('TEN', 'pushback', 1, f"The margin sim rates TEN +8 at only {SC['TEN']['exp_points']:.3f} expected points, ninth on the slate; the case rests on sharp and expert support.")
add('MIA', 'pushback', 1, f"The margin sim rates MIA +16.5 at only {SC['MIA']['exp_points']:.3f} expected points, eighth on the slate; the case rests on the expert calls.")
add('CAR', 'pushback', 1, f"The margin sim rates CAR -2.5 at {SC['CAR']['exp_points']:.3f} expected points, barely above even.")
add('DEN', 'pushback', 0, f"The margin sim rates DEN -10 at {SC['DEN']['exp_points']:.3f} expected points, below even, and prefers Las Vegas +10.")
d['method'] += ' Margin-sim expected points (win + half a push) from reports/intel/w11-model/sim-w11-sat.json were added Saturday 7:30 pm PT; no pick was re-ranked.'
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('applied')
