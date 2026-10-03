// agents/lib/billing-alert.js
// ═══════════════════════════════════════════════════════════════════════════════
// Automated Billing & Credit Depletion Alert System
//
// Detects 402 / depleted credit errors from Gemini (and fallback LLM providers),
// records health state in Supabase `feed_health`, and sends an immediate email
// alert via Gmail SMTP to Andy so runs never fail silently.
// Throttles alerts to at most once per 4 hours per provider to prevent spam.
// ═══════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import nodemailer from 'nodemailer';

const GMAIL_ADDR = process.env.GMAIL_ADDRESS || process.env.PLATINUM_ROSE_GMAIL_ADDRESS;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || process.env.PLATINUM_ROSE_GMAIL_APP_PASSWORD;
const TO_EMAIL = process.env.ALERT_TO_EMAIL || process.env.TO_EMAIL || 'andrewlrose@gmail.com';
const ALERT_THROTTLE_HOURS = 4;

const BILLING_PATTERNS = [
  /\b402\b/,
  /prepayment credits are depleted/i,
  /insufficient[_ ]quota/i,
  /no credits remaining/i,
  /credit balance is too low/i,
  /billing/i,
  /resource_exhausted.*prepay/i,
];

/**
 * Returns true if the given error object or string indicates depleted credits / billing failure.
 */
export function isBillingDepletedError(err) {
  if (!err) return false;
  if (err.status === 402 || err.statusCode === 402 || err.code === 402) return true;
  const msg = typeof err === 'string' ? err : `${err.message || ''} ${err.details || ''} ${JSON.stringify(err)}`;
  return BILLING_PATTERNS.some((pattern) => pattern.test(msg));
}

/**
 * Perform a lightweight 1-token live probe against Gemini 3.6 Flash to test billing status.
 * Cost: 1 token (~$0.0000001).
 * @param {string} apiKey
 * @returns {Promise<{ ok: boolean, status: number, reason?: string, error?: string }>}
 */
export async function checkGeminiBillingLive(apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) {
    return { ok: false, status: 401, reason: 'GEMINI_API_KEY not configured' };
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.ok) {
      return { ok: true, status: res.status };
    }

    const errText = await res.text();
    const isBilling = res.status === 402 || isBillingDepletedError(errText);
    return {
      ok: false,
      status: res.status,
      isBilling,
      reason: isBilling ? 'Prepayment credits depleted' : `HTTP ${res.status}`,
      error: errText,
    };
  } catch (err) {
    return { ok: false, status: 0, reason: err.message, error: String(err) };
  }
}

/**
 * Send an alert email to Andy if credits are depleted, updating feed_health in Supabase.
 */
export async function sendBillingAlert({
  provider = 'Gemini API',
  error = 'Prepayment credits depleted',
  context = 'Podcast Ingestion Pipeline',
  supabase = null,
} = {}) {
  const errMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Check throttle via feed_health if Supabase client is available
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('feed_health')
        .select('*')
        .eq('source', provider)
        .maybeSingle();

      if (existing?.alert_sent_at) {
        const lastSent = new Date(existing.alert_sent_at);
        const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < ALERT_THROTTLE_HOURS) {
          console.log(`  [billing-alert] Alert for ${provider} already sent ${hoursSince.toFixed(1)}h ago — throttled`);
          // Still update last_checked_at and consecutive failures
          await supabase.from('feed_health').upsert({
            source: provider,
            last_status: 'billing_depleted',
            last_reason: errMsg.slice(0, 500),
            consecutive_failures: (existing.consecutive_failures || 0) + 1,
            last_checked_at: nowIso,
            updated_at: nowIso,
          });
          return { sent: false, throttled: true };
        }
      }
    } catch (e) {
      console.warn(`  [billing-alert] Could not check feed_health: ${e.message}`);
    }
  }

  // 2. Dispatch Email via Gmail SMTP
  if (!GMAIL_ADDR || !GMAIL_PASS) {
    console.warn('  [billing-alert] GMAIL_ADDRESS or GMAIL_APP_PASSWORD missing — cannot send email alert');
    return { sent: false, reason: 'missing_email_creds' };
  }

  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: GMAIL_ADDR, pass: GMAIL_PASS },
    });

    const subject = `🚨 [NFL Dashboard Alert] ${provider} Billing Failure — Credits Depleted`;
    const text = `ACTION REQUIRED: ${provider} credits are depleted.\n\n`
      + `Context: ${context}\n`
      + `Time: ${nowIso}\n`
      + `Error: ${errMsg}\n\n`
      + `Top up credits at Google AI Studio:\n`
      + `https://ai.studio/projects (Project: platinum-rose-gmail)\n\n`
      + `Until topped up, audio diarization, pick extraction, and YouTube intel are paused.\n`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; color: white; padding: 16px 20px;">
          <h2 style="margin: 0; font-size: 18px;">🚨 ${provider} Billing Depleted</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Platinum Rose NFL Dashboard Automation Alert</p>
        </div>
        <div style="padding: 20px; background-color: #ffffff; color: #1f2937;">
          <p style="font-size: 15px; font-weight: 600; color: #b91c1c; margin-top: 0;">
            The ${provider} key failed because prepayment credits are depleted (HTTP 402).
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 120px;"><strong>Context:</strong></td>
              <td style="padding: 6px 0;">${context}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;"><strong>Timestamp:</strong></td>
              <td style="padding: 6px 0;">${nowIso}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;"><strong>API Error:</strong></td>
              <td style="padding: 6px 0; font-family: monospace; background: #f3f4f6; padding: 6px; border-radius: 4px;">${errMsg.slice(0, 300)}</td>
            </tr>
          </table>
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://ai.studio/projects" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Manage AI Studio Billing & Credits &rarr;
            </a>
          </div>
          <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 0;">
            <strong>Impact:</strong> Multi-host podcast diarization, pick extraction, and YouTube multimodal intel are paused. Unprocessed episodes are preserved as <code>pending</code> and will resume automatically once credits are available.
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: `"NFL Dashboard Alerts" <${GMAIL_ADDR}>`,
      to: TO_EMAIL,
      subject,
      text,
      html,
    });

    console.log(`  ✅ [billing-alert] Sent billing failure alert to ${TO_EMAIL} (messageId: ${info.messageId})`);

    // 3. Record in feed_health
    if (supabase) {
      await supabase.from('feed_health').upsert({
        source: provider,
        last_status: 'billing_depleted',
        last_reason: errMsg.slice(0, 500),
        last_checked_at: nowIso,
        alert_sent_at: nowIso,
        updated_at: nowIso,
      });
    }

    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.error(`  ❌ [billing-alert] Failed to send email alert: ${e.message}`);
    return { sent: false, error: e.message };
  }
}

/**
 * Record a successful run in feed_health to clear previous failure flags.
 */
export async function recordBillingSuccess({ provider = 'Gemini API', supabase = null } = {}) {
  if (!supabase) return;
  try {
    const nowIso = new Date().toISOString();
    await supabase.from('feed_health').upsert({
      source: provider,
      last_status: 'available',
      last_reason: null,
      consecutive_failures: 0,
      last_success_at: nowIso,
      last_checked_at: nowIso,
      alert_sent_at: null,
      updated_at: nowIso,
    });
  } catch (e) {
    // Non-fatal
  }
}
