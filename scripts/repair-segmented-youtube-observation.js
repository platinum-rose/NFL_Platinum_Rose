#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const id = process.argv[2];

if (!id) {
  console.error('Usage: node scripts/repair-segmented-youtube-observation.js youtube-VIDEO_ID');
  process.exit(1);
}

const obsPath = path.join(ROOT, 'data', 'shadow-harness', 'observations', `${id}-shadow-youtube.json`);
const rawPath = path.join(ROOT, 'data', 'shadow-harness', 'observations', `${id}-raw-gemini-youtube.json`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseSegmentResponses(rawModelResponse) {
  const outer = JSON.parse(rawModelResponse || '[]');
  return outer.map(item => JSON.parse(item));
}

function lastCoveredTimestamp(parsed) {
  let last = 0;
  for (const segment of parsed.speaker_segments || []) {
    last = Math.max(last, Number(segment.end || 0));
  }
  for (const item of [...(parsed.extracted_picks || []), ...(parsed.analysis_notes || [])]) {
    last = Math.max(last, Number(item.source_timestamp || 0));
  }
  return last;
}

function segmentCoverage(parsed) {
  const check = parsed.coverage_check || {};
  const start = Number(check.segment_start_seconds || 0);
  const end = Number(check.segment_end_seconds || check.video_duration_seconds || 0);
  const last = lastCoveredTimestamp(parsed);
  const span = Math.max(1, end - start);
  const ratio = Math.max(0, last - start) / span;
  return {
    last_covered_timestamp: last,
    self_reported_reached_end: check.reached_end_of_video,
    duration_used_for_check: Number(check.video_duration_seconds || 0),
    segment_start_seconds: start,
    segment_end_seconds: end,
    suspected_incomplete: ratio < 0.85,
    reason: ratio < 0.85 ? `segment covered ${Math.round(ratio * 100)}% of requested window` : null,
    coverage_ratio: Number(ratio.toFixed(3))
  };
}

const observation = readJson(obsPath);
if (observation.run?.input_source !== 'youtube_video_url_segmented') {
  console.error(`${id} is not a segmented YouTube observation.`);
  process.exit(1);
}

const parsedSegments = parseSegmentResponses(observation.run.raw_model_response);
const coverages = parsedSegments.map(segmentCoverage);
const incomplete = coverages.filter(item => item.suspected_incomplete);
const durationSeconds = Number(observation.run.coverage_assessment?.duration_used_for_check || 0);
const lastCovered = Math.max(0, ...coverages.map(item => item.last_covered_timestamp));
const coverage = {
  last_covered_timestamp: lastCovered,
  self_reported_reached_end: incomplete.length === 0,
  duration_used_for_check: durationSeconds,
  suspected_incomplete: incomplete.length > 0,
  reason: incomplete.map(item => item.reason).filter(Boolean).join('; ') || null,
  coverage_ratio: incomplete.length === 0 ? 1 : null,
  segment_count: coverages.length,
  segment_seconds: observation.run.coverage_assessment?.segment_seconds || null,
  segment_coverages: coverages
};

observation.reprocess_required = coverage.suspected_incomplete;
observation.reprocess_reason = coverage.reason;
observation.quality_flags = coverage.suspected_incomplete ? ['incomplete_youtube_coverage'] : [];
observation.run.coverage_assessment = coverage;

const raw = readJson(rawPath);
raw.coverage_assessment = coverage;
raw.reprocess_required = coverage.suspected_incomplete;
raw.reprocess_reason = coverage.reason;

writeJson(obsPath, observation);
writeJson(rawPath, raw);

console.log(`Repaired ${id}: reprocess_required=${observation.reprocess_required}, segments=${coverages.length}, last=${lastCovered}s`);
