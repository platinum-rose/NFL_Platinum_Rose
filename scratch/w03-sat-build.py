import itertools, math, json
def dec(a): return 1+a/100 if a>0 else 1+100/-a
def amer(d): return round((d-1)*100) if d>=2 else round(-100/(d-1))
# leg: (label, price, game, tier, kind, qb)  kind: ml|spread|total|prop ; dog spread flagged via 'dogpts'
L = {
 'TEN ML':('TEN ML',117,'TEN@NYG','1+2','ml','Ward'),
 'NYJ ML':('NYJ ML',234,'NYJ@DET','1+2','ml','G.Smith'),
 'IND ML':('IND ML',110,'HOU@IND','2','ml','D.Jones'),
 'CLE ML':('CLE ML',120,'CAR@CLE','2','ml','Watson'),
 'TB ML':('TB ML',102,'MIN@TB','2','ml','Mayfield'),
 'CIN ML':('CIN ML',-177,'CIN@PIT','1+2','ml','Burrow'),
 'CIN -3':('CIN -3',-117,'CIN@PIT','1+2','spread','Burrow'),
 'JAX ML':('JAX ML',-161,'NE@JAX','2','ml','Lawrence'),
 'BAL ML':('BAL ML',-181,'BAL@DAL','2 (Flowers flag)','ml','Lamar'),
 'SF -8.5':('SF -8.5',-103,'ARI@SF','1+2','spread','Purdy'),
 'LAR ML':('LAR ML',-125,'LAR@DEN','2 (Puka flag)','ml','Stafford'),
 'PHI ML':('PHI ML (MNF)',-180,'PHI@CHI','1+2','ml','Hurts'),
 'CARCLE U42.5':('CAR/CLE U42.5',-108,'CAR@CLE','2','total',None),
 'SEA -7.5':('SEA -7.5',-113,'SEA@WAS','2','spread','Darnold'),
 # props (BEO unless noted)
 'Schwesinger 9+':('Schwesinger 9+ T+A',-145,'CAR@CLE','1','prop',None),
 'Roquan 8+':('Roquan Smith 8+ T+A',-121,'BAL@DAL','1','prop',None),
 'Downs 7+':('Caleb Downs 7+ T+A',110,'BAL@DAL','1','prop',None),
 'DThomas 7+':('Drake Thomas 7+ T+A',-107,'SEA@WAS','1','prop',None),
 'Rodriguez 10+':('Jacob Rodriguez 10+ T+A',-173,'KC@MIA','1-','prop',None),
 'Burrow 2TD':('Burrow 2+ pass TD',-107,'CIN@PIT','1','prop','Burrow'),
 'Purdy 2TD':('Purdy 2+ pass TD',-164,'ARI@SF','1','prop','Purdy'),
 'Lawrence 2TD':('Lawrence 2+ pass TD',-109,'NE@JAX','1-','prop','Lawrence'),
 'Brown 54':('Chase Brown 54+ rush',-209,'CIN@PIT','1','prop','Burrow'),
 'Tuten 53':('Tuten 53+ rush',-114,'NE@JAX','1','prop','Lawrence'),
 'Price 42':('Jadarian Price 42+ rush',-213,'SEA@WAS','1','prop','Darnold'),
 'PWash 5':('Parker Washington 5+ rec',-170,'NE@JAX','1','prop','Lawrence'),
 'Lamar 34':('Lamar 34+ rush',-218,'BAL@DAL','1+2','prop','Lamar'),
 'CMC ATD':('McCaffrey ATD',-334,'ARI@SF','1','prop','Purdy'),
 'Corum 38':('Blake Corum 38+ rush (SNF)',-209,'LAR@DEN','1','prop','Stafford'),
 'Henry 80':('Derrick Henry 80+ rush',-186,'BAL@DAL','1-','prop','Lamar'),
 'Brown ATD':('Chase Brown ATD',-143,'CIN@PIT','1','prop','Burrow'),
 'Henry ATD':('Derrick Henry ATD',-251,'BAL@DAL','1','prop','Lamar'),
 'Kyren ATD':('Kyren Williams ATD (SNF)',-125,'LAR@DEN','2','prop','Stafford'),
 'JSN ATD':('Smith-Njigba ATD',-125,'SEA@WAS','1','prop','Darnold'),
 'Tuten ATD':('Tuten ATD',120,'NE@JAX','1','prop','Lawrence'),
 'Price ATD':('Jadarian Price ATD',120,'SEA@WAS','1','prop','Darnold'),
 'Chase ATD':("Ja'Marr Chase ATD",110,'CIN@PIT','1','prop','Burrow'),
 'CMC FTD':('McCaffrey 1st TD',270,'ARI@SF','1','prop','Purdy'),
 'Henry FTD':('Henry 1st TD',350,'BAL@DAL','1','prop','Lamar'),
 'Brown FTD':('Chase Brown 1st TD',450,'CIN@PIT','1','prop','Burrow'),
 'CMC 2TD':('McCaffrey 2+ TD',150,'ARI@SF','1','prop','Purdy'),
 'Henry 2TD':('Henry 2+ TD',200,'BAL@DAL','1','prop','Lamar'),
 'Brown 2TD':('Chase Brown 2+ TD',350,'CIN@PIT','1','prop','Burrow'),
 # SNF island (BKR SGP, same game)
 'I1 LAR ML':('LAR ML',-125,'LAR@DEN','2','ml','Stafford'), 'I1 Kyren 44':('Kyren 44+ rush',-202,'LAR@DEN','1-','prop','Stafford'),
 'I1 Corum 37':('Corum 37+ rush',-211,'LAR@DEN','1','prop','Stafford'), 'I1 Ferg 4':('T.Ferguson 4+ rec',-164,'LAR@DEN','1-','prop','Stafford'),
 'I1 Adams 61':('D.Adams 61+ rec yds',-178,'LAR@DEN','1-','prop','Stafford'),
 'I2 Staf 2TD':('Stafford 2+ pass TD',100,'LAR@DEN','1-','prop','Stafford'), 'I2 Staf 239':('Stafford 239+ pass yds',-105,'LAR@DEN','1-','prop','Stafford'),
 'I2 Waddle 5':('Waddle 5+ rec',-146,'LAR@DEN','1-','prop','Nix'), 'I2 Nix 2TD':('Nix 2+ pass TD',143,'LAR@DEN','2','prop','Nix'),
 'I2 Sutton 37':('Sutton 37+ rec yds',-106,'LAR@DEN','1-','prop','Nix'),
 'I3 Nix 27r':('Nix 27+ rush',155,'LAR@DEN','2','prop','Nix'), 'I3 Engram ATD':('Engram ATD',343,'LAR@DEN','2','prop','Nix'),
 'I3 Higbee ATD':('Higbee ATD',318,'LAR@DEN','2','prop','Stafford'), 'I3 Harvey ATD':('RJ Harvey ATD',317,'LAR@DEN','2','prop','Nix'),
}
T = [
 ('Slot 2 Dog-ML 2-team RR','BKR','rr2',['TEN ML','NYJ ML','IND ML','CLE ML','TB ML'],2.0),
 ('Slot 1 Master RR (optional)','BKR','rr4',['CIN ML','JAX ML','BAL ML','SF -8.5','LAR ML','PHI ML','CARCLE U42.5','SEA -7.5'],1.0),
 ('Slot 3 Morning parlay','BKR','parlay',['JAX ML','CIN ML','SF -8.5','LAR ML'],20),
 ('Slot 4 Afternoon parlay','BKR','parlay',['BAL ML','SEA -7.5','CARCLE U42.5','LAR ML'],20),
 ('Slot 5 Hybrid','BKR','parlay',['TEN ML','CIN -3','SF -8.5','PHI ML'],20),
 ('Prop RR (T+A / pass TD)','BEO','rr2',['Schwesinger 9+','Roquan 8+','Burrow 2TD','DThomas 7+','Purdy 2TD'],2.0),
 ('7a Morning prop stack','BEO','parlay',['Brown 54','Tuten 53','Price 42','Rodriguez 10+','PWash 5'],5),
 ('7b Afternoon prop stack','BEO','parlay',['Lamar 34','Downs 7+','CMC ATD'],5),
 ('7d Hybrid 8-leg (= Prop RR by-2s-and-5s straight + 3)','BEO','parlay',['Schwesinger 9+','Roquan 8+','Burrow 2TD','Tuten 53','DThomas 7+','Purdy 2TD','Downs 7+','Corum 38'],10),
 ('7e Anytime TD 7-leg','BEO','parlay',['Brown ATD','Henry ATD','Kyren ATD','JSN ATD','Tuten ATD','Price ATD','Chase ATD'],5),
 ('8a First TD 3-leg','BEO','parlay',['CMC FTD','Henry FTD','Brown FTD'],5),
 ('8b 2+ TD 3-leg','BEO','parlay',['CMC 2TD','Henry 2TD','Brown 2TD'],5),
 ('Island SNF Tier 1','BKR SGP','parlay',['I1 LAR ML','I1 Kyren 44','I1 Corum 37','I1 Ferg 4','I1 Adams 61'],10),
 ('Island SNF Tier 2','BKR SGP','parlay',['I2 Staf 2TD','I2 Staf 239','I2 Waddle 5','I2 Nix 2TD','I2 Sutton 37'],5),
 ('Island SNF Tier 3','BKR SGP','parlay',['I3 Nix 27r','I3 Engram ATD','I3 Higbee ATD','I3 Harvey ATD'],5),
]
out=[]; tot=0
for name,book,kind,keys,stake in T:
    legs=[L[k] for k in keys]
    flags=[]
    conn=[l[0] for l in legs if -120<=l[1]<=-100 and not any(t in l[3] for t in ('1','2'))]
    if conn: flags.append('connector w/o tier1-2: '+', '.join(conn))
    chalk=[l[0] for l in legs if l[4]=='ml' and l[1]<=-290]
    if chalk: flags.append('ML<=-290: '+', '.join(chalk))
    short=[l for l in legs if l[1]<-200]
    if len(short)>2: flags.append(f'{len(short)} legs < -200')
    if any(l[1]<-350 for l in legs): flags.append('past -350 barrier')
    games={}
    for l in legs: games[l[2]]=games.get(l[2],0)+1
    over=[g for g,n in games.items() if n>2]
    if over and 'SGP' not in book: flags.append('>2 legs in '+','.join(over))
    qbs={}
    for l in legs:
        if l[5]: qbs[l[5]]=qbs.get(l[5],0)+1
    qshared=[f'{q}x{n}' for q,n in qbs.items() if n>1]
    if kind=='parlay':
        d=math.prod(dec(l[1]) for l in legs); price=amer(d); cost=stake; win=round(stake*(d-1),2)
        line=f"{price:+d} naive" + (" (SGP will price lower)" if 'SGP' in book else ''); ret=f"${stake} wins ${win}"
    else:
        k=2 if kind=='rr2' else 4
        combos=list(itertools.combinations(legs,k)); cost=round(stake*len(combos),2)
        pays=[stake*math.prod(dec(x[1]) for x in c) for c in combos]
        line=f"{len(combos)} combos × ${stake}"
        # returns if exactly h legs hit (average over subsets)
        n=len(legs); rets=[]
        for h in range(k,n+1):
            vals=[]
            for hit in itertools.combinations(range(n),h):
                vals.append(sum(stake*math.prod(dec(legs[i][1]) for i in c) for c in itertools.combinations(hit,k)))
            rets.append(f"{h} hit ${sum(vals)/len(vals):.0f}")
        ret='returns: '+', '.join(rets)
    tot+=cost
    out.append((name,book,cost,line,ret,legs,flags,qshared))
for name,book,cost,line,ret,legs,flags,qs in out:
    print(f"\n## {name} — {book} — ${cost} — {line} — {ret}")
    for l in legs: print(f"   {l[2]:9} {l[0]:30} {l[1]:+5d}  tier {l[3]}")
    print('   FLAGS:',('; '.join(flags) or 'none'),'| QB-shared:',(', '.join(qs) or 'none'))
print('\nTOTAL STAKE $',round(tot,2))

WHY={'TEN ML':'Secondary HIGH (TEN O vs NYG D); Even Money + SoS TEN; Winston for NYG','NYJ ML':'Secondary HIGH (NYJ O vs DET D); AN + SoS NYJ; BettingPros DET -6.5 dissents','IND ML':'SoS + BettingPros IND; Nico Collins OUT; 68% spread money IND','CLE ML':'BettingPros + SoS CLE; 48% money / 22% tickets','TB ML':'AN + SoS + Favorites TB; BettingPros MIN dissents',
'CIN ML':'BettingPros + SoS CIN -3.5, PFF; CIN O vs PIT D med','CIN -3':'same as CIN ML; -117 is a tier 1+2 connector','JAX ML':'BettingPros + SoS JAX','BAL ML':'AN + SoS BAL; Flowers pulled from BKR props — verify','SF -8.5':'Secondary HIGH (SF O vs ARI D); Anderson + BettingPros','LAR ML':'BettingPros + Gibbs LAR; Puka DOUBTFUL; 56% spread money DEN','PHI ML':'Secondary HIGH; Caleb OUT; Gibbs + Welsh; line -4.5→-3 after Goedert/H.Brown OUT','CARCLE U42.5':'Even Money + BettingPros','SEA -7.5':'BettingPros + SoS SEA; Mariota for WAS; WAS O vs SEA D HIGH counter',
'Schwesinger 9+':'10, 10 tackles wk1-2','Roquan 8+':'11, 8','Downs 7+':'8, 9; BAL/DAL 53 total = most snaps','DThomas 7+':'9, 7','Rodriguez 10+':'14, 8 (1 of 2); KC should dominate snaps','Burrow 2TD':'CIN O vs PIT D med; expected winner (1, 2 TD wk1-2)','Purdy 2TD':'3, 2 TD; SF O vs ARI D HIGH','Brown 54':'56, 80 yds; 16, 20 carries','Tuten 53':'66, 65 yds','Price 42':'52, 52 yds; SEA -7.5 script','PWash 5':'5, 7 rec on 6, 12 targets','Lamar 34':'40, 34 rush yds; Warren Sharp o38.5','CMC ATD':'SF O vs ARI D HIGH; -334 chalk','Corum 38':'54, 79 yds (SNF night leg)','Brown ATD':'lead back, CIN expected winner','Henry ATD':'BAL expected winner, goal line','Kyren ATD':'SNF night leg','JSN ATD':'SEA expected winner','Tuten ATD':'lead back','Price ATD':'lead back','Chase ATD':'WR1','CMC FTD':'','Henry FTD':'','Brown FTD':'','CMC 2TD':'','Henry 2TD':'','Brown 2TD':'',
}
def band(a): return '+' if a>0 else ('-100..-120' if a>=-120 else ('-121..-200' if a>=-200 else '-201..-350'))
md=[]
for name,book,cost,line,ret,legs,flags,qs in out:
    md.append(f"### {name} — {book} — **${cost}** — {line} — {ret}")
    md.append('| game | market & line | book | price | band | tier | side expected to win? | QB exposure | availability | why |'); md.append('|---|---|---|---|---|---|---|---|---|---|')
    keys=[k for k,v in L.items() if v in legs]
    for l in legs:
        k=next(k for k,v in L.items() if v==l)
        md.append(f"| {l[2]} | {l[0]} | {book} | {l[1]:+d} | {band(l[1])} | {l[3]} | yes | {l[5] or '—'} | FREE | {WHY.get(k,'')} |")
    md.append(f"Flags: {'; '.join(flags) or 'none'} · QB-shared: {', '.join(qs) or 'none'}"); md.append('')
open('scratch/w03-sat-card-tables.md','w').write('\n'.join(md))
print('TOTAL', round(tot,2))
