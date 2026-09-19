// Turns what we read from a bookmarked tweet/thread into research_pick_signals rows.
//
// 2026-09-19: all 85 Twitter notes from Sep 12-19 had ZERO signals. Two causes: Vision OCR
// was silently failing (fixed separately), and tweet text was never parsed for picks by
// design ("labeled-fields-only"). Andy asked to capture everything relevant from these
// bookmarks, so the text of each tweet/thread now goes through a Gemini extraction that
// returns structured picks, and Vision's game_picks (previously ignored) are kept too.
// Only picks the author is making count -- public-money / "most bet" stats stay in the
// note text as context, not as signals.

export const TWEET_PICK_PROMPT = `You read NFL betting posts from X/Twitter (one tweet or a whole thread).
Return ONLY JSON: {"picks":[...]}. One entry per distinct bet the AUTHOR is recommending or has placed:
{
  "is_author_pick": true,            // false for public-betting %, "most bet", line-move reports, or other people's picks
  "bet_type": "spread|total|moneyline|player_prop|team_total|futures|survivor|parlay_leg|trend",
  "team_or_market": "Team name for sides/totals (e.g. 'Chicago Bears' or 'Bears @ Vikings total'); player name for props",
  "market": "prop market for player_prop (receiving yards, anytime TD, receptions...), else null",
  "selection": "team name, OVER/UNDER, YES, or player",
  "line": number or null,
  "odds": "American odds string or null",
  "rationale": "<=160 chars from the post"
}
Hit-rate / streak / "props that have cashed N straight" lists the author posts for bettors to use ARE included:
one entry per line with bet_type "trend", is_author_pick true, selection "OVER"/"YES", line = the threshold
(e.g. "C. Watson 3+ Rec - 80%" -> team_or_market "C. Watson", market "receptions", selection "OVER", line 2.5,
rationale "80% hit rate L10"). Skip games already played if the post says so.
Rules: NFL only (skip college, other sports). Do not invent lines. Legs of a posted parlay are separate entries with bet_type "parlay_leg" (keep their real market in "market"). Return {"picks":[]} if the post has no concrete bet.`;

const BET_TYPES = new Set(['spread', 'total', 'moneyline', 'player_prop', 'team_total', 'futures', 'survivor', 'parlay_leg', 'trend']);

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

export function buildTextPickSignalRows(picks, { noteId, eventRef, sourceLabel, author }) {
  return (Array.isArray(picks) ? picks : [])
    .filter((p) => p && p.is_author_pick !== false && clean(p.team_or_market))
    .map((p) => {
      const betType = BET_TYPES.has(p.bet_type) ? p.bet_type : 'other';
      const market = clean(p.market);
      const teamOrMarket = betType === 'player_prop' || betType === 'trend' || (betType === 'parlay_leg' && market)
        ? [clean(p.team_or_market), market].filter(Boolean).join(' - ')
        : clean(p.team_or_market);
      const lean = [clean(p.selection), p.line ?? '', clean(p.odds) ? `(${clean(p.odds)})` : '']
        .map((x) => String(x).trim()).filter(Boolean).join(' ') || 'unspecified';
      return {
        note_id: noteId,
        source: sourceLabel || 'Twitter/X Bookmarks (Personal)',
        author: author || null,
        team_or_market: teamOrMarket,
        bet_type: betType,
        lean,
        rationale: clean(p.rationale).slice(0, 220) || null,
        event_ref: eventRef,
        // model-extracted from prose (0.55); hit-rate trend lists are context, not a handicap (0.4)
        confidence: betType === 'trend' ? 0.4 : 0.55,
      };
    });
}

// Vision's game_picks were returned but never stored.
export function buildVisionGamePickRows(gamePicks, { noteId, eventRef, sourceLabel, author }) {
  return (Array.isArray(gamePicks) ? gamePicks : [])
    .filter((g) => g && clean(g.team))
    .map((g) => ({
      note_id: noteId,
      source: sourceLabel || 'Twitter/X Bookmarks (Personal)',
      author: author || null,
      team_or_market: clean(g.team),
      bet_type: /^[ou]\s?\d/i.test(clean(g.line)) ? 'total' : 'spread_or_ml',
      lean: clean(g.line) || 'unspecified',
      rationale: null,
      event_ref: eventRef,
      confidence: 0.5,
    }));
}

export function dedupeSignalRows(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.team_or_market.toLowerCase()}|${r.bet_type}|${String(r.lean).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
