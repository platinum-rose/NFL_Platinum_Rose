import { describe, expect, it, vi } from 'vitest';
import { parseBetOnlineBoardPayload, parseBetOnlineEventText } from '../../scripts/props/betonline-live-parser.mjs';

const EVENT = {
  eventId: '491117901',
  url: 'https://www.betonline.ag/sportsbook/football/nfl/game/491117901',
  game: 'New York Giants @ Los Angeles Rams',
  startTime: 'Today, 5:15 PM',
};

describe('betonline-live-parser', () => {
  it('parses rendered BetOnline event text into player prop rows', () => {
    const rows = parseBetOnlineEventText(`
NFL
FOOTBALL
New York Giants
Los Angeles Rams
Today
5:15 PM
Parlay Builder
First Touchdown Scorer
Kyren Williams Lar
+400
Cameron Skattebo Nyg
+675
Jaxson Dart NYG Passing Yards
Over 215.5 Passing Yards
-115
Under 215.5 Passing Yards
-115
Jaxson Dart NYG Score a Touchdown?
Yes
+220
No
-280
Cam Skattebo NYG Rushing Yards
Over 53.5 Rushing Yards
-110
Under 53.5 Rushing Yards
-120
Kyren Williams LAR Receiving Yards
Over 16.5 Receiving Yards
-130
Under 16.5 Receiving Yards
+100
Team to Commit 1st Accepted Penalty
New York Giants
-115
`, EVENT);

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'first_td',
      marketTitle: 'First Touchdown Scorer',
      player: 'Kyren Williams',
      team: 'LAR',
      side: 'Yes',
      odds: 400,
      game: EVENT.game,
    }));

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'pass_yds',
      marketTitle: 'Jaxson Dart NYG Passing Yards',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'Over',
      line: 215.5,
      odds: -115,
    }));

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd',
      marketTitle: 'Jaxson Dart NYG Score a Touchdown?',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'No',
      line: null,
      odds: -280,
    }));

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'rec_yds',
      player: 'Kyren Williams',
      team: 'LAR',
      side: 'Under',
      line: 16.5,
      odds: 100,
    }));

    expect(rows.some((row) => row.marketTitle === 'Team to Commit 1st Accepted Penalty')).toBe(false);
  });

  it('summarizes multi-event board payloads', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T20:00:00Z'));

    const payload = parseBetOnlineBoardPayload({
      events: [
        {
          ...EVENT,
          text: `
Jaxson Dart NYG Passing Attempts
Over 29.5 Passing Attempts
-105
Under 29.5 Passing Attempts
-125
`,
        },
        {
          eventId: '491129541',
          game: 'Atlanta Falcons @ Green Bay Packers',
          text: `
Bijan Robinson ATL Rushing+Receiving Yards
Over 99.5 Yards
-115
Under 99.5 Yards
-115
`,
        },
      ],
    });

    expect(payload.schema).toBe('betonline_live_props_v1');
    expect(payload.generatedAt).toBe('2026-09-21T20:00:00.000Z');
    expect(payload.summary).toEqual({
      events: 2,
      rows: 4,
      players: 2,
      markets: 2,
    });
    expect(payload.rows).toContainEqual(expect.objectContaining({
      eventId: '491129541',
      game: 'Atlanta Falcons @ Green Bay Packers',
      market: 'rush_rec_yds',
      player: 'Bijan Robinson',
      team: 'ATL',
      line: 99.5,
    }));

    vi.useRealTimers();
  });

  it('handles BetOnline game-props pages with start-time rows between titles and selections', () => {
    const rows = parseBetOnlineEventText(`
NFL Game Props
New York Giants @ Los Angeles Rams
Anytime Touchdown Scorer
Today, 5:20 PM
Kyren Williams LAR
-165
SHOW MORE
First Touchdown Scorer
Today, 5:20 PM
Kyren Williams LAR
+400
SHOW MORE
Jaxson Dart NYG Passing Yards
Today, 5:20 PM
Over 215.5 Passing Yards
-110
Under 215.5 Passing Yards
-120
Jaxson Dart NYG Passing Yards
Read More
Jaxson Dart NYG Score a Touchdown?
Today, 5:20 PM
Yes
+220
No
-280
Jaxson Dart NYG Score a Touchdown?
Read More
Jaxson Dart NYG to Score 1st Touchdown?
Today, 5:20 PM
Yes
+1300
No
-1800
Dominic Zvada NYG Kicking Points
Today, 5:20 PM
Over 6.5 Points
+110
Under 6.5 Points
-140
`, EVENT);

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'first_td',
      player: 'Kyren Williams',
      team: 'LAR',
      odds: 400,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd_1_plus',
      marketTitle: 'Anytime Touchdown Scorer',
      player: 'Kyren Williams',
      team: 'LAR',
      side: 'Yes',
      line: null,
      odds: -165,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'pass_yds',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'Under',
      line: 215.5,
      odds: -120,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'Yes',
      odds: 220,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'first_td_yn',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'No',
      odds: -1800,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'kicking_points',
      player: 'Dominic Zvada',
      team: 'NYG',
      line: 6.5,
      odds: 110,
    }));
  });

  it('handles BetOnline countdown rows before selections', () => {
    const rows = parseBetOnlineEventText(`
Anytime Touchdown Scorer
Today in 00:28:00
Kyren Williams LAR
-165
Jaxson Dart NYG Passing Yards
Today in 00:28:00
Over 215.5 Passing Yards
+100
Under 215.5 Passing Yards
-130
`, EVENT);

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd_1_plus',
      player: 'Kyren Williams',
      team: 'LAR',
      odds: -165,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'pass_yds',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'Over',
      line: 215.5,
      odds: 100,
    }));
  });

  it('keeps parsing player props that appear after a stop-label section', () => {
    const rows = parseBetOnlineEventText(`
Team to Commit 1st Accepted Penalty
New York Giants
-115
Los Angeles Rams
-115
Terrance Ferguson LAR Receiving Yards
Over 24.5 Receiving Yards
-110
Under 24.5 Receiving Yards
-120
Tyler Higbee LAR Receptions
Over 2.5 Receptions
-130
Under 2.5 Receptions
+100
`, EVENT);

    expect(rows).toContainEqual(expect.objectContaining({
      market: 'rec_yds',
      marketTitle: 'Terrance Ferguson LAR Receiving Yards',
      player: 'Terrance Ferguson',
      team: 'LAR',
      side: 'Over',
      line: 24.5,
      odds: -110,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'rec',
      marketTitle: 'Tyler Higbee LAR Receptions',
      player: 'Tyler Higbee',
      team: 'LAR',
      side: 'Under',
      line: 2.5,
      odds: 100,
    }));
    expect(rows.some((row) => row.marketTitle === 'Team to Commit 1st Accepted Penalty')).toBe(false);
  });

  it('keeps anytime touchdown list rows distinct from Yes/No touchdown rows', () => {
    const rows = parseBetOnlineEventText(`
Anytime Touchdown Scorer
Kyren Williams LAR
-165
Cam Skattebo NYG
+250
Jaxson Dart NYG Score a Touchdown?
Yes
+220
No
-280
`, { game: 'test' });

    expect(rows.filter((row) => row.market === 'atd_1_plus')).toHaveLength(2);
    expect(rows.filter((row) => row.market === 'atd')).toHaveLength(2);
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd_1_plus',
      marketTitle: 'Anytime Touchdown Scorer',
      player: 'Cam Skattebo',
      team: 'NYG',
      side: 'Yes',
      odds: 250,
    }));
    expect(rows).toContainEqual(expect.objectContaining({
      market: 'atd',
      marketTitle: 'Jaxson Dart NYG Score a Touchdown?',
      player: 'Jaxson Dart',
      team: 'NYG',
      side: 'No',
      odds: -280,
    }));
  });
});
