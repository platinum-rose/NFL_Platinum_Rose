#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'data', 'shadow-harness', 'reports', 'youtube-futures-intel-review-latest.json');
const STATUS_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-intel-review-status.json');
const QUEUE_PATH = path.join(ROOT, 'data', 'shadow-harness', 'review', 'youtube-futures-local-intel-queue.json');
const DEFAULT_PORT = 3876;

const args = new Set(process.argv.slice(2));
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) : DEFAULT_PORT;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', reject);
  });
}

function loadState() {
  if (!fs.existsSync(REPORT_PATH)) {
    execFileSync(process.execPath, ['scripts/build-youtube-futures-intel-review.js'], {
      cwd: ROOT,
      stdio: 'inherit'
    });
  }
  const report = readJson(REPORT_PATH);
  const status = readJson(STATUS_PATH);
  const statusById = new Map((status.items || []).map(item => [item.item_id, item]));
  const items = (report.picks || []).map(pick => {
    const review = statusById.get(pick.item_id) || {};
    return {
      ...pick,
      status: review.status || 'pending_review',
      reviewer_notes: review.reviewer_notes || '',
      updated_at: review.updated_at || null
    };
  });
  return {
    generated_at: new Date().toISOString(),
    guardrail: 'Local review UI only. Changes update the local status ledger and do not create official picks, Supabase writes, production recommendations, or parlay changes.',
    summary: {
      futures_candidates: report.futures_candidates,
      observed_episodes: report.observed_episodes,
      missing_observations: report.missing_observations,
      total_extracted_picks: report.total_extracted_picks,
      flagged_picks: report.flagged_picks,
      total_cost_usd: report.total_cost_usd,
      item_lane_counts: report.item_lane_counts || {},
      review_flag_counts: report.review_flag_counts || {}
    },
    allowed_statuses: status.allowed_statuses || ['pending_review', 'needs_review', 'context_only', 'promote_to_local_intel', 'reject'],
    items
  };
}

function updateStatus(updates) {
  const status = readJson(STATUS_PATH);
  const byId = new Map((status.items || []).map(item => [item.item_id, item]));
  const now = new Date().toISOString();
  for (const update of updates) {
    const item = byId.get(update.item_id);
    if (!item) throw new Error(`Unknown item_id: ${update.item_id}`);
    if (update.status && !(status.allowed_statuses || []).includes(update.status)) {
      throw new Error(`Unsupported status for ${update.item_id}: ${update.status}`);
    }
    item.status = update.status || item.status;
    item.reviewer_notes = update.reviewer_notes ?? item.reviewer_notes ?? '';
    item.updated_at = now;
  }
  status.generated_at = now;
  status.items = [...byId.values()];
  writeJson(STATUS_PATH, status);
  return { updated: updates.length, updated_at: now };
}

function runExport() {
  execFileSync(process.execPath, ['scripts/export-youtube-futures-local-intel.js'], {
    cwd: ROOT,
    stdio: 'pipe'
  });
  return readJson(QUEUE_PATH);
}

function renderPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>YouTube Futures Intel Review</title>
  <style>
    :root {
      --bg: #f5f3ee;
      --ink: #191816;
      --muted: #706a60;
      --line: #d6d0c6;
      --panel: #fffefa;
      --accent: #075985;
      --good: #166534;
      --warn: #9a3412;
      --bad: #991b1b;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--ink); }
    header { position: sticky; top: 0; z-index: 2; background: rgba(255, 254, 250, 0.97); border-bottom: 1px solid var(--line); padding: 14px 18px; }
    h1 { margin: 0 0 8px; font-size: 22px; letter-spacing: 0; }
    .sub { color: var(--muted); font-size: 13px; }
    .toolbar { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; align-items: end; }
    .bulkbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; align-items: center; }
    label { display: grid; gap: 4px; font-size: 12px; color: var(--muted); }
    select, input, textarea, button { font: inherit; border: 1px solid var(--line); border-radius: 6px; background: white; color: var(--ink); }
    select, input { height: 34px; padding: 0 9px; }
    button { height: 34px; padding: 0 12px; cursor: pointer; }
    button.primary { background: var(--accent); color: white; border-color: var(--accent); }
    button.good { background: var(--good); color: white; border-color: var(--good); }
    button.warn { background: var(--warn); color: white; border-color: var(--warn); }
    button.bad { background: var(--bad); color: white; border-color: var(--bad); }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    main { padding: 18px; }
    .stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .stat { border: 1px solid var(--line); background: var(--panel); border-radius: 6px; padding: 8px 10px; min-width: 108px; }
    .stat b { display: block; font-size: 18px; }
    .stat span { display: block; color: var(--muted); font-size: 12px; }
    .item { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .item-head { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
    .title { font-weight: 700; line-height: 1.3; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 3px 7px; font-size: 12px; background: #faf8f2; }
    .pill.futures_pick { color: var(--good); border-color: #bbd7bc; background: #eef8ef; }
    .pill.non_futures_betting { color: var(--warn); border-color: #f1c9a8; background: #fff4e8; }
    .pill.injury_intel { color: var(--accent); border-color: #b7d5e6; background: #eef7fb; }
    .pill.needs_review, .pill.reject { color: var(--bad); }
    .grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; margin-top: 12px; }
    .field { color: var(--muted); font-size: 12px; }
    .field strong { display: block; color: var(--ink); font-size: 14px; margin-top: 2px; }
    .rationale { margin-top: 10px; line-height: 1.42; font-size: 14px; }
    .quote { margin-top: 10px; border-left: 3px solid var(--line); padding-left: 10px; color: var(--muted); line-height: 1.42; font-size: 13px; }
    .review { display: grid; grid-template-columns: 220px 1fr auto; gap: 10px; margin-top: 12px; align-items: end; }
    textarea { min-height: 34px; padding: 7px 9px; resize: vertical; }
    a { color: var(--accent); }
    .empty { padding: 24px; border: 1px dashed var(--line); background: var(--panel); border-radius: 8px; color: var(--muted); }
    .message { min-height: 18px; margin-top: 8px; color: var(--muted); font-size: 13px; }
    @media (max-width: 900px) {
      .toolbar { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
      .grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
      .review { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>YouTube Futures Intel Review</h1>
    <div class="sub">Local status edits only. Exporting creates a local intel queue, not official picks.</div>
    <div class="toolbar">
      <label>Lane<select id="laneFilter"></select></label>
      <label>Status<select id="statusFilter"></select></label>
      <label>Flag<select id="flagFilter"></select></label>
      <label>Team<input id="teamFilter" placeholder="Any"></label>
      <label>Search<input id="searchFilter" placeholder="Title or rationale"></label>
      <button class="primary" id="exportBtn">Export Promoted</button>
    </div>
    <div class="bulkbar">
      <button class="good" id="promoteVisibleBtn">Promote Visible</button>
      <button id="pendingVisibleBtn">Pending Visible</button>
      <button class="warn" id="contextVisibleBtn">Context Visible</button>
      <button class="bad" id="rejectVisibleBtn">Reject Visible</button>
    </div>
    <div class="message" id="message"></div>
  </header>
  <main>
    <section class="stats" id="stats"></section>
    <section id="items"></section>
  </main>
  <script>
    let state = null;
    const dirty = new Set();
    const el = id => document.getElementById(id);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const price = value => value == null || Number.isNaN(Number(value)) ? '' : (Number(value) > 0 ? '+' + Number(value) : String(value));

    async function api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      return payload;
    }

    function setMessage(text) {
      el('message').textContent = text || '';
    }

    function optionList(values, selected = 'all') {
      return ['all', ...values].map(value => '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(value) + '</option>').join('');
    }

    function populateFilters() {
      const lanes = [...new Set(state.items.map(item => item.item_lane))].sort();
      const statuses = [...new Set(state.items.map(item => item.status))].sort();
      const flags = [...new Set(state.items.flatMap(item => item.review_flags || []))].sort();
      el('laneFilter').innerHTML = optionList(lanes);
      el('statusFilter').innerHTML = optionList(statuses);
      el('flagFilter').innerHTML = optionList(flags);
    }

    function renderStats(items) {
      const promoted = state.items.filter(item => item.status === 'promote_to_local_intel').length;
      const needsReview = state.items.filter(item => item.status === 'needs_review').length;
      const contextOnly = state.items.filter(item => item.status === 'context_only').length;
      el('stats').innerHTML = [
        ['Visible', items.length],
        ['Total', state.items.length],
        ['Promoted', promoted],
        ['Needs Review', needsReview],
        ['Context Only', contextOnly],
        ['Cost', '$' + state.summary.total_cost_usd]
      ].map(([label, value]) => '<div class="stat"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>').join('');
    }

    function itemMatches(item) {
      const lane = el('laneFilter').value;
      const status = el('statusFilter').value;
      const flag = el('flagFilter').value;
      const team = el('teamFilter').value.trim().toUpperCase();
      const search = el('searchFilter').value.trim().toLowerCase();
      if (lane !== 'all' && item.item_lane !== lane) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (flag !== 'all' && !(item.review_flags || []).includes(flag)) return false;
      if (team && item.team !== team) return false;
      if (search) {
        const haystack = [item.episode_title, item.rationale, item.market, item.speaker, item.reviewer_notes].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    }

    function visibleItems() {
      return state.items.filter(itemMatches);
    }

    function renderItems() {
      const items = visibleItems();
      renderStats(items);
      if (items.length === 0) {
        el('items').innerHTML = '<div class="empty">No items match the current filters.</div>';
        return;
      }
      el('items').innerHTML = items.map(item => {
        const flags = (item.review_flags || []).map(flag => '<span class="pill">' + esc(flag) + '</span>').join('');
        const statusOptions = state.allowed_statuses.map(status => '<option value="' + esc(status) + '"' + (status === item.status ? ' selected' : '') + '>' + esc(status) + '</option>').join('');
        return '<article class="item" data-id="' + esc(item.item_id) + '">' +
          '<div class="item-head"><div><div class="title">' + esc(item.episode_title) + '</div>' +
          '<div class="meta"><span class="pill ' + esc(item.item_lane) + '">' + esc(item.item_lane) + '</span><span class="pill ' + esc(item.status) + '">' + esc(item.status) + '</span>' + flags + '</div></div>' +
          '<a target="_blank" rel="noreferrer" href="' + esc(item.timestamp_url || item.video_url) + '">Open timestamp</a></div>' +
          '<div class="grid">' +
          '<div class="field">Team<strong>' + esc(item.team) + '</strong></div>' +
          '<div class="field">Market<strong>' + esc(item.market) + '</strong></div>' +
          '<div class="field">Side<strong>' + esc(item.side) + '</strong></div>' +
          '<div class="field">Line<strong>' + esc(item.line ?? '') + '</strong></div>' +
          '<div class="field">Price<strong>' + esc(price(item.price)) + '</strong></div>' +
          '</div>' +
          (item.supporting_quote ? '<div class="quote"><strong>Quote:</strong> ' + esc(item.supporting_quote) + '</div>' : '') +
          '<div class="rationale">' + esc(item.rationale) + '</div>' +
          '<div class="review"><label>Status<select class="statusEdit">' + statusOptions + '</select></label>' +
          '<label>Reviewer notes<textarea class="notesEdit">' + esc(item.reviewer_notes || '') + '</textarea></label>' +
          '<button class="saveBtn">Save</button></div>' +
          '</article>';
      }).join('');
    }

    async function saveCard(card) {
      const itemId = card.dataset.id;
      const item = state.items.find(row => row.item_id === itemId);
      const payload = {
        item_id: itemId,
        status: card.querySelector('.statusEdit').value,
        reviewer_notes: card.querySelector('.notesEdit').value
      };
      await api('/api/status', { method: 'POST', body: JSON.stringify({ updates: [payload] }) });
      item.status = payload.status;
      item.reviewer_notes = payload.reviewer_notes;
      dirty.delete(itemId);
      setMessage('Saved ' + item.team + ' ' + item.market + '.');
      renderItems();
    }

    async function bulkSetVisible(status) {
      const items = visibleItems();
      if (items.length === 0) {
        setMessage('No visible items to update.');
        return;
      }
      const label = status.replaceAll('_', ' ');
      if (!confirm('Set ' + items.length + ' visible item(s) to ' + label + '?')) return;
      const updates = items.map(item => ({
        item_id: item.item_id,
        status,
        reviewer_notes: item.reviewer_notes || ''
      }));
      await api('/api/status', { method: 'POST', body: JSON.stringify({ updates }) });
      for (const item of items) {
        item.status = status;
        dirty.delete(item.item_id);
      }
      setMessage('Updated ' + items.length + ' visible item(s) to ' + label + '.');
      renderItems();
    }

    async function load() {
      state = await api('/api/state');
      populateFilters();
      renderItems();
      setMessage('Loaded ' + state.items.length + ' review items.');
    }

    document.addEventListener('change', event => {
      if (event.target.matches('#laneFilter, #statusFilter, #flagFilter')) renderItems();
      if (event.target.matches('.statusEdit')) dirty.add(event.target.closest('.item').dataset.id);
    });
    document.addEventListener('input', event => {
      if (event.target.matches('#teamFilter, #searchFilter')) renderItems();
      if (event.target.matches('.notesEdit')) dirty.add(event.target.closest('.item').dataset.id);
    });
    document.addEventListener('click', async event => {
      if (event.target.matches('.saveBtn')) {
        event.target.disabled = true;
        try { await saveCard(event.target.closest('.item')); }
        catch (err) { setMessage(err.message); }
        finally { event.target.disabled = false; }
      }
      if (event.target.matches('#exportBtn')) {
        event.target.disabled = true;
        try {
          const result = await api('/api/export', { method: 'POST', body: '{}' });
          setMessage('Exported ' + result.exported_items + ' promoted item(s); skipped ' + result.skipped_items + '.');
        } catch (err) {
          setMessage(err.message);
        } finally {
          event.target.disabled = false;
        }
      }
      if (event.target.matches('#promoteVisibleBtn')) {
        event.target.disabled = true;
        try { await bulkSetVisible('promote_to_local_intel'); }
        catch (err) { setMessage(err.message); }
        finally { event.target.disabled = false; }
      }
      if (event.target.matches('#pendingVisibleBtn')) {
        event.target.disabled = true;
        try { await bulkSetVisible('pending_review'); }
        catch (err) { setMessage(err.message); }
        finally { event.target.disabled = false; }
      }
      if (event.target.matches('#contextVisibleBtn')) {
        event.target.disabled = true;
        try { await bulkSetVisible('context_only'); }
        catch (err) { setMessage(err.message); }
        finally { event.target.disabled = false; }
      }
      if (event.target.matches('#rejectVisibleBtn')) {
        event.target.disabled = true;
        try { await bulkSetVisible('reject'); }
        catch (err) { setMessage(err.message); }
        finally { event.target.disabled = false; }
      }
    });
    window.addEventListener('beforeunload', event => {
      if (dirty.size > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
    load().catch(err => setMessage(err.message));
  </script>
</body>
</html>`;
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/') return sendHtml(res, renderPage());
    if (req.method === 'GET' && url.pathname === '/api/state') return sendJson(res, 200, loadState());
    if (req.method === 'POST' && url.pathname === '/api/status') {
      const body = await readBody(req);
      const updates = Array.isArray(body.updates) ? body.updates : [];
      return sendJson(res, 200, updateStatus(updates));
    }
    if (req.method === 'POST' && url.pathname === '/api/export') return sendJson(res, 200, runExport());
    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}

if (args.has('--self-test')) {
  const html = renderPage();
  if (!html.includes('YouTube Futures Intel Review')) throw new Error('Review UI HTML did not render');
  const state = loadState();
  if (!Array.isArray(state.items) || state.items.length === 0) throw new Error('Review UI state has no items');
  console.log(`Review UI self-test passed with ${state.items.length} item(s).`);
  process.exit(0);
}

const server = http.createServer(handleRequest);
server.listen(port, '127.0.0.1', () => {
  console.log(`YouTube futures review UI: http://127.0.0.1:${port}/`);
});
