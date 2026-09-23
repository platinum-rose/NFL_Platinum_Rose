// agents/lib/pick-normalize.js
// Pick clean-up for agents/pick-extraction.js (added 2026-09-22).
//
// 1. Teaser legs. Podcast extraction has no teaser type, so a teased leg comes
//    through as `spread` at the teased number (Even Money: "Browns +8.5" when
//    the market is +2.5). Promoted as-is that is a spread pick at a line no
//    book offers. classifyTeaser() relabels it pick_type 'teaser', keeps the
//    teased line (a teaser leg grades exactly like a spread at that line), and
//    records the market line + Wong status in the rationale.
//      - explicit: pick.type / summary mentions tease|teaser|wong
//      - implicit: spread line sits TEASER_MIN..TEASER_MAX points better for the
//        bettor than the market line for that side (schedule.json spread)
//    Wong leg = the pre-tease line crosses both 3 and 7: dog +1.5..+2.5 or
//    favourite -7.5..-8.5 (6-pt teaser).
// 2. Duplicates. Same episode + same host + same game + same pick type + same
//    selection = one pick. Line is not in the key (the same call is often read
//    twice at slightly different numbers); the first copy with a line wins.

export const TEASER_MIN = 4.5;
export const TEASER_MAX = 7.5;
const TEASER_TEXT = /\btease[rds]?\b|\bteasing\b|\bwong\b/i;

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// schedule.json `spread` is the HOME line (ATL@GB -6 => GB -6).
export function marketLineFor(game, isHome) {
  const s = num(game?.spread);
  if (s === null || s === 0) return null; // 0 = no line posted; can't infer
  return isHome ? s : -s;
}

export function isWongLeg(originalLine) {
  if (originalLine === null) return false;
  return (originalLine >= 1.5 && originalLine <= 2.5) || (originalLine <= -7.5 && originalLine >= -8.5);
}

const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);

/**
 * @returns null when not a teaser, else
 *   { points, teasedLine, originalLine, marketLine, wong, basis: 'explicit'|'implied' }
 */
export function classifyTeaser(pick, game, isHome) {
  const type = String(pick?.type ?? '').toLowerCase();
  const explicit = type.includes('teas') || TEASER_TEXT.test(pick?.summary ?? '') || TEASER_TEXT.test(pick?.selection ?? '');
  if (!explicit && type !== 'spread') return null;

  const line = num(pick?.line);
  const market = game ? marketLineFor(game, isHome) : null;

  if (explicit) {
    const pts = num((String(pick?.summary ?? '').match(/(\d{1,2}(?:\.5)?)[\s-]*(?:pt|point)/i) ?? [])[1]) ?? 6;
    if (line === null) return { points: pts, teasedLine: null, originalLine: market, marketLine: market, wong: isWongLeg(market), basis: 'explicit' };
    // Was the quoted number the teased line or the pre-tease line?
    const quotedIsOriginal = market !== null && Math.abs(line - market) <= 1.5;
    const originalLine = quotedIsOriginal ? line : line - pts;
    const teasedLine = quotedIsOriginal ? line + pts : line;
    return { points: pts, teasedLine, originalLine, marketLine: market, wong: isWongLeg(originalLine), basis: 'explicit' };
  }

  if (line === null || market === null) return null;
  const delta = line - market;
  if (delta < TEASER_MIN || delta > TEASER_MAX) return null;
  const originalLine = line - 6;
  return { points: 6, teasedLine: line, originalLine, marketLine: market, wong: isWongLeg(originalLine), basis: 'implied' };
}

export function teaserLabel(t, teamAbbr) {
  const kind = t.wong ? 'Wong teaser leg' : 'teaser leg (not Wong)';
  const orig = t.originalLine !== null ? fmt(t.originalLine) : '?';
  const teased = t.teasedLine !== null ? fmt(t.teasedLine) : '?';
  const mkt = t.marketLine !== null ? `; market ${fmt(t.marketLine)}` : '';
  const how = t.basis === 'implied' ? '; inferred from line vs market' : '';
  return `[TEASER — ${t.points}-pt ${kind}: ${teamAbbr ?? ''} ${orig} → ${teased}${mkt}${how}]`;
}

export function dedupeKey({ episodeId, host, gameId, pickType, selection }) {
  const sel = String(selection ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return [episodeId, String(host ?? '').toLowerCase(), gameId, pickType, sel].join('|');
}
