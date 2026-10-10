import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const stdin = await new Promise((resolveInput) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { value += chunk; });
  process.stdin.on('end', () => resolveInput(value));
});
if (!stdin.trim()) throw new Error('Expected captured Bookmaker JSON on standard input.');
const rawClipboard = stdin;
const captures = JSON.parse(rawClipboard);
if (!Array.isArray(captures) || captures.length !== 14 || captures.some((capture) => typeof capture?.body !== 'string' || capture.body.length < 5000)) {
  throw new Error('Expected 14 complete Bookmaker rendered prop-page captures on the clipboard.');
}

const capturedAt = new Date().toISOString();
const offerPattern = /^(.*?)\s+-\s+(Over|Under)\s+(\d+(?:\.\d+)?)\s+([+-]\d+)$/;
const headingPattern = /^(.*?):\s+(.+)$/;
const offers = [];
const pageSummaries = [];

for (const capture of captures) {
  const lines = capture.body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let heading = null;
  let parsedCount = 0;
  for (const rawLine of lines) {
    const headingMatch = rawLine.match(headingPattern);
    if (headingMatch && !/^https?:/i.test(rawLine)) {
      heading = { game: headingMatch[1], market: headingMatch[2] };
      continue;
    }
    const offerMatch = rawLine.match(offerPattern);
    if (!offerMatch || !heading || !/\bTotal\b/i.test(heading.market)) continue;
    const [, player, side, line, price] = offerMatch;
    offers.push({
      game: heading.game,
      market: heading.market,
      player: player.trim(),
      side: side.toLowerCase(),
      line: Number(line),
      price: Number(price),
      source_url: capture.url,
      raw_line: rawLine,
      captured_at: capturedAt,
      parse_status: 'parsed_standard_over_under'
    });
    parsedCount += 1;
  }
  pageSummaries.push({ source_url: capture.url, raw_text_characters: capture.body.length, parsed_offer_rows: parsedCount });
}

const source = {
  schema_version: 'bookmaker_rendered_props_raw_v1',
  season: 2026,
  week: 5,
  captured_at: capturedAt,
  source: 'Bookmaker rendered authenticated session',
  capture_method: 'in-session browser rendered text',
  page_count: captures.length,
  pages: captures,
  notes: [
    'Every completed rendered prop page is preserved as raw text.',
    'No bet-slip, cashier, ticket, or official ledger interaction occurred.',
    'Displayed prices are point-in-time offers, not ticket confirmations.'
  ]
};
const normalized = {
  schema_version: 'bookmaker_weekly_props_review_v1',
  season: 2026,
  week: 5,
  captured_at: capturedAt,
  source_raw_file: 'data/research-intel/source-evidence/2026-10-09-bookmaker-week5-props-rendered-raw.json',
  status: 'review_only',
  page_count: captures.length,
  parsed_offer_row_count: offers.length,
  unparsed_content_retained: true,
  page_summaries: pageSummaries,
  offers,
  limitations: [
    'Only standard two-sided player O/U rows are normalized automatically.',
    'Alternate ladders, yes/no specials, team markets, and rows without an unambiguous player-side-line-price shape remain in the raw evidence.',
    'This review dataset does not constitute a recommendation, bet slip, or official ticket.'
  ]
};

const rawPath = resolve(root, 'data/research-intel/source-evidence/2026-10-09-bookmaker-week5-props-rendered-raw.json');
const normalizedPath = resolve(root, 'data/generated/props/bookmaker-live-2026-10-09-week5.json');
mkdirSync(dirname(rawPath), { recursive: true });
mkdirSync(dirname(normalizedPath), { recursive: true });
writeFileSync(rawPath, `${JSON.stringify(source, null, 2)}\n`);
writeFileSync(normalizedPath, `${JSON.stringify(normalized, null, 2)}\n`);
console.log(JSON.stringify({ rawPath, normalizedPath, pages: captures.length, parsedOfferRows: offers.length }, null, 2));
