#!/usr/bin/env node
/**
 * protect-hot-files.js — NFL Dashboard
 * PreToolUse:Write|Edit hook — warns when editing hot files
 * (App.jsx, storage.js, picksDatabase.js) without PM lock context.
 * Non-blocking — advisory only.
 *
 * Exit codes:
 *   0 — always (advisory)
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

if (process.env.NFL_SKIP_HOOKS === 'true') {
  process.exit(0);
}

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

let input;
try {
  const raw = readFileSync('/dev/stdin', 'utf8').trim();
  input = raw ? JSON.parse(raw) : {};
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path
  ?? input?.tool_input?.path
  ?? input?.tool_input?.filePath
  ?? null;

if (!filePath) process.exit(0);

const HOT_FILES = [
  'src/App.jsx',
  'src/lib/storage.js',
  'src/lib/picksDatabase.js',
  'AGENT_LOCK.json',
];

const relPath = filePath.replace(/\\/g, '/');
const isHot = HOT_FILES.some(f => relPath.endsWith(f));
if (!isHot) process.exit(0);

// Check if AGENT_LOCK.json has an active lock
const lockFile = path.join(PROJECT_ROOT, 'AGENT_LOCK.json');
let hasLock = false;
if (existsSync(lockFile)) {
  try {
    const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    hasLock = Array.isArray(lock?.activeLocks) && lock.activeLocks.length > 0;
  } catch {
    // Can't parse lock file
  }
}

const fileName = path.basename(filePath);
if (!hasLock) {
  console.warn(`\n⚠️  NFL HOOK — Hot file edit: ${fileName}`);
  console.warn('This file requires PM lock in AGENT_LOCK.json before editing.');
  console.warn('Verify you have explicit scope for this change.');
}

process.exit(0);
