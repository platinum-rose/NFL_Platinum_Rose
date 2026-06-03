// Unit tests for pipelineWorker.js (Phase 4 wiring).
//
// We inject a fake `runner` so no Python is spawned; this lets the suite stay
// portable across Windows dev and the M6 host.

import { describe, it, expect } from 'vitest';
import {
  buildPhase4Worker,
  parsePipelineInput,
} from '../src/pipelineWorker.js';

const cfg = {
  pythonExecutable: '/fake/python',
  pythonCwd: '/fake/cwd',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen3:8b',
};

describe('parsePipelineInput', () => {
  it('accepts string episode_id', () => {
    const out = parsePipelineInput({
      transcript_path: '/x.txt',
      episode_id: 'ep-1',
    });
    expect(out.transcript_path).toBe('/x.txt');
    expect(out.episode_id).toBe('ep-1');
  });

  it('accepts numeric episode_id', () => {
    const out = parsePipelineInput({
      transcript_path: '/x.txt',
      episode_id: 42,
    });
    expect(out.episode_id).toBe(42);
  });

  it('throws 400 on missing transcript_path', () => {
    expect(() =>
      parsePipelineInput({ episode_id: 'ep-1' }),
    ).toThrowError(/transcript_path/);
  });

  it('throws 400 on missing episode_id', () => {
    expect(() =>
      parsePipelineInput({ transcript_path: '/x.txt' }),
    ).toThrowError(/episode_id/);
  });

  it('throws 400 on non-object body', () => {
    expect(() => parsePipelineInput(null)).toThrowError(/object/);
    expect(() => parsePipelineInput('hi')).toThrowError(/object/);
  });
});

describe('buildPhase4Worker', () => {
  it('passes correct argv to the runner and stores stats on run', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return {
        json: {
          model: 'qwen3:8b',
          chunks: 5,
          picks: [{ team: 'KC' }, { team: 'BUF' }],
          dropped: [],
          extraction_quality_score: 0.91,
          fail_ratio: 0.0,
          needs_cloud_fallback: false,
        },
        duration_ms: 1234,
      };
    };
    const worker = buildPhase4Worker({ runner: fakeRunner, cfg });
    const run = { id: 'r1', stats: {} };
    await worker(run, {
      transcript_path: '/var/lib/nfl/transcripts/ep-1.txt',
      episode_id: 'ep-1',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].executable).toBe('/fake/python');
    expect(calls[0].cwd).toBe('/fake/cwd');
    expect(calls[0].args).toEqual([
      '-m', 'nfl_podcast.extract',
      '--transcript', '/var/lib/nfl/transcripts/ep-1.txt',
      '--episode-id', 'ep-1',
      '--ollama-url', 'http://127.0.0.1:11434',
      '--model', 'qwen3:8b',
    ]);

    expect(run.stats).toEqual({
      phase: 4,
      episode_id: 'ep-1',
      model: 'qwen3:8b',
      chunks: 5,
      pick_count: 2,
      dropped_count: 0,
      extraction_quality_score: 0.91,
      fail_ratio: 0.0,
      needs_cloud_fallback: false,
      duration_ms: 1234,
    });
    expect(run.result.picks).toHaveLength(2);
  });

  it('honors per-call ollama overrides', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return { json: { picks: [], dropped: [], chunks: 0 }, duration_ms: 1 };
    };
    const worker = buildPhase4Worker({ runner: fakeRunner, cfg });
    await worker(
      { id: 'r2', stats: {} },
      {
        transcript_path: '/x.txt',
        episode_id: 'ep-2',
        ollama_url: 'http://other:11434',
        model: 'gpt-oss:120b',
      },
    );
    expect(calls[0].args).toContain('http://other:11434');
    expect(calls[0].args).toContain('gpt-oss:120b');
    expect(calls[0].env.OLLAMA_BASE_URL).toBe('http://other:11434');
    expect(calls[0].env.OLLAMA_MODEL).toBe('gpt-oss:120b');
  });

  it('coerces numeric episode_id to string for the CLI arg', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return { json: { picks: [], dropped: [], chunks: 0 }, duration_ms: 1 };
    };
    const worker = buildPhase4Worker({ runner: fakeRunner, cfg });
    await worker({ id: 'r3', stats: {} }, {
      transcript_path: '/x.txt',
      episode_id: 99,
    });
    const idx = calls[0].args.indexOf('--episode-id');
    expect(calls[0].args[idx + 1]).toBe('99');
  });

  it('flags needs_cloud_fallback=true on stats when extractor reports it', async () => {
    const fakeRunner = async () => ({
      json: {
        picks: [],
        dropped: [{ chunk: 1 }, { chunk: 2 }],
        chunks: 3,
        fail_ratio: 0.67,
        extraction_quality_score: 0.2,
        needs_cloud_fallback: true,
      },
      duration_ms: 500,
    });
    const worker = buildPhase4Worker({ runner: fakeRunner, cfg });
    const run = { id: 'r4', stats: {} };
    await worker(run, { transcript_path: '/x.txt', episode_id: 'ep-4' });
    expect(run.stats.needs_cloud_fallback).toBe(true);
    expect(run.stats.dropped_count).toBe(2);
    expect(run.stats.fail_ratio).toBe(0.67);
  });
});
