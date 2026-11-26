import re,json,sys
ROOT=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','..','data','generated','props')
NM={'Green Bay Packers':'GB','Los Angeles Rams':'LAR','Chicago Bears':'CHI','Detroit Lions':'DET','Philadelphia Eagles':'PHI','Dallas Cowboys':'DAL','Kansas City Chiefs':'KC','Buffalo Bills':'BUF','Denver Broncos':'DEN','Pittsburgh Steelers':'PIT','New York Giants':'NYG','Indianapolis Colts':'IND','Baltimore Ravens':'BAL','Houston Texans':'HOU','Atlanta Falcons':'ATL','Minnesota Vikings':'MIN','New Orleans Saints':'NO','Cincinnati Bengals':'CIN','New York Jets':'NYJ','Miami Dolphins':'MIA','Tennessee Titans':'TEN','Jacksonville Jaguars':'JAX','New England Patriots':'NE','Los Angeles Chargers':'LAC','Washington Commanders':'WAS','Arizona Cardinals':'ARI','Seattle Seahawks':'SEA','San Francisco 49ers':'SF','Las Vegas Raiders':'LV','Cleveland Browns':'CLE','Carolina Panthers':'CAR','Tampa Bay Buccaneers':'TB'}
def bol(path):
    out={}; cur=None; lines=[]
    def flush():
        if not cur: return
        L=[x.strip() for x in lines if x.strip()]
        g={}
        for i in range(len(L)-14):
            if L[i]=='Spread' and L[i+1]=='Moneyline' and L[i+2]=='Total':
                a=L[i+3:i+15]
                try:
                    g=dict(away=NM.get(a[0],a[0]),away_sp=float(a[1]),away_sp_p=int(a[2]),away_ml=int(a[3]),over=float(a[4][2:]),over_p=int(a[5]),
                           home=NM.get(a[6],a[6]),home_sp=float(a[7]),home_sp_p=int(a[8]),home_ml=int(a[9]),under=float(a[10][2:]),under_p=int(a[11]))
                except Exception as e: g={'err':str(e),'raw':a}
                break
        props={}
        for i,x in enumerate(L):
            m=re.match(r'^(.+?) ([A-Z]{2,3}) (Receptions|Receiving Yards|Rushing Yards|Rushing Attempts|Passing Touchdowns|Passing Completions|Pass Completions|Passing Yards|Carries)$',x)
            if m and i+4<len(L):
                mo=re.match(r'^Over ([\d.]+)',L[i+1]); mu=re.match(r'^Under ([\d.]+)',L[i+3])
                if mo and mu:
                    try: props[(m.group(1),m.group(3))]=(float(mo.group(1)),int(L[i+2]),int(L[i+4]))
                    except: pass
        out[cur]=dict(lines=g,props={f'{k[0]}|{k[1]}':v for k,v in props.items()})
    for ln in open(path,encoding='utf-8',errors='ignore'):
        if ln.startswith('EVENT|'):
            flush(); ev=ln.split('|')[1]; aw,hm=ev.split(' @ '); cur=f'{NM[aw]}@{NM[hm]}'; lines=[]
        else: lines.append(ln)
    flush(); return out
if __name__=='__main__':
    B=bol(ROOT+'/betonline-live-2026-11-25-week12.pregate.raw.txt')
    pass
    for g,v in B.items(): print(g,v['lines'],len(v['props']))

DKN={'GB Packers':'GB','LA Rams':'LAR','CHI Bears':'CHI','DET Lions':'DET','PHI Eagles':'PHI','DAL Cowboys':'DAL','KC Chiefs':'KC','BUF Bills':'BUF','DEN Broncos':'DEN','PIT Steelers':'PIT','NYG Giants':'NYG','IND Colts':'IND','BAL Ravens':'BAL','HOU Texans':'HOU','ATL Falcons':'ATL','MIN Vikings':'MIN','NO Saints':'NO','CIN Bengals':'CIN','NY Jets':'NYJ','NYJ Jets':'NYJ','MIA Dolphins':'MIA','TEN Titans':'TEN','JAX Jaguars':'JAX','NE Patriots':'NE','LA Chargers':'LAC','WAS Commanders':'WAS','ARI Cardinals':'ARI','SEA Seahawks':'SEA','SF 49ers':'SF','LV Raiders':'LV','CLE Browns':'CLE','CAR Panthers':'CAR','TB Buccaneers':'TB'}
def dkp(path):
    L=[x.strip() for x in open(path,encoding='utf-8',errors='ignore') if x.strip()]
    end=L.index('SECTION_END|GAME_LINES') if 'SECTION_END|GAME_LINES' in L else len(L)
    out={}
    for i in range(1,end-16):
        if L[i]=='AT' and L[i+2:i+5]==['Spread','Total Points','To Win']:
            a=L[i+5:i+17]; pc=lambda s:int(s.rstrip('%'))
            try:
                g=f'{DKN[L[i-1]]}@{DKN[L[i+1]]}'
                if g in out: continue
                out[g]=dict(away_sp=float(a[0]),away_sp_c=pc(a[1]),over=float(a[3]),over_c=pc(a[4]),away_win_c=pc(a[5]),home_sp=float(a[6]),home_sp_c=pc(a[7]),under=float(a[9]),under_c=pc(a[10]),home_win_c=pc(a[11]))
            except Exception as e: pass
    return out
