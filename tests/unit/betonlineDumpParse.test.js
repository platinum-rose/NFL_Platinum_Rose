import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseBetOnlineDump, parsePlayerProps, parseGamePeriods, parseMarketTitle } from '../../scripts/props/betonline-prop-dump-parse.mjs';
import { validateAcceptanceGate, acquireLock, releaseLock } from '../../scripts/props/cron-bol-scrape.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const RAW_DUMP_PATH = path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', '2026-10-09-bol-live-week5.raw.txt');

describe('betonline-prop-dump-parse & acceptance gate', () => {
  it('correctly parses Bhayshul Tutten rushing+receiving prop with team suffix', () => {
    const parsed = parseMarketTitle('Bhayshul Tutten JAC Rushing + Receiving Yards');
    expect(parsed.market).toBe('rush_rec_yds');
    expect(parsed.player).toBe('Bhayshul Tutten');
    expect(parsed.team).toBe('JAC');
  });

  it('correctly parses standard player over/under lines', () => {
    const parsed = parseMarketTitle('Jalen Hurts PHI Passing Yards');
    expect(parsed.market).toBe('pass_yds');
    expect(parsed.player).toBe('Jalen Hurts');
    expect(parsed.team).toBe('PHI');
  });

  it('parses actual live Week 5 raw dump against all Codex quality requirements', () => {
    const rawContent = fs.readFileSync(RAW_DUMP_PATH, 'utf8');
    const { events, allRows, masterPayload } = parseBetOnlineDump(rawContent, '2026-10-10', 5);

    // 1. 14 events matching the remaining Week 5 schedule
    expect(events).toHaveLength(14);
    expect(allRows.length).toBeGreaterThanOrEqual(500);

    // 2. Bhayshul Tutten rushing + receiving rows are classified as rush_rec_yds with team JAC
    const tuttenRows = allRows.filter(r => r.marketTitle && r.marketTitle.includes('Tutten') && r.marketTitle.includes('Rushing +'));
    expect(tuttenRows).toHaveLength(2);
    expect(tuttenRows[0].market).toBe('rush_rec_yds');
    expect(tuttenRows[0].player).toBe('Bhayshul Tutten');
    expect(tuttenRows[0].team).toBe('JAC');
    expect(tuttenRows[0].line).toBe(80.5);

    // 3. Fantasy points rows resolve teams (CMC -> SF, JSN -> SEA)
    const cmcFp = allRows.filter(r => r.market === 'fantasy_points' && r.player === 'Christian McCaffrey');
    expect(cmcFp).toHaveLength(2);
    expect(cmcFp[0].team).toBe('SF');

    const jsnFp = allRows.filter(r => r.market === 'fantasy_points' && r.player === 'Jaxon Smith-Njigba');
    expect(jsnFp).toHaveLength(2);
    expect(jsnFp[0].team).toBe('SEA');

    // 4. Zero fantasy points rows have null team
    const fpNoTeam = allRows.filter(r => r.market === 'fantasy_points' && !r.team);
    expect(fpNoTeam).toHaveLength(0);

    // 5. All 150 team/game props have player: null and specific market keys
    const teamGameProps = allRows.filter(r => ['team_td_total', 'game_td_total', 'team_fg_total', 'game_fg_total', 'game_special'].includes(r.market));
    expect(teamGameProps).toHaveLength(150);
    expect(teamGameProps.every(r => r.player === null)).toBe(true);

    // 6. Zero rows have unknown market
    const unknowns = allRows.filter(r => r.market === 'unknown');
    expect(unknowns).toHaveLength(0);

    // 7. True unique player count is 37 (not inflated by game props)
    expect(masterPayload.summary.players).toBe(37);

    // 8. Cross-book schema compatibility fields (event, sectionTitle, available, and bet)
    expect(allRows.every(r => r.event && r.sectionTitle && r.available === true)).toBe(true);
    expect(allRows.every(r => typeof r.odds === 'number' && !isNaN(r.odds))).toBe(true);
    const validBetTypes = new Set(['spread', 'total', 'moneyline', 'prop', 'special']);
    expect(allRows.every(r => validBetTypes.has(r.bet))).toBe(true);

    // 9. Acceptance gate evaluation
    const targetGames = events.map(e => ({ href: e.eventUrl, teams: e.game }));
    const gate = validateAcceptanceGate({ targetGames, events, allRows, masterPayload });
    expect(gate.passed).toBe(true);
    expect(gate.errors).toHaveLength(0);
  });

  it('acceptance gate catches and blocks malformed data', () => {
    const invalidRows = [
      {
        market: 'pass_yds',
        player: null, // missing player
        odds: null,   // null odds
        team: 'PHI',
      }
    ];

    const gate = validateAcceptanceGate({
      targetGames: [{ teams: 'Test Game' }],
      events: [],
      allRows: invalidRows,
      masterPayload: { summary: { players: 0, markets: 1 } }
    });

    expect(gate.passed).toBe(false);
    expect(gate.errors.length).toBeGreaterThan(0);
  });

  it('atomic process overlap lock prevents concurrent scraper executions', () => {
    const testLockFile = path.join(REPO_ROOT, '.chrome-bol', `test-bol-${Date.now()}.lock`);

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
    const testLockFile = path.join(REPO_ROOT, '.chrome-bol', `test-bol-live-16m-${Date.now()}.lock`);
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
    const testLockFile = path.join(REPO_ROOT, '.chrome-bol', `test-bol-tokens-${Date.now()}.lock`);
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
    const testLockFile = path.join(REPO_ROOT, '.chrome-bol', `test-bol-reclaim-${Date.now()}.lock`);

    try {
      // 1. Malformed JSON lock file is reclaimed
      fs.writeFileSync(testLockFile, 'NOT_VALID_JSON_{{', 'utf8');
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
});
