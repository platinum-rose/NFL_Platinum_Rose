import { describe, it, expect } from 'vitest';
import { generateLiveTracker } from '../../scripts/generate-live-tracker.mjs';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

describe('generate-live-tracker generator', () => {
  const testOut = path.resolve('public/test-live-tracker.html');

  it('compiles standalone live tracker HTML containing essential v4 elements and zero syntax errors', async () => {
    const res = await generateLiveTracker({ week: 1, outPaths: [testOut] });
    expect(res.wagersCount).toBeGreaterThan(0);

    const html = await readFile(testOut, 'utf8');
    expect(html).toContain('TICKET_CONFIG');
    expect(html).toContain('Alejandro Castro Split Ledger');
    expect(html).toContain('Player Cheat Sheet');
    expect(html).toContain('cards-grid');
    expect(html).toContain('burnt-cards-grid');
    expect(html).toContain('btn-alejandro-toggle');
    expect(html).toContain('badge-promo');
    expect(html).toContain('burnt-divider-line');
    expect(html).toContain('burnt-section-wrap');
    expect(html).toContain('chk-hide-burnt');
    expect(html).toContain('partitionTickets');
    expect(html).toContain('concluded-players-divider');
    expect(html).toContain('btn-global-refresh');
    expect(html).toContain('archive-modal');
    expect(html).toContain('source-tag');
    expect(html).toContain('btn-clear-settled');
    expect(html).toContain('add-slip-modal');
    expect(html).toContain('tab-tickets-wrap');
    expect(html).toContain('tab-players-wrap');
    expect(html).toContain('tab-supercontest-wrap');
    expect(html).toContain('tab-btn-tickets');
    expect(html).toContain('tab-btn-players');
    expect(html).toContain('tab-btn-supercontest');
    expect(html).toContain('sc-top5-container');
    expect(html).toContain('sc-matrix-table');
    expect(html).toContain('sc-card-selected-count');
    expect(html).toContain('toggleSuperContestPick');
    expect(html).toContain('applySuperContestPicks');
    expect(html).toContain('clearSuperContestPicks');
    expect(html).toContain('setSuperContestFilter');
    expect(html).toContain('updateSuperContestLiveScores');
    expect(html).toContain('SC_MATRIX');
    expect(html).toContain('SC_PICKS_KEY');
    expect(html).toContain('SC_LOCKED_CARD_KEY');
    expect(html).toContain('chk-hide-fulfilled-legs');
    expect(html).toContain('fulfilled-legs-strip');
    expect(html).toContain('showTab');
    expect(html).toContain('toggleHideFulfilledLegs');
    expect(html).toContain('toggleCardFulfilledLegs');
    expect(html).toContain('applyHideFulfilledLegs');
    expect(html).toContain('tab-btn-fantasy');
    expect(html).toContain('tab-fantasy-wrap');
    expect(html).toContain('ff-leagues-container');
    expect(html).toContain('ff-kicker-radar');
    expect(html).toContain('toggleLeagueCollapse');
    expect(html).toContain('togglePlayerCardCollapse');
    expect(html).toContain('toggleKeepPlayer');
    expect(html).toContain('toggleHideKept');
    expect(html).toContain('setFantasyWindowFilter');
    expect(html).toContain('setFantasyPriorityFilter');
    expect(html).toContain('filterAndRenderFantasy');
    expect(html).toContain('updateFantasyLiveScores');
    expect(html).toContain('ff-starters-grid');
    expect(html).toContain('ff-starter-card');
    expect(html).toContain('moveLeagueOrder');
    expect(html).toContain('setupLeagueDragAndDrop');
    expect(html).toContain('restoreLeagueOrder');
    expect(html).toContain('btn-order-arrow');
    expect(html).toContain('leg-game-pill');
    expect(html).toContain('ff-fpts-badge-');
    expect(html).toContain('sb-field-bar-wrap');
    expect(html).toContain('sb-ball-marker-');
    expect(html).toContain('btn-leg-burn');
    expect(html).toContain('BURNT_LEGS_KEY');
    expect(html).toContain('toggleLegBurn');
    expect(html).toContain('getCombinations');
    expect(html).toContain('isRoundRobin');
    expect(html).toContain('btn-refresh-yahoo-fantasy');
    expect(html).toContain('refreshYahooFantasyRosters');
    expect(html).toContain('.card-legs.hide-fulfilled-legs .leg-item.leg-burnt');
    expect(html).toContain('.card-legs.hide-fulfilled-legs .leg-item.leg-missed');
    expect(html).toContain('minstrip-bet_20260913_738634013_bm_round_robin');
    expect(html).toContain('minstrip-bet_20260913_738647412_bm_compact_round_robin');

    // Verify valid JavaScript syntax in the generated <script> tag
    const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatches).toBeTruthy();
    const scriptBody = scriptMatches[1];
    expect(() => new vm.Script(scriptBody)).not.toThrow();

    // Verify SSR partitioning: settled Melbourne losses partitioned to burnt-cards-grid, settled wins to cashed-cards-grid, live slips in cards-grid
    expect(html).toContain('id="burnt-cards-grid"');
    expect(html).toContain('id="cashed-cards-grid"');
    expect(html).toContain('cashed-section-wrap');
    expect(html).toContain('chk-hide-cashed');
    expect(html).toContain('toggleManualCash');
    expect(html).toContain('cashed-divider-line');
    const liveCount = html.match(/id="live-slips-count">(\d+)<\/span>/)?.[1];
    const cashedCount = html.match(/id="cashed-section-count">(\d+)<\/span>/)?.[1];
    const burntCount = html.match(/id="burnt-section-count">(\d+)<\/span>/)?.[1];
    expect(Number(liveCount)).toBeGreaterThanOrEqual(1);
    expect(Number(cashedCount)).toBeGreaterThanOrEqual(1);
    expect(Number(burntCount)).toBeGreaterThanOrEqual(1);

    // Clean up test file safely
    try {
      await unlink(testOut);
    } catch {
      // test output cleanup is best-effort
    }
  });
});
