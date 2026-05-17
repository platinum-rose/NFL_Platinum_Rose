// src/components/agent/AgentChat.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// BETTING Agent — Chat UI (F-6 POC)
// Implements the Platinum Rose BETTING agent persona from agents/product/tier1/BETTING.md.
//
// Architecture:
//   - anthropicClient.runAgentTurn() handles the full tool loop
//   - agentTools.BETTING_TOOLS defines the Anthropic tool schemas
//   - agentTools.executeTool() is the dispatcher
//   - Context (picks/bankroll/futures/schedule) is injected into the system prompt
//   - Chat history is persisted to localStorage nfl_betting_agent_chat_v1
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Wrench, ChevronDown, ChevronRight, Trash2, AlertCircle, Key, CheckCircle2 } from 'lucide-react';
import { runAgentTurn, runOpenAIAgentTurn } from '../../lib/anthropicClient.js';
import { BETTING_TOOLS, executeTool } from '../../lib/agentTools.js';
import { loadFromStorage, saveToStorage } from '../../lib/storage.js';
import { getBankrollData } from '../../lib/bankroll.js';
import { loadPicks } from '../../lib/picksDatabase.js';
import { getNFLWeekInfo } from '../../lib/constants.js';
import { ANTHROPIC_API_KEY, ANTHROPIC_API, OPENAI_API_KEY } from '../../lib/apiConfig.js';

// ─── localStorage keys (from betting.manifest.json persistenceKeys) ──────────
const CHAT_HISTORY_KEY = 'nfl_betting_agent_chat_v1';
const SESSION_KEY      = 'nfl_betting_agent_session_v1';
const USER_API_KEY_KEY = 'nfl_betting_agent_apikey_v1';
const SUNDAY_BRIEF_MODE_KEY = 'nfl_betting_agent_sunday_brief_mode_v1';
const LAST_AUTO_BRIEF_DATE_KEY = 'nfl_betting_agent_last_auto_brief_date_v1';

const PROACTIVE_BRIEF_PROMPT =
  'Run Sunday Slate Briefing mode now. Open with your best available NFL plays for this slate (or explicitly state no qualified edge). Use tools as needed. Response format: (1) Top 3 plays with line/book/unit and tier, (2) one teaser check, (3) one hedge/watchout, (4) confidence + pass note where edge is insufficient. Keep it concise and actionable.';

function isBestPlaysCommand(text = '') {
  const t = String(text).trim().toLowerCase();
  return (
    t === 'best plays' ||
    t === 'best play' ||
    t === '/best plays' ||
    t === '/best-play' ||
    t === '/bestplays'
  );
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(picks, bankrollData, futuresData, schedule) {
  const openPicks = (picks || []).filter(p => p.result === 'PENDING');
  const { label: weekLabel } = getNFLWeekInfo();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const upcomingGames = (schedule || []).slice(0, 20)
    .map(g => `  ${g.visitor || g.away_team || '?'} @ ${g.home || g.home_team || '?'}${g.date ? ` (${g.date})` : ''}`)
    .join('\n');

  const futures = (futuresData?.positions || []).slice(0, 10);

  return `You are the BETTING agent for Platinum Rose — the Creator's sharp NFL betting analyst.

## Identity
Your job is not to push picks. Your job is to surface information that lets the Creator make the call faster and with better data — then execute when told to act.

## Core Rules
- Lead with the bet or the key number. No preamble.
- Show your work: every recommendation must include evidence (model projection, line movement, public/sharp splits, expert consensus).
- Flag contradicting signals. Never smooth them over.
- When you lack data, say so explicitly. Never fabricate lines or projections.
- Ask at most ONE clarifying question before producing a recommendation.
- CRITICAL: Never call log_pick without explicit user confirmation. Always ask "Shall I log this?" and wait for a clear "yes", "log it", or "record that" before calling the tool. If unsure, ask.

## Available Tools
- get_odds → current lines from all sportsbooks (Supabase cache)
- get_line_movement → opening vs current line + sharp activity
- analyze_matchup → model projections + schedule intel
- get_injury_report → ESPN injury designations for a team
- calculate_hedge → hedge math for active positions
- calculate_teaser → key number analysis + Wong teaser check
- log_pick → write to Picks Tracker (CONFIRM FIRST, always)

## Context (loaded at session start)
Today: ${today}
NFL Week: ${weekLabel}

### Open Picks (${openPicks.length} pending):
${openPicks.length > 0
  ? openPicks.slice(0, 20).map(p => `  - ${p.selection} ${p.pickType} ${p.line > 0 ? '+' : ''}${p.line} (${p.gameDate || '?'})`).join('\n')
  : '  None'}

### Bankroll:
  Unit size: $${bankrollData?.unitSize || bankrollData?.settings?.unitSize || 25}
  Current balance: $${bankrollData?.currentBalance || bankrollData?.settings?.startingBalance || 'N/A'}
  Open bets: ${(bankrollData?.bets || []).filter(b => b.result === 'pending' || !b.result).length}

### Futures Positions (${futures.length}):
${futures.length > 0
  ? futures.map(f => `  - ${f.team || '?'} ${f.market || 'futures'} @ ${f.oddsAtEntry || f.odds || '?'} (${f.stake || f.amount || '?'} units)`).join('\n')
  : '  None'}

### Upcoming Schedule:
${upcomingGames || '  No schedule data loaded'}

Acknowledge that you have this context loaded and briefly state open picks count + bankroll balance at conversation start.`;
}

// ─── Message Rendering Helpers ───────────────────────────────────────────────

function ToolCallCard({ name, input, result, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const toolLabels = {
    get_odds:            '📊 Get Odds',
    get_line_movement:   '📈 Line Movement',
    analyze_matchup:     '🔍 Analyze Matchup',
    get_injury_report:   '🏥 Injury Report',
    calculate_hedge:     '🛡️ Hedge Calc',
    calculate_teaser:    '🎯 Teaser Eval',
    log_pick:            '📝 Log Pick',
  };
  const label = toolLabels[name] || `🔧 ${name}`;

  return (
    <div className="my-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
      >
        <Wrench size={11} className="text-amber-400 flex-shrink-0" />
        <span className="font-bold text-amber-300 flex-1">{label}</span>
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
                {typeof result === 'string' ? result : JSON.stringify(JSON.parse(result), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Render a single assistant message block (may include text + tool calls)
function AssistantMessage({ message, toolResultsMap }) {
  if (!message || message.role !== 'assistant') return null;
  const blocks = Array.isArray(message.content) ? message.content : [];

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mt-0.5">
        <Bot size={13} className="text-emerald-400" />
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
    if (!k.startsWith('sk-ant-')) {
      setError('Must start with sk-ant-  (Anthropic API key format)');
      return;
    }
    saveToStorage(USER_API_KEY_KEY, k);
    onKeySet(k);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <Key size={28} className="text-emerald-400" />
      </div>
      <div>
        <h2 className="text-white font-bold text-lg mb-1">BETTING Agent</h2>
        <p className="text-slate-400 text-sm">Enter your Anthropic API key to activate the agent.<br />Key is stored locally and never sent to any server other than api.anthropic.com.</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="sk-ant-api03-..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        {error && <p className="text-rose-400 text-xs">{error}</p>}
        <button
          onClick={handle}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
        >
          Activate Agent
        </button>
      </div>
      <p className="text-slate-600 text-xs max-w-xs">
        Need a key? Get one at <span className="text-slate-400">console.anthropic.com</span>. The BETTING agent uses {ANTHROPIC_API.MODEL_DEFAULT || 'claude-sonnet-4-5'}.
      </p>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

function AgentStatusBar({ openPicksCount, bankrollBalance, weekLabel, isLoading, provider }) {
  const modelLabel = provider === 'anthropic'
    ? (ANTHROPIC_API.MODEL_DEFAULT || 'claude-sonnet-4-5')
    : 'gpt-4o-mini';
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span className="text-slate-400 font-bold">BETTING</span>
      </div>
      <div className="h-3 w-px bg-slate-700" />
      <span className="text-slate-500 font-mono">{modelLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>{weekLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>Open picks: <span className="text-slate-300">{openPicksCount}</span></span>
      {bankrollBalance && (
        <>
          <div className="h-3 w-px bg-slate-700" />
          <span>Balance: <span className="text-slate-300">${bankrollBalance}</span></span>
        </>
      )}
      {isLoading && <span className="ml-auto text-amber-400 animate-pulse">Thinking…</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentChat() {
  // Provider + API key detection (priority: env vars → stored key → manual entry)
  // env vars: VITE_ANTHROPIC_API_KEY takes precedence over VITE_OPENAI_API_KEY
  const envKey      = ANTHROPIC_API_KEY || OPENAI_API_KEY || '';
  const envProvider = ANTHROPIC_API_KEY ? 'anthropic' : (OPENAI_API_KEY ? 'openai' : null);

  // Stored key is { key, provider } JSON (or legacy plain string for backwards compat)
  const storedRaw  = loadFromStorage(USER_API_KEY_KEY, '');
  let storedKey = '', storedProvider = null;
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      storedKey      = parsed.key || '';
      storedProvider = parsed.provider || null;
    } catch {
      // Legacy plain string — detect from prefix
      storedKey      = typeof storedRaw === 'string' ? storedRaw : '';
      storedProvider = storedKey.startsWith('sk-ant-') ? 'anthropic' : (storedKey.startsWith('sk-') ? 'openai' : null);
    }
  }

  const [apiKey, setApiKey]     = useState(envKey || storedKey || '');
  const [provider, setProvider] = useState(envProvider || storedProvider || 'openai');

  // Conversation state (Anthropic messages format — includes tool_result messages)
  const [messages, setMessages] = useState(() => {
    return loadFromStorage(CHAT_HISTORY_KEY, []);
  });

  // UI state
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sundayBriefMode, setSundayBriefMode] = useState(() =>
    loadFromStorage(SUNDAY_BRIEF_MODE_KEY, true)
  );

  // Abort controller — cancelled when user clicks Clear during an active run
  const abortControllerRef = useRef(null);

  // Context for system prompt
  const [contextLoaded, setContextLoaded] = useState(false);
  const systemPromptRef = useRef('');
  const scrollRef = useRef(null);

  // Derived status bar data
  const openPicksCount = (loadFromStorage('pr_picks_v1', []) || []).filter(p => p.result === 'PENDING').length;
  const bankrollData = getBankrollData();
  const bankrollBalance = bankrollData?.settings?.startingBalance || bankrollData?.currentBalance || null;

  // Load context and build system prompt on mount
  useEffect(() => {
    async function loadContext() {
      const picks = loadPicks();
      const bankroll = getBankrollData();
      const futures = loadFromStorage('nfl_futures_portfolio_v1', { positions: [] });

      let schedule = [];
      try {
        const resp = await fetch('./schedule.json');
        if (resp.ok) schedule = await resp.json();
      } catch { /* non-fatal */ }

      systemPromptRef.current = buildSystemPrompt(picks, bankroll, futures, schedule);
      setContextLoaded(true);
    }
    loadContext();
  }, []);

  // Persist chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage(CHAT_HISTORY_KEY, messages);
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Build a map of tool_use_id → tool result content for rendering
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
    let updatedMessages = [...messages, userMsg];

    // F-9: typed "best plays" should force proactive slate output mode.
    if (isBestPlaysCommand(text)) {
      updatedMessages = [
        ...updatedMessages,
        {
          role: 'user',
          content: PROACTIVE_BRIEF_PROMPT,
          hidden: true,
          meta: { trigger: 'typed_best_plays_command' },
        },
      ];
    }

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
              // Replace or append the latest assistant message
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), step.message];
              }
              return [...prev, step.message];
            });
          }
          // tool_start and tool_result are reflected by subsequent assistant message updates
        },
      });

      setMessages(finalMessages);
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled — silent
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, apiKey, provider]);

  const runProactiveBrief = useCallback(async (trigger = 'manual') => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    const hiddenPromptMessage = {
      role: 'user',
      content: PROACTIVE_BRIEF_PROMPT,
      hidden: true,
      meta: { trigger },
    };

    const updatedMessages = [...messages, hiddenPromptMessage];
    setMessages(updatedMessages);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const runFn = provider === 'anthropic' ? runAgentTurn : runOpenAIAgentTurn;
      const finalMessages = await runFn({
        apiKey,
        systemPrompt: systemPromptRef.current,
        messages: updatedMessages,
        tools: BETTING_TOOLS,
        executeToolFn: executeTool,
        signal: controller.signal,
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
      if (err.name === 'AbortError') return; // user cancelled — silent
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isLoading, messages, provider]);

  const sendBestPlaysCommand = useCallback(async () => {
    await runProactiveBrief('best_plays_command');
  }, [runProactiveBrief]);

  const clearHistory = useCallback(() => {
    if (window.confirm('Clear all conversation history?')) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
      setError(null);
      setMessages([]);
      saveToStorage(CHAT_HISTORY_KEY, []);
    }
  }, []);

  useEffect(() => {
    const day = new Date().getDay(); // Sunday=0
    const isSunday = day === 0;
    if (!contextLoaded || !sundayBriefMode || !isSunday) return;
    if (!apiKey || isLoading || messages.length > 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const lastAutoDate = loadFromStorage(LAST_AUTO_BRIEF_DATE_KEY, '');
    if (lastAutoDate === today) return;

    saveToStorage(LAST_AUTO_BRIEF_DATE_KEY, today);
    runProactiveBrief('auto_sunday_open');
  }, [
    apiKey,
    contextLoaded,
    isLoading,
    messages.length,
    runProactiveBrief,
    sundayBriefMode,
  ]);

  // If no API key, show setup screen
  if (!apiKey) {
    return (
      <div className="h-[calc(100vh-120px)] bg-slate-950 rounded-xl border border-slate-800">
        <ApiKeySetup onKeySet={(k, p) => { setApiKey(k); setProvider(p); }} />
      </div>
    );
  }

  const { label: weekLabel } = getNFLWeekInfo();

  // Render messages for display (skip pure tool_result user messages — shown inline in tool cards)
  const displayMessages = messages.filter(msg => {
    if (msg.role === 'user') {
      if (msg.hidden) return false;
      // Only show plain string user messages (not tool results)
      return typeof msg.content === 'string';
    }
    return true; // show all assistant messages
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Bot size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm tracking-tight">BETTING Agent</h2>
            <p className="text-slate-500 text-[10px]">NFL Sharp Analyst · Platinum Rose</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendBestPlaysCommand}
            disabled={isLoading || !contextLoaded}
            className="text-[10px] text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Run proactive Sunday slate briefing"
          >
            Best Plays
          </button>
          <button
            onClick={() => {
              const next = !sundayBriefMode;
              setSundayBriefMode(next);
              saveToStorage(SUNDAY_BRIEF_MODE_KEY, next);
            }}
            className="text-[10px] text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-emerald-500/50 transition-colors"
            title="Toggle proactive Sunday open behavior"
          >
            Sunday Mode: {sundayBriefMode ? 'On' : 'Off'}
          </button>
          {!envKey && (
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

      {/* Status bar */}
      <AgentStatusBar
        openPicksCount={openPicksCount}
        bankrollBalance={bankrollBalance}
        weekLabel={weekLabel}
        isLoading={isLoading}
        provider={provider}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {displayMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Bot size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold mb-1">BETTING Agent ready.</p>
              <p className="text-slate-500 text-sm max-w-xs">
                {contextLoaded
                  ? 'Context loaded. Ask about a game, line, hedge, or teaser.'
                  : 'Loading context…'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['What should I bet this week?', 'Show me line movements today', 'Analyze Chiefs vs Eagles', 'Calculate a 6pt teaser'].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-emerald-500/40 transition-colors"
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
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mt-0.5">
              <Bot size={13} className="text-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
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
            placeholder="Ask about a game, line move, hedge, or say 'log it' to record a pick…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none leading-relaxed"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-slate-600 text-[10px] mt-1.5 px-1">
          Enter to send · Shift+Enter for newline · Agent must confirm before logging picks
        </p>
      </div>
    </div>
  );
}
