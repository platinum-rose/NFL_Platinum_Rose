import Fastify from 'fastify';
import { config } from './config.js';
import { hmacGuard } from './hmac.js';
import {
  startRun,
  getRun,
  getLastRunSummary,
  getQueueDepth,
} from './runRegistry.js';
import { buildPhase4Worker, parsePipelineInput } from './pipelineWorker.js';

/**
 * Build a configured Fastify instance. Exposed as a function so tests can
 * spin up an isolated app per test.
 *
 * @param {object} [opts]
 * @param {string} [opts.hmacSecret]  override secret (for tests)
 * @param {object} [opts.logger]      Fastify logger config
 */
export function buildServer(opts = {}) {
  const hmacSecret = opts.hmacSecret ?? config.hmacSecret;
  // Worker can be injected by tests to skip spawning Python.
  const worker = opts.worker ?? buildPhase4Worker();
  const app = Fastify({
    logger: opts.logger ?? { level: config.nodeEnv === 'test' ? 'silent' : 'info' },
    bodyLimit: 1 * 1024 * 1024, // 1 MB; ingest payloads are tiny
  });

  // Capture raw body so HMAC can verify the original bytes the cron signed.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      req.rawBody = body;
      if (body === '' || body == null) {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(body));
      } catch (err) {
        err.statusCode = 400;
        done(err, undefined);
      }
    },
  );

  // ── Public ────────────────────────────────────────────────────────────────
  app.get('/health', async () => {
    const last = getLastRunSummary();
    return {
      ok: true,
      service: 'nfl-podcast',
      version: '0.1.0',
      last_run_at: last.last_run_at,
      last_run_status: last.last_run_status,
      queue_depth: getQueueDepth(),
    };
  });

  // ── Ingest (HMAC-gated) ───────────────────────────────────────────────────
  const hmac = { preHandler: hmacGuard({ secret: hmacSecret }) };

  app.post('/ingest/run', hmac, async (request, reply) => {
    let input;
    try {
      input = parsePipelineInput(request.body);
    } catch (err) {
      return reply
        .code(err.statusCode ?? 400)
        .send({ error: 'bad_request', message: err.message });
    }
    const runId = startRun({ worker, input });
    reply.code(202);
    return { run_id: runId, status: 'queued' };
  });

  app.get('/ingest/status/:run_id', hmac, async (request, reply) => {
    const run = getRun(request.params.run_id);
    if (!run) {
      return reply.code(404).send({ error: 'run_not_found' });
    }
    return run;
  });

  // ── Digest (Tailscale-only — Phase 7) ─────────────────────────────────────
  // Stubs return 501 until the renderer lands. The systemd unit binds to
  // 127.0.0.1, so external exposure is gated by Tailscale serve/funnel.
  for (const path of [
    '/digest/episodes/:id.html',
    '/digest/experts/:slug.html',
    '/digest/experts/:slug/:weekTag.html',
    '/digest/weekly/:weekTag.html',
  ]) {
    app.get(path, async (_req, reply) =>
      reply.code(501).send({ error: 'not_implemented', phase: 7 }),
    );
  }

  // ── Share (Funnel + signed token — Phase 8) ───────────────────────────────
  app.get('/share/*', async (_req, reply) =>
    reply.code(501).send({ error: 'not_implemented', phase: 8 }),
  );

  // ── Transcript stream (Tailscale-only — Phase 3) ──────────────────────────
  app.get('/api/transcript/:id', async (_req, reply) =>
    reply.code(501).send({ error: 'not_implemented', phase: 3 }),
  );

  return app;
}
