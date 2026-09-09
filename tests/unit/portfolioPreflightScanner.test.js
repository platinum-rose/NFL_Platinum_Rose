import { describe, expect, it } from 'vitest';
import { scanCallSites } from '../../agents/portfolio-preflight.js';

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
// safe/keyset-paginated. Fixed by proving real lexical nesting instead
// (isLexicallyInsideCall() in portfolio-preflight.js): mask out comments
// and strings, then walk paren balance to confirm the target call is still
// open (not yet closed) at the point of the `.from()` match. See that
// function's own comment for the full mechanism. This file's last two
// tests are the exact repro cases Codex gave, now asserted as rejected.
describe('portfolio-preflight scanCallSites() -- keyset pagination recognition (round 9-10, Codex P2)', () => {
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
});
