# Read-only independent audit of the 9 proposed exacta additions (Claude, 2026-09-22).
import json,re
F='futures-imports/'
circa=json.load(open(F+'circa-2026-09-22-live-futures-markets.json'))['marketSnapshots']['conference']
bkr=json.load(open(F+'bookmaker-2026-09-22-live-futures-markets.json'))['marketSnapshots']['conference']
beo=json.load(open(F+'betonline-2026-09-22-live-futures-markets.json'))['marketSnapshots']['conference']
pm=json.load(open('prediction-markets/latest.json'))['contracts']
def val(v):
    if isinstance(v,(int,float)): return v
    if isinstance(v,dict): return v.get('odds') or v.get('price') or v.get('american')
def ip(o): return 100/(o+100) if o>0 else -o/(-o+100)
def board(b,conf):
    raw={t:ip(val(v)) for t,v in b[conf].items() if val(v)}
    s=sum(raw.values()); return {t:p/s for t,p in raw.items()}, s
poly={}
for c in pm:
    m=re.match(r'Will (.+) win the 2027 NFL (AFC|NFC) Championship\?',c['title'])
    if m and c.get('price_cents') is not None: poly.setdefault(m.group(2),{})[m.group(1)]=c['price_cents']/100
fair={}
for conf in ('AFC','NFC'):
    books={}
    for name,b in (('circa',circa),('bkr',bkr),('beo',beo)):
        try: books[name],ov=board(b,conf); print(conf,name,'overround %.1f%%'%((ov-1)*100))
        except Exception as e: print(conf,name,'ERR',e)
    ps=poly.get(conf,{}); s=sum(ps.values()) or 1; books['poly']={t:p/s for t,p in ps.items()}
    print(conf,'poly sum %.2f n=%d'%(s,len(ps)))
    teams=set().union(*[set(v) for v in books.values()])
    fair[conf]={t:sum(b.get(t,0) for b in books.values() if t in b)/max(1,sum(1 for b in books.values() if t in b)) for t in teams}
    z=sum(fair[conf].values()); fair[conf]={t:p/z for t,p in fair[conf].items()}
def am(p): return round((1-p)/p*100) if p<0.5 else round(-p/(1-p)*100)
print('\nFAIR conference (consensus of 3 de-vigged books + Polymarket):')
for conf,teams in (('AFC',['Buffalo Bills','Baltimore Ravens','Kansas City Chiefs','New England Patriots','Cincinnati Bengals','Pittsburgh Steelers']),('NFC',['Green Bay Packers','Seattle Seahawks','Philadelphia Eagles','San Francisco 49ers','Dallas Cowboys','Detroit Lions','Los Angeles Rams'])):
    for t in teams: print(f"  {conf} {t:22} fair {fair[conf][t]*100:5.1f}%  (+{am(fair[conf][t])})  circa {val(circa[conf][t])}  poly {poly.get(conf,{}).get(t)}")
props=[('BAL','Baltimore Ravens','PHI','Philadelphia Eagles','Circa',4900,15),
('BAL','Baltimore Ravens','GB','Green Bay Packers','Circa',10525,10),
('NE','New England Patriots','SEA','Seattle Seahawks','Circa',7720,5),
('NE','New England Patriots','PHI','Philadelphia Eagles','Circa',9100,5),
('NE','New England Patriots','GB','Green Bay Packers','Circa',19450,5),
('BAL','Baltimore Ravens','SEA','Seattle Seahawks','Kalshi',4573,10),
('BAL','Baltimore Ravens','SF','San Francisco 49ers','Kalshi',4573,3.86),
('KC','Kansas City Chiefs','SEA','Seattle Seahawks','Kalshi',4573,17.5),
('BAL','Baltimore Ravens','DAL','Dallas Cowboys','Kalshi',9246,10)]
print('\nPROPOSALS: fair prob = pAFC x pNFC; EV per $1')
tot_ev=0
for a,A,n,N,book,price,stake in props:
    p=fair['AFC'][A]*fair['NFC'][N]; ev=p*(price/100)-(1-p); tot_ev+=ev*stake
    print(f"  {a}-{n:4} {book:6} +{price:<6} stake ${stake:<5} fair +{am(p):<6} EV/$ {ev:+.3f}  EV$ {ev*stake:+.2f}")
print('  total EV $%.2f on $%.2f'%(tot_ev,sum(x[6] for x in props)))
# Sensitivity: NE fair if Circa is the stale one vs the sharp one
ne=[('circa',ip(val(circa['AFC']['New England Patriots']))),('bkr',ip(val(bkr['AFC']['New England Patriots']))),('beo',ip(val(beo['AFC']['New England Patriots']))),('poly',poly.get('AFC',{}).get('New England Patriots'))]
print('\nNE AFC raw implied by source:',[(k,round(v*100,1) if v else None) for k,v in ne])
json.dump({'fair':fair},open('../scratch/claude-futures-fair-2026-09-22.json','w'),indent=1)
