#!/usr/bin/env node
/**
 * Secret Scan Hook — fires on Stop.
 * Scans modified files for hardcoded API keys and tokens.
 *
 * Exit 0 = clean
 * Exit 1 = advisory warning (non-blocking)
 * Exit 2 = blocking secret detected
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const SECRET_PATTERNS = [
  { name: 'OpenAI API key', re: /sk-[A-Za-z0-9]{20,}/, sev: 'BLOCK' },
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{20,}/, sev: 'BLOCK' },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/, sev: 'BLOCK' },
  { name: 'GitHub token', re: /gh[ps]_[A-Za-z0-9_]{36,}/, sev: 'BLOCK' },
  { name: 'Supabase anon/service key', re: /eyJ[A-Za-z0-9_-]{40,}/, sev: 'BLOCK' },
  { name: 'Hardcoded key assignment', re: /(?:API_KEY|SECRET|TOKEN)\s*=\s*["'][^"']{8,}["']/, sev: 'WARN' },
  { name: 'DB connection string', re: /(?:postgres|mysql|mongodb):\/\/[^"'\s]{10,}/, sev: 'WARN' },
];

const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.lock', '.svg', '.ico', '.map', '.woff', '.woff2']);
const SKIP_DIRS = new Set(['node_modules', '.venv', 'dist', 'build', '.git']);

function getModifiedFiles() {
  try {
    const output = execSync('git -c core.fsmonitor=false diff --name-only HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return [...new Set(output.split('\n').map((file) => file.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

function shouldSkip(file) {
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) return true;
  return file.split(/[\\/]/).some((part) => SKIP_DIRS.has(part));
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  return SECRET_PATTERNS
    .filter(({ re }) => re.test(content))
    .map(({ name, sev }) => ({ name, sev, filePath }));
}

function main() {
  const findings = getModifiedFiles()
    .filter((file) => !shouldSkip(file))
    .map((file) => path.join(ROOT, file))
    .filter((filePath) => fs.existsSync(filePath))
    .flatMap(scanFile);

  if (findings.length === 0) return;

  const hasBlock = findings.some(({ sev }) => sev === 'BLOCK');
  for (const { name, sev, filePath } of findings) {
    const tag = sev === 'BLOCK' ? '🚨 BLOCK' : '⚠️  WARN';
    console.error(`[check-secrets] ${tag}: ${name} in ${filePath}`);
  }
  process.exit(hasBlock ? 2 : 1);
}

main();
