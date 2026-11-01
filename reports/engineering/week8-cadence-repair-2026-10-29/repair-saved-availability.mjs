import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { writeAvailabilitySnapshotAndReports, renderAvailabilityMarkdown, renderAvailabilityHtml } from '../../../scripts/build-player-availability.js';

// Offline recovery only: render the exact saved snapshot, retaining its source time.
const root = process.cwd();
const out = path.join(root, 'reports/engineering/week8-cadence-repair-2026-10-29');
const backup = path.join(out, 'availability-before');
await fs.mkdir(backup, { recursive: true });
const sourcePath = path.join(root, 'data/player-availability/latest.json');
const source = await fs.readFile(sourcePath);
const snapshot = JSON.parse(source.toString('utf8'));
const date = snapshot.meta.generated_at.slice(0, 10);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = [sourcePath,
  path.join(root, `data/player-availability/player-availability-${date}.json`),
  ...[`player-availability-${date}.md`, `player-availability-${date}.html`, 'player-availability-latest.md', 'player-availability-latest.html'].map(p => path.join(root, 'docs/player-availability', p)),
];
const before = [];
for (const file of paths) {
  try {
    const bytes = await fs.readFile(file);
    const dest = path.join(backup, path.relative(root, file).replaceAll(path.sep, '__'));
    await fs.copyFile(file, dest, fs.constants.COPYFILE_EXCL);
    before.push({ path: path.relative(root, file), sha256: hash(bytes), backup: path.relative(root, dest) });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    before.push({ path: path.relative(root, file), missing: true });
  }
}
await fs.writeFile(path.join(out, 'availability-before.json'), JSON.stringify(before, null, 2)+'\n');
if (hash(await fs.readFile(sourcePath)) !== hash(source)) throw Error('Saved source changed during backup; stop recovery.');
const outputs = await writeAvailabilitySnapshotAndReports(snapshot, { date });
const expected = {
  jsonPath: JSON.stringify(snapshot, null, 2)+'\n', latestPath: JSON.stringify(snapshot, null, 2)+'\n',
  mdPath: renderAvailabilityMarkdown(snapshot), latestMdPath: renderAvailabilityMarkdown(snapshot),
  htmlPath: renderAvailabilityHtml(snapshot), latestHtmlPath: renderAvailabilityHtml(snapshot),
};
const checks = [];
for (const [key, file] of Object.entries(outputs)) {
  const bytes = await fs.readFile(file);
  checks.push({ path: path.relative(root, file), sha256: hash(bytes), matches_saved_snapshot_render: bytes.toString('utf8') === expected[key] });
}
const sourceUnchanged = hash(source) === hash(await fs.readFile(sourcePath));
const receipt = { recovered_at: new Date().toISOString(), source_generated_at: snapshot.meta.generated_at, event_count: snapshot.meta.event_count, source_json_unchanged: sourceUnchanged, checks, all_pass: sourceUnchanged && checks.every(x => x.matches_saved_snapshot_render), live_fetches: 0, supabase_actions: 0, paid_calls: 0 };
await fs.writeFile(path.join(out, 'availability-recovery.json'), JSON.stringify(receipt, null, 2)+'\n');
if (!receipt.all_pass) throw Error('Offline recovery verification failed');
console.log(JSON.stringify(receipt, null, 2));
