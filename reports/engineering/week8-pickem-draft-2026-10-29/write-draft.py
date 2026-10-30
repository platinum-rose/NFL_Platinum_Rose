import json, hashlib, re, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path.cwd()
OUT=ROOT/'reports/engineering/week8-pickem-draft-2026-10-29'
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8-sig'))
d=read(OUT/'analysis.json')
articles=read(ROOT/'reports/engineering/week8-article-ingest-2026-10-29/proposed-notes.json')
plans={p['pool_id']:p for p in d['plans']}
games={g['away']+'@'+g['home']:g for g in d['games']}
base={p['game_id']:p for p in plans['simplysportsware']['picks']}
yahoo={p['game_id']:p for p in plans['yahoo']['picks']}
cbs={p['game_id']:p for p in plans['cbs']['picks']}
pt=lambda iso:datetime.datetime.fromisoformat(iso.replace('Z','+00:00')).astimezone(ZoneInfo('America/Los_Angeles')).strftime('%a %b %d, %I:%M %p %Z').replace(' 0',' ')
link=lambda i,label:f'[{label}]({articles[i]["url"]})'
comments={
'CAR@GB':('GB, moderate; keep 8 points',
 'The home favorite has the better defensive efficiency; Carolina has the better offensive EPA. The local results composite is only 14th versus 20th, so this is a middle-card pick. The worksheet flags a weak Green Bay rushing attack against a weak Carolina run defense: that is an opportunity, not proof the Packers will exploit it. Both lines have availability concerns. The expert support for Carolina +3.5 is compatible with a Green Bay straight-up win. Do not copy the external confidence article\'s 13-point Green Bay placement.',
 'Tonight: verify final inactives and any material line move before 5:15 PM PDT. Keep the separate TNF wager card HOLD.',[102,0,108]),
'BAL@BUF':('BUF, moderate and conditional; 5 points',
 'Buffalo has the league-leading local offensive EPA but the second-worst defensive EPA. Baltimore can keep pace if its starting quarterback returns effectively. The fresh roster places Lamar Jackson on BAL; Wednesday full participation is encouraging, not a Sunday clearance. Buffalo\'s 5-1 record also runs 1.50 wins above its points-based expectation. Home field and the saved moneyline support Buffalo, with no high-confidence promotion. The current Fezzik contest pick backs Baltimore with points, not necessarily to win outright.',
 'Confirm the Baltimore starting quarterback and final offensive/defensive availability. If the return fails, recalculate the entire middle of the confidence board from fresh prices.',[98,69,108]),
'TEN@CIN':('CIN, strongest; 14 points',
 'Cincinnati has a clear two-sided efficiency advantage and a large results-rating advantage. FTN independently shows positive Bengals offensive DVOA against a positive Titans defensive DVOA (positive is worse on defense). The worksheet also identifies Tennessee\'s poor first-half performance and Cincinnati\'s offensive conversion advantage. Wednesday receiver absence still needs a Friday update. An expert taking Tennessee +10.5 is not a straight-up Titans recommendation.',
 'Recheck receiver availability and offensive-line changes Friday/Sunday. Retain the top slot unless fresh evidence materially changes the market.',[95,43,16,108]),
'ARI@DAL':('DAL, strong with defensive volatility; 11 points',
 'Dallas is fifth in local offensive EPA and Arizona is 22nd; the results composite ranks Dallas 17th and Arizona 31st. The Cowboys\' last-place defensive EPA prevents a lock label. Arizona can exploit a poor defense, but the matchup worksheet favors Dallas\' scoring efficiency. Sources disagree: one confidence article takes Arizona at its lowest slot, while the survivor article favors Dallas and the morning contest evidence backs Dallas against the spread. Keep the straight-up favorite without treating that as unanimous expert agreement.',
 'Check the Arizona quarterback, backs and offensive-line availability. A shootout creates variance even if Dallas remains the likelier winner.',[101,14,16]),
'MIN@DET':('DET, cautious and conditional; 6 points',
 'This is the largest analytics-market disagreement. Minnesota is first in the results composite and defensive EPA; Detroit is fourth in offensive EPA but 29th on defense. FTN likewise rates Minnesota\'s defense exceptionally and its offense poorly. Detroit\'s offense, home setting and saved moneyline keep it the straight-up draft pick, not a high-confidence selection. Jahmyr Gibbs and Amon-Ra St. Brown missed Wednesday practice; the report did not rule either out. The worksheet explicitly highlights the pressure/protection matchup. The morning Minnesota first-quarter and spread opinions do not establish a full-game upset consensus.',
 'If either offensive weapon is ruled out, or both remain materially limited, reopen the winner and rank. Do not simply retain six points. Minnesota is the first mid-tier upset watch, but is outside the configured 57% coin-flip filter at these prices.',[97,71,17,108]),
'LV@NYJ':('NYJ conservative; LV only for small pool leverage',
 'The Jets have the better local defensive EPA and a small results-rating edge, so NYJ remains the highest-expected-points choice. The Raiders\' passing attack creates an upset route, but their defense is a major weakness. There is an explicit, week-specific Raiders moneyline recommendation in the VSiN article, which supports a tier-2 named-source pool deviation. This is one expert\'s pick, not consensus: the worksheet and several straight-up opinions favor New York. The market still makes LV less likely to win.',
 'SimplySportsware: NYJ at 2. Yahoo: LV at 1 and KC at 2. CBS: LV as the sole deliberate flip. Use NYJ instead in either pool if maximizing expected points matters more than differentiation.',[100,110,14,108]),
'CLE@PIT':('PIT, moderate; 7 points',
 'Pittsburgh has a large results-composite edge (10th versus 22nd), though both offenses are poor by local EPA. Cleveland\'s 5-2 record exceeds its points-based expectation by 1.89 wins, the largest positive gap in this comparison. Pittsburgh also has a close-game surplus, so this is not a one-way regression bet. Low scoring makes the favorite vulnerable. The Fezzik and Tuley Browns +3.5 opinions are valid spread counterevidence, not automatic Cleveland straight-up picks.',
 'Recheck protection and defensive availability, especially after Pittsburgh\'s travel. A major pass-rush downgrade would lower this slot.',[99,108,14]),
'ATL@TB':('TB, low confidence; 3 points',
 'Tampa Bay combines third-ranked local defensive EPA with 28th-ranked offensive EPA. Atlanta is less extreme on both sides. Tampa\'s 2-5 record understates its point differential: it is 1.79 wins below its points-based expectation and 1-5 in one-score games. That is context for a modest home-favorite choice, not a reason to force a big correction. The worksheet notes Atlanta\'s recent offensive improvement. The saved prices and several straight-up opinions narrowly favor TB; a source under parlay does not choose the winner.',
 'Recheck both backfields, line availability and weather nearer kickoff. Keep this near the bottom rather than reacting to last week\'s score alone.',[96,108,14]),
'IND@JAX':('JAX, strong; 13 points',
 'Jacksonville is second in the results composite and third in local offensive EPA; Indianapolis is 25th and 26th respectively. FTN also supports a substantial Jacksonville offensive advantage. Indianapolis\' personnel losses weaken the relevance of its earlier-season averages. The fresh roster confirms its former guard is now on SEA, so the Colts should not be credited with that former unit. The bye and matchup context support Jacksonville, while the Jaguars\' pass defense remains a plausible route for an upset. Do not treat an expert Colts +10 cover opinion as a winner pick.',
 'Recheck the Jacksonville receiver availability and the reshaped Indianapolis lines. Keep second-highest confidence unless the core quarterback/line premise changes.',[104,56,60,16,108]),
'LAC@LAR':('LAR, strong; 10 points',
 'The Rams have top-ten local offensive EPA and fourth-ranked defensive EPA; the Chargers are last on offense. FTN agrees that the Chargers\' offensive efficiency is poor. The Rams\' 3-4 record alone understates their efficiency profile. The Chargers\' bye and potential protection adjustments are reasons for caution, not a reason to overlook the large offensive gap. The local results composite ranks LAR 13th and LAC 32nd.',
 'Confirm offensive weapons and protection health. The label is a straight-up pool pick; a Rams spread is a separate decision.',[94,17,108]),
'KC@DEN':('KC by a sliver; 1 conservative point / 2 Yahoo points',
 'The market is nearly even. Local efficiency favors Kansas City: seventh on offense and sixth on defense versus Denver\'s 25th/eighth. FTN also favors the Chiefs\' offense while respecting Denver\'s defense. Denver\'s 5-2 record includes a 4-0 one-score record and 1.41 points-based excess wins. The worksheet explains why the Denver defense can still make this difficult. The morning Denver +1.5 contest selection supports a close game; it does not by itself justify a straight-up flip.',
 'Optional second leverage choice: DEN only after checking the retained Ross Tucker audio and current availability. Its automated transcript contains an explicit Denver straight-up choice, but also a corrected rest-day error. It remains unverified and does not drive this draft.',[93,108,14]),
'NE@MIA':('NE, strong; 12 points',
 'The Patriots have advantages in local offensive EPA, results rating and FTN team efficiency. Miami has a bottom-three local defensive EPA. The worksheet supports New England\'s offensive improvement while also noting Miami\'s recent improvement; a single Miami win does not eliminate the broader gap. This is a divisional road favorite, so the confidence is substantial rather than absolute.',
 'Recheck offensive-line and quarterback health and the weather in Miami. Keep above Dallas/LAR on the saved win probabilities.',[92,14,16,108]),
'PHI@WSH':('WSH, market-supported but volatile; 9 points',
 'Both teams rate poorly on defense and in the results composite. Washington nevertheless has a sizeable offensive efficiency advantage over Philadelphia, and the worksheet describes the Eagles\' backup-led offense and short turnaround against Washington coming off a bye. The nine-point rank follows the market, not enthusiasm for a 1-4-1 team. Do not import the old full-strength Philadelphia offense into this matchup. Washington\'s thin receiving group and weak defense are reasons to revisit this rank if news improves for Philadelphia.',
 'Confirm the quarterback and key receiver/line assumptions on both sides. A return of Philadelphia\'s usual starter would require repricing and reranking.',[91,16,108]),
'CHI@SEA':('SEA, moderate; 4 points',
 'Seattle\'s second-ranked defensive EPA is the clearest edge. Chicago has the better local offensive EPA and more rest, while Seattle\'s offense remains a concern. The worksheet highlights Seattle\'s explosive-play suppression and Chicago\'s recent defensive vulnerability. The refreshed rosters confirm Quenton Nelson on SEA and Jeffery Simmons on CHI; season averages do not fully price their new roles. These competing changes argue against a high slot. A Bears +3.5 contest pick is not an outright-win call.',
 'Monday reports were not populated on the official page at capture. Recheck both new additions\' availability/roles and the full injury reports before locking.',[87,60,108])
}

text=['# Week 8 confidence and pick’em draft — October 29, 2026','',
 '**Proposal only.** All 14 games were upcoming at the schedule check. No picks were submitted, official cards changed or accounts opened. The separate CAR@GB wager card remains **HOLD**. The approved free ESPN roster refresh passed with 32 teams and 2,558 players.',
 '',f'Prepared {pt(d["generated_at"])}. Bookmaker capture: Oct 28, 5:26 PM PDT. BetOnline capture: Oct 28, 8:10 PM PDT. These are saved reference prices, not live offers. Sunday/Monday recommendations remain provisional pending final reports.',
 '', 'Confidence points are 14 (most) to 1 (least), each used once. Percentages below are the mean of two separately de-vigged full-game moneyline pairs. They are market-implied estimates, not a calibrated model or simulation. The analytical review explains agreement, counterevidence and conditions; it does not manufacture a new probability.',
 '', '## Complete pool draft','',
 '| Matchup | Kickoff Pacific | SimplySportsware | Yahoo | CBS straight-up | Market favorite / win estimate |',
 '|---|---|---|---|---|---|']
for g in d['games']:
 b=base[g['game_id']];y=yahoo[g['game_id']];c=cbs[g['game_id']]
 text.append(f'| {g["away"]} @ {g["home"]} | {pt(g["commence_time"])} | **{b["team"]} {b["confidence"]}** | **{y["team"]} {y["confidence"]}** | **{c["team"]}** | {g["fav"]} {g["p_fav"]*100:.1f}% |')
text += ['', '## Pool strategy and tradeoffs','',
 '**SimplySportsware — the duma 2:** retain every market favorite and probability-ranked points. Three of four prize types are cumulative, so avoid paying for an upset merely to be different. Expected score on the saved probabilities: **74.256 / 105**.',
 '', '**Yahoo — Ken’s Pickem League:** use **LV 1, KC 2**, with the other 12 selections/slots unchanged. This is a single cheap coin-flip deviation. Expected score **74.174 / 105**, a **0.082-point** cost versus the conservative card. No heavy-favorite fade is required or supported. The retained Week 7 standing is 22nd with a 43-point season gap; that does not justify a broad upset card. Field selection percentages were not captured, so improved pool-winning equity is unproven.',
 '', '**CBS — BUKBUK:** use the conservative winners except **LV over NYJ**. Estimated correct picks **9.173 / 14**, versus **9.241** for every market favorite: a **0.068-pick** cost. If the goal is strictly maximum expected correct picks, take NYJ instead. No confidence points apply in CBS.',
 '', '**Optional, not adopted:** Denver is the only additional near-coin-flip upset worth revisiting. The older retained automated podcast transcript supports a Denver straight-up pick, but its audio spot-check remains outstanding and its rest rationale was corrected in the episode. The local efficiency data prefer KC. Minnesota is the main conditional upset watch if Detroit’s offensive availability deteriorates; it is not a configured coin-flip flip at current saved prices.',
 '', '**Locking:** all three saved pool configurations lock each game at kickoff. Current account selections and reserved confidence slots were not captured. Treat this as a complete proposal, not an instruction to overwrite already locked picks. Reconcile any existing slots before using it. Pool-specific tiebreak questions were not captured; no tiebreak number is invented.']

for key,g in games.items():
 rec,why,conditions,ids=comments[key]
 text += ['',f'## {key} — {rec}','',why,'',f'**Recheck:** {conditions}','',
 '| Team | Results rank | Offensive EPA/play | Defensive EPA/play | FTN offensive DVOA | FTN defensive DVOA |',
 '|---|---:|---:|---:|---:|---:|']
 for t in [g['away'],g['home']]:
  ctx=g['team_context'][t];a=ctx['analytics'];f={r['category']:r['metrics'] for r in ctx['ftn'] if r['subpage']=='efficiency'}
  text.append(f'| {t} | {ctx["power"]["power_rating"]["model_rank"]} | {a["off_epa_per_play"]:+.4f} | {a["def_epa_per_play"]:+.4f} | {f["team-offense"]["DVOA"]} | {f["team-defense"]["DVOA"]} |')
 pairs='; '.join(f'{x["book"]}: {g["away"]} {x["away_price"]:+}, {g["home"]} {x["home_price"]:+}' for x in g['book_evidence'])
 text += ['',f'Saved moneylines: {pairs}.',
 f'Independent display reference: DK Predictions {g["away"]} {g["prediction_reference"]["away_display_probability"]*100:.0f}%, {g["home"]} {g["prediction_reference"]["home_display_probability"]*100:.0f}%, before fees. Its displayed sides sum above 100%; they are not mixed into the sportsbook estimate.',
 '', 'Article context: '+', '.join(link(i,f'source {i}') for i in ids)+'.']

text += ['', '## Evidence coverage, decisions and limits','',
 '- **Markets:** 28 full-game moneyline pairs, two books for each of 14 games. First-half/quarter markets were excluded. Each book is de-vigged separately, then the home probabilities are averaged. Different capture times are preserved. The existing generic helper selects the latest capture batch across books; this draft supplies an explicit per-book mean so the earlier Bookmaker capture is not silently dropped.',
 '- **Analytics:** 32-team local power, EPA and regression snapshots through completed Week 7. All five profile outputs match the October 28 reconciliation manifest hashes. Results rank is the SRS/net-points/Pythagorean composite; it is not DVOA. FTN DVOA is separately sourced from the 36-table context with the completed-Week-7 coverage check. Providers can differ in denominators and definitions; their values were not averaged. Lower defensive EPA/DVOA is better. These are season descriptions, not injury-adjusted game forecasts.',
 '- **Articles:** screened the retained 124-candidate morning intake and used available relevant bodies, including all 14 worksheet game openings, direct pool advice, current injury reporting, efficiency/line context and the explicit Raiders ML. Metadata-only, paywalled/missing tables and article navigation were not treated as picks. The visible Koerner confidence page does not expose its actual rankings in the retained body, so none are claimed. A stale “Seahawks vs Chiefs” additional-bet line in the VSiN Raiders article is excluded because that is not this week’s matchup.',
 '- **Podcasts:** used the three newly processed episodes as qualitative context with their recommendation/contest/parlay/lean labels intact. Automated captions/ASR and speaker attribution remain subject to human spot-checking. Also inspected the independently retained October 28 Ross Tucker ASR and Sharp or Square caption evidence. Ross’s Gemini extraction has impossible timestamps and is excluded. No host/episode mirror is counted twice. No ATS choice, first-quarter pick or parlay leg becomes a straight-up upset by inference. The Favorites premiere was still unavailable at the morning capture and contributes no invented evidence.',
 '- **Availability:** the full roster refresh clears team membership, not game fitness or starting roles. The saved canonical availability file contains 219 publication times later than this review’s morning cutoff and explicit eligibility holds; it is not used as blanket confirmation. The public official Week 8 report was captured independently. It contained 26 team tables; the Monday teams were unpopulated. Wednesday participation is not a Sunday game designation. The Sunday/Monday final reports and inactives remain pending.',
 '- **Excluded under the approved scope:** stale Week 7 secondary matrix, stale Alpha packet, missing promoted-podcast pull, unrelated stale futures/prop lanes and 2025 public weekly stats. No Supabase retrieval was made for this draft. The broad preflight remains incomplete outside the approved pool scope; this is not a full Master Intel clearance.',
 '- **Uncertainty:** historical records and ATS systems are not substitutes for causal matchup evidence. No spread cover model, calibrated win model, weather model, current public pick shares or simulation was run. Two sportsbook prices can be correlated. Ties and platform-specific tie scoring are not modeled in the expected totals. Standings/field sizes outside the current Yahoo snapshot may be stale.',
 '', '## Source provenance for the one recommended upset','',
 f'**LV:** named source Zachary Cohen; {link(110,"VSiN Week 8 article")}; retained article row 110; published {articles[110]["published_at"]}. Exact source selection: **“Bet: Raiders ML (+105)”**. The retained article body and its hash are indexed in `analysis.json`. This is sourcing tier 2 (named expert, week-specific selection) under the weekly process, not a claim of consensus or verified current odds. Local analytics and other sources disagree, which is why the confidence allocation is only one point.',
 '', '## Local audit files','',
 '- `analysis.json`: per-game inputs, three computed plans, source index and SHA-256 hashes.',
 '- `normalized-moneylines.json`: all 28 source pairs with original timestamps and URLs.',
 '- `profile-hash-verification.json`: reconciled outputs match their saved manifest.',
 '- `schedule-provider.json`: successful 14-game schedule response; all upcoming at capture.',
 '- `official-injuries-receipt.json` and retained HTML: public official report capture. ESPN’s separate scoreboard range request returned HTTP 400; it was not used. Schedule coverage instead comes from the successful provider response and NFL schedule page.',
 '- `roster-backups/`: preserved pre-refresh roster snapshots.',
 '- `preflight-after-roster.json`: roster gate passes; unrelated stale dependencies remain excluded.',
 '', 'References: [official Week 8 injury report](https://www.nfl.com/injuries/league/2026/reg8), [NFL schedule](https://www.nfl.com/schedules), [morning podcast intake](../week8-podcasts-2026-10-29/README.md), [October 28 podcast verification](../week8-tnf-podcasts-2026-10-28/README.md).',
 '', '**Scope completed locally:** draft and audit only. No wager, account operation, ledger/portfolio change, Supabase action, paid call, official pick publication or submission.']
(OUT/'week8-confidence-pickem-draft.md').write_text('\n'.join(text)+'\n',encoding='utf-8')

# Independently verify every deliberately named player against the refreshed full roster.
roster=read(ROOT/'data/nfl-rosters/espn-full-rosters-latest.json')
claims=[('Lamar Jackson','BAL'),('Jahmyr Gibbs','DET'),('Amon-Ra St. Brown','DET'),('Quenton Nelson','SEA'),('Jeffery Simmons','CHI')]
checks=[]
for name,team in claims:
 records=roster['players'].get(name,[])
 checks.append({'player':name,'claimed_team':team,'records':records,'pass':any(x['team']==team for x in records)})
if not all(x['pass'] for x in checks):raise RuntimeError('Named player roster mismatch')
(OUT/'named-player-verification.json').write_text(json.dumps({'roster_generated_at':roster['generated_at'],'checks':checks},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'report':str(OUT/'week8-confidence-pickem-draft.md'),'games':len(games),'named_player_checks':len(checks),'all_pass':True,'words':len(' '.join(text).split())}))
