// Thin wrapper around `child_process.spawn` for invoking the Python pipeline
// (Phase 3 transcribe / Phase 4 extract) from Node.
//
// The Python subprocess is expected to:
//   - exit 0 on success
//   - print a single JSON object on stdout (the result envelope)
//   - send diagnostics to stderr
//
// We do NOT shell-out — args go through spawn's argv array so transcript paths
// and episode IDs cannot inject shell metacharacters.

import { spawn } from 'node:child_process';

/**
 * @typedef {object} PythonRunResult
 * @property {object} json          parsed JSON envelope from stdout
 * @property {string} stdout        full stdout (for debug)
 * @property {string} stderr        full stderr (for debug)
 * @property {number} duration_ms
 */

/**
 * @typedef {object} PythonRunOptions
 * @property {string} executable    absolute path to the python interpreter
 * @property {string} cwd           working dir (the package's python/ folder)
 * @property {string[]} args        argv after the executable, e.g. ['-m', 'nfl_podcast.extract', '--transcript', '/path']
 * @property {object} [env]         extra env vars to merge over process.env
 * @property {number} [timeoutMs]   default 10 min
 */

/**
 * Run a Python module and parse a JSON envelope from stdout.
 * Throws on non-zero exit, JSON parse failure, or timeout.
 *
 * @param {PythonRunOptions} opts
 * @returns {Promise<PythonRunResult>}
 */
export function runPython(opts) {
  const { executable, cwd, args, env: extraEnv, timeoutMs = 10 * 60_000 } = opts;
  if (!executable) throw new Error('runPython: executable is required');
  if (!cwd) throw new Error('runPython: cwd is required');
  if (!Array.isArray(args)) throw new Error('runPython: args must be an array');

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const child = spawn(executable, args, {
      cwd,
      env: { ...process.env, ...(extraEnv ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      // Hard kill after 5s grace.
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
    }, timeoutMs);
    timer.unref();

    child.stdout.on('data', (buf) => {
      stdout += buf.toString('utf8');
    });
    child.stderr.on('data', (buf) => {
      stderr += buf.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const duration_ms = Date.now() - start;
      if (timedOut) {
        reject(
          new Error(
            `runPython: timed out after ${timeoutMs}ms (stderr tail: ${stderr.slice(-500)})`,
          ),
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `runPython: exit ${code} (stderr tail: ${stderr.slice(-500)})`,
          ),
        );
        return;
      }
      let json;
      try {
        json = JSON.parse(stdout);
      } catch (err) {
        reject(
          new Error(
            `runPython: stdout not JSON (${err.message}; stdout tail: ${stdout.slice(-500)})`,
          ),
        );
        return;
      }
      resolve({ json, stdout, stderr, duration_ms });
    });
  });
}
