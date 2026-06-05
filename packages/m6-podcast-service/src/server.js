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

if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

    // Phase 7a: re-render digest pages after each successful pipeline run.
    const renderer = buildRenderer({ supabase });
    onRunComplete = (_run, input) => {
      if (input?.episode_id) return renderer.renderForEpisode(input.episode_id);
    };
  } catch (err) {
    console.warn('[server] Phase 7a/8 init failed -- running without Supabase:', err?.message);
  }
}

const app = buildServer({ onRunComplete, supabase });

const closeOnSignal = async (signal) => {
  app.log.info({ signal }, 'shutting down');
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
