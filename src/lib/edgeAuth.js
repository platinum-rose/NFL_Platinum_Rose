// src/lib/edgeAuth.js
// §1C — headers for calls to our paid-API edge functions (ai-proxy,
// odds-proxy). Those functions now reject the bare public anon key; they need
// the signed-in user's access token. Falls back to the anon key when no one is
// signed in so the request still reaches the function and gets a clear 401
// ("sign in required") instead of a network error.
import { supabase } from './supabase.js';
import { SUPABASE_ANON_KEY } from './apiConfig.js';

export async function getEdgeFunctionHeaders(extra = {}) {
  let token = SUPABASE_ANON_KEY;
  try {
    const { data } = (await supabase?.auth?.getSession?.()) || {};
    if (data?.session?.access_token) token = data.session.access_token;
  } catch { /* fall back to anon key */ }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
    ...extra,
  };
}
