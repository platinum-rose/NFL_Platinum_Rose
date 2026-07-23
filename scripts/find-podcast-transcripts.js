#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_TERMS = [
  '2026-07-01',
  '2026 NFL Week 1 Betting Predictions',
  'Sharp Picks Before the Market Adjusts',
  'Ep. 1013',
  '1013',
  '2026-07-15',
  'NFL Futures Betting',
  'Favorite Long Shot Picks',
  'Our Favorite Long Shot Picks',
  'Ep. 1018',
  '1018',
];

const DEFAULT_EXTENSIONS = new Set([
  '.json',
  '.jsonl',
  '.md',
  '.txt',
  '.vtt',
  '.srt',
  '.csv',
  '.tsv',
  '.xml',
  '.html',
  '.htm',
]);

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build',
  '.next',
  '.vite',
  'coverage',
]);

function parseArgs(argv) {
  const args = {
    roots: [],
    terms: [],
    json: false,
    maxSizeMb: 25,
    limit: 200,
    content: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--root' && next) {
      args.roots.push(next);
      i += 1;
    } else if ((arg === '--term' || arg === '--title' || arg === '--episode' || arg === '--date') && next) {
      args.terms.push(next);
      i += 1;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--filenames-only') {
      args.content = false;
    } else if (arg === '--max-size-mb' && next) {
      args.maxSizeMb = Number(next) || args.maxSizeMb;
      i += 1;
    } else if (arg === '--limit' && next) {
      args.limit = Number(next) || args.limit;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  if (!args.roots.length) {
    const home = os.homedir();
    args.roots = [
      path.resolve('packages/m6-podcast-service'),
      path.resolve('.'),
      path.join(home, 'projects', 'NFL_Dashboard'),
      path.join(home, 'projects'),
      path.join(home, 'data'),
      'E:\\data\\Obsidian\\NFL\\Podcasts',
    ];
  }

  if (!args.terms.length) args.terms = DEFAULT_TERMS;
  args.terms = args.terms.map((term) => term.toLowerCase());
  return args;
}

function printHelp() {
  console.log(`
Find local podcast transcript/diarization files by filename and text content.

Usage:
  node scripts/find-podcast-transcripts.js --root E:\\dev\\projects\\M6
  node scripts/find-podcast-transcripts.js --root E:\\dev\\projects --term "Ep. 1018"
  node scripts/find-podcast-transcripts.js --root E:\\dev --filenames-only

Options:
  --root <dir>          Directory to search. Can be repeated.
  --term <text>         Text to search. Can be repeated. Defaults to the two BettingPros episodes.
  --date <text>         Alias for --term.
  --episode <text>      Alias for --term.
  --title <text>        Alias for --term.
  --filenames-only      Do not inspect file contents.
  --max-size-mb <n>     Skip content search for files larger than n MB. Default: 25.
  --limit <n>           Stop after n matches. Default: 200.
  --json                Print machine-readable JSON.
`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function hasAnyTerm(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

function isTextCandidate(filePath) {
  return DEFAULT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function* walk(root) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function findMatches(args) {
  const results = [];
  const maxBytes = args.maxSizeMb * 1024 * 1024;

  for (const root of args.roots) {
    const resolvedRoot = path.resolve(root);
    if (!(await exists(resolvedRoot))) continue;

    for await (const filePath of walk(resolvedRoot)) {
      const fileNameMatches = hasAnyTerm(path.basename(filePath), args.terms);
      let contentMatches = [];
      let size = 0;
      let mtime = null;

      try {
        const stat = await fs.stat(filePath);
        size = stat.size;
        mtime = stat.mtime.toISOString();
        if (args.content && size <= maxBytes && isTextCandidate(filePath)) {
          const text = await fs.readFile(filePath, 'utf8');
          contentMatches = hasAnyTerm(text, args.terms);
        }
      } catch {
        continue;
      }

      if (fileNameMatches.length || contentMatches.length) {
        results.push({
          file: filePath,
          size,
          mtime,
          filename_matches: fileNameMatches,
          content_matches: contentMatches,
        });
      }

      if (results.length >= args.limit) return results;
    }
  }

  return results;
}

function printResults(results, args) {
  if (args.json) {
    console.log(JSON.stringify({ count: results.length, results }, null, 2));
    return;
  }

  if (!results.length) {
    console.log('No matching files found.');
    return;
  }

  for (const result of results) {
    const matches = [...new Set([...result.filename_matches, ...result.content_matches])].join(', ');
    console.log(result.file);
    console.log(`  size=${result.size} bytes  modified=${result.mtime}`);
    console.log(`  matched=${matches}`);
  }
  console.log(`\n${results.length} matching file(s) found.`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
} else {
  const results = await findMatches(args);
  printResults(results, args);
}
