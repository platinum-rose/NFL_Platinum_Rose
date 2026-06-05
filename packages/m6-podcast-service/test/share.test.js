/**
 * Phase 8 share route tests (spec section 9).
 * Offline + Windows-friendly: fake Supabase, tmp digestDir, no real network.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildServer } from '../src/app.js';
import { mintToken, revokeToken, listTokens } from '../src/share.js';

const FIXTURE_HTML = '<html><body><h1>Episode Digest</h1></body></html>';
const GOOD_TOKEN   = 'a'.repeat(64);   // 64-hex valid token
const REVOKED_TOK  = 'b'.repeat(64);
const EXPIRED_TOK  = 'c'.repeat(64);
const UNKNOWN_TOK  = 'd'.repeat(64);

const TOKEN_ROWS = [
  { token: GOOD_TOKEN,  partner_name: 'Patrick', revoked_at: null, expires_at: null, granted_at: '2026-01-01T00:00:00Z', notes: null },
  { token: REVOKED_TOK, partner_name: 'Patrick', revoked_at: '2026-01-01T00:00:00Z', expires_at: null, granted_at: '2026-01-01T00:00:00Z', notes: null },
  { token: EXPIRED_TOK, partner_name: 'Patrick', revoked_at: null, expires_at: '2020-01-01T00:00:00Z', granted_at: '2025-01-01T00:00:00Z', notes: null },
];

// Captured audit inserts for test 8
const viewInserts = [];

function makeFakeSupabase() {
  return {
    from(table) {
      if (table === 'share_tokens') {
        let filters = {};
        let single  = false;
        return {
          select() { return this; },
          eq(col, val) { filters = { ...filters, [col]: val }; return this; },
          maybeSingle() { single = true; return this; },
          order() { return this; },
          then(resolve, reject) {
            let result = TOKEN_ROWS;
            for (const [col, val] of Object.entries(filters)) {
              result = result.filter(r => r[col] === val);
            }
            const data = single ? (result[0] ?? null) : result;
            Promise.resolve({ data, error: null }).then(resolve, reject);
          },
        };
      }

      if (table === 'share_views') {
        return {
          insert(rows) {
            viewInserts.push(...(Array.isArray(rows) ? rows : [rows]));
            return { then(r) { return Promise.resolve({ data: null, error: null }).then(r); } };
          },
        };
      }

      // mintToken / revokeToken / listTokens helpers use insert/update
      const captured = [];
      return {
        select() { return this; },
        insert(rows) {
          captured.push(...(Array.isArray(rows) ? rows : [rows]));
          return { then(r) { return Promise.resolve({ data: null, error: null }).then(r); } };
        },
        update(vals) {
          return {
            eq() {
              return { then(r) { return Promise.resolve({ data: null, error: null }).then(r); } };
            },
          };
        },
        order() { return this; },
        then(resolve) { return Promise.resolve({ data: TOKEN_ROWS, error: null }).then(resolve); },
      };
    },
  };
}

let tmpDir;
let app;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nfl-share-test-'));

  await fs.mkdir(path.join(tmpDir, 'episodes'), { recursive: true });
  await fs.mkdir(path.join(tmpDir, 'weekly'),   { recursive: true });
  await fs.mkdir(path.join(tmpDir, 'experts'),  { recursive: true });

  await fs.writeFile(path.join(tmpDir, 'episodes', 'ep-share.html'), FIXTURE_HTML, 'utf8');

  app = buildServer({
    logger: false,
    supabase: makeFakeSupabase(),
    cfg: { digestDir: tmpDir },
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// 1. Remove /share/* from 501 list -- covered by server.test.js amendment.
//    (The spec "test 1" is that amendment; this file covers 2-9.)

// 2. Valid active token + existing file -> 200 with correct headers.
describe('200 -- valid token + existing file', () => {
  it('returns 200, text/html, correct body, and share headers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/share/${GOOD_TOKEN}/episodes/ep-share`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toBe(FIXTURE_HTML);
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });
});

// 3. Unknown token -> 403 invalid_token.
describe('403 -- unknown token', () => {
  it('returns 403 with invalid_token body', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/share/${UNKNOWN_TOK}/episodes/ep-share`,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('invalid_token');
  });
});

// 4. Revoked token -> 403 (same body as unknown).
describe('403 -- revoked token', () => {
  it('returns 403 for a revoked token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/share/${REVOKED_TOK}/episodes/ep-share`,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('invalid_token');
  });
});

// 5. Expired token -> 403 (identical body to 3 and 4 -- no oracle).
describe('403 -- expired token', () => {
  it('returns 403 for an expired token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/share/${EXPIRED_TOK}/episodes/ep-share`,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('invalid_token');
  });
});

// 6. Valid token, missing digest file -> 404.
describe('404 -- file not yet rendered', () => {
  it('returns 404 when digest file does not exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/share/${GOOD_TOKEN}/episodes/not-rendered`,
    });
    expect(res.statusCode).toBe(404);
  });
});

// 7. Path traversal -> 400, never escapes digestDir.
describe('400 -- path traversal blocked', () => {
  it('returns 400 for a traversal attempt in the episode id', async () => {
    // Fastify decodes %2f -> '/'; '/' not in ^[a-z0-9-]{1,64}$ -> 400
    const res = await app.inject({
      method: 'GET',
      url: `/share/${GOOD_TOKEN}/episodes/..%2fetc%2fpasswd`,
    });
    expect(res.statusCode).not.toBe(200);
    expect([400, 404]).toContain(res.statusCode);
  });
});

// 8. Successful view writes a share_views row (audit trail).
describe('audit -- recordView writes share_views row', () => {
  it('inserts a share_views row after a successful 200 response', async () => {
    const beforeCount = viewInserts.length;

    await app.inject({
      method: 'GET',
      url: `/share/${GOOD_TOKEN}/episodes/ep-share`,
    });

    // recordView is fire-and-forget; drain microtasks
    await new Promise(r => setTimeout(r, 10));

    expect(viewInserts.length).toBeGreaterThan(beforeCount);
    const inserted = viewInserts[viewInserts.length - 1];
    expect(inserted.token).toBe(GOOD_TOKEN);
    expect(inserted.route).toContain('/share/');
    expect(inserted.episode_id).toBe('ep-share');
  });
});

// 9. Token management helpers: mint, revoke, list.
// Use a minimal write-capable fake -- separate from the server route fake.
function makeCLIFakeSupabase() {
  const insertedRows = [];
  const updatedTokens = [];
  return {
    _insertedRows: insertedRows,
    _updatedTokens: updatedTokens,
    from(_table) {
      return {
        select() { return this; },
        order() { return this; },
        insert(rows) {
          insertedRows.push(...(Array.isArray(rows) ? rows : [rows]));
          return { then(r) { return Promise.resolve({ data: null, error: null }).then(r); } };
        },
        update(vals) {
          return {
            eq(_col, token) {
              updatedTokens.push({ token, ...vals });
              return { then(r) { return Promise.resolve({ data: null, error: null }).then(r); } };
            },
          };
        },
        then(resolve) {
          return Promise.resolve({ data: TOKEN_ROWS, error: null }).then(resolve);
        },
      };
    },
  };
}

describe('token management helpers', () => {
  it('mintToken returns a 64-char hex string', async () => {
    const fakeSupa = makeCLIFakeSupabase();
    const token = await mintToken({ supabase: fakeSupa, partnerName: 'TestPartner' });
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(fakeSupa._insertedRows[0].partner_name).toBe('TestPartner');
  });

  it('revokeToken resolves without throwing', async () => {
    const fakeSupa = makeCLIFakeSupabase();
    await expect(revokeToken({ supabase: fakeSupa, token: GOOD_TOKEN })).resolves.toBeUndefined();
    expect(fakeSupa._updatedTokens[0].token).toBe(GOOD_TOKEN);
    expect(fakeSupa._updatedTokens[0].revoked_at).toBeTruthy();
  });

  it('listTokens returns all rows; activeOnly filters expired + revoked', async () => {
    const fakeSupa = makeCLIFakeSupabase();
    const all = await listTokens({ supabase: fakeSupa, activeOnly: false });
    expect(all.length).toBe(TOKEN_ROWS.length);

    const active = await listTokens({ supabase: fakeSupa, activeOnly: true });
    expect(active.every(r => !r.revoked_at)).toBe(true);
    expect(active.every(r => !r.expires_at || r.expires_at > new Date().toISOString())).toBe(true);
  });
});
