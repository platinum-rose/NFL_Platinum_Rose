"""Week 8 Friday fair lines: market (Action Network consensus, Fri 10/30 ~3:40 PM PT) shrunk 35% toward an SRS/scoring baseline.
Not a validated model; it supplies the simulator's marginAdj/totalAdj inputs. Run from repo root: python3 reports/intel/w08-model/fair_lines.py"""
import csv, json, subprocess, statistics as st
from collections import defaultdict
W=0.35; HFA=1.5
pr={r['team_abbr']:r['power_rating']['srs'] for r in json.load(open('data/generated/team-profiles/team-power-ratings-2026.json'))['rows']}
PF=defaultdict(list); PA=defaultdict(list); TOT=[]
A={'LA':'LAR','WSH':'WAS'}
for r in csv.DictReader(open('data/vault-seed/nflverse/games.csv')):
    if r['season']!='2026' or not r['home_score']: continue
    a,h=A.get(r['away_team'],r['away_team']),A.get(r['home_team'],r['home_team']); s_a,s_h=float(r['away_score']),float(r['home_score'])
    PF[a].append(s_a);PA[a].append(s_h);PF[h].append(s_h);PA[h].append(s_a);TOT.append(s_a+s_h)
lg=st.mean(TOT)/2
R=json.load(open('reports/engineering/week8-an-browser-pull-2026-10-30/raw.json'))
out=[]
for s in R['splits']:
    aw,hm=s[0],s[1]
    if s[4]=='complete': continue
    line,tot=float(s[5]),float(s[8])
    srs_fair=-(pr[hm]-pr[aw]+HFA)
    e_h=(st.mean(PF[hm])+st.mean(PA[aw]))/2; e_a=(st.mean(PF[aw])+st.mean(PA[hm]))/2
    tot_base=e_h+e_a
    fair_line=line+W*(srs_fair-line); fair_tot=tot+W*(tot_base-tot)
    madj=-(fair_line-line)  # home-positive
    tadj=fair_tot-tot
    j=json.loads(subprocess.run(['node','-e',f"import('./scripts/intel/margin-simulator.mjs').then(m=>{{const c=m.loadCalibration();console.log(JSON.stringify(m.analyzeGame({{homeLine:{line},total:{tot},marginAdj:{madj:.3f},totalAdj:{tadj:.3f}}},c)))}})"],capture_output=True,text=True,check=True).stdout)
    out.append(dict(game=f'{aw}@{hm}',home_line=line,total=tot,srs_fair=round(srs_fair,1),fair_line=round(fair_line,1),edge_pts=round(fair_line-line,1),
                    tot_base=round(tot_base,1),fair_total=round(fair_tot,1),tot_edge=round(fair_tot-tot,1),sim=j))
json.dump(out,open('reports/intel/w08-model/fair-lines-w08.json','w'),indent=1)
for o in out:
    print(o['game'],'line',o['home_line'],'srsfair',o['srs_fair'],'fair',o['fair_line'],'edge',o['edge_pts'],'| tot',o['total'],'base',o['tot_base'],'fair',o['fair_total'],'|',json.dumps(o['sim'])[:260])
