// scripts/yahoo-auth.js
// ═══════════════════════════════════════════════════════════════════════════════
// One-time interactive Yahoo OAuth2 authorization.
//   node scripts/yahoo-auth.js
// Prints the consent URL, you approve in a browser, then paste back the `code`
// (or the whole redirected URL). Tokens are saved to .nfl/yahoo/tokens.json and
// auto-refresh from then on. Requires YAHOO_CLIENT_ID / YAHOO_CLIENT_SECRET in .env.
// ═══════════════════════════════════════════════════════════════════════════════
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { authorizeUrl, exchangeCode, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKENS_PATH } from '../src/lib/yahoo.js';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('✖ Set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET in .env first.');
  console.error('  See docs/YAHOO_INTEGRATION_SETUP.md to register a Yahoo developer app.');
  process.exit(1);
}

console.log('\nYahoo Fantasy — one-time authorization');
console.log('─'.repeat(60));
console.log(`redirect_uri: ${REDIRECT_URI}`);
console.log('\n1) Open this URL in a browser, sign in, and click Agree:\n');
console.log('   ' + authorizeUrl() + '\n');
console.log('2) Your browser will redirect to the redirect_uri with ?code=...');
console.log('   (the page itself may fail to load — that is fine). Copy the code');
console.log('   value from the address bar, or paste the entire redirected URL.\n');

const rl = readline.createInterface({ input, output });
const raw = (await rl.question('Paste code (or full redirect URL): ')).trim();
rl.close();

let code = raw;
if (raw.includes('code=')) {
  try { code = new URLSearchParams(raw.split('?')[1]).get('code') || raw; } catch { /* keep raw */ }
}
if (!code) { console.error('✖ No code provided.'); process.exit(1); }

const tok = await exchangeCode(code);
console.log(`\n✅ Saved tokens to ${TOKENS_PATH}`);
console.log(`   access token valid until ${new Date(tok.expires_at).toISOString()} (auto-refreshes)`);
console.log('\nNext:');
console.log('   node agents/yahoo-adp-ingest.js --dry-run     # Yahoo consensus ADP');
console.log('   node agents/yahoo-league-settings.js          # your league scoring');
