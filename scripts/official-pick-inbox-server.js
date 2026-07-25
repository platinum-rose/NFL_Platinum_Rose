#!/usr/bin/env node

import http from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = Number(process.env.PORT || 8787);
const ACTIVE_DIR = path.join(ROOT, 'data', 'official-picks', 'proposals', 'active');
const LEDGER_SCRIPT = path.join(ROOT, 'scripts', 'official-pick-ledger.js');
const LEDGER_REPORT_HTML = path.join(ROOT, '.nfl', 'official-picks', 'platinum_rose_ai_2026-ledger.html');

process.on('uncaughtException', (err) => {
  console.error(err.stack || err.message);
});

process.on('unhandledRejection', (err) => {
  console.error(err?.stack || err?.message || err);
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function activePath(file) {
  const resolved = path.resolve(ROOT, file);
  const rel = path.relative(ACTIVE_DIR, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('File must be inside data/official-picks/proposals/active.');
  }
  return resolved;
}

async function jsonBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function runLedger(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [LEDGER_SCRIPT, ...args], {
      cwd: ROOT,
      env: process.env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function validateFile(file) {
  const result = await runLedger(['validate', '--file', file]);
  if (result.code !== 0) {
    return {
      proposal_ready: false,
      lock_ready: false,
      exacta_hold: false,
      errors: [result.stderr.trim() || result.stdout.trim() || 'Validation failed.'],
      warnings: [],
      info: [],
    };
  }
  return JSON.parse(result.stdout);
}

async function activeFiles() {
  try {
    const entries = await readdir(ACTIVE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('candidate-inbox-'))
      .map((entry) => path.join(ACTIVE_DIR, entry.name))
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function inboxData() {
  const files = await activeFiles();
  const items = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    const proposal = JSON.parse(await readFile(abs, 'utf8'));
    const readiness = await validateFile(rel);
    items.push({ file: rel, proposal, readiness });
  }
  const summary = await runLedger(['summary']);
  return {
    generated_at: new Date().toISOString(),
    active_count: items.length,
    ledger_summary: summary.code === 0 ? JSON.parse(summary.stdout) : null,
    items,
  };
}

function renderPage(data, flash = null) {
  const rows = data.items.length ? data.items.map((item) => {
    const p = item.proposal;
    const r = item.readiness;
    const canApprove = r.proposal_ready && !r.exacta_hold;
    const status = r.exacta_hold ? 'Hold' : r.proposal_ready ? 'Ready' : 'Needs work';
    const checks = [...(r.errors || []), ...(r.warnings || []), ...(r.info || [])].join(' | ') || 'Clear';
    return `<tr>
      <td><strong>${escapeHtml(p.selection)}</strong><div class="muted">${escapeHtml(item.file)}</div></td>
      <td>${escapeHtml(fmt(p.market_type))}</td>
      <td>${escapeHtml(fmt(p.book))} ${escapeHtml(fmt(p.price, ''))}</td>
      <td>${escapeHtml(fmt(p.stake_units))}u</td>
      <td><span class="badge ${canApprove ? 'ready' : r.exacta_hold ? 'hold' : 'bad'}">${escapeHtml(status)}</span></td>
      <td>${escapeHtml(checks)}</td>
      <td class="actions">
        <button ${canApprove ? '' : 'disabled'} data-action="approve" data-file="${escapeHtml(item.file)}">Approve</button>
        <button data-action="reject" data-file="${escapeHtml(item.file)}">Reject</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" class="empty">No active draft proposals.</td></tr>';

  const ledger = data.ledger_summary;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Platinum Rose AI Inbox</title>
  <style>
    :root { --ink:#16202b; --muted:#617386; --line:#d8dee6; --paper:#fff; --band:#f4f7fb; --ready:#0f766e; --hold:#a16207; --bad:#b42318; }
    body { margin:0; font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif; color:var(--ink); background:var(--band); }
    header { padding:24px 28px 18px; background:var(--paper); border-bottom:1px solid var(--line); }
    main { max-width:1200px; margin:0 auto; padding:22px; }
    h1 { margin:0 0 6px; font-size:26px; }
    .muted { color:var(--muted); font-size:12px; }
    .flash { margin:0 0 14px; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:var(--paper); }
    .stats { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0; }
    .stat { background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:10px 12px; min-width:120px; }
    .stat strong { display:block; font-size:18px; }
    table { width:100%; border-collapse:collapse; background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
    th, td { text-align:left; vertical-align:top; border-bottom:1px solid var(--line); padding:10px; }
    th { font-size:12px; text-transform:uppercase; color:var(--muted); background:#eef3f8; }
    .badge { display:inline-block; border-radius:999px; padding:3px 8px; color:white; font-size:12px; white-space:nowrap; }
    .ready { background:var(--ready); }
    .hold { background:var(--hold); }
    .bad { background:var(--bad); }
    button { border:1px solid #b9c3cf; background:#fff; border-radius:6px; padding:6px 9px; cursor:pointer; margin-right:6px; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .actions { min-width:150px; }
    .empty { text-align:center; color:var(--muted); padding:28px; }
    .links { margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; }
    .links a { color:#1d4ed8; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <header>
    <h1>Platinum Rose AI Candidate Inbox</h1>
    <div class="muted">Local-only controls. Approve locks a valid draft as an official paper pick; reject archives obvious bad drafts.</div>
    <nav class="links"><a href="/ledger">Ledger Scorecard</a></nav>
  </header>
  <main>
    ${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
    <section class="stats">
      <div class="stat"><span>Active drafts</span><strong>${escapeHtml(data.active_count)}</strong></div>
      <div class="stat"><span>Official paper</span><strong>${escapeHtml(ledger?.official_paper ?? 0)}</strong></div>
      <div class="stat"><span>Total ledger picks</span><strong>${escapeHtml(ledger?.total_picks ?? 0)}</strong></div>
      <div class="stat"><span>Net units</span><strong>${escapeHtml(ledger?.net_units ?? 0)}</strong></div>
    </section>
    <table>
      <thead><tr><th>Selection</th><th>Market</th><th>Price</th><th>Stake</th><th>Status</th><th>Checks</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
  <script>
    async function act(action, file) {
      const reason = action === 'reject' ? 'Rejected from inbox UI' : '';
      const btn = document.querySelector('button[data-action="' + action + '"][data-file="' + CSS.escape(file) + '"]');
      if (btn) btn.disabled = true;
      const res = await fetch('/api/' + action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file, reason })
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) alert(data.error || 'Action failed');
      location.href = '/?flash=' + encodeURIComponent(data.message || data.error || 'Updated');
    }
    document.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      act(btn.dataset.action, btn.dataset.file);
    });
  </script>
</body>
</html>`;
}

async function handleApi(action, req, res) {
  try {
    const body = await jsonBody(req);
    const abs = activePath(body.file);
    const rel = path.relative(ROOT, abs);
    const args = action === 'approve'
      ? ['approve', '--file', rel]
      : ['reject', '--file', rel, '--reason', body.reason || 'Rejected from inbox UI'];
    const result = await runLedger(args);
    if (result.code !== 0) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: result.stderr.trim() || result.stdout.trim() || 'Action failed.' }));
      return;
    }
    await runLedger(['inbox']);
    await runLedger(['report']);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: result.stdout.trim() || 'Updated.' }));
  } catch (err) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && url.pathname === '/api/approve') return handleApi('approve', req, res);
  if (req.method === 'POST' && url.pathname === '/api/reject') return handleApi('reject', req, res);
  if (req.method === 'GET' && url.pathname === '/api/inbox') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(await inboxData(), null, 2));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/ledger') {
    await runLedger(['report']);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(LEDGER_REPORT_HTML, 'utf8'));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/') {
    const data = await inboxData();
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderPage(data, url.searchParams.get('flash')));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

server.listen(DEFAULT_PORT, '127.0.0.1', () => {
  console.log(`Platinum Rose inbox UI: http://127.0.0.1:${DEFAULT_PORT}/`);
});

setInterval(() => {}, 60 * 60 * 1000);
