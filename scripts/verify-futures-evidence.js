#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function argValue(argv, name, fallback = null) {
  const index = argv.indexOf(name);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

function npmBin() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function commandInvocation(command, args) {
  if (process.platform !== 'win32' || !/\.cmd$/i.test(command)) {
    return { command, args };
  }
  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', [command, ...args].join(' ')],
  };
}

function runCommand({ id, label, command, args, blockable = false }) {
  const startedAt = new Date().toISOString();
  const invocation = commandInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const endedAt = new Date().toISOString();
  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const blocked = blockable && result.status !== 0 && /BLOCKED|Refusing|blocked|legacy|unresolved/i.test(combined);
  const status = result.status === 0 ? 'pass' : (blocked ? 'blocked' : 'fail');
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    id,
    label,
    status,
    exit_code: result.status,
    started_at: startedAt,
    ended_at: endedAt,
    command: [command, ...args].join(' '),
    stdout_sha256: createHash('sha256').update(result.stdout || '').digest('hex'),
    stderr_sha256: createHash('sha256').update(result.stderr || '').digest('hex'),
    stdout_tail: String(result.stdout || '').split(/\r?\n/).filter(Boolean).slice(-12),
    stderr_tail: String(result.stderr || '').split(/\r?\n/).filter(Boolean).slice(-12),
    spawn_error: result.error ? result.error.message : null,
  };
}

async function latestSourceAudit() {
  const dir = path.resolve(ROOT, '.nfl/source-audit');
  let entries = [];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const candidates = await Promise.all(entries
    .filter((name) => /^nfl-intel-source-audit-.*\.json$/.test(name))
    .map(async (name) => {
      const filePath = path.join(dir, name);
      return { name, mtimeMs: (await stat(filePath)).mtimeMs };
    }));
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name));
  return candidates[0] ? `.nfl/source-audit/${candidates[0].name}` : null;
}

async function gitValue(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0 ? result.stdout.trim() : null;
}

async function main() {
  const argv = process.argv.slice(2);
  const generatedAt = argValue(argv, '--generated-at', new Date().toISOString());
  if (!Number.isFinite(new Date(generatedAt).getTime())) throw new Error(`Invalid --generated-at: ${generatedAt}`);
  const date = argValue(argv, '--date', generatedAt.slice(0, 10));
  const stamp = generatedAt.replace(/[:.]/g, '-');
  const receiptOut = argValue(argv, '--out', `.nfl/verification/futures-evidence-verification-${stamp}.json`);
  const runFull = !argv.includes('--skip-full');
  const sourceAudit = await latestSourceAudit();

  const commands = [
    {
      id: 'focused_unit_tests',
      label: 'Focused futures evidence fixtures',
      command: npmBin(),
      args: ['exec', '--', 'vitest', 'run',
        'tests/unit/articleIntelReview.test.js',
        'tests/unit/teamIdentity.test.js',
        'tests/unit/playerAvailability.test.js',
        'tests/unit/predictionMarketEvidenceCleanup.test.js',
        'tests/unit/futuresOddsExecution.test.js',
        'tests/unit/futuresEvidenceGates.test.js',
        'tests/unit/futuresEvidenceRebuild.test.js'],
    },
    {
      id: 'youtube_cohort_cleanup',
      label: 'YouTube cohort cleanup self-test',
      command: npmBin(),
      args: ['run', 'test:youtube-cohort-cleanup'],
    },
  ];

  if (runFull) {
    commands.push(
      { id: 'full_vitest', label: 'Full Vitest suite', command: npmBin(), args: ['test'] },
      { id: 'lint', label: 'ESLint', command: npmBin(), args: ['run', 'lint'] },
      { id: 'build', label: 'Production build', command: npmBin(), args: ['run', 'build'] },
    );
  }

  commands.push({
    id: 'strict_source_audit',
    label: 'Strict source audit',
    command: process.execPath,
    args: ['scripts/build-intel-source-audit-report.js', '--no-write', '--strict', '--generated-at', generatedAt],
    blockable: true,
  });

  if (sourceAudit) {
    commands.push({
      id: 'synthesis_context_validate_only',
      label: 'Synthesis context validation only',
      command: process.execPath,
      args: ['scripts/build-futures-synthesis-context.js', '--validate-only', '--date', date, '--source-audit', sourceAudit, '--generated-at', generatedAt],
      blockable: true,
    });
  }

  const results = commands.map(runCommand);
  const localHead = await gitValue(['rev-parse', 'HEAD']);
  const originMain = await gitValue(['rev-parse', 'origin/main']);
  const receipt = {
    schema: 'futures_evidence_verification_receipt_v1',
    generated_at: generatedAt,
    artifact_date: date,
    status: results.some((result) => result.status === 'fail')
      ? 'fail'
      : (results.some((result) => result.status === 'blocked') ? 'blocked' : 'pass'),
    guardrails: {
      network_fetches: false,
      model_calls: false,
      supabase_writes: false,
      official_pick_actions: false,
      recommendation_persistence: false,
      portfolio_mutations: false,
    },
    source_audit_input: sourceAudit,
    git: {
      local_head: localHead,
      origin_main: originMain,
      local_origin_parity: Boolean(localHead && originMain && localHead === originMain),
      m6_head: null,
      m6_parity_status: 'not_verified_by_local_script',
    },
    results,
  };

  await mkdir(path.dirname(path.resolve(ROOT, receiptOut)), { recursive: true });
  await writeFile(path.resolve(ROOT, receiptOut), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  console.log(`Futures evidence verification ${receipt.status.toUpperCase()}: ${receiptOut}`);
  if (receipt.status !== 'pass') process.exitCode = receipt.status === 'blocked' ? 2 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
