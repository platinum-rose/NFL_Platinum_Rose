// src/lib/vaultClient.js
// ═══════════════════════════════════════════════════════════════════════════════
// VaultClient — dual-backend NFL betting vault (Obsidian REST ↔ Supabase)
//
// Backend is selected by env var:
//   VITE_VAULT_BACKEND=obsidian  (default for local dev)
//   VITE_VAULT_BACKEND=supabase  (production / shared dashboard)
//
// Obsidian backend:
//   Requires the "Local REST API" community plugin to be installed and running.
//   Plugin settings: Community Plugins → Local REST API → Enable → copy API key.
//   Env vars: VITE_OBSIDIAN_API_URL  (default https://localhost:27123)
//             VITE_OBSIDIAN_API_KEY  (from plugin settings)
//
// Supabase backend:
//   Uses the vault_notes table (migration 012). No extra env vars required —
//   uses the same VITE_SUPABASE_* config as the rest of the app.
//
// Migration path: Obsidian → Supabase
//   Run agents/obsidian-vault-sync.js to copy notes from Obsidian into
//   vault_notes, then flip VITE_VAULT_BACKEND=supabase in your hosting env.
//   The agent tools and system prompt injection are backend-agnostic.
// ═══════════════════════════════════════════════════════════════════════════════

import logger from './logger';
import { supabase, isAvailable as supabaseAvailable } from './supabase.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const BACKEND = (import.meta.env.VITE_VAULT_BACKEND || 'obsidian').toLowerCase();

const OBSIDIAN_URL = (
  import.meta.env.VITE_OBSIDIAN_API_URL || 'https://localhost:27123'
).replace(/\/$/, '');

const OBSIDIAN_KEY = import.meta.env.VITE_OBSIDIAN_API_KEY || '';

// NFL vault subfolder within Obsidian (all reads/writes are scoped here)
const OBSIDIAN_VAULT_PREFIX = import.meta.env.VITE_OBSIDIAN_NFL_PREFIX || 'NFL';

// ─── Obsidian REST API backend ─────────────────────────────────────────────────

/**
 * Fetch a vault note from the Obsidian Local REST API.
 * Obsidian paths are relative to the vault root.
 *
 * @param {string} path  - e.g. "NFL/Reference/CoachTendencies.md"
 * @returns {Promise<string|null>}
 */
async function obsidianRead(path) {
  if (!OBSIDIAN_KEY) {
    logger.warn('[vault] VITE_OBSIDIAN_API_KEY not set — cannot read from Obsidian');
    return null;
  }
  try {
    const res = await fetch(`${OBSIDIAN_URL}/vault/${encodeURIComponent(path)}`, {
      headers: {
        Authorization: `Bearer ${OBSIDIAN_KEY}`,
        Accept: 'text/markdown',
      },
      // Self-signed cert on localhost — skip verification in dev only
      ...(typeof window !== 'undefined' ? {} : { rejectUnauthorized: false }),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      logger.warn(`[vault] Obsidian read error ${res.status} for ${path}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    logger.warn('[vault] Obsidian read failed:', e.message);
    return null;
  }
}

/**
 * Write / update a vault note via the Obsidian Local REST API.
 *
 * @param {string} path     - e.g. "NFL/Sessions/2026-09-07.md"
 * @param {string} content  - Markdown content
 * @returns {Promise<boolean>}
 */
async function obsidianWrite(path, content) {
  if (!OBSIDIAN_KEY) {
    logger.warn('[vault] VITE_OBSIDIAN_API_KEY not set — cannot write to Obsidian');
    return false;
  }
  try {
    const res = await fetch(`${OBSIDIAN_URL}/vault/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${OBSIDIAN_KEY}`,
        'Content-Type': 'text/markdown',
      },
      body: content,
    });
    if (!res.ok) {
      logger.warn(`[vault] Obsidian write error ${res.status} for ${path}`);
      return false;
    }
    return true;
  } catch (e) {
    logger.warn('[vault] Obsidian write failed:', e.message);
    return false;
  }
}

/**
 * List all notes under a folder prefix in the Obsidian vault.
 *
 * @param {string} prefix  - e.g. "NFL/Reference"
 * @returns {Promise<string[]>}  - list of relative paths
 */
async function obsidianList(prefix) {
  if (!OBSIDIAN_KEY) return [];
  try {
    const res = await fetch(`${OBSIDIAN_URL}/vault/${encodeURIComponent(prefix)}/`, {
      headers: { Authorization: `Bearer ${OBSIDIAN_KEY}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Obsidian REST API returns { files: ['path1', 'path2', ...] }
    return (data.files || []).filter(f => f.endsWith('.md'));
  } catch (e) {
    logger.warn('[vault] Obsidian list failed:', e.message);
    return [];
  }
}

// ─── Supabase backend ──────────────────────────────────────────────────────────

async function supabaseRead(path) {
  if (!supabaseAvailable()) return null;
  try {
    const { data, error } = await supabase
      .from('vault_notes')
      .select('content')
      .eq('path', path)
      .maybeSingle();
    if (error || !data) return null;
    return data.content;
  } catch (e) {
    logger.warn('[vault] Supabase read failed:', e.message);
    return null;
  }
}

async function supabaseWrite(path, content, tags = [], source = 'agent') {
  if (!supabaseAvailable()) return false;
  try {
    const { error } = await supabase
      .from('vault_notes')
      .upsert({ path, content, tags, source }, { onConflict: 'path' });
    if (error) {
      logger.warn('[vault] Supabase write failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    logger.warn('[vault] Supabase write failed:', e.message);
    return false;
  }
}

async function supabaseList(prefix) {
  if (!supabaseAvailable()) return [];
  try {
    const { data, error } = await supabase
      .from('vault_notes')
      .select('path')
      .like('path', `${prefix}%`);
    if (error || !data) return [];
    return data.map(r => r.path);
  } catch (e) {
    logger.warn('[vault] Supabase list failed:', e.message);
    return [];
  }
}

async function supabaseSearch(query) {
  if (!supabaseAvailable()) return [];
  try {
    const ftsQuery = query.trim().split(/\s+/).join(' & ');
    const { data, error } = await supabase
      .from('vault_notes')
      .select('path, content, tags, updated_at')
      .textSearch('tsv', ftsQuery, { type: 'plain', config: 'english' })
      .order('updated_at', { ascending: false })
      .limit(10);
    if (error || !data) return [];
    return data;
  } catch (e) {
    logger.warn('[vault] Supabase search failed:', e.message);
    return [];
  }
}

// ─── Public VaultClient API ────────────────────────────────────────────────────

/**
 * Read a note from the active vault backend.
 *
 * @param {string} path  - Vault-relative path (e.g. "NFL/Reference/DVOA.md")
 * @returns {Promise<string|null>}  - Markdown content or null if not found
 */
export async function readVaultNote(path) {
  if (BACKEND === 'supabase') return supabaseRead(path);
  return obsidianRead(path);
}

/**
 * Write (create or overwrite) a note in the active vault backend.
 *
 * @param {string}   path     - Vault-relative path
 * @param {string}   content  - Markdown content
 * @param {string[]} tags     - Optional tags (Supabase backend only)
 * @returns {Promise<boolean>}  - true on success
 */
export async function writeVaultNote(path, content, tags = []) {
  if (BACKEND === 'supabase') return supabaseWrite(path, content, tags, 'agent');
  return obsidianWrite(path, content);
}

/**
 * List note paths under a folder prefix.
 *
 * @param {string} prefix  - e.g. "NFL/Reference"
 * @returns {Promise<string[]>}
 */
export async function listVaultNotes(prefix = OBSIDIAN_VAULT_PREFIX) {
  if (BACKEND === 'supabase') return supabaseList(prefix);
  return obsidianList(prefix);
}

/**
 * Full-text search across vault notes (Supabase backend only).
 * Falls back to listing and filtering when using Obsidian backend.
 *
 * @param {string} query
 * @returns {Promise<Array<{path: string, content: string}>>}
 */
export async function searchVaultNotes(query) {
  if (BACKEND === 'supabase') return supabaseSearch(query);
  // Obsidian backend: no server-side FTS — return empty so caller degrades gracefully
  return [];
}

/**
 * Load all reference notes from NFL/Reference/ as a combined markdown block.
 * Used to inject coach tendencies, DVOA, ATS trends into the BETTING agent
 * system prompt at session start.
 *
 * @returns {Promise<string>}  - Combined markdown block, or empty string if unavailable
 */
export async function loadReferenceNotes() {
  try {
    const prefix = `${OBSIDIAN_VAULT_PREFIX}/Reference`;
    const paths = await listVaultNotes(prefix);
    if (!paths || paths.length === 0) return '';

    const contents = await Promise.all(
      paths.map(async p => {
        const content = await readVaultNote(p);
        if (!content) return null;
        return `### ${p.replace(/^.*\//, '').replace('.md', '')}\n\n${content.trim()}`;
      })
    );

    return contents.filter(Boolean).join('\n\n---\n\n');
  } catch (e) {
    logger.warn('[vault] loadReferenceNotes failed:', e.message);
    return '';
  }
}

/**
 * Build the path for today's session note.
 * @returns {string}  e.g. "NFL/Sessions/2026-09-07.md"
 */
export function todaySessionPath() {
  const today = new Date().toISOString().slice(0, 10);
  return `${OBSIDIAN_VAULT_PREFIX}/Sessions/${today}.md`;
}

export const VAULT_BACKEND = BACKEND;
