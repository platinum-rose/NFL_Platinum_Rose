#!/usr/bin/env node
/**
 * build-handoff.js — NFL_Dashboard
 *
 * Stop hook — fires at end of every Claude Code session.
 * Generates HANDOFF.md from git status, TASK_BOARD, and session log.
 *
 * Exit codes:
 *   0 — always (non-blocking)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = join(__dirname, '..', '..');

if (process.env.NFL_SKIP_HOOKS === 'true' || process.env.CI === 'true') {
  process.exit(0);
}

const MEM_DIR = join(WORKSPACE_ROOT, '.nfl');
const HANDOFF_FILE = join(WORKSPACE_ROOT, 'HANDOFF.md');
const TASK_BOARD = join(WORKSPACE_ROOT, 'TASK_BOARD.md');
const SESSION_LOG = join(MEM_DIR, 'session-log.jsonl');

function getBranch() {
  try {
    return execSync('git branch --show-current', { cwd: WORKSPACE_ROOT, encoding: 'utf8' }).trim();
  } catch { return 'unknown'; }
}

function getModifiedFiles() {
  try {
    return execSync('git diff --name-only HEAD', { cwd: WORKSPACE_ROOT, encoding: 'utf8' })
      .split('\n').map(f => f.trim()).filter(Boolean);
  } catch { return []; }
}

function getStagedFiles() {
  try {
    return execSync('git diff --cached --name-only', { cwd: WORKSPACE_ROOT, encoding: 'utf8' })
      .split('\n').map(f => f.trim()).filter(Boolean);
  } catch { return []; }
}

function getTaskBoardSection(header) {
  if (!existsSync(TASK_BOARD)) return '_No TASK_BOARD.md found._';
  const lines = readFileSync(TASK_BOARD, 'utf8').split('\n');
  let active = false;
  const result = [];
  for (const line of lines) {
    if (new RegExp('^## ' + header, 'i').test(line)) { active = true; continue; }
    if (active && /^## /.test(line)) break;
    if (active && line.trim()) result.push(line);
  }
  return result.length > 0 ? result.join('\n') : `_No ${header} tasks._`;
}

function getLastSessionLog() {
  if (!existsSync(SESSION_LOG)) return null;
  const lines = readFileSync(SESSION_LOG, 'utf8').trim().split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  try { return JSON.parse(lines[lines.length - 1]); } catch { return null; }
}

// Sections this hook itself regenerates every run. Anything else that was
// already in HANDOFF.md (Current Pick Up Here, Persistent Backlogs, Previous
// Sessions, etc.) is hand-maintained by the session and must survive a
// Stop-hook rewrite.
const MECHANICAL_HEADERS = ['Uncommitted Changes', 'In Progress', 'Review', 'Last Session Summary'];

function extractPreservedSections(existingContent) {
  if (!existingContent) return [];
  const lines = existingContent.split('\n');
  const chunks = [];
  let current = null;
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current) chunks.push(current);
      current = { header: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) chunks.push(current);

  const preserved = [];
  for (const c of chunks) {
    const headerText = c.header.replace(/^## /, '').trim();
    const isMechanical = MECHANICAL_HEADERS.some(h => headerText.toLowerCase().startsWith(h.toLowerCase()));
    if (isMechanical) continue;
    let body = c.body.join('\n').replace(/\n---\n_Resume by reading[^\n]*_\s*$/, '');
    preserved.push(`\n${c.header}\n${body}`.replace(/\n{3,}$/, '\n'));
  }
  return preserved;
}

function main() {
  if (!existsSync(MEM_DIR)) mkdirSync(MEM_DIR, { recursive: true });

  const now = new Date().toISOString();
  const branch = getBranch();
  const modified = getModifiedFiles();
  const staged = getStagedFiles();
  const inProgress = getTaskBoardSection('In Progress');
  const review = getTaskBoardSection('Review');
  const lastLog = getLastSessionLog();
  const existing = existsSync(HANDOFF_FILE) ? readFileSync(HANDOFF_FILE, 'utf8') : '';
  const preserved = extractPreservedSections(existing);

  const sections = [
    `# NFL_Dashboard — Session Handoff`,
    `> Auto-generated at session end. Read this to resume.`,
    `\n**Date:** ${now}`,
    `**Branch:** ${branch}`,
    ...preserved,
  ];

  if (modified.length > 0 || staged.length > 0) {
    sections.push(`\n## Uncommitted Changes`);
    if (modified.length > 0) {
      sections.push(`\n### Modified`);
      sections.push(modified.map(f => `- ${f}`).join('\n'));
    }
    if (staged.length > 0) {
      sections.push(`\n### Staged`);
      sections.push(staged.map(f => `- ${f}`).join('\n'));
    }
  } else {
    sections.push(`\n## Uncommitted Changes\n\n_Working tree clean._`);
  }

  sections.push(`\n## In Progress`);
  sections.push(inProgress);
  if (review && review !== '_No Review tasks._') {
    sections.push(`\n## Review`);
    sections.push(review);
  }

  if (lastLog) {
    sections.push(`\n## Last Session Summary`);
    sections.push(`- **Duration:** ${lastLog.session_duration_hint ?? 'unknown'}`);
    if (lastLog.files_edited?.length > 0) {
      sections.push(`- **Files touched:** ${lastLog.files_edited.length}`);
      for (const f of lastLog.files_edited.slice(0, 15)) {
        sections.push(`  - ${f}`);
      }
      if (lastLog.files_edited.length > 15) {
        sections.push(`  - _...and ${lastLog.files_edited.length - 15} more_`);
      }
    }
  }

  sections.push(`\n---\n_Resume by reading CLAUDE.md → this file → TASK_BOARD.md_`);
  writeFileSync(HANDOFF_FILE, sections.join('\n') + '\n', 'utf8');
}

try { main(); } catch { process.exit(0); }
