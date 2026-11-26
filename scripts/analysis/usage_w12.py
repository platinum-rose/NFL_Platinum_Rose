import pandas as pd, numpy as np, sys
cols=['game_id','week','posteam','defteam','play_type','pass_attempt','rush_attempt','complete_pass','yards_gained','receiving_yards','rushing_yards','passing_yards','touchdown','pass_touchdown','rush_touchdown','receiver_player_name','rusher_player_name','passer_player_name','interception','two_point_attempt','qb_scramble']
d=pd.read_csv('data/nflverse/2026/play_by_play_2026.csv.gz',usecols=lambda c:c in cols,low_memory=False)
d=d[(d.week<=11)&(d.two_point_attempt!=1)]
teams=sys.argv[1].split(',')
d=d[d.posteam.isin(teams)]
tgt=d[d.pass_attempt==1].dropna(subset=['receiver_player_name'])
rec=tgt.groupby(['posteam','receiver_player_name','week']).agg(tg=('pass_attempt','size'),rec=('complete_pass','sum'),yds=('receiving_yards','sum'),td=('pass_touchdown','sum')).reset_index()
ru=d[(d.rush_attempt==1)&(d.qb_scramble!=1)].dropna(subset=['rusher_player_name'])
rus=ru.groupby(['posteam','rusher_player_name','week']).agg(car=('rush_attempt','size'),ryd=('rushing_yards','sum'),rtd=('rush_touchdown','sum')).reset_index()
tw=d[d.pass_attempt==1].groupby(['posteam','week']).size().rename('team_att').reset_index()
rec=rec.merge(tw,on=['posteam','week'])
def show(df,name,cols,n,extra):
    for (t,p),g in df.groupby(['posteam',name]):
        if len(g)<3 or g[cols[0]].sum()<n: continue
        g=g.sort_values('week'); L5=g.tail(5)
        ex=extra(g)
        print(f"{t} {p:15s} G{len(g):2d} {ex} | "+" | ".join(f"{c} {g[c].mean():.1f}/L5 {L5[c].mean():.1f} [{','.join(str(int(v)) for v in L5[c])}]" for c in cols))
print('=== RECEIVING  season avg / L5 avg [last 5 games]')
show(rec,'receiver_player_name',['tg','rec','yds'],15,lambda g:f"shr {100*g.tg.sum()/g.team_att.sum():.0f}%/L5 {100*g.tail(5).tg.sum()/g.tail(5).team_att.sum():.0f}% TD{int(g.td.sum())}")
print('=== RUSHING')
show(rus,'rusher_player_name',['car','ryd'],20,lambda g:f"TD{int(g.rtd.sum())}")
