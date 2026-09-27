import json,glob,collections,sys
R=json.load(open('data/generated/props/beo-w03.json'))
H=collections.defaultdict(lambda: collections.defaultdict(list))
KEY={'rushing':{'rush_yds':1,'carries':0},'receiving':{'rec':0,'rec_yds':1},'passing':{}}
for f in sorted(glob.glob('data/fantasy/boxscores/espn-*.json')):
    d=json.load(open(f))
    for team in d['boxscore'].get('players',[]):
        for st in team['statistics']:
            lab=st.get('keys',[])
            for a in st['athletes']:
                n=a['athlete']['displayName']; v=dict(zip(lab,a['stats']))
                if st['name']=='rushing': H[n]['carries'].append(v.get('rushingAttempts')); H[n]['rush_yds'].append(v.get('rushingYards'))
                if st['name']=='receiving': H[n]['rec'].append(v.get('receptions')); H[n]['rec_yds'].append(v.get('receivingYards')); H[n]['tgt'].append(v.get('receivingTargets'))
                if st['name']=='passing': H[n]['pass_td'].append(v.get('passingTouchdowns')); H[n]['pass_yds'].append(v.get('passingYards'))
                if st['name']=='defensive': H[n]['tackles_assists'].append(v.get('totalTackles'))
games=sys.argv[1].split(',') if len(sys.argv)>1 else None
mk=sys.argv[2].split(',') if len(sys.argv)>2 else ['rush_yds','rec','carries']
by=collections.defaultdict(list)
for r in R:
    if r['market'] in mk and (not games or r['game'] in games): by[(r['game'],r['market'],r['player'],r['team'])].append((r['line'],r['odds']))
for (g,m,p,t),lad in sorted(by.items()):
    h=H.get(p,{}).get(m if m!='atd' else 'rec',[])
    # pick rungs in -250..+130
    rungs=[f"{l:g}:{o:+d}" for l,o in lad if -260<=o<=140][:3]
    if not rungs: continue
    extra='' if m not in('rec','rec_yds') else f" tgt{H.get(p,{}).get('tgt')}"
    print(g,m,p,'('+t.split()[-1]+')','| wk1-2',h,extra,'|',' '.join(rungs))
