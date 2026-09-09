import { describe, expect, it } from 'vitest';
import {
  validateMasterReport,
  assertValidMasterReport,
  MasterReportValidationError,
  REFUSAL_PATTERNS,
} from '../../agents/lib/masterReportGuard.js';

describe('masterReportGuard', () => {
  it('detects and rejects literal refusal messages', () => {
    const refusal1 = `# 📰 Title: 100% Exhaustive Master Intelligence Report\n\n**Source:** VSiN\n**URL:** https://vsin.com/test\n\n---\n\nI'm sorry, but I can't assist with that request.`;
    const res1 = validateMasterReport(refusal1, { minBytes: 100 });
    expect(res1.valid).toBe(false);
    expect(res1.reason).toBe('llm_refusal');

    const refusal2 = `# 📰 Title: 100% Exhaustive Master Intelligence Report\n\n**Source:** VSiN\n**URL:** https://vsin.com/test\n\n---\n\nI'm sorry, but I can't provide the detailed extraction you're requesting from the article.`;
    const res2 = validateMasterReport(refusal2, { minBytes: 100 });
    expect(res2.valid).toBe(false);
    expect(res2.reason).toBe('llm_refusal');

    const refusal3 = `As an AI language model, I cannot provide this content.`;
    const res3 = validateMasterReport(refusal3, { minBytes: 20 });
    expect(res3.valid).toBe(false);
    expect(res3.reason).toBe('llm_refusal');
  });

  it('rejects suspiciously short content (< minBytes)', () => {
    const shortContent = `# 📰 Title\n\n**Source:** Test\n\nShort report text.`;
    const res = validateMasterReport(shortContent, { minBytes: 500 });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('suspiciously_short');
  });

  it('validates legitimate, exhaustive master reports', () => {
    const validReport = `# 📰 NFL Preseason Week 3 Starting Quarterbacks and Rotations: 100% Exhaustive Master Intelligence Report

**Source:** VSiN
**Author:** Adam Burke
**URL:** [NFL Preseason Week 3 Starting Quarterbacks and Rotations](https://vsin.com/nfl/nfl-preseason-week-3-starting-quarterbacks-and-rotations/)

---

**Executive Summary:**

Comprehensive team-by-team quarterback rotation analysis across all Week 3 preseason matchups.

**Team-by-Team & Player-by-Player Analytical Breakdown:**

1. **Pittsburgh Steelers vs. Buffalo Bills:**
   - Mike McCarthy maxing reps for Will Howard and Drew Allar.
   - Josh Allen rested after Cleveland joint practices.

2. **New England Patriots vs. Cleveland Browns:**
   - Deshaun Watson and Shedeur Sanders sit; Dillon Gabriel and Taylen Green split snaps.
   - Tommy DeVito and Behren Morton compete for Patriots QB2.

**Betting & Fantasy Rationale:**

- **Betting Strategy:** Target teams fielding experienced backup passers over unproven rookie arms.
- **Betting Trends:** Backup QB quality governs second-half cover margins.

**Key Citations & Source Notes:**

- Compiled by Adam Burke, August 24, 2026.
`;

    const res = validateMasterReport(validReport, { minBytes: 300, requireSections: true, requireTerminalSection: true });
    expect(res.valid).toBe(true);
    expect(() => assertValidMasterReport(validReport, { minBytes: 300, requireSections: true, requireTerminalSection: true })).not.toThrow();
  });

  it('rejects abruptly truncated reports (cut off mid-sentence or mid-table)', () => {
    const truncated1 = `# 📰 Test Report\n\n---\n\n## 📌 Executive Summary\nSummary text\n\n## 🏆 Chicago Bears\n- Secondary injuries: Free-agent cornerback Cobie Durant is out`;
    const res1 = validateMasterReport(truncated1, { minBytes: 50 });
    expect(res1.valid).toBe(false);
    expect(res1.reason).toBe('truncated_output');

    const truncated2 = `# 📰 Test Report\n\n---\n\n## 📌 Executive Summary\nSummary\n\n| Round | Pick | Team |\n|---|---|---|\n| 1 | 1 | Rams |\n|`;
    const res2 = validateMasterReport(truncated2, { minBytes: 50 });
    expect(res2.valid).toBe(false);
    expect(res2.reason).toBe('truncated_output');
  });

  it('rejects reports missing terminal closing section when requireTerminalSection is true', () => {
    const noTerminal = `# 📰 Test Report\n\n---\n\n## 📌 Executive Summary\nSummary text\n\n## 🏆 Chicago Bears\nAnalysis text\n\n## 💡 Betting & Fantasy Rationale\nRationale text`;
    const res = validateMasterReport(noTerminal, { minBytes: 50, requireSections: true, requireTerminalSection: true });
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('missing_terminal_section');
  });

  it('assertValidMasterReport throws MasterReportValidationError on failure', () => {
    const badReport = `I cannot fulfill this request.`;
    expect(() => assertValidMasterReport(badReport)).toThrow(MasterReportValidationError);
  });
});
