// In-memory run registry. Phase 2 stub: gives /ingest/run a real run_id and
// /ingest/status/:id real state, without yet doing the actual ingest work.
// Phase 3 will swap the worker stub for the real transcribe→extract pipeline.

import crypto from 'node:crypto';

/** @typedef {'queued'|'running'|'done'|'error'} RunStatus */

/**
 * @typedef {object} Run
 * @property {string} id
 * @property {RunStatus} status
 * @property {string} started_at        ISO timestamp
 * @property {string|null} finished_at  ISO timestamp or null
 * @property {string|null} error
 * @property {object} stats             worker-supplied counters
 */

/** @type {Map<string, Run>} */
const runs = new Map();

let lastRunAt = null;
let lastRunStatus = null;

export function getLastRunSummary() {
  return { last_run_at: lastRunAt, last_run_status: lastRunStatus };
}

export function getQueueDepth() {
  let n = 0;
  for (const r of runs.values()) {
    if (r.status === 'queued' || r.status === 'running') n += 1;
  }
  return n;
}

export function getRun(id) {
  return runs.get(id) ?? null;
}

/**
 * Enqueue a run and return its id immediately. The worker is a stub by
 * default; pass a real worker (e.g. buildPhase4Worker) from the route.
 *
 * @param {object} opts
 * @param {(run: Run, input: object) => Promise<void>} [opts.worker]
 * @param {object} [opts.input]   passed through to the worker
 * @returns {string} run_id
 */
export function startRun({ worker, input } = {}) {
  const id = crypto.randomUUID();
  const run = {
    id,
    status: 'queued',
    started_at: new Date().toISOString(),
    finished_at: null,
    error: null,
    stats: {},
  };
  runs.set(id, run);

  const fn = worker ?? defaultStubWorker;
  // Fire-and-forget; the endpoint returns 202 immediately.
  Promise.resolve()
    .then(() => {
      run.status = 'running';
      return fn(run, input ?? {});
    })
    .then(() => {
      run.status = 'done';
      run.finished_at = new Date().toISOString();
      lastRunAt = run.finished_at;
      lastRunStatus = 'done';
    })
    .catch((err) => {
      run.status = 'error';
      run.error = err?.message ?? String(err);
      run.finished_at = new Date().toISOString();
      lastRunAt = run.finished_at;
      lastRunStatus = 'error';
    });

  return id;
}

// Phase 2 worker stub. Real pipeline lands in Phase 3 (transcribe.py) and
// Phase 4 (extract.py), wired in via Node child_process.
async function defaultStubWorker(run) {
  run.stats.note = 'phase-2 stub: no work performed';
}
