import json,collections,re
QBRUSH={'Jordan Love','Tyler Shough','Lamar Jackson','Baker Mayfield','Jalen Hurts','Josh Allen','Brock Purdy','Drake Maye','Jaxson Dart','Malik Willis'}
def cat(l):
    k=l['kind']
    if k=='ml': return 'Moneyline'
    if k=='spread': return 'Spread (fav)' if (l['thr'] or 0)<0 else 'Spread (dog)'
    if k=='total': return 'Total Under' if l['dir']=='under' else 'Total Over'
    if k=='team_total': return 'Team total'
    if k=='cfb': return None
    key=l['key']
    if key=='atd' and (l['thr'] or 1)>=2: key='tds'
    if key=='rush_yds' and l['player'] in QBRUSH: return 'QB rushing yds'
    return {'rush_yds':'Rushing yds','carries':'Carries','rec':'Receptions','rec_yds':'Receiving yds','pass_td':'Passing TDs','pass_yds':'QB pass yds/att/comp','pass_att':'QB pass yds/att/comp','completions':'QB pass yds/att/comp','int_thrown':'QB INT thrown','sacks':'Sacks','tackles':'Tackles+Ast','def_int':'Defensive INT','atd':'Anytime TD','tds':'2+ TD','first_td':'First TD','fgm':'Kicker FGs'}[key]
def dec(p):
    try: p=float(str(p).replace('+',''))
    except: return None
    if p==0: return None
    return 1+p/100 if p>0 else 1+100/abs(p)
T=[];L=[]
for w in (1,2,3):
    C=json.load(open(f'cum_w{w}.json')); O=json.load(open(f'w{w}legs.json'))
    oi=iter(O['legs'])
    for t in C:
        for l in t['legs']:
            o=next(oi); assert o['kind']==l['kind'] and o['result']==l['result'],(o['label'],l['label'])
            l['origin']=o['origin']; l['week']=w; l['tid']=t['id']; l['cat']=cat(l); l['dec']=dec(l['price'])
            if w in (1,2) and o['origin']=='andy': l['origin']='unlogged'
            if l['label'] in ('Green Bay Packers -4','Los Angeles Rams +2'): l['origin']='andy'
            L.append(l)
        T.append(t)
FORCE=None
json.dump(dict(T=T,L=L),open('cum.json','w'),default=str)
print(len(T),len(L),collections.Counter(l['origin'] for l in L))
