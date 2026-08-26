import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const logFile = path.resolve(process.cwd(), '.nfl/session-log.jsonl');
const lines = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf-8').trim().split('\n').filter(Boolean) : [];

let lastIdNum = 238;
if (lines.length > 0) {
  try {
    const lastObj = JSON.parse(lines[lines.length - 1]);
    if (lastObj.session && lastObj.session.startsWith('S')) {
      lastIdNum = parseInt(lastObj.session.slice(1), 10);
    }
  } catch {}
}

const nextId = `S${lastIdNum + 1}`;
const todayStr = '2026-08-26';

let currentCommit = 'HEAD';
try {
  currentCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {}

const newEntry = {
  session: nextId,
  date: todayStr,
  commit: currentCommit,
  summary: "Built Platinum Rose Alpha Intelligence Digest email pipeline (agents/send-biweekly-digest.js) with 4-tier explicit source contract (PODCAST QUOTE vs LIVE MARKET CONTEXT vs STATIC BENCHMARK CONTEXT vs UNAVAILABLE). Added URL query parameter episode auto-expand and scroll in PodcastDigestTab.jsx (?tab=podcasts&episode=<ID>). Built deterministic speaker attribution auditor (scratch/audit-speaker-attributions.js). Added --dry-run HTML preview mode and exported raw diarized transcripts for Codex team summarization.",
  lessons: [
    "Dynamic Ad Insertion (DAI) in RSS feeds shifts HTML5 audio playback offsets (#t=sec), so interactive dashboard deeplinks are primary over direct MP3 timestamps.",
    "Explicit source contract badges (PODCAST QUOTE vs LIVE MARKET CONTEXT vs STATIC BENCHMARK CONTEXT) prevent AI recommendation ownership or false market attribution.",
    "Strict guard against unknown team defaults in market fallback logic prevents silently substituting odds from another team."
  ]
};

// Check if today's entry already exists to update in place, else append
let updatedLines = [...lines];
const todayIdx = updatedLines.findIndex(l => {
  try {
    const obj = JSON.parse(l);
    return obj.date === todayStr || obj.session === nextId;
  } catch { return false; }
});

if (todayIdx >= 0) {
  updatedLines[todayIdx] = JSON.stringify(newEntry);
} else {
  updatedLines.push(JSON.stringify(newEntry));
}

fs.writeFileSync(logFile, updatedLines.join('\n') + '\n', 'utf-8');
console.log(`✅ Session log updated in ${logFile} for session ${nextId} (${todayStr})`);
