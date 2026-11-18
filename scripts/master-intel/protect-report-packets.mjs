// Node twin of scripts/master-intel/packet_archive.py, run by vite.config.js before every `vite build`.
// `vite build` empties dist/, which on 2026-11-02 wiped every weekly Master Intel / SuperContest packet.
// This copies each dist/nfl_week*_master_packet* folder into the permanent, append-only archive
//   reports/intel/packets-archive/<season>-w<NN>/<YYYY-MM-DD-HHMM>-pre-vite-build[-<suffix>]/
// (same MANIFEST.json format; skipped when identical to the newest snapshot for that week).
// If anything fails it throws, so the build stops instead of deleting reports it could not save.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const ptStamp = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}`;
};

export function protectReportPackets(root) {
  const dist = path.join(root, 'dist');
  const arch = path.join(root, 'reports', 'intel', 'packets-archive');
  if (!existsSync(dist)) return [];
  const saved = [];
  for (const name of readdirSync(dist)) {
    const m = name.match(/^nfl_week(\d+)_master_packet(?:_(.+))?$/);
    const src = path.join(dist, name);
    if (!m || !statSync(src).isDirectory()) continue;
    const files = readdirSync(src).filter((f) => statSync(path.join(src, f)).isFile());
    if (!files.length) continue;
    let season = new Date().getFullYear();
    for (const f of files.filter((f) => f.endsWith('_summary.json'))) {
      try { season = Number(JSON.parse(readFileSync(path.join(src, f), 'utf8')).season) || season; break; } catch { /* keep default */ }
    }
    const weekDir = path.join(arch, `${season}-w${String(m[1]).padStart(2, '0')}`);
    const hashes = Object.fromEntries(files.map((f) => [f, sha(path.join(src, f))]));
    // Skip if any existing snapshot for this week already holds exactly these files.
    const dup = existsSync(weekDir) && readdirSync(weekDir).some((d) => {
      try {
        const man = JSON.parse(readFileSync(path.join(weekDir, d, 'MANIFEST.json'), 'utf8')).files || {};
        return files.every((f) => man[f]?.sha256 === hashes[f]);
      } catch { return false; }
    });
    if (dup) continue;
    let dest = path.join(weekDir, `${ptStamp()}-pre-vite-build${m[2] ? `-${m[2]}` : ''}`);
    for (let n = 2; existsSync(dest); n++) dest = dest.replace(/(-\d+)?$/, `-${n}`);
    mkdirSync(dest, { recursive: true });
    for (const f of files) copyFileSync(path.join(src, f), path.join(dest, f));
    writeFileSync(path.join(dest, 'MANIFEST.json'), JSON.stringify({
      week: Number(m[1]), season, label: 'pre-vite-build', created_at: new Date().toISOString(), source: src,
      files: Object.fromEntries(files.map((f) => [f, { sha256: hashes[f], bytes: statSync(path.join(src, f)).size }])),
    }, null, 1));
    saved.push(dest);
  }
  if (saved.length) console.log(`[protect-report-packets] archived ${saved.length} report packet(s) before vite empties dist/:\n  ${saved.join('\n  ')}`);
  return saved;
}
