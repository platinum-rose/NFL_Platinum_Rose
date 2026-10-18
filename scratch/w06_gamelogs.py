import json,glob,collections,sys
logs=collections.defaultdict(list)
for f in sorted(glob.glob('data/fantasy/boxscores/espn-*.json')):
    d=json.load(open(f))
    h=d.get('header',{})
    comp=(h.get('competitions') or [{}])[0]
    date=comp.get('date','')[:10]
    season=h.get('season',{}).get('year'); stype=h.get('season',{}).get('type')
    if season!=2026 or stype!=2: continue
    wk=h.get('week')
    for t in d['boxscore'].get('players',[]):
        ab=t['team']['abbreviation']
        for cat in t.get('statistics',[]):
            name=cat['name']; keys=cat.get('keys') or cat.get('names') or []
            for a in cat.get('athletes',[]):
                p=a['athlete']['displayName']; st=dict(zip(keys,a['stats']))
                r=logs[(p,ab)]
                rec=next((x for x in r if x['date']==date),None)
                if not rec: rec={'date':date,'wk':wk}; r.append(rec)
                if name=='receiving': rec['rec']=float(st.get('receptions',0)); rec['recYds']=float(st.get('receivingYards',0)); rec['recTD']=float(st.get('receivingTouchdowns',0)); rec['tgt']=float(st.get('receivingTargets',0))
                if name=='rushing': rec['car']=float(st.get('rushingAttempts',0)); rec['rushYds']=float(st.get('rushingYards',0)); rec['rushTD']=float(st.get('rushingTouchdowns',0))
                if name=='passing': rec['passYds']=float(st.get('passingYards',0)); rec['passTD']=float(st.get('passingTouchdowns',0)); rec['cmp']=float(str(st.get('completions/passingAttempts','0/0')).split('/')[0])
out={f"{p}|{t}":v for (p,t),v in logs.items()}
json.dump(out,open('scratch/w06_gamelogs_2026.json','w'))
print(len(out),'players; games sample', sorted({x['wk'] for v in out.values() for x in v}))
