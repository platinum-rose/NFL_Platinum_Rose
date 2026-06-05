// Phase 2 acceptance tests (spec §3 Phase 2):
//   - GET  /health returns valid JSON
//   - POST /ingest/run with valid HMAC starts a run and returns run_id
//   - Invalid HMAC returns 401
//   - GET  /ingest/status/:id reflects run state
//
// systemd restart-on-failure is verified manually on M6 (kill -9 test).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/app.js';
import { signPayload } from '../src/hmac.js';

const SECRET = 'test-secret-abc-123';
let app;

// Stub worker — never spawns Python. Records the input it received.
const workerCalls = [];
async function fakeWorker(run, input) {
  workerCalls.push(input);
  run.stats = {
    phase: 4,
    episode_id: input.episode_id,
    pick_count: 2,
    extraction_quality_score: 0.82,
    needs_cloud_fallback: false,
  };
}

beforeAll(async () => {
  app = buildServer({ hmacSecret: SECRET, logger: false, worker: fakeWorker });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns ok JSON', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('nfl-podcast');
    expect(typeof body.queue_depth).toBe('number');
  });
});

describe('POST /ingest/run', () => {
  it('rejects with no signature', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: {},
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'missing_signature' });
  });

  it('rejects with bad signature', async () => {
    const body = JSON.stringify({});
    const res = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': 'sha256=deadbeef',
      },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'bad_signature' });
  });

  it('accepts a valid signature and returns 202 + run_id', async () => {
    const body = JSON.stringify({
      transcript_path: '/var/lib/nfl/transcripts/ep-1.txt',
      episode_id: 'ep-1',
    });
    const sig = signPayload(SECRET, body);
    const res = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': sig,
      },
    });
    expect(res.statusCode).toBe(202);
    const json = res.json();
    expect(json.run_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(json.status).toBe('queued');
  });

  it('rejects body missing transcript_path with 400', async () => {
    const body = JSON.stringify({ episode_id: 'ep-1' });
    const sig = signPayload(SECRET, body);
    const res = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': sig,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('bad_request');
  });

  it('rejects body missing episode_id with 400', async () => {
    const body = JSON.stringify({ transcript_path: '/x.txt' });
    const sig = signPayload(SECRET, body);
    const res = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': sig,
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /ingest/status/:run_id', () => {
  it('returns 404 for unknown id (with valid HMAC)', async () => {
    const sig = signPayload(SECRET, '');
    const res = await app.inject({
      method: 'GET',
      url: '/ingest/status/00000000-0000-0000-0000-000000000000',
      headers: { 'x-nfl-signature': sig },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns the run after starting one', async () => {
    const body = JSON.stringify({
      transcript_path: '/var/lib/nfl/transcripts/ep-2.txt',
      episode_id: 'ep-2',
    });
    const startRes = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': signPayload(SECRET, body),
      },
    });
    const { run_id } = startRes.json();

    const sig = signPayload(SECRET, '');
    const res = await app.inject({
      method: 'GET',
      url: `/ingest/status/${run_id}`,
      headers: { 'x-nfl-signature': sig },
    });
    expect(res.statusCode).toBe(200);
    const run = res.json();
    expect(run.id).toBe(run_id);
    expect(['queued', 'running', 'done']).toContain(run.status);
  });

  it('worker receives the parsed input and stats land on the run', async () => {
    const body = JSON.stringify({
      transcript_path: '/var/lib/nfl/transcripts/ep-3.txt',
      episode_id: 'ep-3',
      model: 'qwen2.5:3b',
    });
    const startRes = await app.inject({
      method: 'POST',
      url: '/ingest/run',
      payload: body,
      headers: {
        'content-type': 'application/json',
        'x-nfl-signature': signPayload(SECRET, body),
      },
    });
    const { run_id } = startRes.json();

    // Worker fires on next tick; await microtask drain.
    await new Promise((r) => setTimeout(r, 0));

    const sig = signPayload(SECRET, '');
    const res = await app.inject({
      method: 'GET',
      url: `/ingest/status/${run_id}`,
      headers: { 'x-nfl-signature': sig },
    });
    const run = res.json();
    expect(run.status).toBe('done');
    expect(run.stats.phase).toBe(4);
    expect(run.stats.episode_id).toBe('ep-3');
    expect(run.stats.pick_count).toBe(2);

    const lastCall = workerCalls[workerCalls.length - 1];
    expect(lastCall.transcript_path).toBe('/var/lib/nfl/transcripts/ep-3.txt');
    expect(lastCall.model).toBe('qwen2.5:3b');
  });
});

describe('Phase 3 stub returns 501', () => {
  // /digest/* routes serve real files (Phase 7).
  // /share/* routes now handle real token-gated requests (Phase 8).
  it.each([
    '/api/transcript/abc',
  ])('%s -> 501', async (url) => {
    const res = await app.inject({ method: 'GET', url });
    expect(res.statusCode).toBe(501);
  });
});
