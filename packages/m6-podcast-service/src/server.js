// Entry point for `node src/server.js` and the systemd unit.
import { buildServer } from './app.js';
import { config } from './config.js';
import { buildRenderer } from '../render/index.js';

// Build service-role Supabase client when creds are present.
// Shared by Phase 7a renderer (incremental re-render hook) and
// Phase 8 shareGuard (token validation + audit).
// Skipped on dev/Windows when creds are absent -- service still boots for /health.
let onRunComplete;
let supabase;
let renderAllTimer;

if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

    const renderer = buildRenderer({ supabase });

    // Phase 7a: re-render digest pages after each successful pipeline run.
    onRunComplete = (_run, input) => {
      if (input?.episode_id) return renderer.renderForEpisode(input.episode_id);
    };

    // OPS-2: periodic full re-render sweep. onRunComplete above only fires for
    // this service's own ingest runs -- picks graded later by nfl-auto-grade.js
    // (a separate GHA process) can leave already-rendered pages stale. This is
    // the "systemd timer / post-run hook" TASK_BOARD flagged as still missing;
    // implemented in-process here instead of a separate systemd unit so it
    // ships with the service itself and needs no extra M6 deploy step beyond
    // the usual git pull + restart.
    if (config.digestRenderAllIntervalMs > 0) {
      renderAllTimer = setInterval(() => {
        renderer.renderAll()
          .then((result) => {
            console.log(
              `[server] periodic renderAll: written ${result.written} files ` +
                `(${result.episodes} episodes, ${result.experts} experts, ${result.weeks} weeks) ` +
                `in ${result.ms}ms`,
            );
          })
          .catch((err) => {
            console.error('[server] periodic renderAll failed:', err?.message ?? err);
          });
      }, config.digestRenderAllIntervalMs);
      renderAllTimer.unref(); // never keep the process alive on its own
    }
  } catch (err) {
    console.warn('[server] Phase 7a/8 init failed -- running without Supabase:', err?.message);
  }
}

const app = buildServer({ onRunComplete, supabase });

const closeOnSignal = async (signal) => {
  app.log.info({ signal }, 'shutting down');
  if (renderAllTimer) clearInterval(renderAllTimer);
  try {
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error(err, 'error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => closeOnSignal('SIGTERM'));
process.on('SIGINT',  () => closeOnSignal('SIGINT'));

app.listen({ host: config.host, port: config.port }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
