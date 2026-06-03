// Pipeline worker — invokes the Phase 4 Python extractor and stores the
// summary on the run object. Designed to be injected into runRegistry's
// `startRun({ worker })` so tests can swap it for a fake.
//
// Phase 4 only: the worker requires a transcript_path. Transcription
// (Phase 3) is wired separately so we can stage the deploy.

import { config } from './config.js';
import { runPython } from './pythonRunner.js';

/**
 * @typedef {object} PipelineInput
 * @property {string} transcript_path   absolute path to the transcript .txt
 * @property {string|number} episode_id Supabase episode id (string or numeric)
 * @property {string} [model]           override OLLAMA_MODEL
 * @property {string} [ollama_url]      override OLLAMA_BASE_URL
 */

/**
 * Validate an /ingest/run body. Throws Error with .statusCode=400 on bad
 * input so the route handler can convert to a 400 response.
 *
 * @param {unknown} body
 * @returns {PipelineInput}
 */
export function parsePipelineInput(body) {
  if (!body || typeof body !== 'object') {
    const err = new Error('body must be a JSON object');
    err.statusCode = 400;
    throw err;
  }
  const { transcript_path, episode_id, model, ollama_url } = body;
  if (typeof transcript_path !== 'string' || transcript_path.length === 0) {
    const err = new Error('transcript_path is required (string)');
    err.statusCode = 400;
    throw err;
  }
  if (
    episode_id === undefined ||
    episode_id === null ||
    (typeof episode_id !== 'string' && typeof episode_id !== 'number')
  ) {
    const err = new Error('episode_id is required (string or number)');
    err.statusCode = 400;
    throw err;
  }
  return { transcript_path, episode_id, model, ollama_url };
}

/**
 * Build the Phase 4 worker. Returns a function compatible with
 * runRegistry.startRun's `worker` argument.
 *
 * @param {object} [deps]
 * @param {(opts: object) => Promise<{json: object}>} [deps.runner]
 *   override the python runner (used by tests)
 * @param {object} [deps.cfg]   override config (used by tests)
 */
export function buildPhase4Worker(deps = {}) {
  const runner = deps.runner ?? runPython;
  const cfg = deps.cfg ?? config;

  /**
   * @param {object} run     the run object (mutated in place)
   * @param {PipelineInput} input
   */
  return async function phase4Worker(run, input) {
    const args = [
      '-m', 'nfl_podcast.extract',
      '--transcript', input.transcript_path,
      '--episode-id', String(input.episode_id),
      '--ollama-url', input.ollama_url ?? cfg.ollamaBaseUrl,
      '--model', input.model ?? cfg.ollamaModel,
    ];
    const result = await runner({
      executable: cfg.pythonExecutable,
      cwd: cfg.pythonCwd,
      args,
      env: {
        OLLAMA_BASE_URL: input.ollama_url ?? cfg.ollamaBaseUrl,
        OLLAMA_MODEL: input.model ?? cfg.ollamaModel,
      },
    });
    const json = result.json ?? {};
    run.stats = {
      phase: 4,
      episode_id: input.episode_id,
      model: json.model,
      chunks: json.chunks,
      pick_count: Array.isArray(json.picks) ? json.picks.length : 0,
      dropped_count: Array.isArray(json.dropped) ? json.dropped.length : 0,
      extraction_quality_score: json.extraction_quality_score,
      fail_ratio: json.fail_ratio,
      needs_cloud_fallback: json.needs_cloud_fallback === true,
      duration_ms: result.duration_ms,
    };
    // Keep the full payload available on the run (handy for debug GETs).
    run.result = json;
  };
}
