// Pick/intel extraction provider chain for agents/podcast-ingest.js.
//
// 2026-09-19: the OpenAI account ran out of credits and every podcast episode since ~Sep 8
// failed extraction. Worse, each failure had already paid AssemblyAI to transcribe the
// episode, the transcript was discarded, and the run kept going (failed episodes did not
// count toward MAX_PER_RUN). This module:
//   - puts Gemini first by default (cheapest; free-tier eligible), then Claude, then GPT-4o,
//     overridable via EXTRACTION_PROVIDER_ORDER="gemini,claude,gpt-4o";
//   - marks a provider DEAD for the rest of the run on billing/auth errors ("no credits",
//     invalid key, 401/403) so it is not retried per episode;
//   - throws ExtractionUnavailableError once every configured provider is dead, so the caller
//     stops the whole run BEFORE paying to transcribe more episodes.

export const PROVIDER_KEYS = Object.freeze(['gemini', 'claude', 'gpt-4o']);
export const DEFAULT_EXTRACTION_ORDER = Object.freeze(['gemini', 'claude', 'gpt-4o']);

export class ExtractionUnavailableError extends Error {
  constructor(details = []) {
    super(`No usable extraction provider left this run (all configured providers failed with billing/auth errors) — ${details.join(' | ')}`);
    this.name = 'ExtractionUnavailableError';
  }
}

export function parseProviderOrder(value) {
  if (!value) return [...DEFAULT_EXTRACTION_ORDER];
  const aliases = { openai: 'gpt-4o', gpt: 'gpt-4o', 'gpt4o': 'gpt-4o', anthropic: 'claude', google: 'gemini' };
  const order = String(value)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .map((s) => aliases[s] || s)
    .filter((s) => PROVIDER_KEYS.includes(s));
  const unique = [...new Set(order)];
  return unique.length ? unique : [...DEFAULT_EXTRACTION_ORDER];
}

// Errors that will not go away by retrying within this run.
const FATAL_PATTERNS = [
  /no credits remaining/i,
  /insufficient[_ ]quota/i,
  /credit balance is too low/i,
  /billing/i,
  /invalid[_ ]api[_ ]key/i,
  /api key not valid/i,
  /incorrect api key/i,
  /authentication[_ ]error/i,
  /permission[_ ]denied/i,
  /\b(401|403)\b/,
  /API_KEY_INVALID/,
];

export function isFatalProviderError(message = '') {
  return FATAL_PATTERNS.some((re) => re.test(String(message)));
}

/**
 * Run providers in order, skipping ones without keys or already dead.
 * @param {Array<{key:string,label:string,keyPresent:boolean,run:Function}>} providers ordered
 * @param {Set<string>} deadProviders mutated: fatal failures are added
 * @param {Array} args passed to provider.run
 * @param {{warn:Function}} log
 * @returns {Promise<{result:any, provider:object}>}
 */
export async function runExtractionChain(providers, deadProviders, args = [], log = console) {
  const errors = [];
  for (const provider of providers) {
    if (!provider.keyPresent || deadProviders.has(provider.key)) continue;
    try {
      const result = await provider.run(...args);
      return { result, provider };
    } catch (err) {
      const msg = String(err?.message || err).slice(0, 200);
      if (isFatalProviderError(msg)) {
        deadProviders.add(provider.key);
        log.warn(`    ⛔ ${provider.label} disabled for the rest of this run (billing/auth): ${msg}`);
      } else {
        log.warn(`    ⚠ ${provider.label} extraction failed: ${msg} — trying next provider`);
      }
      errors.push(`${provider.label}: ${msg}`);
    }
  }
  const live = providers.filter((p) => p.keyPresent && !deadProviders.has(p.key));
  if (live.length === 0) throw new ExtractionUnavailableError(errors.length ? errors : ['no provider API keys configured']);
  throw new Error(`All extraction providers failed — ${errors.join(' | ')}`);
}

export function liveProviderCount(providers, deadProviders) {
  return providers.filter((p) => p.keyPresent && !deadProviders.has(p.key)).length;
}
