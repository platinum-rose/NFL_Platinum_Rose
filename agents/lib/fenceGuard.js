// agents/lib/fenceGuard.js
// ─────────────────────────────────────────────────────────────────────────────
// Auto-section fence-guard for vault notes (Phase 5 spec §4).
//
// Each auto-managed block looks like:
//
//   ## <Section Header>
//   <!-- auto-start:<rebuilder-version> -->
//   ... regenerated content ...
//   <!-- auto-end -->
//
// Content outside fences is preserved verbatim. The writer refuses to touch a
// note whose existing fences are mismatched (corruption guard) so a partially
// hand-edited file can never be silently overwritten.
//
// Public API:
//   - validateFences(content)         → throws FenceCorruptionError on imbalance
//   - findSection(content, header)    → { start, end, body } | null
//   - replaceSection({ content, header, body, version }) → new content
//   - replaceManySections({ content, sections, version }) → new content
//
// All functions are pure (no I/O).
// ─────────────────────────────────────────────────────────────────────────────

const START_RE = /<!--\s*auto-start(?::[^>]*)?\s*-->/g;
const END_RE   = /<!--\s*auto-end(?::[^>]*)?\s*-->/g;

export class FenceCorruptionError extends Error {
  constructor(message, { reason } = {}) {
    super(message);
    this.name = 'FenceCorruptionError';
    this.reason = reason;
  }
}

/**
 * Throw if the auto-fence markers in `content` are unbalanced or interleaved
 * (e.g. start→start without an intervening end). A missing trailing
 * `auto-end` is a corruption — we never auto-fix it.
 *
 * @param {string} content
 */
export function validateFences(content) {
  if (typeof content !== 'string') return;
  const tokens = [];
  let m;
  START_RE.lastIndex = 0;
  while ((m = START_RE.exec(content)) !== null) {
    tokens.push({ kind: 'start', idx: m.index, len: m[0].length });
  }
  END_RE.lastIndex = 0;
  while ((m = END_RE.exec(content)) !== null) {
    tokens.push({ kind: 'end', idx: m.index, len: m[0].length });
  }
  tokens.sort((a, b) => a.idx - b.idx);

  let depth = 0;
  for (const t of tokens) {
    if (t.kind === 'start') {
      depth += 1;
      if (depth > 1) {
        throw new FenceCorruptionError(
          'nested auto-start before matching auto-end',
          { reason: 'nested_start' },
        );
      }
    } else {
      depth -= 1;
      if (depth < 0) {
        throw new FenceCorruptionError(
          'auto-end without matching auto-start',
          { reason: 'orphan_end' },
        );
      }
    }
  }
  if (depth !== 0) {
    throw new FenceCorruptionError(
      'auto-start without matching auto-end (truncated section?)',
      { reason: 'unterminated_start' },
    );
  }
}

/**
 * Locate an auto section under a specific markdown header.
 *
 * @param {string} content
 * @param {string} header  e.g. '## Podcast Intel'
 * @returns {{ headerIdx: number, startMarkerIdx: number, endMarkerIdx: number, endMarkerEnd: number, body: string } | null}
 */
export function findSection(content, header) {
  validateFences(content);
  const headerLine = header.trimEnd();
  // Match the header at start-of-line.
  const headerEsc = headerLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerRe = new RegExp(`(^|\\n)${headerEsc}\\s*(\\r?\\n)`);
  const hMatch = headerRe.exec(content);
  if (!hMatch) return null;
  const afterHeader = hMatch.index + hMatch[0].length;

  // Look for an auto-start within the next ~1KB after the header (must be the
  // first non-blank thing under it for us to consider this section auto-managed).
  const window = content.slice(afterHeader, afterHeader + 1024);
  const startLocalRe = /<!--\s*auto-start(?::[^>]*)?\s*-->/;
  const sMatch = startLocalRe.exec(window);
  if (!sMatch) return null;
  // Confirm no non-whitespace, non-comment content sits between header and start.
  const between = window.slice(0, sMatch.index);
  if (between.replace(/\s+/g, '').length > 0) return null;

  const startMarkerIdx = afterHeader + sMatch.index;
  const startMarkerEnd = startMarkerIdx + sMatch[0].length;

  const endLocalRe = /<!--\s*auto-end(?::[^>]*)?\s*-->/;
  const eMatch = endLocalRe.exec(content.slice(startMarkerEnd));
  if (!eMatch) {
    throw new FenceCorruptionError(
      `auto-start under "${headerLine}" has no matching auto-end`,
      { reason: 'unterminated_start' },
    );
  }
  const endMarkerIdx = startMarkerEnd + eMatch.index;
  const endMarkerEnd = endMarkerIdx + eMatch[0].length;

  return {
    headerIdx: hMatch.index + (hMatch[1] ? hMatch[1].length : 0),
    startMarkerIdx,
    endMarkerIdx,
    endMarkerEnd,
    body: content.slice(startMarkerEnd, endMarkerIdx).replace(/^\r?\n/, '').replace(/\r?\n$/, ''),
  };
}

/**
 * Replace the body of an auto-managed section, or append a new section to the
 * end of the document if the header doesn't yet exist.
 *
 * @param {object} args
 * @param {string} args.content
 * @param {string} args.header     e.g. '## Podcast Intel'
 * @param {string} args.body       new markdown body (no fences; we add them)
 * @param {string} [args.version]  rebuilder version tag for the start marker
 * @returns {string}
 */
export function replaceSection({ content, header, body, version = 'vault-rebuilder/v1' }) {
  if (typeof content !== 'string') content = '';
  validateFences(content);
  const headerLine = header.trimEnd();
  const fenced =
    `${headerLine}\n` +
    `<!-- auto-start:${version} -->\n` +
    `${body.replace(/\s+$/, '')}\n` +
    `<!-- auto-end -->\n`;

  const existing = findSection(content, headerLine);
  if (!existing) {
    const sep = content.length === 0 || content.endsWith('\n\n')
      ? ''
      : content.endsWith('\n') ? '\n' : '\n\n';
    return content + sep + fenced;
  }
  // Replace from header line through end marker (and trailing newline) so the
  // file stays clean if it already ended with `<!-- auto-end -->\n`.
  const before = content.slice(0, existing.headerIdx);
  let after = content.slice(existing.endMarkerEnd);
  if (after.startsWith('\n')) after = after.slice(1);
  return before + fenced + (after.length > 0 ? after : '');
}

/**
 * Replace several sections in one pass. Order in the input array determines
 * the order of any newly-appended sections. Unknown sections are appended
 * after existing content.
 *
 * @param {object} args
 * @param {string} args.content
 * @param {Array<{header: string, body: string}>} args.sections
 * @param {string} [args.version]
 */
export function replaceManySections({ content, sections, version }) {
  let out = content ?? '';
  for (const s of sections) {
    out = replaceSection({ content: out, header: s.header, body: s.body, version });
  }
  return out;
}
