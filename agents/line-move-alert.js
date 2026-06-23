// agents/line-move-alert.js
// ─────────────────────────────────────────────────────────────────────────────
// LineMoveAlertAgent — reads line_movements from Supabase, emails on significant moves
//
// Replaces the Google Apps Script "alertLineMoves" trigger.  Runs on M6 via
// a systemd hourly timer (infra/systemd/nfl-line-alert.timer).
//
// Why not re-fetch TheOddsAPI here:
//   odds-ingest.js already fetches lines and writes detected movements to the
//   `line_movements` table.  This agent is purely a read + alert layer — no
//   duplicate API calls, no second snapshot to keep in sync.
//
// Significance thresholds (mirrored from src/components/odds/LineMovementTracker.jsx):
//   Spread / Total:  HIGH ≥ 1.5 pts  |  MEDIUM ≥ 0.5 pts
//   Moneyline:       HIGH ≥ 15       |  MEDIUM ≥ 5
//
// Usage:
//   node agents/line-move-alert.js            # send email if moves found
//   node agents/line-move-alert.js --dry-run  # print to stdout, no email
//
// Env vars:
//   SUPABASE_URL              — https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role JWT (bypasses RLS for reads)
//   GMAIL_ADDRESS             — sender Gmail address
//   GMAIL_APP_PASSWORD        — Gmail app password (16-char, not account password)
//   TO_EMAIL                  — alert recipient  (default: andrewlrose@hotmail.com)
//   LOOKBACK_MINUTES          — how far back to scan (default: 65)
//   DRY_RUN                   — "true" to skip email
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }   from '@supabase/supabase-js';
import nodemailer          from 'nodemailer';
import 'dotenv/config';

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GMAIL_ADDR    = process.env.GMAIL_ADDRESS;
const GMAIL_PASS    = process.env.GMAIL_APP_PASSWORD;
const TO_EMAIL      = process.env.TO_EMAIL || 'andrewlrose@hotmail.com';
const LOOKBACK_MIN  = Number(process.env.LOOKBACK_MINUTES || 65);
const DRY_RUN       = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

// Significance thresholds — keep in sync with LineMovementTracker.jsx
const THRESHOLDS = {
  spread:    { HIGH: 1.5, MEDIUM: 0.5 },
  total:     { HIGH: 1.5, MEDIUM: 0.5 },
  moneyline: { HIGH: 15,  MEDIUM: 5   },
};

// ── Supabase ──────────────────────────────────────────────────────────────────

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

// ── Fetch movements from the last LOOKBACK_MIN minutes ───────────────────────

async function fetchRecentMovements(supabase) {
  const since = new Date(Date.now() - LOOKBACK_MIN * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('line_movements')
    .select('detected_at, game_key, home_team, away_team, book, type, from_line, to_line, movement')
    .gte('detected_at', since)
    .order('detected_at', { ascending: false });

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}

// ── Filter for significant moves ──────────────────────────────────────────────

function classifySignificance(row) {
  const thresh = THRESHOLDS[row.type];
  if (!thresh) return null;
  const abs = Math.abs(Number(row.movement));
  if (abs >= thresh.HIGH)   return 'HIGH';
  if (abs >= thresh.MEDIUM) return 'MEDIUM';
  return null;
}

// ── Format helpers ────────────────────────────────────────────────────────────

const BOOK_LABELS = {
  draftkings: 'DraftKings', fanduel: 'FanDuel', betmgm: 'BetMGM',
  caesars: 'Caesars', betonline: 'BetOnline', bookmaker: 'Bookmaker',
  pointsbet: 'PointsBet', unibet: 'Unibet',
};

function fmtBook(key) {
  return BOOK_LABELS[key] || key;
}

function fmtLine(val, type) {
  const n = Number(val);
  if (type === 'moneyline') return n > 0 ? `+${n}` : String(n);
  return n > 0 ? `+${n}` : String(n);
}

function fmtMove(val) {
  const n = Number(val);
  return (n > 0 ? '▲+' : '▼') + Math.abs(n);
}

function fmtGame(row) {
  // game_key format from odds-ingest.js: "AwayTeam_HomeTeam"
  if (row.away_team && row.home_team) return `${row.away_team} @ ${row.home_team}`;
  return row.game_key.replace('_', ' @ ');
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true,
  });
}

// ── Build email ───────────────────────────────────────────────────────────────

function buildEmail(alerts) {
  const ts = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium', timeStyle: 'short',
  });

  const highCount   = alerts.filter(a => a.significance === 'HIGH').length;
  const mediumCount = alerts.filter(a => a.significance === 'MEDIUM').length;

  const subject =
    `⚠️ NFL Line Alert — ${alerts.length} move${alerts.length > 1 ? 's' : ''}` +
    (highCount ? ` (${highCount} HIGH)` : '') +
    ` — ${ts}`;

  // ── Plain text ──
  const rows = alerts.map(a => {
    const icon = a.significance === 'HIGH' ? '🔴' : '🟡';
    return (
      `${icon} [${a.significance}] ${fmtGame(a)} | ` +
      `${a.type.toUpperCase()} | ${fmtBook(a.book)} | ` +
      `${fmtLine(a.from_line, a.type)} → ${fmtLine(a.to_line, a.type)} ` +
      `(${fmtMove(a.movement)}) | ${fmtTime(a.detected_at)}`
    );
  });

  const text = [
    `NFL Line Movement Alert  —  ${ts}`,
    '─'.repeat(50),
    ...rows,
    '',
    '─'.repeat(50),
    `Thresholds: Spread/Total HIGH≥1.5 MEDIUM≥0.5  |  Moneyline HIGH≥15 MEDIUM≥5`,
    `Lookback: last ${LOOKBACK_MIN} minutes`,
    `HIGH: ${highCount}  MEDIUM: ${mediumCount}`,
  ].join('\n');

  // ── HTML ──
  const htmlRows = alerts.map(a => {
    const bg    = a.significance === 'HIGH' ? '#fff0f0' : '#fffbe6';
    const badge = a.significance === 'HIGH'
      ? '<span style="background:#dc2626;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:600">HIGH</span>'
      : '<span style="background:#d97706;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:600">MEDIUM</span>';

    return `
      <tr style="background:${bg}">
        <td style="padding:8px 10px">${badge}</td>
        <td style="padding:8px 10px;font-weight:600">${fmtGame(a)}</td>
        <td style="padding:8px 10px;text-transform:uppercase;font-size:12px;color:#555">${a.type}</td>
        <td style="padding:8px 10px">${fmtBook(a.book)}</td>
        <td style="padding:8px 10px;font-family:monospace">
          ${fmtLine(a.from_line, a.type)} → <strong>${fmtLine(a.to_line, a.type)}</strong>
          <span style="color:${Number(a.movement) > 0 ? '#16a34a' : '#dc2626'}">&nbsp;${fmtMove(a.movement)}</span>
        </td>
        <td style="padding:8px 10px;color:#666;font-size:12px">${fmtTime(a.detected_at)}</td>
      </tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:system-ui,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.12)">
        <div style="background:#1e3a5f;color:#fff;padding:16px 20px">
          <h2 style="margin:0;font-size:18px">⚠️ NFL Line Movement Alert</h2>
          <p style="margin:4px 0 0;font-size:13px;opacity:.8">${ts} · ${alerts.length} move${alerts.length > 1 ? 's' : ''} · ${highCount} HIGH · ${mediumCount} MEDIUM</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f1f5f9;color:#555;font-size:11px;text-transform:uppercase">
              <th style="padding:8px 10px;text-align:left">Level</th>
              <th style="padding:8px 10px;text-align:left">Game</th>
              <th style="padding:8px 10px;text-align:left">Type</th>
              <th style="padding:8px 10px;text-align:left">Book</th>
              <th style="padding:8px 10px;text-align:left">Move</th>
              <th style="padding:8px 10px;text-align:left">Detected</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <div style="padding:12px 20px;background:#f8fafc;font-size:11px;color:#999">
          Thresholds: Spread/Total HIGH≥1.5 MEDIUM≥0.5 · Moneyline HIGH≥15 MEDIUM≥5 ·
          Lookback: ${LOOKBACK_MIN} min · Source: <code>line_movements</code> (Supabase)
        </div>
      </div>
    </body>
    </html>`;

  return { subject, text, html };
}

// ── Send via Gmail SMTP (nodemailer — matches nfl-daily-brief.js) ─────────────

async function sendEmail(subject, html, text) {
  if (!GMAIL_ADDR || !GMAIL_PASS) {
    throw new Error('GMAIL_ADDRESS and GMAIL_APP_PASSWORD env vars are required');
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: GMAIL_ADDR, pass: GMAIL_PASS },
  });

  const info = await transport.sendMail({
    from:    `"NFL Dashboard" <${GMAIL_ADDR}>`,
    to:      TO_EMAIL,
    subject,
    html,
    text,
  });

  return info.messageId;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n[${new Date().toISOString()}] LineMoveAlertAgent starting`);
  if (DRY_RUN) console.log('  (dry run — no email will be sent)');

  try {
    const supabase  = getSupabase();
    const movements = await fetchRecentMovements(supabase);
    console.log(`  Fetched ${movements.length} movement(s) from last ${LOOKBACK_MIN} min`);

    // Filter to significant only
    const alerts = movements
      .map(row => ({ ...row, significance: classifySignificance(row) }))
      .filter(row => row.significance !== null)
      // Sort: HIGH first, then by absolute movement size
      .sort((a, b) => {
        if (a.significance !== b.significance) return a.significance === 'HIGH' ? -1 : 1;
        return Math.abs(Number(b.movement)) - Math.abs(Number(a.movement));
      });

    console.log(`  Significant: ${alerts.filter(a => a.significance === 'HIGH').length} HIGH, ${alerts.filter(a => a.significance === 'MEDIUM').length} MEDIUM`);

    if (alerts.length === 0) {
      console.log('✅ No significant moves — nothing to send.');
      return;
    }

    const { subject, text, html } = buildEmail(alerts);

    if (DRY_RUN) {
      console.log('\n──── DRY RUN OUTPUT ────────────────────────────────');
      console.log(`Subject: ${subject}`);
      console.log(text);
      console.log('────────────────────────────────────────────────────\n');
    } else {
      const msgId = await sendEmail(subject, html, text);
      console.log(`✅ Alert sent to ${TO_EMAIL}  msgId=${msgId}`);
    }

  } catch (err) {
    console.error('❌ LineMoveAlertAgent error:', err.message);
    process.exit(1);
  }
}

run();
