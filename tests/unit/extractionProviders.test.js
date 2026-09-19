// Regression 2026-09-19: podcast extraction was GPT-4o-only in practice; with OpenAI out of
// credits every episode failed after paying AssemblyAI, and the run kept going.
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXTRACTION_ORDER,
  ExtractionUnavailableError,
  isFatalProviderError,
  parseProviderOrder,
  runExtractionChain,
} from '../../agents/lib/extraction-providers.js';

const quiet = { warn: vi.fn() };
const OPENAI_NO_CREDITS = 'GPT-4o error: { "error": { "message": "You have no credits remaining. Add credits to continue using the API"';

const provider = (key, run, keyPresent = true) => ({ key, label: key, keyPresent, run });

describe('extraction provider order', () => {
  it('defaults to Gemini first', () => {
    expect(DEFAULT_EXTRACTION_ORDER[0]).toBe('gemini');
    expect(parseProviderOrder(undefined)).toEqual(['gemini', 'claude', 'gpt-4o']);
  });
  it('accepts overrides and aliases, dropping unknowns', () => {
    expect(parseProviderOrder('openai, anthropic ,bogus')).toEqual(['gpt-4o', 'claude']);
    expect(parseProviderOrder('bogus')).toEqual(['gemini', 'claude', 'gpt-4o']);
  });
});

describe('isFatalProviderError', () => {
  it('treats billing/auth failures as fatal for the run', () => {
    expect(isFatalProviderError(OPENAI_NO_CREDITS)).toBe(true);
    expect(isFatalProviderError('Gemini error: API key not valid. Please pass a valid API key.')).toBe(true);
    expect(isFatalProviderError('Claude error: {"type":"authentication_error"}')).toBe(true);
  });
  it('treats transient failures as retryable', () => {
    expect(isFatalProviderError('Gemini error: 503 model overloaded')).toBe(false);
    expect(isFatalProviderError('Claude returned invalid JSON: ...')).toBe(false);
  });
});

describe('runExtractionChain', () => {
  it('uses the first working provider and skips ones without keys', async () => {
    const dead = new Set();
    const gpt = vi.fn();
    const { result, provider: used } = await runExtractionChain(
      [provider('gemini', async () => ({ picks: [1] }), false), provider('claude', async () => ({ picks: [2] })), provider('gpt-4o', gpt)],
      dead, [], quiet,
    );
    expect(used.key).toBe('claude');
    expect(result.picks).toEqual([2]);
    expect(gpt).not.toHaveBeenCalled();
  });

  it('marks an out-of-credits provider dead so later episodes skip it', async () => {
    const dead = new Set();
    const openai = vi.fn(async () => { throw new Error(OPENAI_NO_CREDITS); });
    const gemini = vi.fn(async () => ({ picks: [] }));
    const providers = [provider('gpt-4o', openai), provider('gemini', gemini)];
    await runExtractionChain(providers, dead, [], quiet);
    await runExtractionChain(providers, dead, [], quiet);
    expect(dead.has('gpt-4o')).toBe(true);
    expect(openai).toHaveBeenCalledTimes(1); // not re-tried on the second episode
    expect(gemini).toHaveBeenCalledTimes(2);
  });

  it('throws ExtractionUnavailableError when every configured provider is dead (the 2026-09-19 run)', async () => {
    const dead = new Set();
    const providers = [
      provider('gemini', async () => ({}), false),
      provider('claude', async () => ({}), false),
      provider('gpt-4o', async () => { throw new Error(OPENAI_NO_CREDITS); }),
    ];
    await expect(runExtractionChain(providers, dead, [], quiet)).rejects.toBeInstanceOf(ExtractionUnavailableError);
  });

  it('throws a plain (retryable) error when failures are transient', async () => {
    const dead = new Set();
    const providers = [provider('gemini', async () => { throw new Error('Gemini error: 503 overloaded'); })];
    const err = await runExtractionChain(providers, dead, [], quiet).catch((e) => e);
    expect(err).not.toBeInstanceOf(ExtractionUnavailableError);
    expect(dead.size).toBe(0);
  });
});
