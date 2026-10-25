import itertools,json
def dec(a): a=int(a); return 1+(a/100 if a>0 else 100/-a)
def amer(d): return f"+{round((d-1)*100):,}" if d>=2 else f"{round(-100/(d-1))}"
def leg(g,m,b,p,t,w): return dict(g=g,m=m,b=b,p=p,t=t,w=w)
def table(legs):
    s=['| Game | Market & line | Book | Price | Tier | Why |','|---|---|---|---|---|---|']
    return s+[f"| {l['g']} | {l['m']} | {l['b']} | {l['p']} | {l['t']} | {l['w']} |" for l in legs]
out=[]
# ---------- singles ($20) ----------
S=[('IND@MIN','Under 41.5','BKR','-109','B · Platinum Rose','Pitch/Pushback in the Master. Pass at 40.5.'),
   ('MIA@NYJ','Under 39','BKR','-108','B · Platinum Rose','BEO has Under 39.5 at -115: take the better number if still posted.'),
   ('CIN@BAL','Under 47','BKR','-118','B · Platinum Rose (flag)','Lamar OUT; play to 47, pass at 46.5 (BEO is 46: do not use).'),
   ('GB@DET','Green Bay +3.5','BKR','-103','B · Platinum Rose','Hook on 3; BEO -105.'),
   ('TB@CAR','Over 44.5','BKR','-108','B · Platinum Rose (conditional)','ONLY if Mayfield is active at 8:30 AM PT; otherwise void.'),
   ('KC@SEA','Kansas City +3','BKR','-115','Lean (Andy standalone)','Andy\'s standalone pick; lean by the evidence bar (RLM to SEA). Correlated with live KC +3.5 / +8.'),
   ('MIA@NYJ','New York Jets -4','BKR','-108','C · Platinum Rose (elevated by Andy)','Fair NYJ -6; ESPN best bet. Pushback: three shows on MIA, line moved toward MIA.'),
   ('DEN@ARI','Arizona +4.5','BKR','-108','C · Platinum Rose (elevated by Andy)','52.7% sim cover; same side as the AI SuperContest pick. Pushback: money leans DEN.'),
   ('KC@SEA','KC ML (Kansas City)','BKR','+129','C · Platinum Rose (elevated by Andy)','Sim 47.8% vs 43.7% implied. Stacks on live KC +3.5 / +8 and the KC +3 single.'),
   ('MIA@NYJ','Malik Willis pass TD Under 0.5','BKR','+148','B prop','2 TD in 5 g (TD% 1.5%); synthesis fair ~+105.'),
   ('PIT@NO','Aaron Rodgers pass TD Over 1.5','BEO','+100','B prop','2+ TD in 4/6; NO allowed 10 pass TD.')]
out+=['## 3. Singles — $20 each (Andy unit, 2026-10-24)','']
for g,m,b,p,t,w in S:
    win=20*(dec(p)-1)
    out+=[f"### Single · {g} {m} — {b} — **$20** — {p} — to win ${win:.2f}"]+table([leg(g,m,b,p,t,w)])+['Flags: proposal only; recheck price and inactives before placing.','']
# ---------- round robins ----------
out+=['## 4. Round robins','']
dog=[('KC@SEA','KC ML (Kansas City)','+129'),('SF@ATL','ATL ML (Atlanta)','+123'),('PIT@NO','NO ML (New Orleans)','+140'),('DEN@ARI','ARI ML (Arizona)','+193'),('LAR@LV','LV ML (Las Vegas; only if Nacua is inactive)','+157')]
pairs=list(itertools.combinations(dog,2)); stake_c=2
best=sum(stake_c*dec(a[2])*dec(b[2]) for a,b in pairs)
out+=[f"### Dog ML Round Robin (by 2s) — BKR — **${stake_c*len(pairs)}** — {len(pairs)} two-team combos × ${stake_c} — all five hit returns ${best:,.0f}; 3 of 5 returns about ${sum(stake_c*dec(a[2])*dec(b[2]) for a,b in itertools.combinations(dog[:3],2)):,.0f}"]
out+=table([leg(g,m,'BKR',p,'C (dog)','Andy-confirmed set (ATL in for PHI). '+('KC is already on two live tickets.' if g=='KC@SEA' else 'Nacua decision ~11:55 AM PT; if he plays, drop LV: 4 legs = 6 combos × $2 = $12.' if g=='LAR@LV' else '')) for g,m,p in dog])
out+=['Flags: template = 2u ($20); ATL +123 BEO +130; ARI +193 BEO +186. If Nacua plays, run 4 legs (6 × $2 = $12) or 6 × $3.33 = $20.','']
master=[('GB@DET','Green Bay +3.5','-103','B · Platinum Rose','Pitch in Master'),
 ('MIA@NYJ','New York Jets -4','-108','C · Platinum Rose','Pitch in Master'),
 ('DEN@ARI','Arizona +4.5','-108','C · Platinum Rose','Pitch in Master'),
 ('KC@SEA','KC ML (Kansas City)','+129','C · Platinum Rose','Pitch in Master; adds to live KC exposure'),
 ('IND@MIN','Under 41.5','-109','B · Platinum Rose','Pitch in Master'),
 ('CIN@BAL','Under 47','-118','B · Platinum Rose (flag)','-118 price; pass at 46.5'),
 ('TB@CAR','Over 44.5','-108','B · Platinum Rose (conditional)','Mayfield active; if OUT swap in CLE@TEN Under 37 (-113)'),
 ('DAL@PHI','Under 44','-108','Lean (B in Sat recheck)','Only non-rec leg: MIA@NYJ Under 39 cannot sit beside NYJ -4 (one leg per game); Monday leg')]
combos=list(itertools.combinations(master,4))
allhit=sum(dec(a[2])*dec(b[2])*dec(c[2])*dec(d[2]) for a,b,c,d in combos)
one=dec('-110')**4
out+=[f"### Master Round Robin (8 legs by 4s) — BKR — **$70** — 70 four-team combos × $1 (~{amer(one)} each) — all eight hit returns about ${allhit:,.0f}; 6 of 8 returns about ${15*one:,.0f}; 5 of 8 about ${5*one:,.0f}"]
out+=table([leg(g,m,'BKR',p,t,w) for g,m,p,t,w in master])
out+=['Flags: template 8 legs, 4-team combos, $70-140. Rebalanced Sat 10:35 PM at the direction of Andy: four sides (GB, NYJ, ARI, KC ML) and four totals (three Unders, one Over); seven legs are Platinum Rose recs, DAL/PHI U44 is the one lean (MIA/NYJ U39 shares a game with NYJ -4). Every leg is from a different game. 5 of 8 returns about $66 (just short of the $70 stake), so it needs 6 of 8 to profit. Proposal only.','']
# ---------- parlays ($10) ----------
out+=['## 5. Sides and totals parlays — $10 each','']
P=[('Morning Parlay (SNF cap)','BKR',[('IND@MIN','Under 41.5','-109','B · Platinum Rose','10:00 AM'),('MIA@NYJ','Under 39','-108','B · Platinum Rose','10:00 AM'),('CIN@BAL','Under 47','-118','B · Platinum Rose','10:00 AM; pass at 46.5'),('KC@SEA','Seattle ML (SNF cap)','-148','Cap / hedge placeholder','Last-resolving leg; hedge KC if the ticket survives. Opposes the live KC tickets and the KC +3 single by design (middle: SEA by 1-2)')],
    'Template: morning totals then the SNF ML cap. No afternoon ML added: the clean afternoon favorites (DEN, already live) duplicate exposure.'),
   ('Afternoon Parlay (SNF cap)','BKR',[('PIT@NO','Pittsburgh ML','-161','Connector (no Platinum Rose edge)','Morning heavy favorite; model 62.6% vs 61.7% implied'),('CLE@TEN','Cleveland ML','-131','Connector (near fair -129)','Andy kept CLE ML as a possible parlay leg'),('GB@DET','Green Bay +3.5','-103','B · Platinum Rose','Afternoon high-confidence leg'),('KC@SEA','Seattle ML (SNF cap)','-148','Cap / hedge placeholder','Last-resolving leg; hedge plan as above')],
    'Template: 2-3 morning heavy favorites + afternoon high-confidence + SNF cap. MIN/NYJ/HOU/CAR/DEN MLs are already live, so PIT and CLE are the only non-duplicate favorites; both are -120-to-161 connectors with no Platinum Rose edge (flagged per the connector rule).'),
   ('Hybrid A (BEO, no Paris game)','BEO',[('IND@MIN','Under 41.5','-110','B · Platinum Rose','BEO price'),('MIA@NYJ','Under 39.5','-115','B · Platinum Rose','Half a point better than BKR'),('GB@DET','Green Bay +3.5','-105','B · Platinum Rose','BEO price'),('KC@SEA','Sam Darnold O0.5 INT','-115','B prop','Night leg keeps the ticket alive into SNF')],
    'Andy 8:54 PM: no PIT@NO legs. BEO because BKR does not allow cross-game player props. No legs shared with Hybrid B. Request the live BEO multi-game price.'),
   ('Hybrid B (BEO, no Paris game)','BEO',[('TB@CAR','Over 44.5','-113','B · Platinum Rose (conditional)','Only if Mayfield is active; if OUT, swap in DEN@ARI Under 43.5 (-115, lean)'),('GB@DET','Jordan Love pass TD Over 1.5','-175','B prop','DET allowed 2.8 pass TD/g; Joseph OUT, Branch limited'),('GB@DET','Tucker Kraft anytime TD','+170','B prop','DET allowed 9 TE TDs in 5 g'),('KC@SEA','Patrick Mahomes pass TD Over 1.5','+150','B prop','Night leg; Rice out but KC offense #5 by EPA')],
    'Andy 8:54 PM: no PIT@NO legs. Two GB@DET props (BEO max two per game). Love TD and Kraft TD are positively correlated (same passing game). No legs shared with Hybrid A. Request the live BEO multi-game price.')]
for name,book,legs,note in P:
    d=1
    for l in legs: d*=dec(l[2])
    out+=[f"### {name} — {book} — **$10** — {amer(d)} (est.) — returns about ${10*d:,.0f}"]+table([leg(g,m,book,p,t,w) for g,m,p,t,w in legs])+[f'Flags: {note} Proposal only.','']
# ---------- DKP TD slips ----------
out+=['## 7e/8a. TD scorer slips (DK Predictions; contract prices before fees) — $10 each','']
atd=[('PIT@NO','Pat Freiermuth anytime TD','27%','B','PIT TE, 4 TD, scored in 3/6'),('TB@CAR','Tetairoa McMillan anytime TD','39%','B','CAR WR1; TB secondary HIGH vulnerability'),('NYG@HOU','Woody Marks anytime TD','51%','B','HOU lead back with Montgomery OUT'),('SF@ATL','George Kittle anytime TD','45%','B','ATL slot CB and LB out; TE seams'),('DEN@ARI','Trey McBride anytime TD','40%','B','Hufanga OUT opens the middle'),('GB@DET','Tucker Kraft anytime TD','36%','B','DET allowed 9 TE TDs in 5 g; Branch limited'),('KC@SEA','Kenneth Walker III anytime TD','54%','C','SNF night leg keeps the slip alive')]
pr=1
for l in atd: pr*=int(l[2].strip('%'))/100
out+=[f"### 7e Anytime TD 7-Leg — DKP — **$10** — ~{amer(1/pr)} (contract product, before fees) — returns about ${10/pr:,.0f} before fees"]+table([leg(g,m,'DKP',p,t,w) for g,m,p,t,w in atd])+['Flags: DK Predictions contract prices before fees; combo price must be quoted live. One leg per game, a night leg last. Proposal only.','']
ftd=[('NYG@HOU','Woody Marks first TD','17%','C','HOU lead back; DKP 17% (≈+488)'),('TB@CAR','Tetairoa McMillan first TD','10%','C','Synthesis 8a candidate'),('KC@SEA','Kenneth Walker III first TD','16%','C','SNF; card 8a candidate')]
pr=1
for l in ftd: pr*=int(l[2].strip('%'))/100
out+=[f"### 8a First TD 3-Leg — DKP — **$10** — ~{amer(1/pr)} (contract product, before fees) — returns about ${10/pr:,.0f} before fees"]+table([leg(g,m,'DKP',p,t,w) for g,m,p,t,w in ftd])+['Flags: highest-variance market; DKP contract product before fees. Proposal only.','']
open('scratch/w07_tickets.md','w',encoding='utf-8').write('\n'.join(out)+'\n')
print('\n'.join(l for l in out if l.startswith('### ')))
