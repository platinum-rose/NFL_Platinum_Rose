import json,urllib.request,concurrent.futures as cf,sys
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30))
ids=[]
for w in range(1,9):
    s=get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week={w}&seasontype=2&dates=2026")
    ids+=[e['id'] for e in s['events'] if e['status']['type']['completed']]
logs={}
KEY={'passing':{'YDS':'passingYards','C/ATT':'cmp'},'rushing':{'YDS':'rushingYards'},'receiving':{'YDS':'receivingYards','REC':'receptions'}}
def one(eid):
    out=[]
    d=get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={eid}")
    for tm in d.get('boxscore',{}).get('players',[]):
        for cat in tm.get('statistics',[]):
            if cat['name'] not in KEY: continue
            labels=cat.get('labels',[])
            for a in cat.get('athletes',[]):
                rec={}
                for lab,val in zip(labels,a.get('stats',[])):
                    k=KEY[cat['name']].get(lab)
                    if not k: continue
                    if k=='cmp': rec['completions']=float(val.split('/')[0])
                    else:
                        try: rec[k]=float(val)
                        except: pass
                out.append((a['athlete']['id'],eid,rec))
    return out
with cf.ThreadPoolExecutor(8) as ex:
    for o in ex.map(one,ids):
        for aid,eid,rec in o: logs.setdefault(aid,{}).setdefault(eid,{}).update(rec)
json.dump(logs,open('logs.json','w'))
print(len(ids),'games',len(logs),'athletes')
