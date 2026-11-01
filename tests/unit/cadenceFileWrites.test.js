import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { writeFileAtomic } from '../../scripts/lib/atomic-file-write.js';
import { writeAvailabilitySnapshotAndReports } from '../../scripts/build-player-availability.js';
import { buildAvailabilitySnapshot } from '../../agents/lib/player-availability.js';
import { loadLockedLines, rowsToEvents, syncLiveMarketLines } from '../../scripts/sync-live-market-lines.mjs';

let dir;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nfl-cadence-write-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => {
  vi.restoreAllMocks();
  expect(path.dirname(path.resolve(dir))).toBe(path.resolve(os.tmpdir()));
  expect(path.basename(dir)).toMatch(/^nfl-cadence-write-/);
  await fs.rm(dir, { recursive: true, force: true });
});
const failure = code => Object.assign(new Error(`simulated ${code}`), { code });

describe('atomic report writes under Windows sharing failures', () => {
  it('keeps the old file intact during a transient rename lock, then publishes complete UTF-8', async () => {
    const target = path.join(dir, 'latest.md');
    await fs.writeFile(target, 'previous complete report');
    let calls = 0;
    const rename = vi.fn(async (from, to) => {
      expect(await fs.readFile(target, 'utf8')).toBe('previous complete report');
      expect(path.dirname(from)).toBe(dir);
      if (++calls < 3) throw failure(calls === 1 ? 'UNKNOWN' : 'EBUSY');
      return fs.rename(from, to);
    });
    const wait = vi.fn();
    await writeFileAtomic(target, 'new report — complete', { io: { ...fs, rename }, platform: 'win32', wait });
    expect(rename).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls.map(c => c[0])).toEqual([50, 100]);
    expect(await fs.readFile(target, 'utf8')).toBe('new report — complete');
    expect(await fs.readdir(dir)).toEqual(['latest.md']);
  });

  it('retries a transient temporary-file open failure', async () => {
    let calls = 0;
    const writeFile = vi.fn(async (...args) => {
      if (++calls === 1) throw failure('UNKNOWN');
      return fs.writeFile(...args);
    });
    await writeFileAtomic(path.join(dir, 'new.json'), '{"complete":true}', {
      io: { ...fs, writeFile }, platform: 'win32', wait: vi.fn(),
    });
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(await fs.readFile(path.join(dir, 'new.json'), 'utf8')).toBe('{"complete":true}');
  });

  it.each(['UNKNOWN', 'EPERM', 'EACCES'])('bounds retries and preserves the existing report for persistent %s', async code => {
    const target = path.join(dir, 'latest.json');
    await fs.writeFile(target, 'old complete data');
    const error = failure(code);
    const rename = vi.fn().mockRejectedValue(error);
    await expect(writeFileAtomic(target, 'replacement', {
      io: { ...fs, rename }, platform: 'win32', retries: 2, wait: vi.fn(),
    })).rejects.toBe(error);
    expect(rename).toHaveBeenCalledTimes(3);
    expect(await fs.readFile(target, 'utf8')).toBe('old complete data');
    expect(await fs.readdir(dir)).toEqual(['latest.json']);
  });

  it('does not retry non-sharing failures or suppress them', async () => {
    const writeFile = vi.fn().mockRejectedValue(failure('ENOSPC'));
    const wait = vi.fn();
    await expect(writeFileAtomic(path.join(dir, 'new.json'), 'x', {
      io: { ...fs, writeFile }, platform: 'win32', wait,
    })).rejects.toMatchObject({ code: 'ENOSPC' });
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });
});

describe('availability output completion', () => {
  const snapshot = () => buildAvailabilitySnapshot({ season: 2026, generatedAt: '2026-10-29T15:34:34.134Z' });
  it('writes matching dated/latest views without fetching or changing source timestamps', async () => {
    const outputs = await writeAvailabilitySnapshotAndReports(snapshot(), {
      outDir: path.join(dir, 'data'), docsDir: path.join(dir, 'docs'),
    });
    const saved = JSON.parse(await fs.readFile(outputs.latestPath, 'utf8'));
    expect(saved.meta.generated_at).toBe('2026-10-29T15:34:34.134Z');
    expect(await fs.readFile(outputs.mdPath, 'utf8')).toBe(await fs.readFile(outputs.latestMdPath, 'utf8'));
    expect(await fs.readFile(outputs.htmlPath, 'utf8')).toBe(await fs.readFile(outputs.latestHtmlPath, 'utf8'));
    expect(await fs.readFile(outputs.jsonPath, 'utf8')).toBe(await fs.readFile(outputs.latestPath, 'utf8'));
  });

  it('does not advance latest JSON if a view cannot be published', async () => {
    const outDir = path.join(dir, 'data'), docsDir = path.join(dir, 'docs');
    await fs.mkdir(outDir); await fs.mkdir(docsDir);
    await fs.writeFile(path.join(outDir, 'latest.json'), '{"prior":true}');
    await fs.mkdir(path.join(docsDir, 'player-availability-latest.html'));
    await expect(writeAvailabilitySnapshotAndReports(snapshot(), { outDir, docsDir })).rejects.toThrow();
    expect(await fs.readFile(path.join(outDir, 'latest.json'), 'utf8')).toBe('{"prior":true}');
  });
});

describe('SuperContest week gate before market access', () => {
  const game = { favorite_abbr: 'GB', underdog_abbr: 'CAR', contest_line: -3.5, away_team: 'Carolina Panthers', home_team: 'Green Bay Packers' };
  const sheet = (week, season = 2026, games = [game]) => ({ week, season, captured_at: '2026-10-29T15:00:00Z', games });
  const save = (name, value) => fs.writeFile(path.join(dir, name), JSON.stringify(value));

  it('stops before any market request and preserves the old comparison if only Week 7 is saved', async () => {
    await save('latest.json', sheet(7));
    await save('live-market-comparison.json', { old: true });
    const loadMarketData = vi.fn();
    await expect(syncLiveMarketLines({ now: new Date('2026-10-29T16:00:00Z'), scDir: dir, loadMarketData }))
      .rejects.toMatchObject({ code: 'SUPERCONTEST_WEEK_MISSING', message: expect.stringContaining('Week 8') });
    expect(loadMarketData).not.toHaveBeenCalled();
    expect(JSON.parse(await fs.readFile(path.join(dir, 'live-market-comparison.json'), 'utf8'))).toEqual({ old: true });
  });

  it('selects the exact current season/week even when latest points elsewhere', async () => {
    await save('latest.json', sheet(9));
    await save('week-08-lines.json', sheet(8));
    expect((await loadLockedLines({ scDir: dir, week: 8, season: 2026 })).week).toBe(8);
  });

  it('rejects an empty current sheet and an older-season sheet', async () => {
    await save('latest.json', sheet(8, 2025));
    await save('week-08-lines.json', sheet(8, 2026, []));
    await expect(loadLockedLines({ scDir: dir, week: 8, season: 2026 })).rejects.toMatchObject({ code: 'SUPERCONTEST_WEEK_MISSING' });
  });

  it('writes the correct current-week comparison using only injected saved market rows', async () => {
    await save('week-08-lines.json', sheet(8));
    const loadMarketData = vi.fn().mockResolvedValue({
      oddsCapturedAt: '2026-10-29T15:00:00Z', quotaRemaining: null,
      events: rowsToEvents([{ game_id: '2026_08_CAR_GB', home_team: 'GB', away_team: 'CAR', book: 'draftkings', market: 'spread', spread: -4, home_price: -110, away_price: -110, commence_time: '2026-10-30T00:15:00Z' }]),
    });
    const result = await syncLiveMarketLines({ now: new Date('2026-10-29T16:00:00Z'), scDir: dir, loadMarketData });
    expect(result.supercontest_week).toBe(8);
    expect(result.games[0].clv_points_fav).toBe(0.5);
    expect(JSON.parse(await fs.readFile(path.join(dir, 'live-market-comparison.json'), 'utf8'))).toEqual(result);
  });
});
