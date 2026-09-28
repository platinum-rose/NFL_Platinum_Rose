import json
P=json.load(open('parts.json'))
cnt=P['cnt']; nB=P['nB']
cDEF=cnt["Sack / INT / tackle didn't happen"]; cVOL=cnt["Player didn't get the volume"]; cEFF=cnt['Volume there, production not']; mt=P['mt']; nm=P['nm']
css=P['css'].replace('</style>','.legend i.lg{border-radius:3px}\n</style>')
page=css+f'''
<div class="wrap">
<header class="top">
<span class="eyebrow">Platinum Rose · 2026 Week 3 · burnt-leg autopsy + expert scorecard (Weeks 1–3)</span>
<h1>Week 3 Burn Report</h1>
<p class="lede">Every Week 3 leg that lost ({nB} unique legs, placed and AI-recommended), sorted by the reason it lost, then a record for every Twitter and podcast handicapper whose picks landed in the intel feed. The short version: most burns were touchdowns scored by someone else, full-game results, and defensive events that never happened. Only 4 legs lost because a player had the volume but not the production. On the expert side, two Twitter handicappers stand out for us: Sal Bets and Joe Holka.</p>
<nav class="toc"><a href="#causes">Why legs burned</a><a href="#games">Game by game</a><a href="#experts">Prop handicappers</a><a href="#sides">Side pickers</a><a href="#use">What to do with it</a><a href="#method">Method</a></nav>
</header>
<div class="kpis">
<div class="kpi"><span class="n">{nB}</span><span class="l">Unique Week 3 legs that lost (MNF excluded)</span></div>
<div class="kpi"><span class="n">{cnt["TD went to someone else"]}</span><span class="l">Lost because someone else scored the TD</span></div>
<div class="kpi"><span class="n">{cDEF}</span><span class="l">Sack, INT or tackle legs that didn't happen</span></div>
<div class="kpi"><span class="n">{mt[0]}–{mt[1]}</span><span class="l">Our prop legs that matched an expert pick ({mt[0]/(mt[0]+mt[1])*100:.0f}%)</span></div>
<div class="kpi"><span class="n">{nm[0]}–{nm[1]}</span><span class="l">Our prop legs with no expert behind them ({nm[0]/(nm[0]+nm[1])*100:.0f}%)</span></div>
</div>

<section id="causes"><span class="eyebrow">Part 1 · Week 3</span><h2>Why the legs burned</h2>
<p class="sub">Each lost leg is classified from the box score: its player's targets and carries, the team's pass/run split and the score state. Volume legs are "didn't get the volume" when targets or carries fell short of what the line needed, and "production not" when the usage was there.</p>
<div class="panel"><h4>Burnt legs by cause</h4>{P["c_cause"]}</div>
<div class="panel"><h4>Burnt legs by game and cause</h4><div class="legend">{P["legend"]}</div>{P["c_games"]}</div>
<div class="callouts">
<div class="callout"><b>Two games, 39% of the burns</b><p>LAR@DEN and ATL@GB both flipped the script we built on. Every leg that needed the planned script lost together.</p></div>
<div class="callout"><b>Volume, not efficiency</b><p>{cVOL} legs lost because the player didn't get the ball (Jefferson 2 targets, T. Ferguson 2, Corum 6 carries). Only {cEFF} lost with the usage there.</p></div>
<div class="callout"><b>TD legs need the ball in the red zone</b><p>Adams (13 targets), London (194 yds), McBride (11 targets) and Warren (10 targets) all had the volume and no TD.</p></div>
</div>
</section>

<section id="games"><span class="eyebrow">Game by game</span><h2>What actually killed each game's legs</h2>
<p class="sub">Sorted by how many legs burned. Chips are the burnt legs, bordered by cause; hover for the cause.</p>
<div class="why">{P["wc"]}</div>
</section>

<section id="experts"><span class="eyebrow">Part 2 · Weeks 1–3</span><h2>Twitter prop handicappers</h2>
<p class="sub">Every player-prop pick in the Supabase intel feed from a Twitter/X source ({P["nprops"]} picks after collapsing ladders to one line per player and market; {P["wprops"]/P["nprops"]*100:.0f}% hit overall), plus the Week 3 YouTube picks. Each pick is assigned to the player's next game after the tweet and graded from ESPN box scores. Bars show a 90% range, so short records have wide bars.</p>
<div class="panel"><div class="legend"><span><i style="background:var(--hit);border-radius:50%"></i>Follow</span><span><i style="background:var(--o1);border-radius:50%"></i>Use as a screener</span><span><i style="background:var(--miss);border-radius:50%"></i>Fade / ignore</span><span><i style="background:var(--ink3);border-radius:50%"></i>Too thin to judge</span><span>dashed line = 50%</span></div>{P["c_exp"]}</div>
<div class="panel"><table class="xt"><thead><tr><th>Handicapper</th><th>Record</th><th>Games</th><th>Standard lines</th><th>Anytime TD</th><th>By week</th><th>When we tailed</th><th>Verdict</th></tr></thead><tbody>{P["xrows"]}</tbody></table></div>
<div class="note-box">"Standard lines" excludes alt lines set well below the player's average in his other games (more than 40% below), which hit far more often and pay far less. Hit rates here have no prices attached, so a 55% record on standard overs is roughly break-even at typical −115 to −120 juice, and anytime-TD records need about 40–45% at common prices.</div>
</section>

<section id="sides"><span class="eyebrow">Sides and totals</span><h2>Side pickers</h2>
<p class="sub">Spread, moneyline and total picks from Twitter, the podcast extractions and the Week 3 YouTube picks: {P["wsides"]} of {P["nsides"]} overall ({P["wsides"]/P["nsides"]*100:.0f}%). Nobody with a real sample clears 55% ATS.</p>
<div class="panel"><table class="xt" style="min-width:520px"><thead><tr><th>Source</th><th>Record</th><th>Hit</th><th>Weeks</th></tr></thead><tbody>{P["srows"]}</tbody></table></div>
</section>

<section id="use"><span class="eyebrow">For Week 4</span><h2>What to do with it</h2>
<div class="callouts">
<div class="callout"><b>Weight Sal Bets and Holka</b><p>Sal Bets is the only handicapper positive in all three weeks and the best tail for us (10–3). Holka is the best anytime-TD picker (11 of 19). Harry Lock is useful on standard lines.</p></div>
<div class="callout"><b>Read Dan's AI as a screener</b><p>Its "90% last 10" posts are alt lines far below average. Useful to confirm a role, not as a bet at those prices.</p></div>
<div class="callout"><b>Skip the TD lists</b><p>SharpieMatters' anytime-TD lists (15 of 52) and FirstTDBets (1 of 16) add nothing. Anytime-TD legs are our biggest burn cause already.</p></div>
<div class="callout"><b>Check the script before sack, tackle and volume legs</b><p>Sacks need opponent dropbacks, safety tackles need opponent passes, LB tackles need opponent runs, WR receptions need team pass volume. Tie each one to the side read.</p></div>
<div class="callout"><b>One read, one exposure</b><p>A side, its total and the players whose props depend on the same script are a single bet. Cap how many tickets one script can burn.</p></div>
<div class="callout"><b>Sides: no one to follow yet</b><p>No side picker has a real edge after three weeks. Your own sides (24 of 43 in the playbook) are still the best side source.</p></div>
</div>
</section>

<section id="method"><span class="eyebrow">Method</span><h2>How this was built</h2>
<ul class="method">
<li>Burnt legs: all Week 3 placed legs and unplaced AI legs that lost, deduplicated by leg and game, classified from ESPN box scores (targets, carries, team pass/run split, score state). MNF PHI@CHI is excluded.</li>
<li>Expert picks come from a read-only pull of <span class="mono">research_pick_signals</span> and expert <span class="mono">user_picks</span> (Supabase), plus <span class="mono">data/podcasts/youtube-extracted-picks-2026-w03.json</span>. Nothing was written back.</li>
<li>Each pick is matched to the player's or team's next game after the tweet time (from the tweet ID). Picks posted after kickoff are dropped. Ladders (the same player and market at several lines) count once, at the middle rung.</li>
<li>Coverage is uneven: the bookmark pipeline captured almost nothing in Week 1, so most records are Weeks 2–3. Some "touchdowns Over 0.5" picks were first-TD calls in the original tweet and are graded as anytime TDs, which flatters them.</li>
<li>"When we tailed" counts our placed prop legs (unique per week) that matched the handicapper's pick on the same player, market and direction.</li>
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
open('burn-report.html','w').write(page); print(len(page))
