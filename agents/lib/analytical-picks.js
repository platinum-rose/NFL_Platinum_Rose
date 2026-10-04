// agents/lib/analytical-picks.js
//
// Pick extraction for "analytical" research-intel feeds (Sharp Football, PFT,
// PFF, Rotowire, Walter Football). Until 2026-10-01 these feeds skipped signal
// extraction entirely, which dropped real picks (Sharp's weekly best bets,
// PFT's predicted scores, Walter's ATS picks). The generic betting-feed
// extractor can't simply be pointed at them: tested against the Week 4 corpus
// (150 notes), it produced ~125 junk "title as pick" signals (site menus
// contain "odds"/"picks") and ~45 junk line matches (stat deltas like
// "Air Yards Per Game -3.3", worksheet labels like "Spread -2.5",
// award odds like "Will Anderson at +300").
//
// So every analytical article body is parsed (no title gating), but a match
// only becomes a signal when it reads like a pick:
//   1. Source-specific parsers (Walter's "Week N NFL Pick:" block).
//   2. Predicted scores ("Steelers 17, Browns 13.") when the article states
//      several of them (a picks column, not a game recap).
//   3. Side/total/ML lines whose team token is an exact NFL team name and
//      whose sentence carries pick language ("I like", "take", "best bet").
// There is no title-as-pick fallback for analytical feeds.

import { NFL_TEAMS } from '../../src/lib/teams.js';

// ---------------------------------------------------------------------------
// Team lexicon: exact phrases only (getTeam() does substring matching, which
// turns "Tampa Bay Rank -4.0" or "Chiefs ML" into teams).
const AMBIGUOUS = new Set(['new york', 'los angeles', 'la', 'ny']);
const LEX = new Map();
const ABBR = new Map();
for (const t of Object.values(NFL_TEAMS)) {
  const phrases = [t.name, t.fullName, t.city, ...(t.aliases || [])];
  for (const p of phrases) {
    const k = String(p || '').toLowerCase().trim();
    if (!k || AMBIGUOUS.has(k) || k.length < 3) continue;
    LEX.set(k, t);
  }
  for (const a of [t.abbreviation, ...(t.altAbbreviations || [])]) if (a) ABBR.set(a.toUpperCase(), t);
}
LEX.set('ny giants', NFL_TEAMS.Giants || LEX.get('giants'));
LEX.set('ny jets', NFL_TEAMS.Jets || LEX.get('jets'));
LEX.set('redskins', LEX.get('commanders'));

/** Exact team lookup on a short phrase; abbreviations only when written in caps. */
export function teamFromPhrase(phrase) {
  const raw = String(phrase || '').replace(/[’']s$/i, '').trim();
  if (!raw) return null;
  if (/^[A-Z]{2,3}$/.test(raw) && ABBR.has(raw)) return ABBR.get(raw);
  return LEX.get(raw.toLowerCase()) || null;
}

/** Resolve the team named by the last 1-3 words of `prefix` (exact match only). */
function trailingTeam(prefix) {
  const words = String(prefix).trim().split(/\s+/).slice(-3);
  for (let k = Math.min(3, words.length); k >= 1; k--) {
    const t = teamFromPhrase(words.slice(-k).join(' '));
    if (t) return { team: t, text: words.slice(-k).join(' ') };
  }
  return null;
}

const decode = (s) => String(s || '')
  .replace(/&#0?38;|&amp;/g, '&').replace(/&#x27;|&#39;|&rsquo;|’/g, "'")
  .replace(/&#44;/g, ',').replace(/&#8211;|&ndash;/g, '-').replace(/\s+/g, ' ');

// Lines of article text with markdown/link markup removed (archived bodies are markdown; ingested bodies are plain text).
function cleanLines(text) {
  return String(text || '').split(/\n+/).map((l) => decode(l.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').replace(/^\s*(?:#{1,6}|[-*>]|\d+\.)\s+/, '')).trim()).filter(Boolean);
}
function sentences(text) {
  // Split on line breaks (headings, list items, pick boxes) and on sentence ends, keeping decimals ("-2.5") intact.
  return cleanLines(text).flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/));
}

const PICK_CUE = /\b(i like|we like|i'?ll take|we'?ll take|i'?m taking|we'?re taking|take the|taking the|lay the|laying the|lean(?:ing)?\b|my pick|our pick|the pick|pick:|picks?:|best bets?|bet on|betting on|backing|play on|hammer|fade|prediction:|recommend|i'?d (?:take|bet|play)|give me|i'?ll go|for me|bet:|the play|best of the rest|teaser of the week|more plays|other plays|additional plays|plays for|my plays|also like)(?:\b|(?<=:))/gi;
// 2026-10-03: the trailing \b never matched after a colon, so "Erickson's Pick: Colts -3.5" or "Bet: Texans ML" had no cue.
// A line only counts when it sits near a cue (some lines run long once markup is stripped).
const CUE_BEFORE = 100, CUE_AFTER = 160;
function cueSpans(s) { return [...s.matchAll(PICK_CUE)].map((m) => [m.index - CUE_BEFORE, m.index + m[0].length + CUE_AFTER]); }
const nearCue = (spans, i) => spans.some(([a, b]) => i >= a && i <= b);

function confidenceFor(base, delta) {
  return Number(Math.max(0.3, Math.min(0.95, (base ?? 0.65) + delta)).toFixed(3));
}

// ---------------------------------------------------------------------------
// 1. Walter Football: "Week 4 NFL Pick: Steelers 20, Browns 16 Steelers -2.5 (0 Units)
//    Under 38.5 (0 Units) Prop: ... (0.25 Units) - FanDuel Parlay: ... (0.10 Units) - FanDuel"
export function parseWalterPicks(text, { source = 'Walter Football', baseConfidence = 0.63, eventRef = null } = {}) {
  // Graded columns append "-- Correct; +$50" / "-- Incorrect; $0" after each pick (2026-10-03).
  const t = decode(String(text || '').replace(/\*\*/g, '')).replace(/_?\s*--\s*(?:Correct|Incorrect|Push|Win|Loss)\s*;?\s*[+-]?\$[\d,.]+\s*_?/gi, ' ');
  const out = [];
  const blockRe = /Week \d+ NFL Pick:\s*(.+?)(?=Week \d+ NFL Pick:|Premium members|Prop\/Teaser\/Parlay Picks|Comments on the|$)/g;
  let b;
  while ((b = blockRe.exec(t))) {
    const block = b[1];
    const score = block.match(/^([A-Z0-9][A-Za-z0-9 .']{1,25}?) (\d{1,2}), ([A-Z0-9][A-Za-z0-9 .']{1,25}?) (\d{1,2})\b/);
    let rest = block;
    let matchup = null;
    if (score) {
      const [whole, n1, s1, n2, s2] = score;
      const t1 = teamFromPhrase(n1), t2 = teamFromPhrase(n2);
      rest = block.slice(whole.length);
      if (t1 && t2 && t1 !== t2) {
        matchup = `${t1.abbreviation} vs ${t2.abbreviation}`;
        const a = Number(s1), c = Number(s2);
        if (a !== c) {
          const [w, l, ws, ls] = a > c ? [t1, t2, a, c] : [t2, t1, c, a];
          out.push({ source, team_or_market: w.fullName, bet_type: 'moneyline', lean: `${w.name} to win (predicted ${ws}-${ls})`,
            rationale: `Walter predicted score: ${n1} ${s1}, ${n2} ${s2} (${matchup}; margin ${ws - ls}, total ${ws + ls}).`,
            event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.1) });
        }
      }
    }
    const itemRe = /\s*(?:(Prop|Parlay|Teaser):\s*)?(.+?)\s*\((\d+(?:\.\d+)?) Units?\)(?:\s*-\s*([A-Z][A-Za-z]+)(?=\s|$))?/g;
    let m;
    while ((m = itemRe.exec(rest))) {
      const [, kind, selRaw, unitsRaw, book] = m;
      const sel = selRaw.trim();
      const units = Number(unitsRaw);
      let bet_type = 'other';
      if (kind === 'Prop') bet_type = 'player_prop';
      else if (kind === 'Parlay' || kind === 'Teaser') bet_type = 'parlay_leg';
      else if (/^(Over|Under)\s\d/i.test(sel)) bet_type = 'total';
      else if (/\s[+-]\d{1,2}(\.5)?$|\sPK$|\spick'?em$/i.test(sel)) bet_type = 'spread';
      else if (/\b(ML|moneyline)\b/i.test(sel)) bet_type = 'moneyline';
      const strength = units >= 3 ? 0.08 : units >= 1 ? 0.03 : units > 0 ? -0.05 : -0.12; // 0 units = lean only
      out.push({ source, team_or_market: bet_type === 'total' && matchup ? `${matchup} ${sel}` : sel, bet_type, lean: sel,
        rationale: `Walter Week pick: ${sel} (${unitsRaw} units${book ? `, ${book}` : ''})${matchup ? ` - ${matchup}` : ''}.`,
        event_ref: eventRef, confidence: confidenceFor(baseConfidence, strength) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Predicted scores: "Steelers 17, Browns 13." Counted only when an article
//    states at least MIN_SCORE_PICKS distinct matchups (a picks column).
const MIN_SCORE_PICKS = 3;
export function parseScorePredictions(text, { source, baseConfidence = 0.65, eventRef = null } = {}) {
  const t = decode(text);
  const re = /\b((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+) (\d{1,2}), ((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+) (\d{1,2})(?=[.;)\s]|$)/g;
  const picks = new Map();
  let m;
  while ((m = re.exec(t))) {
    const a = trailingTeam(m[1]); const b = trailingTeam(m[3]);
    if (!a || !b || a.team === b.team) continue;
    // the second team phrase must be exactly a team (not "Browns coach Kevin")
    if (teamFromPhrase(m[3]) !== b.team && !teamFromPhrase(m[3].split(' ').slice(-1)[0])) continue;
    const s1 = Number(m[2]), s2 = Number(m[4]);
    if (s1 === s2 || s1 > 70 || s2 > 70) continue;
    const key = [a.team.abbreviation, b.team.abbreviation].sort().join('-');
    if (!picks.has(key)) picks.set(key, { a: a.team, b: b.team, s1, s2 });
  }
  if (picks.size < MIN_SCORE_PICKS) return [];
  return [...picks.values()].map(({ a, b, s1, s2 }) => {
    const [w, l, ws, ls] = s1 > s2 ? [a, b, s1, s2] : [b, a, s2, s1];
    return { source, team_or_market: w.fullName, bet_type: 'moneyline', lean: `${w.name} to win (predicted ${ws}-${ls})`,
      rationale: `Predicted score: ${w.name} ${ws}, ${l.name} ${ls} (${a.abbreviation} vs ${b.abbreviation}; margin ${ws - ls}, total ${ws + ls}).`,
      event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.1) };
  });
}

// ---------------------------------------------------------------------------
// 3. Context-gated side / total / ML lines.
const MATCHUP_RE = /((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+)\s(?:@|at|vs\.?|versus)\s((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+)/g;
// pickColumn (title reads like a picks column, e.g. "Wes Reynolds: NFL Week 4 Best Bets"): a short standalone
// line that is only a pick ("New England Patriots +7 at Buffalo Bills", "Houston Texans -145 ML vs. Dallas Cowboys")
// counts as a pick heading. A short cue line with no line of its own ("BEST OF THE REST", "Teaser of the week")
// covers the next CARRY_LINES lines.
const CARRY_LINES = 3;
// "Denver Broncos +3.0 (-115) vs. San Francisco 49ers", "Colts -3.5 ( -192 )", "Houston Texans -145 ML vs. Dallas Cowboys",
// "Miami Dolphins vs. Minnesota Vikings Under 39.5 Points (-115)", "Jacksonville Jaguars at Cincinnati Bengals total points OVER 51"
const PRICE = String.raw`(?: \(\s*[+-]\d{3}\s*\))?`;
const STANDALONE = new RegExp(String.raw`^(?:[A-Z][A-Za-z.']+ ){0,3}[A-Z0-9][A-Za-z0-9.']+ (?:[+-]\d{1,2}(?:\.[05])?|[+-]\d{3} ML|ML|PK)${PRICE}(?: (?:at|vs\.?|versus|@) (?:[A-Z0-9][A-Za-z0-9.']+ ?){1,4})?$`
  + String.raw`|^(?:[A-Z0-9][A-Za-z0-9.']+(?: vs\.?| at|-|/| )?\s?){1,8}(?: total points)? (?:Over|Under|OVER|UNDER) \d{2}(?:\.[05])?(?: [Pp]oints)?${PRICE}$`);
const PRICED = /\(\s*[+-]\d{3}\s*\)\s*(?:(?:at|vs\.?|versus|@)\s.*)?$/;
// Sentences that quote a market line or a past result rather than make a pick
// ("The advance line was Colts -4.5", "we went 4-2 ATS with wins on the Steelers +3.5").
const NOT_PICK = /\b(advance line|look-?ahead line|line (?:was|opened|moved|dropped|rose|fell)|re-?opened|opened (?:at|as)|went \d+-\d+|last week'?s? (?:column|picks|best bets)|wins? (?:were )?on the|losses were|cashed|we'?re \d+-\d+ (?:ats|on)|record (?:is|of)|was a winner|lost with|best bet was|pick was|last week:|result:)\b|"no" on\b/i;
export function parseGatedLines(text, { source, baseConfidence = 0.65, eventRef = null, max = 8, pickColumn = false, week = null } = {}) {
  const run = (useStandalone) => gatedPass(text, { source, baseConfidence, eventRef, max, useStandalone, week });
  // In a picks column a heading that carries its price ("Denver Broncos +3.0 (-115) vs. San Francisco 49ers") is a pick.
  const first = run(pickColumn ? 'priced' : false);
  // Other pick headings only count in a column that states no inline picks of its own (a column with "Best Bet: ..."
  // lines uses its headings for the game listing: "Pittsburgh -3 at Cleveland").
  if (!pickColumn || first.filter((x) => x.inline).length >= 2) return first.map(strip);
  return run(true).map(strip);
}
const strip = ({ inline, ...x }) => x;
function gatedPass(text, { source, baseConfidence, eventRef, max, useStandalone, week }) {
  const out = [];
  const seen = new Set();
  let carry = 0, stale = false, prevLine = '';
  for (const line of cleanLines(text)) {
    // A section about another week ("Additional Week 3 Best Bets", "Last week's results") is skipped
    // until a line names this week again.
    // Only heading-length lines switch sections; prose that mentions "won in Week 3" does not.
    // ...and only when the line is about picks or results ("Additional Week 3 Best Bets", "Week 3 results"),
    // so a sidebar link like "NFL Week 3 grades" does not switch off the article below it.
    const wk = week && line.length <= 70 ? line.match(/\bweek (\d{1,2})\b/i) : null;
    if (wk && Number(wk[1]) !== week && (cueSpans(line).length || /\b(results?|record|recap)\b/i.test(line))) { stale = true; carry = 0; continue; }
    if (wk && Number(wk[1]) === week) stale = false;
    else if (wk && stale) continue;   // "Week 3 Picks" inside a stale section keeps it stale
    if (stale) continue;
    const standalone = !!useStandalone && line.length <= 90 && STANDALONE.test(line) && (useStandalone !== 'priced' || PRICED.test(line));
    const carried = carry > 0 && line.length <= 90;   // carry reaches list items, not paragraphs
    let lineCue = false, pushed = 0;
    for (const s of line.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/)) {
      if (NOT_PICK.test(s)) continue;
      let spans = cueSpans(s);
      const inline = spans.length > 0;
      if (spans.length) lineCue = true;
      else if (carried || standalone) spans = [[-1, Infinity]];
      if (!spans.length) continue;
      // sides: "<Team> -2.5" / "+3" / "PK" -- 1-2 digit lines only (odds like +750 are rejected).
      // 2026-10-03: a line that ends the sentence ("Packers -3.") used to be dropped by a (?![\d.]) lookahead.
      for (const m of s.matchAll(/((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+)\s([+-]\d{1,2}(?:\.[05])?|PK|pick'?em)(?!\d|\.\d)(?!\s*(?:yards|yds|points|pts|%|percent))/g)) {
        if (!nearCue(spans, m.index)) continue;
        // "fade the Rams -3" is a pick AGAINST that line, not on it
        if (/\bfad(?:e|ing)\s+(?:the\s+)?(?:[A-Z][A-Za-z.']+\s+){0,2}$/i.test(s.slice(Math.max(0, m.index - 30), m.index) + m[1].replace(/\S+$/, ''))) continue;
        const tt = trailingTeam(m[1]);
        if (!tt) continue;
        const lean = `${tt.team.name} ${m[2].replace(/\.0$/, '')}`;
        const key = `spread|${lean.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline, source, team_or_market: lean, bet_type: 'spread', lean, rationale: s.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.06) });
      }
      // moneylines: "<Team> ML" / "<Team> moneyline"
      // "Texans ML", "Commanders Moneyline (+160)", "Colts on the moneyline", "Rams -185 moneyline"
      for (const m of s.matchAll(/((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+)\s(?:on the\s)?(?:[+-]\d{3}\s)?(?:ML|[Mm]oneyline)\b/g)) {
        if (!nearCue(spans, m.index)) continue;
        const tt = trailingTeam(m[1]);
        if (!tt) continue;
        const lean = `${tt.team.name} ML`;
        const key = `ml|${lean.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline, source, team_or_market: lean, bet_type: 'moneyline', lean, rationale: s.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.06) });
      }
      // "I'll take the +2.5 with the Giants" (line before the team)
      for (const m of s.matchAll(/(?<=^|\s)([+-]\d{1,2}(?:\.5)?) (?:with|on) the ((?:[A-Z0-9][A-Za-z0-9.']+ ?){1,3})/g)) {
        if (!nearCue(spans, m.index)) continue;
        const tt = trailingTeam(m[2].trim()) || (teamFromPhrase(m[2].trim()) && { team: teamFromPhrase(m[2].trim()) });
        if (!tt) continue;
        const lean = `${tt.team.name} ${m[1]}`;
        const key = `spread|${lean.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline, source, team_or_market: lean, bet_type: 'spread', lean, rationale: s.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.06) });
      }
      // "My Pick: Saints" / "Pick: Lions" -- a bare team after the pick label is a straight-up pick
      for (const m of s.matchAll(/(?:^|[\s(])(?:[Mm]y |[Oo]ur |[Tt]he )?[Pp]ick:\s*(?:[Tt]he\s)?((?:[A-Z0-9][A-Za-z0-9.']+ ?){1,3}?)(?=\s*(?:$|[,.;(]|\s(?:to win|outright|straight up)))/g)) {
        const t = teamFromPhrase(m[1].trim());
        if (!t) continue;
        const lean = `${t.name} ML`;
        const key = `ml|${lean.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline, source, team_or_market: lean, bet_type: 'moneyline', lean, rationale: s.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.1) });
      }
      // totals: "Over/Under 38.5" (game-total range only; player props stay with prop parsers)
      for (const m of s.matchAll(/\b(Over|Under)\s(\d{2}(?:\.[05])?)(?!\d|\.\d)(?!\s*(?:yards|yds|receiving|rushing|passing|receptions|catches|tackles|points scored by|%|percent|pass|rush|attempts|completions|carries|targets|interceptions|sacks|tds?\b|touchdowns|fantasy))/gi)) {
        if (!nearCue(spans, m.index)) continue;
        // "30 under 30" (a list title) and "Bet to Under 38" (a price threshold, not a second pick)
        const before = s.slice(Math.max(0, m.index - 16), m.index);
        if (/\d\s*$/.test(before) || /\b(?:bet|play(?:able)?|good|down|up) to\s*$/i.test(before)) continue;
        const n = Number(m[2]);
        if (n < 30 || n > 65) continue;
        const lean = `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2].replace(/\.0$/, '')}`;
        // label with the nearest preceding "A @ B" / "A at B" / "A vs. B" in the sentence
        let matchup = null;
        for (const g of s.slice(0, m.index).matchAll(MATCHUP_RE)) {
          const a = trailingTeam(g[1]); const b = teamFromPhrase(g[2]) || trailingTeam(g[2])?.team;
          if (a && b && a.team !== b) matchup = `${a.team.abbreviation} @ ${b.abbreviation}`;
        }
        const market = matchup ? `${matchup} ${lean}` : lean;
        const key = `total|${market.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline, source, team_or_market: market, bet_type: 'total', lean, rationale: s.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.06) });
      }
      if (out.length >= max) break;
    }
    // Heading + analyst line: "Dallas Cowboys +2.5 at Houston Texans" / "Bowen: I'll take Dallas -- with the points".
    // A cue line that names a team but states no line takes that team's line from the heading just above it.
    if (lineCue && !pushed && prevLine && prevLine.length <= 90) {
      // the team has to follow the cue directly ("I'll take Dallas", "give me the Bills"), not just appear in the paragraph
      const said = [...line.matchAll(PICK_CUE)].filter((c) => !/^fade/i.test(c[0])).map((c) => ' ' + line.slice(c.index + c[0].length, c.index + c[0].length + 30).toLowerCase().replace(/^\s*(?:the|with the|on the)\s/, ' ') + ' ').join('|');
      for (const m of prevLine.matchAll(/((?:[A-Z][A-Za-z.']+ ){0,2}[A-Z0-9][A-Za-z0-9.']+)\s([+-]\d{1,2}(?:\.5)?|PK)(?!\d|\.\d)/g)) {
        const tt = trailingTeam(m[1]);
        if (!tt) continue;
        const names = [tt.team.name, tt.team.city, tt.team.fullName].filter(Boolean).map((x) => String(x).toLowerCase());
        if (!names.some((nm) => said.includes(' ' + nm + ' ') || said.includes(' ' + nm + ' --') || said.includes(' ' + nm + ','))) continue;
        const lean = `${tt.team.name} ${m[2]}`;
        const key = `spread|${lean.toLowerCase()}`;
        if (seen.has(key)) continue; seen.add(key);
        pushed++; out.push({ inline: true, source, team_or_market: lean, bet_type: 'spread', lean, rationale: `${prevLine} -- ${line}`.slice(0, 280), event_ref: eventRef, confidence: confidenceFor(baseConfidence, -0.06) });
      }
    }
    prevLine = line;
    if (out.length >= max) break;
    // Only a short header-style cue line ("BEST OF THE REST", "Teaser of the week") carries to the lines below it;
    // "Best Bet: Pass" does not (the next lines are the next game's listing).
    if (lineCue && !pushed && line.length <= 40 && !/\b(pass|no play|stay away)\b/i.test(line)) carry = CARRY_LINES;
    else if (carried && pushed) carry = CARRY_LINES;   // a list keeps going ("Four more plays for Sunday:" + 4 lines)
    else if (carry > 0) carry--;
  }
  return out.slice(0, max);
}

// ---------------------------------------------------------------------------
/** Router used by research-intel-ingest for analytical feeds (teaser or body text). */
// 2026-10-03: caps raised (gated lines 8 -> 48, total 16 -> 60) so a 16-game slate column keeps a side + total for every game.
// scores: false for betting feeds, whose previews quote past results ("Bills 31, Patriots 13 last season").
// title: a recap / scores / grades article quotes final scores, which must not read as predicted scores.
const RECAP_TITLE = /recap|scores and|scores for|results|grades|final score|takeaways|what we learned|instant analysis/i;
export function extractAnalyticalSignals(text, { source, baseConfidence, eventRef, max = 60, scores = true, pickColumn = false, week = null, title = '' } = {}) {
  const opts = { source, baseConfidence, eventRef };
  const out = [];
  const walter = (/walter/i.test(source || '') || /Week \d+ NFL Pick:/.test(text || '')) ? parseWalterPicks(text, opts) : [];
  out.push(...walter);
  if (scores && !RECAP_TITLE.test(title || '')) out.push(...parseScorePredictions(text, opts));
  // Walter's pick blocks are parsed above; the line parser would re-read the same picks ("Under 38.5 (0 Units)").
  if (!walter.length) out.push(...parseGatedLines(text, { ...opts, max: 48, pickColumn, week }));
  const seen = new Set();
  return out.filter((s) => {
    const k = `${String(s.team_or_market).toLowerCase()}|${s.bet_type}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  }).slice(0, max);
}

// ---------------------------------------------------------------------------
/** Picks from a full article body, for any feed (research-intel-ingest + the re-extraction script).
 *  A picks column ("Wes Reynolds: NFL Week 4 Best Bets") states each pick as its own heading line;
 *  "Week N" in the title lets sections about other weeks be skipped; predicted scores only for
 *  analytical feeds (betting previews quote past results). */
export const PICK_COLUMN_TITLE = /best bets?|\bbets\b|picks|predictions|takes\b|plays\b|leans\b/i;
export function extractBodySignals({ source, sourceType, confidence, url, title, body, max = 60 }) {
  return extractAnalyticalSignals(body, {
    source,
    baseConfidence: confidence,
    eventRef: url,
    max,
    scores: sourceType === 'analytical',
    pickColumn: PICK_COLUMN_TITLE.test(title || ''),
    week: Number((String(title || '').match(/\bweek (\d{1,2})\b/i) || [])[1]) || null,
    title,
  });
}
