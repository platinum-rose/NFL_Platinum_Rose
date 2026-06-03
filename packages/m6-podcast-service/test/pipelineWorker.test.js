// Unit tests for pipelineWorker.js (Phase 4 wiring).
//
// We inject a fake `runner` so no Python is spawned; this lets the suite stay
// portable across Windows dev and the M6 host.

import { describe, it, expect } from 'vitest';
import {
  buildPhase3Worker,
  buildPhase4Worker,
  buildFullPipelineWorker,
  buildPipelineWorker,
  parsePipelineInput,
} from '../src/pipelineWorker.js';

const cfg = {
  pythonExecutable: '/fake/python',
  pythonCwd: '/fake/cwd',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen2.5:3b',
  whisperModel: 'large-v3-turbo',
  whisperModelDir: '/var/lib/nfl/models',
  transcriptDir: '/var/lib/nfl/transcripts',
};

describe('parsePipelineInput', () => {
  it('extract mode: accepts string episode_id + transcript_path', () => {
    const out = parsePipelineInput({
      transcript_path: '/x.txt',
      episode_id: 'ep-1',
    });
    expect(out.mode).toBe('extract');
    expect(out.transcript_path).toBe('/x.txt');
    expect(out.episode_id).toBe('ep-1');
  });

  it('extract mode: accepts numeric episode_id', () => {
    const out = parsePipelineInput({
      transcript_path: '/x.txt',
      episode_id: 42,
    });
    expect(out.episode_id).toBe(42);
  });

  it('full mode: defaults when audio_path is given', () => {
    const out = parsePipelineInput({
      audio_path: '/a.mp3',
      episode_id: 'ep-2',
    });
    expect(out.mode).toBe('full');
    expect(out.audio_path).toBe('/a.mp3');
    expect(out.transcript_path).toBeUndefined();
  });

  it('transcribe-only mode when pipeline=transcribe', () => {
    const out = parsePipelineInput({
      audio_path: '/a.mp3',
      episode_id: 'ep-3',
      pipeline: 'transcribe',
    });
    expect(out.mode).toBe('transcribe');
  });

  it('throws 400 when neither audio_path nor transcript_path is given', () => {
    expect(() =>
      parsePipelineInput({ episode_id: 'ep-1' }),
    ).toThrowError(/transcript_path or audio_path/);
  });

  it('throws 400 when both audio_path and transcript_path are given', () => {
    expect(() =>
      parsePipelineInput({
        audio_path: '/a.mp3',
        transcript_path: '/x.txt',
        episode_id: 'ep-1',
      }),
    ).toThrowError(/either transcript_path or audio_path/);
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
          model: 'qwen2.5:3b',
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
      '--model', 'qwen2.5:3b',
    ]);

    expect(run.stats).toEqual({
      phase: 4,
      episode_id: 'ep-1',
      model: 'qwen2.5:3b',
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

describe('buildPhase3Worker', () => {
  it('passes correct argv to runner and stores transcribe stats', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return {
        json: {
          model: 'large-v3-turbo',
          audio_duration_sec: 1234.5,
          chunked: false,
          segment_count: 87,
          txt: '/var/lib/nfl/transcripts/ep-1.txt',
          segments_json: '/var/lib/nfl/transcripts/ep-1.segments.json',
        },
        duration_ms: 9000,
      };
    };
    const worker = buildPhase3Worker({ runner: fakeRunner, cfg });
    const run = { id: 'r5', stats: {} };
    await worker(run, {
      audio_path: '/var/lib/nfl/audio/ep-1.mp3',
      episode_id: 'ep-1',
    });

    expect(calls[0].executable).toBe('/fake/python');
    expect(calls[0].cwd).toBe('/fake/cwd');
    expect(calls[0].args).toEqual([
      '-m', 'nfl_podcast.transcribe',
      '--audio', '/var/lib/nfl/audio/ep-1.mp3',
      '--episode-id', 'ep-1',
      '--out-dir', '/var/lib/nfl/transcripts',
      '--model', 'large-v3-turbo',
      '--model-dir', '/var/lib/nfl/models',
    ]);
    expect(calls[0].env.WHISPER_MODEL).toBe('large-v3-turbo');
    expect(calls[0].env.NFL_TRANSCRIPT_DIR).toBe('/var/lib/nfl/transcripts');
    expect(calls[0].timeoutMs).toBeGreaterThan(10 * 60_000); // > 10 min

    expect(run.stats).toEqual({
      phase: 3,
      episode_id: 'ep-1',
      model: 'large-v3-turbo',
      audio_duration_sec: 1234.5,
      chunked: false,
      segment_count: 87,
      transcript_path: '/var/lib/nfl/transcripts/ep-1.txt',
      segments_json_path: '/var/lib/nfl/transcripts/ep-1.segments.json',
      duration_ms: 9000,
    });
  });

  it('honors per-call whisper overrides', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return { json: { txt: '/x.txt', segment_count: 1 }, duration_ms: 1 };
    };
    const worker = buildPhase3Worker({ runner: fakeRunner, cfg });
    await worker(
      { id: 'r6', stats: {} },
      {
        audio_path: '/a.mp3',
        episode_id: 'ep-6',
        whisper_model: 'small',
        whisper_model_dir: '/tmp/models',
        transcript_dir: '/tmp/tx',
      },
    );
    expect(calls[0].args).toContain('small');
    expect(calls[0].args).toContain('/tmp/models');
    expect(calls[0].args).toContain('/tmp/tx');
    expect(calls[0].env.WHISPER_MODEL).toBe('small');
    expect(calls[0].env.WHISPER_MODEL_DIR).toBe('/tmp/models');
    expect(calls[0].env.NFL_TRANSCRIPT_DIR).toBe('/tmp/tx');
  });
});

describe('buildFullPipelineWorker', () => {
  it('chains transcribe → extract, feeding txt path forward', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      if (opts.args[1] === 'nfl_podcast.transcribe') {
        return {
          json: {
            model: 'large-v3-turbo',
            audio_duration_sec: 600,
            chunked: false,
            segment_count: 42,
            txt: '/var/lib/nfl/transcripts/ep-7.txt',
            segments_json: '/var/lib/nfl/transcripts/ep-7.segments.json',
          },
          duration_ms: 5000,
        };
      }
      // extract
      return {
        json: {
          model: 'qwen2.5:3b',
          chunks: 3,
          picks: [{ team: 'KC' }],
          dropped: [],
          extraction_quality_score: 0.8,
          fail_ratio: 0,
          needs_cloud_fallback: false,
        },
        duration_ms: 7000,
      };
    };
    const worker = buildFullPipelineWorker({ runner: fakeRunner, cfg });
    const run = { id: 'r7', stats: {} };
    await worker(run, {
      audio_path: '/var/lib/nfl/audio/ep-7.mp3',
      episode_id: 'ep-7',
    });

    expect(calls).toHaveLength(2);
    // Phase 3 first
    expect(calls[0].args[1]).toBe('nfl_podcast.transcribe');
    // Phase 4 next, with txt path from phase 3
    expect(calls[1].args[1]).toBe('nfl_podcast.extract');
    const txIdx = calls[1].args.indexOf('--transcript');
    expect(calls[1].args[txIdx + 1]).toBe('/var/lib/nfl/transcripts/ep-7.txt');

    expect(run.stats.phase).toBe('full');
    expect(run.stats.pick_count).toBe(1);
    expect(run.stats.extraction_quality_score).toBe(0.8);
    expect(run.stats.transcript_path).toBe('/var/lib/nfl/transcripts/ep-7.txt');
    expect(run.stats.phase3.segment_count).toBe(42);
    expect(run.stats.phase4.chunks).toBe(3);
    expect(run.result.transcribe).toBeDefined();
    expect(run.result.extract).toBeDefined();
  });

  it('throws if transcribe step returns no txt path', async () => {
    const fakeRunner = async (opts) => {
      if (opts.args[1] === 'nfl_podcast.transcribe') {
        return { json: { segment_count: 0 }, duration_ms: 1 };
      }
      return { json: {}, duration_ms: 1 };
    };
    const worker = buildFullPipelineWorker({ runner: fakeRunner, cfg });
    await expect(
      worker({ id: 'r8', stats: {} }, { audio_path: '/a.mp3', episode_id: 'ep-8' }),
    ).rejects.toThrow(/txt path/);
  });
});

describe('buildPipelineWorker (router)', () => {
  it('routes mode=extract to phase4', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return { json: { picks: [], dropped: [], chunks: 0 }, duration_ms: 1 };
    };
    const worker = buildPipelineWorker({ runner: fakeRunner, cfg });
    await worker(
      { id: 'r9', stats: {} },
      { mode: 'extract', transcript_path: '/x.txt', episode_id: 'ep-9' },
    );
    expect(calls[0].args[1]).toBe('nfl_podcast.extract');
  });

  it('routes mode=transcribe to phase3', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      return { json: { txt: '/x.txt', segment_count: 0 }, duration_ms: 1 };
    };
    const worker = buildPipelineWorker({ runner: fakeRunner, cfg });
    await worker(
      { id: 'r10', stats: {} },
      { mode: 'transcribe', audio_path: '/a.mp3', episode_id: 'ep-10' },
    );
    expect(calls[0].args[1]).toBe('nfl_podcast.transcribe');
  });

  it('routes mode=full to chained worker', async () => {
    const calls = [];
    const fakeRunner = async (opts) => {
      calls.push(opts);
      if (opts.args[1] === 'nfl_podcast.transcribe') {
        return { json: { txt: '/x.txt', segment_count: 1 }, duration_ms: 1 };
      }
      return { json: { picks: [], dropped: [], chunks: 0 }, duration_ms: 1 };
    };
    const worker = buildPipelineWorker({ runner: fakeRunner, cfg });
    await worker(
      { id: 'r11', stats: {} },
      { mode: 'full', audio_path: '/a.mp3', episode_id: 'ep-11' },
    );
    expect(calls.map((c) => c.args[1])).toEqual([
      'nfl_podcast.transcribe',
      'nfl_podcast.extract',
    ]);
  });

  it('throws on unknown mode', async () => {
    const worker = buildPipelineWorker({ runner: async () => ({ json: {} }), cfg });
    await expect(
      worker({ id: 'rX', stats: {} }, { mode: 'bogus' }),
    ).rejects.toThrow(/unknown pipeline mode/);
  });
});
