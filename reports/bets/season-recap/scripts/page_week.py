import json,sys,importlib,html
WK=sys.argv[1]; CFG=importlib.import_module(f'cfg_w{WK}'); T=CFG.TEXT
P=json.load(open(f'parts_w{WK}.json')); M=json.load(open(f'metrics_w{WK}.json'))
css=open('css_part.txt').read().replace('{{','{').replace('}}','}').replace('<title>Week 3 Post-Mortem</title>',f'<title>Week {WK} Post-Mortem</title>')
css=css.replace('</style>','''.season{width:100%;border-collapse:collapse;font:13px var(--body);min-width:520px}
.season th{text-align:right;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 10px}
.season th:first-child,.season td:first-child{text-align:left}
.season td{text-align:right;padding:7px 10px;border-bottom:1px solid var(--rule);font-variant-numeric:tabular-nums}
.season tr.cur td{font-weight:600;background:var(--bg)} .neg{color:var(--miss)}
.srcs{display:inline-flex;flex-wrap:wrap;gap:4px;margin-left:6px}.src{font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--ink2);border:1px solid var(--rule);border-radius:3px;padding:1px 5px;text-decoration:none}.src:hover{color:var(--ink);border-color:var(--ink2)}
.note-box{border-left:3px solid var(--o3);padding:8px 12px;background:var(--paper);font-size:13.5px;color:var(--ink2);max-width:80ch}
</style>''')
o=M['org']
def pct(t): return round(100*t[0]/t[1]) if t[1] else 0
SEASON=[('1',370.77,80.56,63,136,''),('2',428.79,131.24,107,211,''),('3',466.55,39.21,74,165,'MNF pending')]
srows=''.join(f'<tr class="{"cur" if w==WK else ""}"><td>Week {w}{(" · "+n) if n else ""}</td><td>${s:.2f}</td><td>${r:.2f}</td><td class="neg">−${s-r:.2f}</td><td>{hw}/{hn} · {round(100*hw/hn)}%</td></tr>' for w,s,r,hw,hn,n in SEASON)
tot_s=sum(x[1] for x in SEASON); tot_r=sum(x[2] for x in SEASON)
srows+=f'<tr><td><b>Season</b></td><td><b>${tot_s:.2f}</b></td><td><b>${tot_r:.2f}</b></td><td class="neg"><b>−${tot_s-tot_r:.2f}</b></td><td><b>{sum(x[3] for x in SEASON)}/{sum(x[4] for x in SEASON)}</b></td></tr>'
L=CFG.ORIGIN_LABELS
import re
def _ev(m):
    x=m.group(1); fm=''
    mm=re.match(r'^(.*?):([+]?\.\d+f)$',x)
    if mm: x,fm=mm.group(1),mm.group(2)
    v=eval(x,{'M':M,'o':o,'pct':pct})
    return format(v,fm) if fm else str(v)
def fill(s): return re.sub(r'\{([^{}]+)\}',_ev,s)
kpis=''.join(f'<div class="kpi"><span class="n{" neg" if neg else ""}">{n}</span><span class="l">{l}</span></div>' for n,l,neg in T['kpis'])
callouts=lambda lst: ''.join(f'<div class="callout"><b>{fill(b)}</b><p>{fill(t)}</p></div>' for b,t in lst)
page=css+f'''
<div class="wrap">
<header class="top">
<span class="eyebrow">{T["eyebrow"]}</span>
<h1>Week {WK} Post-Mortem</h1>
<p class="lede">{fill(T["lede"])}</p>
<nav class="toc"><a href="#money">Money</a><a href="#scripts">Projections</a><a href="#cats">Leg categories</a><a href="#ai">AI vs Andy</a><a href="#close">Closest tickets</a><a href="#games">Game recaps</a><a href="#method">Method</a></nav>
</header>
<div class="kpis">{kpis}</div>

<section id="money"><span class="eyebrow">Where the money went</span><h2>Stake by ticket family</h2>
<p class="sub">{fill(T["money_sub"])}</p>
<div class="panel"><div class="legend"><span><i style="background:var(--stake)"></i>Staked</span><span><i style="background:var(--ret)"></i>Returned</span></div>{P["c_pnl"]}</div>
<div class="panel"><h4>Season to date (cash tickets)</h4><table class="season"><thead><tr><th>Week</th><th>Staked</th><th>Returned</th><th>Net</th><th>Placed legs hit</th></tr></thead><tbody>{srows}</tbody></table></div>
</section>

<section id="scripts"><span class="eyebrow">Where the reads broke</span><h2>Projected vs final</h2>
<p class="sub">{fill(T["proj_sub"])}</p>
<div class="two">
<div class="panel"><h4>Game total</h4><div class="legend"><span><i style="background:var(--paper);border:2px solid var(--proj)"></i>{T["proj_name"]}</span><span><i style="background:var(--ret)"></i>Final</span></div>{P["c_tot"]}</div>
<div class="panel"><h4>Home margin (right = home team won by more)</h4><div class="legend"><span><i style="background:var(--paper);border:2px solid var(--proj)"></i>{T["proj_name"]}</span><span><i style="background:var(--ret)"></i>Final</span></div>{P["c_mar"]}</div>
</div>
<div class="callouts">{callouts(T["proj_callouts"])}</div>
</section>

<section id="cats"><span class="eyebrow">Leg scorecard</span><h2>Hit rate by category</h2>
<p class="sub">{fill(T["cats_sub"])}</p>
<div class="two">
<div class="panel"><h4>Player props</h4><div class="legend"><span><i style="background:var(--hit)"></i>Hit ✓</span><span><i style="background:var(--miss)"></i>Missed ✗</span></div>{P["c_cat_p"]}</div>
<div class="panel"><h4>Sides &amp; totals</h4><div class="legend"><span><i style="background:var(--hit)"></i>Hit ✓</span><span><i style="background:var(--miss)"></i>Missed ✗</span></div>{P["c_cat_s"]}</div>
</div>
</section>

<section id="ai"><span class="eyebrow">AI recommendations vs Andy's calls</span><h2>Who was right</h2>
<p class="sub">{fill(T["ai_sub"])}</p>
<div class="note-box">{fill(T["ai_note"])}</div>
<div class="panel"><div class="legend"><span><i style="background:var(--o1)"></i>{L[0][1]}</span><span><i style="background:var(--o2)"></i>{L[1][1]}</span><span><i style="background:var(--o3)"></i>{L[2][1]}</span><span>dashed line = 50%</span></div>{P["c_org"]}</div>
<div class="callouts">{callouts(T["ai_callouts"])}</div>
<div class="panel"><table class="div"><thead><tr><th>Type</th><th>Where</th><th>AI proposed</th><th>Placed</th><th>Outcome</th><th>Edge</th></tr></thead><tbody>{P["div_rows"]}</tbody></table></div>
</section>

<section id="close"><span class="eyebrow">Closest to cashing</span><h2>One leg away</h2>
<p class="sub">{fill(T["close_sub"])}</p>
<div class="tcards">{P["close_html"]}</div>
<details><summary>Two legs away ({P["two_html"].count('class="tcard"')} tickets)</summary><div class="tcards">{P["two_html"]}</div></details>
<h4 style="margin:10px 0 0;font:600 13px var(--body);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)">Near misses by the number</h4>
<ul class="nm">{P["nm_html"]}</ul>
</section>

<section id="games"><span class="eyebrow">Game by game</span><h2>Recaps</h2>
<p class="sub">{T["games_sub"]}</p>
<div class="games">{P["games_html"]}</div>
</section>

<section id="method"><span class="eyebrow">Method and data notes</span><h2>How this was graded</h2>
<ul class="method">{"".join("<li>"+fill(x)+"</li>" for x in T["method"])}</ul>
</section>
</div>
<div id="tip" role="tooltip"></div>
<script>
(function(){{var t=document.getElementById('tip');
function show(e){{var el=e.target.closest&&e.target.closest('[data-tip]');if(!el){{t.style.opacity=0;return}}t.textContent=el.getAttribute('data-tip');t.style.opacity=1;
var x=e.clientX+14,y=e.clientY+14;var r=t.getBoundingClientRect();if(x+r.width>innerWidth-8)x=e.clientX-r.width-14;if(y+r.height>innerHeight-8)y=e.clientY-r.height-14;t.style.left=x+'px';t.style.top=y+'px'}}
document.addEventListener('mousemove',show);document.addEventListener('mouseleave',function(){{t.style.opacity=0}});
document.addEventListener('touchstart',function(e){{if(e.touches[0])show({{target:e.target,clientX:e.touches[0].clientX,clientY:e.touches[0].clientY}})}},{{passive:true}});}})();
</script>'''
open(f'week{WK}-post-mortem.html','w').write(page); print(len(page))
