import json,re,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from grade import *
W=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..','data','official-picks','user-placed-wagers-2026.json')))
w3=[w for w in W if str(w.get('week'))==os.environ.get('WEEK','3')]
MK={'interceptions':'INT?','pass_interceptions':'int_thrown','completions':'completions','sacks':'sacks','receiving_yards':'rec_yds','rushing_yards':'rush_yds','receptions':'rec','touchdowns':'atd','first_touchdown':'first_td','passing_touchdowns':'pass_td','anytime_touchdown':'atd','anytime_td':'atd','tackles_assists':'tackles','pass_attempts':'pass_att','rush_attempts':'carries','passing_yards':'pass_yds','carries':'carries','passing_tds':'pass_td','interceptions_thrown':'int_thrown','pass_completions':'completions','field_goals_made':'fgm','kicking_points':'kicking_points','pass_attempts':'pass_att','rushing_receiving_yards':'rush_rec_yds','two_plus_touchdowns':'tds','first_touchdown_scorer':'first_td','touchdowns_2_plus':'tds','touchdowns_2plus':'tds','pass_cmp':'completions','kicker_points':'kicking_points','def_interceptions':'def_int'}  # 2026-11-04 crosscheck: W5/W7 2+ TD and completions aliases; 2026-11-03: added rush+rec, 2+ TD, first TD scorer
def thr_dir(sel,line):
    m=re.search(r'at least (\d+(?:\.\d+)?)',sel)
    if m: return float(m.group(1)),'over'
    m=re.search(r'(\d+(?:\.\d+)?)\+',sel)
    if m: return float(m.group(1)),'over'
    m=re.search(r'\b(Over|Under|More|Less|O|U)\s*(\d+(?:\.\d+)?)',sel,re.I)  # 2026-11-04: Pick6 More/Less and 'TOTAL u52' were read as overs
    if m: return float(m.group(2)),('under' if m.group(1).lower() in('under','u','less') else 'over')
    if line is not None: return float(line),'over'
    return None,'over'
def parse_leg(l):
    mk=l.get('market'); sel=l.get('selection') or ''
    if mk in ('sgp_spread','sgp_total','sgp_moneyline'): mk={'sgp_spread':'spread','sgp_total':'total','sgp_moneyline':'moneyline'}[mk]  # 2026-10-20: SGP legs previously fell through to the prop branch and graded L 'no box line'
    gm=l.get('game') or ''
    if mk=='open_slot': return None
    if '(CFB)' in gm: return dict(kind='cfb',label=sel,game=gm,fixed=l.get('status'))
    if mk in ('moneyline','spread','total','alternate_total_points','team_total'):
        if mk=='moneyline': return dict(kind='ml',team=team_of(sel),line=None,game=gm,label=sel)
        if mk=='spread':
            m=re.search(r'([+-]\d+(?:\.\d+)?)',sel); return dict(kind='spread',team=team_of(sel),line=float(m.group(1)),game=gm,label=sel)
        if mk=='team_total':
            m=re.search(r'(Under|Over)\s*(\d+(?:\.\d+)?)',sel); return dict(kind='team_total',team=team_of(sel),line=float(m.group(2)),dir=m.group(1).lower(),game=gm,label=sel)
        m=re.search(r'\b(Under|Over|u|o)\s*(\d+(?:\.\d+)?)',sel,re.I)  # 2026-11-04: BKR 'TOTAL u52 (...)' crashed the parser
        if m: return dict(kind='total',team=None,line=float(m.group(2)),dir='under' if m.group(1).lower() in ('under','u') else 'over',game=gm,label=sel)
        return dict(kind='total',team=None,line=float(l.get('line')),dir=(l.get('direction') or 'over').lower(),game=gm,label=sel)
    if mk in ('team_touchdowns','team_field_goals'):  # 2026-11-03
        t,d=thr_dir(sel,l.get('line'))
        return dict(kind='team_count',what='td' if mk=='team_touchdowns' else 'fg',team=team_of(sel) or l.get('team'),line=t,dir=d,game=gm,label=sel)
    if mk=='second_half_total':  # 2026-11-03
        t,d=thr_dir(sel,l.get('line'))
        return dict(kind='half_total',half=2,team=None,line=t,dir=d,game=gm,label=sel)
    if mk=='dst_touchdown':
        return dict(kind='dst_td',team=team_of(l.get('player') or sel) or l.get('team'),line=1,game=gm,label=sel)
    key=MK.get(mk)
    if key is None:  # 2026-10-20: W6 ledger legs use canonical keys (pass_yds, rec_yds, atd, ...) and rushing_attempts; MK only mapped the long names
        key={'rushing_attempts':'carries'}.get(mk, mk if mk in ('completions','pass_att','pass_yds','pass_td','int_thrown','rush_yds','carries','rec','rec_yds','sacks','tackles','def_int','kicking_points','fgm','atd','tds','first_td') else None)
    if key=='INT?':
        g2,pn,p=find_player(l.get('player') or sel, game_by_str(gm))
        key='int_thrown' if p and 'passing' in p else 'def_int'
    if key=='atd' and re.search(r'2\+\s*Touchdown',sel): pass
    t,d=thr_dir(sel,l.get('line'))
    if key=='atd' and not re.search(r'[2-9]\+',sel): t=1
    if key=='first_td': t=None
    if re.search(r'\b(under|less)\b',sel,re.I): d='under'
    if not gm and l.get('team'):
        gg=game_for_team(FIX.get(l['team'],l['team']))
        if gg: gm=f"{gg['away']} @ {gg['home']}"
    lab=sel if (l.get('player') and l['player'].split()[-1] in sel) else f"{l.get('player') or ''} {sel}".strip()
    return dict(kind='prop',player=l.get('player') or sel,key=key,thr=t,dir=d,game=gm,label=lab)
def grade_spec(s):
    if s['kind']=='cfb': return dict(result={'WON':'W','LOST':'L'}.get(s.get('fixed'),'pending'),actual='CFB (from ticket)',game=s['game'])
    if s['kind']=='prop': return grade_prop(s['player'],s['key'],s['thr'],s['dir'],s['game'] or None)
    k=s['kind']
    if k in ('team_count','half_total'):  # 2026-11-03
        g=game_by_str(s.get('game')) if s.get('game') else game_for_team(s.get('team'))
        if g is None: return dict(result='pending',actual=None)
        if k=='team_count':
            tm=FIX.get(s['team'],s['team']); kw='Touchdown' if s['what']=='td' else 'Field Goal'
            a=float(sum(1 for x in g['scoring'] if FIX.get(x.get('team'),x.get('team'))==tm and kw in x['type']))
            lab=f"{tm} {s['what'].upper()}s {a:g}"
        else:
            a=float(sum(num(v) for v in (g.get('away_ls') or [])[2:4])+sum(num(v) for v in (g.get('home_ls') or [])[2:4])); lab=f'2H total {a:g}'
        ln=s['line']
        if a==ln: r='P'
        else: r='W' if ((a>ln) if s['dir']!='under' else (a<ln)) else 'L'
        return dict(result=r,actual=lab,margin=(a-ln) if s['dir']!='under' else (ln-a),game=f"{g['away']}@{g['home']}")
    if k=='dst_td':
        g=game_by_str(s.get('game')) or game_for_team(s['team']); n=dst_tds(g,FIX.get(s['team'],s['team']))
        return dict(result='W' if n>=1 else 'L',actual=f"{s['team']} D/ST TD {n:g}",margin=n-1,game=f"{g['away']}@{g['home']}")
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
