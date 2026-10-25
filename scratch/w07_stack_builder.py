"""Stage 2 of the Prop Stack Agent: assemble one-leg-per-game BEO stacks from scratch/w07-prop-agent/*.json."""
import json,glob,re
A={}
for fn in glob.glob('scratch/w07-prop-agent/*.json'):
    d=json.load(open(fn,encoding='utf-8')); A[d['game']]=d
def cands(g):
    d=A[g]; out=[d.get('best_leg'),d.get('best_non_td_leg'),d.get('best_contrarian_leg')]
    for v in (d.get('categories') or {}).values(): out+=v or []
    return [c for c in out if c]
def find(g,player_sub,market_sub):
    for c in cands(g):
        if player_sub.lower() in str(c.get('player','')).lower() and market_sub.lower() in str(c.get('market','')).lower(): return c
    raise SystemExit(f'not found {g} {player_sub} {market_sub}')
def dec(p):
    p=int(str(p).replace('+',''))
    return 1+(p/100 if p>0 else 100/-p)
def amer(d): return f"+{round((d-1)*100):,}" if d>=2 else f"{round(-100/(d-1))}"
LBL={'carries':'carries','rec_yds':'receiving yds','pass_yds':'passing yds','pass_td':'pass TD','pass_cmp':'completions','receptions':'receptions','rush_yds':'rushing yds',
     'team_fg_total':'team field goals','team_field_goals':'team field goals','team_fg_made':'team field goals','game_fg_total':'game field goals (total)','team_touchdowns':'team touchdowns',
     'longest_rec':'longest reception','pass_int':'interceptions thrown','int_thrown':'interceptions thrown','interceptions_thrown':'interceptions thrown','sacks_taken':'sacks taken',
     'tackles_assists':'tackles + assists','tackles_ast':'tackles + assists','sacks':'sacks','atd':'anytime TD','kicker_fantasy_pts':'kicker fantasy points'}
TEAMNAME={'CLE':'Browns','NYJ':'Jets','MIN':'Vikings','NO':'Saints','SF':'49ers','LV':'Raiders','PHI':'Eagles','NYG':'Giants','DET':'Lions','CAR':'Panthers'}
def label(c,g):
    pl=str(c.get('player') or ''); mk=LBL.get(c.get('market'),c.get('market'))
    m=re.match(r'^([A-Z]{2,3}) team',pl)
    if m: pl=f"{TEAMNAME.get(m.group(1),m.group(1))}"
    pl=re.sub(r'\s*\((.*?)\)','',pl).replace('team field goals','').replace('Game total field goals','Game').replace(' team','').strip()
    if pl in ('DAL/PHI','GB/DET','LAR/LV','KC/SEA','IND/MIN','NYG/HOU kickers','CIN/BAL kickers','SF/ATL'): pl='Game'
    side=c.get('side') or ''; ln=c.get('line')
    if c.get('market') in ('game_fg_total','total_fg_made','total_field_goals'): return f"Total field goals, both teams {side} {ln}" 
    return f"{pl} {mk} {side} {'' if ln is None or mk=='anytime TD' else ln}".replace('  ',' ').strip()
def why(c):
    ev=c.get('evidence') or []
    t=(ev[0].get('text') if ev and isinstance(ev[0],dict) else (ev[0] if ev else '')) or ''
    return re.sub(r'\s+',' ',str(t)).replace('|','/')[:170]
def price(c):
    bp=c.get('best_price'); bk=c.get('book')
    if bp in (None,'None') or not c.get('executable'): return None,'no market'
    s=str(bp); s=s if s.startswith(('+','-')) else ('+'+s if int(s)>0 else s)
    return s,str(bk)
def ticket(name,legs,note):
    rows=[];d=1;p=1;priced=True;n_heavy=0
    for g,c in legs:
        pr,bk=price(c); p*=float(c.get('p_hit') or 0)
        if pr: d*=dec(pr); n_heavy+= dec(pr)<1.5
        else: priced=False
        rows.append(f"| {g} | {label(c,g)} | {('BEO' if bk=='BEO' else (bk+' ref; confirm at BEO') if pr else 'price at recapture')} | {pr or 'no market'} | p {c.get('p_hit')} | {why(c)} |")
    head=(f"### {name} — BEO — **$10** — {amer(d)} (est.) — returns about ${10*d:,.0f}; book-implied 1 in {round(d):,}, log-based estimate 1 in {round(1/p):,}" if priced
          else f"### {name} — BEO — **$10** — pending markets — log-based estimate 1 in {round(1/p):,}; price when the markets post")
    flags=f"Flags: {note}" + (f" {n_heavy} leg(s) shorter than -200." if n_heavy else '') + ' One leg per game; prices are BEO where captured, otherwise BKR/DKP references: confirm each leg on the BEO slip. Proposal only.'
    return [head,'| Game | Market & line | Book | Price | Tier | Why |','|---|---|---|---|---|---|']+rows+[flags,'']
T=[]
best=[(g,A[g]['best_leg']) for g in ['PIT@NO','SF@ATL','CLE@TEN','IND@MIN','MIA@NYJ','TB@CAR','CIN@BAL','NYG@HOU','DEN@ARI','GB@DET','LAR@LV','KC@SEA','DAL@PHI']]
T+=ticket('Perfect Lottery 13-Leg (best leg from every game)',best,'Best risk-adjusted leg from each of the 13 games (Prop Stack Agent v1). Includes the Monday DAL@PHI leg, so the ticket stays live through MNF.')
core=[('PIT@NO',find('PIT@NO','Metcalf','longest')),('IND@MIN',find('IND@MIN','Aaron Jones','carries')),('MIA@NYJ',find('MIA@NYJ','NYJ','team_touchdowns')),('TB@CAR',find('TB@CAR','Bryce Young','pass_yds')),
      ('CLE@TEN',find('CLE@TEN','CLE team','team_fg')),('NYG@HOU',find('NYG@HOU','Schultz','receptions')),('KC@SEA',find('KC@SEA','Darnold','pass_int'))]
T+=ticket('Core 7-Leg (highest hit rates, no leg shorter than -200)',core,'Highest-probability legs with no heavy (<-200) price; Darnold INT is the night leg.')
fg=[('CLE@TEN',find('CLE@TEN','CLE team','team_fg')),('MIA@NYJ',find('MIA@NYJ','NYJ','team_field_goals')),('IND@MIN',find('IND@MIN','MIN','team_field')),('PIT@NO',find('PIT@NO','NO team','team_fg')),
    ('SF@ATL',find('SF@ATL','SF team','team_fg')),('LAR@LV',find('LAR@LV','Raiders','team_fg')),('NYG@HOU',find('NYG@HOU','NYG','team_fg'))]
T+=ticket('Field-Goal Ticket 7-Leg (red-zone stalls vs wind and TD-heavy scripts)',fg,'Overs where drives stall (CLE, NYJ, MIN, LV, NYG); Unders where wind (Paris) or TD-heavy scripts (SF) cut kicks. The Jets angle: they have zero red-zone TDs in three games but only 2.0 FG/g, so NYJ team TDs Under 2.5 (BEO -150) is the stronger way to play it as a single.')
pres=[('KC@SEA',find('KC@SEA','Darnold','pass_int')),('PIT@NO',find('PIT@NO','Rodgers','pass_int')),('MIA@NYJ',find('MIA@NYJ','Willis','sacks')),('CIN@BAL',find('CIN@BAL','Huntley','sacks_taken')),
      ('IND@MIN',find('IND@MIN','Daniel Jones','interceptions')),('DEN@ARI',find('DEN@ARI','Brissett','int_thrown')),('NYG@HOU',find('NYG@HOU','McCarthy','sacks_taken')),('TB@CAR',find('TB@CAR','Mayfield','sacks'))]
T+=ticket('QB Pressure Ticket 8-Leg (INTs and sacks taken)',pres,'QB-under-pressure angle: turnover-prone or heavily sacked QBs against blitz/pass-rush defenses (box-score sacks taken per game, opponent sacks generated, INT rates). Only the two INT legs have a captured BEO price; the sacks/INT legs marked "no market" need BEO to post them. Mayfield leg only if he is active.')
idp=[('IND@MIN',find('IND@MIN','Davis-Gaither','tackles')),('LAR@LV',find('LAR@LV','Lake','tackles')),('PIT@NO',find('PIT@NO','Brisker','tackles')),('MIA@NYJ',find('MIA@NYJ','Rodriguez','tackles')),
     ('TB@CAR',find('TB@CAR','Trotter','tackles')),('CLE@TEN',find('CLE@TEN','Hill','tackles')),('DAL@PHI',find('DAL@PHI','DeJean','tackles'))]
T+=ticket('IDP Tackles Ticket 7-Leg (tackles + assists)',idp,'Tackles + assists has been the best prop category of the season (+22%). Lines are projected from the box-score logs because no book has posted IDP markets yet; take only lines at or below the projected number.')
a7=[('PIT@NO',find('PIT@NO','Metcalf','longest')),('SF@ATL',find('SF@ATL','Game total','game_fg')),('IND@MIN',find('IND@MIN','Aaron Jones','carries')),('MIA@NYJ',find('MIA@NYJ','NYJ','team_touchdowns')),
    ('TB@CAR',find('TB@CAR','Bryce Young','pass_yds')),('NYG@HOU',find('NYG@HOU','Schultz','receptions'))]
T+=ticket('7a Morning 6-Leg (early window)',a7,'All six legs settle in the 6:30/10:00 AM window.')
b7=[('DEN@ARI',find('DEN@ARI','Brissett','pass_cmp')),('GB@DET',find('GB@DET','Love','pass_td')),('LAR@LV',find('LAR@LV','Cousins','pass_td')),('KC@SEA',find('KC@SEA','Darnold','pass_int'))]
T+=ticket('7b Afternoon 4-Leg (night leg last)',b7,'Afternoon legs with the SNF Darnold INT leg resolving last.')
md=['## 7h. Prop Stack Agent tickets — BEO cross-game, one leg per game (Sat 10:15 PM PT)','',
 'Built by the new Prop Stack Agent (`agents/dev/PROP_STACK_AGENT.md`): four analysts scored every game in every category (QB passing, **QB pressure: INTs and sacks taken**, RB, WR, TE, **kicking / team field goals**, **IDP tackles + assists, sacks, INTs**, anytime and first TD) from 2026 box-score logs, the per-game syntheses, dossiers and captured boards (`scratch/w07-prop-agent/*.json`). Stacks take one leg per game so the legs are independent. **Book: BEO (BetOnline)**, Andy\'s cross-game prop book. BEO prices are shown where our capture had them; other legs use BKR/DKP reference prices or say "no market": confirm every leg on the BEO slip. Tier = the hit probability of each leg, estimated from its 2026 game logs (five or six games per player). Small samples run optimistic, so the log-based ticket odds overstate the true chance; the book-implied odds are the market view, with vig.','']+T
open('scratch/w07_stacks.md','w',encoding='utf-8').write('\n'.join(md)+'\n')
print('\n'.join(l for l in md if l.startswith('### ')))
