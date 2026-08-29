import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => null),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('biweekly digest validation', () => {
  it('renders the Article & Sharp Market Intel Briefing with escaped source text', async () => {
    const { generateDigestHtml } = await import('../../agents/send-biweekly-digest.js');

    const html = generateDigestHtml({
      epName: 'Test Episode',
      audioUrl: 'https://audio.example/show.mp3',
      dashboardUrl: 'https://dashboard.example/podcasts',
      teamReports: [],
      articleIntelList: [{
        type: 'article',
        title: '<script>alert("x")</script>',
        content: 'Market note with <b>unsafe</b> markup.',
        published_at: '2026-08-27T12:00:00.000Z',
        url: 'https://source.example/article',
      }],
    });

    expect(html).toContain('Article & Sharp Market Intel Briefing');
    expect(html).toContain('ARTICLE INTEL');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('Market note with &lt;b&gt;unsafe&lt;/b&gt; markup.');
    expect(html).not.toContain('<script>alert');
  });

  it('omits the article briefing when no article or tweet intel is present', async () => {
    const { generateDigestHtml } = await import('../../agents/send-biweekly-digest.js');

    const html = generateDigestHtml({
      epName: 'Test Episode',
      audioUrl: 'https://audio.example/show.mp3',
      dashboardUrl: 'https://dashboard.example/podcasts',
      teamReports: [],
      articleIntelList: [],
    });

    expect(html).not.toContain('Article & Sharp Market Intel Briefing');
  });

  it('parses normal UTF-8 trophy team headings in dry-run digest previews', async () => {
    const { dispatchBiweeklyDigest } = await import('../../agents/send-biweekly-digest.js');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-digest-'));
    const reportPath = path.join(tempDir, 'report.md');
    const previewPath = path.join(tempDir, 'preview.html');

    fs.writeFileSync(reportPath, `# Division Preview

## 🏆 Buffalo Bills

- **Win Total Line / Juicing / Division Odds / Futures Odds Mentioned**
- Bills win total 10.5 [^Bills-1]

- **Comprehensive Narrative Synopsis**
Buffalo has the cleanest AFC East ceiling.

- **EXPERT-BY-EXPERT**
* **Chad Millman:**
- **Exact Bet & Position:** Bills over 10.5 wins.
- **Exhaustive Analytical Rationale & Evidence:**
- Depth, quarterback continuity, and division baseline all matter.

* **Simon Hunter:**
- **Exact Bet & Position:** Bills to win AFC East.
- **Exhaustive Analytical Rationale & Evidence:**
- Price still works if the defense stabilizes.

- **Endnotes & Verbatim Timecodes:**
  * [^Bills-1]: [01:23] Chad Millman: "Bills over is still live."
---
`, 'utf8');

    const result = await dispatchBiweeklyDigest({
      dryRun: true,
      reportMdPaths: [reportPath],
      episodeName: 'Fixture Episode',
      previewFile: previewPath,
    });

    const html = fs.readFileSync(result.previewFile, 'utf8');
    expect(result.dryRun).toBe(true);
    expect(html).toContain('Buffalo Bills');
    expect(html).toContain('Bills over 10.5 wins.');
    expect(html).toContain('STATIC BENCHMARK CONTEXT');
    expect(html).toContain('Stream Quote Audio at [01:23]');
  });
});
