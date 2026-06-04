// src/components/agent/FuturesAgentChat.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FUTURES Agent — Chat UI (Phase 6d)
// Season-arc thinking, hedging math, line-decay analysis.
// Consumes podcast intel via PODCAST_INTEL_TOOLS shared with BETTING.
//
// Manifest: agents/manifests/futures.manifest.json
// Architecture mirrors PropsAgentChat / AgentChat:
//   - anthropicClient.runAgentTurn / runOpenAIAgentTurn
//   - Reuses BETTING_TOOLS (already includes 6 podcast intel tools, calculate_hedge,
//     get_odds, log_pick); FUTURES system prompt steers tool selection toward
//     futures-relevant tools without needing a separate registry.
//   - Chat history persisted to localStorage nfl_futures_agent_chat_v1
//   - API key shared with BETTING/PROPS agents (nfl_betting_agent_apikey_v1)
// ═══════════════════════════════════════════════════════════════════════════════

import logger from '../../lib/logger';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trophy, User, Wrench, ChevronDown, ChevronRight, Trash2, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { runAgentTurn, runOpenAIAgentTurn } from '../../lib/anthropicClient.js';
import { BETTING_TOOLS, executeTool } from '../../lib/agentTools.js';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage.js';
import { getNFLWeekInfo } from '../../lib/constants.js';
import { ANTHROPIC_API, AI_PROXY_URL } from '../../lib/apiConfig.js';

// ─── localStorage keys (per futures.manifest.json persistenceKeys) ───────────
const CHAT_HISTORY_KEY = 'nfl_futures_agent_chat_v1';
const USER_API_KEY_KEY = 'nfl_betting_agent_apikey_v1'; // shared

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildFuturesSystemPrompt(futuresPortfolio, schedule) {
  const { label: weekLabel } = getNFLWeekInfo();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const positions = (futuresPortfolio?.positions || []).filter(p => !p.closed_at);
  const upcomingGames = (schedule || []).slice(0, 12)
    .map(g => `  ${g.visitor || g.away_team || '?'} @ ${g.home || g.home_team || '?'}${g.date ? ` (${g.date})` : ''}`)
    .join('\n');

  return `You are the FUTURES agent for Platinum Rose — the Creator's season-arc strategist for NFL futures (division winners, conference winners, MVP/awards, win totals, playoff props).

## Identity
You think in season arcs, not single weeks. You anchor every take to the schedule, division standings, remaining strength of schedule, injuries, and line-decay since opening odds. You cite podcast experts by name and date when their take supports or contradicts the recommendation.

## Core Rules
- Lead with the market and the take. No preamble.
- Quote line-decay context on any active position: opening odds vs. current odds, and what events moved the line.
- Cite podcast experts by name + date when surfacing a take. Never invent attributions.
- For hedging questions, show the math: stake at entry, current odds, hedge size, locked min/max profit. Use calculate_hedge.
- CRITICAL: Never call log_pick without explicit user confirmation. Always echo the entry and wait for "yes" / "log it" / "record that". Recommendations are fine; auto-log is not.
- If a tool returns no_data, say so plainly. Do not extrapolate from absent data.
- Picks with quality_score < 0.6 are flagged uncertain; mention this when citing them. The pipeline already filters needs_review picks out — do not ask the Creator to override.

## Available Tools
### Podcast intel (shared with BETTING — PODCAST_INTEL_TOOLS)
- search_podcast_picks → recent expert picks; for futures use category='future'
- get_expert_history → one expert's recent pick volume + category breakdown
- get_team_podcast_intel → for/against picks for a team across recent pods
- get_weekly_consensus → cross-expert consensus board for one week
- get_futures_movement → timeline of expert picks for a single market (PRIMARY tool)
- get_player_prop_context → player + prop type trend (used for award-race futures)

### Bankroll / odds (shared with BETTING)
- calculate_hedge → hedge math for locking profit on outright futures
- get_odds → current sportsbook odds (use for division/conference market context)
- log_pick → record the futures pick (bet_type='future'). CONFIRM FIRST.

## Context (loaded at session start)
Today: ${today}
NFL Week: ${weekLabel}

### Open Futures Positions (${positions.length}):
${positions.length > 0
  ? positions.slice(0, 12).map(p => {
      const odds = p.odds_at_entry > 0 ? `+${p.odds_at_entry}` : p.odds_at_entry;
      return `  - ${p.team || p.subject || '?'} ${p.market || '?'} @ ${odds} · ${p.stake ?? '?'}u`;
    }).join('\n')
  : '  None'}

### Upcoming Schedule:
${upcomingGames || '  No schedule data loaded'}

Acknowledge the context and briefly state open futures count at conversation start.

## Strategy Discipline
- Division winners: think head-to-head + remaining division SoS, not just current record.
- Win totals: track injury-adjusted projections vs market; key on QB1 health and OL stability.
- MVP/awards: line decay matters most — buying late after a Hot 5 weeks is usually -EV.
- Hedge candidates surface when current implied probability ≥ 1.7x entry implied probability and ≥ 4 weeks of regular season remain.
- Use get_futures_movement first when asked about any specific market — it shows what experts have called and when.

## Style
- Concise. Lead with the call or the hedge size.
- Use ✅ / ⚠️ / ❌ sparingly for conviction tier.
- When citing podcasts: "<Expert>, <Show>, <YYYY-MM-DD>: <take>".
- When logging, echo the exact entry and wait for confirmation.`;
}

// ─── Message Rendering Helpers ───────────────────────────────────────────────

function ToolCallCard({ name, input, result, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toolLabels = {
    search_podcast_picks:    '\uD83C\uDF99\uFE0F Podcast Picks',
    get_expert_history:      '\uD83D\uDCDC Expert History',
    get_team_podcast_intel:  '\uD83C\uDFC8 Team Pod Intel',
    get_weekly_consensus:    '\uD83D\uDDF3\uFE0F Weekly Consensus',
    get_futures_movement:    '\uD83D\uDCC8 Futures Movement',
    get_player_prop_context: '\uD83D\uDC65 Prop Context',
    calculate_hedge:         '\uD83D\uDD12 Hedge Math',
    get_odds:                '\uD83D\uDCB0 Get Odds',
    log_pick:                '\uD83D\uDCDD Log Pick',
  };
  const label = toolLabels[name] || `[tool] ${name}`;

  return (
    <div className="my-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        <Wrench size={11} className="text-indigo-400 flex-shrink-0" />
        <span className="font-bold text-indigo-300 flex-1">{label}</span>
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

function safePretty(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

function AssistantMessage({ message, toolResultsMap }) {
  if (!message || message.role !== 'assistant') return null;
  const blocks = Array.isArray(message.content) ? message.content : [];
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mt-0.5">
        <Trophy size={13} className="text-indigo-400" />
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
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
        <Key size={28} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-white font-bold text-lg mb-1">FUTURES Agent</h2>
        <p className="text-slate-400 text-sm">Enter your Anthropic or OpenAI API key to activate the agent.<br />Key is stored locally.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="sk-ant-... or sk-..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        {error && <p className="text-rose-400 text-xs">{error}</p>}
        <button
          onClick={handle}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
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

function FuturesStatusBar({ openFuturesCount, weekLabel, isLoading, provider, activeModelLabel }) {
  const modelLabel = provider === 'anthropic'
    ? (ANTHROPIC_API.MODEL_DEFAULT || 'claude-sonnet-4-5')
    : 'gpt-4o-mini';
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400'}`} />
        <span className="text-slate-400 font-bold">FUTURES</span>
      </div>
      <div className="h-3 w-px bg-slate-700" />
      <span className="text-slate-500 font-mono">{modelLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>{weekLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>Open futures: <span className="text-slate-300">{openFuturesCount}</span></span>
      {isLoading && <span className="ml-auto text-amber-400 animate-pulse">Asking {activeModelLabel || (provider === "anthropic" ? "Claude" : "GPT-4o")}...</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FuturesAgentChat() {
  const storedRaw = loadFromStorage(USER_API_KEY_KEY, '');
  let storedKey = '', storedProvider = null;
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      storedKey = parsed.key || '';
      storedProvider = parsed.provider || null;
    } catch {
      storedKey = typeof storedRaw === 'string' ? storedRaw : '';
      storedProvider = storedKey.startsWith('sk-ant-') ? 'anthropic' : (storedKey.startsWith('sk-') ? 'openai' : null);
    }
  }

  const [apiKey, setApiKey] = useState(storedKey || '');
  const [provider, setProvider] = useState(storedProvider || 'anthropic');
  const [activeModelLabel, setActiveModelLabel] = useState(null);

  const [messages, setMessages] = useState(() => loadFromStorage(CHAT_HISTORY_KEY, []));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [contextLoaded, setContextLoaded] = useState(false);
  const systemPromptRef = useRef('');
  const scrollRef = useRef(null);

  // Status bar data
  const futuresPortfolio = loadFromStorage(PR_STORAGE_KEYS.FUTURES_PORTFOLIO?.key || 'nfl_futures_portfolio_v1', { positions: [] }) || { positions: [] };
  const openFuturesCount = (futuresPortfolio.positions || []).filter(p => !p.closed_at).length;

  // Load context and build system prompt on mount
  useEffect(() => {
    async function loadContext() {
      const portfolio = loadFromStorage(PR_STORAGE_KEYS.FUTURES_PORTFOLIO?.key || 'nfl_futures_portfolio_v1', { positions: [] });
      let schedule = [];
      try {
        const resp = await fetch('./schedule.json');
        if (resp.ok) schedule = await resp.json();
      } catch { /* non-fatal */ }
      systemPromptRef.current = buildFuturesSystemPrompt(portfolio, schedule);
      setContextLoaded(true);
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (messages.length > 0) saveToStorage(CHAT_HISTORY_KEY, messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

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
        tools: BETTING_TOOLS,
        executeToolFn: executeTool,
        onStep: (step) => {
          if (step.type === 'assistant') {
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), step.message];
              }
              return [...prev, step.message];
            });
          } else if (step.type === 'provider_fallback') {
            setActiveModelLabel(step.model + ' (fallback)');
          }
        },
      });

      setMessages(finalMessages);
    } catch (err) {
      logger.error('[FuturesAgent] sendMessage error:', err);
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
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Trophy size={16} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm tracking-tight">FUTURES Agent</h2>
            <p className="text-slate-500 text-[10px]">Season-arc strategy &middot; Hedging math &middot; Podcast intel &middot; Platinum Rose</p>
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

      <FuturesStatusBar
        openFuturesCount={openFuturesCount}
        weekLabel={weekLabel}
        isLoading={isLoading}
        provider={provider}
        activeModelLabel={activeModelLabel}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {displayMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Trophy size={24} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold mb-1">FUTURES Agent ready.</p>
              <p className="text-slate-500 text-sm max-w-xs">
                {contextLoaded
                  ? 'Context loaded. Ask about a division, conference, MVP race, or hedge.'
                  : 'Loading context...'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Who do experts like for AFC North?',
                'Show futures movement on MVP',
                'Is anyone fading the Lions to win NFC North?',
                'Calculate hedge: KC NFC futures at +800, current ML -150',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500/40 transition-colors"
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
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mt-0.5">
              <Trophy size={13} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
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
            placeholder="Ask about a division, MVP race, hedge math, or what experts are saying."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 resize-none leading-relaxed"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-slate-600 text-[10px] mt-1.5 px-1">
          Enter to send &middot; Shift+Enter for newline &middot; Agent must confirm before logging futures &middot; Picks flagged needs_review are excluded
        </p>
      </div>
    </div>
  );
}
