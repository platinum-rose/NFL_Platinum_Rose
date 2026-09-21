#!/usr/bin/env node
// agents/portfolio-preflight.js
// ═══════════════════════════════════════════════════════════════════════════════
// PortfolioPreflightGate — FREE, READ-ONLY end-to-end validation of every input
// the futures committee consumes, run BEFORE any paid portfolio-synthesize.js run.
//
// Why this exists (2026-09-04, after a full end-to-end audit):
//   The pipeline degrades SILENTLY at every seam. The 2026-09-02 run emitted a
//   complete-looking 32KB HTML report with final:0 recommendations and exit 0,
//   after one model died mid-JSON. Stale 2025 analytics, a PostgREST 1000-row
//   cap, an injury filter that never matches "Injured Reserve", a team-key split
//   that halves every non-wins market, and a --shadow-slim path that drops 80%
//   of market rows all pass unnoticed. This gate makes each of those loud.
//
// GUARANTEES: makes ZERO paid API calls. Performs ZERO writes (no Supabase
//   inserts/updates, no file writes except an optional --out report). Safe to
//   run any time, as often as you like.
//
// Usage:
//   node agents/portfolio-preflight.js                  # human report, exit 1 on any BLOCK
//   node agents/portfolio-preflight.js --json           # machine-readable
//   node agents/portfolio-preflight.js --warn-only      # never exit non-zero
//   node agents/portfolio-preflight.js --dossier <path> # check a specific dossier
//   node agents/portfolio-preflight.js --model gpt-4o   # which signals sidecar to expect
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir, stat } from 'node:fs/promises';
import { parse as parseJs } from 'acorn';
// Validate the SHIPPING logic, never a copy of it — see agents/lib/injury-status.js
import { normalizeInjuryStatus, INJURY_RELEVANT_STATUS } from './lib/injury-status.js';
import { isNflRelevantEpisode } from './lib/nfl-relevance.js';
import {
  fetchPersistedImportRowsPaged,
  auditFuturesImportManifest,
} from '../src/lib/futuresImportAudit.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argVal = (n, d = null) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const hasFlag = (n) => process.argv.includes(n);

const JSON_OUT  = hasFlag('--json');
const WARN_ONLY = hasFlag('--warn-only');
const MODEL     = argVal('--model', 'gpt-4o');
const SEASON    = Number(argVal('--season', '2026'));
const NOW       = Date.now();

const sb = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ─── Result collection ────────────────────────────────────────────────────────

const results = [];
const add = (stage, lane, status, detail, fix = null) =>
  results.push({ stage, lane, status, detail, fix });

const BLOCK = 'BLOCK', WARN = 'WARN', PASS = 'PASS', ERROR = 'ERROR';

const daysSince = (ts) => ts ? (NOW - new Date(ts).getTime()) / 86400000 : null;
const fmtAge = (d) => d == null ? 'unknown' : `${d.toFixed(1)}d`;

/** Wrap a check so a schema surprise reports as ERROR instead of crashing the gate. */
async function check(stage, lane, fn) {
  try { await fn(); }
  catch (e) { add(stage, lane, ERROR, `check itself failed: ${e.message}`); }
}

// ─── Supabase helpers (read-only) ─────────────────────────────────────────────

async function rowCount(table, filters = {}) {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Try a list of candidate timestamp columns; return {col, ts} for the newest. */
async function newestTs(table, cols, filters = {}) {
  for (const col of cols) {
    try {
      let q = sb.from(table).select(col).order(col, { ascending: false }).limit(1);
      for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
      const { data, error } = await q;
      if (error) continue;
      if (data?.length && data[0][col]) return { col, ts: data[0][col] };
    } catch { /* try next */ }
  }
  return { col: null, ts: null };
}

// ─── Local file helpers ───────────────────────────────────────────────────────

async function readJsonIf(rel) {
  const p = path.join(ROOT, rel);
  try {
    const [txt, st] = await Promise.all([readFile(p, 'utf8'), stat(p)]);
    return { path: p, rel, json: JSON.parse(txt), mtime: st.mtimeMs, bytes: st.size };
  } catch (e) { return { path: p, rel, error: e.code || e.message }; }
}

/**
 * A file's mtime lies when a rebuild re-derives stale upstream content.
 * Always prefer an embedded content timestamp when one exists.
 */
function contentTs(json) {
  if (!json || typeof json !== 'object') return null;
  return json?.meta?.generated_at || json.generated_at || json.as_of ||
         json.updated_at || json?.meta?.source_generated_at || json.created || null;
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE A — DATABASE SOURCES: populated, fresh, and not silently row-capped
// ══════════════════════════════════════════════════════════════════════════════

// PostgREST silently caps any unpaginated .select() at 1000 rows — no error, no
// warning. Rather than trusting a hand-maintained list of which readers are
// unpaginated (a list that goes stale the moment someone fixes one, and then
// reports a fixed reader as broken forever), this scans the actual source of the
// pipeline agents and decides per call site. Self-updating by construction.
const SCANNED_SOURCES = [
  'agents/portfolio-dossier.js',
  'agents/signal-normalize.js',
  'agents/portfolio-synthesize.js',
];

/**
 * Find every `from('<table>')` call site in a source file and judge whether
 * that particular read is bounded safely. A site is SAFE when it paginates
 * (`.range(`, a genuine `fetchAllPaged()`/`fetchAllKeyset()` wrapper), only
 * counts (`head: true`), expects one row (`.single()` / `.maybeSingle()`),
 * or takes a deliberate sub-1000 `.limit(n)`. Anything else on a table of
 * >=1000 rows is silently truncated.
 *
 * History (2026-09-08 through 2026-09-09, all superseded): this scanner
 * went through several regex/text-window designs -- a flat 900-char scope
 * window, then a per-statement paren-depth-bounded window
 * (`findStatementEnd()`), then helper-wrapper detection by name proximity,
 * then by comment/string-masked paren nesting -- each of which closed one
 * real false-positive/false-negative and then Codex found the next one
 * (see handoffs/2026-09-08-*, handoffs/2026-09-09-*-p2-*.md for the full
 * blow-by-blow). The common failure: text and paren-depth heuristics can
 * always be spoofed by *something* that looks structurally similar but
 * isn't -- a comment, a sibling statement, an unrelated argument, a
 * chained call that happens to share a method name.
 *
 * 2026-09-09 (Codex round-4, two more fail-opens on the AST version):
 * (1) the wrapper checks accepted a callback/options-object sitting at ANY
 * argument position of a genuine fetchAllKeyset()/fetchAllPaged() call,
 * not specifically the position that function actually reads -- a
 * function only ever invokes what its own signature wires up, so an extra
 * ignored argument containing a "real-looking" unsafe query was still
 * misread as wrapped. (2) the non-wrapper safety signals (`.range(`,
 * `head: true`, `.single()`, `.limit(n)`) were STILL plain regex over a
 * text "scope" window, carrying the exact same comment/string-spoofable
 * weakness as every prior round's wrapper check, just never exercised
 * because the tests happened not to target them.
 *
 * Fixed both by finishing the move to the AST that round 3 started
 * instead of leaving it half-migrated: `isWrappedInFetchAllKeyset()` /
 * `isWrappedInFetchAllPaged()` now check the EXACT expected argument index
 * (`arguments[1]`, matching each helper's real `(label, ...)` signature),
 * and the four non-wrapper signals are now read directly off the method
 * CHAIN of real CallExpression nodes rooted at the `.from()` call
 * (`collectChainedCalls()`) rather than off any text window at all -- a
 * comment or string can no longer be mistaken for a `.range()`/`.limit()`/
 * `.single()` call or a `head: true` option, because none of those are
 * text patterns anymore; they're specific AST node shapes. The old
 * text-window machinery (`findStatementEnd()`, the `scope`/`win`
 * substrings) is gone -- there is no longer a regex-based fallback path in
 * this scanner for anything safety-relevant.
 *
 * 2026-09-09 (Codex round-5, three more AST-level fail-opens): (1) proving
 * a `.from()` chain sits inside the RIGHT wrapper callback still didn't
 * prove it was the QUERY that callback actually produces -- a decoy or
 * dead-code `.from()` call elsewhere in that same function body inherited
 * "wrapped" status just by sharing a function, and for `fetchAllPaged`
 * specifically (which, unlike `fetchAllKeyset` since round 2, does NOT own
 * pagination itself -- see `fetchAllPaged()` in portfolio-dossier.js --
 * it trusts `buildQuery(from, to)` to embed `.range(from, to)`), a
 * genuinely-wrapped callback that simply forgot `.range()` still read as
 * paginated. (2) `head: true` was read off ANY call in the chain, not
 * specifically `.select()` -- the only method where that option means
 * anything in the Supabase client -- so an unrelated call with an object
 * argument shaped like `{ head: true }` could be misread as a count-only
 * query. (3) the top-level `.from()` DISCOVERY step -- the very first
 * thing the scanner does -- was still a plain regex over raw source text,
 * carrying the same comment/string-literal spoofability as every
 * safety-signal regex before it, just one level further out: a `.from(...)`
 * mentioned only in a comment or a string literal was findable at all
 * (and, since it can't be a real query, always misclassified) and a
 * dynamically-named table in a real query (`sb.from(tableVar)`) or a
 * non-string-literal call was invisible to the scanner entirely -- a
 * silent audit gap, not merely a false report.
 *
 * Fixed by: requiring the `.from()` chain's outermost link to be the
 * actual value the wrapper function produces (`isChainReturnedByFunction()`
 * -- either an arrow function's implicit-return expression body, or the
 * argument of an explicit `return`) before either wrapper check can
 * succeed; additionally requiring a genuine `.range()` call in that same
 * chain for `fetchAllPaged` specifically, since being a real, returned
 * callback still proves nothing about whether it paginated; scoping
 * `chainHasHeadTrueOption()` to calls whose method name is `select`; and
 * replacing the regex-based `.from()` discovery with a single AST walk
 * (`findAllFromCallSites()`) that finds every real `.from()` CallExpression
 * structurally, with a narrow exclusion for `Buffer.from`/`Array.from`
 * (real methods sharing the name that a plain property-name match would
 * otherwise misidentify as a database read). An unparseable file still
 * falls back to the old regex scan so a parse failure degrades to noisier
 * (rather than silently absent) reporting -- fail closed, never fail open.
 */

// 2026-09-09 (Codex round-3 review, same P2 finding, flagged a THIRD time):
// the round-2 fix (lexical paren-nesting over a comment/string-masked
// source) correctly rejected the first two proximity spoofs -- a comment
// mentioning the helper name, and an unrelated already-closed sibling call
// -- but Codex found it still fails open on a third case: a `.from()` call
// nested inside a DIFFERENT, unrelated argument of a genuine, still-open
// `fetchAllKeyset(...)`/`fetchAllPaged(...)` call. Paren-depth alone proves
// "somewhere inside these parens", not "inside the SPECIFIC callback that
// actually gets invoked as the query builder" -- e.g. a `.from()` buried in
// some unrelated property of the options object passed to fetchAllKeyset()
// would still read as "wrapped" even though fetchAllKeyset() never touches
// that property.
//
// Three rounds of the same category of bug (text proximity, then nesting
// depth, now nesting IDENTITY) is a sign the underlying approach --
// approximating structure with regex/paren tricks -- has run out of room.
// Fixed properly this time with a real parser: `acorn` (already resolved in
// this repo's node_modules as an eslint transitive dependency; added here
// as an explicit direct dependency in package.json rather than relying on
// that indirect resolution, which a future eslint bump or `npm dedupe`
// could silently remove). The source is parsed once per scanCallSites()
// call into a real AST; for each `.from()` match, `findAstNodePath()` walks
// the tree to the exact ancestor chain containing that character offset,
// then `isWrappedInFetchAllKeyset()`/`isWrappedInFetchAllPaged()` check not
// just "is there an open call with this name somewhere above", but the
// SPECIFIC structural relationship that makes the call site real:
//   - fetchAllKeyset: the nearest enclosing function must be exactly the
//     value of an `applyFilters` property on an object that is itself one
//     of fetchAllKeyset(...)'s own arguments -- not any other property.
//   - fetchAllPaged: the nearest enclosing function must be exactly one of
//     fetchAllPaged(...)'s own arguments directly (its only callback slot).
// A `.from()` sitting in an unrelated property/argument no longer matches
// either shape, closing the fail-open Codex demonstrated.
//
// If a file fails to parse (should not happen for this repo's plain ES
// modules, but preflight is a safety gate, not a linter), wrapper detection
// fails CLOSED -- every call site in that file is treated as unwrapped
// rather than silently trusting text that couldn't even be parsed.
function parseSourceSafely(src, file) {
  try {
    return parseJs(src, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (e) {
    console.warn(`portfolio-preflight rowcap scanner: could not parse ${file} (${e.message}) -- every call site in this file will be treated conservatively as unwrapped/unpaginated.`);
    return null;
  }
}

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration']);

function nearestEnclosingFunctionIndex(path) {
  for (let i = path.length - 1; i >= 0; i--) {
    if (FUNCTION_TYPES.has(path[i].type)) return i;
  }
  return -1;
}

// 2026-09-10 (Codex round-8): a COMPUTED property key (`{ [key]: 'comments'
// }`) is still an ordinary `Property` node with `property.key.type ===
// 'Identifier'` -- this function never checked `property.computed` at
// all, so for a computed key it read the *variable name itself* (e.g.
// "key") as if it were the literal property name. That variable name can
// never match a real target key ('foreignTable', 'head', etc.), so every
// caller silently treated a computed-key scoping option as absent. Only a
// computed key that is ITSELF a literal (`{ ['referencedTable']: 'comments'
// }`) can be resolved statically; a computed key holding a variable,
// member expression, or any other non-literal expression cannot, and now
// returns null (unresolvable) exactly like any other unreadable key,
// rather than silently substituting the wrong string.
function propertyKeyName(property) {
  if (!property || property.type !== 'Property') return null;
  if (property.computed) {
    return property.key.type === 'Literal' ? String(property.key.value) : null;
  }
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return null;
}

// 2026-09-09 (Codex round-4): tightened from "is this function/object ANY
// argument of the named call" to "is it EXACTLY the argument position that
// function's own signature actually reads" -- fetchAllKeyset(label, options)
// only ever destructures its 2nd parameter, fetchAllPaged(label, buildQuery)
// only ever invokes its 2nd parameter, so a genuine-looking callback/options
// object sitting at any OTHER position is never actually called at runtime,
// no matter how safe its own contents look. `arguments[1] === node` (a
// reference-equality check against the true AST node, not merely "does the
// arguments list contain something with this shape") is what proves it's in
// the position that matters.
//
// 2026-09-09 (Codex round-5): argument position alone still wasn't enough --
// a `.from()` chain could sit in the RIGHT callback (right argument
// position, right property) without being the query that callback actually
// hands back; a decoy call elsewhere in the same function body inherited
// "wrapped" status just from sharing a function. `isChainReturnedByFunction()`
// closes that: it requires the specific chain under test to be the value
// the function actually produces -- an arrow function's implicit-return
// expression body, or the argument of an explicit `return` -- not merely
// "reachable from inside it".
function isChainReturnedByFunction(path, fnIdx, fromIdx, chainLength) {
  if (fnIdx < 0 || fromIdx < 0 || chainLength < 1) return false;
  const fn = path[fnIdx];
  // Each link in the chain sits 2 path entries further from the root than
  // the last (a MemberExpression, then the CallExpression wrapping it) --
  // see collectChainedCalls() below. The outermost link is therefore this
  // many steps back from the `.from()` call itself.
  const outermostIdx = fromIdx - 2 * (chainLength - 1);
  if (outermostIdx < 0) return false;
  const outermostCall = path[outermostIdx];
  const parent = outermostIdx - 1 >= 0 ? path[outermostIdx - 1] : null;
  if (fn.type === 'ArrowFunctionExpression' && fn.expression === true) {
    // (q) => q.from(...).select(...) -- the chain IS the function's body,
    // with nothing in between.
    return parent === fn && fn.body === outermostCall;
  }
  // A block-bodied function: the chain must be an explicit `return`'s value.
  return !!parent && parent.type === 'ReturnStatement' && parent.argument === outermostCall;
}

function isWrappedInFetchAllKeyset(path, fromIdx, chainLength) {
  const fnIdx = nearestEnclosingFunctionIndex(path);
  if (fnIdx < 3) return false; // need Property, ObjectExpression, CallExpression above it
  const fn = path[fnIdx];
  const property = path[fnIdx - 1];
  if (!property || property.type !== 'Property' || property.value !== fn) return false;
  if (propertyKeyName(property) !== 'applyFilters') return false;
  const objExpr = path[fnIdx - 2];
  if (!objExpr || objExpr.type !== 'ObjectExpression') return false;
  const callNode = path[fnIdx - 3];
  if (!callNode || callNode.type !== 'CallExpression') return false;
  if (callNode.callee?.type !== 'Identifier' || callNode.callee.name !== 'fetchAllKeyset') return false;
  if (callNode.arguments[1] !== objExpr) return false; // fetchAllKeyset(label, options) -- options is arguments[1]
  return isChainReturnedByFunction(path, fnIdx, fromIdx, chainLength);
}

function isWrappedInFetchAllPaged(path, fromIdx, chainLength, hasRangeCall) {
  const fnIdx = nearestEnclosingFunctionIndex(path);
  if (fnIdx < 1) return false;
  const fn = path[fnIdx];
  const callNode = path[fnIdx - 1];
  if (!callNode || callNode.type !== 'CallExpression') return false;
  if (callNode.callee?.type !== 'Identifier' || callNode.callee.name !== 'fetchAllPaged') return false;
  if (callNode.arguments[1] !== fn) return false; // fetchAllPaged(label, buildQuery) -- buildQuery is arguments[1]
  if (!isChainReturnedByFunction(path, fnIdx, fromIdx, chainLength)) return false;
  // Unlike fetchAllKeyset (which has owned its own pagination clauses since
  // round 2), fetchAllPaged trusts buildQuery(from, to) to embed .range(from,
  // to) itself -- see fetchAllPaged() in portfolio-dossier.js. Being a real,
  // returned buildQuery callback proves nothing about whether it actually
  // paginated; only a genuine .range() call in this same chain does.
  return hasRangeCall;
}

// 2026-09-09 (Codex round-4): the non-wrapper safety signals (.range(),
// head:true, .single()/.maybeSingle(), a small literal .limit(n)) used to
// be plain regex over a text "scope" window -- exactly as spoofable by a
// comment or string as every wrapper-detection regex before it, just never
// demonstrated because no test happened to target it. Fixed by reading
// these directly off the real method-chain CallExpression nodes rooted at
// the `.from()` call, found structurally rather than by text pattern.
//
// A Supabase call reads as `sb.from('t').select(...).order(...).limit(...)`
// -- in AST terms this NESTS OUTWARD from `.from()`: each `.method()` link
// is a CallExpression whose callee is a MemberExpression whose `.object` is
// the previous link. `findAllFromCallSites()` (below) hands `collectChainedCalls()`
// the exact index of the `.from()` CallExpression within its own ancestor
// path (no separate re-discovery needed -- the path was built by the same
// walk that found the call), and `collectChainedCalls()` walks OUTWARD from
// there confirming each next link is a direct, unbroken continuation of the
// same chain (not merely "somewhere later in the file" or "textually
// nearby") -- stopping the instant something breaks that shape, e.g. the
// chain gets passed into an unrelated wrapper call or used inside a
// different expression entirely.
function collectChainedCalls(path, fromIdx) {
  // `path` is root-to-leaf. Outer chained calls (`.select()`, `.range()`,
  // etc) are ANCESTORS of the `.from()` call -- they were built by wrapping
  // around it -- so they sit at SMALLER indices (closer to the root), not
  // larger ones. Walk backward from fromIdx confirming each next step is a
  // direct, unbroken continuation of the same chain: the immediately
  // preceding node must be the MemberExpression whose `.object` is exactly
  // the current call, and the one before THAT must be the CallExpression
  // whose `.callee` is exactly that MemberExpression.
  const calls = [path[fromIdx]];
  let current = path[fromIdx];
  let i = fromIdx - 1;
  while (i - 1 >= 0) {
    const maybeMember = path[i];
    if (!maybeMember || maybeMember.type !== 'MemberExpression' || maybeMember.object !== current) break;
    const maybeCall = path[i - 1];
    if (!maybeCall || maybeCall.type !== 'CallExpression' || maybeCall.callee !== maybeMember) break;
    calls.push(maybeCall);
    current = maybeCall;
    i -= 2;
  }
  return calls;
}

function chainMethodNames(calls) {
  return calls.map((c) => c.callee?.property?.name).filter(Boolean);
}

// 2026-09-09 (Codex round-5): `head: true` only means anything as an option
// to `.select()` (the Supabase client's count-only shape,
// `.select(cols, { count, head })`) -- reading it off ANY call in the chain
// meant an unrelated method with a coincidentally `{ head: true }`-shaped
// argument (e.g. an `.eq()`/`.match()` value) could be misread as a
// count-only query. Scoped to calls whose method name is actually `select`.
// 2026-09-10 (Codex round-7): Supabase only reads options off the SECOND
// argument to `.select(columns, options)` -- `sb.from(t).select('p', {},
// { head: true })` performs a normal row-returning GET because the third
// argument is simply ignored by the client, but scanning ALL arguments let
// a `{ head: true }`-shaped object sitting at any other position spoof a
// count-only read. Require `c.arguments[1]` specifically.
//
// 2026-09-10 (Codex round-8): checking "does ANY property look like
// { head: true }" ignored real JS last-write-wins semantics within the
// object literal itself. `{ head: true, head: false }` is valid modern JS
// (duplicate keys are allowed; the LAST one wins at runtime) and performs
// an ordinary GET, not a count-only read -- and `{ head: true,
// ...runtimeOptions }` MAY do the same, since the spread comes after and
// could itself carry a `head` key. Walk the object's properties in source
// order and track the current known value of `head`; a spread, or a
// computed key that can't be resolved to a literal, makes the current
// value UNKNOWN (it could silently set `head` to anything) rather than
// leaving whatever was believed before it standing. Only report
// count-only when the FINAL state, after every property, is a
// confidently-known literal `true`.
function resolvesToHeadTrue(objectExpression) {
  let headIsTrue = false;
  for (const p of objectExpression.properties) {
    if (p.type !== 'Property') { headIsTrue = false; continue; } // spread etc. -- unknown, could override
    const key = propertyKeyName(p);
    if (key === null) { headIsTrue = false; continue; } // unresolvable computed key -- unknown, could be 'head'
    if (key !== 'head') continue; // some other property -- doesn't touch head's value
    headIsTrue = p.value?.type === 'Literal' && p.value.value === true;
  }
  return headIsTrue;
}
function chainHasHeadTrueOption(calls) {
  return calls.some((c) => {
    if (c.callee?.property?.name !== 'select') return false;
    const opts = c.arguments?.[1];
    return opts?.type === 'ObjectExpression' && resolvesToHeadTrue(opts);
  });
}

// 2026-09-09 (Codex round-6): the Supabase client accepts a `{ foreignTable }`
// option on `.range()`, `.order()` and `.limit()` that scopes the call to an
// EMBEDDED relation (`.select('*, comments(*)').limit(5, { foreignTable:
// 'comments' })` bounds only the nested `comments` rows) -- it does nothing
// to the TOP-LEVEL query this call site actually reads. A `.range()`/`.limit()`
// carrying that option must never count as a safety signal for the row this
// scanner is judging.
//
// 2026-09-10 (Codex round-7): the installed Supabase client accepts --
// and actually PREFERS -- `referencedTable` as the modern name for this
// same embedded-relation option; `foreignTable` is the deprecated alias.
// Checking only `foreignTable` let `.limit(5, { referencedTable: 'comments'
// })` / `.range(0, 9, { referencedTable: 'comments' })` read as a real
// top-level bound when they scope only the embedded relation -- the exact
// same failure mode round-6 closed for one name but not the other.
// Independently reproduced by Codex against both `.limit()` and `.range()`.
// Also closes a second gap: `.limit(n, options)` / `.range(a, b, options)`
// pass the options object at a FIXED argument position (index 1 for
// `.limit`, index 2 for `.range`) -- if whatever sits there is not a
// literal object we can read (a variable, a spread call result, a
// ternary), or if a literal object contains a spread property
// (`{ ...someOptions }`), static analysis cannot prove it LACKS either
// scoping key. Fail closed in both cases: treat the call as
// relation-scoped (i.e. NOT a trustworthy top-level bound) rather than
// assuming absence just because neither name appears as a literal
// property we could see.
const RELATION_SCOPE_KEYS = new Set(['foreignTable', 'referencedTable']);
const RELATION_OPTIONS_ARG_INDEX = { limit: 1, range: 2 };
function isForeignTableScoped(call) {
  const methodName = call.callee?.property?.name;
  const idx = RELATION_OPTIONS_ARG_INDEX[methodName];
  if (idx == null) return false; // not a method this scanner calls isForeignTableScoped() for
  const opts = call.arguments?.[idx];
  if (!opts) return false; // no options argument supplied at all -- nothing to scope it with
  if (opts.type !== 'ObjectExpression') return true; // dynamic/non-literal options -- cannot prove absence, fail closed
  return opts.properties.some((p) => {
    if (p.type !== 'Property') return true; // SpreadElement etc. -- cannot prove absence, fail closed
    const key = propertyKeyName(p);
    // 2026-09-10 (Codex round-8): a computed key that propertyKeyName()
    // cannot resolve to a literal (e.g. `{ [someVar]: 'comments' }`) is
    // just as unprovable as a spread -- fail closed rather than treating
    // "we couldn't read the key" as "the key isn't foreignTable/referencedTable".
    if (key === null) return true;
    return RELATION_SCOPE_KEYS.has(key);
  });
}

// 2026-09-09 (Codex round-6): `.range()` only bounds the top-level query when
// it is NOT foreign-table-scoped -- see isForeignTableScoped() above.
function chainHasRangeCall(calls) {
  return calls.some((c) => c.callee?.property?.name === 'range' && !isForeignTableScoped(c));
}

// 2026-09-09 (Codex round-6): rewritten for two real fail-opens Codex found.
// (1) Supabase mutates the SAME query-builder object on every chained call --
// when `.limit()` appears more than once in a chain (`.limit(500)...
// .limit(2000)`), the LAST call actually invoked is what reaches PostgREST,
// overwriting whatever the earlier call set. The old `calls.find(...)`
// returned the FIRST `.limit()` in chain order (closest to `.from()`), so an
// early small, safe-looking `.limit(500)` could report "bounded" while a
// later `.limit(2000)` silently overrode it at runtime. (2) `.limit(n,
// { foreignTable })` -- see isForeignTableScoped() -- bounds an embedded
// relation, not this call site's own top-level rows, and must be skipped
// entirely rather than treated (or trusted over an later real bound).
// `calls` is ordered innermost (closest to `.from()`) to outermost, so
// walking forward and always taking the MOST RECENT applicable match yields
// the value that actually governs the request.
function chainSmallLimitValue(calls) {
  let result = null;
  for (const c of calls) {
    if (c.callee?.property?.name !== 'limit') continue;
    if (isForeignTableScoped(c)) continue;
    const arg = c.arguments?.[0];
    result = (arg && arg.type === 'Literal' && typeof arg.value === 'number') ? arg.value : null;
  }
  return result;
}

// Walks the whole AST once, collecting every real `.from(...)` call site
// as `{ path, fromIdx }` -- `path` is the root-to-node ancestor chain (the
// same shape the old offset-based lookup used to produce, but built
// directly during the walk instead of re-discovered from a regex match
// position afterward) and `fromIdx` is the `.from()` CallExpression's own
// index within it (always `path.length - 1`, since that's the node being
// tested when a match is recorded). `Buffer.from`/`Array.from` are
// excluded: they share the method name with a real database read but are
// never one, and a bare property-name match would otherwise misidentify
// them.
function findAllFromCallSites(ast) {
  const results = [];
  const path = [];
  (function visit(node) {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
    path.push(node);
    // 2026-09-09 (Codex round-6): `sb['from'](...)` (computed member access)
    // is a real, if unusual, way to reach the same method -- the original
    // `!node.callee.computed` requirement made it invisible to discovery
    // entirely (a silent audit gap, not a false report). Accept EITHER a
    // plain `.from(...)` (non-computed Identifier property) or a computed
    // access whose property is the string literal 'from'.
    const calleeIsFrom = node.callee?.type === 'MemberExpression' && (
      (!node.callee.computed && node.callee.property?.type === 'Identifier' && node.callee.property.name === 'from')
      || (node.callee.computed && node.callee.property?.type === 'Literal' && node.callee.property.value === 'from')
    );
    if (
      node.type === 'CallExpression'
      && calleeIsFrom
      && !(node.callee.object?.type === 'Identifier' && (node.callee.object.name === 'Buffer' || node.callee.object.name === 'Array'))
    ) {
      results.push({ path: path.slice(), fromIdx: path.length - 1 });
    }
    for (const key of Object.keys(node)) {
      if (key === 'start' || key === 'end' || key === 'type' || key === 'loc' || key === 'range' || key === 'parent') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const child of val) visit(child);
      } else if (val && typeof val === 'object') {
        visit(val);
      }
    }
    path.pop();
  })(ast);
  return results;
}

// exported 2026-09-09 (Codex P2 negative-test recommendation, flagged
// 2026-09-09): this file's main() previously ran unconditionally on
// import, same issue as portfolio-synthesize.js/futures-odds-ingest.js
// before them -- so scanCallSites() couldn't be unit-tested without
// executing the whole preflight run. Exported the pure scanner function and
// guarded the main() invocation at the bottom of the file with the repo's
// standard entry-point check (see draftsharks-idp-ingest.js et al.).
//
// 2026-09-09 (Codex round-5): discovery of `.from()` call sites was itself
// still a plain regex over raw source text -- exactly as spoofable by a
// comment or string literal as every safety-signal regex closed in earlier
// rounds, and blind to any real call the regex's shape didn't match (a
// dynamically-named table, unusual whitespace/formatting). Replaced with
// `findAllFromCallSites()`, a single AST walk that finds every real
// `.from(...)` CallExpression structurally and hands back its own ancestor
// path directly -- no comment/string text can produce a phantom site. A
// file that fails to parse still falls back to the old regex scan (marking
// every match unsafe) so a parse failure degrades to noisier reporting,
// never to silently finding nothing.
// exported 2026-09-10 (Codex round-7 P2): this classification logic used to
// live inline inside the async A:rowcap check below, reachable only via a
// full live preflight run against real Supabase tables -- so nothing ever
// exercised its two failure branches (a site whose table name could not be
// resolved statically at all, or a resolvable table whose rowCount()
// lookup itself failed and got recorded as `null`). Codex's live runs only
// ever walked the all-resolved, all-succeeded path. Extracted as a pure
// function of (sites, sizes) so both branches can be unit-tested directly
// against fixture data, with no Supabase connection required.
// exported 2026-09-10 (Codex round-8 P2): pure classification of a
// SCANNED_SOURCES read/scan failure -- extracted so the "genuinely absent
// file (skip)" vs. "any other failure (fail closed with a sentinel)"
// branch can be tested directly, without needing a real filesystem ENOENT
// or an actual scanCallSites() exception to trigger it.
// 2026-09-10 fix (Codex review, v3->v4 query-dialect round, Finding 1): this
// gate used to be `blocks.length === 0` alone. check() (above) reports a
// thrown check as ERROR, not BLOCK -- so a check that threw (a schema
// surprise, a network blip, anything check()'s try/catch caught) could leave
// safe_to_run_paid_synthesis TRUE even though that lane was never actually
// verified at all. An ERROR means "this check did not run to completion and
// tell us anything," which is not the same as "this check ran and passed" --
// it must gate paid synthesis the same way an explicit BLOCK does. Extracted
// as its own function (rather than left as an inline boolean expression in
// main()) so this exact aggregation rule is directly unit-testable without a
// live Supabase connection or a full main() run, matching the pattern
// established for classifyRowcapSites()/shouldSkipScanError() below.
export function isSafeToRunPaidSynthesis(blockCount, errorCount) {
  return blockCount === 0 && errorCount === 0;
}

// 2026-09-10 fix (Codex v4 review, Finding 1 continued): isSafeToRunPaidSynthesis()
// alone wasn't enough -- the JSON output path called it, but the human-readable
// text report and the process exit code each re-derived their own verdict
// straight off `blocks.length`, so a run with 0 BLOCKs and 1+ ERRORs printed
// "SAFE TO RUN PAID SYNTHESIS" to a human even though the JSON field for the
// exact same run correctly said false. Codex's review noted the 4 existing
// tests only exercised the pure boolean, so they never caught the CLI/JSON
// contradiction. This function is the single place that decides the verdict
// AND the human-facing headline text, and main() uses it for the JSON field,
// the text report, and the exit code -- so a test can assert on the actual
// rendered headline (not just a boolean) and know all three surfaces agree.
export function buildDisposition(blocks, errs) {
  const safe = isSafeToRunPaidSynthesis(blocks.length, errs.length);
  const headline = safe
    ? 'SAFE TO RUN PAID SYNTHESIS — every validated lane is present, fresh and wired.'
    : 'DO NOT RUN PAID SYNTHESIS.';
  return { safe, headline };
}

export function shouldSkipScanError(err) {
  return !!(err && err.code === 'ENOENT');
}

export function classifyRowcapSites(sites, sizes) {
  const risky = sites.filter((x) => !x.safe);
  const resolvable = risky.filter((x) => x.table !== '(dynamic table)');
  const unresolved = risky.filter((x) => x.table === '(dynamic table)');
  // A `null` size means rowCount() itself failed for a resolvable table --
  // treated the same as "truncating" (unsafe by default), same rationale
  // as the unresolved-table branch: we cannot prove the read is safe.
  const truncating = resolvable.filter((x) => sizes[x.table] == null || sizes[x.table] >= 1000);
  const fine = resolvable.filter((x) => sizes[x.table] != null && sizes[x.table] < 1000);
  const safeCount = sites.length - risky.length;
  const blockedCount = truncating.length + unresolved.length;
  return { risky, resolvable, unresolved, truncating, fine, safeCount, blockedCount };
}

export function scanCallSites(src, file) {
  const sites = [];
  const ast = parseSourceSafely(src, file);

  if (!ast) {
    for (const m of src.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)) {
      sites.push({
        table: m[1], file, line: src.slice(0, m.index).split('\n').length,
        safe: false, why: 'unpaginated (file could not be parsed -- treated conservatively)',
      });
    }
    // 2026-09-10 (Codex round-7): the regex above only matches a LITERAL
    // `.from('table')` call -- it independently reproduced two ways a file
    // that fails to parse can still contribute ZERO sites and therefore no
    // BLOCK at all: `sb.from(tableVar)` (a variable) and `sb['from'](
    // 'vault_notes')` (bracket-notation member access). A parse failure
    // means static analysis cannot verify ANYTHING in this file, regardless
    // of what the regex fallback did or didn't happen to match -- add one
    // unconditional file-level unresolved sentinel so a file that fails to
    // parse always surfaces at least one BLOCK, on top of whatever the
    // regex found for extra line-level detail.
    sites.push({
      table: '(dynamic table)', file, line: 1,
      safe: false, why: 'file could not be parsed -- static analysis cannot verify any read in this file is bounded',
    });
    return sites;
  }

  for (const { path, fromIdx } of findAllFromCallSites(ast)) {
    const fromNode = path[fromIdx];
    const arg0 = fromNode.arguments?.[0];
    const table = arg0?.type === 'Literal' && typeof arg0.value === 'string' ? arg0.value : '(dynamic table)';
    const line = src.slice(0, fromNode.start).split('\n').length;

    // The four non-wrapper safety signals are read directly off the real
    // method-chain CallExpression nodes rooted at this `.from()` call --
    // see the round-4 comment above collectChainedCalls() for why this
    // replaced the old text-window regex checks entirely.
    const chainCalls = collectChainedCalls(path, fromIdx);
    const methodNames = chainMethodNames(chainCalls);
    const hasRangeCall = chainHasRangeCall(chainCalls);
    const hasSingleCall = methodNames.includes('single') || methodNames.includes('maybeSingle');
    const hasHeadTrue = chainHasHeadTrueOption(chainCalls);
    const smallLimit = chainSmallLimitValue(chainCalls); // number | null

    // fetchAllPaged(label, (from, to) => sb.from(...)) and
    // fetchAllKeyset(label, {..., applyFilters: (q) => q.from(...)... })
    // both always put the helper name BEFORE the '.from(' call they wrap
    // (as an outer function call). Wrapper detection now also requires the
    // chain to be the value the wrapper function actually returns -- see
    // the round-5 comment above isChainReturnedByFunction() for why being
    // lexically inside the right callback wasn't enough on its own.
    const wrappedInFetchAllPaged = isWrappedInFetchAllPaged(path, fromIdx, chainCalls.length, hasRangeCall);
    const wrappedInFetchAllKeyset = isWrappedInFetchAllKeyset(path, fromIdx, chainCalls.length);

    const paginated = hasRangeCall || wrappedInFetchAllPaged || wrappedInFetchAllKeyset;
    const countOnly = hasHeadTrue;
    const singleRow = hasSingleCall;
    const boundedSmall = smallLimit != null && smallLimit < 1000;

    sites.push({
      table, file, line,
      safe: paginated || countOnly || singleRow || boundedSmall,
      why: paginated ? (wrappedInFetchAllKeyset && !hasRangeCall && !wrappedInFetchAllPaged ? 'paginated (keyset)' : 'paginated') : countOnly ? 'count-only' : singleRow ? 'single-row'
           : boundedSmall ? `bounded .limit(${smallLimit})` : (smallLimit != null ? `.limit(${smallLimit}) — inert, PostgREST caps at 1000` : 'unpaginated'),
    });
  }
  return sites;
}

async function stageA() {
  if (!sb) { add('A:database', 'supabase', BLOCK, 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — cannot validate any DB lane'); return; }

  // --- Current-season team analytics: the "current form" the model is told to trust
  await check('A:database', 'nfl_team_season_stats', async () => {
    const cur = await rowCount('nfl_team_season_stats', { season: SEASON });
    if (cur === 0) {
      const status = await getSeasonStatus();
      if (status.started === false) {
        add('A:database', 'nfl_team_season_stats', PASS,
          `ZERO rows for season ${SEASON}, but week 1 hasn't kicked off yet (${status.firstKickoff}, in ${status.daysToKickoff?.toFixed(1)}d) -- there's no game data yet to compute season stats from, so this is the expected state, not a gap. Re-check this lane once games begin.`);
        return;
      }
      const { ts } = await newestTs('nfl_team_season_stats', ['updated_at', 'created_at']);
      add('A:database', 'nfl_team_season_stats', BLOCK,
        `ZERO rows for season ${SEASON} (last updated ${fmtAge(daysSince(ts))} ago) and the season HAS started${status.firstKickoff ? ` (kickoff was ${status.firstKickoff})` : ''}. currentAnalytics() silently serves the ${SEASON - 1} row instead, and SYSTEM_PROMPT tells the model to trust it as "this season's actual play".`,
        'portfolio-dossier.js:360 — refuse to present a prior-season row as current form');
    } else if (cur < 32) {
      add('A:database', 'nfl_team_season_stats', WARN, `only ${cur}/32 teams have ${SEASON} rows`);
    } else {
      add('A:database', 'nfl_team_season_stats', PASS, `${cur} rows for ${SEASON}`);
    }
  });

  await check('A:database', 'team_analytic_snapshots', async () => {
    const cur = await rowCount('team_analytic_snapshots', { season: SEASON });
    if (cur === 0) {
      const status = await getSeasonStatus();
      if (status.started === false) {
        add('A:database', 'team_analytic_snapshots', PASS,
          `ZERO rows for season ${SEASON}, but week 1 hasn't kicked off yet (${status.firstKickoff}, in ${status.daysToKickoff?.toFixed(1)}d) -- expected, not a gap. Re-check once games begin.`);
        return;
      }
      add('A:database', 'team_analytic_snapshots', BLOCK,
        `ZERO rows for season ${SEASON} and the season HAS started. fetchAdvancedAnalytics() hard-filters .eq('season',${SEASON}) then falls back to a local file filtered on filename includes('${SEASON}') — which matches nothing. Result: success_rate, cpoe, explosive_*, pressure_*, sack_* are 0/32 with NO warning printed.`,
        'portfolio-dossier.js:588 — fail loud when the season filter returns nothing');
    } else add('A:database', 'team_analytic_snapshots', PASS, `${cur} rows for ${SEASON}`);
  });

  await check('A:database', 'team_coaching_tendency_snapshots', async () => {
    const total = await rowCount('team_coaching_tendency_snapshots');
    if (total === 0) add('A:database', 'team_coaching_tendency_snapshots', WARN,
      'table is empty for ALL seasons — coaching_profile is 0/32 in every dossier');
    else add('A:database', 'team_coaching_tendency_snapshots', PASS, `${total} rows`);
  });

  // --- Odds: per-placeable-book staleness. A 25-day-old price on a placeable
  //     book is demoted but never dropped, so it can still surface as best_price.
  await check('A:database', 'futures_odds_snapshots', async () => {
    const total = await rowCount('futures_odds_snapshots', { season: SEASON });
    if (total === 0) { add('A:database', 'futures_odds_snapshots', BLOCK, `no ${SEASON} odds rows at all`); return; }

    const PLACEABLE = ['bookmaker', 'betus', 'betonline', 'betmgm', 'caesars', 'circa'];
    const MAX_QUOTE_AGE_DAYS = 3; // mirrors MAX_QUOTE_AGE_HOURS=72 in portfolio-dossier.js:86
    const stale = [], missing = [], fresh = [];
    for (const book of PLACEABLE) {
      const { ts } = await newestTs('futures_odds_snapshots', ['snapshot_time', 'captured_at', 'created_at'], { season: SEASON, book });
      if (!ts) { missing.push(book); continue; }
      const age = daysSince(ts);
      if (age > MAX_QUOTE_AGE_DAYS) stale.push(`${book} ${fmtAge(age)}`); else fresh.push(`${book} ${fmtAge(age)}`);
    }
    const detail = `${total} rows. placeable books — fresh: ${fresh.join(', ') || 'none'}${stale.length ? ` | STALE: ${stale.join(', ')}` : ''}${missing.length ? ` | NEVER CAPTURED: ${missing.join(', ')}` : ''}`;
    if (stale.length || missing.length) {
      add('A:database', 'futures_odds_snapshots', BLOCK, detail,
        'Stale placeable quotes are demoted but still emitted as best_price. Re-ingest before running, or accept that best_price may be a weeks-old number you cannot actually bet.');
    } else add('A:database', 'futures_odds_snapshots', PASS, detail);
  });

  // The newest automated quote for a book cannot prove that older manual
  // market families (notably exact matchups) were persisted. Reconcile every
  // dated import file against the durable manifest and its content hash.
  await check('A:database', 'futures_import_manifest', async () => {
    const rel = 'data/futures-imports/import-manifest-2026.json';
    const manifestFile = await readJsonIf(rel);
    if (manifestFile.error) {
      add('A:database', 'futures_import_manifest', BLOCK,
        `${rel} is missing or unreadable (${manifestFile.error})`,
        'Run node scripts/backfill-futures-imports.js --dry-run, inspect the ledger, then run it without --dry-run only with write approval.');
      return;
    }
    const filePattern = /^(betonline|betus|bookmaker)-\d{4}-\d{2}-\d{2}\.json$/;
    const dirPath = path.join(ROOT, 'data', 'futures-imports');
    const names = (await readdir(dirPath)).filter((name) => filePattern.test(name)).sort();

    const { problems, totals } = await auditFuturesImportManifest({
      manifestJson: manifestFile.json,
      fileNames: names,
      readFileBytes: async (name) => readFile(path.join(dirPath, name)),
      rowCount: (table, filter) => rowCount(table, filter),
      fetchPersistedRows: (entry) => fetchPersistedImportRowsPaged(sb, entry),
    });

    if (problems.length) {
      add('A:database', 'futures_import_manifest', BLOCK, problems.join(' | '),
        'Run node scripts/backfill-futures-imports.js --dry-run to inspect, then apply the idempotent reconciliation with explicit database-write approval.');
    } else {
      add('A:database', 'futures_import_manifest', PASS,
        `${names.length} dated imports accounted for: ${totals?.persisted_valid_files || 0} persisted, ${totals?.invalid_duplicate_files || 0} invalid duplicate(s), ${totals?.valid_rows || 0} valid rows`);
    }
  });

  // --- Schedule
  await check('A:database', 'games', async () => {
    const { data, error } = await sb.from('games').select('season_type, home_team, away_team').eq('season', SEASON).limit(1000);
    if (error) throw new Error(error.message);
    const reg = (data || []).filter(g => g.season_type === 2);
    const teams = new Set(); reg.forEach(g => { teams.add(g.home_team); teams.add(g.away_team); });
    if (reg.length !== 272 || teams.size !== 32)
      add('A:database', 'games', WARN, `${reg.length} regular-season games / ${teams.size} teams (expected 272 / 32)`);
    else add('A:database', 'games', PASS, `272 regular-season games, all 32 teams`);
  });

  // --- Roster churn needs >=2 distinct weeks or it silently returns {}
  // NOTE 2026-09-08 (Codex review, P3): fetchRosterChurn() in portfolio-dossier.js
  // already paginates both the week-discovery query and the per-week row reads via
  // fetchAllPaged() (confirmed fixed as of commit 65d47e3, 2026-09-04). The single-week
  // state below is an expected preseason data-timing gap (kickoff 2026-09-11, no roster
  // moves yet), not an active pagination risk -- this WARN just flags that roster_churn
  // will be empty in the prompt until week 2 data lands.
  await check('A:database', 'nfl_rosters', async () => {
    // 2026-09-10 fix (Round 9 v8 step 3): a single .limit(1000) page ordered by
    // week desc can span less than one full week (~3,575 rows/week this season),
    // so weeks computed from just that page can undercount real distinct weeks --
    // the same failure class fetchRosterChurn() in portfolio-dossier.js was
    // already fixed for (2026-09-04). Page until exhausted -- no silent ceiling:
    // a sanity cap that still had a full page on its last iteration means real
    // data may remain unseen, and that must fail loud, not stop quietly.
    const seen = new Set();
    const ROWCAP_SANITY_PAGES = 200; // 200,000 rows -- generous; nfl_rosters is ~3,575/week
    let pages = 0;
    let lastPageFull = false;
    for (let from = 0; pages < ROWCAP_SANITY_PAGES; from += 1000, pages++) {
      const { data, error } = await sb.from('nfl_rosters').select('week').eq('season', SEASON)
        .order('week', { ascending: false }).range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const r of data || []) seen.add(r.week);
      lastPageFull = (data || []).length === 1000;
      if (!lastPageFull) break;
    }
    if (lastPageFull) {
      throw new Error(`nfl_rosters week discovery: hit the ${ROWCAP_SANITY_PAGES}-page sanity cap (${ROWCAP_SANITY_PAGES * 1000} rows) while the last page was still full -- more rows may remain unseen; raise the cap or investigate before trusting this count`);
    }
    // Explicit descending sort per v8 step 3 -- Set insertion order happened to
    // match this season (rows arrive week-desc), but that is not guaranteed for
    // a Set and should not be relied on.
    const weeks = [...seen].sort((a, b) => b - a);
    if (weeks.length < 2) {
      add('A:database', 'nfl_rosters', WARN,
        `only ${weeks.length} distinct week(s) for ${SEASON} — fetchRosterChurn() returns {} silently (no warn). roster_churn is empty in the prompt.`,
        'Expected pre-kickoff state, not a code risk: fetchRosterChurn() is already paginated (fetchAllPaged(), fixed 2026-09-04). This will self-resolve once week 2 roster data lands.');
    } else add('A:database', 'nfl_rosters', PASS, `${weeks.length} weeks available`);
  });

  // --- Injuries: freshness AND the status-whitelist bug
  await check('A:database', 'player_injuries', async () => {
    const { ts } = await newestTs('player_injuries', ['captured_at', 'created_at', 'updated_at']);
    const age = daysSince(ts);
    if (age == null || age > 3) add('A:database', 'player_injuries', WARN, `newest injury row is ${fmtAge(age)} old`);
    else add('A:database', 'player_injuries', PASS, `newest injury row ${fmtAge(age)} old`);

    // The dossier filter is a lowercase whitelist: {out, doubtful, ir, pup, questionable}.
    // Real DB values include "Injured Reserve", which lowercases to "injured reserve"
    // and never equals "ir" — so every IR designation is silently discarded.
    // NOTE: this scan MUST paginate. An earlier version used .limit(1000) and was
    // silently truncated by the very PostgREST cap this gate exists to catch —
    // it never saw an "Injured Reserve" row and wrongly reported PASS.
    const counts = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from('player_injuries').select('injury_status').range(from, from + 999);
      if (error) throw new Error(error.message);
      if (!data.length) break;
      for (const r of data) { const s = (r.injury_status || '').trim(); if (s) counts[s] = (counts[s] || 0) + 1; }
      if (data.length < 1000) break;
    }
    // Run each real DB spelling through the shipping normalizer: anything that is
    // neither 'active' nor a recognized relevant status is silently dropped by the
    // dossier, so it must surface here.
    const dropped = Object.entries(counts)
      .filter(([s]) => {
        const n = normalizeInjuryStatus(s);
        return n !== 'active' && n !== null && !INJURY_RELEVANT_STATUS.has(n);
      })
      .sort((a, b) => b[1] - a[1]);
    if (dropped.length) {
      const tot = dropped.reduce((a, [, n]) => a + n, 0);
      add('A:database', 'player_injuries.status_filter', BLOCK,
        `normalizeInjuryStatus() does not recognize ${tot} non-Active injury row(s): ${dropped.map(([s, n]) => `"${s}"=${n}`).join(', ')} — these are silently dropped from the dossier.`,
        'agents/lib/injury-status.js — add these spellings to normalizeInjuryStatus() / INJURY_RELEVANT_STATUS');
    } else {
      const kept = Object.entries(counts).filter(([s]) => { const n = normalizeInjuryStatus(s); return n !== 'active' && n !== null; })
        .reduce((a, [, n]) => a + n, 0);
      add('A:database', 'player_injuries.status_filter', PASS, `every non-Active status is recognized (${kept} relevant rows across ${Object.keys(counts).length} distinct spellings)`);
    }
  });

  // --- Intel lanes
  await check('A:database', 'normalized_signals', async () => {
    const total = await rowCount('normalized_signals');
    const { ts } = await newestTs('normalized_signals', ['created_at', 'updated_at']);
    const age = daysSince(ts);
    if (total === 0) add('A:database', 'normalized_signals', BLOCK, 'table empty');
    else if (age > 7) add('A:database', 'normalized_signals', WARN, `${total} rows, newest ${fmtAge(age)} old`);
    else add('A:database', 'normalized_signals', PASS, `${total} rows, newest ${fmtAge(age)} old`);
  });

  await check('A:database', 'podcast_extraction_coverage', async () => {
    // 2026-09-08 fix (Codex review + Andy spot-check): the denominator used to
    // be ALL podcast_transcripts rows, including non-NFL episodes (PGA, NBA,
    // UFC, World Cup, March Madness, etc. from multi-sport betting feeds) that
    // should never have needed a host-summary extraction in the first place.
    // Filter both sides of the ratio down to NFL-relevant episodes (the same
    // isNflRelevantEpisode() filter podcast-ingest.js and
    // podcast-diarize-backfill.js already apply) so this check measures real
    // backlog, not irrelevant content dragging the percentage down.
    const { data: transcriptRows } = await sb.from('podcast_transcripts').select('episode_id');
    const transcriptIds = [...new Set((transcriptRows || []).map((r) => r.episode_id).filter(Boolean))];
    let relevantIds = new Set(transcriptIds); // fallback: treat all as relevant if episode lookup fails
    try {
      const { data: episodeRows } = await sb.from('podcast_episodes').select('id, title').in('id', transcriptIds);
      relevantIds = new Set((episodeRows || []).filter((e) => isNflRelevantEpisode(e.title || '')).map((e) => e.id));
    } catch { /* podcast_episodes lookup failed -- fall back to unfiltered count above */ }
    const transcripts = relevantIds.size;
    // 2026-09-08 fix: this used to measure ONLY podcast_reextractions -- a
    // 6-row pilot batch from 2026-09-04 that never grew into the real
    // pipeline. The table signal-normalize.js actually reads for
    // full-transcript-fidelity extraction is podcast_host_summaries
    // (confirmed in that file's own wiring comment, and re-verified by the
    // podcast_host_summaries wiring check just above). Count DISTINCT
    // episode_id there, since a multi-host episode can have several rows.
    let reex = 0; try { reex = await rowCount('podcast_reextractions'); } catch { /* table may not exist */ }
    let hostSummaryEpisodes = 0;
    try {
      const { data } = await sb.from('podcast_host_summaries').select('episode_id');
      hostSummaryEpisodes = new Set((data || []).map((r) => r.episode_id).filter((id) => relevantIds.has(id))).size;
    } catch { /* table may not exist */ }
    const covered = Math.max(reex, hostSummaryEpisodes);
    const pct = transcripts ? (covered / transcripts * 100) : 0;
    const detail = `${hostSummaryEpisodes}/${transcripts} NFL-relevant transcripts (${pct.toFixed(1)}%) have a full-transcript host-summary extraction (podcast_host_summaries) -- the pipeline signal-normalize.js actually reads. (${transcriptIds.length} total podcast_transcripts rows exist; ${transcriptIds.length - transcripts} were filtered out as non-NFL content via isNflRelevantEpisode() and don't count toward this ratio. podcast_reextractions, a separate older/abandoned re-extraction table, has ${reex} rows -- kept only as a secondary reference.) A transcript without either is still only extracted from the first ~12,000 characters podcast-ingest.js originally sent the model.`;
    if (pct === 0) {
      add('A:database', 'podcast_extraction_coverage', BLOCK, detail,
        'Run agents/podcast-host-summary.js to build initial coverage.');
    } else if (pct < 90) {
      add('A:database', 'podcast_extraction_coverage', WARN, detail,
        'Run agents/podcast-host-summary.js against the remaining transcripts -- it safely skips episodes already covered for the target --model, and skips multi-host episodes with no speaker diarization yet rather than guessing at attribution.');
    } else {
      add('A:database', 'podcast_extraction_coverage', PASS, detail);
    }
  });

  await check('A:database', 'podcast_host_summaries', async () => {
    const total = await rowCount('podcast_host_summaries');
    if (total === 0) { add('A:database', 'podcast_host_summaries', PASS, 'empty'); return; }
    // 2026-09-04 Tier-4 fix: wired into agents/signal-normalize.js's
    // gatherHostSummaryRows() (pre-classified, no LLM cost) -> normalized_signals
    // sidecar -> portfolio-dossier.js's makeNormalizedFindLean(). Check the actual
    // source for that wiring rather than assuming the old "never read" state --
    // same self-referential-gate lesson as the injury-status/market-row-retention
    // checks: verify against real code, don't freeze an old finding as permanent.
    const src = await readFile(path.join(ROOT, 'agents', 'signal-normalize.js'), 'utf8');
    const wired = /gatherHostSummaryRows|from\('podcast_host_summaries'\)/.test(src);
    if (wired) add('A:database', 'podcast_host_summaries', PASS,
      `${total} rows of FULL-transcript-fidelity host extraction are wired into signal-normalize.js -> normalized_signals -> the dossier.`);
    else add('A:database', 'podcast_host_summaries', WARN,
      `${total} rows of FULL-transcript-fidelity host extraction exist and are NOT read by portfolio-dossier.js or portfolio-synthesize.js. The one intel source without the 12k truncation bug never reaches the report.`,
      'Wire podcast_host_summaries into the dossier, or generate the docs/Futures_Picks_Summary_<date>.md that loadPodcastEvidenceIndex() looks for (nothing in the repo produces it).');
  });

  // --- Silent 1000-row cap: judge every real call site against its table size
  //
  // 2026-09-09 (Codex round-6): a table whose size could not be determined
  // -- a dynamically-named call site (`table === '(dynamic table)'`, from
  // scanCallSites() when it can't read a literal string argument) OR a
  // named table whose rowCount() lookup itself failed (network hiccup,
  // permissions) -- got `sizes[t] = null`. A null size satisfied NEITHER
  // the old truncating filter (`>= 1000`, since `null ?? 0` is 0) NOR the
  // fine filter (`sizes[x.table] !== null`) -- the site silently vanished
  // from every reported bucket while still being subtracted out of
  // `safeCount`. An unresolved size is exactly the case this gate exists
  // for: we cannot prove the read is safe, so it is now BLOCKed by
  // default rather than dropped.
  await check('A:rowcap', 'scan', async () => {
    const sites = [];
    for (const rel of SCANNED_SOURCES) {
      try {
        sites.push(...scanCallSites(await readFile(path.join(ROOT, rel), 'utf8'), rel));
      } catch (err) {
        if (shouldSkipScanError(err)) continue; // file genuinely absent in this checkout -- nothing to scan
        // 2026-09-10 (Codex round-8): any OTHER failure here -- a
        // permission error reading a file that DOES exist, an encoding
        // problem, or an unexpected exception thrown by scanCallSites()
        // itself (a scanner bug) -- used to be swallowed by this same
        // catch as "file may not exist", silently removing the ENTIRE
        // file from the gate: it contributed neither sites nor a BLOCK,
        // so A:rowcap could report PASS/WARN without having actually
        // scanned every declared source. Fail closed instead: push one
        // file-level unresolved sentinel so a source that could not be
        // scanned, for any reason other than genuinely not existing,
        // always surfaces a BLOCK rather than silently vanishing.
        sites.push({
          table: '(dynamic table)', file: rel, line: 1, safe: false,
          why: `file could not be scanned (${err?.message || err}) -- static analysis cannot verify any read in this file is bounded`,
        });
      }
    }
    const risky = sites.filter(x => !x.safe);
    const resolvable = risky.filter(x => x.table !== '(dynamic table)');
    const tables = [...new Set(resolvable.map(x => x.table))];

    const sizes = {};
    for (const t of tables) { try { sizes[t] = await rowCount(t); } catch { sizes[t] = null; } }

    const { unresolved, truncating, fine, safeCount, blockedCount } = classifyRowcapSites(sites, sizes);

    if (truncating.length) {
      for (const x of truncating) {
        const size = sizes[x.table];
        add('A:rowcap', `${x.table} @ ${x.file}:${x.line}`, BLOCK,
          size == null
            ? `Table size could not be verified (rowCount lookup failed), read ${x.why} — treated as unsafe by default rather than assumed small.`
            : `${size.toLocaleString()} rows, read ${x.why} — PostgREST silently returns 1000 (${(1000 / size * 100).toFixed(1)}%).`,
          'Add a .range() pagination loop (fetchAllPaged() in portfolio-dossier.js is the shared helper).');
      }
    }
    if (unresolved.length) {
      for (const x of unresolved) {
        add('A:rowcap', `${x.table} @ ${x.file}:${x.line}`, BLOCK,
          `Table name could not be resolved statically, read ${x.why} — size cannot be verified, so this read is treated as unsafe by default.`,
          'Give this call a literal table name, or bound it explicitly (.range()/.limit()/head:true/.single()) so the scanner can verify it directly.');
      }
    }
    add('A:rowcap', 'call-site scan', blockedCount ? WARN : PASS,
      `${sites.length} Supabase read sites across ${SCANNED_SOURCES.length} agents: ${safeCount} safely bounded, ${truncating.length} truncating, ${unresolved.length} with an unresolved table name, ${fine.length} unbounded but on small tables.`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE B — LOCAL FILE LANES: exist, and are fresh by CONTENT date not mtime
// ══════════════════════════════════════════════════════════════════════════════
// The existing freshness gate hashes files and detects drift only. A file frozen
// since August has a stable hash and passes forever. These are absolute-age checks.

// 2026-09-08: Andy's explicit call -- these maxAgeDays were tuned for
// in-season cadence (injury reports and market prices genuinely move fast
// once games are being played). During preseason, older "stale" values are
// still relevant context, not garbage to discard -- so each lane also
// carries a wider preseasonMaxAgeDays, used only while getSeasonStatus()
// says the season hasn't started yet. Once games begin, the tighter
// in-season limit applies automatically again -- nothing to remember to
// revert. Numbers below are a starting assumption (roughly 2x, capped),
// not a measured cadence -- tune per-lane if a specific one still fires
// false alarms during preseason.
const FILE_LANES = [
  { rel: 'data/player-availability/latest.json', maxAgeDays: 7,  preseasonMaxAgeDays: 14, required: true,  feeds: 'player_availability (32/32 teams)' },
  { rel: `data/training-camp/${SEASON}/latest.json`, maxAgeDays: 14, preseasonMaxAgeDays: 21, required: false, feeds: 'training_camp_intel' },
  { rel: 'data/expert-dossiers/latest.json',    maxAgeDays: 14, preseasonMaxAgeDays: 21, required: false, feeds: 'expertDossierLine in the prompt' },
  { rel: 'data/prediction-markets/latest.json', maxAgeDays: 7,  preseasonMaxAgeDays: 14, required: false, feeds: 'prediction_markets (team_profiles.prediction_markets, 2026-09-04)' },
];

async function stageB() {
  const status = await getSeasonStatus();
  for (const lane of FILE_LANES) {
    await check('B:files', lane.rel, async () => {
      const f = await readJsonIf(lane.rel);
      if (f.error) {
        add('B:files', lane.rel, lane.required ? BLOCK : WARN,
          `missing or unreadable (${f.error}) — the loader swallows this and returns {} with no warning`, `feeds ${lane.feeds}`);
        return;
      }
      const cts = contentTs(f.json);
      const age = daysSince(cts) ?? daysSince(f.mtime);
      const src = cts ? 'content timestamp' : 'file mtime';
      const preseason = status.started === false && lane.preseasonMaxAgeDays != null;
      const limit = preseason ? lane.preseasonMaxAgeDays : lane.maxAgeDays;
      const limitNote = preseason ? ` (preseason limit ${limit}d, in-season limit ${lane.maxAgeDays}d)` : ` (limit ${limit}d)`;
      if (age != null && age > limit) {
        add('B:files', lane.rel, BLOCK, `${fmtAge(age)} old by ${src}${limitNote} — feeds ${lane.feeds}`,
          'Rebuild this lane, or accept that the model is reasoning on stale inputs.');
      } else add('B:files', lane.rel, PASS, `${fmtAge(age)} old by ${src}${limitNote}`);
    });
  }

  // Money/policy inputs: these soft-fail to null and the run proceeds unsized.
  const MONEY = [
    { rel: 'data/futures-imports/platinum-rose-ai-official-2026.json', label: 'contract (bankroll + sizing_map)', maxAgeDays: null },
    { rel: 'data/futures-imports/andy-portfolio-ledger-2026.json',     label: 'ledger (live exposure)',           maxAgeDays: 21 },
    { rel: 'data/futures-imports/betonline-superbowl-futures-promo-2026.json', label: 'sportsbook promotions',     maxAgeDays: null },
    { rel: 'data/futures-imports/futures-watchlist-2026.json',         label: 'watchlist',                        maxAgeDays: 21 },
  ];
  for (const m of MONEY) {
    await check('B:money', m.label, async () => {
      const f = await readJsonIf(m.rel);
      if (f.error) {
        add('B:money', m.label, BLOCK,
          `${m.rel} missing (${f.error}). loadOfficialConfig/loadLedger/loadWatchlist all catch and return null, then the run continues and sizes every proposal with NO bankroll rules.`,
          'This should be a hard failure in portfolio-synthesize.js, not a console.warn.');
        return;
      }
      const cts = contentTs(f.json);
      const age = daysSince(cts);
      // The contract carries a hard cutoff date the code never checks.
      if (f.json?.futures_portfolio?.cutoff_utc || f.json?.cutoff_utc) {
        const cutoff = f.json?.futures_portfolio?.cutoff_utc || f.json?.cutoff_utc;
        const daysToCutoff = -daysSince(cutoff);
        if (daysToCutoff < 0) add('B:money', 'contract.cutoff', BLOCK, `cutoff_utc ${cutoff} has PASSED (${Math.abs(daysToCutoff).toFixed(1)}d ago) and nothing in the code notices`);
        else add('B:money', 'contract.cutoff', PASS, `cutoff_utc ${cutoff} in ${daysToCutoff.toFixed(1)}d`);
      }
      if (m.maxAgeDays && age != null && age > m.maxAgeDays)
        add('B:money', m.label, WARN, `${fmtAge(age)} stale — the committee sizes against exposure this old`);
      else add('B:money', m.label, PASS, age == null ? 'present' : `${fmtAge(age)} old`);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE C — RUN-ORDER INTEGRITY: is the dossier built from the CURRENT signals?
// ══════════════════════════════════════════════════════════════════════════════

async function findLatestDossier() {
  const explicit = argVal('--dossier');
  if (explicit) return path.isAbsolute(explicit) ? explicit : path.join(ROOT, explicit);
  const dir = path.join(ROOT, '.nfl', 'portfolio');
  const files = (await readdir(dir)).filter(f => /^dossier-\d{4}-\d{2}-\d{2}.*\.json$/.test(f)).sort();
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

let DOSSIER = null;

// 2026-09-08 fix: neither the season-stats checks below nor the file-freshness
// checks in Stage B knew whether the season had actually started -- a dossier
// built 3 days before week 1 kickoff got the exact same "ZERO rows / BLOCK"
// treatment as one built mid-season with a genuinely broken ingest. Compute
// this once (memoized) from the real schedule: if week 1's kickoff is still
// in the future, zero current-season rows is the CORRECT state, not a gap.
let SEASON_STATUS = null;
async function getSeasonStatus() {
  if (SEASON_STATUS) return SEASON_STATUS;
  if (!sb) { SEASON_STATUS = { started: null, firstKickoff: null, daysToKickoff: null }; return SEASON_STATUS; }
  try {
    const { data, error } = await sb.from('games').select('kickoff_utc')
      .eq('season', SEASON).eq('season_type', 2).order('kickoff_utc', { ascending: true }).limit(1);
    if (error || !data?.length) { SEASON_STATUS = { started: null, firstKickoff: null, daysToKickoff: null }; return SEASON_STATUS; }
    const firstKickoff = data[0].kickoff_utc;
    SEASON_STATUS = { started: new Date(firstKickoff).getTime() <= NOW, firstKickoff, daysToKickoff: -daysSince(firstKickoff) };
  } catch {
    SEASON_STATUS = { started: null, firstKickoff: null, daysToKickoff: null };
  }
  return SEASON_STATUS;
}


async function stageC() {
  await check('C:runorder', 'dossier', async () => {
    const p = await findLatestDossier();
    if (!p) { add('C:runorder', 'dossier', BLOCK, 'no dossier-<date>.json found in .nfl/portfolio/ — run portfolio-dossier.js first'); return; }
    DOSSIER = JSON.parse(await readFile(p, 'utf8'));
    const age = daysSince(DOSSIER?.meta?.generated_at);
    const rel = path.relative(ROOT, p);
    if (age > 1) add('C:runorder', 'dossier', WARN, `${rel} is ${fmtAge(age)} old`);
    else add('C:runorder', 'dossier', PASS, `${rel}, ${fmtAge(age)} old`);
  });

  // The sidecar is the dominant intel path. If it was regenerated AFTER the
  // dossier was built, the dossier silently carries fewer signals and its own
  // intel_coverage faithfully reports the smaller number, so nothing looks wrong.
  await check('C:runorder', 'signals-vs-dossier', async () => {
    const sidecarRel = path.join('.nfl', 'portfolio', `normalized-signals-${MODEL}.json`);
    const f = await readJsonIf(sidecarRel);
    if (f.error) {
      add('C:runorder', 'signals-vs-dossier', BLOCK,
        `${sidecarRel} missing (${f.error}). loadNormalizedSignals() catches this and returns null, silently downgrading experts{} and adjacent_signals{} to empty.`);
      return;
    }
    const sidecarCount = Array.isArray(f.json?.signals) ? f.json.signals.length : 0;
    const dossierCount = DOSSIER?.meta?.intel_coverage?.signals ?? null;
    const sidecarTs = contentTs(f.json);
    const dossierTs = DOSSIER?.meta?.generated_at;

    if (dossierCount == null) { add('C:runorder', 'signals-vs-dossier', WARN, 'dossier has no meta.intel_coverage.signals to compare'); return; }
    if (sidecarTs && dossierTs && new Date(sidecarTs) > new Date(dossierTs)) {
      const lost = sidecarCount - dossierCount;
      add('C:runorder', 'signals-vs-dossier', BLOCK,
        `RUN ORDER VIOLATION: signals sidecar regenerated at ${sidecarTs} (${sidecarCount} signals) AFTER the dossier was built at ${dossierTs} (${dossierCount} signals). The dossier is missing ${lost} signals (${(lost / sidecarCount * 100).toFixed(0)}% of available intel) and reports the smaller number as if correct.`,
        'Re-run portfolio-dossier.js. Correct order is always: signal-normalize -> portfolio-dossier -> portfolio-synthesize.');
    } else if (sidecarCount !== dossierCount) {
      add('C:runorder', 'signals-vs-dossier', WARN, `sidecar has ${sidecarCount} signals, dossier used ${dossierCount}`);
    } else add('C:runorder', 'signals-vs-dossier', PASS, `${sidecarCount} signals, dossier in sync`);
  });

  // portfolio-simulate.js patches sim fields into the dossier in place. Without
  // it, the CI90-lower-bound invalidation rule silently never fires.
  await check('C:runorder', 'sim-patch', async () => {
    if (!DOSSIER) return;
    if (!DOSSIER?.meta?.sim_version) {
      add('C:runorder', 'sim-patch', WARN,
        'dossier is NOT sim-patched (no meta.sim_version). deterministicFairLowerFor() returns null, so the "edge_lower_bound <= 0" invalidation rule is a silent no-op — a gate that reads as active in the code but never fires.',
        'Run portfolio-simulate.js after portfolio-dossier.js.');
    } else add('C:runorder', 'sim-patch', PASS, `sim_version ${DOSSIER.meta.sim_version}`);
  });

  // Coverage counters the dossier computes about itself.
  await check('C:runorder', 'signal_coverage', async () => {
    if (!DOSSIER) return;
    const sc = DOSSIER.signal_coverage || DOSSIER?.meta?.signal_coverage || {};
    const zeros = Object.entries(sc).filter(([k, v]) => typeof v === 'number' && v === 0 && /^teams_with_/.test(k));
    if (zeros.length) add('C:runorder', 'signal_coverage', WARN,
      `dossier reports ZERO team coverage for: ${zeros.map(([k]) => k.replace('teams_with_', '')).join(', ')}`);
    else add('C:runorder', 'signal_coverage', PASS, 'no zeroed team-coverage counters');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE D — PROMPT ASSEMBLY SIMULATION (no model call, no cost)
// ══════════════════════════════════════════════════════════════════════════════
// Replays what --shadow-slim actually ships to the model, so data destroyed at
// the prompt seam is visible BEFORE paying. Limits are parsed out of the real
// source file so this cannot drift out of sync with the code it validates.

async function parseSlimLimits() {
  const src = await readFile(path.join(ROOT, 'agents', 'portfolio-synthesize.js'), 'utf8');
  const block = src.match(/const\s+limits\s*=\s*\{([\s\S]*?)\}/);
  const limits = {};
  if (block) for (const m of block[1].matchAll(/([A-Za-z0-9_']+)\s*:\s*(\d+)/g)) limits[m[1].replace(/'/g, '')] = Number(m[2]);
  const defM = src.match(/limits\[market\]\s*\?\?\s*(\d+)/);
  const keepM = src.match(/const\s+keepKeys\s*=\s*\[([\s\S]*?)\]/);
  const profM = src.match(/slimTeamProfile[\s\S]{0,400}?\[([\s\S]*?)\]/);
  return {
    limits,
    fallback: defM ? Number(defM[1]) : null,
    keepKeys: keepM ? [...keepM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [],
    profileKeys: profM ? [...profM[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [],
  };
}

async function stageD() {
  if (!DOSSIER) return;
  const cfg = await parseSlimLimits();
  const synthSrc = await readFile(path.join(ROOT, 'agents', 'portfolio-synthesize.js'), 'utf8');

  // Mirrors the real edgeValue()/takeRows() algorithm in portfolio-synthesize.js so this
  // check tracks the actual current ranking rather than a frozen snapshot of an old bug.
  // Falls back to the old abs-value ranking if that source no longer looks like the
  // signed-edge-first version, so a future regression still gets caught instead of
  // silently validated against dead logic.
  const usesSignedEdgeRanking = /function\s+edgeValue\s*\(/.test(synthSrc) && /positive\.slice\(0,\s*n\)/.test(synthSrc);
  function gateEdgeValue(row) {
    if (row.consensus_line != null) {
      const over = row.best_over_edge_pct, under = row.best_under_edge_pct;
      if (over == null && under == null) return null;
      return Math.max(over ?? -Infinity, under ?? -Infinity);
    }
    if (row.value_gap != null) return row.value_gap;
    if (row.sim?.gap != null) return row.sim.gap;
    return null;
  }
  function gateEdgeMagnitude(row) {
    if (row.consensus_line != null) return Math.max(Math.abs(row.best_over_edge_pct ?? 0), Math.abs(row.best_under_edge_pct ?? 0));
    if (row.sim?.gap != null) return Math.abs(row.sim.gap);
    return Math.abs(row.value_gap ?? row.book_divergence ?? 0);
  }
  function gateTakeRows(rows, n) {
    if (!usesSignedEdgeRanking) return [...rows].sort((a, b) => gateEdgeMagnitude(b) - gateEdgeMagnitude(a)).slice(0, n);
    const all = [...rows];
    const positive = all.filter((r) => { const v = gateEdgeValue(r); return v != null && v > 0; });
    const posSet = new Set(positive);
    const rest = all.filter((r) => !posSet.has(r));
    positive.sort((a, b) => (gateEdgeValue(b) ?? -Infinity) - (gateEdgeValue(a) ?? -Infinity));
    rest.sort((a, b) => gateEdgeMagnitude(b) - gateEdgeMagnitude(a));
    const kept = positive.slice(0, n);
    if (kept.length < n) kept.push(...rest.slice(0, n - kept.length));
    return kept;
  }

  // D1 — how many market rows survive slimming, and are positive-edge rows lost?
  await check('D:prompt', 'market-row-retention', async () => {
    const si = DOSSIER.synthesis_input || {};
    let total = 0, kept = 0;
    const starved = [], edgeLoss = [];
    for (const [market, rows] of Object.entries(si)) {
      if (!Array.isArray(rows)) continue;
      const n = cfg.limits[market] ?? cfg.fallback ?? 4;
      total += rows.length; kept += Math.min(rows.length, n);
      if (!(market in cfg.limits) && rows.length > n) starved.push(`${market} ${rows.length}->${n}`);

      const keptRows = gateTakeRows(rows, n);
      const keptSet = new Set(keptRows);
      const droppedRows = rows.filter(r => !keptSet.has(r));
      const posDropped = droppedRows.filter(r => (gateEdgeValue(r) ?? 0) > 0);
      const posKept = keptRows.filter(r => (gateEdgeValue(r) ?? 0) > 0);
      if (posDropped.length && posKept.length === 0)
        edgeLoss.push(`${market}: all ${posDropped.length} positive-edge row(s) dropped, ${n} negative-edge rows kept`);
    }
    const pct = total ? ((total - kept) / total * 100) : 0;
    if (starved.length) add('D:prompt', 'market-row-retention', BLOCK,
      `${starved.length} market(s) still fall through to the undifferentiated ?? ${cfg.fallback} default instead of an explicit limit sized for that market: ${starved.slice(0, 8).join(', ')}${starved.length > 8 ? ` (+${starved.length - 8} more)` : ''}. Meanwhile SYSTEM_PROMPT orders the model to "scan every market (all 8 divisions...)".`,
      'portfolio-synthesize.js — give every market its own explicit entry in the limits map.');
    else if (pct > 80) add('D:prompt', 'market-row-retention', WARN,
      `--shadow-slim ships ${kept}/${total} market rows — ${pct.toFixed(1)}% dropped, but every market now has an explicit, sized limit (no silent ?? ${cfg.fallback} default left). The drop is concentrated in the largest combinatorial/candidate-pool markets (superbowl_matchup, awards) — re-check those limits as real coverage grows.`);
    else add('D:prompt', 'market-row-retention', PASS, `${kept}/${total} rows kept (${pct.toFixed(1)}% dropped) — every market has an explicit limit, none silently default`);

    if (edgeLoss.length) add('D:prompt', 'positive-edge-loss', BLOCK,
      `${usesSignedEdgeRanking ? 'Even with signed-edge-first ranking' : 'takeRows() still ranks by Math.abs(value_gap), so positive-EV longshots lose to negative-edge chalk'}. Markets where EVERY positive-edge row is dropped: ${edgeLoss.slice(0, 6).join(' | ')}${edgeLoss.length > 6 ? ` (+${edgeLoss.length - 6} more)` : ''}`,
      usesSignedEdgeRanking
        ? 'portfolio-synthesize.js — widen the limit for these markets so their positive-edge rows fit.'
        : 'portfolio-synthesize.js — rank by signed edge, or always retain positive-value_gap rows.');
    else add('D:prompt', 'positive-edge-loss', PASS, usesSignedEdgeRanking
      ? 'takeRows() ranks positive-edge rows first — no market loses all of its positive-edge rows to the budget'
      : 'no market loses all of its positive-edge rows');
  });

  // D2 — the team-key split: same team appearing twice per market under
  // different name spellings, halving the book pool behind each row.
  await check('D:prompt', 'team-key-split', async () => {
    const si = DOSSIER.synthesis_input || {};
    const split = [];
    for (const [market, rows] of Object.entries(si)) {
      // Same exclusion rule as canonicalizeSnapshots' isPlayerOrMultiSideMarket:
      // award_* are player names (two players can share a surname), exacta and
      // division_exact_position are compound position labels, and
      // superbowl_matchup is a two-sided "A vs B" label. None are team keys.
      const m = String(market).toLowerCase();
      if (!Array.isArray(rows) || m === 'superbowl_matchup' || m === 'exacta'
          || m === 'division_exact_position' || m.startsWith('award_')) continue;
      const byLast = {};
      for (const r of rows) {
        const name = String(r.team || r.selection || '?');
        const last = name.trim().split(/\s+/).pop().toLowerCase();
        (byLast[last] ??= []).push(name);
      }
      const dupes = Object.entries(byLast).filter(([, names]) => new Set(names).size > 1);
      if (dupes.length) split.push(`${market} (${dupes.length} team(s), e.g. ${[...new Set(dupes[0][1])].join(' / ')})`);
    }
    if (split.length) add('D:prompt', 'team-key-split', BLOCK,
      `The same team appears as multiple rows per market because buildOddsView groups on the raw book-supplied name: ${split.slice(0, 5).join('; ')}${split.length > 5 ? ` (+${split.length - 5} more markets)` : ''}. Each row devigs against only half the book pool, so the model sees two contradictory best prices for one bet — and validateRecommendationStrict (PRICE_TOLERANCE=0) will kill a pick that cites the better one.`,
      'portfolio-dossier.js:835 + :231-236 — normalize the team key for ALL markets, not just wins/playoffs.');
    else add('D:prompt', 'team-key-split', PASS, 'one row per team per market');
  });

  // D3 — adjacent_signals shape mismatch: producer emits an array, the slimmer
  // reads object properties off it, so every field comes back null.
  await check('D:prompt', 'adjacent_signals-shape', async () => {
    const adj = DOSSIER.adjacent_signals || {};
    const teams = Object.entries(adj);
    if (!teams.length) { add('D:prompt', 'adjacent_signals-shape', WARN, 'adjacent_signals is empty'); return; }
    const arrayShaped = teams.filter(([, v]) => Array.isArray(v)).length;
    // The old bug was slimDossierForPrompt reading .game_lean_count/.games/.props/.strongest
    // off an array — those accessors are the actual bug signature, not the array shape
    // itself. If the source no longer contains that accessor pattern, the mismatch is fixed
    // (whether via a passthrough or a real reshape) regardless of what shape the producer emits.
    const stillReadsObjectFields = /adjacent_signals[\s\S]{0,400}?game_lean_count\s*\?\?\s*[a-zA-Z0-9_.]*\.games/.test(synthSrc);
    if (arrayShaped > 0 && stillReadsObjectFields) {
      const [t, v] = teams.find(([, v]) => Array.isArray(v));
      add('D:prompt', 'adjacent_signals-shape', BLOCK,
        `SHAPE MISMATCH: producer emits adjacent_signals[team] as an ARRAY (${arrayShaped}/${teams.length} teams, e.g. ${t} has ${v.length} entries), but slimDossierForPrompt reads .game_lean_count/.games/.props/.strongest off it — all undefined. Under --shadow-slim the model receives {game_lean_count:null, prop_lean_count:null, strongest:null} for EVERY team: 100% of this block's content destroyed, while the prompt still tells the model to build correlated_week1 from it.`,
        'portfolio-synthesize.js:490-494 — handle the array shape (or pass adjacent_signals through unmodified).');
    } else add('D:prompt', 'adjacent_signals-shape', PASS, arrayShaped > 0
      ? `producer emits an array (${arrayShaped}/${teams.length} teams) and the slimmer no longer reads object-only fields off it — passed through intact`
      : 'shape matches what the slimmer expects');
  });

  // D4 — populated dossier fields the slimmer silently strips, and prompt
  // instructions that reference blocks the model is never sent.
  await check('D:prompt', 'dropped-profile-fields', async () => {
    const profiles = DOSSIER.team_profiles || {};
    const sample = Object.values(profiles);
    if (!sample.length) { add('D:prompt', 'dropped-profile-fields', WARN, 'no team_profiles'); return; }
    const populated = (key) => sample.filter(p => p && p[key] != null && (typeof p[key] !== 'object' || Object.keys(p[key]).length)).length;
    const CRITICAL = ['training_camp_intel', 'officiating_context', 'named_player_sizing_gate'];
    const lost = CRITICAL.filter(k => populated(k) > 0 && cfg.profileKeys.length && !cfg.profileKeys.includes(k))
                          .map(k => `${k} (populated on ${populated(k)}/${sample.length} teams)`);
    if (lost.length) add('D:prompt', 'dropped-profile-fields', BLOCK,
      `slimTeamProfile strips these populated fields before the model sees them: ${lost.join(', ')}. named_player_sizing_gate in particular is described in SYSTEM_PROMPT as "a hard cap, not a suggestion".`,
      'portfolio-synthesize.js:466-468 — add them to the keep-list, or delete the prompt text that promises them.');
    else add('D:prompt', 'dropped-profile-fields', PASS, 'no populated critical profile field is stripped');
  });

  await check('D:prompt', 'experts-block', async () => {
    const experts = DOSSIER.experts || {};
    const n = Object.keys(experts).length;
    if (n === 0) { add('D:prompt', 'experts-block', PASS, 'no experts map to lose'); return; }
    // The bug was buildUserPrompt's template literal never referencing dossier.experts /
    // promptDossier.experts at all. Check the actual source for that reference rather than
    // assuming it's still missing.
    const promptSendsExperts = /EXPERTS[\s\S]{0,200}?promptDossier\.experts/.test(synthSrc)
      || /experts:\s*dossier\.experts/.test(synthSrc);
    if (!promptSendsExperts) add('D:prompt', 'experts-block', BLOCK,
      `dossier.experts holds ${n} named analysts but is NEVER serialized into the prompt (buildUserPrompt sends only team_profiles, synthesis_input, adjacent_signals, roster_churn) — while SYSTEM_PROMPT instructs the model to "CITE SOURCES ... from the experts map". The model is told to consult a map it never receives.`,
      'portfolio-synthesize.js:399-417 — send it, or remove the two SYSTEM_PROMPT clauses that reference it.');
    else add('D:prompt', 'experts-block', PASS, `${n} named analysts are serialized into the prompt`);
  });

  // D5 — will the prompt even fit? Non-slim is ~331K tokens against 200K models.
  await check('D:prompt', 'prompt-size', async () => {
    const blocks = {
      team_profiles: DOSSIER.team_profiles, synthesis_input: DOSSIER.synthesis_input,
      adjacent_signals: DOSSIER.adjacent_signals, roster_churn: DOSSIER.roster_churn,
    };
    const chars = Object.values(blocks).reduce((a, b) => a + JSON.stringify(b ?? {}).length, 0);
    const tokens = Math.round(chars / 4);
    if (tokens > 190000) add('D:prompt', 'prompt-size', WARN,
      `full (non-slim) prompt is ~${tokens.toLocaleString()} tokens — exceeds the 200K context of the configured models, so --shadow-slim is effectively MANDATORY and all of its drops above are the real operating path.`);
    else add('D:prompt', 'prompt-size', PASS, `~${tokens.toLocaleString()} tokens`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE E — PRIOR-RUN FORENSICS: did the last paid run actually succeed?
// ══════════════════════════════════════════════════════════════════════════════

async function stageE() {
  await check('E:lastrun', 'previous-run', async () => {
    const dir = path.join(ROOT, '.nfl', 'portfolio');
    let files = [];
    try { files = (await readdir(dir)).filter(f => /^portfolio-.*\.raw\.json$/.test(f)).sort(); }
    catch { /* no prior runs on disk yet */ }
    if (!files.length) { add('E:lastrun', 'previous-run', PASS, 'no prior run to inspect'); return; }
    const p = path.join(dir, files[files.length - 1]);
    const raw = JSON.parse(await readFile(p, 'utf8'));
    const rel = path.relative(ROOT, p);
    const finalN = Array.isArray(raw.final) ? raw.final.length : null;
    const candN  = Array.isArray(raw.candidates) ? raw.candidates.length : null;
    const failed = Object.entries(raw.raw || {}).filter(([, v]) => v && v.error).map(([m]) => m);

    const notes = [];
    if (finalN === 0) notes.push(`final: 0 recommendations from ${candN} candidates — yet it still rendered a full report and exited 0`);
    if (failed.length) notes.push(`model(s) FAILED mid-run with no banner in the report: ${failed.join(', ')}`);
    if (raw?.meta?.committee_ran === false) notes.push('committee did not run (stage 1 only)');

    if (notes.length) add('E:lastrun', 'previous-run', WARN,
      `${rel} — ${notes.join(' | ')}. This is what a silent half-failure looks like; treat that report as untrustworthy.`,
      'portfolio-synthesize.js:3096/:3150/:3202 — exit non-zero (or render a hard banner) on any model error, committee crash, or final.length === 0.');
    else add('E:lastrun', 'previous-run', PASS, `${rel} — ${finalN} recommendations, no model errors`);
  });
}

// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  await stageA();
  await stageB();
  await stageC();
  await stageD();
  await stageE();

  const blocks = results.filter(r => r.status === BLOCK);
  const warns  = results.filter(r => r.status === WARN);
  const errs   = results.filter(r => r.status === ERROR);
  const passes = results.filter(r => r.status === PASS);
  // 2026-09-10 fix (Codex v4 review, Finding 1 continued): the JSON-output path
  // and the exit code were the two call sites already fixed to consult
  // isSafeToRunPaidSynthesis() -- but the human-readable text report below
  // computed its own "SAFE"/"DO NOT RUN" branch straight off `blocks.length`,
  // so a run with zero BLOCKs and one or more ERRORs still printed "SAFE TO
  // RUN PAID SYNTHESIS" to a human reading the CLI output, even though the
  // JSON `safe_to_run_paid_synthesis` field for that same run correctly said
  // false. Compute the one verdict once, here, and use it everywhere below --
  // JSON field, text report, and exit code -- so there is exactly one source
  // of truth instead of three independent copies of the same condition.
  const { safe, headline } = buildDisposition(blocks, errs);

  if (JSON_OUT) {
    console.log(JSON.stringify({
      generated_at: new Date().toISOString(), season: SEASON, model: MODEL,
      summary: { block: blocks.length, warn: warns.length, error: errs.length, pass: passes.length },
      safe_to_run_paid_synthesis: safe,
      results,
    }, null, 2));
  } else {
    const icon = { BLOCK: '[BLOCK]', WARN: '[WARN ]', PASS: '[ pass]', ERROR: '[ERROR]' };
    console.log('\n' + '='.repeat(78));
    console.log('  PORTFOLIO PREFLIGHT — free, read-only. No paid API calls, no writes.');
    console.log('='.repeat(78));
    let lastStage = null;
    for (const r of results) {
      if (r.stage !== lastStage) { console.log(`\n── ${r.stage} ${'─'.repeat(Math.max(0, 72 - r.stage.length))}`); lastStage = r.stage; }
      console.log(`${icon[r.status]} ${r.lane}`);
      if (r.status !== PASS) {
        console.log(`         ${r.detail}`);
        if (r.fix) console.log(`         FIX: ${r.fix}`);
      } else console.log(`         ${r.detail}`);
    }
    console.log('\n' + '='.repeat(78));
    console.log(`  ${blocks.length} BLOCK · ${warns.length} WARN · ${errs.length} ERROR · ${passes.length} pass`);
    console.log('='.repeat(78));
    if (!safe) {
      console.log('\n  ' + headline);
      if (blocks.length) {
        console.log('\n  Blocking issues:\n');
        blocks.forEach((b, i) => console.log(`   ${i + 1}. [${b.stage}] ${b.lane}`));
      }
      if (errs.length) {
        // A check that threw did not run to completion -- its lane was never
        // actually verified, which is not the same as having passed. Surface
        // these separately from BLOCKs so a human reading the report sees
        // *why* a run with zero blocking issues is still not safe.
        console.log('\n  Check(s) that did not run to completion (ERROR -- lane unverified):\n');
        errs.forEach((e, i) => console.log(`   ${i + 1}. [${e.stage}] ${e.lane} — ${e.detail}`));
      }
      console.log('');
    } else {
      console.log('\n  ' + headline + '\n');
    }
  }

  if (!WARN_ONLY && !safe) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error('preflight crashed:', e); process.exit(2); });
}
