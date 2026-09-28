import json
P=json.load(open('parts.json')); M=json.load(open('metrics.json'))
o=M['org']
def pct(t): return round(100*t[0]/t[1]) if t[1] else 0
page=f'''<title>Week 3 Post-Mortem</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root{{--bg:#f3f4f1;--paper:#fbfbf9;--ink:#15212e;--ink2:#4a5561;--ink3:#7b848c;--rule:#d9ddd6;--track:#e7e9e3;--accent:#1f5f46;
--hit:#0ca30c;--miss:#d03b3b;--stake:#b9c0c6;--ret:#2a78d6;--o1:#2a78d6;--o2:#eb6834;--o3:#1baf7a;--proj:#9aa3ab;
--disp:"Barlow Condensed","Arial Narrow",sans-serif;--body:"Public Sans",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#12171c;--paper:#182027;--ink:#eef1f3;--ink2:#b3bcc4;--ink3:#86909a;--rule:#2b353e;--track:#243039;--accent:#5fbf95;--stake:#4b5761;--ret:#3987e5;--o1:#3987e5;--o2:#d95926;--o3:#199e70;--proj:#6d7883}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#12171c;--paper:#182027;--ink:#eef1f3;--ink2:#b3bcc4;--ink3:#86909a;--rule:#2b353e;--track:#243039;--accent:#5fbf95;--stake:#4b5761;--ret:#3987e5;--o1:#3987e5;--o2:#d95926;--o3:#199e70;--proj:#6d7883}}
body{{background:var(--bg);color:var(--ink);font:15px/1.55 var(--body)}}
.wrap{{max-width:1080px;margin:0 auto;padding-inline:20px;padding-block:28px 60px}}
h1,h2,h3{{font-family:var(--disp);text-wrap:balance;margin:0;letter-spacing:.01em}}
h1{{font-size:clamp(40px,7vw,68px);line-height:.95;font-weight:700;text-transform:uppercase}}
h2{{font-size:30px;font-weight:600;text-transform:uppercase;margin-bottom:6px}}
.eyebrow{{font:600 12px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}}
.lede{{max-width:68ch;color:var(--ink2);font-size:16px}}
header.top{{display:grid;gap:14px;padding-bottom:22px;border-bottom:2px solid var(--ink)}}
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);margin-top:22px}}
.kpi{{background:var(--paper);padding:14px 16px;display:grid;gap:4px}}
.kpi .n{{font:600 30px/1 var(--disp);font-variant-numeric:tabular-nums}}
.kpi .n.neg{{color:var(--miss)}} .kpi .l{{font-size:12.5px;color:var(--ink2)}}
section{{margin-top:48px;display:grid;gap:14px}}
.sub{{color:var(--ink2);max-width:72ch;margin:0}}
.panel{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:18px 18px 12px;overflow-x:auto}}
.two{{display:grid;grid-template-columns:1fr;gap:16px}}
.panel h4{{margin:0 0 8px;font:600 13px/1.3 var(--body);color:var(--ink2);text-transform:uppercase;letter-spacing:.06em}}
.chart{{width:100%;max-width:900px;height:auto;display:block;min-width:520px}}
.chart text{{font:12px var(--body);fill:var(--ink2)}} .chart .val,.chart .tick{{font:11.5px var(--mono);fill:var(--ink2)}}
.chart .grp{{font:600 13px var(--body);fill:var(--ink)}}
.chart .grid{{stroke:var(--rule);stroke-width:1}} .chart .zero{{stroke:var(--ink3);stroke-dasharray:3 3}}
.s-hit{{fill:var(--hit)}} .s-miss{{fill:var(--miss)}} .s-stake{{fill:var(--stake)}} .s-ret{{fill:var(--ret)}} .track{{fill:var(--track)}}
.o-agree{{fill:var(--o1)}} .o-andy{{fill:var(--o2)}} .o-aionly{{fill:var(--o3)}}
.conn{{stroke:var(--ink3);stroke-width:2}} .dot-proj{{fill:var(--paper);stroke:var(--proj);stroke-width:2}} .dot-act{{fill:var(--ret);stroke:var(--paper);stroke-width:2}}
.chart [data-tip]{{cursor:default}} .chart rect[data-tip]:hover,.chart circle[data-tip]:hover{{opacity:.8}}
.legend{{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:var(--ink2);margin:4px 0 8px}}
.legend i{{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px;vertical-align:-1px}}
.callouts{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}}
.callout{{border-top:3px solid var(--ink);padding-top:10px}} .callout b{{font:600 22px var(--disp);display:block}} .callout p{{margin:4px 0 0;color:var(--ink2);font-size:14px}}
.tcards{{display:grid;gap:10px}}
.tcard{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:12px 14px}}
.thead{{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 12px;margin-bottom:8px}}
.tname{{font-weight:600}} .tag{{font:11.5px var(--mono);color:var(--ink2);border:1px solid var(--rule);border-radius:4px;padding:1px 6px}}
.tag-paper{{color:var(--o3);border-color:currentColor}} .score{{margin-left:auto;font:600 20px var(--disp);font-variant-numeric:tabular-nums}}
.pills{{display:flex;flex-wrap:wrap;gap:6px}}
.pill{{font-size:12.5px;border-radius:4px;padding:3px 8px;border:1px solid var(--rule);background:var(--bg);display:inline-flex;gap:6px;align-items:baseline}}
.pill b{{font-weight:700}} .pill i{{font:11px var(--mono);font-style:normal;color:var(--ink2)}}
.p-hit b{{color:var(--hit)}} .p-miss{{border-color:var(--miss)}} .p-miss b{{color:var(--miss)}} .p-pend b{{color:var(--ink3)}}
details{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:10px 14px}} summary{{cursor:pointer;font-weight:600}}
details .tcards{{margin-top:10px}}
table.div{{width:100%;border-collapse:collapse;font-size:13.5px;min-width:760px}}
table.div th{{text-align:left;font:600 11.5px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);border-bottom:2px solid var(--ink);padding:6px 8px}}
table.div td{{border-bottom:1px solid var(--rule);padding:8px;vertical-align:top}}
.mono{{font-family:var(--mono);font-size:12px}}
.verdict{{font:600 11.5px var(--mono);padding:2px 7px;border-radius:4px;white-space:nowrap;border:1px solid currentColor}}
.v-andy{{color:var(--o2)}} .v-ai{{color:var(--o1)}} .v-push{{color:var(--ink3)}}
ul.nm{{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:1px;background:var(--rule);border:1px solid var(--rule)}}
ul.nm li{{background:var(--paper);padding:10px 12px;display:grid;gap:2px}} ul.nm span{{color:var(--ink2);font-size:13.5px}}
.games{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,470px),1fr));gap:16px}}
.game{{background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:16px;display:grid;gap:10px;align-content:start}}
.game header{{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}}
.game h3{{font-size:26px;font-weight:700}} .game h3 span{{color:var(--ink3);font-weight:500}}
.kick{{font:11.5px var(--mono);color:var(--ink2)}}
table.ls{{border-collapse:collapse;font:12.5px var(--mono);font-variant-numeric:tabular-nums}}
table.ls th{{color:var(--ink3);font-weight:400;padding:2px 8px;text-align:center}} table.ls td{{padding:2px 8px;text-align:center;border-top:1px solid var(--rule)}}
table.ls td:first-child{{text-align:left;font-weight:600}} table.ls .fin{{font-weight:600}} table.ls tr.win td{{color:var(--ink)}} table.ls tr:not(.win) td{{color:var(--ink2)}}
.game dl{{margin:0;display:grid;gap:8px}} .game dt{{font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--accent)}} .game dd{{margin:2px 0 0;font-size:14px}}
.total{{color:var(--ink3);font-family:var(--mono);font-size:12px}}
.gstats{{display:flex;flex-wrap:wrap;gap:4px 16px;font:12px var(--mono);color:var(--ink2)}}
.game footer{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-top:1px solid var(--rule);padding-top:10px}}
.gradechip{{font:600 12px var(--mono);background:var(--bg);border:1px solid var(--rule);border-radius:4px;padding:2px 8px}}
.expo{{display:flex;gap:6px;align-items:center;margin-left:auto}} .mini{{font:600 12px var(--mono);padding:1px 6px;border-radius:4px}}
.mini.hit{{color:var(--hit);border:1px solid var(--hit)}} .mini.miss{{color:var(--miss);border:1px solid var(--miss)}} .note{{font-size:12px;color:var(--ink3)}}
.mnf{{border:2px dashed var(--rule);border-radius:6px;padding:14px 16px}}
.method{{font-size:13.5px;color:var(--ink2);max-width:80ch}} .method li{{margin-bottom:4px}}
#tip{{position:fixed;pointer-events:none;z-index:10;background:var(--ink);color:var(--paper);font:12.5px var(--body);padding:6px 9px;border-radius:4px;max-width:280px;opacity:0;transition:opacity .08s}}
nav.toc{{display:flex;flex-wrap:wrap;gap:6px 14px;font:12.5px var(--mono);margin-top:4px}} nav.toc a{{color:var(--ink2)}}
a:focus-visible,summary:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
@media (prefers-reduced-motion:reduce){{#tip{{transition:none}}}}
</style>
<div class="wrap">
<header class="top">
<span class="eyebrow">Platinum Rose · 2026 Week 3 · TNF through SNF · MNF PHI @ CHI pending</span>
<h1>Week 3 Post-Mortem</h1>
<p class="lede">Every placed leg was re-graded from ESPN box scores, along with every AI leg that was recommended but not placed. The side reads held up better than the game scripts. We bet Unders in six games, and four of them finished 15 to 28 points above our projected total. The prop builds that came closest were mostly AI drafts that were trimmed or never placed.</p>
<nav class="toc"><a href="#money">Money</a><a href="#scripts">Projections</a><a href="#cats">Leg categories</a><a href="#ai">AI vs Andy</a><a href="#close">Closest tickets</a><a href="#games">Game recaps</a><a href="#method">Method</a></nav>
</header>
<div class="kpis">
<div class="kpi"><span class="n">${M["staked"]:.2f}</span><span class="l">Cash staked · 33 tickets (+1 Novig promo credit)</span></div>
<div class="kpi"><span class="n">${M["returned"]:.2f}</span><span class="l">Returned: dog-ML RR, 3 of 10 combos</span></div>
<div class="kpi"><span class="n neg">−${-M["net"]:.2f}</span><span class="l">Net before MNF. Best case +$18.24 if PHI −3 covers.</span></div>
<div class="kpi"><span class="n">{M["lw"]}/{M["ln"]}</span><span class="l">Placed leg instances hit ({round(100*M["lw"]/M["ln"])}%). 7 legs wait on MNF.</span></div>
<div class="kpi"><span class="n">{M["winners"]}/14</span><span class="l">Sunday projections that picked the right winner</span></div>
</div>

<section id="money"><span class="eyebrow">Where the money went</span><h2>Stake by ticket family</h2>
<p class="sub">Game-line parlays and the teaser took 47% of the stake and returned nothing. The round robins were the only family with money back.</p>
<div class="panel"><div class="legend"><span><i style="background:var(--stake)"></i>Staked</span><span><i style="background:var(--ret)"></i>Returned</span></div>{P["c_pnl"]}</div>
</section>

<section id="scripts"><span class="eyebrow">Where the reads broke</span><h2>Projected vs final</h2>
<p class="sub">Open circles are our pre-game projections from the Week 3 master intel narratives; filled circles are the finals. Finals averaged {M["tot_err"]:+.1f} points above the projected total. The misses were not random: every game where we bet the Under finished at least 9 points over its projection except CAR/CLE.</p>
<div class="two">
<div class="panel"><h4>Game total</h4><div class="legend"><span><i style="background:var(--paper);border:2px solid var(--proj)"></i>Projected</span><span><i style="background:var(--ret)"></i>Final</span></div>{P["c_tot"]}</div>
<div class="panel"><h4>Home margin (right = home team won by more)</h4><div class="legend"><span><i style="background:var(--paper);border:2px solid var(--proj)"></i>Projected</span><span><i style="background:var(--ret)"></i>Final</span></div>{P["c_mar"]}</div>
</div>
<div class="callouts">
<div class="callout"><b>Unders: 1 for 8</b><p>CIN/PIT (57), SEA/WAS (64), LV/NO (62), LAR/DEN (56) and ATL/GB (49) all went over. Only CAR/CLE (39) stayed under.</p></div>
<div class="callout"><b>Pass volume we did not model</b><p>ARI threw 52 times, LAR 55, GB 53 and NO 42 while we projected run-first or controlled scripts. Most of the dead yardage and tackle legs trace back to this.</p></div>
<div class="callout"><b>Margin error {M["mae"]:.1f} pts</b><p>We picked 8 of 14 winners. The six misses were TEN, CIN, SEA, TB, NO and LAR, and all six were on our tickets.</p></div>
</div>
</section>

<section id="cats"><span class="eyebrow">Leg scorecard</span><h2>Hit rate by category</h2>
<p class="sub">Each unique position counts once, even if it sat on several tickets: {M["u"]} graded positions. QB interceptions and passing TDs carried the prop side. Receptions, tackles, sacks and first-TD legs dragged it down, and full-game Unders were the worst category with real volume.</p>
<div class="two">
<div class="panel"><h4>Player props</h4><div class="legend"><span><i style="background:var(--hit)"></i>Hit ✓</span><span><i style="background:var(--miss)"></i>Missed ✗</span></div>{P["c_cat_p"]}</div>
<div class="panel"><h4>Sides &amp; totals</h4><div class="legend"><span><i style="background:var(--hit)"></i>Hit ✓</span><span><i style="background:var(--miss)"></i>Missed ✗</span></div>{P["c_cat_s"]}</div>
</div>
</section>

<section id="ai"><span class="eyebrow">AI recommendations vs Andy's calls</span><h2>Who was right</h2>
<p class="sub">Every placed position is tagged by whether an AI card (Claude or Codex, any final version this week) recommended it. "AI rec · not placed" is everything the AI proposed that never made a ticket, graded at the AI's own line. Samples are small, so read these as direction, not verdict.</p>
<div class="panel"><div class="legend"><span><i style="background:var(--o1)"></i>AI recommended and placed</span><span><i style="background:var(--o2)"></i>Andy only</span><span><i style="background:var(--o3)"></i>AI recommended, not placed</span><span>dashed line = 50%</span></div>{P["c_org"]}</div>
<div class="callouts">
<div class="callout"><b>Andy's sides: {o["Sides & totals"]["andy"][0]} of {o["Sides & totals"]["andy"][1]}</b><p>BUF (ML, −6.5, teaser −1), DET ML and the NYJ/DET Over won. SEA ML, the SEA teaser leg, GB −4 and the live LAR +2 lost. The AI-backed sides went {o["Sides & totals"]["agree"][0]} of {o["Sides & totals"]["agree"][1]}, sunk by CIN, SF, TEN and the Unders.</p></div>
<div class="callout"><b>Unplayed AI props: {pct(o["Player props"]["ai_only"])}%</b><p>{o["Player props"]["ai_only"][0]} of {o["Player props"]["ai_only"][1]} hit, including Kittle ATD (2 TDs), Cousins 2+ TD, Olave 77+ yds, Lamb 7+ rec, Wiggins and Humphrey tackles. The placed AI props hit {pct(o["Player props"]["agree"])}% and Andy-only props {pct(o["Player props"]["andy"])}%.</p></div>
<div class="callout"><b>Adding legs cost the most</b><p>Stack A and 7b came closer as AI drafts than as placed, and the unplaced Prop RR hit 4 of 5. The legs added for a bigger payout were mostly TD scorers, and most of them missed.</p></div>
</div>
<div class="panel"><table class="div"><thead><tr><th>#</th><th>Ticket</th><th>AI proposed</th><th>Andy placed</th><th>Outcome</th><th>Edge</th></tr></thead><tbody>{P["div_rows"]}</tbody></table></div>
</section>

<section id="close"><span class="eyebrow">Closest to cashing</span><h2>One leg away</h2>
<p class="sub">Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number. Four placed tickets died on a single leg.</p>
<div class="tcards">{P["close_html"]}</div>
<details><summary>Two legs away ({P["two_html"].count('class="tcard"')} tickets)</summary><div class="tcards">{P["two_html"]}</div></details>
<h4 style="margin:10px 0 0;font:600 13px var(--body);text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)">Near misses by the number</h4>
<ul class="nm">{P["nm_html"]}</ul>
</section>

<section id="games"><span class="eyebrow">Game by game</span><h2>Recaps</h2>
<p class="sub">Each card shows the final and linescore, our pre-game projection and read, what actually decided the game, and how our placed legs on it did.</p>
<div class="games">{P["games_html"]}</div>
<div class="mnf"><b>Still to play: PHI @ CHI, Monday 5:15 PT.</b> Seven placed legs ride on it: PHI ML (favorites 9-team, Novig credit #1), PHI −3 (master RR's last live combo, worth $18.24, plus the 8-team), PHI −4 (SuperContest parlay), Under 43 (5-team) and Under 41.5 (Novig). Every one of those tickets except the master RR is already dead or promo-funded. Keenum starts; Saquon and DeVonta Smith are active.</div>
</section>

<section id="method"><span class="eyebrow">Method and data notes</span><h2>How this was graded</h2>
<ul class="method">
<li>Leg results come from the ESPN box scores in <span class="mono">data/fantasy/boxscores/</span> (15 finals). Scoring plays decide TD, 2+ TD and first-TD legs, so a pick-six or lateral counts the way the book grades it.</li>
<li>AI recommendations include the final version at each decision point: TNF ladder v2, slot 10, Codex clean synthesis (01:49 re-price), Claude v3/v4/v5 templates, the official paper 4-leg, prop card v2.1 (7a/7b/7d/7e/8a/8b), Stack A/B proposals, SNF ladder v3, the SuperContest AI five and the pregame SNF side. Drafts that a later version replaced are left out, except where a divergence entry names them.</li>
<li>A placed leg counts as "AI recommended" when the AI proposed the same player, market and direction, or the same side or total, even at a slightly different line. Line differences that changed an outcome are called out (BAL −3.5 vs ML).</li>
<li>Four legs are marked LOST in the wagers file but hit in the box score: McBride 7+ rec (9), Pat Bryant 28+ yds (44), Bonitto sack (1) and RJ Harvey 3+ rec (6). None of these changes a ticket result, but the file should be corrected. Several legs on already-dead tickets are also still PENDING there.</li>
<li>The dog-ML RR return ($39.21) is computed from ticket prices; confirm it against the BKR settlement. BEO ticket numbers are still missing for 10 tickets.</li>
</ul>
</section>
</div>
<div id="tip" role="tooltip"></div>
<script>
(function(){{var t=document.getElementById('tip');
function show(e){{var el=e.target.closest('[data-tip]');if(!el){{t.style.opacity=0;return}}t.textContent=el.getAttribute('data-tip');t.style.opacity=1;
var x=e.clientX+14,y=e.clientY+14;var r=t.getBoundingClientRect();if(x+r.width>innerWidth-8)x=e.clientX-r.width-14;if(y+r.height>innerHeight-8)y=e.clientY-r.height-14;t.style.left=x+'px';t.style.top=y+'px'}}
document.addEventListener('mousemove',show);document.addEventListener('mouseleave',function(){{t.style.opacity=0}});
document.addEventListener('touchstart',function(e){{show(e.touches[0]?{{target:e.target,clientX:e.touches[0].clientX,clientY:e.touches[0].clientY}}:e)}},{{passive:true}});}})();
</script>'''
open('week3-post-mortem.html','w').write(page)
print(len(page))
