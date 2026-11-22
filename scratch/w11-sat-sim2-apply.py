import json, re, shutil
SIM = json.load(open('reports/intel/w11-model/sim-w11-sat.json', encoding='utf-8'))
R = {r['game']: r for r in SIM['recs']}
SC = {r['pick'].split(' ')[0]: r for r in SIM['supercontest']}
P = lambda x: f'{100 * x:.1f}%'
TAG = '.bak-sat-sim2'
# ---------- 1. digest conf notes ----------
p = 'scratch/w11-synthesis-digest-sat.md'; shutil.copy(p, p + TAG)
s = open(p, encoding='utf-8').read()
s = re.sub(r'; margin sim conf [\d.]+% vs [\d.]+% break-even(?: \(no model edge\))?', '', s)
for g, r in R.items():
    m = re.search(rf'^\| {re.escape(g)} \|[^|]*\|[^|]*\|([^|]*)\|', s, re.M); assert m, g
    note = (f"; margin sim conf {100 * r['p_cover_xp']:.1f}% vs {P(r['break_even'])} break-even"
            + (' (no model edge)' if r['edge_pct'] < 0 else '') + f"; FTN matchup analytics {P(r['analytics_p_cover_xp'])}")
    s = s[:m.end(1)].rstrip() + note + ' ' + s[m.end(1):]
open(p, 'w', encoding='utf-8').write(s)
# ---------- 2. narratives ----------
p = 'reports/intel/master-intel-narratives-2026-w11.md'; shutil.copy(p, p + TAG)
s = open(p, encoding='utf-8').read()
s = re.sub(r'(Saturday update:[^\n]*?) Margin sim[^\n]*', r'\1', s)
r, c = R, SC
X = {
 'NYJ@LAC': f"Margin sim (pipeline standard: halfway to the model, then blended 50/50 with the market): NYJ +3 covers {P(r['NYJ@LAC']['p_cover_xp'])} vs a {P(r['NYJ@LAC']['break_even'])} break-even, and the FTN matchup analytics agree ({P(r['NYJ@LAC']['analytics_p_cover_xp'])}). Contest NYJ +3.5 rates {c['NYJ']['exp_points']:.3f} expected points.",
 'JAX@NYG': f"Margin sim: JAX -5.5 covers {P(r['JAX@NYG']['p_cover_xp'])} vs a {P(r['JAX@NYG']['break_even'])} break-even, a thin edge; the FTN matchup analytics do not support it ({P(r['JAX@NYG']['analytics_p_cover_xp'])}).",
 'PIT@PHI': f"Margin sim: PIT -4 covers {P(r['PIT@PHI']['p_cover_xp'])} vs a {P(r['PIT@PHI']['break_even'])} break-even; the FTN matchup analytics show no edge ({P(r['PIT@PHI']['analytics_p_cover_xp'])}). Neither view adjusts for the Philadelphia quarterback change.",
 'CIN@WAS': f"Margin sim: CIN -6 covers {P(r['CIN@WAS']['p_cover_xp'])} vs a {P(r['CIN@WAS']['break_even'])} break-even at -113, essentially no edge at this price; the FTN matchup analytics lean the other way ({P(r['CIN@WAS']['analytics_p_cover_xp'])}).",
 'MIN@SF': f"Margin sim: Under 46.5 hits {P(r['MIN@SF']['p_cover_xp'])} vs a {P(r['MIN@SF']['break_even'])} break-even, and the FTN matchup analytics are stronger ({P(r['MIN@SF']['analytics_p_cover_xp'])}). Contest SF -3 rates {c['SF']['exp_points']:.3f} expected points (pushes {P(c['SF']['p_push'])} on exactly 3).",
 'NO@CHI': f"Margin sim: Under 48 hits {P(r['NO@CHI']['p_cover_xp'])} vs a {P(r['NO@CHI']['break_even'])} break-even, no model edge; the FTN matchup analytics come closer ({P(r['NO@CHI']['analytics_p_cover_xp'])}) but still fall short. Andy kept it as a weather lean (rain, wind and three Saints line starters out are not in either view).",
 'TB@DET': f"Margin sim: contest TB +7 is the best side on the slate at {c['TB']['exp_points']:.3f} expected points ({c['TB']['analytics_exp_points']:.3f} on the FTN matchup analytics), assuming Mayfield starts.",
 'TEN@DAL': f"Margin sim: contest TEN +8 rates {c['TEN']['exp_points']:.3f} expected points ({c['TEN']['analytics_exp_points']:.3f} analytics), fourth on the slate; sharp and expert support add to it.",
 'MIA@BUF': f"Margin sim: contest MIA +16.5 rates {c['MIA']['exp_points']:.3f} expected points, fifth on the slate; the FTN matchup analytics are more favorable ({c['MIA']['analytics_exp_points']:.3f}).",
 'BAL@CAR': f"Margin sim: contest CAR -2.5 rates {c['CAR']['exp_points']:.3f} expected points ({c['CAR']['analytics_exp_points']:.3f} analytics), barely above even.",
 'LV@DEN': f"Margin sim: contest DEN -10 rates {c['DEN']['exp_points']:.3f} expected points, below even in both views ({c['DEN']['analytics_exp_points']:.3f} analytics); LV +10 rates higher. DEN stays an alternate on expert support only.",
}
for g, t in X.items():
    m = re.search(rf'(## {re.escape(g)}\n.*?### Why the card leans this way\nSaturday update:[^\n]*)', s, re.S); assert m, g
    s = s.replace(m.group(1), m.group(1) + ' ' + t, 1)
s, n = re.subn(r'- Margin simulation \(Sat 7:30 pm PT[^\n]*\n',
  '- Margin simulation (Sat 8:25 pm PT, reports/intel/w11-model/sim-w11-sat.json): pipeline standard, the same as Friday\'s packets. The center is the 5:43 pm Bookmaker line moved halfway toward the team-strength model, and every probability is then blended 50/50 with the market\'s own probability. An FTN matchup-analytics view (offense vs opposing defense EPA per play through Week 9, regressed halfway to league average) runs through the same steps as a sensitivity check. Neither view adjusts for quarterbacks, injuries or weather, and the analytics weights are untested. With the standard blend, the approved SuperContest five are the top five contest sides by expected points. Andy kept every pick, lean and pitch as approved.\n', s)
assert n == 1
open(p, 'w', encoding='utf-8').write(s)
# ---------- 3. SuperContest pitches ----------
p = 'reports/intel/supercontest-pitches-2026-w11.json'; shutil.copy(p, p + TAG)
d = json.load(open(p, encoding='utf-8')); PK = d['picks']
for t in PK.values():
    for k in ('pitch', 'pushback'):
        for b in t[k]: b['text'] = re.split(r'\s+The margin sim', b['text'])[0].rstrip()
def add(t, k, i, txt): PK[t][k][i]['text'] += ' ' + txt
add('TB', 'pitch', 0, f"The margin sim makes TB +7 the best contest side on the slate: {c['TB']['exp_points']:.3f} expected points ({c['TB']['analytics_exp_points']:.3f} on the FTN matchup analytics), winning {P(c['TB']['p_win'])} and pushing {P(c['TB']['p_push'])}.")
add('NYJ', 'pitch', 0, f"The margin sim rates NYJ +3.5 at {c['NYJ']['exp_points']:.3f} expected points, second on the slate, and the FTN matchup analytics agree ({c['NYJ']['analytics_exp_points']:.3f}).")
add('SF', 'pitch', 0, f"The margin sim rates SF -3 at {c['SF']['exp_points']:.3f} expected points, third on the slate, with a {P(c['SF']['p_push'])} push chance on exactly 3.")
add('TEN', 'pushback', 1, f"The margin sim rates TEN +8 at {c['TEN']['exp_points']:.3f} expected points, fourth on the slate but only slightly above even; the case leans on sharp and expert support.")
add('MIA', 'pushback', 1, f"The margin sim rates MIA +16.5 at {c['MIA']['exp_points']:.3f} expected points, fifth on the slate and close to even ({c['MIA']['analytics_exp_points']:.3f} on the FTN matchup analytics).")
add('CAR', 'pushback', 1, f"The margin sim rates CAR -2.5 at {c['CAR']['exp_points']:.3f} expected points ({c['CAR']['analytics_exp_points']:.3f} analytics), barely above even.")
add('DEN', 'pushback', 0, f"The margin sim rates DEN -10 at {c['DEN']['exp_points']:.3f} expected points, below even in both views ({c['DEN']['analytics_exp_points']:.3f} analytics), and prefers Las Vegas +10.")
d['method'] = re.sub(r' Margin-sim expected points.*$', '', d['method']) + ' Margin-sim expected points (win + half a push; pipeline-standard double shrink) and an FTN matchup-analytics sensitivity from reports/intel/w11-model/sim-w11-sat.json were added Saturday 8:25 pm PT; no pick was re-ranked.'
json.dump(d, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('applied v2')
