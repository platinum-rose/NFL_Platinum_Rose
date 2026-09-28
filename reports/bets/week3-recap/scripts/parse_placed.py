import json,re,sys,os
sys.path.insert(0,os.path.expanduser('~/scratch'))
from grade import *
W=json.load(open(os.path.expanduser('~/mnt/dev/projects/NFL_Dashboard/data/official-picks/user-placed-wagers-2026.json')))
w3=[w for w in W if str(w.get('week'))=='3']
MK={'interceptions':'INT?','pass_interceptions':'int_thrown','completions':'completions','sacks':'sacks','receiving_yards':'rec_yds','rushing_yards':'rush_yds','receptions':'rec','touchdowns':'atd','first_touchdown':'first_td','passing_touchdowns':'pass_td','anytime_touchdown':'atd','anytime_td':'atd','tackles_assists':'tackles','pass_attempts':'pass_att','rush_attempts':'carries','passing_yards':'pass_yds'}
def thr_dir(sel,line):
    m=re.search(r'(\d+(?:\.\d+)?)\+',sel)
    if m: return float(m.group(1)),'over'
    m=re.search(r'\b(Over|Under|O|U)\s*(\d+(?:\.\d+)?)',sel)
    if m: return float(m.group(2)),('under' if m.group(1) in('Under','U') else 'over')
    if line is not None: return float(line)+0.5 if float(line)==int(float(line)) else float(line),'over'
    return None,'over'
def parse_leg(l):
    mk=l.get('market'); sel=l.get('selection') or ''
    gm=l.get('game') or ''
    if mk=='open_slot': return None
    if mk in ('moneyline','spread','total','alternate_total_points','team_total'):
        if mk=='moneyline': return dict(kind='ml',team=team_of(sel),line=None,game=gm,label=sel)
        if mk=='spread':
            m=re.search(r'([+-]\d+(?:\.\d+)?)',sel); return dict(kind='spread',team=team_of(sel),line=float(m.group(1)),game=gm,label=sel)
        if mk=='team_total':
            m=re.search(r'(Under|Over)\s*(\d+(?:\.\d+)?)',sel); return dict(kind='team_total',team=team_of(sel),line=float(m.group(2)),dir=m.group(1).lower(),game=gm,label=sel)
        m=re.search(r'(Under|Over)\s*(\d+(?:\.\d+)?)',sel); return dict(kind='total',team=None,line=float(m.group(2)),dir=m.group(1).lower(),game=gm,label=sel)
    key=MK.get(mk)
    if key=='INT?':
        g2,pn,p=find_player(l.get('player') or sel, game_by_str(gm))
        key='int_thrown' if p and 'passing' in p else 'def_int'
    if key=='atd' and re.search(r'2\+\s*Touchdown',sel): pass
    t,d=thr_dir(sel,l.get('line'))
    if key=='atd' and t is None: t=1
    if key=='first_td': t=None
    if 'Under' in sel: d='under'
    return dict(kind='prop',player=l.get('player') or sel,key=key,thr=t,dir=d,game=gm,label=sel)
def grade_spec(s):
    if s['kind']=='prop': return grade_prop(s['player'],s['key'],s['thr'],s['dir'],s['game'] or None)
    k=s['kind']
    return grade_side(k,s.get('team'),s.get('line'),s.get('game') or None,s.get('dir'))
if __name__=='__main__':
    bad=0
    for w in w3:
        for l in w.get('legs') or []:
            sp=parse_leg(l)
            if not sp: continue
            r=grade_spec(sp)
            fs=l.get('status'); mine=r['result']
            flag='' if (fs=='WON' and mine=='W') or (fs=='LOST' and mine=='L') else '  <<'
            if flag: bad+=1
            print(f"{w['id'][-28:]:28} {fs:7} {mine:7} {sp.get('key',sp['kind']):10} {str(sp.get('thr',sp.get('line'))):6} {sp.get('dir',''):5} act={r.get('actual')} | {sp['label'][:55]}{flag}")
    print('diffs',bad)
