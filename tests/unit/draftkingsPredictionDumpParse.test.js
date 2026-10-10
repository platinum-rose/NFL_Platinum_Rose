import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  parseDraftKingsPredictionsDump,
  parseGameLinesSection,
  parseTdScorersSection,
  parseProbabilityToAmericanOdds,
  resolveTeamForPlayer,
  validateAcceptanceGate,
  isMatchupInWeek,
  PLAYER_ALIAS_MAP,
} from '../../scripts/props/draftkings-prediction-dump-parse.mjs';
import { acquireLock, releaseLock } from '../../scripts/props/cron-dkp-scrape.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

describe('draftkings-prediction-dump-parse & acceptance gate', () => {
  it('correctly converts contract probability percentages to American odds', () => {
    expect(parseProbabilityToAmericanOdds(50)).toBe(100);
    expect(parseProbabilityToAmericanOdds('50%')).toBe(100);
    expect(parseProbabilityToAmericanOdds('24%')).toBe(317);
    expect(parseProbabilityToAmericanOdds('78%')).toBe(-355);
    expect(parseProbabilityToAmericanOdds('51%')).toBe(-104);
    expect(parseProbabilityToAmericanOdds('49%')).toBe(104);
    expect(parseProbabilityToAmericanOdds('0%')).toBeNull();
    expect(parseProbabilityToAmericanOdds('100%')).toBeNull();
  });

  it('resolves player team correctly from known roster mapping', () => {
    const jacTeam = resolveTeamForPlayer('Trevor Lawrence', 'PHI Eagles', 'JAX Jaguars');
    expect(jacTeam).toBe('JAX');

    const phiTeam = resolveTeamForPlayer('Jalen Hurts', 'PHI Eagles', 'JAX Jaguars');
    expect(phiTeam).toBe('PHI');
  });

  it('correctly parses game lines and filters advance weeks', () => {
    const sampleGameLines = `
SUN OCT 11th
Spread
Total Points
To Win
PHI Eagles
AT
JAX Jaguars
+7.5
50%
O
42.5
49%
24%
-7.5
51%
U
42.5
52%
78%
Sun Oct 11th 6:30 AM
More Markets
THU OCT 15th
Spread
Total Points
To Win
SEA Seahawks
AT
DEN Broncos
-1.5
53%
O
42.5
53%
57%
-1.5
54%
U
42.5
55%
50%
Thu Oct 15th 5:15 PM
More Markets
`;

    const { events, rows } = parseGameLinesSection(sampleGameLines, 5);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('PHI Eagles @ JAX Jaguars');
    expect(rows).toHaveLength(6);

    const awaySpread = rows.find(r => r.bet === 'spread' && r.side === 'PHI');
    expect(awaySpread.line).toBe(7.5);
    expect(awaySpread.price).toBe(50);
    expect(awaySpread.probability).toBe(0.50);
    expect(awaySpread.odds).toBe(100);

    const overTotal = rows.find(r => r.bet === 'total' && r.side === 'Over');
    expect(overTotal.line).toBe(42.5);
    expect(overTotal.price).toBe(49);
    expect(overTotal.odds).toBe(104);

    const homeMl = rows.find(r => r.bet === 'moneyline' && r.side === 'JAX');
    expect(homeMl.price).toBe(78);
    expect(homeMl.odds).toBe(-355);
  });

  it('correctly parses touchdown scorer prediction markets', () => {
    const sampleTdText = `
PHI Eagles
AT
JAX Jaguars
Sun Oct 11th 6:30 AM
Anytime TD Scorer
First TD Scorer
2+ TDs
Bhayshul Tuten
2026 TD:
0
1
2
3
4
5
6
7
8
9
48%
17%
14%
`;

    const rows = parseTdScorersSection(sampleTdText);
    expect(rows).toHaveLength(3);

    const atd = rows.find(r => r.market === 'atd_1_plus');
    expect(atd.player).toBe('Bhayshul Tuten');
    expect(atd.price).toBe(48);
    expect(atd.probability).toBe(0.48);
    expect(atd.odds).toBe(108);
    expect(atd.line).toBe(0.5);

    const firstTd = rows.find(r => r.market === 'first_td');
    expect(firstTd.player).toBe('Bhayshul Tuten');
    expect(firstTd.price).toBe(17);
    expect(firstTd.probability).toBe(0.17);
    expect(firstTd.odds).toBe(488);

    const twoPlus = rows.find(r => r.market === 'two_plus_td');
    expect(twoPlus.player).toBe('Bhayshul Tuten');
    expect(twoPlus.price).toBe(14);
    expect(twoPlus.probability).toBe(0.14);
    expect(twoPlus.odds).toBe(614);
    expect(twoPlus.line).toBe(1.5);
  });

  it('acceptance gate catches and blocks malformed data', () => {
    const invalidRows = [
      {
        market: 'game_lines',
        player: 'Not Null Player', // Invalid: game lines cannot have player
        odds: null,                // Invalid: null odds
        price: 150,                // Invalid: price > 100
      }
    ];

    const gate = validateAcceptanceGate({
      events: [{ event: 'Test' }],
      allRows: invalidRows,
      masterPayload: { summary: { players: 0, markets: 1, by_market: {} } }
    });

    expect(gate.passed).toBe(false);
    expect(gate.errors.length).toBeGreaterThan(0);
  });

  it('atomic process overlap lock prevents concurrent scraper executions', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-dkp', `test-dkp-${Date.now()}.lock`);

    try {
      // 1. Initial acquisition succeeds and returns an ownership token
      const token1 = acquireLock(testLockFile, { exitOnBusy: false });
      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
      expect(fs.existsSync(testLockFile)).toBe(true);

      // 2. Concurrent acquisition while lock is active fails atomically
      const token2 = acquireLock(testLockFile, { exitOnBusy: false });
      expect(token2).toBeNull();

      // 3. Release lock cleans up file when token matches
      const released = releaseLock(testLockFile, token1);
      expect(released).toBe(true);
      expect(fs.existsSync(testLockFile)).toBe(false);
    } finally {
      if (fs.existsSync(testLockFile)) {
        fs.unlinkSync(testLockFile);
      }
    }
  });

  it('live lock older than 15 minutes is refused', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-dkp', `test-dkp-live-16m-${Date.now()}.lock`);
    const livePid = process.pid; // current process is definitely alive
    const oldStartedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 minutes old
    const existingToken = randomUUID();

    try {
      fs.writeFileSync(testLockFile, JSON.stringify({
        pid: livePid,
        startedAt: oldStartedAt,
        token: existingToken,
      }, null, 2), 'utf8');

      // Attempt acquisition on a 20-minute old lock held by a live PID: MUST be refused
      const result = acquireLock(testLockFile, { exitOnBusy: false });
      expect(result).toBeNull();

      // Ensure the existing live lock was NOT deleted, stolen, or overwritten
      expect(fs.existsSync(testLockFile)).toBe(true);
      const remaining = JSON.parse(fs.readFileSync(testLockFile, 'utf8'));
      expect(remaining.token).toBe(existingToken);
      expect(remaining.pid).toBe(livePid);
    } finally {
      if (fs.existsSync(testLockFile)) {
        fs.unlinkSync(testLockFile);
      }
    }
  });

  it('old owner cannot release a newer owner’s lock', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-dkp', `test-dkp-tokens-${Date.now()}.lock`);
    const tokenOld = randomUUID();
    const tokenNew = randomUUID();

    try {
      // Simulate newer owner's active lock file
      fs.writeFileSync(testLockFile, JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
        token: tokenNew,
      }, null, 2), 'utf8');

      // Old owner attempts to release with their old token
      const releasedByOld = releaseLock(testLockFile, tokenOld);
      expect(releasedByOld).toBe(false);
      expect(fs.existsSync(testLockFile)).toBe(true);

      // Verify lock still belongs to new owner
      const current = JSON.parse(fs.readFileSync(testLockFile, 'utf8'));
      expect(current.token).toBe(tokenNew);

      // Proper new owner releases with matching token
      const releasedByNew = releaseLock(testLockFile, tokenNew);
      expect(releasedByNew).toBe(true);
      expect(fs.existsSync(testLockFile)).toBe(false);
    } finally {
      if (fs.existsSync(testLockFile)) {
        fs.unlinkSync(testLockFile);
      }
    }
  });

  it('reclaims lock when PID is dead or lock is malformed', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-dkp', `test-dkp-reclaim-${Date.now()}.lock`);

    try {
      // 1. Malformed JSON lock file is reclaimed
      fs.writeFileSync(testLockFile, 'INVALID_NOT_JSON_{{', 'utf8');
      const token1 = acquireLock(testLockFile, { exitOnBusy: false });
      expect(typeof token1).toBe('string');
      expect(releaseLock(testLockFile, token1)).toBe(true);

      // 2. Dead PID lock file is reclaimed
      fs.writeFileSync(testLockFile, JSON.stringify({
        pid: 99999999, // Dead PID
        startedAt: new Date().toISOString(),
        token: randomUUID(),
      }), 'utf8');
      const token2 = acquireLock(testLockFile, { exitOnBusy: false });
      expect(typeof token2).toBe('string');
      expect(releaseLock(testLockFile, token2)).toBe(true);
    } finally {
      if (fs.existsSync(testLockFile)) {
        fs.unlinkSync(testLockFile);
      }
    }
  });

  it('treats Windows EPERM as alive process and refuses duplicate lock', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-dkp', `test-dkp-eperm-${Date.now()}.lock`);
    const foreignPid = 12345;
    const token = randomUUID();

    // Mock process.kill to throw EPERM for this PID
    const origKill = process.kill;
    try {
      fs.writeFileSync(testLockFile, JSON.stringify({
        pid: foreignPid,
        startedAt: new Date().toISOString(),
        token,
      }, null, 2), 'utf8');

      process.kill = (pid, sig) => {
        if (pid === foreignPid) {
          const err = new Error('operation not permitted');
          err.code = 'EPERM';
          throw err;
        }
        return origKill(pid, sig);
      };

      const result = acquireLock(testLockFile, { exitOnBusy: false });
      expect(result).toBeNull(); // Must be refused because process is alive!
      expect(fs.existsSync(testLockFile)).toBe(true);
    } finally {
      process.kill = origKill;
      if (fs.existsSync(testLockFile)) {
        fs.unlinkSync(testLockFile);
      }
    }
  });

  it('isMatchupInWeek correctly anchors Tuesday-to-Monday NFL game weeks', () => {
    // Week 5 is Tue Oct 6 to Mon Oct 12, 2026
    expect(isMatchupInWeek('Sun Oct 11th 6:30 AM', 5)).toBe(true);
    expect(isMatchupInWeek('Sun Oct 11th 1:25 PM', 5)).toBe(true);
    expect(isMatchupInWeek('Mon Oct 12th 5:15 PM', 5)).toBe(true);

    // Week 6 matchups should be rejected for Week 5
    expect(isMatchupInWeek('Thu Oct 15th 5:15 PM', 5)).toBe(false);
    expect(isMatchupInWeek('Sun Oct 18th 10:00 AM', 5)).toBe(false);
    expect(isMatchupInWeek('Mon Oct 19th 5:15 PM', 5)).toBe(false);

    // Week 6 matchups accepted for Week 6
    expect(isMatchupInWeek('Thu Oct 15th 5:15 PM', 6)).toBe(true);
    expect(isMatchupInWeek('Sun Oct 18th 10:00 AM', 6)).toBe(true);
    expect(isMatchupInWeek('Mon Oct 19th 5:15 PM', 6)).toBe(true);
  });

  it('resolves all known player alias variations and strictly returns null for unknown players', () => {
    // Suffix and nickname variations
    expect(resolveTeamForPlayer('James Cook', 'BUF Bills', 'LA Rams')).toBe('BUF');
    expect(resolveTeamForPlayer('Aaron Jones', 'MIN Vikings', 'NO Saints')).toBe('MIN');
    expect(resolveTeamForPlayer('Deebo Samuel', 'SF 49ers', 'SEA Seahawks')).toBe('SF');
    expect(resolveTeamForPlayer('Marvin Mims', 'DEN Broncos', 'LA Chargers')).toBe('DEN');
    expect(resolveTeamForPlayer('Erick All', 'CIN Bengals', 'MIA Dolphins')).toBe('CIN');
    expect(resolveTeamForPlayer('LeQuint Allen', 'PHI Eagles', 'JAX Jaguars')).toBe('JAX');
    expect(resolveTeamForPlayer('A.J. Barner', 'SF 49ers', 'SEA Seahawks')).toBe('SEA');
    expect(resolveTeamForPlayer('Chigoziem Okonkwo', 'NY Giants', 'WAS Commanders')).toBe('WAS');
    expect(resolveTeamForPlayer('Demario Douglas', 'LV Raiders', 'NE Patriots')).toBe('NE');
    expect(resolveTeamForPlayer('Cameron Ward', 'HOU Texans', 'TEN Titans')).toBe('TEN');
    expect(resolveTeamForPlayer('Cameron Skattebo', 'NY Giants', 'WAS Commanders')).toBe('NYG');
    expect(resolveTeamForPlayer('Andrew Ogletree', 'IND Colts', 'PIT Steelers')).toBe('IND');
    expect(resolveTeamForPlayer('Tre Harris', 'DEN Broncos', 'LA Chargers')).toBe('LAC');
    expect(resolveTeamForPlayer('Zonovan Knight', 'DET Lions', 'ARI Cardinals')).toBe('ARI');
    expect(resolveTeamForPlayer("Lil'Jordan Humphrey", 'DEN Broncos', 'LA Chargers')).toBe('DEN');
    expect(resolveTeamForPlayer('Oronde Gadsden II', 'DEN Broncos', 'LA Chargers')).toBe('LAC');
    expect(resolveTeamForPlayer('Kaytron Allen', 'NY Giants', 'WAS Commanders')).toBe('WAS');

    // Unknown player must NEVER fallback to away or home team
    expect(resolveTeamForPlayer('Unknown Nonexistent Player', 'PHI Eagles', 'JAX Jaguars')).toBeNull();
  });

  it('acceptance gate strictly rejects player props with unresolved/null team', () => {
    const invalidProps = [
      {
        market: 'atd_1_plus',
        player: 'Unmapped Player',
        team: null, // Unresolved team
        odds: 150,
        price: 40,
      }
    ];

    const gate = validateAcceptanceGate({
      events: [{ event: 'PHI Eagles @ JAX Jaguars' }],
      allRows: invalidProps,
      masterPayload: { summary: { players: 1, markets: 1, by_market: {} } },
      expectedGames: 1,
    });

    expect(gate.passed).toBe(false);
    expect(gate.errors.some(e => e.includes('unresolved/null team'))).toBe(true);
  });

  it('parses live Week 5 raw dump: 14 games, 1004 rows, 0 null teams, and passes acceptance gate', () => {
    const rawPath = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', '2026-10-10-dkp-live-week5.raw.txt');
    const rawContent = fs.readFileSync(rawPath, 'utf8');

    const { events, allRows, masterPayload } = parseDraftKingsPredictionsDump(rawContent, '2026-10-10', 5);

    expect(events).toHaveLength(14);
    expect(allRows.length).toBeGreaterThanOrEqual(1000);
    expect(masterPayload.capturedAt).toBeDefined();
    expect(masterPayload.marketType).toBe('prediction_contract');
    expect(masterPayload.contractContext).toBeDefined();

    // Verify all player rows have a valid team
    const playerRows = allRows.filter(r => r.player);
    expect(playerRows.length).toBeGreaterThan(900);
    const nullTeamRows = playerRows.filter(r => !r.team);
    expect(nullTeamRows).toHaveLength(0);

    const gate = validateAcceptanceGate({ events, allRows, masterPayload, expectedGames: 14 });
    expect(gate.passed).toBe(true);
    expect(gate.errors).toHaveLength(0);
    expect(gate.stats.unresolvedTeams).toBe(0);
  });
});
