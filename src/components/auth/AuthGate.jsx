// src/components/auth/AuthGate.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Single-user authentication gate.
//
// Wraps the entire app. If Supabase is unavailable (local dev without a
// VITE_SUPABASE_URL) the gate passes through immediately so offline dev
// is never blocked.
//
// If a persisted Supabase session exists the gate is transparent.
// Otherwise the owner sees a minimal sign-in form.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { isAvailable, getSession, signIn, onAuthStateChange } from '../../lib/supabase.js';

export default function AuthGate({ children }) {
  const [session, setSession]   = useState(undefined); // undefined = loading
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  // Check for an existing persisted session on mount, then subscribe to
  // auth state changes so sign-out / token-refresh is handled automatically.
  useEffect(() => {
    if (!isAvailable()) {
      // Supabase not configured — pass through for local dev.
      setSession(null);
      return;
    }

    getSession().then(s => setSession(s));
    const unsub = onAuthStateChange(s => setSession(s));
    return unsub;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { session: s, error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError('Invalid email or password.');
    } else {
      setSession(s);
    }
  }

  // Still checking for an existing session — show a minimal loader.
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <span className="text-[#00d2be] font-mono text-sm animate-pulse">
          Checking session…
        </span>
      </div>
    );
  }

  // Supabase unavailable (local dev) or already authenticated — render app.
  if (!isAvailable() || session) {
    return children;
  }

  // Not signed in — show the password gate.
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div className="text-[#00d2be] font-mono text-2xl font-bold tracking-widest mb-1">
            NFL DASHBOARD
          </div>
          <p className="text-slate-500 text-xs tracking-wider uppercase">
            Sign in to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-slate-700/50 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#0f0f0f] border border-slate-600/60 rounded-lg px-3 py-2.5
                         text-sm text-gray-200 placeholder-slate-600
                         focus:outline-none focus:border-[#00d2be]/60 focus:ring-1
                         focus:ring-[#00d2be]/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f0f0f] border border-slate-600/60 rounded-lg px-3 py-2.5
                         text-sm text-gray-200 placeholder-slate-600
                         focus:outline-none focus:border-[#00d2be]/60 focus:ring-1
                         focus:ring-[#00d2be]/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#00d2be] hover:bg-[#00b8a6] disabled:opacity-50
                       disabled:cursor-not-allowed text-black font-bold text-sm
                       rounded-lg py-2.5 transition-colors"
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-slate-600">
          Personal tool — create your account in the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
