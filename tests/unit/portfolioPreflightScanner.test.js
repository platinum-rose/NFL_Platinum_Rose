import { describe, expect, it } from 'vitest';
import { scanCallSites, classifyRowcapSites, shouldSkipScanError, isSafeToRunPaidSynthesis, buildDisposition } from '../../agents/portfolio-preflight.js';

// 2026-09-09 (Codex P2, flagged 2026-09-09): the preflight rowcap scanner's
// keyset-pagination recognition previously accepted bare
// `.order(col) + .gt/.gte(col, ...) + .limit(...)` syntax as proof of safe
// pagination. That syntax proves nothing about ITERATION -- a one-shot query
// with those three calls and no loop or advancing cursor only ever fetches
// the first page, yet was reported safe (a new scanner fail-open pattern).
// The fix requires the call site to be wrapped in the shared, audited
// fetchAllKeyset() helper (agents/lib/supabase-pagination.js).
//
// 2026-09-09 revision (Codex round-2, same finding, flagged again): the
// first fix recognized the wrapper purely by NAME PROXIMITY -- did the text
// "fetchAllKeyset" appear anywhere in the preceding 400 characters. Codex
// reproduced two false passes against that: a comment containing the name
// sitting in front of an unwrapped query, and an unrelated, already-CLOSED
// fetchAllKeyset() call earlier in the file. Both wrongly reported
// safe/keyset-paginated. Fixed with lexical paren-nesting over a
// comment/string-masked source.
//
// 2026-09-09 revision (Codex round-3, same finding, flagged a THIRD time):
// paren-nesting alone proves "somewhere inside these open parens", not
// "inside the SPECIFIC callback that actually gets invoked as the query
// builder" -- Codex found a `.from()` sitting in a different, UNRELATED
// property/argument of a genuine, still-open fetchAllKeyset(...)/
// fetchAllPaged(...) call still read as wrapped. Fixed properly this time
// with a real parser (`acorn`, now an explicit direct dependency):
// `findAstNodePath()` locates the exact ancestor chain containing a given
// offset, and `isWrappedInFetchAllKeyset()`/`isWrappedInFetchAllPaged()`
// check the precise structural relationship -- for fetchAllKeyset, the
// nearest enclosing function must be exactly the `applyFilters` property's
// value on an object that is itself one of fetchAllKeyset(...)'s own
// arguments; for fetchAllPaged, the nearest enclosing function must be
// exactly one of fetchAllPaged(...)'s own arguments directly. See those
// functions' own comments in portfolio-preflight.js for the full
// rationale, including why a parser was finally the right call after three
// rounds of the same category of bug.
//
// 2026-09-09 revision (Codex round-4, two more fail-opens on the AST
// version, flagged a FOURTH time): (1) the wrapper checks accepted a
// callback/options-object at ANY argument position of a genuine
// fetchAllKeyset()/fetchAllPaged() call, not the specific position that
// function's own signature actually reads -- an ignored extra argument
// containing a real-looking unsafe query was still misread as wrapped.
// (2) the four non-wrapper safety signals (.range(), head:true, .single(),
// a small literal .limit(n)) were STILL plain regex over a text window,
// carrying the same comment/string-spoofable weakness as every prior
// round's wrapper check -- just never exercised because no test targeted
// them specifically. Fixed both by finishing the AST migration: wrapper
// checks now require `arguments[1]` exactly (matching each helper's real
// `(label, ...)` signature), and the four non-wrapper signals are read off
// the real method-chain CallExpression nodes rooted at the `.from()` call
// (`collectChainedCalls()`) instead of any text window. There is no
// remaining regex-based safety check in this scanner as of this round.
//
// 2026-09-09 revision (Codex round-5, three more AST-level fail-opens,
// flagged a FIFTH time): (1) being lexically inside the RIGHT wrapper
// callback still didn't prove a `.from()` chain was the query that
// callback actually produces -- a decoy call elsewhere in the same
// function body inherited "wrapped" status just from sharing a function,
// and a genuinely-wrapped fetchAllPaged() callback that simply forgot
// `.range()` still read as paginated (fetchAllPaged, unlike fetchAllKeyset
// since round 2, does not own pagination itself). (2) `head: true` was
// read off ANY call in the chain, not specifically `.select()` -- the only
// method where that option means anything -- so an unrelated call with a
// `{ head: true }`-shaped argument could be misread as count-only. (3) the
// top-level `.from()` DISCOVERY step was itself still a plain regex over
// raw source text, findable in a comment or string and blind to a
// dynamically-named table in a real query. Fixed by requiring the chain's
// outermost link to be the value the wrapper function actually returns
// (`isChainReturnedByFunction()`), requiring fetchAllPaged specifically to
// also have a genuine `.range()` in that same chain, scoping
// `chainHasHeadTrueOption()` to `.select()` calls, and replacing the regex
// discovery with a single AST walk (`findAllFromCallSites()`) that also
// excludes `Buffer.from`/`Array.from`.
// 2026-09-09 revision (Codex round-6, three more fail-opens, flagged a
// SIXTH time): (1) `.limit()`/`.range()` accept a `{ foreignTable }` option
// that scopes the bound to an EMBEDDED relation, not the top-level query
// this call site reads -- `.limit(5, { foreignTable: 'comments' })` reads
// as a safe small limit while doing nothing to bound the actual rows read.
// (2) Supabase mutates the same query-builder object on every chained
// call, so when `.limit()` appears more than once the LAST one invoked
// wins at runtime -- `chainSmallLimitValue()` returned the FIRST occurrence
// in chain order, so an early safe-looking `.limit(500)` could report
// "bounded" while a later `.limit(2000)` silently overrode it. (3)
// `sb['from'](...)` (computed member access) was invisible to discovery
// entirely -- a real, if unusual, way to reach the same method. Fixed by
// scoping `.range()`/`.limit()` detection to exclude `foreignTable`-scoped
// calls (`isForeignTableScoped()`), rewriting `chainSmallLimitValue()` to
// walk forward and take the LAST applicable match, and accepting computed
// access whose property is the string literal `'from'` in
// `findAllFromCallSites()`.
describe('portfolio-preflight scanCallSites() -- keyset pagination recognition (round 9-13, Codex P2)', () => {
  it('flags a one-shot ordered/limited query as UNSAFE when it is not wrapped in fetchAllKeyset -- the negative test Codex asked for', () => {
    const src = `
      async function oneShotFetch(sb) {
        const { data, error } = await sb
          .from('vault_notes')
          .select('path, content')
          .order('path', { ascending: true })
          .gt('path', cursor || '')
          .limit(1000);
        return data;
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    // Not literally reported as the plain 'unpaginated' string here, because
    // this fixture also carries an inert .limit(1000) (PostgREST's own cap,
    // so it bounds nothing) -- what matters for this test is that keyset
    // syntax with no fetchAllKeyset() wrapper is NOT treated as safe.
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toMatch(/inert|unpaginated/);
  });

  it('recognizes a .from() call genuinely, lexically nested inside a fetchAllKeyset(...) argument list as safely paginated', () => {
    // Real call sites in this repo no longer contain an inline .from() at
    // all as of the round-2 helper-ownership revision (fetchAllKeyset()
    // builds `sb.from(table)` itself, internally, with a variable table
    // name the scanner's literal-string matcher doesn't even register --
    // see the next test). This fixture instead exercises the underlying
    // nesting-proof mechanism directly with a synthetic call shape, so a
    // future caller pattern that DOES nest a literal `.from()` inside a
    // fetchAllKeyset(...) argument is still correctly recognized.
    const src = `
      async function loadTeamNotes(sb) {
        const rows = await fetchAllKeyset('team notes fetch', {
          applyFilters: (q) => q.from('vault_notes').select('path, content'),
        });
        return rows;
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(true);
    expect(sites[0].why).toBe('paginated (keyset)');
  });

  it('reflects the real (round-2) call shape: a genuine fetchAllKeyset() call site has NO inline .from() to scan at all, because the helper now owns the query construction itself', () => {
    const src = `
      async function loadTeamNotes(sb) {
        const rows = await fetchAllKeyset('team notes fetch', {
          sb,
          table: 'vault_notes',
          select: 'path, content',
          cursorColumn: 'path',
          pageSize: 1000,
          applyFilters: (query) => query.like('path', 'NFL/Teams/%'),
        });
        return rows;
      }
    `;
    expect(scanCallSites(src, 'fixture.js')).toHaveLength(0);
  });

  it('Codex repro #1: does NOT treat a comment mentioning fetchAllKeyset as proof of wrapping', () => {
    const src = `
      // uses fetchAllKeyset for safe pagination, see docs
      async function oneShotFetch(sb) {
        const { data } = await sb
          .from('vault_notes')
          .select('path')
          .order('path', { ascending: true })
          .gt('path', cursor || '')
          .limit(1000);
        return data;
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).not.toBe('paginated (keyset)');
  });

  it('Codex repro #2: does NOT treat an unrelated, already-closed fetchAllKeyset() call earlier in the file as proof of wrapping a later unwrapped query', () => {
    const src = `
      async function loadSomethingElse(sb) {
        return fetchAllKeyset('unrelated fetch', { table: 'other_table' });
      }

      async function oneShotFetch(sb) {
        const { data } = await sb
          .from('vault_notes')
          .select('path')
          .order('path', { ascending: true })
          .gt('path', cursor || '')
          .limit(1000);
        return data;
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).not.toBe('paginated (keyset)');
  });

  it("Codex repro #3 (round 3): does NOT treat a .from() nested in an UNRELATED property of a genuine, still-open fetchAllKeyset(...) call as proof of wrapping -- only the applyFilters property's own function counts", () => {
    const src = `
      async function oneShotDisguisedAsWrapped(sb) {
        return fetchAllKeyset('label', {
          sb,
          table: 'vault_notes',
          select: 'path',
          cursorColumn: 'path',
          pageSize: 1000,
          someUnrelatedField: helperFn(sb
            .from('vault_notes')
            .select('path')
            .order('path', { ascending: true })
            .gt('path', cursor || '')
            .limit(1000)),
        });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).not.toBe('paginated (keyset)');
  });

  it('Codex repro #3 analog for fetchAllPaged: a .from() nested in a non-callback argument (not itself passed as a callback to fetchAllPaged) is NOT treated as wrapped', () => {
    // Deliberately uses order/gt/limit syntax rather than .range() so this
    // test isolates the fetchAllPaged-wrapping check specifically (a bare
    // .range() call would read as safe on its own merits regardless).
    const src = `
      async function oneShotDisguisedAsWrapped(sb) {
        return fetchAllPaged('label', someOtherCallback, helperFn(sb
          .from('vault_notes')
          .select('path')
          .order('path', { ascending: true })
          .gt('path', cursor || '')
          .limit(1000)));
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).not.toBe('paginated');
  });

  it('still recognizes .range()-based offset pagination and fetchAllPaged() wrapping as safe (unaffected by the keyset-recognition change)', () => {
    const rangeSrc = `
      async function f(sb) {
        return sb.from('vault_notes').select('path').range(0, 999);
      }
    `;
    expect(scanCallSites(rangeSrc, 'fixture.js')[0].safe).toBe(true);

    const pagedSrc = `
      async function f(sb) {
        return fetchAllPaged('label', (from, to) => sb.from('vault_notes').select('path').range(from, to));
      }
    `;
    expect(scanCallSites(pagedSrc, 'fixture.js')[0].safe).toBe(true);
  });

  it('does NOT treat a comment mentioning fetchAllPaged as proof of wrapping either -- same fix applied to both helpers', () => {
    const src = `
      // fetchAllPaged handles this safely elsewhere
      async function f(sb) {
        return sb.from('vault_notes').select('path');
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBeFalsy();
  });

  it('still treats a small literal .limit() as bounded-safe, and an unbounded large query as unsafe', () => {
    const boundedSrc = `
      async function f(sb) {
        return sb.from('vault_notes').select('path').in('path', docPaths).limit(999);
      }
    `;
    const bounded = scanCallSites(boundedSrc, 'fixture.js')[0];
    expect(bounded.safe).toBe(true);
    expect(bounded.why).toBe('bounded .limit(999)');

    const unboundedSrc = `
      async function f(sb) {
        return sb.from('vault_notes').select('path');
      }
    `;
    const unbounded = scanCallSites(unboundedSrc, 'fixture.js')[0];
    // scanCallSites() short-circuits `false || ... || boundedSmall` where
    // boundedSmall is `limitM && ...` -- with no .limit() at all, limitM is
    // null, so the chain evaluates to null rather than false. Falsy either
    // way (and preflight's own consumer only ever checks truthiness), but
    // assert with toBeFalsy() rather than a strict false to match that.
    expect(unbounded.safe).toBeFalsy();
    expect(unbounded.why).toBe('unpaginated');
  });

  it("Codex repro #4a (round 4): a fetchAllKeyset(...) call with a real-shaped applyFilters wrapper sitting at the WRONG argument index is NOT treated as wrapped, even with no independent safety signal", () => {
    const src = `
      async function oneShotDisguisedAsWrapped(sb) {
        return fetchAllKeyset('label', { sb, table: 'vault_notes' }, {
          applyFilters: (q) => q.from('vault_notes').select('path'),
        });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it("Codex repro #4b (round 4): a fetchAllPaged(...) call with a real-shaped callback sitting at the WRONG argument index is NOT treated as wrapped, even with no independent safety signal", () => {
    const src = `
      async function oneShotDisguisedAsWrapped(sb) {
        return fetchAllPaged('label', realCallback, (from, to) => sb.from('vault_notes').select('path'));
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('confirms .range() at the correct fetchAllPaged argument index (arguments[1]) is still recognized safe, distinguishing round-4\'s fix from breaking the genuine case', () => {
    const src = `
      async function f(sb) {
        return fetchAllPaged('label', (from, to) => sb.from('vault_notes').select('path').range(from, to));
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBe(true);
    expect(sites[0].why).toBe('paginated');
  });

  it('Codex repro #4c (round 4): a comment mentioning .range()/.limit()/head:true is NOT treated as a real safety signal -- these are now AST chain checks, not text', () => {
    const rangeCommentSrc = `
      // .range(0, 999) handled elsewhere, this is safe
      async function f(sb) { return sb.from('vault_notes').select('path'); }
    `;
    expect(scanCallSites(rangeCommentSrc, 'fixture.js')[0].safe).toBeFalsy();

    const headCommentSrc = `
      async function f(sb) {
        // uses head: true for counting, no rows returned
        return sb.from('vault_notes').select('path');
      }
    `;
    expect(scanCallSites(headCommentSrc, 'fixture.js')[0].safe).toBeFalsy();

    const singleCommentSrc = `
      // always call .single() on this
      async function f(sb) { return sb.from('vault_notes').select('path'); }
    `;
    expect(scanCallSites(singleCommentSrc, 'fixture.js')[0].safe).toBeFalsy();
  });

  it('Codex repro #4d (round 4): a string literal containing pagination-looking text (e.g. a stored ".limit(5)" value) is NOT treated as a real .limit() call', () => {
    const src = `
      async function f(sb) {
        return sb.from('vault_notes').select('note').eq('note', '.limit(5)');
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('confirms the four non-wrapper signals still work correctly when genuinely present in the AST (round-4\'s rewrite did not regress the positive cases)', () => {
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p').range(0,999); }`, 'f.js')[0].safe).toBe(true);
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p').eq('id',1).single(); }`, 'f.js')[0].safe).toBe(true);
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p').maybeSingle(); }`, 'f.js')[0].safe).toBe(true);
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p',{count:'exact',head:true}); }`, 'f.js')[0].safe).toBe(true);
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p').limit(500); }`, 'f.js')[0].safe).toBe(true);
    expect(scanCallSites(`async function f(sb){ return sb.from('vault_notes').select('p').limit(1000); }`, 'f.js')[0].safe).toBeFalsy();
  });

  it('Codex repro #5a (round 5): a genuine, RETURNED fetchAllPaged() callback that forgets .range() is NOT treated as paginated -- being a real wrapper proves nothing about whether it actually paginated', () => {
    const src = `
      async function f(sb) {
        return fetchAllPaged('label', (from, to) => sb.from('vault_notes').select('path'));
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('Codex repro #5b (round 5): a decoy .from() sitting in the right fetchAllPaged callback but NOT the value it returns is NOT trusted just for sharing a function -- the returned chain (a different table, with .range()) is separately and correctly marked safe', () => {
    const src = `
      async function f(sb) {
        return fetchAllPaged('label', (from, to) => {
          const decoy = sb.from('vault_notes').select('path');
          return sb.from('other_table').select('path').range(from, to);
        });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(2);
    const decoySite = sites.find((s) => s.table === 'vault_notes');
    const realSite = sites.find((s) => s.table === 'other_table');
    expect(decoySite.safe).toBeFalsy();
    expect(decoySite.why).toBe('unpaginated');
    expect(realSite.safe).toBe(true);
  });

  it('Codex repro #5c (round 5): a decoy .from() inside a genuine fetchAllKeyset() applyFilters callback, not the value it returns, is NOT trusted', () => {
    const src = `
      async function f(sb) {
        return fetchAllKeyset('label', {
          sb, table: 'vault_notes',
          applyFilters: (q) => { const decoy = q.from('vault_notes').select('x'); return q.eq('a', 1); },
        });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('confirms a genuine fetchAllKeyset() applyFilters callback whose returned chain IS the .from() call (implicit-return arrow) is still recognized safe -- the round-5 return-value check does not regress the ordinary case', () => {
    const src = `
      async function f(sb) {
        return fetchAllKeyset('label', {
          sb, table: 'vault_notes',
          applyFilters: (q) => q.from('vault_notes').select('path, content'),
        });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(true);
    expect(sites[0].why).toBe('paginated (keyset)');
  });

  it('Codex repro #5d (round 5): head:true on an UNRELATED method (not .select()) is not treated as the count-only safety signal', () => {
    const src = `
      async function f(sb) {
        return sb.from('vault_notes').select('path').eq('meta', { head: true });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('Codex repro #5e (round 5): .from() mentioned only in a comment or a string literal is NOT discovered as a real call site -- discovery is now AST-based, not regex over raw text', () => {
    const commentSrc = `
      // see sb.from('vault_notes') below for the real read
      async function f(sb) { return sb.from('real_table').select('p').range(0, 999); }
    `;
    const commentSites = scanCallSites(commentSrc, 'fixture.js');
    expect(commentSites).toHaveLength(1);
    expect(commentSites[0].table).toBe('real_table');

    const stringSrc = `
      async function f(sb) {
        const note = "call sb.from('vault_notes') if you need the raw rows";
        return sb.from('real_table').select('p').range(0, 999);
      }
    `;
    const stringSites = scanCallSites(stringSrc, 'fixture.js');
    expect(stringSites).toHaveLength(1);
    expect(stringSites[0].table).toBe('real_table');
  });

  it('Codex repro #5f (round 5): Buffer.from()/Array.from() are never mistaken for a database read -- discovery excludes them by object identity, not just by argument shape', () => {
    const src = `
      function f(sb) {
        const b = Buffer.from('hello', 'utf8');
        const a = Array.from('abc');
        return sb.from('vault_notes').select('p').range(0, 999);
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].table).toBe('vault_notes');
    expect(sites[0].safe).toBe(true);
  });

  it('confirms a dynamically-named table (sb.from(tableVar)) is still discovered as a site (reported as "(dynamic table)") rather than silently invisible -- the fail-closed default for a case discovery cannot name', () => {
    const src = `
      async function f(sb, tableVar) {
        return sb.from(tableVar).select('p');
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].table).toBe('(dynamic table)');
    expect(sites[0].safe).toBeFalsy();
  });

  it('Codex repro #6a (round 6): .limit(n, { foreignTable }) bounds an embedded relation, not the top-level query, and is NOT treated as a safety signal', () => {
    const src = `
      async function f(sb) {
        return sb.from('vault_notes').select('*, comments(*)').limit(5, { foreignTable: 'comments' });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('Codex repro #6b (round 6): .range(from, to, { foreignTable }) bounds an embedded relation, not the top-level query, and is NOT treated as pagination', () => {
    const src = `
      async function f(sb) {
        return sb.from('vault_notes').select('*, comments(*)').range(0, 9, { foreignTable: 'comments' });
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBeFalsy();
    expect(sites[0].why).toBe('unpaginated');
  });

  it('Codex repro #6c (round 6): when .limit() appears twice in a chain, the LAST call (the one Supabase actually sends) governs safety, not the first', () => {
    const overriddenLarger = scanCallSites(`
      async function f(sb) { return sb.from('vault_notes').select('p').limit(500).eq('x', 1).limit(2000); }
    `, 'fixture.js');
    expect(overriddenLarger[0].safe).toBeFalsy();
    expect(overriddenLarger[0].why).toContain('inert');

    const overriddenSmaller = scanCallSites(`
      async function f(sb) { return sb.from('vault_notes').select('p').limit(2000).eq('x', 1).limit(500); }
    `, 'fixture.js');
    expect(overriddenSmaller[0].safe).toBe(true);
    expect(overriddenSmaller[0].why).toBe('bounded .limit(500)');
  });

  it('Codex repro #6d (round 6): a foreignTable-scoped .limit() earlier in the chain does not mask a real, later top-level .limit()', () => {
    const src = `
      async function f(sb) {
        return sb.from('vault_notes').select('*, comments(*)').limit(5, { foreignTable: 'comments' }).limit(500);
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites[0].safe).toBe(true);
    expect(sites[0].why).toBe('bounded .limit(500)');
  });

  it("Codex repro #6e (round 6): sb['from'](...) (computed member access) is discovered just like sb.from(...) -- discovery is no longer invisible to this real, if unusual, call form", () => {
    const src = `
      async function f(sb) { return sb['from']('vault_notes').select('p').range(0, 999); }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].table).toBe('vault_notes');
    expect(sites[0].safe).toBe(true);
  });

  it("confirms Buffer.from/Array.from are excluded even when called via computed access (Buffer['from'](...)) -- the exclusion is by object identity, not call syntax", () => {
    const src = `
      function f(sb) {
        const b = Buffer['from']('x');
        return sb.from('vault_notes').select('p').range(0, 999);
      }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].table).toBe('vault_notes');
  });
});

describe('portfolio-preflight round 7 (Codex P2 fixes)', () => {
  it('Codex repro #7a: .limit(5, { referencedTable }) is treated the same as { foreignTable } -- scoped to an embedded relation, NOT a top-level bound', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('*, comments(*)').limit(5, { referencedTable: 'comments' }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('Codex repro #7b: .range(0, 9, { referencedTable }) is treated the same as { foreignTable } -- scoped to an embedded relation, NOT top-level pagination', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('*, comments(*)').range(0, 9, { referencedTable: 'comments' }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('confirms a genuine top-level .limit(n, { referencedTable }) on the OTHER relation still fails closed even though this exact repro is embedded-relation scoping, not a false positive on ordinary bounded calls', () => {
    // Sanity check: an ordinary bounded call with no relation-scoping option at all is unaffected.
    const src = `async function f(sb){ return sb.from('vault_notes').select('p').limit(500); }`;
    expect(scanCallSites(src, 'fixture.js')[0].safe).toBe(true);
  });

  it('fails closed on a non-literal (dynamic) options argument to .limit() -- cannot prove it lacks foreignTable/referencedTable statically', () => {
    const src = `async function f(sb, opts){ return sb.from('vault_notes').select('p').limit(5, opts); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('fails closed on a spread property inside a literal .range() options object -- cannot prove the spread does not carry foreignTable/referencedTable', () => {
    const src = `async function f(sb, extra){ return sb.from('vault_notes').select('p').range(0, 9, { ...extra }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('Codex repro #7c: sb.from(tableVar) in a file that fails to parse still surfaces a file-level unresolved sentinel, not zero sites', () => {
    const src = `this is not valid javascript at all {{{ sb.from(tableVar).select('*'`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites.length).toBeGreaterThanOrEqual(1);
    expect(sites.some((s) => s.table === '(dynamic table)')).toBe(true);
  });

  it("Codex repro #7d: sb['from']('vault_notes') in a file that fails to parse still surfaces a file-level unresolved sentinel, not zero sites", () => {
    const src = `this is not valid javascript at all {{{ sb['from']('vault_notes').select('*'`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites.length).toBeGreaterThanOrEqual(1);
    expect(sites.some((s) => s.table === '(dynamic table)')).toBe(true);
  });

  it('confirms a file that fails to parse but DOES contain a literal .from(\'table\') still reports that table too, alongside the unconditional sentinel', () => {
    const src = `this is not valid javascript {{{ sb.from('vault_notes').select('*'`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites.some((s) => s.table === 'vault_notes')).toBe(true);
    expect(sites.some((s) => s.table === '(dynamic table)')).toBe(true);
  });

  it('Codex repro #7e: classifyRowcapSites() BLOCKs an unresolved-table site even when no size lookup was ever attempted for it', () => {
    const sites = [
      { table: '(dynamic table)', file: 'a.js', line: 1, safe: false, why: 'table name could not be resolved statically' },
    ];
    const result = classifyRowcapSites(sites, {});
    expect(result.unresolved).toHaveLength(1);
    expect(result.truncating).toHaveLength(0);
    expect(result.blockedCount).toBe(1);
    expect(result.safeCount).toBe(0);
  });

  it('Codex repro #7f: classifyRowcapSites() BLOCKs a resolvable table whose rowCount() lookup failed (size === null), same as a truncating table', () => {
    const sites = [
      { table: 'flaky_table', file: 'a.js', line: 5, safe: false, why: 'unpaginated' },
    ];
    const result = classifyRowcapSites(sites, { flaky_table: null });
    expect(result.truncating).toHaveLength(1);
    expect(result.unresolved).toHaveLength(0);
    expect(result.blockedCount).toBe(1);
  });

  it('confirms classifyRowcapSites() still correctly separates a genuinely small table (fine) from a large one (truncating) and a safe site (neither)', () => {
    const sites = [
      { table: 'small_table', file: 'a.js', line: 1, safe: false, why: 'unpaginated' },
      { table: 'huge_table', file: 'a.js', line: 2, safe: false, why: 'unpaginated' },
      { table: 'small_table', file: 'a.js', line: 3, safe: true, why: 'bounded' },
    ];
    const result = classifyRowcapSites(sites, { small_table: 50, huge_table: 50000 });
    expect(result.fine).toHaveLength(1);
    expect(result.fine[0].line).toBe(1);
    expect(result.truncating).toHaveLength(1);
    expect(result.truncating[0].table).toBe('huge_table');
    expect(result.safeCount).toBe(1);
    expect(result.blockedCount).toBe(1);
  });
});
describe('portfolio-preflight round 8 (Codex P2 fixes)', () => {
  it('Codex repro #8a: a computed relation-scope key ({ [key]: \'referencedTable\' -- i.e. the VALUE, or literally { [key]: \'comments\' } with key holding the string "referencedTable") fails closed rather than being read as an unrelated key', () => {
    const src = `
      const key = 'referencedTable';
      async function f(sb) { return sb.from('vault_notes').select('*, comments(*)').limit(5, { [key]: 'comments' }); }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('Codex repro #8a analog on .range(): a computed, non-literal relation-scope key fails closed', () => {
    const src = `
      const key = 'referencedTable';
      async function f(sb) { return sb.from('vault_notes').select('*, comments(*)').range(0, 9, { [key]: 'comments' }); }
    `;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('confirms a computed key that IS itself a literal string ({ [\'referencedTable\']: \'comments\' }) is still resolved and correctly recognized as relation-scoped', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('*, comments(*)').limit(5, { ['referencedTable']: 'comments' }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('confirms an ordinary, fully-literal, non-computed .limit(500) with no relation-scoping option at all is unaffected by the computed-key fix', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('p').limit(500); }`;
    expect(scanCallSites(src, 'fixture.js')[0].safe).toBe(true);
  });

  it('Codex repro #8b: a duplicate object-literal key ({ head: true, head: false }) is NOT trusted as count-only -- the second, real runtime value is false', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('p', { head: true, head: false }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('Codex repro #8b analog: { head: true, ...runtimeOptions } is NOT trusted as count-only -- the trailing spread could silently override head', () => {
    const src = `async function f(sb, runtimeOptions){ return sb.from('vault_notes').select('p', { head: true, ...runtimeOptions }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(false);
  });

  it('confirms { ...runtimeOptions, head: true } (spread FIRST, literal head SECOND) IS correctly trusted as count-only -- the literal genuinely overrides the spread, not the other way around', () => {
    const src = `async function f(sb, runtimeOptions){ return sb.from('vault_notes').select('p', { ...runtimeOptions, head: true }); }`;
    const sites = scanCallSites(src, 'fixture.js');
    expect(sites).toHaveLength(1);
    expect(sites[0].safe).toBe(true);
  });

  it('confirms an ordinary { count: \'exact\', head: true } (no duplicates, no spread) is still correctly recognized as count-only -- the last-write-wins rewrite does not regress the plain case', () => {
    const src = `async function f(sb){ return sb.from('vault_notes').select('p', { count: 'exact', head: true }); }`;
    expect(scanCallSites(src, 'fixture.js')[0].safe).toBe(true);
  });

  it('Codex repro #8c: a genuinely missing source file (a real ENOENT error) is classified as skip-worthy, not a scan failure', () => {
    const enoent = Object.assign(new Error("ENOENT: no such file or directory, open 'x.js'"), { code: 'ENOENT' });
    expect(shouldSkipScanError(enoent)).toBe(true);
  });

  it('confirms a permission error reading a file that DOES exist is NOT classified as skip-worthy -- it must fail closed with a sentinel instead', () => {
    const eacces = Object.assign(new Error("EACCES: permission denied, open 'x.js'"), { code: 'EACCES' });
    expect(shouldSkipScanError(eacces)).toBe(false);
  });

  it('confirms an unexpected exception thrown by scanCallSites() itself (no .code at all, e.g. a genuine scanner bug) is NOT classified as skip-worthy', () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'type')");
    expect(shouldSkipScanError(bug)).toBe(false);
  });

  it('confirms a falsy/undefined error value is NOT classified as skip-worthy (defensive default -- never silently skip on a malformed error)', () => {
    expect(shouldSkipScanError(undefined)).toBe(false);
    expect(shouldSkipScanError(null)).toBe(false);
  });
});


describe('portfolio-preflight v3->v4 query-dialect round (Codex Finding 1 -- gate must not ignore ERROR)', () => {
  it('is safe only when both BLOCK and ERROR counts are zero', () => {
    expect(isSafeToRunPaidSynthesis(0, 0)).toBe(true);
  });
  it('is NOT safe when there is a BLOCK, even with zero errors', () => {
    expect(isSafeToRunPaidSynthesis(1, 0)).toBe(false);
  });
  it('is NOT safe when a check threw (ERROR), even with zero BLOCKs -- the actual bug Codex found', () => {
    expect(isSafeToRunPaidSynthesis(0, 1)).toBe(false);
  });
  it('is NOT safe when there is both a BLOCK and an ERROR', () => {
    expect(isSafeToRunPaidSynthesis(2, 3)).toBe(false);
  });
});

describe('portfolio-preflight v4 review (Codex Finding 1 continued -- human report + exit code must agree with the JSON verdict)', () => {
  // Codex's v4 review noted the prior 4 tests only exercised the pure
  // isSafeToRunPaidSynthesis() boolean, so they never caught that the CLI's
  // human-readable report and exit code kept their own, un-fixed copy of the
  // same condition. buildDisposition() is now the one function main() calls
  // for the JSON field, the printed headline, and (via its `safe` field) the
  // exit-code decision -- these tests assert on its actual output, including
  // the exact bug scenario (0 blocks, 1+ errors) that previously slipped
  // through as "SAFE" in the text report while JSON correctly said false.
  it('reports safe with the SAFE headline when there are zero blocks and zero errors', () => {
    const { safe, headline } = buildDisposition([], []);
    expect(safe).toBe(true);
    expect(headline).toMatch(/^SAFE TO RUN PAID SYNTHESIS/);
  });

  it('reports unsafe with the DO NOT RUN headline when there is a BLOCK, even with zero errors', () => {
    const { safe, headline } = buildDisposition([{ stage: 'x', lane: 'y' }], []);
    expect(safe).toBe(false);
    expect(headline).toBe('DO NOT RUN PAID SYNTHESIS.');
  });

  it('reports unsafe with the DO NOT RUN headline when there is an ERROR and zero BLOCKs -- the exact case the v4 review caught the human report getting wrong', () => {
    const { safe, headline } = buildDisposition([], [{ stage: 'x', lane: 'y', detail: 'threw' }]);
    expect(safe).toBe(false);
    expect(headline).toBe('DO NOT RUN PAID SYNTHESIS.');
  });

  it('reports unsafe when there is both a BLOCK and an ERROR', () => {
    const { safe, headline } = buildDisposition([{ stage: 'a', lane: 'b' }], [{ stage: 'c', lane: 'd', detail: 'e' }]);
    expect(safe).toBe(false);
    expect(headline).toBe('DO NOT RUN PAID SYNTHESIS.');
  });
});
