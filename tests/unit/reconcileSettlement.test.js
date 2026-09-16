import { describe, it, expect } from 'vitest';

describe('reconcile-settlement unit logic', () => {
  // Test helper replicating grading math
  function gradeLeg(leg, box) {
    const { market, line, selection, player, team } = leg;
    if (market === 'spread') {
      const isHome = team === box.homeTeam || selection.toLowerCase().includes(box.homeTeam.toLowerCase());
      const teamScore = isHome ? box.homeScore : box.awayScore;
      const oppScore = isHome ? box.awayScore : box.homeScore;
      const margin = teamScore - oppScore;
      const effSpread = line ?? 0;
      if (margin + effSpread > 0) return 'WON';
      if (margin + effSpread === 0) return 'PUSH';
      return 'LOST';
    } else if (market === 'total') {
      const isUnder = selection.toLowerCase().includes('under');
      if (isUnder) {
        return box.totalPoints < line ? 'WON' : box.totalPoints === line ? 'PUSH' : 'LOST';
      } else {
        return box.totalPoints > line ? 'WON' : box.totalPoints === line ? 'PUSH' : 'LOST';
      }
    } else if (market === 'anytime_touchdown') {
      const actual = leg.mockActual ?? 0;
      return actual >= 1 ? 'WON' : 'LOST';
    }
    return 'PENDING';
  }

  function calculateAlejandroSplit(tickets) {
    let costShare = 0;
    let cashedShare = 0;

    for (const t of tickets) {
      if (!t.isSplit) continue;
      const cashStake = t.isPromo ? 0 : t.stake;
      costShare += cashStake * 0.5;
      if (t.result === 'win') {
        cashedShare += t.payout * 0.5;
      }
    }

    const netBalance = cashedShare - costShare;
    return {
      costShare,
      cashedShare,
      netBalance,
      summary: netBalance < 0 ? `Alejandro owes Andy $${Math.abs(netBalance).toFixed(2)}` : `Andy owes Alejandro $${netBalance.toFixed(2)}`
    };
  }

  it('grades spread wagers correctly with underdog points added', () => {
    const box = { homeTeam: 'LAR', awayTeam: 'SF', homeScore: 7, awayScore: 17, totalPoints: 24 };
    const leg = { market: 'spread', line: 4.0, selection: 'San Francisco 49ers +4', team: 'SF' };
    expect(gradeLeg(leg, box)).toBe('WON');
  });

  it('grades totals correctly for under bets', () => {
    const box = { homeTeam: 'LAR', awayTeam: 'SF', homeScore: 7, awayScore: 17, totalPoints: 24 };
    const leg = { market: 'total', line: 48.0, selection: 'Under 48' };
    expect(gradeLeg(leg, box)).toBe('WON');
  });

  it('grades totals correctly for over bets that fail', () => {
    const box = { homeTeam: 'LAR', awayTeam: 'SF', homeScore: 7, awayScore: 17, totalPoints: 24 };
    const leg = { market: 'total', line: 48.0, selection: 'Over 48' };
    expect(gradeLeg(leg, box)).toBe('LOST');
  });

  it('grades anytime TD correctly when 1+ scored', () => {
    const box = { homeTeam: 'LAR', awayTeam: 'SF', homeScore: 7, awayScore: 17, totalPoints: 24 };
    const leg = { market: 'anytime_touchdown', player: 'Kyren Williams', mockActual: 1 };
    expect(gradeLeg(leg, box)).toBe('WON');
  });

  it('calculates Alejandro 50/50 split with zero cash risk on promo credits', () => {
    const tickets = [
      { id: 't1', isSplit: true, isPromo: false, stake: 10.00, payout: 87.50, result: 'loss' },
      { id: 't2', isSplit: true, isPromo: true, stake: 9.95, payout: 49.00, result: 'loss' },
      { id: 't3', isSplit: false, isPromo: false, stake: 15.00, payout: 41.70, result: 'loss' },
    ];

    const split = calculateAlejandroSplit(tickets);
    expect(split.costShare).toBe(5.00); // Only 50% of t1 ($10 cash), t2 is $0 cash
    expect(split.cashedShare).toBe(0.00);
    expect(split.netBalance).toBe(-5.00);
    expect(split.summary).toBe('Alejandro owes Andy $5.00');
  });

  it('calculates Alejandro 50/50 split with winning ticket payout credit', () => {
    const tickets = [
      { id: 't1', isSplit: true, isPromo: false, stake: 10.00, payout: 50.00, result: 'win' }
    ];

    const split = calculateAlejandroSplit(tickets);
    expect(split.costShare).toBe(5.00);
    expect(split.cashedShare).toBe(25.00);
    expect(split.netBalance).toBe(20.00);
    expect(split.summary).toBe('Andy owes Alejandro $20.00');
  });
});
