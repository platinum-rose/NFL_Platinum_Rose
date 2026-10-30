import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vm from 'node:vm';
import { generateLiveTracker } from '../../scripts/generate-live-tracker.mjs';

// Keep every read/write and ESPN request inside the fixture. These tests must
// never regenerate the real tracker, refresh boxscores, or read private ledgers.
const io = vi.hoisted(() => ({ files: new Map(), writes: new Map() }));
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async file => {
    const key = String(file).replaceAll('\\', '/');
    const entry = [...io.files].find(([suffix]) => key.endsWith(suffix));
    if (!entry) throw new Error('Fixture file unavailable');
    return JSON.stringify(entry[1]);
  }),
  writeFile: vi.fn(async (file, text) => io.writes.set(String(file), text)),
  mkdir: vi.fn(async () => {}),
  readdir: vi.fn(async () => []),
}));

const game = {
  id: '401873020', game_id: '401873020', week: 7, season: 2026,
  status: 'post', visitor: 'GB', home: 'DET', visitorScore: 17, homeScore: 20,
  kickoff_utc: '2026-10-25T17:00:00Z',
};
const event = {
  id: game.id,
  status: { type: { state: 'post', completed: true, name: 'STATUS_FINAL' }, period: 4 },
  competitions: [{ competitors: [
    { homeAway: 'home', team: { abbreviation: 'DET' }, score: '20' },
    { homeAway: 'away', team: { abbreviation: 'GB' }, score: '17' },
  ] }],
};
const injury = {
  injuries: [{ injuries: [{ athlete: { displayName: 'Fixture Athlete' }, status: 'Questionable' }] }],
};

function setTickets(legs) {
  io.files.set('data/official-picks/user-placed-wagers-2026.json', [{
    id: 'fixture', week: 7, game: 'GB @ DET', book: 'Fixture', status: 'PENDING',
    legs: legs.map((leg, i) => ({ key: `fixture-${i}`, market: 'total',
      game: 'GB @ DET', team: 'GB', opponent: 'DET', ...leg })),
  }]);
}

function generatedPacing(html, checked = {}) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const configText = script.slice(script.indexOf('const TICKET_CONFIG = '))
    .match(/^const TICKET_CONFIG = ([\s\S]*?);/)[1];
  const config = JSON.parse(configText);
  const badges = new Map();
  const rows = [...html.matchAll(/<div class="([^"]*)" id="leg-([^"]*)" ([^>]+)>/g)].map(m => {
    const attrs = Object.fromEntries([...m[3].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
    const classes = new Set(m[1].split(' '));
    const row = { getAttribute: key => attrs[key], classList: {
      contains: key => classes.has(key),
      add: (...keys) => keys.forEach(key => classes.add(key)),
      remove: (...keys) => keys.forEach(key => classes.delete(key)),
      toggle: (key, on) => on ? classes.add(key) : classes.delete(key),
    } };
    badges.set('leg-' + m[2], row);
    badges.set('pace-badge-' + m[2], {});
    return row;
  });
  const context = {
    TICKET_CONFIG: config, checkedState: checked, burntLegsState: {}, outLegsState: {}, pushedLegsState: {},
    document: { querySelectorAll: sel => sel === '.leg-item' ? rows : [], getElementById: key => badges.get(key) },
    window: {}, savePushedLegs() {},
  };
  const from = script.indexOf('const CLIENT_TEAM_MAP =');
  const through = 'window.updateAllLegPacingGrades = updateAllLegPacingGrades;';
  const to = script.indexOf(through, from) + through.length;
  vm.runInNewContext(script.slice(from, to), context);
  context.window.updateAllLegPacingGrades([event]);
  return { context, badges };
}

describe('Live Tracker generated runtime regressions', () => {
  beforeEach(() => {
    io.files.clear(); io.writes.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    io.files.set('public/schedule.json', [game]);
    io.files.set('data/official-picks/paper-wagers-2026.json', []);
    setTickets([]);
    vi.stubGlobal('fetch', vi.fn(async url => ({ ok: true,
      json: async () => String(url).includes('/scoreboard') ? { events: [event] } : injury,
    })));
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('grades final Over and Under totals at 37 points, including a push', async () => {
    setTickets([
      { direction: 'over', line: 51.5 }, { direction: 'under', line: 51.5 },
      { direction: 'over', line: 37 }, { direction: 'over', line: 30.5 },
      { direction: 'under', line: 30.5 },
    ]);
    const { html } = await generateLiveTracker({ week: 7, outPaths: ['fixture.html'] });
    const { badges } = generatedPacing(html);
    expect(badges.get('pace-badge-fixture-0').innerHTML).toContain('Burnt (37)');
    expect(badges.get('pace-badge-fixture-1').innerHTML).toContain('Hit (37)');
    expect(badges.get('pace-badge-fixture-2').innerHTML).toContain('PUSH (37)');
    expect(badges.get('pace-badge-fixture-3').innerHTML).toContain('Hit (37)');
    expect(badges.get('pace-badge-fixture-4').innerHTML).toContain('Burnt (37)');
    expect(() => new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1])).not.toThrow();
  });

  it('recorded results override conflicting browser marks while pending marks survive', async () => {
    setTickets([
      { direction: 'over', line: 51.5, status: 'LOST' },
      { direction: 'under', line: 51.5, status: 'WON' },
      { direction: 'over', line: 37, status: 'PUSH' },
      { direction: 'over', line: 30.5, status: 'PENDING' },
    ]);
    const { html } = await generateLiveTracker({ week: 7, outPaths: ['fixture.html'] });
    const { context, badges } = generatedPacing(html, { 'fixture-0': true, 'fixture-2': true, 'fixture-3': true });
    expect(context.checkedState['fixture-0']).toBe(false);
    expect(context.checkedState['fixture-3']).toBe(true);
    expect(badges.get('pace-badge-fixture-0').innerHTML).toContain('BURNT');
    expect(badges.get('pace-badge-fixture-1').innerHTML).toContain('HIT');
    expect(badges.get('pace-badge-fixture-2').innerHTML).toContain('PUSH');
    // Recheck after a later user/render pass reintroduces a stale checkmark.
    context.checkedState['fixture-0'] = true;
    context.window.updateAllLegPacingGrades([event]);
    expect(badges.get('pace-badge-fixture-0').innerHTML).toContain('BURNT');
  });

  it('does not import last week stats or injuries into an upcoming week', async () => {
    io.files.set('public/schedule.json', [{ ...game, id: 'next-week', game_id: 'next-week', week: 8, status: 'pre' }]);
    const { html } = await generateLiveTracker({ week: 8, outPaths: ['fixture.html'] });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('dates=2026&seasontype=2&week=8');
    expect(fetch.mock.calls[0][0]).not.toContain('groups=');
    expect(html).toContain('const INITIAL_INJURIES = {};');
    expect(html).not.toContain('Fixture Athlete');
    expect([...io.writes.keys()]).toEqual(['fixture.html']);
  });

  it('browser polling also ignores scoreboard events outside the rendered slate', async () => {
    io.files.set('public/schedule.json', [{ ...game, id: 'next-week', game_id: 'next-week', week: 8, status: 'pre' }]);
    const { html } = await generateLiveTracker({ week: 8, outPaths: ['fixture.html'] });
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const update = vi.fn();
    const context = {
      SCOREBOARD_URL: 'fixture-scoreboard', TRACKED_EVENT_IDS: new Set(['next-week']),
      AbortController, setTimeout, clearTimeout, console,
      fetch: vi.fn(async () => ({ ok: true, json: async () => ({ events: [event] }) })),
      fetchSummaryForEvent: vi.fn(), updateLeftSidebarScoreboard: update,
      updateSuperContestLiveScores: vi.fn(), updateFantasyLiveScores: vi.fn(), updateAllLegPacingGrades: vi.fn(),
    };
    const from = script.indexOf('let isPolling = false;');
    const to = script.indexOf("document.addEventListener('DOMContentLoaded'", from);
    vm.runInNewContext(script.slice(from, to), context);
    await context.fetchLiveScoreboard();
    expect(context.fetch.mock.calls[0][0]).toBe('fixture-scoreboard');
    expect(context.fetchSummaryForEvent).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith([]);
  });

  it.each(['http', 'network'])('uses the saved summary after an ESPN %s failure', async failure => {
    io.files.set(`data/fantasy/boxscores/espn-${game.id}.json`, injury);
    fetch.mockImplementation(async url => {
      if (String(url).includes('/scoreboard')) return { ok: true, json: async () => ({ events: [] }) };
      if (failure === 'network') throw new Error('Offline fixture');
      return { ok: false, status: 503 };
    });
    const { html } = await generateLiveTracker({ week: 7, outPaths: ['fixture.html'] });
    expect(html).toContain('"fixture athlete":"🏥 Questionable"');
    expect([...io.writes.keys()]).toEqual(['fixture.html']);
  });
});
