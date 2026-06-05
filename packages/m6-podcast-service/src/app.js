import Fastify from 'fastify';
import { config } from './config.js';
import { hmacGuard } from './hmac.js';
import {
  startRun,
  getRun,
  getLastRunSummary,
  getQueueDepth,
} from './runRegistry.js';
import { buildPipelineWorker, parsePipelineInput } from './pipelineWorker.js';
import { registerDigestRoutes } from './digest.js';
import { registerShareRoutes } from './share.js';

/**
 * Build a configured Fastify instance. Exposed as a function so tests can
 * spin up an isolated app per test.
 *
 * @param {object} [opts]
 * @param {string}   [opts.hmacSecret]     override HMAC secret (for tests)
 * @param {object}   [opts.logger]         Fastify logger config
 * @param {Function} [opts.worker]         inject a fake pipeline worker (for tests)
 * @param {object}   [opts.cfg]            config override (e.g. { digestDir: tmpdir })
 * @param {object}   [opts.supabase]       service-role Supabase client (Phase 8 share guard)
 * @param {Function} [opts.onRunComplete]  Phase 7a incremental re-render hook (fail-soft)
 */
export function buildServer(opts = {}) {
  const hmacSecret    = opts.hmacSecret ?? config.hmacSecret;
  const worker        = opts.worker ?? buildPipelineWorker();
  const onRunComplete = opts.onRunComplete;
  const cfg           = opts.cfg ?? config;
  const supabase      = opts.supabase ?? null;

  const app = Fastify({
    logger: opts.logger ?? { level: config.nodeEnv === 'test' ? 'silent' : 'info' },
    bodyLimit: 1 * 1024 * 1024,
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

  // Public health check
  app.get('/health', async () => {
    const last = getLastRunSummary();
    return {
      ok: true,
      service: 'nfl-podcast',
      version: '0.1.0',
      last_run_at:     last.last_run_at,
      last_run_status: last.last_run_status,
      queue_depth:     getQueueDepth(),
    };
  });

  // HMAC-gated ingest routes
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
    const runId = startRun({ worker, input, onRunComplete });
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

  // Phase 7 -- Tailscale-only digest routes (no app auth; network is the gate).
  // /digest/* must NOT be added to tailscale funnel.
  registerDigestRoutes(app, { cfg });

  // Phase 8 -- Public Funnel share routes (token-gated, audited).
  // Only /share/* should appear in tailscale funnel.
  registerShareRoutes(app, { cfg, supabase });

  // Phase 3 stub -- transcript stream (Tailscale-only, future).
  app.get('/api/transcript/:id', async (_req, reply) =>
    reply.code(501).send({ error: 'not_implemented', phase: 3 }),
  );

  return app;
}
