#!/usr/bin/env node
import {
  DEFAULT_CLIENT_PATH,
  DEFAULT_REDIRECT_PORT,
  DEFAULT_TOKEN_PATH,
  buildAuthUrl,
  exchangeCodeForToken,
  loadClientConfig,
  newState,
  waitForOAuthCode,
  writeJson
} from './lib/youtube-oauth.js';

function argValue(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? fallback : process.argv[idx + 1];
}

const clientPath = argValue('--client', DEFAULT_CLIENT_PATH);
const tokenPath = argValue('--token', DEFAULT_TOKEN_PATH);
const port = Number(argValue('--port', DEFAULT_REDIRECT_PORT));

const clientConfig = loadClientConfig(clientPath);
const state = newState();
const authUrl = buildAuthUrl(clientConfig, { state, port });

console.log('\nYouTube OAuth setup');
console.log('Open this URL in your browser, approve read-only YouTube access, then return here:\n');
console.log(authUrl);
console.log('\nWaiting for OAuth callback...');

const code = await waitForOAuthCode({ port, expectedState: state });
const token = await exchangeCodeForToken(clientConfig, code, { port });
writeJson(tokenPath, token);

console.log(`\nSaved YouTube OAuth token: ${tokenPath}`);
console.log('Scope: read-only YouTube account access');
