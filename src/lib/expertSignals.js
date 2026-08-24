// src/lib/expertSignals.js
// ═══════════════════════════════════════════════════════════════════════════════
// NFL-ATLAS-1 — expert-signal matching for pinned futures (piece B of
// docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md).
//
// Reads research_pick_signals + research_intel_notes (already populated live
// by agents/research-intel-ingest.js — no new ingestion needed) and matches
// them against a pinned future by team nickname and/or market keyword. The
// matching algorithm itself is a browser-side port of two functions that
// already exist server-side in agents/futures-intel-report-v2.js
// (expertSignalsForTeam, valueSpotSourceLinks) — that file stays untouched
// (it's governed by FUTURES_REPORT_SPEC.md); this just reuses its
// already-correct, already-tested matching logic instead of reinventing it.
//
// Framing note (see design doc, Open Item 2): research_pick_signals has no
// real agree/disagree stance — `lean` is free text (the matched spread/total,
// or the article title), not a sentiment flag the way the podcast citation
// store's `sentiment: bullish/bearish` is. A signal that mentions a pin's
// team/market is NOT automatically "agreement" with that specific pin (e.g. a
// signal about the Dolphins winning the AFC East also matches a Bills
// division-winner pin on market keywords, but opposes it). Andy's call
// (2026-08-23): frame this panel neutrally as "signals mentioning this pick,"
// not agree/disagree — do not claim a stance the data doesn't support.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase, isAvailable } from './supabase.js';
import logger from './logger';

const LOOKBACK_HOURS = 24 * 30; // 30 days — futures-relevant signals age slower than game picks
const MAX_SIGNALS = 6;

/**
 * Strict nickname match: team_or_market must contain the team's last word.
 * Port of agents/futures-intel-report-v2.js's expertSignalsForTeam().
 */
function signalsForTeamNickname(team, signals) {
  const nick = String(team || '').toLowerCase().split(' ').at(-1);
  if (!nick) return [];
  return signals.filter((s) => String(s.team_or_market || '').toLowerCase().includes(nick));
}

/**
 * Market-keyword + team-nickname match against both notes and signals.
 * Port of agents/futures-intel-report-v2.js's valueSpotSourceLinks(), minus
 * the "why" team-signal/market-signal distinction that function used for its
 * Value Spots UI (not meaningful here — see the neutral-framing note above).
 */
function matchSignalsAndNotes(market, team, selection, notes, signals) {
  const teamLower = String(team || '').toLowerCase();
  const nickLower = teamLower.split(' ').at(-1);
  const selectionLower = String(selection || '').toLowerCase();
  const marketWords = [market, selection]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const matchedSignals = signals.filter((s) => {
    const text = [s.team_or_market, s.bet_type, s.lean, s.rationale].filter(Boolean).join(' ').toLowerCase();
    const teamHit = teamLower && (text.includes(teamLower) || (nickLower && text.includes(nickLower)));
    const selectionHit = selectionLower && text.includes(selectionLower);
    const marketHit = marketWords.some((w) => text.includes(w));
    return teamHit || selectionHit || marketHit;
  });

  const noteById = new Map(notes.map((n) => [n.id, n]));
  const seen = new Set();
  const sourceLinks = [];
  for (const s of matchedSignals) {
    const n = noteById.get(s.note_id);
    if (!n?.url || seen.has(n.url)) continue;
    seen.add(n.url);
    sourceLinks.push({ source: n.source, title: n.title || n.url, url: n.url });
    if (sourceLinks.length >= 3) break;
  }

  return { matchedSignals, sourceLinks };
}

/**
 * Fetch and match research_pick_signals/research_intel_notes against one
 * pinned future. Returns a flat, ready-to-render shape — never throws;
 * degrades to an empty result (same "not available yet" pattern the rest of
 * src/lib/supabase.js uses) if Supabase isn't configured or the tables are
 * unreachable.
 *
 * @param {{market: string, selection: string, team?: string}} pin
 * @returns {Promise<{ signals: Array<{author, source, rationale, betType, confidence}>, sourceLinks: Array<{source, title, url}> }>}
 */
export async function getExpertSignalsForPin(pin) {
  const empty = { signals: [], sourceLinks: [] };
  if (!isAvailable() || !pin?.market || !pin?.selection) return empty;

  try {
    const cutoff = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    const [{ data: signals, error: sigErr }, { data: notes, error: noteErr }] = await Promise.all([
      supabase
        .from('research_pick_signals')
        .select('note_id, source, author, team_or_market, bet_type, lean, rationale, confidence, captured_at')
        .gte('captured_at', cutoff)
        .order('captured_at', { ascending: false })
        .limit(500),
      supabase
        .from('research_intel_notes')
        .select('id, source, title, url')
        .gte('captured_at', cutoff)
        .limit(500),
    ]);

    if (sigErr || noteErr || !signals) return empty;

    const { matchedSignals, sourceLinks } = matchSignalsAndNotes(
      pin.market, pin.team, pin.selection, notes || [], signals,
    );

    // Prefer team-nickname matches when a team is set (tighter, per
    // expertSignalsForTeam's stricter rule) but fall back to the broader
    // market-keyword match set if the strict nickname pass finds nothing —
    // better to show a loosely-relevant signal than none for a non-team pin.
    const strict = pin.team ? signalsForTeamNickname(pin.team, matchedSignals) : [];
    const chosen = strict.length > 0 ? strict : matchedSignals;

    return {
      signals: chosen.slice(0, MAX_SIGNALS).map((s) => ({
        author: s.author || s.source || 'Unknown',
        source: s.source,
        rationale: s.rationale,
        betType: s.bet_type,
        confidence: s.confidence,
      })),
      sourceLinks,
    };
  } catch (e) {
    logger.warn('[expertSignals] getExpertSignalsForPin failed:', e.message);
    return empty;
  }
}
