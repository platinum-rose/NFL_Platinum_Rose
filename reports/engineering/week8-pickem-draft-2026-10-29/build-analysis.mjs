import fs from 'node:fs';
import crypto from 'node:crypto';
import {normTeam, impliedProb, planPool} from '../../../scripts/lib/pickem.mjs';
const root = process.cwd();
const out = `${root}/reports/engineering/week8-pickem-draft-2026-10-29`;
const read = p => JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const provider = read(`${out}/schedule-provider.json`);
const schedule = provider.data.competitions;
if (schedule.length !== 14 || schedule.some(g => g.competitionStatus !== 'Upcoming' || new Date(g.startDateTimeUtc) <= new Date())) throw Error('Schedule coverage/status gate');
const sources = ['data/generated/props/bookmaker-live-2026-10-29-week8.json','data/generated/props/betonline-live-2026-10-29-week8.json'];
const odds = sources.map(read);
const normalized = [], games = [];
for (const event of schedule) {
 const home = normTeam(event.teams.find(t=>t.isHomeTeam).teamAbbreviation);
 const away = normTeam(event.teams.find(t=>!t.isHomeTeam).teamAbbreviation);
 const game_id = `2026_08_${away}_${home}`;
 const books = [];
 for (let i=0;i<odds.length;i++) {
  const src=odds[i];
  const candidates=src.rows.filter(r=>r.market==='game_lines' && r.bet==='moneyline' && r.available!==false && (i===0?r.sectionTitle==='Game':r.marketTitle==='Game Moneyline'));
  const pair=candidates.filter(r=>{const teams=(r.event||r.game||'').split(' @ ').map(normTeam);return teams[0]===away&&teams[1]===home;});
  if(pair.length!==2)throw Error(`Expected one full-game moneyline pair ${game_id} book ${i}; found ${pair.length}`);
  const h=pair.find(r=>normTeam(r.side||r.team)===home),a=pair.find(r=>normTeam(r.side||r.team)===away);
  if(!h||!a)throw Error('Missing moneyline side');
  const ph=impliedProb(h.odds),pa=impliedProb(a.odds);
  if(ph==null||pa==null)throw Error('Invalid price');
  const p_home=ph/(ph+pa);
  const row={game_id,home_team:home,away_team:away,commence_time:event.startDateTimeUtc,book:h.book,market:'moneyline',home_price:h.odds,away_price:a.odds,captured_at:src.capturedAt,p_home,source_file:sources[i],source_url:h.eventUrl};
  books.push(row);normalized.push(row);
 }
 const p_home=books.reduce((s,b)=>s+b.p_home,0)/books.length;
 const fav=p_home>=.5?home:away;
 games.push({game_id,home,away,commence_time:event.startDateTimeUtc,p_home,fav,dog:fav===home?away:home,p_fav:Math.max(p_home,1-p_home),books:books.length,odds_captured_at:books.map(x=>x.captured_at).sort()[0],book_evidence:books,provider_stats:event.teamStats});
}
const pools=read('data/pickem/pools-2026.json').pools;
const leans=[{team:'LV',tier:2,why:'Explicit Raiders ML source (Zachary Cohen, VSiN); near coin flip. Qualitative leverage only. Local team efficiency and other SU sources favor NYJ; do not call LV the likelier winner.'}];
const plans=pools.map(p=>planPool(p,games,leans,{}));
const dkpPath='data/generated/props/draftkings-predictions-live-2026-10-28-week8.json';
const dkp=read(dkpPath);
for (const g of games) {
 const e=dkp.events.find(e=>e.rows.some(r=>r.bet==='moneyline'&&normTeam(r.side)===g.home)&&e.rows.some(r=>r.bet==='moneyline'&&normTeam(r.side)===g.away));
 const rows=e?.rows.filter(r=>r.bet==='moneyline'&&r.marketTitle==='Game Moneyline')||[];
 if(rows.length!==2)throw Error('DKP game coverage');
 g.prediction_reference={captured_at:dkp.capturedAt,source_file:dkpPath,home_display_probability:rows.find(r=>normTeam(r.side)===g.home).probability,away_display_probability:rows.find(r=>normTeam(r.side)===g.away).probability,note:'Pre-fee display reference; sides add above 100%; not included in sportsbook probability mean or treated as executable offers.'};
}
const power=read('data/generated/team-profiles/team-power-ratings-2026.json');
const analytics=read('data/generated/team-profiles/team-analytic-snapshots-2026-w7.json');
const regression=read('data/generated/team-profiles/team-regression-snapshots-2026-w7.json');
const ftn=read('data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json');
for(const g of games) {
 g.team_context={};
 for(const t of [g.away,g.home]) {
  const ft=Object.entries(ftn.team_context).find(([k])=>normTeam(k)===t)?.[1];
  g.team_context[t]={power:power.rows.find(r=>normTeam(r.team_abbr)===t),analytics:analytics.rows.find(r=>normTeam(r.raw.team_abbr)===t),regression:regression.rows.find(r=>normTeam(r.raw.team_abbr)===t),ftn:ft?.records.filter(r=>r.category.startsWith('team-'))};
 }
}
const articles=read('reports/engineering/week8-article-ingest-2026-10-29/proposed-notes.json');
const selected=[0,4,7,14,16,17,43,55,56,60,68,69,71,87,88,91,92,93,94,95,96,97,98,99,100,101,102,104,108,109,110,120,121,123];
const articleIndex=selected.map(i=>{const a=articles[i];return {index:i,source:a.source,title:a.title,url:a.url,author:a.author,published_at:a.published_at,body_chars:(a.body||'').length,source_file:'reports/engineering/week8-article-ingest-2026-10-29/proposed-notes.json',body_sha256:crypto.createHash('sha256').update(a.body||'').digest('hex')};});
const paths=[...sources,dkpPath,'data/pickem/pools-2026.json','data/nfl-rosters/espn-full-rosters-latest.json','data/player-availability/latest.json','data/generated/team-profiles/team-power-ratings-2026.json','data/generated/team-profiles/team-analytic-snapshots-2026-w7.json','data/generated/team-profiles/team-regression-snapshots-2026-w7.json','data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json','reports/engineering/week8-article-ingest-2026-10-29/proposed-notes.json','reports/engineering/week8-podcasts-2026-10-29/candidate-intel.json','reports/engineering/week8-tnf-podcasts-2026-10-28/ross-tucker-local.json',`${out}/schedule-provider.json`,`${out}/official-injuries.html`];
const hashes=paths.map(path=>({path:path.replace(root+'/',''),sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
const data={schema:'week8_pickem_draft_analysis_v1',generated_at:new Date().toISOString(),proposal_only:true,execution_authorized:false,submitted:false,locked_picks_status:'not_captured_no_account_access',probability_basis:'Mean of two independently de-vigged saved full-game bookmaker moneyline pairs; latest available capture per book. Not a forecast model. Ties not modeled.',games,plans,article_index:articleIndex,hashes};
fs.writeFileSync(`${out}/analysis.json`,JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(`${out}/normalized-moneylines.json`,JSON.stringify(normalized,null,2)+'\n');
console.log(JSON.stringify({games:games.length,pairs:normalized.length,plans:plans.map(p=>({pool:p.pool_id,ev:p.ev,cost:p.ev_cost,flips:p.flips,picks:p.picks.map(x=>`${x.team} ${x.confidence??''}`)}))},null,2));
