// Loads .env from the package root. Server modules import this first.
import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(
      `Missing required env var: ${name}. ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 5060),

  // HMAC secret is required in production; in test/dev a placeholder is fine.
  hmacSecret:
    process.env.NODE_ENV === 'production'
      ? required('NFL_PODCAST_HMAC_SECRET')
      : (process.env.NFL_PODCAST_HMAC_SECRET ?? 'dev-secret-do-not-use'),

  // Supabase + cloud creds are loaded lazily by the modules that need them
  // so the server can boot for /health checks even if they're missing.
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',

  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen3:8b',

  audioDir: process.env.NFL_AUDIO_DIR ?? '/var/lib/nfl/audio',
  transcriptDir: process.env.NFL_TRANSCRIPT_DIR ?? '/var/lib/nfl/transcripts',
  digestDir: process.env.NFL_DIGEST_DIR ?? '/var/lib/nfl/digest',

  // Phase 4 wiring: where the Python extractor venv lives on M6.
  pythonExecutable:
    process.env.NFL_PYTHON_EXECUTABLE ??
    '/home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python/.venv/bin/python',
  pythonCwd:
    process.env.NFL_PYTHON_CWD ??
    '/home/andrewlrose/projects/NFL_Dashboard/packages/m6-podcast-service/python',
};
