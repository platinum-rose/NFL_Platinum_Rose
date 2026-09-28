import json,collections
D=json.load(open('cum.json')); T=D['T']; L=D['L']
G=[l for l in L if l['result'] in ('W','L') and l['cat']]
def uk(l): return (l['week'],l['kind'],(l['player'] or l.get('team') or ''),l['key'],l['dir'],str(l['thr']),l['game'])
U={}
for l in G: U.setdefault(uk(l),l)
UV=list(U.values())
def summ(v):
    n=len(v); w=sum(x['result']=='W' for x in v)
    pr=[x for x in v if x['dec']]
    be=sum(1/x['dec'] for x in pr)/len(pr) if pr else None
    roi=sum((x['dec']-1) if x['result']=='W' else -1 for x in pr)/len(pr) if pr else None
    return dict(n=n,w=w,hit=w/n if n else 0,npr=len(pr),be=be,roi=roi)
def show(title,groups,minn=1):
    print('\n##',title)
    for k,v in sorted(groups.items(),key=lambda kv:-(summ(kv[1])['roi'] or -9)):
        s=summ(v)
        if s['n']<minn: continue
        print(f"  {str(k):34} {s['w']:3}/{s['n']:<3} hit {s['hit']*100:4.0f}%  be {(s['be'] or 0)*100:4.0f}%  roi {(s['roi'] if s['roi'] is not None else float('nan'))*100:+5.0f}% (priced {s['npr']})")
g=collections.defaultdict(list)
for l in UV: g[l['cat']].append(l)
show('Category (unique, season)',g)
g=collections.defaultdict(list)
for l in UV: g[(l['cat'],l['week'])].append(l)
show('Category x week',g,3)
def band(d):
    if not d: return 'no price'
    p=(d-1)*100 if d>=2 else -100/(d-1)
    if p<=-200: return 'a) -200 or shorter'
    if p<=-151: return 'b) -199..-151'
    if p<=-121: return 'c) -150..-121'
    if p<=-100: return 'd) -120..-100'
    if p<150: return 'e) +100..+149'
    if p<300: return 'f) +150..+299'
    return 'g) +300 or longer'
g=collections.defaultdict(list)
for l in UV: g[band(l['dec'])].append(l)
show('Price band',g)
g=collections.defaultdict(list)
for l in UV:
    if l['kind']=='prop' and l['team_won'] is not None: g['prop on winning team' if l['team_won'] else 'prop on losing team'].append(l)
show('Game script',g)
g=collections.defaultdict(list)
for l in UV: g[(l['origin'],'prop' if l['kind']=='prop' else 'side')].append(l)
show('Origin',g)
g=collections.defaultdict(list)
DEF={'Sacks','Tackles+Ast','Defensive INT'}
for l in UV:
    if l['kind']=='prop': g['defensive' if l['cat'] in DEF else 'offensive'].append(l)
show('Def vs off',g)
g=collections.defaultdict(list)
for l in UV:
    if l['kind']=='prop' and l['dir']=='under': g['prop unders'].append(l)
    elif l['kind']=='prop': g['prop overs'].append(l)
show('Prop direction',g)
# book
g=collections.defaultdict(list)
tb={t['id']:t['book'] for t in T}
for l in UV: g[tb[l['tid']].replace('Bookmaker.eu','Bookmaker')].append(l)
show('Book',g)
json.dump([dict(l) for l in UV],open('uv.json','w'),default=str)
