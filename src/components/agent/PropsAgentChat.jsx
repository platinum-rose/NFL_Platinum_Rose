// src/components/agent/PropsAgentChat.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PROPS Agent — Chat UI (F-8)
// Player props, same-game parlays (SGPs), backup-depth analysis.
//
// Mirrors AgentChat.jsx (F-6) architecture:
//   - Uses anthropicClient.runAgentTurn / runOpenAIAgentTurn (provider-agnostic)
//   - PROPS_TOOLS / executePropTool from propsTools.js
//   - Chat history persisted to localStorage nfl_props_agent_chat_v1
//   - API key shared via the same VITE_ANTHROPIC_API_KEY / VITE_OPENAI_API_KEY
//     as BETTING agent (so entering the key once unlocks both)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Zap, User, Wrench, ChevronDown, ChevronRight, Trash2, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { runAgentTurn, runOpenAIAgentTurn } from '../../lib/anthropicClient.js';
import { PROPS_TOOLS, executePropTool } from '../../lib/propsTools.js';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage.js';
import { getNFLWeekInfo } from '../../lib/constants.js';
import { ANTHROPIC_API, AI_PROXY_URL } from '../../lib/apiConfig.js';

// ─── localStorage keys ───────────────────────────────────────────────────────
const CHAT_HISTORY_KEY  = 'nfl_props_agent_chat_v1';
const USER_API_KEY_KEY  = 'nfl_betting_agent_apikey_v1'; // shared with BETTING

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildPropsSystemPrompt(loggedProps, schedule) {
  const { label: weekLabel } = getNFLWeekInfo();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const openProps = (loggedProps || []).filter(p => p.result === 'pending');
  const upcomingGames = (schedule || []).slice(0, 15)
    .map(g => `  ${g.visitor || g.away_team || '?'} @ ${g.home || g.home_team || '?'}${g.date ? ` (${g.date})` : ''}`)
    .join('\n');

  return `You are the PROPS agent for Platinum Rose — the Creator's player-prop and SGP specialist for NFL wagering.

## Identity
You surface prop edges, build correlated SGPs, and flag volume risks from starter injuries. You do NOT push picks — you show the math, the backup, and the correlation, then ask if the Creator wants to log.

## Core Rules
- Lead with the prop or the key number. No preamble.
- Show your work: projection vs. line, opponent context, correlation assumptions.
- When a line is STUBBED (TheOddsAPI free tier doesn't return props), say so explicitly. Never fabricate real book pricing.
- Flag injury-driven volume risks aggressively — a starter OUT reshapes every downstream prop.
- For SGPs: explicitly call out the correlation type and remind the Creator the price is approximate.
- CRITICAL: Never call log_prop without explicit user confirmation. Always ask "Shall I log this?" and wait for a clear "yes", "log it", or "record that" before writing. If the Creator asks for a recommendation, give it — but do not auto-log.

## Available Tools
- get_player_props → prop lines for a team/player (currently stubbed until paid props endpoint)
- analyze_prop → projection vs. line with edge + tier (strong / lean / pass)
- get_prop_line_shop → best line across books (stubbed comparison)
- build_sgp → correlated same-game parlay pricing (approximate; real quote per book)
- check_backup_depth → starter injury flags + backup volume impact
- get_prop_correlations → known NFL stat correlations for SGP construction
- log_prop → write to Prop Tracker (CONFIRM FIRST, always)

## Context (loaded at session start)
Today: ${today}
NFL Week: ${weekLabel}

### Open Props (${openProps.length} pending):
${openProps.length > 0
  ? openProps.slice(0, 15).map(p => {
      if (p.legs?.length) return `  - SGP (${p.legs.length} legs) @ ${p.odds > 0 ? '+' : ''}${p.odds} · ${p.units}u`;
      return `  - ${p.player || '?'} ${p.market || '?'} ${p.direction || ''} ${p.line ?? ''} @ ${p.odds > 0 ? '+' : ''}${p.odds} · ${p.units}u`;
    }).join('\n')
  : '  None'}

### Upcoming Schedule:
${upcomingGames || '  No schedule data loaded'}

Acknowledge that you have this context loaded and briefly state open prop count at conversation start.

## SGP Construction Discipline
- Prefer 2-leg SGPs with one strong positive correlation (e.g. QB pass yds + WR1 rec yds same team).
- Avoid 4+ leg positively-correlated stacks — variance collapses, EV usually negative.
- Negative-correlation legs (QB pass yds over + own RB rush yds over in a blowout) usually should not be paired.
- Always call get_prop_correlations first if the Creator is unsure how two props relate.

## Prop Analysis Discipline
- For any prop, always: (1) analyze_prop to get projection, (2) check_backup_depth on the player's team for volume risk, (3) line shop if two or more books are available.
- STRONG tier ≥ 10% magnitude edge in the direction of the pick; LEAN 4–10%; SLIGHT_LEAN <4%; PASS if projection is against the side.
- Flag contradicting signals (e.g. projection says OVER but starter RB is questionable) instead of smoothing them over.

## Style
- Concise. Lead with the pick or the edge number.
- Use ✅ / ⚠️ / ❌ sparingly for tier signaling.
- Show correlation type on every SGP output.
- When logging, echo the exact entry and wait for confirmation.`;
}

// ─── Message Rendering Helpers ───────────────────────────────────────────────

function ToolCallCard({ name, input, result, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toolLabels = {
    get_player_props:      '🏈 Get Player Props',
    analyze_prop:          '🔍 Analyze Prop',
    get_prop_line_shop:    '🛒 Line Shop',
    build_sgp:             '🎲 Build SGP',
    check_backup_depth:    '🪑 Backup Depth',
    get_prop_correlations: '🔗 Correlations',
    log_prop:              '📝 Log Prop',
  };
  const label = toolLabels[name] || `🔧 ${name}`;

  return (
    <div className="my-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        <Wrench size={11} className="text-violet-400 flex-shrink-0" />
        <span className="font-bold text-violet-300 flex-1">{label}</span>
        {result && <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />}
        {open ? <ChevronDown size={11} className="text-slate-500" /> : <ChevronRight size={11} className="text-slate-500" />}
      </button>
      {open && (
        <div className="border-t border-slate-700/60 p-3 space-y-2">
          <div>
            <div className="text-slate-500 uppercase tracking-wider text-[9px] mb-1">Input</div>
            <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed">{JSON.stringify(input, null, 2)}</pre>
          </div>
          {result != null && (
            <div>
              <div className="text-slate-500 uppercase tracking-wider text-[9px] mb-1">Result</div>
              <pre className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                {typeof result === 'string' ? safePretty(result) : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// If the tool result was stored as a JSON string, pretty-print it; otherwise show as-is
function safePretty(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function AssistantMessage({ message, toolResultsMap }) {
  if (!message || message.role !== 'assistant') return null;
  const blocks = Array.isArray(message.content) ? message.content : [];
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mt-0.5">
        <Zap size={13} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        {blocks.map((block, i) => {
          if (block.type === 'text') {
            return (
              <div key={i} className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-1">
                {block.text}
              </div>
            );
          }
          if (block.type === 'tool_use') {
            const result = toolResultsMap[block.id];
            return <ToolCallCard key={i} name={block.name} input={block.input} result={result} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function UserMessage({ text }) {
  return (
    <div className="flex gap-3 items-start justify-end">
      <div className="max-w-[80%] bg-slate-700/60 rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-100 leading-relaxed">
        {text}
      </div>
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-600/40 border border-slate-600/60 flex items-center justify-center mt-0.5">
        <User size={13} className="text-slate-400" />
      </div>
    </div>
  );
}

// ─── API Key Setup Panel ──────────────────────────────────────────────────────

function ApiKeySetup({ onKeySet }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handle = () => {
    const k = input.trim();
    const provider = k.startsWith('sk-ant-') ? 'anthropic' : k.startsWith('sk-') ? 'openai' : null;
    if (!provider) {
      setError('Key must start with sk-ant- (Anthropic) or sk- (OpenAI).');
      return;
    }
    saveToStorage(USER_API_KEY_KEY, JSON.stringify({ key: k, provider }));
    onKeySet(k, provider);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
        <Key size={28} className="text-violet-400" />
      </div>
      <div>
        <h2 className="text-white font-bold text-lg mb-1">PROPS Agent</h2>
        <p className="text-slate-400 text-sm">Enter your Anthropic or OpenAI API key to activate the agent.<br />Key is stored locally.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="sk-ant-... or sk-..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
        {error && <p className="text-rose-400 text-xs">{error}</p>}
        <button
          onClick={handle}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
        >
          Activate Agent
        </button>
      </div>
      <p className="text-slate-600 text-xs max-w-xs">
        Need a key? Get one at <span className="text-slate-400">console.anthropic.com</span> or <span className="text-slate-400">platform.openai.com</span>.
      </p>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

function PropsStatusBar({ openPropsCount, weekLabel, isLoading, provider }) {
  const modelLabel = provider === 'anthropic'
    ? (ANTHROPIC_API.MODEL_DEFAULT || 'claude-sonnet-4-5')
    : 'gpt-4o-mini';
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-violet-400'}`} />
        <span className="text-slate-400 font-bold">PROPS</span>
      </div>
      <div className="h-3 w-px bg-slate-700" />
      <span className="text-slate-500 font-mono">{modelLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>{weekLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>Open props: <span className="text-slate-300">{openPropsCount}</span></span>
      {isLoading && <span className="ml-auto text-amber-400 animate-pulse">Thinking…</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropsAgentChat() {
  // API calls route through the Supabase Edge Function proxy.
  // A stored personal key is still honoured as an optional override.
  const storedRaw  = loadFromStorage(USER_API_KEY_KEY, '');
  let storedKey = '', storedProvider = null;
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      storedKey      = parsed.key || '';
      storedProvider = parsed.provider || null;
    } catch {
      storedKey      = typeof storedRaw === 'string' ? storedRaw : '';
      storedProvider = storedKey.startsWith('sk-ant-') ? 'anthropic' : (storedKey.startsWith('sk-') ? 'openai' : null);
    }
  }

  const [apiKey, setApiKey]     = useState(storedKey || '');
  const [provider, setProvider] = useState(storedProvider || 'anthropic');

  const [messages, setMessages] = useState(() => loadFromStorage(CHAT_HISTORY_KEY, []));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [contextLoaded, setContextLoaded] = useState(false);
  const systemPromptRef = useRef('');
  const scrollRef = useRef(null);

  // Status bar data
  const loggedProps = loadFromStorage(PR_STORAGE_KEYS.PROPS_PICKS.key, []) || [];
  const openPropsCount = loggedProps.filter(p => p.result === 'pending').length;

  // Load context and build system prompt on mount
  useEffect(() => {
    async function loadContext() {
      const props = loadFromStorage(PR_STORAGE_KEYS.PROPS_PICKS.key, []);
      let schedule = [];
      try {
        const resp = await fetch('./schedule.json');
        if (resp.ok) schedule = await resp.json();
      } catch { /* non-fatal */ }
      systemPromptRef.current = buildPropsSystemPrompt(props, schedule);
      setContextLoaded(true);
    }
    loadContext();
  }, []);

  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) saveToStorage(CHAT_HISTORY_KEY, messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Build map of tool_use_id → result for rendering
  const toolResultsMap = {};
  for (const msg of messages) {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_result') {
          toolResultsMap[block.tool_use_id] = block.content;
        }
      }
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const runFn = provider === 'anthropic' ? runAgentTurn : runOpenAIAgentTurn;
      const finalMessages = await runFn({
        apiKey,
        systemPrompt: systemPromptRef.current,
        messages: updatedMessages,
        tools: PROPS_TOOLS,
        executeToolFn: executePropTool,
        onStep: (step) => {
          if (step.type === 'assistant') {
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), step.message];
              }
              return [...prev, step.message];
            });
          }
        },
      });

      setMessages(finalMessages);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, apiKey, provider]);

  const clearHistory = useCallback(() => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([]);
      saveToStorage(CHAT_HISTORY_KEY, []);
    }
  }, []);

  if (!apiKey && !AI_PROXY_URL) {
    return (
      <div className="h-[calc(100vh-120px)] bg-slate-950 rounded-xl border border-slate-800">
        <ApiKeySetup onKeySet={(k, p) => { setApiKey(k); setProvider(p); }} />
      </div>
    );
  }

  const { label: weekLabel } = getNFLWeekInfo();

  const displayMessages = messages.filter(msg => {
    if (msg.role === 'user') return typeof msg.content === 'string';
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Zap size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm tracking-tight">PROPS Agent</h2>
            <p className="text-slate-500 text-[10px]">NFL Player Props · SGPs · Backup Depth · Platinum Rose</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!AI_PROXY_URL && apiKey && (
            <button
              onClick={() => { saveToStorage(USER_API_KEY_KEY, ''); setApiKey(''); setProvider(null); }}
              className="text-[10px] text-slate-600 hover:text-slate-400 px-2 py-1 rounded border border-slate-800 hover:border-slate-600 transition-colors"
            >
              Change Key
            </button>
          )}
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <PropsStatusBar
        openPropsCount={openPropsCount}
        weekLabel={weekLabel}
        isLoading={isLoading}
        provider={provider}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {displayMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Zap size={24} className="text-violet-400" />
            </div>
            <div>
              <p className="text-white font-bold mb-1">PROPS Agent ready.</p>
              <p className="text-slate-500 text-sm max-w-xs">
                {contextLoaded
                  ? 'Context loaded. Ask about a player prop, SGP, or backup-depth situation.'
                  : 'Loading context…'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Show me Chiefs props',
                'Analyze Mahomes passing yards over 275.5',
                'Build a 2-leg SGP: Mahomes + Kelce rec yds',
                'Check Chiefs backup depth at RB',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-violet-500/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map((msg, i) => {
          if (msg.role === 'user') {
            return <UserMessage key={i} text={typeof msg.content === 'string' ? msg.content : ''} />;
          }
          if (msg.role === 'assistant') {
            return <AssistantMessage key={i} message={msg} toolResultsMap={toolResultsMap} />;
          }
          return null;
        })}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mt-0.5">
              <Zap size={13} className="text-violet-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-300">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about a prop, an SGP, or a backup — say 'log it' to record."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-slate-600 text-[10px] mt-1.5 px-1">
          Enter to send · Shift+Enter for newline · Agent must confirm before logging props · Prop lines currently stubbed
        </p>
      </div>
    </div>
  );
}
