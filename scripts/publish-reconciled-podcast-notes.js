#!/usr/bin/env node
// Publish canonical, reconciled podcast episode notes from the local generated
// narrative/deep-dive reports. No model, database, or network calls.

import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NARRATIVE_INDEX = path.resolve(ROOT, argValue('--narratives', 'docs/podcast-narratives/index.json'));
const DEEP_DIVE_INDEX = path.resolve(ROOT, argValue('--deep-dives', 'docs/podcast-transcript-deep-dives/index.json'));
const VAULT_ROOT = path.resolve(argValue('--vault', process.env.PODCAST_VAULT_ROOT || 'E:\\data\\Obsidian'));
const OUT_PREFIX = argValue('--prefix', 'NFL/Podcasts/_reconciled');
const WRITE = process.argv.includes('--write');

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'episode';
}

function yamlString(value) {
  return JSON.stringify(cleanText(value));
}

function localPathFromUrl(url) {
  if (!url) return null;
  try {
    return fileURLToPath(url);
  } catch {
    return null;
  }
}

function sourceLink(filePath) {
  return filePath ? pathToFileURL(filePath).href : '';
}

function stripGeneratedTitle(markdown) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.startsWith('# ')) return lines.slice(1).join('\n').trim();
  return markdown.trim();
}

function findDeepDive(deepDiveIndex, ep) {
  const want = [ep.show, ep.title, ep.pub_date].map((v) => cleanText(v).toLowerCase()).join('|');
  return (deepDiveIndex.episodes || []).find((row) =>
    [row.show, row.title, String(row.pub_date || '').slice(0, 10)]
      .map((v) => cleanText(v).toLowerCase()).join('|') === want
  ) ?? null;
}

function renderNote({ ep, narrativeMd, narrativePath, deepDive }) {
  const deepDiveMdPath = localPathFromUrl(deepDive?.markdown);
  const deepDiveHtmlPath = localPathFromUrl(deepDive?.html);
  const body = stripGeneratedTitle(narrativeMd);
  const generated = new Date().toISOString();
  return `---
sensitivity: green
source_system: podcast-narrative-reconciled
show: ${yamlString(ep.show)}
title: ${yamlString(ep.title)}
pub_date: ${yamlString(ep.pub_date)}
futures_count: ${Number(ep.futures_count || 0)}
hosts: ${yamlString((ep.hosts || []).join(', '))}
participants: ${yamlString((ep.participants || []).join(', '))}
narrative_source: ${yamlString(sourceLink(narrativePath))}
deep_dive_source: ${yamlString(sourceLink(deepDiveMdPath))}
generated: ${yamlString(generated)}
---

# ${cleanText(ep.show)} - ${cleanText(ep.title)}

> Canonical reconciled podcast episode note generated offline from local narrative and transcript deep-dive reports. Prefer this note over older per-host \`podcast-host-summary\` notes when citing this episode.

- Narrative HTML: ${sourceLink(localPathFromUrl(ep.html))}
- Narrative Markdown: ${sourceLink(narrativePath)}
- Transcript deep dive HTML: ${sourceLink(deepDiveHtmlPath)}
- Transcript deep dive Markdown: ${sourceLink(deepDiveMdPath)}

${body}
`;
}

async function writeVaultFileAtomic(outPath, content) {
  const vaultRoot = path.resolve(VAULT_ROOT);
  const resolved = path.resolve(outPath);
  if (resolved !== vaultRoot && !resolved.startsWith(vaultRoot + path.sep)) {
    throw new Error(`path traversal blocked: ${outPath}`);
  }
  await mkdir(path.dirname(resolved), { recursive: true });
  const tmpPath = `${resolved}.tmp.${process.pid}.${Date.now()}`;
  try {
    await writeFile(tmpPath, content, 'utf8');
    await rename(tmpPath, resolved);
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}

async function main() {
  const narrativeIndex = JSON.parse(await readFile(NARRATIVE_INDEX, 'utf8'));
  let deepDiveIndex = { episodes: [] };
  try {
    deepDiveIndex = JSON.parse(await readFile(DEEP_DIVE_INDEX, 'utf8'));
  } catch {
    deepDiveIndex = { episodes: [] };
  }

  const writes = [];
  for (const ep of narrativeIndex.episodes || []) {
    const narrativePath = localPathFromUrl(ep.markdown);
    if (!narrativePath) continue;
    const narrativeMd = await readFile(narrativePath, 'utf8');
    const deepDive = findDeepDive(deepDiveIndex, ep);
    const note = renderNote({ ep, narrativeMd, narrativePath, deepDive });
    const relPath = path.join(
      OUT_PREFIX,
      slugify(ep.show),
      `${String(ep.pub_date || 'undated').slice(0, 10)}-${slugify(ep.title)}.md`
    );
    const outPath = path.join(VAULT_ROOT, relPath);
    writes.push({ relPath, outPath, note });
  }

  if (!WRITE) {
    console.log(`dry run: ${writes.length} reconciled podcast note(s) would be written under ${path.join(VAULT_ROOT, OUT_PREFIX)}`);
    for (const row of writes.slice(0, 12)) console.log(`  ${row.relPath}`);
    if (writes.length > 12) console.log(`  ... ${writes.length - 12} more`);
    console.log('rerun with --write to publish');
    return;
  }

  for (const row of writes) {
    await writeVaultFileAtomic(row.outPath, row.note);
  }
  console.log(`wrote ${writes.length} reconciled podcast note(s) under ${path.join(VAULT_ROOT, OUT_PREFIX)}`);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exitCode = 1;
});
