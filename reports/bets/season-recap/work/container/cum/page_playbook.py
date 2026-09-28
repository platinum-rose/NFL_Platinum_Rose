import json,html
P=json.load(open('pb_parts.json')); M=json.load(open('pb_metrics.json')); e=html.escape
css=P['css'].replace('</style>','.s-prof{fill:var(--hit)}\n</style>')
gs=M['gs']; S=M['S']; B=M['bands']
def gstr(k): w,n,r=gs[k]; return f'{w} of {n} ({r*100:+.0f}%)'
LEAN=[('Two-team round robins','3 of 4 cashed; $100 back on $88 (+14%). The only structure in profit.','Dog-ML RR every week; add the SuperContest 2-team RR you already planned.'),
('Underdogs on the moneyline','Dog MLs '+gstr('Dog moneylines')+' vs dog spreads '+gstr('Dog spreads')+'.','If you like a dog, take the ML (or the ML RR). No dog spreads in parlays.'),
('QB markets','Passing TDs 15 of 21 and QB INT thrown 8 of 12, both above break-even. 2+ TD on goal-line backs 4 of 5.','Anchor prop tickets on pass-TD overs and INT-yes for turnover-prone QBs.'),
('Props on the side you expect to win','Winning-team props '+gstr('Prop on the team that won')+'; losing-team props '+gstr('Prop on the team that lost')+'.','Match every prop to your side read. Don\'t stack an offense you fade.'),
('Short tickets for the best reads','All six paying tickets were 1–2 legs or 2-team RRs.','Put the week\'s top read on a 1–2 leg ticket, not inside an 8-leg stack.'),
('AI prop screens','AI-backed props '+gstr('AI-backed props (placed)')+'; AI props you didn\'t place hit 35 of 72.','Keep using the AI prop screens, but take the legs straight or in short tickets.')]
CUT=[('Long straight parlays','5+ legs: 58 tickets, $525, 0 cashed. The books\' own prices said about 1.5 of them should have hit.','Cap 5+ leg tickets at $5 and 4 per week. Every extra leg costs about 9 cents per dollar at our leg edge.'),
('4-team master round robin','3 tickets, $315, $0 back (Week 3 has one $18 combo alive tonight).','Cut to $35 (70 × $0.50) or skip until the side picks improve.'),
('Receptions and receiving-yards legs','Receptions 20 of 46 (needed 59%); receiving yards 23 of 47. Receptions are one of two strong-evidence leaks.','No reception legs as filler. Only true target leaders on the side you expect to win.'),
('Full-game Unders in parlays','9 of 22 overall; Week 3 went 1 for 8. Totals have landed far from projections every week.','Unders only as a standalone or 2-leg ticket with a clear weather or QB reason.'),
('First TD, sacks, QB rushing','First TD 1 of 8, sacks 4 of 13, QB rushing yards 3 of 8.','Drop these from stacks. A first-TD lottery ticket at $5 max, if any.'),
('AI side picks without a second source','AI-backed sides and totals '+gstr('AI-backed sides & totals (placed)')+'; your own sides '+gstr('Your own sides & totals')+'.','An AI side only goes on a ticket if an independent source or your own read agrees.')]
RULES=[('Leg price','−121 to −199 legs went 41 of 84 against ~59% needed. Plus-money +150 or longer is the only band in profit.','Avoid connector legs between −121 and −199. Prefer fewer, longer-priced legs.'),
('Leg count','At the season leg edge ($0.91 per $1 per leg), a 2-leg ticket returns about $0.83 and a 6-leg about $0.57.','Max 4 legs on anything over $5.'),
('Evidence bar','Only dog spreads and receptions clear a strong-evidence bar after 3 weeks. Everything else is thin or moderate.','Re-check these rules after Week 4 before sizing up any "lean in" item.')]
ALLOC=[('2-team round robins','Dog-ML RR (5–6 dogs, ML only) $25 · SuperContest 2-team RR $10','$35','$88 total over 3 weeks (≈$29/wk)'),
('1–2 leg tickets','Three tickets on the week\'s best side/total and QB markets, $15 each','$45','≈$90/wk incl. teaser'),
('SuperContest 5-team','Split-stake plan from Week 3','$15','$25/wk'),
('4-team master RR','Cut to 70 × $0.50, or skip','$35 or $0','$105/wk'),
('5+ leg parlays (props and game lines)','Max 4 × $5, built only from pass TDs, INT-yes, 2+ TD, rushing and ML legs','$20','≈$175/wk'),
('Island ladders (TNF PIT@CLE, SNF, MNF)','Per game: Tier 1 ≤4 legs $10 + one 2-leg SGP $10 + Tier 2/3 $5 each','$90','≈$100/wk (overlaps the rows above)')]
def plays(lst,cls,tag): return ''.join(f'<div class="play {cls}"><span class="tag2">{tag}</span><h3>{e(a)}</h3><p class="evid">{e(b)}</p><p>{e(c)}</p></div>' for a,b,c in lst)
alloc=''.join(f'<tr><td><b>{e(a)}</b></td><td>{e(b)}</td><td class="num">{e(c)}</td><td class="num">{e(d)}</td></tr>' for a,b,c,d in ALLOC)
srows=''.join(f'<tr><td>{e(k)}</td><td class="num">{v[0]}</td><td class="num">${v[1]:.2f}</td><td class="num">${v[2]:.2f}</td><td class="num">{v[3]}</td><td class="num">{(v[2]-v[1])/v[1]*100:+.0f}%</td></tr>' for k,v in S.items())
page=css+f'''
<div class="wrap">
<header class="top">
<span class="eyebrow">Platinum Rose · 2026 Weeks 1–3 cumulative · built Mon 9/28 before MNF</span>
<h1>Week 4 Betting Playbook</h1>
<p class="lede">Three weekly post-mortems combined: 95 tickets and 520 placed legs, every leg re-graded from ESPN box scores and priced at what was paid. The picks are close to break-even; the ticket structure is what is losing the money. Everything that paid was a 1–2 leg ticket or a 2-team round robin, and the long parlays turned a small per-leg deficit into a large one. Week 4 should move stake toward the few things that have worked and out of the structures that have not.</p>
<nav class="toc"><a href="#structure">Structure</a><a href="#cats">Categories</a><a href="#price">Price & script</a><a href="#playbook">Playbook</a><a href="#alloc">Week 4 stake</a><a href="#method">Method</a></nav>
</header>
<div class="kpis">
<div class="kpi"><span class="n">${M["staked"]:.2f}</span><span class="l">Cash staked, Weeks 1–3 (87 cash tickets)</span></div>
<div class="kpi"><span class="n">${M["ret"]:.2f}</span><span class="l">Returned by 6 paying tickets</span></div>
<div class="kpi"><span class="n neg">−${M["staked"]-M["ret"]:.2f}</span><span class="l">Net before MNF (master RR combo worth $18.24 still alive)</span></div>
<div class="kpi"><span class="n">{M["hit"]*100:.1f}%</span><span class="l">Leg hit rate on {M["npr"]} priced positions, against {M["be"]*100:.1f}% needed</span></div>
<div class="kpi"><span class="n">0 / 58</span><span class="l">Straight parlays of 5+ legs that cashed</span></div>
</div>

<section id="structure"><span class="eyebrow">Finding 1 · structure</span><h2>How we bet matters more than what we bet</h2>
<p class="sub">Legs hit {M["hit"]*100:.1f}% against {M["be"]*100:.1f}% needed, which is a 9% leak per leg. That is roughly a normal house edge. Parlays multiply it: each added leg keeps about ${M["ratio"]:.2f} of every dollar.</p>
<div class="panel"><h4>Staked vs returned by ticket structure</h4><div class="legend"><span><i style="background:var(--stake)"></i>Staked</span><span><i style="background:var(--ret)"></i>Returned</span><span><i style="background:var(--hit)"></i>Profit</span></div>{P["c_struct"]}</div>
<div class="two">
<div class="panel"><h4>Expected return per $1 by legs per ticket (season leg edge)</h4>{P["c_comp"]}</div>
</div>
<div class="panel"><table class="alloc"><thead><tr><th>Structure</th><th>Tickets</th><th>Staked</th><th>Returned</th><th>Cashed</th><th>ROI</th></tr></thead><tbody>{srows}</tbody></table></div>
</section>

<section id="cats"><span class="eyebrow">Finding 2 · leg categories</span><h2>Hit rate against break-even</h2>
<p class="sub">Each dot is the season hit rate for a leg type; the black tick is the break-even rate implied by the prices actually paid. Green means the category beat its price. Categories with fewer than 8 positions are left out. ROI can still be positive just below break-even when the hits came at long prices (anytime TDs, tackles).</p>
<div class="panel"><div class="legend"><span><i style="background:var(--hit);border-radius:50%"></i>Hit rate above break-even</span><span><i style="background:var(--miss);border-radius:50%"></i>Below break-even</span><span>▮ break-even</span></div>{P["c_cat"]}</div>
<div class="panel"><h4>Week by week (hit/positions) · evidence strength</h4><table class="heat"><thead><tr><th>Category</th><th>Wk 1</th><th>Wk 2</th><th>Wk 3</th><th>Season</th><th>Needed</th><th>Evidence</th></tr></thead><tbody>{P["heat"]}</tbody></table></div>
<div class="note-box">Evidence strength compares the hit rate with break-even for the sample size. "Strong" means about two standard errors away. Only dog spreads and receptions get there. QB interceptions are driven by Week 3 (7 of 8), and tackles faded from 3/3 to 1/5.</div>
</section>

<section id="price"><span class="eyebrow">Finding 3 · price, game script and who picked it</span><h2>Where the edge leaks</h2>
<div class="two">
<div class="panel"><h4>Flat ROI by leg price (as singles)</h4>{P["c_price"]}</div>
<div class="panel"><h4>Flat ROI by script and source</h4>{P["c_cuts"]}</div>
</div>
<div class="callouts">
<div class="callout"><b>Mid-juice legs leak most</b><p>−121 to −199 legs went {B["−150 to −121"][0]+B["−199 to −151"][0]} of {B["−150 to −121"][1]+B["−199 to −151"][1]}, about 17% below their price. They are the usual parlay connectors.</p></div>
<div class="callout"><b>AI sides vs AI props</b><p>AI-backed sides and totals hit {gs["AI-backed sides & totals (placed)"][0]} of {gs["AI-backed sides & totals (placed)"][1]}; AI-backed props hit {gs["AI-backed props (placed)"][0]} of {gs["AI-backed props (placed)"][1]} and were profitable at the prices paid.</p></div>
<div class="callout"><b>Pick the winner first</b><p>The same prop types hit {gs["Prop on the team that won"][0]/gs["Prop on the team that won"][1]*100:.0f}% on the winning team and {gs["Prop on the team that lost"][0]/gs["Prop on the team that lost"][1]*100:.0f}% on the losing team.</p></div>
</div>
</section>

<section id="playbook"><span class="eyebrow">Week 4</span><h2>The playbook</h2>
<div class="plays">{plays(LEAN,"lean","Lean in")}</div>
<div class="plays">{plays(CUT,"cut","Cut back")}</div>
<div class="plays">{plays(RULES,"rule","Ticket rules")}</div>
</section>

<section id="alloc"><span class="eyebrow">Proposed stake · your call</span><h2>Week 4 allocation</h2>
<p class="sub">A proposed mix, not a placement instruction. It keeps the SuperContest split and island-ladder templates, and moves money from long parlays and the master RR into 2-team RRs and short tickets. Total ≈$240, against a Weeks 1–3 average of $422.</p>
<div class="panel"><table class="alloc"><thead><tr><th>Bucket</th><th>What goes in it</th><th>Week 4</th><th>Weeks 1–3</th></tr></thead><tbody>{alloc}</tbody></table></div>
<div class="note-box">Prop round robins are off the table. No book offers them, and building every combination by hand costs too much time for a small return. The alternative is two or three hand-built 2-leg prop tickets drawn from the strongest markets.</div>
</section>

<section id="method"><span class="eyebrow">Method</span><h2>How this was built</h2>
<ul class="method">
<li>Sources: the Week 1–3 post-mortem datasets in <span class="mono">reports/bets/week3-recap/</span> and <span class="mono">reports/bets/season-recap/</span>, graded from ESPN box scores. Week 3 excludes MNF (7 legs pending).</li>
<li>Category, price and origin cuts count each unique position once per week. Break-even and flat ROI use the leg price when the ticket recorded one ({M["npr"]} positions). Unpriced legs (mostly BEO multi-leg parlays and Bovada) count toward hit rates only.</li>
<li>Returns: Week 1 $80.56, Week 2 $131.24 (Bookmaker-confirmed), Week 3 $39.21 (dog-ML RR estimate from ticket prices). Promo-credit and free-bet tickets are excluded from stake.</li>
<li>"AI-backed" means the placed leg matched a saved AI recommendation. Week 1 and Week 2 AI records are partial, so "your own" sides include legs built with Claude in-session that were never saved.</li>
<li>Three weeks is a small sample. Treat every "lean in" item as provisional and re-grade after Week 4.</li>
</ul>
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
open('week4-playbook.html','w').write(page); print(len(page))
