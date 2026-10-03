import { describe, expect, it } from 'vitest';
import {
  extractAnalyticalSignals, parseWalterPicks, parseScorePredictions, parseGatedLines, teamFromPhrase,
} from '../../agents/lib/analytical-picks.js';

// Fixtures are verbatim excerpts of Week 4 2026 article bodies stored in
// research_intel_notes (captured 2026-09-29..10-01).
const PFT_PICKS = `Maybe it’s good that I’m no longer doing the Joint Mega Picks Podcast. From 10-6 to 9-7 to 8-8, the trend is not my friend. (For the season, I’m 27-21.) In Week 3, the best pick was Ravens over Cowboys (especially since the wild-guess score prediction was 34-30). Worst pick: Buccaneers over Vikings. Steelers at Browns (Thursday night) The Steelers have gone 1-7 in Cleveland since 2018. My brain is screaming “Browns!” but my gut is saying that the Steelers will benefit from coach Mike McCarthy’s 16-6 record in short-week games. Steelers 17, Browns 13. Colts vs. Commanders at London Mariota may have at least one more in the tank. Commanders 24, Colts 20. Titans at Ravens That likely won’t be cured against the Ravens’ defense in Baltimore. Ravens 30, Titans 17. Patriots at Bills Bills 34, Patriots 21. Jets at Bears Or their preferred backup. Bears 27, Jets 17. Jaguars at Bengals a 2-2 start is not acceptable. Bengals 28, Jaguars 27. Cowboys at Texans Cowboys 27, Texans 20. Cardinals at Giants Giants 23, Cardinals 17. Rams at Eagles Rams 30, Eagles 20. Packers at Buccaneers they should dissolve the corporation. Packers 21, Buccaneers 13. Dolphins at Vikings Vikings 24, Dolphins 14. Chiefs at Raiders Chiefs 23, Raiders 16. Chargers at Seahawks Seahawks 27, Chargers 13. Broncos at 49ers 49ers 24, Broncos 20. Lions at Panthers Lions 31, Panthers 21. Falcons at Saints Saints 23, Falcons 17. Close Ad Add favorite players, teams, and leagues with an NBCUniversal Profile Continue`;

const WALTER = `The Spread. Edge: Browns. WalterFootball.com Calculated Spread: Steelers -2.5. Westgate Advance Point Spread: Steelers -2.5. Computer Model: Browns -4.5. The Vegas. Edge: Browns. Slight lean on the Steelers. Percentage of money on Pittsburgh: 64% (9,000 bets) Opening Line: Steelers -2.5. Opening Total: 38. Week 4 NFL Pick: Steelers 20, Browns 16 Steelers -2.5 (0 Units) Under 38.5 (0 Units) Prop: Pat Freiermuth most receiving yards +1960 (0.25 Units) - FanDuel Parlay: Darnell Washington 20+ receiving yards, Roman Wilson 20+ receiving yards, Browns +3.5 +498 (0.10 Units) - FanDuel Parlay: Denzel Boston 39+ receiving yards, K.C. Concepcion 4+ receptions, Steelers ML +540 (0.5 Units) - DraftKings Premium members have access to the rest of these NFL picks`;

const SHARP_BEST_BETS = `Week 4 NFL Best Bets: Against the Spread &#038; Game Total Picks. NFL Best Bets: Week 4 Picks Packers @ Buccaneers Under 38.5 Points Dolphins @ Vikings Under 39 Points Sharp Betting Tools: NFL Spreads, Totals, &amp; Moneylines NFL Props: Lines &amp; Odds NFL Week 4 Best Bet: Packers at Buccaneers Under 38.5 Points Green [...]`;

const SHARP_WORKSHEET = `[] Pittsburgh Rank @ Cleveland Rank -2.5 Spread 2.5 20.5 Implied Total 18.0 17.7 26 Points/Gm 18.0 24 20.0 11 Points All./Gm 23.7 18 The Browns have won 7 consec. [] Arizona Rank @ NY Giants Rank -1.5 Spread 1.5 23.0 Implied Total 21.5 The Broncos have a league-worst -30 point differential.`;

const ROTOWIRE_STATS = `Touches Per Game 7.0 % Snaps w/Touch 35.0% Air Yards Per Game -3.3 Air Yards Per Snap -0.17 % Team Air Yards -1.2% % Team Targets 4.7% Avg Depth of Target -2.5 Yds Catch Rate 100.0% Scoring Standard PPR Half PPR FanDuel DraftKings Yahoo DFS Odds Picks`;

const PFT_AWARD_ODDS = `Will Anderson at +300, Aidan Hutchinson at +750 and T.J. Watt at +900 lead the Defensive Player of the Year odds. Josh Allen remains the MVP favorite; Lamar Jackson is currently +600.`;

const RECAP = `Burden secured seven of 11 targets for 61 yards and a touchdown in the Bears' 27-7 win over the Eagles on Monday night. Visit RotoWire.com for more analysis, odds and picks.`;

const opts = (source, baseConfidence = 0.66) => ({ source, baseConfidence, eventRef: 'https://example.test/a' });

describe('analytical picks: team lexicon', () => {
  it('matches exact team names only (no substring matches)', () => {
    expect(teamFromPhrase('Steelers')?.abbreviation).toBe('PIT');
    expect(teamFromPhrase('49ers')?.abbreviation).toBe('SF');
    expect(teamFromPhrase('Green Bay')?.abbreviation).toBe('GB');
    expect(teamFromPhrase('Tampa Bay Rank')).toBeNull();
    expect(teamFromPhrase('Rank')).toBeNull();
    expect(teamFromPhrase('no')).toBeNull(); // lowercase word, not the NO abbreviation
  });
});

describe('analytical picks: PFT predicted scores', () => {
  it('extracts all 16 straight-up picks with the predicted score', () => {
    const sigs = parseScorePredictions(PFT_PICKS, opts('Pro Football Talk'));
    expect(sigs).toHaveLength(16);
    expect(sigs.every((s) => s.bet_type === 'moneyline')).toBe(true);
    expect(sigs[0]).toMatchObject({ team_or_market: 'Pittsburgh Steelers', lean: 'Steelers to win (predicted 17-13)' });
    expect(sigs.map((s) => s.lean)).toContain('49ers to win (predicted 24-20)');
    expect(sigs.map((s) => s.lean)).toContain('Commanders to win (predicted 24-20)');
    expect(sigs[0].rationale).toContain('margin 4, total 30');
  });
  it('ignores recaps and records ("27-7", "10-6 to 9-7")', () => {
    expect(parseScorePredictions(RECAP, opts('Rotowire NFL'))).toEqual([]);
  });
  it('needs several predictions in one article before treating scores as picks', () => {
    expect(parseScorePredictions('Final: Steelers 17, Browns 13.', opts('Pro Football Talk'))).toEqual([]);
  });
});

describe('analytical picks: Walter Football', () => {
  it('parses the Week N NFL Pick block (score, sides, totals, props, parlays, units)', () => {
    const sigs = parseWalterPicks(WALTER, opts('Walter Football', 0.63));
    const by = Object.fromEntries(sigs.map((s) => [s.lean, s]));
    expect(by['Steelers to win (predicted 20-16)'].bet_type).toBe('moneyline');
    expect(by['Steelers -2.5']).toMatchObject({ bet_type: 'spread' });
    expect(by['Under 38.5']).toMatchObject({ bet_type: 'total', team_or_market: 'PIT vs CLE Under 38.5' });
    expect(by['Pat Freiermuth most receiving yards +1960']).toMatchObject({ bet_type: 'player_prop' });
    expect(by['Pat Freiermuth most receiving yards +1960'].rationale).toContain('0.25 units, FanDuel');
    expect(sigs.filter((s) => s.bet_type === 'parlay_leg')).toHaveLength(2);
    // 0-unit plays are leans: lower confidence than the feed base
    expect(by['Steelers -2.5'].confidence).toBeLessThan(0.63);
  });
  it('does not treat the calculated spread / computer model lines as picks', () => {
    const leans = extractAnalyticalSignals(WALTER, opts('Walter Football', 0.63)).map((s) => s.lean);
    expect(leans).not.toContain('Browns -4.5');
  });
});

describe('analytical picks: gated lines', () => {
  it('keeps best-bet totals and labels the matchup', () => {
    const sigs = extractAnalyticalSignals(SHARP_BEST_BETS, opts('Sharp Football', 0.69));
    expect(sigs.map((s) => s.team_or_market)).toEqual(expect.arrayContaining(['GB @ TB Under 38.5', 'MIA @ MIN Under 39']));
  });
  it('keeps a side only when the sentence reads like a pick', () => {
    expect(parseGatedLines('I like the Packers -3 here.', opts('PFF')).map((s) => s.lean)).toEqual(['Packers -3']);
    expect(parseGatedLines('The Packers are -3 at home.', opts('PFF'))).toEqual([]);
  });
  it('produces nothing from worksheets, stat tables, award odds or recaps', () => {
    for (const [txt, src] of [[SHARP_WORKSHEET, 'Sharp Football'], [ROTOWIRE_STATS, 'Rotowire NFL'], [PFT_AWARD_ODDS, 'Pro Football Talk'], [RECAP, 'Rotowire NFL']]) {
      expect(extractAnalyticalSignals(txt, opts(src))).toEqual([]);
    }
  });
  it('has no title-as-pick fallback', () => {
    expect(extractAnalyticalSignals('Week 4 picks, odds and predictions: everything you need to know.', opts('PFF'))).toEqual([]);
  });
});

describe('caps for slate-wide articles (2026-10-03)', () => {
  it('keeps a pick for every game of a full-slate column (was capped at 8 lines / 16 signals)', () => {
    const G = [['Colts', 'Commanders'], ['Patriots', 'Bills'], ['Jets', 'Bears'], ['Jaguars', 'Bengals'], ['Cardinals', 'Giants'], ['Rams', 'Eagles'],
      ['Packers', 'Buccaneers'], ['Titans', 'Ravens'], ['Cowboys', 'Texans'], ['Dolphins', 'Vikings'], ['Chiefs', 'Raiders'], ['Broncos', '49ers'],
      ['Chargers', 'Seahawks'], ['Lions', 'Panthers'], ['Falcons', 'Saints']];
    const text = G.map(([a, h], i) => `I like the ${a} +${(i % 6) + 2}.5 here. Best bet: ${a} at ${h} Under ${40 + i}.5.`).join(' ');
    const out = extractAnalyticalSignals(text, { source: 'PFF', baseConfidence: 0.65, eventRef: 'u' });
    expect(out.filter((x) => x.bet_type === 'spread')).toHaveLength(15);
    expect(out.filter((x) => x.bet_type === 'total')).toHaveLength(15);
  });
});

describe('betting-feed bodies through the gated parser (2026-10-03)', () => {
  const o = (extra = {}) => ({ source: 'VSiN', baseConfidence: 0.65, eventRef: 'u', scores: false, ...extra });
  const leans = (txt, extra) => extractAnalyticalSignals(txt, o(extra)).map((x) => x.lean);
  it('reads a pick label that ends in a colon', () => {
    expect(leans("### Erickson's Pick: Colts -3.5\n### Trends")).toEqual(['Colts -3.5']);
    expect(leans('Bet: Texans ML (-136)')).toEqual(['Texans ML']);
    expect(leans('Pick: Commanders Moneyline (+160)')).toEqual(['Commanders ML']);
    expect(leans('My Pick: Saints')).toEqual(['Saints ML']);
    expect(leans("Not sure the right team is favored here. I'll take the +2.5 with the Giants")).toEqual(['Giants +2.5']);
  });
  it('drops quoted market lines and past results', () => {
    expect(leans('Best Bet: Patriots +6.5. The advance line was Bills -5.5 but was raised a point.')).toEqual(['Patriots +6.5']);
    expect(leans("We went 4-2 ATS with our best bets in last week's column, with wins on the Steelers +3.5.")).toEqual([]);
    expect(leans('Pick: Under 38.5; Bet to Under 38')).toEqual(['Under 38.5']);
    expect(leans('Current, former and future champions litter the MMA 30 under 30 list. Best bets inside.')).toEqual([]);
  });
  it('uses pick headings only in a column with no inline picks, and carries a header cue to the next lines', () => {
    const column = 'Wes Reynolds offers his Week 4 NFL best bets.\nNew England Patriots +7 at Buffalo Bills\nPerhaps no team is more undervalued.\nTEASER OF THE WEEK\nAtlanta Falcons +8.5/Tampa Bay Buccaneers +9.5\nBEST OF THE REST\nNew York Jets +3.5 at Chicago Bears';
    expect(leans(column, { pickColumn: true, week: 4 })).toEqual(['Patriots +7', 'Falcons +8.5', 'Buccaneers +9.5', 'Jets +3.5']);
    const listing = 'Pittsburgh -3 at Cleveland\nBest Bet: Cleveland +3\nIndianapolis -3.5 vs. Washington\nBest Bet: Pass\nNew England at Buffalo -6.5\nBest Bet: Patriots +6.5 or better';
    expect(leans(listing, { pickColumn: true, week: 4 })).toEqual(['Browns +3', 'Patriots +6.5']);
  });
  it('skips a section about another week', () => {
    expect(leans('Bet: Over 46.5 (-115)\nAdditional Week 3 Best Bets\nJaguars -2.5 (-120) vs. Patriots', { week: 4 })).toEqual(['Over 46.5']);
  });
});

