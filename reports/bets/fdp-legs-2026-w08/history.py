import json,re
from collections import defaultdict
d=json.load(open('data/official-picks/user-placed-wagers-2026.json'))
rows=d if isinstance(d,list) else next(v for v in d.values() if isinstance(v,list))
norm={'anytime_touchdown':'ATD','anytime_td':'ATD','atd':'ATD','touchdowns':'ATD','touchdowns_2_plus':'2+ TD','first_touchdown':'1st TD','first_td':'1st TD','first_touchdown_scorer':'1st TD',
'spread':'spread','sgp_spread':'spread','moneyline':'ML','sgp_moneyline':'ML','total':'game total','sgp_total':'game total','alternate_total_points':'game total','team_total':'team total',
'receptions':'receptions','receiving_yards':'rec yds','rec_yds':'rec yds','rushing_yards':'rush yds','rush_yds':'rush yds','rushing_receiving_yards':'rush+rec yds',
'passing_yards':'pass yds','pass_yds':'pass yds','passing_touchdowns':'pass TDs','passing_tds':'pass TDs','pass_td':'pass TDs',
'pass_attempts':'pass att/cmp','pass_completions':'pass att/cmp','completions':'pass att/cmp','carries':'carries','rush_attempts':'carries','rushing_attempts':'carries',
'pass_interceptions':'QB INT','interceptions':'QB INT','interceptions_thrown':'QB INT','tackles_assists':'tackles','sacks':'sacks','field_goals_made':'FGs'}
def imp(p):
    try: p=float(str(p).replace('+',''))
    except: return None
    if p==0: return None
    return -p/(-p+100) if p<0 else 100/(p+100)
S=defaultdict(lambda:[0,0,0.0,0])  # won, n, sum implied, n_priced
B=defaultdict(lambda:[0,0,0.0,0])
for r in rows:
    for l in r.get('legs') or []:
        g=str(l.get('game') or r.get('game') or '')
        if 'CFB' in g or 'NCAA' in g: continue
        st=l.get('status')
        if st not in('WON','LOST'): continue
        m=norm.get(l.get('market'));
        if not m: continue
        w=st=='WON'; ip=imp(l.get('price'))
        for D,key in ((S,m),):
            D[key][0]+=w; D[key][1]+=1
            if ip: D[key][2]+=ip; D[key][3]+=1
        if ip:
            b='heavy fav (≤-300)' if ip>=0.75 else 'fav (-299..-150)' if ip>=0.6 else 'near even (-149..+149)' if ip>=0.4 else 'dog (+150..+399)' if ip>=0.2 else 'longshot (+400+)'
            B[(m,b)][0]+=w;B[(m,b)][1]+=1;B[(m,b)][2]+=ip;B[(m,b)][3]+=1
print(f"{'type':<14}{'n':>5}{'win%':>7}{'priced':>8}{'implied%':>9}{'edge':>7}")
for k,(w,n,si,np_) in sorted(S.items(),key=lambda x:-x[1][1]):
    im=si/np_ if np_ else None
    print(f"{k:<14}{n:>5}{w/n*100:>6.0f}%{np_:>8}{(im*100 if im else 0):>8.0f}%{((w/n-im)*100 if im else 0):>+6.0f}")
print("\nBy price bucket (priced legs only, n>=8):")
for (m,b),(w,n,si,np_) in sorted(B.items()):
    if n<8: continue
    print(f"{m:<14}{b:<24}{n:>4}  win {w/n*100:>3.0f}%  implied {si/np_*100:>3.0f}%  edge {(w/n-si/np_)*100:+.0f}")
