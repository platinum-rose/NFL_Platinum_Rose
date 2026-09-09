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

// Required markdown sections in standard master reports (supports both legacy **Header:** and modern ## 📌 / ## 💡 styles)
export const EXPECTED_SECTIONS = [
  /(?:\*\*Executive Summary:\*\*|##\s*(?:📌\s*)?Executive Summary)/i,
  /(?:\*\*Team-by-Team|\*\*Analytical Breakdown|\*\*Key Player|##\s*🏆)/i,
  /(?:\*\*Betting (?:& Fantasy )?Rationale:\*\*|##\s*(?:💡\s*)?Betting (?:& Fantasy )?Rationale)/i,
];

// Terminal closing sections that must appear near the end of a complete master report
export const TERMINAL_SECTIONS = [
  /(?:##\s*(?:🔍\s*)?Key Citations|##\s*(?:🔍\s*)?Citations & Source Notes|\*\*Key Citations & Source Notes:\*\*|\*\*Citations & Timestamps:\*\*)/i,
  /(?:##\s*(?:💡\s*)?Betting & Fantasy Rationale:\s*Comprehensive Portfolio Strategy|\*\*Betting & Fantasy Rationale:\*\*)/i,
];

// Patterns indicating abrupt mid-sentence or mid-table cutoff at the end of content
export const ABRUPT_CUTOFF_PATTERNS = [
  /(?:\n|^)\s*\|\s*$/,                                                   // ends on a lone open markdown table pipe at EOF
  /(?:is out|ranked no\.?|at the|in the|and the|with the|for the)\s*$/i, // hanging grammatical conjunctions/prepositions at EOF
  /[,:;]\s*$/,                                                           // ends on a hanging comma, colon, or semicolon at EOF
  /(?:[a-zA-Z0-9]\s*-)\s*$/,                                             // ends on a hanging hyphen at EOF (excludes horizontal rules ---)
];

/**
 * Validates the raw body of an extracted master report.
 *
 * @param {string} content - Full markdown text or extracted body
 * @param {Object} [options]
 * @param {number} [options.minBytes=500] - Minimum character length for valid report
 * @param {boolean} [options.requireSections=false] - Whether to enforce standard section headers
 * @param {boolean} [options.requireTerminalSection=false] - Whether to enforce a closing citations/strategy section
 * @returns {{ valid: boolean, reason?: string, details?: string }}
 */
export function validateMasterReport(content, { minBytes = 500, requireSections = false, requireTerminalSection = false } = {}) {
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

  // Strip audit receipt comment if present before tail checking
  const contentWithoutReceipt = trimmed.replace(/\n*---\n<!-- Extraction Provenance:[\s\S]+?-->\s*$/, '').trim();

  // Extract body after markdown header line (after --- if present)
  let bodyText = contentWithoutReceipt;
  const headerSplit = contentWithoutReceipt.split(/\n---\s*\n/);
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

  // 3. Abrupt Truncation Check: Detect mid-sentence / mid-table termination
  for (const cutoffPattern of ABRUPT_CUTOFF_PATTERNS) {
    if (cutoffPattern.test(contentWithoutReceipt)) {
      return {
        valid: false,
        reason: 'truncated_output',
        details: `Content appears cut off at the tail: matches pattern ${cutoffPattern.toString()}`,
      };
    }
  }

  // 4. Section Header Enforcement
  if (requireSections) {
    const missingSections = [];
    for (const secPattern of EXPECTED_SECTIONS) {
      if (!secPattern.test(contentWithoutReceipt)) {
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

  // 5. Terminal Section Check
  if (requireTerminalSection) {
    const hasTerminal = TERMINAL_SECTIONS.some((pattern) => pattern.test(contentWithoutReceipt));
    if (!hasTerminal) {
      return {
        valid: false,
        reason: 'missing_terminal_section',
        details: 'Report lacks a recognized closing section (Citations / Portfolio Strategy).',
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
