import json,os,re,sys
sys.path.insert(0,os.path.expanduser('~/scratch'))
os.environ['WEEK']='3'
exec(open('experts.py').read().split("d=json.load(open(")[0])  # reuse helpers
Y=json.load(open(os.path.expanduser('~/mnt/dev/projects/NFL_Dashboard/data/podcasts/youtube-extracted-picks-2026-w03.json')))['picks']
import collections
t=dt.datetime(2026,9,26,tzinfo=dt.timezone.utc)
props=json.load(open('expert_props.json')); sides=json.load(open('expert_sides.json'))
MKY={'receptions':'receptions','receiving_yards':'receiving yards','rushing_yards':'rushing yards','passing_yards':'passing yards','anytime_td':'touchdowns','touchdowns':'touchdowns','first_td':'first td','passing_tds':'passing touchdowns','rush_attempts':'rush attempts','pass_attempts':'pass attempts'}
added=collections.Counter()
for p in Y:
    r=p['raw']; sp=p.get('speaker') or p.get('show')
    if r.get('player'):
        mk=MKY.get(r['market'],r['market'].replace('_',' '))
        g=grade_prop(r['player'],mk,f"{r['side']} {r['line']}",t)
        if not g or g['res'] in ('nogame','pending'): continue
        props.append(dict(h=sp,handle=sp,author=sp,bet_type='youtube',market=mk,lean=f"{r['side']} {r['line']}",tweet=p.get('timestamp_url'),**g)); added['p']+=1
    elif r.get('team') and r['market'] in ('spread','moneyline','total'):
        team=MODS[3].FIX.get(r['team'],r['team'])
        gm=[g for g in MODS[3].G if team in (g['away'],g['home'])]
        if not gm: continue
        g=gm[0]
        if g['home']=='CHI': continue
        a,h=int(g['away_score']),int(g['home_score']); mine,opp=(a,h) if team==g['away'] else (h,a)
        if r['market']=='total' and r['line'] is None: continue
        if r['market']=='total':
            tot=a+h; line=r['line']; dr='under' if r['side']=='UNDER' else 'over'; res='P' if tot==line else ('W' if (tot<line)==(dr=='under') else 'L'); lab=f"{g['away']}@{g['home']} {dr} {line}"
        elif r['market']=='moneyline' or r['line'] is None: res='W' if mine>opp else 'L'; lab=f'{team} ML'
        else:
            v=mine-opp+float(r['line']); res='W' if v>0 else ('P' if v==0 else 'L'); lab=f"{team} {float(r['line']):+g}"
        sides.append(dict(h=sp,week=3,label=lab,res=res,src='youtube',bet_type=r['market'])); added['s']+=1
json.dump(props,open('expert_props.json','w'),default=str,indent=0); json.dump(sides,open('expert_sides.json','w'),default=str,indent=0)
print(added, collections.Counter(p['speaker'] for p in Y))
