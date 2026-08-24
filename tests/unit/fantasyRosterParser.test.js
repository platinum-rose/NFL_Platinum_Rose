// tests/unit/fantasyRosterParser.test.js
import { describe, it, expect } from 'vitest';
import { parseRawRosterLine, parseRawRosterText, normalizePosition } from '../../src/lib/fantasyRosterParser';

describe('fantasyRosterParser', () => {
  it('normalizes position strings', () => {
    expect(normalizePosition('qb')).toBe('QB');
    expect(normalizePosition('dst')).toBe('DEF');
    expect(normalizePosition('D/ST')).toBe('DEF');
    expect(normalizePosition('WR')).toBe('WR');
    expect(normalizePosition('LB')).toBe('LB');
    expect(normalizePosition('')).toBeNull();
  });

  it('parses structured single roster lines and CSV lines', () => {
    const line1 = "Ja'Marr Chase WR CIN - Round 1";
    const res1 = parseRawRosterLine(line1);
    expect(res1).not.toBeNull();
    expect(res1.player).toBe("Ja'Marr Chase");
    expect(res1.position).toBe('WR');
    expect(res1.team).toBe('CIN');

    const line2 = '"Trey McBride",TE,ARI,8,Drafted';
    const res2 = parseRawRosterLine(line2);
    expect(res2).not.toBeNull();
    expect(res2.player).toBe('Trey McBride');
    expect(res2.position).toBe('TE');
    expect(res2.team).toBe('ARI');
    expect(res2.keeperCostRound).toBe(8);
    expect(res2.acquisitionType).toBe('Drafted');

    const line3 = '"Kyle Monangai",RB,CHI,10,Free Agent';
    const res3 = parseRawRosterLine(line3);
    expect(res3).not.toBeNull();
    expect(res3.player).toBe('Kyle Monangai');
    expect(res3.keeperCostRound).toBe(10);
    expect(res3.acquisitionType).toBe('Free Agent');
  });

  it('parses plain unformatted multi-line Yahoo web paste accurately', () => {
    const plainYahooPaste = `
Dak Prescott
Dal - QB
Sun 5:20 pm @ NYG
14
375.78
65%

George Pickens
Dal - WR
Sun 5:20 pm @ NYG
14
247.40
98%

Nico Collins
Hou - WR
Sun 10:00 am vs Buf

Christian McCaffreyQ
SF - RB
Thu 5:35 pm @ LAR

Andy Borregales
NE - K

Alex Singleton
Den - LB
    `;

    const parsed = parseRawRosterText(plainYahooPaste);
    expect(parsed.length).toBeGreaterThanOrEqual(5);

    const names = parsed.map(p => `${p.player} (${p.position}, ${p.team})`);
    expect(names).toContain("Dak Prescott (QB, DAL)");
    expect(names).toContain("George Pickens (WR, DAL)");
    expect(names).toContain("Nico Collins (WR, HOU)");
    expect(names).toContain("Christian McCaffrey (RB, SF)");
  });

  it('parses Yahoo Markdown links raw paste accurately', () => {
    const rawPaste = `
[Dak Prescott](https://sports.yahoo.com/nfl/players/29369)
Dal - QB
[George Pickens](https://sports.yahoo.com/nfl/players/33979)
Dal - WR
[Nico Collins](https://sports.yahoo.com/nfl/players/33427)
Hou - WR
[Bucky Irving](https://sports.yahoo.com/nfl/players/40948)
TB - RB
[Christian McCaffrey](https://sports.yahoo.com/nfl/players/30121)
SF - RB
[Trey McBride](https://sports.yahoo.com/nfl/players/33990)
Ari - TE
[Jaxon Smith-Njigba](https://sports.yahoo.com/nfl/players/33978)
Sea - WR
[Andy Borregales](https://sports.yahoo.com/nfl/players/41063)
NE - K
[Foyesade Oluokun](https://sports.yahoo.com/nfl/players/31174)
Jax - LB
[Jamien Sherwood](https://sports.yahoo.com/nfl/players/33535)
NYJ - LB
[Alex Singleton](https://sports.yahoo.com/nfl/players/29037)
Den - LB
[Joe Burrow](https://sports.yahoo.com/nfl/players/32671)
Cin - QB
[Breece Hall](https://sports.yahoo.com/nfl/players/33994)
NYJ - RB
[Kyle Monangai](https://sports.yahoo.com/nfl/players/41088)
Chi - RB
[Oronde Gadsden](https://sports.yahoo.com/nfl/players/41031)
LAC - TE
[Jayden Reed](https://sports.yahoo.com/nfl/players/33998)
GB - WR
[Brian Robinson](https://sports.yahoo.com/nfl/players/34005)
Atl - RB
    `;

    const parsed = parseRawRosterText(rawPaste);
    expect(parsed.length).toBeGreaterThanOrEqual(14);
  });
});
