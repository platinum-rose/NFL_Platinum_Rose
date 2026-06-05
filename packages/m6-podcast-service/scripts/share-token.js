#!/usr/bin/env node
/**
 * Phase 8 -- Share Token CLI
 *
 * Usage:
 *   node scripts/share-token.js mint   --partner "Patrick" [--expires 2026-09-01] [--notes "season pass"]
 *   node scripts/share-token.js list   [--active]
 *   node scripts/share-token.js revoke --token <token>
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env / /etc/nfl-podcast.env.
 * Tokens are shown ONCE at mint time -- they are the credential.
 * The funnel base URL is read from NFL_DIGEST_FUNNEL_BASE env var (or config).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mintToken, revokeToken, listTokens } from '../src/share.js';

const [, , command, ...flags] = process.argv;

function flag(name) {
  const idx = flags.indexOf(name);
  return idx !== -1 ? flags[idx + 1] ?? true : null;
}

if (!['mint', 'list', 'revoke'].includes(command)) {
  console.error(`Usage:
  node share-token.js mint   --partner <name> [--expires YYYY-MM-DD] [--notes "..."]
  node share-token.js list   [--active]
  node share-token.js revoke --token <token>`);
  process.exit(1);
}

const supabaseUrl      = process.env.SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const funnelBase       = (process.env.NFL_DIGEST_FUNNEL_BASE || '').replace(/\/$/, '');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

try {
  if (command === 'mint') {
    const partnerName = flag('--partner');
    if (!partnerName || partnerName === true) {
      console.error('mint requires --partner <name>');
      process.exit(1);
    }
    const expiresArg = flag('--expires');
    const expiresAt  = expiresArg && expiresArg !== true ? new Date(expiresArg).toISOString() : null;
    const notes      = flag('--notes') === true ? null : (flag('--notes') || null);

    const token = await mintToken({ supabase, partnerName, expiresAt, notes });

    console.log('\n-- Token minted (shown once) --');
    console.log('Partner:', partnerName);
    console.log('Token:  ', token);
    if (expiresAt) console.log('Expires:', expiresAt);
    if (funnelBase) {
      console.log('\nShare URL base (send this to partner):');
      console.log(`  ${funnelBase}/share/${token}/episodes/<id>`);
    } else {
      console.log('\n(Set NFL_DIGEST_FUNNEL_BASE in .env to see the full share URL)');
    }
    console.log('\nStore this token securely. It cannot be retrieved again.\n');

  } else if (command === 'list') {
    const activeOnly = flag('--active') !== null;
    const rows = await listTokens({ supabase, activeOnly });

    if (rows.length === 0) {
      console.log(activeOnly ? 'No active tokens.' : 'No tokens found.');
    } else {
      const header = ['Partner', 'Token (first 8)', 'Granted', 'Expires', 'Revoked', 'Notes'];
      const fmt = (r) => [
        r.partner_name,
        r.token.slice(0, 8) + '...',
        (r.granted_at || '').slice(0, 10),
        (r.expires_at || '').slice(0, 10) || 'never',
        r.revoked_at ? (r.revoked_at).slice(0, 10) : '',
        r.notes || '',
      ];
      const rows2 = rows.map(fmt);
      const cols = header.map((h, i) => Math.max(h.length, ...rows2.map(r => String(r[i]).length)));
      const pad  = (s, n) => String(s).padEnd(n);
      const line = cols.map((n, i) => pad(header[i], n)).join('  ');
      console.log('\n' + line);
      console.log(cols.map(n => '-'.repeat(n)).join('  '));
      for (const r of rows2) console.log(cols.map((n, i) => pad(r[i], n)).join('  '));
      console.log();
    }

  } else if (command === 'revoke') {
    const token = flag('--token');
    if (!token || token === true) {
      console.error('revoke requires --token <token>');
      process.exit(1);
    }
    await revokeToken({ supabase, token });
    console.log(`Token revoked: ${token.slice(0, 8)}...`);
  }

} catch (err) {
  console.error('share-token failed:', err?.message ?? err);
  process.exit(1);
}
