import json,re,collections
logs=json.load(open('scratch/w06_gamelogs_2026.json'))
def norm(n): return re.sub(r'[^a-z]','',re.sub(r'\b(jr|sr|ii|iii|iv)\b','',n.lower().replace('.','')))
idx={}
for k,v in logs.items():
    p,t=k.split('|'); idx.setdefault(norm(p),[]).append((t,v))
mk={'rec_yds':'recYds','rec':'rec','rush_yds':'rushYds','pass_yds':'passYds','pass_td':'passTD','carries':'car'}
cands=[]
def evaluate(book,rows):
    for r in rows:
        if not r.get('player') or r['market'] not in mk: continue
        if str(r.get('side')).lower()!='over' or r.get('line') is None or r.get('odds') is None: continue
        if r['odds']<-200: continue
        if any(g in (r.get('game') or r.get('event') or '') for g in ('Texans @ Jacksonville',)): continue
        c=idx.get(norm(r['player']))
        if not c: continue
        vals=[x.get(mk[r['market']]) for t,v in c for x in v if x.get(mk[r['market']]) is not None]
        # drop games where player had no stat entry (DNP) -> unknown; count games with the stat key
        if len(vals)<4: continue
        hit=sum(1 for x in vals if x>r['line']); n=len(vals)
        last3=vals[-3:]
        cands.append((hit/n,n,book,r['player'],r['market'],r['line'],r['odds'],(r.get('game') or r.get('event')),[int(x) if x==int(x) else x for x in vals[-5:]]))
b=json.load(open('data/generated/props/bookmaker-live-2026-10-17-week6.json')); evaluate('BKR',b['rows'])
e=json.load(open('data/generated/props/betonline-live-2026-10-18-week6.json')); evaluate('BEO',e['rows'])
cands.sort(key=lambda x:(-x[0],-x[1]))
seen=set()
for c in cands:
    key=(c[3],c[4],c[2])
    if key in seen or c[0]<0.8: continue
    seen.add(key); print(f"{c[0]:.0%} {c[1]}g | {c[2]} {c[3]} {c[4]} O{c[5]} {c[6]:+d} | {c[7].split(' @ ')[0][-10:]}@{c[7].split(' @ ')[-1][-10:]} | last5 {c[8]}")
