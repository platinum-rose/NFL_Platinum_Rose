import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dedupeSignalRows } from '../../agents/lib/tweet-pick-signals.js';
import { buildPropSignalRows, canonicalReportName } from '../../agents/twitter-bookmarks-agent.js';

const row = (o) => ({ note_id: 1, source: 'S', bet_type: 'player_prop', event_ref: 'u', ...o });

describe('dedupeSignalRows (text + OCR passes)', () => {
  it('collapses underscore / yards / TD synonyms and keeps the first (text) row', () => {
    const out = dedupeSignalRows([
      row({ author: 'Sal', team_or_market: 'Saquon Barkley - rushing attempts', lean: 'UNDER 17.5' }),
      row({ author: null, team_or_market: 'Saquon Barkley - rushing_attempts', lean: 'UNDER 17.5' }),
      row({ author: 'Sal', team_or_market: 'Chase Brown - anytime TD', lean: 'OVER 1.5' }),
      row({ author: null, team_or_market: 'Chase Brown - touchdowns', lean: 'OVER 1.5' }),
    ]);
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.author === 'Sal')).toBe(true);
  });
  it('drops an OCR row that misreads market or side but matches player + line (>=10)', () => {
    const out = dedupeSignalRows([
      row({ author: 'Sal', team_or_market: 'Jahmyr Gibbs - rushing yards', lean: 'UNDER 92.5' }),
      row({ author: 'Sal', team_or_market: 'Bhayshul Tuten - rush attempts', lean: 'OVER 12.5' }),
      row({ author: null, team_or_market: 'Jahmyr Gibbs - rushing_yards', lean: 'OVER 92.5' }),
      row({ author: null, team_or_market: 'Bhayshul Tuten - rushing_yards', lean: 'OVER 12.5' }),
    ]);
    expect(out.map((r) => r.team_or_market)).toEqual(['Jahmyr Gibbs - rushing yards', 'Bhayshul Tuten - rush attempts']);
  });
  it('does not merge different small-line markets for one player (TD vs INT 0.5)', () => {
    const out = dedupeSignalRows([
      row({ team_or_market: 'Josh Allen - touchdowns', lean: 'OVER 0.5' }),
      row({ team_or_market: 'Josh Allen - interceptions', lean: 'OVER 0.5' }),
    ]);
    expect(out).toHaveLength(2);
  });
  it('OCR prop rows now carry the author', () => {
    const [r] = buildPropSignalRows([{ player_name: 'A B', prop_type: 'rushing_yards', side: 'OVER', line: 50.5 }], { noteId: 1, eventRef: 'u', author: 'Sal Bets' });
    expect(r.author).toBe('Sal Bets');
  });
});

describe('canonicalReportName', () => {
  const mk = (names) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-')); names.forEach((n) => fs.writeFileSync(path.join(d, n), 'x')); return d; };
  it('reuses the real-handle file when the handle lookup falls back to a placeholder', () => {
    const d = mk(['2026-07-28-SharpFootball-2082119731826618393.md']);
    expect(canonicalReportName('2026-07-28', 'twitter_user', '2082119731826618393', d)).toBe('2026-07-28-SharpFootball-2082119731826618393.md');
    expect(canonicalReportName('2026-07-28', 'unknown', '2082119731826618393', d)).toBe('2026-07-28-SharpFootball-2082119731826618393.md');
  });
  it('uses the normal name for a brand-new tweet', () => {
    expect(canonicalReportName('2026-10-10', 'Sal', '999', mk([]))).toBe('2026-10-10-Sal-999.md');
  });
  it('does not create a second name when only a placeholder file exists and the author is a placeholder', () => {
    const d = mk(['2026-08-08-twitter_user-111.md']);
    expect(canonicalReportName('2026-08-08', 'unknown', '111', d)).toBe('2026-08-08-twitter_user-111.md');
  });
});
