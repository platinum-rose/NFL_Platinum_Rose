import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer } from '../../scripts/toolbox-app-server.mjs';


describe('toolbox-app-server standalone server', () => {
  let server;
  const TEST_PORT = 4599;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  beforeAll(async () => {
    server = await startServer(TEST_PORT);
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('serves the standalone GUI dashboard HTML on root', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('NFL PLATINUM ROSE TOOLBOX');
    expect(html).toContain('Weekly Operating Cadence');
    expect(html).toContain('Launch NFL Dashboard');
    expect(html).toContain('Live Gameday Tracker');
    expect(html).toContain('WEEKLY CADENCE HEALTH');
    expect(html).toContain('Live Multi-Game Sunday Trackers');
    expect(html).toContain('bottom-console-drawer');
    expect(html).toContain('btn-collapse');
    expect(html).toContain('controls-toolbar');
    expect(html).toContain('cadence-days-container');
    expect(html).toContain('tab-day-today');
    expect(html).not.toContain('drag-handle');
  });

  it('returns cadence health and deliverable verification on /api/status', async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cadenceHealth).toBeDefined();
    expect(data.todayName).toBeDefined();
    expect(typeof data.todayName).toBe('string');
    expect(data.serverTime).toBeDefined();

    const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'monday'];
    for (const day of days) {
      const dayData = data.cadenceHealth[day];
      expect(dayData).toBeDefined();
      expect(dayData.day).toBe(day);
      expect(dayData.title).toBeDefined();
      expect(dayData.objective).toBeDefined();
      expect(['fresh', 'stale', 'missing']).toContain(dayData.status);
      expect(Array.isArray(dayData.deliverables)).toBe(true);
      expect(Array.isArray(dayData.subtasks)).toBe(true);
      expect(dayData.deliverables.length).toBeGreaterThan(0);
    }
  });

  it('handles top-level launcher tasks on /api/run', async () => {
    const res = await fetch(`${BASE_URL}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'launch-gameday' })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.task).toBe('launch-gameday');
  });

  it('serves static files from public/ (Melbourne and Sunday trackers)', async () => {
    const melbRes = await fetch(`${BASE_URL}/public/live-tracker-melbourne.html`);
    expect(melbRes.status).toBe(200);
    expect(melbRes.headers.get('content-type')).toContain('text/html');
    const melbHtml = await melbRes.text();
    expect(melbHtml).toContain('Melbourne');

    const sunRes = await fetch(`${BASE_URL}/public/live-tracker-sunday.html`);
    expect(sunRes.status).toBe(200);
    expect(sunRes.headers.get('content-type')).toContain('text/html');
  });

  it('rejects untrusted cross-origin requests with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/status`, {
      headers: { 'Origin': 'http://malicious-site.example.com' }
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Forbidden');
  });

  it('permits trusted loopback origins and sets proper CORS header', async () => {
    const res = await fetch(`${BASE_URL}/api/status`, {
      headers: { 'Origin': 'http://localhost:5180' }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5180');
  });

  it('enforces schema validation and rejects locked card with > 5 picks on /api/supercontest/locked-card', async () => {
    const sixPicks = [
      { team: 'TB', spread: 3.5 },
      { team: 'IND', spread: 3.5 },
      { team: 'PIT', spread: -3.5 },
      { team: 'DAL', spread: -3.0 },
      { team: 'CAR', spread: 3.0 },
      { team: 'ARI', spread: 9.5 },
    ];
    const res = await fetch(`${BASE_URL}/api/supercontest/locked-card`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5180'
      },
      body: JSON.stringify({ week: 1, lockedCard: sixPicks })
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Maximum 5 picks allowed');
  });

  it('rejects locked card with invalid week parameter on /api/supercontest/locked-card', async () => {
    const res = await fetch(`${BASE_URL}/api/supercontest/locked-card`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5180'
      },
      body: JSON.stringify({ week: 99, lockedCard: [{ team: 'TB', spread: 3.5 }] })
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Invalid week');
  });
});
