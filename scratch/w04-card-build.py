# Week 4 card builder (WEEKLY_SYNTHESIS_SESSION, Sat 10/03 night). Prices: BKR 10/03 10:46 PT board; BEO boards 10/02.
import itertools, math
def dec(o): return 1 + (o/100 if o > 0 else 100/abs(o))
def am(d): return round((d-1)*100) if d >= 2 else round(-100/(d-1))
def band(o):
    return '+' if o > 0 else ('-100..-120' if o >= -120 else ('-121..-200' if o >= -200 else ('-201..-350' if o >= -350 else '< -350')))
H = '| game | market & line | book | price | band | tier | side expected to win? | QB exposure | availability | why |\n|---|---|---|---|---|---|---|---|---|---|'
def row(g, m, bk, p, tier, qb, why, win='yes', av='FREE'):
    return dict(g=g, m=m, bk=bk, p=p, tier=tier, qb=qb, why=why, win=win, av=av)
def table(legs): return H + '\n' + '\n'.join(f"| {l['g']} | {l['m']} | {l['bk']} | {l['p']:+d} | {band(l['p'])} | {l['tier']} | {l['win']} | {l['qb']} | {l['av']} | {l['why']} |" for l in legs)
def parlay(name, bk, stake, legs, extra=''):
    d = math.prod(dec(l['p']) for l in legs)
    return f"### {name} — {bk} — **${stake}** — {am(d):+d} naive — ${stake} wins ${stake*(d-1):.2f}\n" + table(legs) + '\n' + flags(legs) + (('\n' + extra) if extra else ''), legs
def rr(name, bk, stake_each, legs, k=2):
    combos = list(itertools.combinations(legs, k)); tot = round(stake_each*len(combos), 2)
    rets = []
    for h in range(k, len(legs)+1):
        vals = []
        for hit in itertools.combinations(range(len(legs)), h):
            hs = set(hit); vals.append(sum(stake_each*math.prod(dec(legs[i]['p']) for i in c) for c in itertools.combinations(range(len(legs)), k) if set(c) <= hs))
        rets.append(f"{h} hit ${sum(vals)/len(vals):.0f}")
    return f"### {name} — {bk} — **${tot}** — {len(combos)} combos × ${stake_each} — returns (avg): " + ', '.join(rets) + '\n' + table(legs) + '\n' + flags(legs), legs
def flags(legs):
    f = []
    c = [l for l in legs if -120 <= l['p'] <= -100 and not any(t in l['tier'] for t in ('1', '2'))]
    if c: f.append('−120..−100 without tier 1–2: ' + ', '.join(l['m'] for l in c))
    mid = [l['m'] for l in legs if -199 <= l['p'] <= -121]
    if mid: f.append(f"{len(mid)} leg(s) in the −121..−199 band (season's weakest band): " + ', '.join(mid))
    ch = [l['m'] for l in legs if l['p'] <= -290]
    if ch: f.append('ML ≤ −290 chalk: ' + ', '.join(ch))
    if sum(l['p'] < -200 for l in legs) > 2: f.append('more than two legs shorter than −200')
    dogs = [l['m'] for l in legs if l['p'] > -125 and (' +' in l['m']) and 'ML' not in l['m'] and 'TD' not in l['m'] and 'interceptions' not in l['m']]
    if dogs: f.append('spread-dog legs (case stated in why): ' + ', '.join(dogs))
    qb = [l['qb'] for l in legs if l['qb'] not in ('—', '')]
    sh = sorted({q for q in qb if qb.count(q) > 1})
    return 'Flags: ' + ('; '.join(f) if f else 'none') + ' · QB-shared: ' + (', '.join(sh) if sh else 'none')

# ---- legs (BKR game lines 10/03 10:46 PT)
JAX = row('JAX@CIN', 'JAX ML', 'BKR', 129, '2', 'Lawrence', 'Big-money flag (38% tickets / 58% money); 6–4 named experts JAX; projection CIN by 2')
DEN = row('DEN@SF', 'DEN ML', 'BKR', 126, '2', 'Nix', '11–2 named experts DEN; SF −3 → −2.5 against 60%+ SF money; Bosa and M. Williams out; projection SF by 1')
ATL = row('ATL@NO', 'ATL ML (MNF)', 'BKR', 112, '2', 'Penix', 'Big-money flag (26% / 45% money); Makinen, Gibbs, SoS, Anderson ATL; Saints out Elliss + Granderson; projection NO by 2')
LV  = row('KC@LV', 'LV ML', 'BKR', 184, '2', 'Cousins', 'Fezzik/Tucker + Tuley best bets LV +4.5; home dog vs undefeated system (101–66–4); projection KC by 3')
NYJ = row('NYJ@CHI', 'NYJ ML', 'BKR', 167, '1+2', 'G. Smith', 'NYJ O vs CHI D HIGH; Bagent starts; Fezzik, Tucker, Middleton, AN, Reynolds NYJ; projection CHI by 3')
TEN = row('TEN@BAL', 'TEN ML', 'BKR', 492, '2', 'Ward', 'Big-money flag (4% tickets / 19% money); Tuley/Fezzik/Tucker TEN +11.5; the long leg of the RR')
ARI = row('ARI@NYG', 'ARI ML', 'BKR', -143, '1+2', 'Brissett', 'ARI O vs NYG D HIGH (7.32); line flipped 5 pts on the Dart news; big-money ML flag (62% / 78% money); projection ARI by 4')
LAR = row('LAR@PHI', 'LAR ML', 'BKR', -197, '2', 'Stafford', 'PHI without D. Smith, H. Brown and Goedert; Youmans ML best bet, Erickson −3.5; projection LAR by 5 (4 PHI systems = counter)')
SEA = row('LAC@SEA', 'SEA ML', 'BKR', -319, '2', 'Darnold', 'Projection SEA by 8; Kezirian, Erickson, Florio SEA; ML chalk flag (one per ticket)')
HOU = row('DAL@HOU', 'HOU ML', 'BKR', -160, '1+2', 'Stroud', 'Collins back vs DAL secondary (HIGH 10.09); Walsh PRO, Reynolds + Cohen ML; winless system HOU; projection HOU by 4 (DAL ML big-money flag = counter)')
DETc = row('DET@CAR', 'DET ML (SNF)', 'BKR', -191, '2 (cap)', 'Goff', 'SNF cap (keeps the ticket alive for a live hedge): projection DET by 4; 6–3 experts CAR = counter')
MIA = row('MIA@MIN', 'MIA +10', 'BKR', -109, '2', 'Willis', 'Spread dog with a stated case: two big-money flags (spread + ML); Walsh PRO, Makinen, Reynolds, AN, SoS MIA; projection MIN by 8, 2 pts inside the number')
NE  = row('NE@BUF', 'NE +7', 'BKR', -113, '2', 'Maye', 'Spread dog with a stated case: 6–4 named experts NE; 5 Bet Labs systems NE; Vrabel 30–18–2 ATS as a 3+ dog; projection BUF by 6 on the key number 7')
UGB = row('GB@TB', 'GB/TB Under 39.5', 'BKR', -119, '2', '—', 'Projection 37; Fezzik, Shepardson (best bet) and Erickson under; Jalon Daniels first start; single only (no full-game unders in parlays)')
NYJs = row('NYJ@CHI', 'NYJ +3.5', 'BKR', -103, '1+2', 'G. Smith', 'Spread dog with a stated case: the hook over 3; NYJ O vs CHI D HIGH; Bagent starts; 6 named experts NYJ')
# SuperContest legs at BKR prices (contest lines in "why")
sARI = row('ARI@NYG', 'ARI -2.5', 'BKR', -110, '1+2', 'Brissett', 'SC pick ARI −1.5 (contest); book −2.5. Projection ARI by 4')
sMIA = row('MIA@MIN', 'MIA +10', 'BKR', -109, '2', 'Willis', 'SC pick MIA +10.5 (contest, +0.5 CLV); book +10. Projection MIN by 8')
sLAR = row('LAR@PHI', 'LAR -3.5', 'BKR', -108, '2', 'Stafford', 'SC pick LAR −3 (contest); book −3.5 (half-point worse). Projection LAR by 5')
sTEN = row('TEN@BAL', 'TEN +11.5', 'BKR', -108, '2', 'Ward', 'SC pick TEN +11.5 (contest = book). Projection BAL by 10; big-money ML flag')
sDEN = row('DEN@SF', 'DEN +2.5', 'BKR', -104, '2', 'Nix', 'SC pick DEN +2.5 (contest = book). Projection SF by 1; 11–2 experts DEN')
# props (BEO multi-game, 10/02 boards)
pBRI = row('ARI@NYG', 'Jacoby Brissett 2+ pass TD', 'BEO', 106, '1', 'Brissett', 'ARI expected winner; ARI O vs NYG D HIGH; 1, 1, 2 TD W1–3 on 37/28/52 attempts (BKR has +124 but BKR props are same-game only)')
pSTA = row('LAR@PHI', 'Matthew Stafford 2+ pass TD', 'BEO', -120, '2', 'Stafford', 'LAR expected winner; 0, 4, 2 TD W1–3; showers forecast = counter')
pWIN = row('ARI@NYG', 'Jameis Winston o0.5 interceptions', 'BEO', -157, '2', 'Winston', 'QB expected to trail (NYG expected loser); 1 INT in 2 starts; matchup fit: volatile passer vs ARI lead')
pJDA = row('GB@TB', 'Jalon Daniels o0.5 interceptions', 'BEO', -150, '2', 'J. Daniels', 'Rookie first start, TB expected loser; matchup fit: young QB forced to throw')
pDAR = row('LAC@SEA', 'Sam Darnold 2+ pass TD', 'BEO', -127, '2', 'Darnold', 'SEA expected winner and its backfield is thin (Charbonnet, Price out); 4 TD in his one full game')
pMAH = row('KC@LV', 'Patrick Mahomes 2+ pass TD', 'BEO', -134, '2', 'Mahomes', 'KC expected winner (by 3, compatible with LV +4.5 in the RR); 2, 3, 2 TD W1–3')
pWIL = row('MIA@MIN', 'Malik Willis o0.5 interceptions', 'BEO', -173, '2', 'Willis', 'QB expected to trail vs the Flores defense; 2 INT in 3 starts (correlates against MIA +10 elsewhere on the card: a hedge, not a stack)')
pHEN = row('TEN@BAL', 'Derrick Henry 2+ TD', 'BEO', 200, '2', '—', 'BAL expected winner; Henry −245 to score at BKR, the shortest on the board')
pMON = row('DAL@HOU', 'David Montgomery 2+ TD', 'BEO', 300, '2', '—', 'HOU expected winner; 3 of HOU\'s 4 carries inside the 5 (PFF)')
pGIB = row('DET@CAR', 'Jahmyr Gibbs 2+ TD', 'BEO', 100, '2', '—', 'DET expected winner; CAR has allowed 4 rush TDs (PFF); SNF leg keeps the ticket alive')

T = []
T.append(rr('Slot 2 Dog-ML 2-team RR', 'BKR', 1.33, [JAX, DEN, ATL, LV, NYJ, TEN]))
T.append(parlay('Slot 3 Morning parlay', 'BKR', 20, [ARI, LAR, SEA, DETc], 'Template: morning favorites + one afternoon heavy favorite, capped by the SNF favorite ML. At 4 legs (playbook max) the payout is under the $300 target: adding legs breaks the 4-leg rule.'))
T.append(parlay('Slot 4 Afternoon parlay', 'BKR', 20, [HOU, DEN, SEA, DETc], 'Template: morning favorite for value + the afternoon\'s highest-confidence plays, capped by the same SNF favorite ML.'))
T.append(parlay('Slot 5 Hybrid', 'BKR', 20, [ARI, MIA, NE, DEN]))
T.append(parlay('Single MIA +10', 'BKR', 15, [MIA]))
T.append(parlay('Single GB-TB Under 39.5', 'BKR', 10, [UGB]))
T.append(parlay('Single NYJ +3.5', 'BKR', 10, [NYJs]))
T.append(parlay('2-leg ARI ML + JAX ML', 'BKR', 10, [ARI, JAX]))
T.append(parlay('SuperContest A 5-team parlay', 'BKR', 15, [sARI, sMIA, sLAR, sTEN, sDEN], 'Book lines, not contest lines: ARI and LAR are half a point to a point worse here, MIA half a point worse.'))
T.append(rr('SuperContest B 2-team RR', 'BKR', 1.0, [sARI, sMIA, sLAR, sTEN, sDEN]))
T.append(parlay('7a Morning prop stack', 'BEO', 5, [pBRI, pSTA, pWIN, pJDA], 'ARI@NYG carries 2 legs (BEO limit is 2 per game).'))
T.append(parlay('7b Afternoon prop stack', 'BEO', 5, [pDAR, pMAH, pWIL]))
T.append(parlay('8b 2+ TD 3-leg', 'BEO', 5, [pHEN, pMON, pGIB]))
open('scratch/w04-card-tickets.md', 'w', encoding='utf-8').write('\n\n'.join(t for t, _ in T) + '\n')
# exposure per game (cash on tickets touching each game)
import re, collections
st = collections.defaultdict(float)
for t, legs in T:
    s = float(re.search(r'\*\*\$([\d.]+)\*\*', t).group(1))
    for g in {l['g'] for l in legs}: st[g] += s
print('stake total', round(sum(float(re.search(r'\*\*\$([\d.]+)\*\*', t).group(1)) for t, _ in T), 2))
print('cash touching each game:', dict(sorted(st.items(), key=lambda x: -x[1])))
for t, _ in T: print(t.split('\n')[0]); print('   ', [l for l in t.split('\n') if l.startswith('Flags')][0][:230])
