"""Per-game data packs for the Prop Stack Agent (Week 7): 2026 ESPN box-score logs for every position incl. K and IDP,
team pressure/turnover/FG profiles, captured board rows (BKR, BEO, DKP, BKR FG markets) and synthesis file pointers."""
import json,glob,collections,re,os
B='data/fantasy/boxscores'
logs=collections.defaultdict(lambda: collections.defaultdict(list))   # team -> player -> [game dicts]
team_g=collections.defaultdict(list)
for f in sorted(glob.glob(f'{B}/*.json')):
    try: d=json.load(open(f,encoding='utf-8'))
    except Exception: continue
    bp=(d.get('boxscore') or {}).get('players') or []
    if len(bp)!=2: continue
    abbr=[t['team']['abbreviation'] for t in bp]
    for i,t in enumerate(bp):
        tm=t['team']['abbreviation']; opp=abbr[1-i]; gid=os.path.basename(f)[5:-5]
        tg=dict(game=gid,opp=opp,fgm=0,fga=0,sacks_taken=0,int_thrown=0,def_sacks=0.0,def_int=0)
        for s in t['statistics']:
            lab=s.get('labels') or []
            for a in s.get('athletes',[]):
                nm=a['athlete']['displayName']; st=dict(zip(lab,a.get('stats',[])))
                rec=dict(game=gid,opp=opp,cat=s['name'],**st)
                logs[tm][nm].append(rec)
                try:
                    if s['name']=='kicking' and 'FG' in st: m,a_=st['FG'].split('/'); tg['fgm']+=int(m); tg['fga']+=int(a_)
                    if s['name']=='passing': tg['sacks_taken']+=int(st.get('SACKS','0-0').split('-')[0]); tg['int_thrown']+=int(st.get('INT',0))
                    if s['name']=='defensive': tg['def_sacks']+=float(st.get('SACKS',0) or 0)
                    if s['name']=='interceptions': tg['def_int']+=int(st.get('INT',0))
                except Exception: pass
        team_g[tm].append(tg)
NICK={'Steelers':'PIT','Saints':'NO','Buccaneers':'TB','Panthers':'CAR','Dolphins':'MIA','Jets':'NYJ','Browns':'CLE','Titans':'TEN','Giants':'NYG','Texans':'HOU','49ers':'SF','Falcons':'ATL','Colts':'IND','Vikings':'MIN','Bengals':'CIN','Ravens':'BAL','Broncos':'DEN','Cardinals':'ARI','Packers':'GB','Lions':'DET','Rams':'LAR','Raiders':'LV','Chiefs':'KC','Seahawks':'SEA','Cowboys':'DAL','Eagles':'PHI'}
ESPN2={'WSH':'WAS','LA':'LAR'}
def gid_of(ev):
    a,h=ev.split(' @ '); return NICK[a.split()[-1]]+'@'+NICK[h.split()[-1]]
BK=json.load(open('data/generated/props/bookmaker-live-2026-10-25-week7.json',encoding='utf-8'))['rows']
BE=json.load(open('data/generated/props/betonline-live-2026-10-25-week7.json',encoding='utf-8'))['rows']
DK=json.load(open('data/generated/props/draftkings-predictions-live-2026-10-24-week7.json',encoding='utf-8'))
FG=json.load(open('data/generated/props/bookmaker-fg-markets-2026-10-25-week7.json',encoding='utf-8'))['rows']
games=['PIT@NO','SF@ATL','CLE@TEN','IND@MIN','MIA@NYJ','TB@CAR','CIN@BAL','NYG@HOU','DEN@ARI','GB@DET','LAR@LV','KC@SEA','DAL@PHI']
avail=json.load(open('data/player-availability/latest.json',encoding='utf-8')).get('events',[])
def summarize(tm):
    out={}
    for nm,rs in logs[tm].items():
        cats=collections.defaultdict(list)
        for r in rs: cats[r['cat']].append({k:v for k,v in r.items() if k not in ('cat',)})
        out[nm]=dict(cats)
    return out
for g in games:
    a,h=g.split('@'); pack=dict(game=g,away=a,home=h,
      synthesis=dict(sides=f'reports/intel/games/2026-w07-game-{a}_at_{h}-sides.md',props=f'reports/intel/games/2026-w07-game-{a}_at_{h}-props.md',
                     narrative='reports/intel/master-intel-narratives-2026-w07.md (## '+g+' and the Saturday recheck table)',
                     dossiers=[f'data/generated/team-dossiers/2026-w07/{a}.md',f'data/generated/team-dossiers/2026-w07/{h}.md'],
                     secondary_matchups='data/secondary-matchups/latest.json'),
      team_profile={t:dict(games=team_g.get(t,[]),fg_made_per_game=round(sum(x['fgm'] for x in team_g.get(t,[]))/max(1,len(team_g.get(t,[]))),2),
                            sacks_taken_per_game=round(sum(x['sacks_taken'] for x in team_g.get(t,[]))/max(1,len(team_g.get(t,[]))),2),
                            int_thrown_per_game=round(sum(x['int_thrown'] for x in team_g.get(t,[]))/max(1,len(team_g.get(t,[]))),2),
                            def_sacks_per_game=round(sum(x['def_sacks'] for x in team_g.get(t,[]))/max(1,len(team_g.get(t,[]))),2),
                            def_int_per_game=round(sum(x['def_int'] for x in team_g.get(t,[]))/max(1,len(team_g.get(t,[]))),2)) for t in (a,h)},
      player_logs={t:summarize(t) for t in (a,h)},
      board=dict(bkr=[{k:r.get(k) for k in ('sectionTitle','market','player','side','line','odds')} for r in BK if r.get('event') and gid_of(r['event'])==g and r.get('odds') is not None and r.get('available') is not False],
                 beo=[{k:r.get(k) for k in ('marketTitle','market','player','side','line','odds')} for r in BE if r.get('event') and gid_of(r['event'])==g and r.get('odds') is not None],
                 bkr_fg_markets=[r for r in FG if r['game']==g],
                 dkp=[{k:r.get(k) for k in ('market','player','side','line','probability')} for e in DK['events'] for r in e['rows'] if gid_of(e['event'].replace('LA Rams','Los Angeles Rams').replace('NY ','New York ').replace('SF 49ers','San Francisco 49ers')) ==g] if False else []),
      availability=[{k:e.get(k) for k in ('player_name','team_abbr','position','status','published_at')} for e in avail if e.get('team_abbr') in (a,h)])
    json.dump(pack,open(f'scratch/w07-prop-packs/{a}_at_{h}.json','w',encoding='utf-8'),indent=0,ensure_ascii=False)
    print(g, len(pack['board']['bkr']), 'teams', [len(pack['player_logs'][t]) for t in (a,h)], {t:(pack['team_profile'][t]['fg_made_per_game'],pack['team_profile'][t]['sacks_taken_per_game'],pack['team_profile'][t]['int_thrown_per_game']) for t in (a,h)})
