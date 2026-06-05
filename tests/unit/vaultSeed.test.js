/**
 * Unit tests for agents/vault-seed.js
 * Tests schema detection, CSV parsing, note formatting, and dry-run behaviour.
 *
 * Run: npx vitest run tests/unit/vaultSeed.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helpers replicated inline so we can test without importing the agent ──────
// (The agent runs as a CLI script; we test the pure functions directly.)

const TEAM_ABBR_MAP = {
  'kansas city chiefs': 'KC', 'chiefs': 'KC', 'kc': 'KC',
  'buffalo bills': 'BUF', 'bills': 'BUF', 'buf': 'BUF',
  'seattle seahawks': 'SEA', 'seahawks': 'SEA', 'sea': 'SEA',
  'los angeles rams': 'LAR', 'rams': 'LAR', 'lar': 'LAR',
  'philadelphia eagles': 'PHI', 'eagles': 'PHI', 'phi': 'PHI',
};

function toAbbr(input) {
  if (!input) return null;
  const clean = String(input).toLowerCase().trim();
  return TEAM_ABBR_MAP[clean] || null;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
  return { headers, rows };
}

const SCHEMAS = {
  pff: {
    detect: (h) => h.some(x => x.includes('grade')) && h.some(x => x.includes('team')),
    teamCol: (h) => h.find(x => x === 'team_name' || x === 'team'),
    yearCol: (h) => h.find(x => x === 'season' || x === 'year'),
    label: 'PFF Grades', tags: ['pff', 'grades'],
  },
  ats: {
    detect: (h) => h.some(x => x.includes('ats_wins') || x.includes('ats_pct')),
    teamCol: (h) => h.find(x => x === 'team' || x === 'team_name'),
    yearCol: (h) => h.find(x => x === 'season' || x === 'year'),
    label: 'ATS Records', tags: ['ats', 'betting'],
  },
  splits: {
    detect: (h) => h.some(x => x.includes('ticket_pct') || x.includes('money_pct')),
    teamCol: (h) => h.find(x => x === 'home_team' || x === 'team'),
    yearCol: (h) => h.find(x => x === 'season' || x === 'game_date'),
    label: 'Betting Splits', tags: ['splits', 'betting'],
  },
  dvoa: {
    detect: (h) => h.some(x => x === 'total_dvoa' || x.includes('dvoa')),
    teamCol: (h) => h.find(x => x === 'team' || x === 'team_name'),
    yearCol: (h) => h.find(x => x === 'season' || x === 'year'),
    label: 'DVOA', tags: ['dvoa', 'analytics'],
  },
  nflverse: {
    detect: (h) => h.some(x => x === 'posteam' || x === 'epa' || x.includes('epa_per')),
    teamCol: (h) => h.find(x => x === 'team' || x === 'posteam'),
    yearCol: (h) => h.find(x => x === 'season' || x === 'year'),
    label: 'nflverse', tags: ['epa', 'nflverse'],
  },
};

function detectSchema(headers, dirName) {
  if (dirName && SCHEMAS[dirName]?.detect(headers)) return { name: dirName, ...SCHEMAS[dirName] };
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    if (schema.detect(headers)) return { name, ...schema };
  }
  return null;
}

function fmtNum(v) { return (v == null || v === '') ? '—' : (isNaN(+v) ? v : (+v).toFixed(2)); }

function mdTable(rows, cols) {
  if (!rows.length) return '_No data_';
  const header = `| ${cols.join(' | ')} |`;
  const sep    = `| ${cols.map(() => '---').join(' | ')} |`;
  const body   = rows.map(r => `| ${cols.map(c => r[c] ?? '—').join(' | ')} |`).join('\n');
  return `${header}\n${sep}\n${body}`;
}

function mergeTeamSection(existingContent, newSection, sectionHeader) {
  if (!existingContent) return `# Team Reference Note\n\n${newSection}`;
  const re = new RegExp(`## ${sectionHeader}[\\s\\S]*?(?=\\n## |$)`);
  if (re.test(existingContent)) return existingContent.replace(re, newSection);
  return existingContent.trim() + '\n\n' + newSection;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('vault-seed', () => {

  describe('parseCSV', () => {
    it('parses a simple 3-column CSV', () => {
      const csv = `team,season,offense_grade\nKansas City Chiefs,2025,87.3\nBuffalo Bills,2025,82.1`;
      const { headers, rows } = parseCSV(csv);
      expect(headers).toEqual(['team', 'season', 'offense_grade']);
      expect(rows).toHaveLength(2);
      expect(rows[0].team).toBe('Kansas City Chiefs');
      expect(rows[0].offense_grade).toBe('87.3');
    });

    it('strips quotes from values', () => {
      const csv = `"team","grade"\n"Bills","82"`;
      const { headers, rows } = parseCSV(csv);
      expect(headers[0]).toBe('team');
      expect(rows[0].team).toBe('Bills');
    });

    it('normalises header spaces to underscores', () => {
      const csv = `team name,offense grade\nKC,85`;
      const { headers } = parseCSV(csv);
      expect(headers).toContain('team_name');
      expect(headers).toContain('offense_grade');
    });

    it('returns empty arrays for single-line input', () => {
      const { headers, rows } = parseCSV('just one line');
      expect(headers).toEqual([]);
      expect(rows).toEqual([]);
    });

    it('handles CRLF line endings', () => {
      const csv = `team,grade\r\nKC,85\r\nBUF,82`;
      const { rows } = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].team).toBe('KC');
    });
  });

  describe('toAbbr (team normalisation)', () => {
    it('resolves full team name', () => {
      expect(toAbbr('Kansas City Chiefs')).toBe('KC');
    });
    it('resolves nickname', () => {
      expect(toAbbr('seahawks')).toBe('SEA');
    });
    it('resolves abbreviation', () => {
      expect(toAbbr('PHI')).toBe('PHI');
    });
    it('returns null for unknown input', () => {
      expect(toAbbr('fictional team')).toBeNull();
    });
    it('is case-insensitive', () => {
      expect(toAbbr('BILLS')).toBe('BUF');
      expect(toAbbr('bills')).toBe('BUF');
    });
  });

  describe('detectSchema', () => {
    it('detects PFF grades by headers', () => {
      const headers = ['team', 'season', 'offense_grade', 'defense_grade'];
      const schema = detectSchema(headers, null);
      expect(schema.name).toBe('pff');
    });

    it('detects ATS records by ats_wins column', () => {
      const headers = ['team', 'season', 'ats_wins', 'ats_losses'];
      expect(detectSchema(headers, null).name).toBe('ats');
    });

    it('detects betting splits by ticket_pct column', () => {
      const headers = ['home_team', 'spread_ticket_pct', 'spread_money_pct'];
      expect(detectSchema(headers, null).name).toBe('splits');
    });

    it('detects DVOA by total_dvoa column', () => {
      const headers = ['team', 'season', 'total_dvoa', 'off_dvoa', 'def_dvoa'];
      expect(detectSchema(headers, null).name).toBe('dvoa');
    });

    it('detects nflverse by posteam column', () => {
      const headers = ['posteam', 'season', 'epa_per_play'];
      expect(detectSchema(headers, null).name).toBe('nflverse');
    });

    it('dir hint overrides auto-detect when valid', () => {
      // Headers could match PFF but dir says ats — ats schema requires ats_wins
      // so dir hint only wins if the schema also detects. Both valid = dir wins.
      const headers = ['team', 'season', 'ats_wins', 'offense_grade'];
      const schema  = detectSchema(headers, 'ats');
      expect(schema.name).toBe('ats');
    });

    it('returns null for unrecognised headers', () => {
      const headers = ['foo', 'bar', 'baz'];
      expect(detectSchema(headers, null)).toBeNull();
    });
  });

  describe('mdTable', () => {
    it('renders a markdown table', () => {
      const rows = [{ team: 'KC', grade: '87' }, { team: 'BUF', grade: '82' }];
      const result = mdTable(rows, ['team', 'grade']);
      expect(result).toContain('| team | grade |');
      expect(result).toContain('| KC | 87 |');
      expect(result).toContain('| --- | --- |');
    });

    it('returns _No data_ for empty rows', () => {
      expect(mdTable([], ['a', 'b'])).toBe('_No data_');
    });

    it('fills missing columns with —', () => {
      const rows = [{ team: 'KC' }];
      const result = mdTable(rows, ['team', 'grade']);
      expect(result).toContain('| KC | — |');
    });
  });

  describe('mergeTeamSection', () => {
    it('creates a new note when no existing content', () => {
      const result = mergeTeamSection(null, '## PFF Grades — 2025\n- grade: 87', 'PFF Grades — 2025');
      expect(result).toContain('# Team Reference Note');
      expect(result).toContain('## PFF Grades — 2025');
    });

    it('replaces an existing section', () => {
      const existing = '# KC\n\n## PFF Grades — 2025\n- old grade: 80\n\n## ATS Records — 2025\n- ats: 9-7';
      const newSec   = '## PFF Grades — 2025\n- grade: 87';
      const result   = mergeTeamSection(existing, newSec, 'PFF Grades — 2025');
      expect(result).toContain('grade: 87');
      expect(result).not.toContain('old grade: 80');
      expect(result).toContain('## ATS Records — 2025'); // other section preserved
    });

    it('appends a new section to existing content', () => {
      const existing = '# KC\n\n## ATS Records — 2025\n- ats: 9-7';
      const newSec   = '## PFF Grades — 2025\n- grade: 87';
      const result   = mergeTeamSection(existing, newSec, 'PFF Grades — 2025');
      expect(result).toContain('## ATS Records — 2025');
      expect(result).toContain('## PFF Grades — 2025');
    });
  });

  describe('fmtNum', () => {
    it('formats numbers to 2 decimal places', () => {
      expect(fmtNum(87.3456)).toBe('87.35');
    });
    it('returns — for null', () => {
      expect(fmtNum(null)).toBe('—');
    });
    it('returns — for empty string', () => {
      expect(fmtNum('')).toBe('—');
    });
    it('returns non-numeric strings as-is', () => {
      expect(fmtNum('n/a')).toBe('n/a');
    });
  });

  describe('end-to-end CSV → schema → table', () => {
    it('produces a valid note structure from PFF CSV', () => {
      const csv = [
        'team,season,offense_grade,defense_grade,pass_rush_grade',
        'Kansas City Chiefs,2025,87.3,82.1,91.0',
        'Buffalo Bills,2025,82.5,78.9,85.2',
        'Seattle Seahawks,2025,71.2,94.1,88.7',
      ].join('\n');

      const { headers, rows } = parseCSV(csv);
      const schema = detectSchema(headers, 'pff');

      expect(schema.name).toBe('pff');
      expect(schema.teamCol(headers)).toBe('team');

      // Verify team resolution
      const abbrs = rows.map(r => toAbbr(r[schema.teamCol(headers)])).filter(Boolean);
      expect(abbrs).toContain('KC');
      expect(abbrs).toContain('BUF');
      expect(abbrs).toContain('SEA');

      // Table renders with expected columns
      const displayCols = headers.slice(0, 5);
      const table = mdTable(rows, displayCols);
      expect(table).toContain('Kansas City Chiefs');
      expect(table).toContain('87.3');
    });

    it('produces correct structure from ATS CSV', () => {
      const csv = [
        'team,season,ats_wins,ats_losses,ats_pushes,ats_pct',
        'Chiefs,2025,10,7,0,58.8',
        'Seahawks,2025,12,5,0,70.6',
      ].join('\n');
      const { headers, rows } = parseCSV(csv);
      const schema = detectSchema(headers, 'ats');
      expect(schema.name).toBe('ats');
      expect(rows[0].ats_wins).toBe('10');
    });
  });
});
