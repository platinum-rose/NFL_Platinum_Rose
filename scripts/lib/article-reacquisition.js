// Article/source reacquisition — pure logic (2026-08-13).
//
// Closes the "31 metadata-only + 181 suspected-ingest-cap" article gap
// documented in data/research-intel/review/article-intel-review-latest.json
// and both incident-review docs. Root cause (agents/research-intel-ingest.js's
// BODY_MAX_CHARS) is fixed separately — this module re-acquires the 212
// records that already got truncated/empty before that fix landed.
//
// Every function here is pure (no fetch, no fs) so it's fully unit-testable
// without network access — same convention as agents/lib/win-dist.js and
// agents/lib/board-validate.js. The one thing that genuinely needs a live
// network call (re-fetching each URL) lives in
// scripts/reacquire-article-sources.js's thin CLI wrapper, which this sandbox
// cannot exercise live (confirmed no outbound network access, same as every
// other live-ingest agent in this repo — F-31). See
// docs/FUTURES_ARTICLE_REACQUISITION_AND_GATES_DESIGN_2026-08-13.md §4.

import { createHash } from 'node:crypto';

export const ARTICLE_REACQUISITION_SCHEMA = 'article_reacquisition_v1';

export const REACQUISITION_TARGET_STATUSES = Object.freeze(['metadata_only', 'suspected_ingest_cap']);

export function sha256Hex(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

/**
 * Selects the exact record set this whole workflow exists for: every article
 * whose body_evidence_status is metadata_only or suspected_ingest_cap. Mirrors
 * data/research-intel/review/article-intel-review-latest.json's own
 * summary.body_evidence bucket counts — a caller can sanity-check
 * selectReacquisitionTargets(review).length against
 * review.summary.body_evidence.metadata_only + .suspected_ingest_cap.
 */
export function selectReacquisitionTargets(articleReview) {
  const articles = Array.isArray(articleReview?.articles) ? articleReview.articles : [];
  return articles
    .filter((article) => REACQUISITION_TARGET_STATUSES.includes(article?.body_evidence_status))
    .map((article) => ({
      id: article.id,
      url: article.url,
      title: article.title,
      source: article.source,
      author: article.author,
      published_at: article.published_at,
      body_evidence_status: article.body_evidence_status,
      previous_body_chars: Number(article.body_chars || 0),
    }));
}

/**
 * Strips HTML the same way agents/research-intel-ingest.js's
 * fetchArticleBody() does (scripts/styles/nav/header/footer removed, tags
 * stripped, whitespace collapsed) — kept separate and exported here so the
 * stripping logic itself is unit-testable without a live fetch.
 */
export function stripHtmlToText(html) {
  return String(html ?? '')
    .replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 2026-08-13 Codex review finding #6: this table/column is where a future
// promotion step would write recovered bodies back to. Recorded here (not
// guessed at promotion time) so the promotion artifact is self-describing.
// Source: agents/research-intel-ingest.js writes article bodies to
// research_intel_notes.body (a plain Postgres text column, no migration
// needed for the BODY_MAX_CHARS fix) and scripts/build-article-intel-review.js
// confirms article.id === research_intel_notes.id (see its `id: row.id`).
export const REACQUISITION_TARGET_SUPABASE_TABLE = 'research_intel_notes';
export const REACQUISITION_TARGET_SUPABASE_PK_COLUMN = 'id';

const EXCERPT_CHARS = 280;

function excerpt(text, chars = EXCERPT_CHARS) {
  const value = String(text ?? '');
  if (!value) return null;
  return value.length > chars ? `${value.slice(0, chars)}…` : value;
}

/**
 * Builds one reacquisition record from a fetch outcome. NEVER overwrites —
 * the caller writes this alongside (not instead of) the original truncated
 * record, so a diff is always possible later. Inaccessible URLs are marked
 * `unavailable` explicitly rather than silently dropped or reconstructed
 * from memory (the incident brief's own explicit instruction, §4.1).
 *
 * Also carries the fields a future Supabase-promotion step needs to review
 * and approve a body swap without re-deriving them (Codex review finding
 * #6). `previous_body_sha256`/`previous_body_excerpt` are deliberately
 * `null` with an explicit `previous_body_unavailable_reason` — the local
 * article-intel-review artifact this module reads from (see
 * selectReacquisitionTargets()) only carries `body_chars`, never the actual
 * previous body text, so hashing/excerpting the old body would require a
 * live Supabase read of research_intel_notes.body. That is a separate,
 * explicitly-scoped future step, not something this local-only pure module
 * should silently fake or skip past.
 *
 * @param target        - one entry from selectReacquisitionTargets()
 * @param fetchOutcome  - { ok: boolean, httpStatus?: number, rawHtml?: string, error?: string }
 */
export function buildReacquiredRecord(target, fetchOutcome, retrievedAt = new Date().toISOString()) {
  const base = {
    schema: ARTICLE_REACQUISITION_SCHEMA,
    id: target.id,
    url: target.url,
    title: target.title,
    source: target.source,
    author: target.author,
    published_at: target.published_at,
    retrieved_at: retrievedAt,
    previous_body_evidence_status: target.body_evidence_status,
    previous_body_chars: target.previous_body_chars,
    previous_body_sha256: null,
    previous_body_excerpt: null,
    previous_body_unavailable_reason: 'article-intel-review artifact does not retain body text, only body_chars; would require a live Supabase read of research_intel_notes.body (out of scope for this local-only module)',
    // Promotion-review scaffolding — never auto-set to 'approved' by this
    // module. A human (or an explicitly separate, approved step) must flip
    // this before any Supabase write happens.
    promotion_status: 'pending_review',
    promotion_reason: null,
    reviewer: null,
    reviewed_at: null,
    supabase_table: REACQUISITION_TARGET_SUPABASE_TABLE,
    supabase_primary_key_column: REACQUISITION_TARGET_SUPABASE_PK_COLUMN,
    supabase_primary_key: target.id,
  };

  if (!fetchOutcome?.ok) {
    return {
      ...base,
      status: 'unavailable',
      reason: fetchOutcome?.error || `http_${fetchOutcome?.httpStatus ?? 'unknown'}`,
      new_body: null,
      new_body_chars: 0,
      new_body_sha256: null,
      new_body_excerpt: null,
      diff_summary: 'not recovered — no candidate body to diff against the previous record',
    };
  }

  const text = stripHtmlToText(fetchOutcome.rawHtml);
  if (!text) {
    return {
      ...base,
      status: 'unavailable',
      reason: 'empty_body_after_strip',
      new_body: null,
      new_body_chars: 0,
      new_body_sha256: null,
      new_body_excerpt: null,
      diff_summary: 'not recovered — fetch succeeded but stripped to an empty body',
    };
  }

  const improved = text.length > target.previous_body_chars;
  const deltaChars = text.length - Number(target.previous_body_chars || 0);
  return {
    ...base,
    status: 'recovered',
    reason: null,
    new_body: text,
    new_body_chars: text.length,
    new_body_sha256: sha256Hex(text),
    new_body_excerpt: excerpt(text),
    improved,
    diff_summary: improved
      ? `recovered body is ${deltaChars} char(s) longer than the previous ${target.previous_body_chars} (${target.previous_body_chars} -> ${text.length})`
      : `recovered body (${text.length} chars) is not longer than the previous ${target.previous_body_chars} chars — review before promoting`,
  };
}

// Conservative multi-selection candidate surfacing — NOT a full NLP splitter.
// Confirmed real example this targets: a single Sharp Football "Best Unders
// to Target" article containing both "Tyler Shough under 3449.5 passing
// yards at +100" and "Fernando Mendoza — Under 2299.5", which the original
// extractor flattened into one malformed record (selection: "NO", a New
// Orleans abbreviation misread, not a player pick). This heuristic looks for
// "<Capitalized Name(s)> ... (over|under) ... <number>" clusters and returns
// one candidate segment per match — always surfaced for human/LLM review
// before promotion, never auto-promoted to actual_picks.
// Deliberately tight: the name must sit IMMEDIATELY before "over/under" (only
// a short dash/colon/"is" connector allowed between them, no free-running
// text gap) so an unrelated earlier capitalized word can't get mistaken for
// the name — that failure mode is exactly how the real Tyler Shough/Fernando
// Mendoza source got flattened to a single malformed "NO" selection upstream.
const SELECTION_PATTERN = /([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,3})\s*[-—:]?\s*(?:is\s+)?\b(over|under)\b\s+(\d+(?:\.\d+)?)/g;

export function detectCandidateSelections(bodyText) {
  const text = String(bodyText ?? '');
  const matches = [];
  let match;
  SELECTION_PATTERN.lastIndex = 0;
  while ((match = SELECTION_PATTERN.exec(text)) !== null) {
    matches.push({
      candidate_name: match[1].trim(),
      side: match[2].toLowerCase(),
      line: Number(match[3]),
      excerpt: text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20).trim(),
    });
  }
  // Dedupe identical (name, side, line) triples — a name can legitimately
  // appear more than once in prose without being a second distinct pick.
  const seen = new Set();
  return matches.filter((m) => {
    const key = `${m.candidate_name.toLowerCase()}|${m.side}|${m.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function summarizeReacquisitionRun(records) {
  const recovered = records.filter((r) => r.status === 'recovered');
  const unavailable = records.filter((r) => r.status === 'unavailable');
  const improved = recovered.filter((r) => r.improved);
  return {
    schema: ARTICLE_REACQUISITION_SCHEMA,
    total: records.length,
    recovered: recovered.length,
    unavailable: unavailable.length,
    improved: improved.length,
    unavailable_reasons: unavailable.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {}),
  };
}
