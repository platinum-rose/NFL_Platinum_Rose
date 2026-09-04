// agents/lib/masterReportGuard.js
// ═══════════════════════════════════════════════════════════════════════════════
// Master Report Extraction & Validation Guard
//
// Prevents LLM refusal messages or truncated responses from being saved as
// valid master reports in scratch/ or synced to Supabase vault_notes.
// ═══════════════════════════════════════════════════════════════════════════════

export class MasterReportValidationError extends Error {
  constructor(message, { reason, details } = {}) {
    super(message);
    this.name = 'MasterReportValidationError';
    this.reason = reason;
    this.details = details;
  }
}

// Regex patterns indicating an LLM refusal response
export const REFUSAL_PATTERNS = [
  /^i'm sorry,?\s*(but\s+)?i (can't|cannot|won't|am unable)/i,
  /^i am sorry,?\s*(but\s+)?i (can't|cannot|won't|am unable)/i,
  /^i cannot (assist|provide|fulfill|complete|generate)/i,
  /^i can't (assist|provide|fulfill|complete|generate)/i,
  /^i am unable to (assist|provide|fulfill|complete|generate)/i,
  /^as an ai (language model|assistant)/i,
  /^sorry,?\s*(but\s+)?(i\s+)?can't/i,
];

// Required markdown sections in standard master reports
export const EXPECTED_SECTIONS = [
  /\*\*Executive Summary:\*\*/i,
  /\*\*Team-by-Team|\*\*Analytical Breakdown|\*\*Key Player/i,
  /\*\*Betting (?:& Fantasy )?Rationale:\*\*/i,
];

/**
 * Validates the raw body of an extracted master report.
 *
 * @param {string} content - Full markdown text or extracted body
 * @param {Object} [options]
 * @param {number} [options.minBytes=500] - Minimum character length for valid report
 * @param {boolean} [options.requireSections=false] - Whether to enforce standard section headers
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateMasterReport(content, { minBytes = 500, requireSections = false } = {}) {
  if (!content || typeof content !== 'string') {
    return { valid: false, reason: 'empty_content' };
  }

  const trimmed = content.trim();

  // 1. Size Check: Refusal files are typically 200-450 bytes vs KB for real reports
  if (trimmed.length < minBytes) {
    return {
      valid: false,
      reason: 'suspiciously_short',
      details: `Length ${trimmed.length} chars is below minimum threshold of ${minBytes}`,
    };
  }

  // Extract body after markdown header line (after --- if present)
  let bodyText = trimmed;
  const headerSplit = trimmed.split(/\n---\s*\n/);
  if (headerSplit.length > 1) {
    bodyText = headerSplit.slice(1).join('\n---\n').trim();
  }

  // 2. Refusal Pattern Check
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(bodyText) || pattern.test(trimmed)) {
      return {
        valid: false,
        reason: 'llm_refusal',
        details: `Content matches refusal pattern: ${pattern.toString()}`,
      };
    }
  }

  // 3. Optional Section Header Enforcement
  if (requireSections) {
    const missingSections = [];
    for (const secPattern of EXPECTED_SECTIONS) {
      if (!secPattern.test(trimmed)) {
        missingSections.push(secPattern.toString());
      }
    }
    if (missingSections.length > 0) {
      return {
        valid: false,
        reason: 'missing_required_sections',
        details: `Missing expected section headers: ${missingSections.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Asserts that the master report content is valid, throwing MasterReportValidationError if not.
 *
 * @param {string} content
 * @param {Object} [options]
 * @throws {MasterReportValidationError}
 */
export function assertValidMasterReport(content, options = {}) {
  const result = validateMasterReport(content, options);
  if (!result.valid) {
    throw new MasterReportValidationError(
      `Master report failed validation: ${result.reason} (${result.details || ''})`,
      { reason: result.reason, details: result.details }
    );
  }
}
