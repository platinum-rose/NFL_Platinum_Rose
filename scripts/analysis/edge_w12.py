import pandas as pd, json, re
cols=['week','posteam','pass_attempt','rush_attempt','complete_pass','receiving_yards','rushing_yards','pass_touchdown','rush_touchdown','touchdown','td_player_name','receiver_player_name','rusher_player_name','passer_player_name','two_point_attempt','qb_scramble','passing_yards']
d=pd.read_csv('data/nflverse/2026/play_by_play_2026.csv.gz',usecols=lambda c:c in cols,low_memory=False)
d=d[(d.week<=11)&(d.two_point_attempt!=1)]
games={}  # player -> {week: stats}
def add(n,w,k,v,t=None):
    if not isinstance(n,str): return
    n=(t,n)
    games.setdefault(n,{}).setdefault(w,{}).setdefault(k,0); games[n][w][k]+=v
for r in d.itertuples():
    if r.pass_attempt==1:
        add(r.receiver_player_name,r.week,'tg',1,r.posteam)
        if r.complete_pass==1: add(r.receiver_player_name,r.week,'rec',1,r.posteam); add(r.receiver_player_name,r.week,'rec_yds',r.receiving_yards or 0,r.posteam)
        add(r.passer_player_name,r.week,'att',1,r.posteam)
        if r.complete_pass==1: add(r.passer_player_name,r.week,'cmp',1,r.posteam)
        add(r.passer_player_name,r.week,'pass_yds',r.passing_yards if r.passing_yards==r.passing_yards else 0,r.posteam)
        if r.pass_touchdown==1: add(r.passer_player_name,r.week,'pass_td',1,r.posteam)
    if r.rush_attempt==1:
        add(r.rusher_player_name,r.week,'carries',1,r.posteam); add(r.rusher_player_name,r.week,'rush_yds',r.rushing_yards or 0,r.posteam)
    if r.touchdown==1 and isinstance(r.td_player_name,str): add(r.td_player_name,r.week,'td',1,r.posteam)
# ensure TD key exists for players who played
def abbr(full):
    parts=full.replace('.','').split(); 
    if len(parts)<2: return full
    return parts[0][0]+'.'+' '.join(parts[1:]) if not full.startswith('Amon-Ra') else 'A.St. Brown'
MK={'rec':'rec','rec_yds':'rec_yds','rush_yds':'rush_yds','carries':'carries','pass_td':'pass_td','pass_yds':'pass_yds','atd_1_plus':'td'}
out=[]
for g in ['chi-at-det','phi-at-dal','kc-at-buf']:
    R=json.load(open(f'data/generated/props/draftkings-predictions-feed-2026-11-25-{g}.json'))['rows']
    for r in R:
        mk=MK.get(r['market']); p=r.get('player')
        if not mk or not p or r['american'] is None: continue
        if r['market']=='atd_1_plus' and r.get('side')!='Yes': continue
        lab=r['label']; 
        if lab.startswith('Under'): continue
        if mk=='td': thr=1
        elif lab.endswith('+'): thr=float(lab[:-1])
        elif lab.startswith('Over'): thr=float(r['line'])+0.5
        else: continue
        a=abbr(p); gl=games.get((r.get('team'),a))
        if not gl: continue
        wk=sorted(gl); n=len(wk)
        if n<4: continue
        vals=[gl[w].get(mk,0) for w in wk]; L5=vals[-5:]
        hit=sum(v>=thr for v in vals)/n; h5=sum(v>=thr for v in L5)/len(L5)
        pct=int(r['pct'].rstrip('%'))/100
        out.append((g,p,r['market'],lab,r['american'],pct,n,hit,h5,L5))
df=pd.DataFrame(out,columns=['g','player','mkt','line','am','imp','n','hit','hitL5','L5'])
df['edge']=((df.hit+df.hitL5)/2-df.imp)
df=df[(df.imp>=0.45)&(df.imp<=0.93)]
best=df.sort_values('edge',ascending=False).groupby(['player','mkt']).head(1).sort_values('edge',ascending=False)
pd.set_option('display.width',220); pd.set_option('display.max_rows',80)
print(best.head(40).to_string(index=False,formatters={'hit':'{:.0%}'.format,'hitL5':'{:.0%}'.format,'imp':'{:.0%}'.format,'edge':'{:+.0%}'.format}))
print('--- worst (fade candidates)'); print(df.sort_values('edge').head(10)[['g','player','mkt','line','am','imp','hit','hitL5','L5']].to_string(index=False))
print('--- specific checks')
q=['Colston Loveland','Javonte Williams','Jared Goff','Dak Prescott','Josh Allen','George Pickens','CeeDee Lamb','Jahmyr Gibbs','Amon-Ra St. Brown','Luther Burden','Emmett Johnson','Kenneth Walker','Dalton Kincaid']
x=pd.DataFrame(out,columns=['g','player','mkt','line','am','imp','n','hit','hitL5','L5'])
x=x[x.player.str.contains('|'.join(q))&(x.imp>=0.40)&(x.imp<=0.92)]
print(x.sort_values(['player','mkt','imp'],ascending=[True,True,False]).to_string(index=False,formatters={'hit':'{:.0%}'.format,'hitL5':'{:.0%}'.format,'imp':'{:.0%}'.format}))
