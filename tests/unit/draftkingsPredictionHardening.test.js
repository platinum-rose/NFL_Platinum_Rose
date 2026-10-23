import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  parseDraftKingsPredictionsDump,
  parseGameLinesSection,
  validateAcceptanceGate,
  isMatchupInWeek,
  resolveGameDate,
  calculateNflWeek,
  localDateString,
  writeFileAtomic,
  loadPreviousMaster,
} from '../../scripts/props/draftkings-prediction-dump-parse.mjs';
import { acquireLock } from '../../scripts/props/cron-dkp-scrape.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RAW = fs.readFileSync(path.join(REPO_ROOT, 'data', 'research-intel', 'source-evidence', '2026-10-10-dkp-live-week5.raw.txt'), 'utf8');
const CAPTURED = '2026-10-10T16:23:47.127Z'; // Sat Oct 10, 9:23 AM Pacific

const parseLive = (week, raw = RAW) => parseDraftKingsPredictionsDump(raw, '2026-10-10', week);
const gateOf = (r, extra = {}) => validateAcceptanceGate({ events: r.events, allRows: r.allRows, masterPayload: r.masterPayload, ...extra });
const tmpLock = (name) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dkp-lock-')), name);

describe('relative dates & fail-closed week filter', () => {
  it('resolves Today/Tomorrow against capturedAt in Pacific time', () => {
    expect(isMatchupInWeek('Tomorrow 10:00 AM', 5, 2026, { capturedAt: CAPTURED })).toBe(true);   // Sun Oct 11
    expect(isMatchupInWeek('Tomorrow 10:00 AM', 6, 2026, { capturedAt: CAPTURED })).toBe(false);
    // Monday 6 PM Pacific = Tuesday 01:00Z. "Today" is still Mon Oct 12 => Week 5, not Week 6
    expect(isMatchupInWeek('Today 5:15 PM', 5, 2026, { capturedAt: '2026-10-13T01:00:00Z' })).toBe(true);
    expect(isMatchupInWeek('Today 5:15 PM', 6, 2026, { capturedAt: '2026-10-13T01:00:00Z' })).toBe(false);
  });

  it('fails closed on missing or unparseable dates', () => {
    expect(isMatchupInWeek('', 5)).toBe(false);
    expect(isMatchupInWeek('TBD', 5)).toBe(false);
    expect(isMatchupInWeek('Today 5:15 PM', 5)).toBe(false);          // relative label but no capture time
    expect(resolveGameDate('Thu Oct 15th 5:15 PM')?.toISOString()).toBe('2026-10-15T12:00:00.000Z');
    expect(isMatchupInWeek('', null)).toBe(true);                     // no week requested => no filtering
  });

  it('computes NFL week on the local calendar, not UTC', () => {
    expect(calculateNflWeek(new Date('2026-10-13T00:30:00Z'))).toBe(5); // Mon Oct 12 5:30 PM PDT (UTC says Tue)
    expect(calculateNflWeek(new Date('2026-10-13T03:00:00Z'))).toBe(5); // Mon 8 PM PDT
    expect(calculateNflWeek(new Date('2026-10-13T15:00:00Z'))).toBe(6); // Tue 8 AM PDT
    expect(localDateString(new Date('2026-10-11T03:00:00Z'))).toBe('2026-10-10'); // Sat 8 PM PDT
  });

  it('live board: Week 5 = 14 games, none undated', () => {
    const r = parseLive(5);
    expect(r.events).toHaveLength(14);
    expect(r.unresolvedDateEvents).toEqual([]);
    expect(r.events.every(e => e.startTime)).toBe(true);
    expect(gateOf(r, { expectedGames: 14 }).passed).toBe(true);
  });

  it('live board: Week 6 parse does not leak undated Week 5 games', () => {
    const r = parseLive(6);
    const names = r.events.map(e => e.event);
    expect(names).not.toContain('PHI Eagles @ JAX Jaguars');
    expect(names).not.toContain('BUF Bills @ LA Rams');
    expect(names).toContain('SEA Seahawks @ DEN Broncos');
    expect(r.events).toHaveLength(12);
  });

  it('undated matchup is reported and fails the gate', () => {
    const text = `PHI Eagles\nAT\nJAX Jaguars\n+7.5\n50%\nO\n42.5\n49%\n24%\n-7.5\n51%\nU\n42.5\n52%\n78%\nMore Markets\n`;
    const { events, unresolvedDateEvents } = parseGameLinesSection(text, 5);
    expect(events).toHaveLength(0);
    expect(unresolvedDateEvents).toEqual(['PHI Eagles @ JAX Jaguars']);
    const r = parseDraftKingsPredictionsDump(text, '2026-10-10', 5);
    const gate = gateOf(r, { expectTd: false });
    expect(gate.passed).toBe(false);
    expect(gate.errors.join(' ')).toMatch(/no resolvable start date/);
  });
});

describe('acceptance gate hardening', () => {
  it('rejects a capture whose TD board failed to load (lines-only)', () => {
    const noTd = RAW.replace(/SECTION_START\|TD_SCORERS\n[\s\S]*?\nSECTION_END\|TD_SCORERS/, 'SECTION_START|TD_SCORERS\nSomething went wrong\nSECTION_END|TD_SCORERS');
    const r = parseLive(5, noTd);
    expect(r.events).toHaveLength(14);
    const gate = gateOf(r);
    expect(gate.passed).toBe(false);
    expect(gate.errors.join(' ')).toMatch(/TD scorer market missing/);
    expect(gateOf(r, { expectTd: false }).passed).toBe(true);      // explicit --no-td opt-out
  });

  it('rejects a capture that shrank vs the last good master unless allowed', () => {
    const r = parseLive(5);
    const previous = { file: 'prev.json', games: 20, rows: 1500, players: 400 };
    const gate = gateOf(r, { previous });
    expect(gate.passed).toBe(false);
    expect(gate.errors.join(' ')).toMatch(/shrank vs last good master/);
    expect(gateOf(r, { previous, allowShrink: true }).passed).toBe(true);
    expect(gateOf(r, { previous: { games: 14, rows: 1003, players: 307 } }).passed).toBe(true);
  });

  it('rejects player teams that are not in the game (stale roster / alias)', () => {
    const r = parseLive(5);
    const td = r.allRows.find(x => x.market === 'atd_1_plus' && x.event === 'PHI Eagles @ JAX Jaguars');
    const original = td.team;
    td.team = 'KC';
    const gate = gateOf(r);
    td.team = original;
    expect(gate.passed).toBe(false);
    expect(gate.errors.join(' ')).toMatch(/team is not in the game/);
  });

  it('loadPreviousMaster picks the newest promoted master for the week', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dkp-prev-'));
    fs.writeFileSync(path.join(dir, 'draftkings-predictions-live-2026-10-09-week5.json'), JSON.stringify({ summary: { games: 3, rows: 10, players: 1 } }));
    fs.writeFileSync(path.join(dir, 'draftkings-predictions-live-2026-10-10-week5.raw.txt'), 'x');
    expect(loadPreviousMaster(5, dir)).toMatchObject({ games: 3, rows: 10 });
    expect(loadPreviousMaster(6, dir)).toBeNull();
  });
});

describe('lock hardening & atomic writes', () => {
  const lockPayload = (extra = {}) => JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), token: randomUUID(), ...extra });

  it('reclaims a lock whose PID was reused by a non-node process', () => {
    const f = tmpLock('reuse.lock');
    fs.writeFileSync(f, lockPayload());
    const t = acquireLock(f, { exitOnBusy: false, imageNameLookup: () => 'chrome.exe' });
    expect(typeof t).toBe('string');
  });

  it('reclaims a lock whose PID no longer exists (lookup says null)', () => {
    const f = tmpLock('gone.lock');
    fs.writeFileSync(f, lockPayload());
    expect(typeof acquireLock(f, { exitOnBusy: false, imageNameLookup: () => null })).toBe('string');
  });

  it('keeps a lock held by a live node process (and when the name lookup is unavailable)', () => {
    const f = tmpLock('live.lock');
    fs.writeFileSync(f, lockPayload());
    expect(acquireLock(f, { exitOnBusy: false, imageNameLookup: () => 'node.exe' })).toBeNull();
    expect(acquireLock(f, { exitOnBusy: false, imageNameLookup: () => undefined })).toBeNull();
    expect(fs.existsSync(f)).toBe(true);
  });

  it('reclaims a "live" lock older than the max age cap, refuses one inside it', () => {
    const f = tmpLock('old.lock');
    fs.writeFileSync(f, lockPayload({ startedAt: new Date(Date.now() - 120 * 60000).toISOString() }));
    expect(typeof acquireLock(f, { exitOnBusy: false, imageNameLookup: () => 'node.exe' })).toBe('string');
    const g = tmpLock('young.lock');
    fs.writeFileSync(g, lockPayload({ startedAt: new Date(Date.now() - 30 * 60000).toISOString() }));
    expect(acquireLock(g, { exitOnBusy: false, imageNameLookup: () => 'node.exe' })).toBeNull();
  });

  it('writeFileAtomic replaces content and leaves no temp files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dkp-atomic-'));
    const f = path.join(dir, 'out.json');
    writeFileAtomic(f, '{"a":1}');
    writeFileAtomic(f, '{"a":2}');
    expect(fs.readFileSync(f, 'utf8')).toBe('{"a":2}');
    expect(fs.readdirSync(dir)).toEqual(['out.json']);
  });
});

describe('register-dkp-cron.ps1 safety', () => {
  const ps1 = fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'props', 'register-dkp-cron.ps1'), 'utf8');
  it('stops on errors, replaces in one call, and never unregisters first', () => {
    expect(ps1).toMatch(/\$ErrorActionPreference = 'Stop'/);
    expect(ps1).not.toMatch(/Unregister-ScheduledTask/);
    expect(ps1).toMatch(/Register-ScheduledTask[\s\S]*-Force/);
    expect(ps1).toMatch(/-not \(\$Overwrite -or \$Force\)/);
    expect(ps1).toMatch(/exit 1/);
  });
});
