#!/usr/bin/env node
// Rebuilds Alejandro's tracker (desktop Live Tracker in --partner Alejandro mode: same Ticketboard UX) and pushes it to the public GitHub Pages repo
// platinum-rose/alejandro-tickets (local clone: ../alejandro-tickets). Run after logging or
// settling any Alejandro ticket. Page: https://platinum-rose.github.io/alejandro-tickets/
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(ROOT, '..', 'alejandro-tickets');
const run = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
run(process.execPath, ['scripts/generate-live-tracker.mjs', '--partner', 'Alejandro']);
copyFileSync(path.join(ROOT, 'public/alejandro/index.html'), path.join(SITE, 'index.html'));
copyFileSync(path.join(ROOT, 'public/schedule.json'), path.join(SITE, 'schedule.json'));
run('git', ['add', 'index.html', 'schedule.json'], SITE);
try { run('git', ['commit', '-m', `Update tickets ${new Date().toISOString()}`], SITE); } catch { console.log('No ticket changes to publish.'); process.exit(0); }
run('git', ['push'], SITE);
console.log('Published: https://platinum-rose.github.io/alejandro-tickets/');
