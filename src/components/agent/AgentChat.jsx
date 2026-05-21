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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runAgentTurn, runOpenAIAgentTurn } from '../../lib/anthropicClient.js';
import { BETTING_TOOLS, executeTool } from '../../lib/agentTools.js';
import { loadFromStorage, saveToStorage } from '../../lib/storage.js';
import { getBankrollData } from '../../lib/bankroll.js';
import {
  loadPicks,
  calculateStandings,
  statsByConfidence,
  statsByEdge,
} from '../../lib/picksDatabase.js';
import { getNFLWeekInfo } from '../../lib/constants.js';
import { ANTHROPIC_API_KEY, ANTHROPIC_API, OPENAI_API_KEY } from '../../lib/apiConfig.js';
import {
  getRecentResearchIntelNotes,
  getRecentResearchPickSignals,
  getRecentSharpTweets,
  getRecentPlayerInjuries,
  getLatestWeekOdds,
  getGameSplitsForWeek,
} from '../../lib/supabase.js';
import { loadReferenceNotes } from '../../lib/vaultClient.js';

// ─── localStorage keys (from betting.manifest.json persistenceKeys) ──────────
const CHAT_HISTORY_KEY = 'nfl_betting_agent_chat_v1';
const SESSION_KEY      = 'nfl_betting_agent_session_v1';
const USER_API_KEY_KEY = 'nfl_betting_agent_apikey_v1';
const SUNDAY_BRIEF_MODE_KEY = 'nfl_betting_agent_sunday_brief_mode_v1';
const LAST_AUTO_BRIEF_DATE_KEY = 'nfl_betting_agent_last_auto_brief_date_v1';

const PROACTIVE_BRIEF_PROMPT = `Run Sunday Slate Briefing mode now.

Before calling any tools, read the "NFL Phase" from your context (PRESEASON = before Sep 8 2026; WEEK N = regular season; OFFSEASON = after playoffs).

**If it is PRESEASON or OFFSEASON (no live game slate):**
Skip game-spread and line-movement tools — live lines do not exist yet. Instead:
1. Call get_odds once (any game) to confirm no lines are available
2. State clearly: "No active game slate — [phase]. Offseason mode."
3. Surface the top 2–3 futures value plays from the Super Bowl odds market if any team shows meaningful edge vs implied probability
4. List any open picks that need monitoring or hedging
5. End with: confidence=N/A · pass note: return at Week 1

**If it is regular season or playoffs (live slate available):**
1. Call get_odds to scan available lines
2. Call get_line_movement for any game with movement > 1.5 pts
3. Call analyze_matchup for the top 2–3 games showing edge
Then output:
1. **Top 3 Plays** — line/book/unit/tier or "none qualified"
2. **Teaser Check** — one 6pt teaser evaluation across key numbers
3. **Hedge/Watchout** — one open position worth monitoring
4. **Confidence + Pass Note** — where edge is insufficient, say pass

Keep it concise and actionable. No preamble.`;

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

// ─── Calibration Summary ─────────────────────────────────────────────────────

/**
 * Build a concise performance calibration block for the system prompt.
 * Returns a multi-line string (2–4 lines) summarising all-time record,
 * units, ROI, last-10 form, and high-confidence win rate (if ≥3 samples).
 */
function buildCalibrationSummary(picks) {
  const JUICE = 1.1;
  const graded = (picks || []).filter(p => p.result !== 'PENDING');
  if (graded.length === 0) return '  No graded picks yet.';

  const wins = graded.filter(p => p.result === 'WIN').length;
  const losses = graded.filter(p => p.result === 'LOSS').length;
  const pushes = graded.filter(p => p.result === 'PUSH').length;
  const units = graded.reduce((acc, p) => {
    if (p.result === 'WIN') return acc + 1;
    if (p.result === 'LOSS') return acc - JUICE;
    return acc;
  }, 0);
  const decided = wins + losses;
  const winRate = decided > 0 ? (wins / decided * 100).toFixed(1) : '0.0';
  const roi = decided > 0 ? (units / decided * 100).toFixed(1) : '0.0';

  const last10 = graded.slice(-10);
  const l10W = last10.filter(p => p.result === 'WIN').length;
  const l10L = last10.filter(p => p.result === 'LOSS').length;

  const aiPicks = graded.filter(p => p.source === 'AI_LAB' && p.confidence >= 60);
  const aiW = aiPicks.filter(p => p.result === 'WIN').length;
  const aiConfLine = aiPicks.length >= 3
    ? `  60%+ confidence AI picks: ${aiW}-${aiPicks.length - aiW} (${(aiW / aiPicks.length * 100).toFixed(0)}% win rate)`
    : null;

  const pushNote = pushes > 0 ? `-${pushes}` : '';
  const lines = [
    `  All-time: ${wins}-${losses}${pushNote} | Win%: ${winRate} | Units: ${units >= 0 ? '+' : ''}${units.toFixed(2)} | ROI: ${roi}%`,
    `  Last 10: ${l10W}-${l10L}`,
  ];
  if (aiConfLine) lines.push(aiConfLine);

  return lines.join('\n');
}

/**
 * Build a concise research intel summary block for the system prompt.
 * Shows note counts by source and the top recent pick signals.
 */
function buildIntelSummary(intelData) {
  if (!intelData || (!intelData.notes?.length && !intelData.signals?.length)) {
    return '  No recent intel captured (agent may not have run yet).';
  }

  const { notes = [], signals = [] } = intelData;

  // Source breakdown
  const bySource = {};
  notes.forEach(n => {
    bySource[n.source] = (bySource[n.source] || 0) + 1;
  });
  const sourceLine = Object.entries(bySource)
    .map(([src, count]) => `${src}: ${count}`)
    .join(' | ') || 'No sources';

  const lines = [`  Sources: ${sourceLine} (${notes.length} articles)`];

  if (signals.length > 0) {
    lines.push('  Pick signals:');
    signals.slice(0, 8).forEach(s => {
      const conf = s.confidence ? ` (conf: ${(+s.confidence).toFixed(2)})` : '';
      lines.push(`    - [${s.source}] ${s.lean}${conf}`);
    });
  }

  return lines.join('\n');
}

/**
 * Build a grouped injury report block for the system prompt.
 * Shows Out/Doubtful/Questionable/IR/PUP players grouped by team.
 */
function buildInjurySummary(injuries) {
  if (!injuries?.length) return '  None reported (offseason or data pending).';
  const byTeam = {};
  for (const p of injuries) {
    if (!byTeam[p.team_abbr]) byTeam[p.team_abbr] = [];
    byTeam[p.team_abbr].push(p);
  }
  return Object.entries(byTeam)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, players]) =>
      `  ${team}: ` +
      players
        .map(p =>
          `${p.player_name} (${p.position || '?'}) — ` +
          `${p.injury_status}${p.injury_type ? ` [${p.injury_type}]` : ''}`,
        )
        .join(', '),
    )
    .join('\n');
}

/**
 * Build a compact current-lines block for the system prompt.
 * Shows one row per game (spread + O/U) from the latest odds snapshot.
 */
function buildOddsSummary(odds) {
  if (!odds?.length) {
    return '  No lines available (offseason or ingest pending).';
  }
  const games = {};
  for (const row of odds) {
    if (!games[row.game_id]) {
      games[row.game_id] = {
        home: row.home_team, away: row.away_team,
        commence: row.commence_time,
      };
    }
    if (row.market === 'spread') {
      games[row.game_id].spread = row.spread;
      games[row.game_id].homePrice = row.home_price;
      games[row.game_id].awayPrice = row.away_price;
    }
    if (row.market === 'total') {
      games[row.game_id].total = row.total;
    }
    if (row.market === 'moneyline') {
      games[row.game_id].mlHome = row.home_price;
      games[row.game_id].mlAway = row.away_price;
    }
  }
  return Object.values(games)
    .map(g => {
      const parts = [`  ${g.away} @ ${g.home}`];
      if (g.spread != null) {
        const favSign = g.spread <= 0 ? '' : '+';
        parts.push(
          `Spread: ${g.away} ${g.spread > 0 ? '+' : ''}${-g.spread} ` +
          `(${g.awayPrice > 0 ? '+' : ''}${g.awayPrice ?? '?'})`,
        );
      }
      if (g.total != null) parts.push(`O/U ${g.total}`);
      return parts.join(' | ');
    })
    .join('\n');
}

/**
 * Build a compact betting-splits block for the system prompt.
 * Shows ticket% vs money% per game to surface sharp divergence.
 */
function buildSplitsSummary(splits) {
  if (!splits?.length) return '  No splits data (offseason or ingest pending).';
  return splits
    .map(r => {
      const homeT = r.spread_home_bettors != null ? `${r.spread_home_bettors}%t` : '--';
      const homeM = r.spread_home_money   != null ? `${r.spread_home_money}%$`  : '--';
      const ovrT  = r.total_over_bettors  != null ? `${r.total_over_bettors}%t` : '--';
      const ovrM  = r.total_over_money    != null ? `${r.total_over_money}%$`   : '--';
      return `  ${r.away_team} @ ${r.home_team} | ` +
             `Spread home ${homeT}/${homeM} | O/U over ${ovrT}/${ovrM}`;
    })
    .join('\n');
}

function buildSystemPrompt(picks, bankrollData, futuresData, schedule, intelData = null, vaultNotes = null, sharpTweets = null, injuryData = null, currentOdds = null, splitsData = null) {
  const openPicks = (picks || []).filter(p => p.result === 'PENDING');
  const { label: weekLabel, phase } = getNFLWeekInfo();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const upcomingGames = (schedule || []).slice(0, 20)
    .map(g => `  ${g.visitor || g.away_team || '?'} @ ${g.home || g.home_team || '?'}${g.date ? ` (${g.date})` : ''}`)
    .join('\n');

  const futures = (futuresData?.positions || []).slice(0, 10);

  const isInSeason = phase === 'regular' || phase === 'playoffs';
  const phaseNote = isInSeason
    ? ''
    : `
⚠️ TOOL GUIDANCE — ${weekLabel}: Live game lines and line movement data are NOT available in the offseason/preseason. get_odds and get_line_movement will return empty or placeholder results for game spreads/totals. Do NOT make multiple game-specific tool calls that will all fail. For proactive briefings in this phase, confirm line unavailability with ONE get_odds call, then pivot to futures market analysis or open-picks monitoring.`;

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
- get_performance_stats → historical ROI by confidence tier, edge size, and team
- search_intel → keyword search across recent research articles + pick signals by source/team
- search_sharp_tweets → search recent tweets from sharp NFL accounts (VSiN, Warren Sharp, Action Network, PFF, etc.)
- read_vault_note → load a note from the NFL betting vault (reference data, past session angles, team notes)
- write_vault_note → save post-session notes or update reference data in the vault (confirm first)
${phaseNote}

## Context (loaded at session start)
Today: ${today}
NFL Phase: ${weekLabel} (${phase})

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

### Performance (calibration signal):
${buildCalibrationSummary(picks)}

### Research Intel (72h capture):
${buildIntelSummary(intelData)}
${sharpTweets && sharpTweets.length > 0 ? `
### Sharp Account Tweets (48h):
${sharpTweets.slice(0, 8).map(t => `  @${t.author_handle}: ${t.text.slice(0, 200)}${t.text.length > 200 ? '…' : ''}`).join('\n').slice(0, 2000)}` : ''}
${vaultNotes ? `\n### Vault Reference Notes (pre-loaded):\n${vaultNotes.slice(0, 3000)}` : ''}

### Recent Injuries (Out/Doubtful/Questionable/IR/PUP):
${buildInjurySummary(injuryData)}

### Current Lines (Week ${getNFLWeekInfo().week || 'Offseason'}):
${buildOddsSummary(currentOdds)}

### Betting Splits — Public Action Network (Week ${getNFLWeekInfo().week || 'Offseason'}):
${buildSplitsSummary(splitsData)}

### Upcoming Schedule:
${upcomingGames || '  No schedule data loaded'}

Acknowledge that you have this context loaded and briefly state open picks count, bankroll balance, current NFL phase, and all-time record at conversation start.\`;
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
    get_performance_stats: '📈 Performance Stats',
    search_intel:          '🔍 Search Intel',
    search_sharp_tweets:   '🐦 Sharp Tweets',
    read_vault_note:       '📖 Read Vault Note',
    write_vault_note:      '📝 Write Vault Note',
    get_betting_splits:    '📊 Betting Splits',
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

// Styled component overrides for ReactMarkdown
const mdComponents = {
  h1: ({ children }) => <h1 className="font-bold text-white text-sm mt-3 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="font-bold text-slate-100 text-sm mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-semibold text-slate-100 text-sm mt-2 mb-0.5">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
  code: ({ inline, children }) => inline
    ? <code className="text-amber-300 font-mono text-[11px] bg-slate-800/80 px-1 py-0.5 rounded">{children}</code>
    : <pre className="bg-slate-800/60 rounded p-2 my-1 overflow-x-auto"><code className="text-amber-200 font-mono text-[11px]">{children}</code></pre>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
  li: ({ children }) => <li className="text-slate-200 leading-relaxed">{children}</li>,
  p: ({ children }) => <p className="text-slate-200 leading-relaxed mb-1 last:mb-0">{children}</p>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-600 pl-3 text-slate-400 italic my-1">{children}</blockquote>,
  hr: () => <hr className="border-slate-700 my-2" />,
  a: ({ href, children }) => <a href={href} className="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <table className="text-xs border-collapse my-2 w-full">{children}</table>,
  th: ({ children }) => <th className="border border-slate-700 px-2 py-1 text-slate-300 font-semibold bg-slate-800/60 text-left">{children}</th>,
  td: ({ children }) => <td className="border border-slate-700 px-2 py-1 text-slate-300">{children}</td>,
};

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
              <div key={i} className="text-sm leading-relaxed mb-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {block.text}
                </ReactMarkdown>
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

function AgentStatusBar({ openPicksCount, bankrollBalance, weekLabel, phase, isLoading, briefingRunning, provider }) {
  const modelLabel = provider === 'anthropic'
    ? (ANTHROPIC_API.MODEL_DEFAULT || 'claude-sonnet-4-5')
    : 'gpt-4o-mini';
  const isOffseason = phase === 'preseason' || phase === 'offseason';
  const phaseColor = isOffseason ? 'text-slate-500' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span className="text-slate-400 font-bold">BETTING</span>
      </div>
      <div className="h-3 w-px bg-slate-700" />
      <span className="text-slate-500 font-mono">{modelLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span className={phaseColor}>{weekLabel}</span>
      <div className="h-3 w-px bg-slate-700" />
      <span>Open picks: <span className="text-slate-300">{openPicksCount}</span></span>
      {bankrollBalance && (
        <>
          <div className="h-3 w-px bg-slate-700" />
          <span>Balance: <span className="text-slate-300">${bankrollBalance}</span></span>
        </>
      )}
      {isLoading && (
        <span className="ml-auto text-amber-400 animate-pulse">
          {briefingRunning ? 'Briefing in progress…' : 'Thinking…'}
        </span>
      )}
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
  // Flags whether the last abort was a self-imposed timeout (vs manual clear)
  const isTimedOutRef = useRef(false);

  const [isProactiveBriefRunning, setIsProactiveBriefRunning] = useState(false);

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

      const [intelNotes, intelSignals, vaultNotes, sharpTweets, injuries, weekOdds, gameSplits] = await Promise.all([
        getRecentResearchIntelNotes(72, 200),
        getRecentResearchPickSignals(72, 50),
        loadReferenceNotes(),
        getRecentSharpTweets(48, 30),
        getRecentPlayerInjuries(168, 100),
        getLatestWeekOdds(getNFLWeekInfo().week),
        getGameSplitsForWeek(getNFLWeekInfo().week),
      ]);
      const intelData = { notes: intelNotes, signals: intelSignals };

      systemPromptRef.current = buildSystemPrompt(
        picks, bankroll, futures, schedule,
        intelData, vaultNotes || null, sharpTweets || null,
        injuries || null, weekOdds || null, gameSplits || null,
      );
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
    setIsProactiveBriefRunning(true);

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
    isTimedOutRef.current = false;

    const BRIEF_TIMEOUT_MS = 45000;
    const timeoutId = setTimeout(() => {
      isTimedOutRef.current = true;
      controller.abort();
    }, BRIEF_TIMEOUT_MS);

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
      if (err.name === 'AbortError') {
        if (isTimedOutRef.current) {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: [{ type: 'text', text: '⚠️ Briefing timed out (45s). Live data sources are likely unavailable — expected during the NFL offseason. No qualifying edge confirmed at this time.' }],
            },
          ]);
        }
        return; // silent on manual clear
      }
      setError(err.message);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsProactiveBriefRunning(false);
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
        phase={getNFLWeekInfo().phase}
        isLoading={isLoading}
        briefingRunning={isProactiveBriefRunning}
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
              {(getNFLWeekInfo().phase === 'regular' || getNFLWeekInfo().phase === 'playoffs'
                ? ['Best plays this week', 'Show me line movements today', 'Calculate a 6pt teaser', 'Analyze Chiefs vs Eagles']
                : ['Check Super Bowl futures', 'Any futures value right now?', 'Review my open picks', 'When does the season start?']
              ).map(s => (
                <button
                  key={s}
                  onClick={() => s === 'Best plays this week' ? sendBestPlaysCommand() : setInput(s)}
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
