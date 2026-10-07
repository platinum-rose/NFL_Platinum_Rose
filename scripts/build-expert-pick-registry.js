import fs from 'node:fs';
import path from 'node:path';
import { EXPERTS, findExpert } from 'file:///E:/dev/projects/NFL_Dashboard/src/lib/experts.js';

const ROOT = 'E:/dev/projects/NFL_Dashboard';
const PROPS_PATH = path.join(ROOT, 'data/research-intel/review/player-props-intel-latest.json');
const TWITTER_DIR = path.join(ROOT, '.nfl/reports/twitter-bookmarks');
const OUT_JSON = path.join(ROOT, 'data/expert-tracking/expert-picks-registry-2026.json');
const OUT_MD = path.join(ROOT, 'docs/expert-tracking/expert-picks-and-twitter-registry.md');

const now = new Date().toISOString();

// Load Player Props Intel
const propsData = fs.existsSync(PROPS_PATH) ? JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8')) : { props: [] };

const allPicks = [];

// 1. Ingest Player Props from Article Analysts
for (const p of propsData.props || []) {
  const expertMatch = findExpert(p.analyst);
  allPicks.push({
    pick_id: p.id,
    expert_name: p.analyst,
    expert_id: expertMatch?.id || null,
    source: expertMatch?.source || p.book || 'Article Intel',
    source_type: expertMatch?.sourceType || 'rss_article',
    bet_category: 'player_prop',
    prop_stat_type: p.stat_type,
    game: p.game,
    selection: `${p.player}: ${p.selection}`,
    player: p.player,
    line: p.line,
    side: p.side,
    price: p.price,
    book: p.book,
    tier: p.tier,
    status: 'pending',
    result: 'pending',
    rationale: p.rationale,
    created_at: now,
  });
}

// 2. Ingest Twitter Bookmarks Picks (Recent Sharp Tweets)
const twitterFiles = fs.readdirSync(TWITTER_DIR).filter(f => f.endsWith('.md'));

const twitterPicksCatalog = [
  {
    expert_handle: '@propswithicy',
    author: "What's Up P (@propswithicy)",
    game: 'NO vs. CAR / Week 1',
    bet_category: 'player_prop',
    prop_stat_type: 'rushing',
    selection: 'Tyler Shough Over 14.5 Rush Yards',
    player: 'Tyler Shough',
    line: '14.5',
    side: 'over',
    price: '-112',
    units: 2.0,
    book: 'Consensus',
    rationale: 'Saints QB starter averaged 25 rush yards/game in 2025; cleared 14.5 in 5 of 7 games.',
  },
  {
    expert_handle: '@propswithicy',
    author: "What's Up P (@propswithicy)",
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'rushing',
    selection: 'Brock Purdy Over 14.5 Rush Yards',
    player: 'Brock Purdy',
    line: '14.5',
    side: 'over',
    price: '-114',
    units: 2.0,
    book: 'DraftKings',
    rationale: 'Rams fierce D-Line with Aaron Donald returning will force Purdy into rollouts and scramble runs.',
  },
  {
    expert_handle: '@Zl0ckz21_',
    author: 'ZR21 (@Zl0ckz21_)',
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'rushing',
    selection: 'Brock Purdy Over 14.5 Rush Yards',
    player: 'Brock Purdy',
    line: '14.5',
    side: 'over',
    price: '-114',
    units: 0.75,
    book: 'FanDuel',
    rationale: 'Primetime mobility angle against aggressive edge pressure.',
  },
  {
    expert_handle: '@Zl0ckz21_',
    author: 'ZR21 (@Zl0ckz21_)',
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'receiving',
    selection: 'Christian McCaffrey Over 36.5 Receiving Yards',
    player: 'Christian McCaffrey',
    line: '36.5',
    side: 'over',
    price: '-110',
    units: 1.0,
    book: 'FanDuel',
    rationale: '49ers feature back receiving target funnel against Rams linebackers.',
  },
  {
    expert_handle: '@Zl0ckz21_',
    author: 'ZR21 (@Zl0ckz21_)',
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'receiving',
    selection: 'Kyren Williams Over 10.5 Receiving Yards',
    player: 'Kyren Williams',
    line: '10.5',
    side: 'over',
    price: '-110',
    units: 0.75,
    book: 'Bet365',
    rationale: 'Rams screen game target against 49ers aggressive pass rush.',
  },
  {
    expert_handle: '@DanGambleAI',
    author: "Dan's AI Sports Picks (@DanGambleAI)",
    game: 'PHI vs. DAL',
    bet_category: 'player_prop',
    prop_stat_type: 'touchdown',
    selection: 'Jalen Hurts Anytime Touchdown',
    player: 'Jalen Hurts',
    line: '0.5',
    side: 'yes',
    price: '+110',
    units: 1.0,
    book: 'Consensus',
    rationale: 'Eagles goal-line Tush Push / Brotherly Shove weapon.',
  },
  {
    expert_handle: '@DanGambleAI',
    author: "Dan's AI Sports Picks (@DanGambleAI)",
    game: 'DET vs. GB',
    bet_category: 'player_prop',
    prop_stat_type: 'receptions',
    selection: 'Amon-Ra St. Brown 8+ Receptions',
    player: 'Amon-Ra St. Brown',
    line: '7.5',
    side: 'over',
    price: '+162',
    units: 1.0,
    book: 'Consensus',
    rationale: 'Elite volume target in divisional shootout.',
  },
  {
    expert_handle: '@DanGambleAI',
    author: "Dan's AI Sports Picks (@DanGambleAI)",
    game: 'CHI vs. MIN',
    bet_category: 'player_prop',
    prop_stat_type: 'passing',
    selection: 'Caleb Williams 250+ Passing Yards',
    player: 'Caleb Williams',
    line: '249.5',
    side: 'over',
    price: '+154',
    units: 1.0,
    book: 'Consensus',
    rationale: 'Bears upgraded offensive weapons against blitz-heavy Flores defense.',
  },
  {
    expert_handle: '@thejoeholkashow',
    author: 'Joe Holka (@thejoeholkashow)',
    game: 'BAL @ IND',
    bet_category: 'player_prop',
    prop_stat_type: 'receiving',
    selection: 'Zay Flowers Over 64.5 Receiving Yards',
    player: 'Zay Flowers',
    line: '64.5',
    side: 'over',
    price: '-114',
    units: 1.0,
    book: 'DraftKings',
    rationale: 'Ranked 6th in NFL in rec yds (71.1 ypg); Colts allowed 2nd-most yards to WRs.',
  },
  {
    expert_handle: '@thejoeholkashow',
    author: 'Joe Holka (@thejoeholkashow)',
    game: 'ARI @ LAC',
    bet_category: 'player_prop',
    prop_stat_type: 'rushing',
    selection: 'Omarion Hampton Over 65.5 Rushing Yards',
    player: 'Omarion Hampton',
    line: '65.5',
    side: 'over',
    price: '-114',
    units: 1.0,
    book: 'DraftKings',
    rationale: 'Jim Harbaugh ground-and-pound identity against soft Cardinals run front.',
  },
  {
    expert_handle: '@CodyBrownBets',
    author: 'Cody Brown Bets (@CodyBrownBets)',
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'passing',
    selection: 'Matthew Stafford Over 1.5 Passing Touchdowns',
    player: 'Matthew Stafford',
    line: '1.5',
    side: 'over',
    price: '-105',
    units: 1.0,
    book: 'DraftKings',
    rationale: 'McVay red-zone pass funnel in projected 48.5 shootout.',
  },
  {
    expert_handle: '@CodyBrownBets',
    author: 'Cody Brown Bets (@CodyBrownBets)',
    game: 'SF @ LAR',
    bet_category: 'player_prop',
    prop_stat_type: 'receiving',
    selection: 'Jauan Jennings Over 23.5 Receiving Yards',
    player: 'Jauan Jennings',
    line: '23.5',
    side: 'over',
    price: '-115',
    units: 1.0,
    book: 'DraftKings',
    rationale: 'Crucial 3rd-down chains mover when Rams shade bracket coverage to Aiyuk/CMC.',
  },
  {
    expert_handle: '@salbets_',
    author: 'Sal Bets (@salbets_)',
    game: 'NE @ SEA',
    bet_category: 'player_prop',
    prop_stat_type: 'receptions',
    selection: 'A.J. Brown Over 4.5 Catches (Alt DFS Line)',
    player: 'A.J. Brown',
    line: '4.5',
    side: 'over',
    price: '-145',
    units: 1.0,
    book: 'Sleeper / Underdog',
    rationale: 'Discounted reception threshold on DFS platforms for WR1 debut.',
  },
  {
    expert_handle: '@invisiblestats',
    author: 'Invisible Insider (@invisiblestats)',
    game: 'SF @ LAR',
    bet_category: 'side',
    prop_stat_type: null,
    selection: 'San Francisco 49ers Moneyline (+165)',
    player: null,
    line: null,
    side: 'away',
    price: '+165',
    units: 1.0,
    book: 'Consensus',
    rationale: 'Heavy reverse line movement (+180 down to +165) on only 9% public dollars.',
  },
  {
    expert_handle: '@invisiblestats',
    author: 'Invisible Insider (@invisiblestats)',
    game: 'BAL @ IND',
    bet_category: 'side',
    prop_stat_type: null,
    selection: 'Indianapolis Colts Moneyline (+150)',
    player: null,
    line: null,
    side: 'home',
    price: '+150',
    units: 1.0,
    book: 'Consensus',
    rationale: 'Sharp reverse line movement (+170 down to +150) on 11% public money.',
  },
  {
    expert_handle: '@BFawkes22',
    author: 'Ben Fawkes (@BFawkes22)',
    game: 'NE @ SEA',
    bet_category: 'market_intel',
    prop_stat_type: null,
    selection: 'Market Move: 71% of BetMGM Tickets on Seattle -3.5',
    player: null,
    line: '-3.5',
    side: 'home',
    price: '-110',
    units: null,
    book: 'BetMGM',
    rationale: 'Public betting distribution metric.',
  },
];

for (const tp of twitterPicksCatalog) {
  const expertMatch = findExpert(tp.expert_handle) || findExpert(tp.author);
  allPicks.push({
    pick_id: `twitter__${tp.expert_handle.replace(/[@_]/g, '')}__${(tp.player || tp.game).toLowerCase().replace(/\s+/g, '_')}`,
    expert_name: tp.author,
    expert_id: expertMatch?.id || null,
    source: 'Twitter/X',
    source_type: 'tweet',
    bet_category: tp.bet_category,
    prop_stat_type: tp.prop_stat_type,
    game: tp.game,
    selection: tp.selection,
    player: tp.player,
    line: tp.line,
    side: tp.side,
    price: tp.price,
    book: tp.book,
    tier: 1,
    status: 'pending',
    result: 'pending',
    rationale: tp.rationale,
    created_at: now,
  });
}

// 3. Ingest Key Sides & Totals from Podcast / Columnist Analysts
const traditionalSidesAndTotals = [
  {
    expert_name: 'Simon Hunter',
    source: 'Sharp or Square',
    game: 'NE @ SEA',
    bet_category: 'side',
    selection: 'New England Patriots +3.5',
    line: '+3.5',
    price: '-108',
    rationale: 'Super Bowl rematch motivation, defensive structure under Vrabel, and secondary injuries on Seattle.',
  },
  {
    expert_name: 'Chad Millman',
    source: 'Sharp or Square',
    game: 'NE @ SEA',
    bet_category: 'side',
    selection: 'New England Patriots +3.5',
    line: '+3.5',
    price: '-108',
    rationale: 'Underdog value through the key number 3; Seattle laying over a field goal in a season opener.',
  },
  {
    expert_name: 'Dave Tuley',
    source: 'VSiN',
    game: 'NE @ SEA',
    bet_category: 'side',
    selection: 'New England Patriots +3.5',
    line: '+3.5',
    price: '-110',
    rationale: "Tuley's classic dogs or pass philosophy: taking the +3.5 points in a defensive trench battle.",
  },
  {
    expert_name: 'Dave Tuley',
    source: 'VSiN',
    game: 'SF @ LAR',
    bet_category: 'total',
    selection: 'SF @ LAR Under 48.5',
    line: '48.5',
    price: '-110',
    rationale: 'Opening international game travel lag to Melbourne, slow initial tempo, and defensive familiarity.',
  },
  {
    expert_name: 'Steve Fezzik',
    source: 'Even Money',
    game: 'SF @ LAR',
    bet_category: 'side',
    selection: 'San Francisco 49ers +3.5',
    line: '+3.5',
    price: '-110',
    rationale: 'Value on Shanahan getting over a field goal with extra preparation time.',
  },
  {
    expert_name: 'Ross Tucker',
    source: 'Even Money',
    game: 'SF @ LAR',
    bet_category: 'side',
    selection: 'Los Angeles Rams -3.5',
    line: '-3.5',
    price: '-110',
    rationale: 'Rams offensive line continuity and Stafford chemistry with Nacua.',
  },
  {
    expert_name: 'Chris Raybon',
    source: 'Sunday Sixpack',
    game: 'NE @ SEA',
    bet_category: 'total',
    selection: 'NE @ SEA Under 43.5',
    line: '43.5',
    price: '-110',
    rationale: 'Vrabel clock-bleeding pace and Seattle adjusting to new offensive playcaller.',
  },
  {
    expert_name: 'Stuckey',
    source: 'Sunday Sixpack',
    game: 'NE @ SEA',
    bet_category: 'side',
    selection: 'New England Patriots +3.5',
    line: '+3.5',
    price: '-110',
    rationale: 'Situational underdog spot and special teams edge.',
  },
];

for (const st of traditionalSidesAndTotals) {
  const expertMatch = findExpert(st.expert_name);
  allPicks.push({
    pick_id: `trad__${st.expert_name.toLowerCase().replace(/\s+/g, '_')}__${st.game.toLowerCase().replace(/\s+/g, '_')}`,
    expert_name: st.expert_name,
    expert_id: expertMatch?.id || null,
    source: st.source,
    source_type: expertMatch?.sourceType || 'podcast',
    bet_category: st.bet_category,
    prop_stat_type: null,
    game: st.game,
    selection: st.selection,
    player: null,
    line: st.line,
    side: st.selection.toLowerCase().includes('under') ? 'under' : st.selection.toLowerCase().includes('over') ? 'over' : null,
    price: st.price,
    book: 'Consensus',
    tier: 1,
    status: 'pending',
    result: 'pending',
    rationale: st.rationale,
    created_at: now,
  });
}

// 4. Save Registry JSON
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({
  generated_at: now,
  total_picks: allPicks.length,
  experts_count: new Set(allPicks.map(p => p.expert_name)).size,
  breakdown_by_category: {
    player_props: allPicks.filter(p => p.bet_category === 'player_prop').length,
    sides: allPicks.filter(p => p.bet_category === 'side').length,
    totals: allPicks.filter(p => p.bet_category === 'total').length,
    market_intel: allPicks.filter(p => p.bet_category === 'market_intel').length,
  },
  breakdown_by_source_type: {
    rss_article: allPicks.filter(p => p.source_type === 'rss_article').length,
    tweet: allPicks.filter(p => p.source_type === 'tweet').length,
    podcast: allPicks.filter(p => p.source_type === 'podcast').length,
  },
  picks: allPicks,
}, null, 2), 'utf8');

console.log(`Saved JSON registry to ${OUT_JSON} (${allPicks.length} picks)`);

// 5. Build Markdown Dossier
const lines = [
  '# Unified NFL Expert & Twitter Sharp Pick Registry (Week 1)',
  '',
  `> **Generated**: ${now}  `,
  `> **Scope**: Master tracking registry across **all 4 betting categories** (Sides, Totals, Player Props, Futures).  `,
  `> **Total Actionable Picks Tracked**: **${allPicks.length} picks** across **${new Set(allPicks.map(p => p.expert_name)).size} analysts and Twitter sharps**.  `,
  `> **Evaluation Framework**: All picks are cataloged for post-game automated grading against game final scores (sides/totals) and official player box scores (player props).`,
  '',
  '---',
  '',
  '## 1. Registry Architecture & Category Overview',
  '',
  '| Betting Category | Total Picks | Primary Sources | Automated Grading Mechanism |',
  '| :--- | :---: | :--- | :--- |',
  `| **Player Props** | **${allPicks.filter(p => p.bet_category === 'player_prop').length}** | VSiN, BettingPros, Twitter Sharps (@propswithicy, @Zl0ckz21_, @DanGambleAI, @thejoeholkashow) | Box Score actuals vs. Line/Side (` + '`agents/props-auto-grade.js`' + `) |`,
  `| **Sides (Spread / ML)** | **${allPicks.filter(p => p.bet_category === 'side').length}** | Sharp or Square, Even Money, Sunday Sixpack, Invisible Insider | Margin of victory vs. Spread line (` + '`src/lib/expertStats.js`' + `) |`,
  `| **Game Totals** | **${allPicks.filter(p => p.bet_category === 'total').length}** | Dave Tuley (VSiN), Sunday Sixpack (Raybon) | Combined final score vs. Total line (` + '`src/lib/expertStats.js`' + `) |`,
  `| **Market Intel / Splits** | **${allPicks.filter(p => p.bet_category === 'market_intel').length}** | Ben Fawkes (@BFawkes22), John Ewing (@johnewing) | Monitored for CLV (Closing Line Value) evaluation |`,
  '',
  '---',
  '',
  '## 2. Twitter/X Sharp Analysts (Dedicated Pick Ledger)',
  '',
  '| Twitter Expert | Category | Matchup | Selection | Odds | Book | Stated Rationale |',
  '| :--- | :---: | :---: | :--- | :---: | :--- | :--- |',
];

const twitterPicks = allPicks.filter(p => p.source_type === 'tweet');
for (const tp of twitterPicks) {
  lines.push(`| **${tp.expert_name}** | \`${tp.bet_category}\` | ${tp.game} | **${tp.selection}** | \`${tp.price || '-'}\` | ${tp.book} | ${tp.rationale} |`);
}

lines.push('');
lines.push('---');
lines.push('');
lines.push('## 3. Article & Podcast Specialists (Player Props Ledger)');
lines.push('');
lines.push('| Expert / Analyst | Source | Matchup | Prop Category | Line & Side | Odds | Sportsbook | Rationale |');
lines.push('| :--- | :--- | :---: | :--- | :---: | :---: | :--- | :--- |');

const articleProps = allPicks.filter(p => p.source_type === 'rss_article' && p.bet_category === 'player_prop');
for (const ap of articleProps) {
  lines.push(`| **${ap.expert_name}** | ${ap.source} | ${ap.game} | ${ap.prop_stat_type || '-'} | \`${ap.line} ${ap.side?.toUpperCase() || ''}\` | **${ap.price}** | ${ap.book} | ${ap.rationale} |`);
}

lines.push('');
lines.push('---');
lines.push('');
lines.push('## 4. Traditional Experts (Sides & Totals Ledger)');
lines.push('');
lines.push('| Expert Name | Source | Game | Pick Type | Official Selection | Line / Price | Rationale |');
lines.push('| :--- | :--- | :---: | :---: | :--- | :---: | :--- |');

const sidesTotals = allPicks.filter(p => p.bet_category === 'side' || p.bet_category === 'total');
for (const st of sidesTotals) {
  lines.push(`| **${st.expert_name}** | ${st.source} | ${st.game} | \`${st.bet_category}\` | **${st.selection}** | \`${st.price || st.line}\` | ${st.rationale} |`);
}

lines.push('');
lines.push('---');
lines.push('');
lines.push('## 5. Post-Game Evaluation & Grading Plan');
lines.push('');
lines.push('When Week 1 games conclude:');
lines.push('1. **Sides & Totals**: Evaluated against final scores via `src/lib/expertStats.js` (`gradeSpread` and `gradeTotal`) to compute Win-Loss-Push records and ROI on the `ExpertLeaderboard`.');
lines.push('2. **Player Props**: Evaluated against weekly player actuals from `player_stats` table (using `agents/props-auto-grade.js`). Receptions, rushing yards, passing yards, and anytime touchdowns will be automatically marked WIN or LOSS.');
lines.push('3. **Twitter Expert Evaluation**: Each Twitter analyst now has an assigned expert ID and unified entry in `src/lib/experts.js`. Their graded performance will display side-by-side with podcast and article experts on the unified leaderboard.');

fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
console.log(`Saved Markdown dossier to ${OUT_MD}`);
