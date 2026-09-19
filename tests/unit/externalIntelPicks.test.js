import { describe, expect, it } from 'vitest';
import { parseCsv, parseVideoNote, toSignalRows } from '../../agents/lib/external-intel-picks.js';

const HDR = 'author,tweet_url,bet_type,team_or_market,market,selection,line,odds,rationale\n';
const U = 'https://x.com/a/status/123';

describe('external intel picks', () => {
  it('parses quoted CSV fields with commas', () => {
    const rows = parseCsv(`${HDR}a,${U},spread,Chicago Bears,,Bears,-4.5,-110,"Wentz, full week of prep"\n`);
    expect(rows[0]).toMatchObject({ team_or_market: 'Chicago Bears', rationale: 'Wentz, full week of prep' });
  });

  it('maps rows and skips incomplete, name-only and game-only props', () => {
    const picks = parseCsv(HDR + [
      `a,${U},spread,Chicago Bears,,Bears,-4.5,-110,x`,
      `a,${U},player_prop,Chuba Hubbard,best_bet,Chuba Hubbard,,,x`,
      `a,${U},anytime_td,CAR @ ATL,anytime TD,,,,x`,
      `a,${U},trend,Josh Allen,passing yards,225+,225,,x`,
      `a,https://x.com/a/status/,,,,,,,`,
    ].join('\n'));
    const { rows, skipped } = toSignalRows(picks, { sourceLabel: 'S' });
    expect(rows.map((r) => r.lean)).toEqual(['Bears -4.5 (-110)', '225+']);
    expect(rows[0]).toMatchObject({ tweet_url: U, event_ref: U, note_id: null, bet_type: 'spread' });
    expect(skipped.map((s) => s.reason)).toEqual(['player named with no market/line', 'prop with no player named (game only)', 'incomplete row']);
  });

  it('reads an Antigravity video note table', () => {
    const md = `**Author:** @salbets_  \n**Tweet URL:** ${U}  \n\n| Bet Type | Team/Mkt | Market | Selection | Line | Odds | Rationale |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| player_prop | PHI | rushing_yards | Saquon Barkley | Over 76.5 | -115 | leads all game |\n`;
    const { rows } = toSignalRows(parseVideoNote(md), { sourceLabel: 'S' });
    expect(rows[0]).toMatchObject({ author: 'salbets_', team_or_market: 'Saquon Barkley - rushing yards', lean: 'OVER 76.5 (-115)' });
  });
});
