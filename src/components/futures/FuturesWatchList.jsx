// src/components/futures/FuturesWatchList.jsx
// Watch List — track futures price history and buy signals for pinned teams.
// Data: Supabase futures_odds_snapshots (updated nightly by FuturesOddsIngestAgent).
// Storage: nfl_futures_watchlist_v1 — { teams: string[], targets: { "team|market": number } }
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Target, Plus, X,
  Bell, ChevronDown, ChevronUp, Clock, AlertCircle, CalendarDays,
  MessageCircle, ExternalLink, Pin, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip as ReTooltip, YAxis, XAxis,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { getWatchlistOddsHistory, getFuturesPins, addFuturesPin, removeFuturesPin } from '../../lib/supabase';
import { getExpertSignalsForPin } from '../../lib/expertSignals';
import { loadFromStorage, saveToStorage, PR_STORAGE_KEYS } from '../../lib/storage';
import { TEAM_LOGOS, NFL_TEAMS } from '../../lib/teams';
import { getCitationsForTeam, getHostSentimentSummary, getMarketConsensus, getUniqueHostTakes } from '../../lib/hostCitationStore';
import { getContractsForTeam } from '../../lib/predictionMarketStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = PR_STORAGE_KEYS.FUTURES_WATCHLIST.key;

const DEFAULT_WATCHLIST = {
  teams: ['Buffalo Bills', 'Green Bay Packers'],
  targets: {},
};

// Static markets — conference/division resolved per-team via getTeamMarkets()
const MARKET_SLOTS = [
  { slot: 'superbowl',  label: 'Super Bowl',     emoji: '🏆' },
  { slot: 'conference', label: 'Conf. Winner',   emoji: '🏈' },
  { slot: 'division',   label: 'Div. Winner',    emoji: '🎯' },
  { slot: 'wins',       label: 'Win Total (Over)', emoji: '📊', seasonal: true },
  { slot: 'playoffs',   label: 'Make Playoffs',  emoji: '🎟️', seasonal: true },
];

// Maps NFL_TEAMS.division string → market_type suffix used in Supabase
const DIVISION_TO_MARKET = {
  'AFC East':  'division_afc_east',
  'AFC North': 'division_afc_north',
  'AFC South': 'division_afc_south',
  'AFC West':  'division_afc_west',
  'NFC East':  'division_nfc_east',
  'NFC North': 'division_nfc_north',
  'NFC South': 'division_nfc_south',
  'NFC West':  'division_nfc_west',
};
const CONF_TO_MARKET = { AFC: 'conference_afc', NFC: 'conference_nfc' };

// ── NFL-ATLAS-1: pinned futures (any market, not just the 5 team slots above) ──
// See docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md. Award/player markets have
// no odds source anywhere in this repo (same real blocker as PROPS-1) — pins
// on these markets show expert signals only, no price chart.
const PIN_MARKETS = [
  { market: 'superbowl',      label: 'Super Bowl',       emoji: '🏆' },
  { market: 'conference',     label: 'Conf. Winner',     emoji: '🏈' },
  { market: 'division',       label: 'Div. Winner',      emoji: '🎯' },
  { market: 'wins',           label: 'Win Total (Over)', emoji: '📊' },
  { market: 'playoffs',       label: 'Make Playoffs',    emoji: '🎟️' },
  { market: 'mvp',            label: 'MVP',              emoji: '🏅' },
  { market: 'opoy',           label: 'Off. Player of Year', emoji: '🏅' },
  { market: 'dpoy',           label: 'Def. Player of Year', emoji: '🛡️' },
  { market: 'oroy',           label: 'Off. Rookie of Year', emoji: '🌟' },
  { market: 'droy',           label: 'Def. Rookie of Year', emoji: '🌟' },
  { market: 'coach_of_year',  label: 'Coach of the Year', emoji: '📋' },
];
const PIN_MARKET_LABEL = Object.fromEntries(PIN_MARKETS.map(m => [m.market, m]));

/**
 * Given a team full name, return the 5 concrete market_type keys to show.
 * Slot → market_type: superbowl stays as-is; conference/division resolved from roster.
 */
function getTeamMarkets(fullName) {
  const key = FULL_NAME_TO_KEY[fullName];
  const meta = key ? NFL_TEAMS[key] : null;
  return {
    superbowl:  'superbowl',
    conference: meta ? (CONF_TO_MARKET[meta.conference] || 'conference_afc') : 'conference_afc',
    division:   meta ? (DIVISION_TO_MARKET[meta.division] || 'division_afc_east') : 'division_afc_east',
    wins:       'wins',
    playoffs:   'playoffs',
  };
}

const BOOK_SHORT = {
  draftkings: 'DK', fanduel: 'FD', betmgm: 'MGM',
  caesars: 'CZR', betonline: 'BOL', bookmaker: 'BKR',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDecimal = (o) => {
  if (o == null) return 0;
  if (o >= 100)  return o / 100 + 1;
  if (o <= -100) return 100 / Math.abs(o) + 1;
  return 2;
};

const fmtOdds = (o) => {
  if (o == null) return '—';
  return o >= 0 ? `+${o}` : `${o}`;
};

const impliedPct = (o) => {
  if (o == null) return null;
  const d = toDecimal(o);
  if (!d) return null;
  return ((1 / d) * 100).toFixed(1);
};

// Build a name→key lookup from NFL_TEAMS for the Add Team modal
const FULL_NAME_TO_KEY = Object.fromEntries(
  Object.entries(NFL_TEAMS).map(([key, d]) => [d.fullName, key])
);
const ALL_TEAM_FULL_NAMES = Object.values(NFL_TEAMS)
  .map(d => d.fullName)
  .sort();

function getTeamLogo(fullName) {
  const key = FULL_NAME_TO_KEY[fullName];
  return key ? (TEAM_LOGOS[key] || '') : '';
}

/**
 * Analyse a history array and return a signal object.
 * history: [{snapshot_time, bestOdds, book}, ...] sorted oldest→newest
 */
function analyseSignal(history, target) {
  if (history.length < 2) return { trend: 'unknown', signals: [] };

  const newest = history[history.length - 1];
  const oldest = history[0];
  const newDec  = toDecimal(newest.bestOdds);
  const oldDec  = toDecimal(oldest.bestOdds);
  if (!oldDec) return { trend: 'unknown', signals: [] };

  const pctChange = (newDec - oldDec) / oldDec;   // positive = odds got longer = drifting out
  const signals = [];

  // Target hit
  if (target != null && newest.bestOdds != null && newest.bestOdds >= target) {
    signals.push({ type: 'TARGET_HIT', label: `🎯 Target hit (${fmtOdds(target)})`, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' });
  }

  // Shortening — sharp money coming in (odds contracted >12%)
  if (pctChange < -0.12) {
    signals.push({ type: 'SHORTENING', label: '⚡ Shortening — steam', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' });
  }

  // Drifting — price getting longer, value building (odds expanded >12%)
  if (pctChange > 0.12) {
    signals.push({ type: 'DRIFTING', label: '📈 Drifting — value building', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' });
  }

  const trend = Math.abs(pctChange) < 0.04 ? 'flat'
    : pctChange > 0 ? 'drifting'
    : 'shortening';

  return { trend, pctChange, signals, newest, oldest };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ history, trend }) {
  if (!history?.length) return (
    <div className="h-10 flex items-center justify-center text-xs text-slate-600">no data</div>
  );

  const data = history.map(p => ({ v: toDecimal(p.bestOdds) }));
  const color = trend === 'drifting' ? '#38bdf8'
    : trend === 'shortening' ? '#f59e0b'
    : '#64748b';

  // Invert Y so "drifting out" (higher decimal) goes UP visually
  const vals = data.map(d => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <YAxis domain={[min * 0.98, max * 1.02]} hide />
        <ReTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const dec = payload[0].value;
            // Convert decimal back to approximate American
            const amer = dec >= 2
              ? `+${Math.round((dec - 1) * 100)}`
              : `-${Math.round(100 / (dec - 1))}`;
            return (
              <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200">
                {amer}
              </div>
            );
          }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Timeline modal ────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

function TimelineModal({ team, market, history, onClose }) {
  const { oldest, newest, pctChange, trend } = useMemo(() => analyseSignal(history, null), [history]);

  const chartData = history.map(p => ({
    date: fmtDate(p.snapshot_time),
    odds: p.bestOdds,
    decimal: toDecimal(p.bestOdds),
    book: p.book,
    full_date: p.snapshot_time,
  }));

  const trendColor = trend === 'drifting' ? '#38bdf8'
    : trend === 'shortening' ? '#f59e0b'
    : '#64748b';

  const oddsRange = history.map(p => p.bestOdds).filter(o => o != null);
  const minOdds = Math.min(...oddsRange);
  const maxOdds = Math.max(...oddsRange);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div>
            <div className="font-semibold text-slate-100">
              {market.emoji} {market.label} — {team}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {history.length} data point{history.length !== 1 ? 's' : ''}
              {oldest && newest && oldest.snapshot_time !== newest.snapshot_time && (
                <> · {fmtDate(oldest.snapshot_time)} → {fmtDate(newest.snapshot_time)}</>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Summary row */}
        {history.length >= 2 && (
          <div className="flex gap-6 px-5 py-3 bg-slate-800/40 border-b border-slate-700/40 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">First</div>
              <span className="text-slate-200 font-medium">{fmtOdds(oldest?.bestOdds)}</span>
              <span className="text-slate-500 text-xs ml-1">{BOOK_SHORT[oldest?.book] || oldest?.book}</span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Latest</div>
              <span className="text-slate-200 font-medium">{fmtOdds(newest?.bestOdds)}</span>
              <span className="text-slate-500 text-xs ml-1">{BOOK_SHORT[newest?.book] || newest?.book}</span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Change</div>
              <span className={pctChange > 0 ? 'text-sky-400' : pctChange < 0 ? 'text-amber-400' : 'text-slate-400'}>
                {pctChange > 0 ? '▲' : pctChange < 0 ? '▼' : '→'}
                {Math.abs((pctChange ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Range</div>
              <span className="text-slate-300 text-xs">{fmtOdds(minOdds)} – {fmtOdds(maxOdds)}</span>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-12">
            No price history available yet.
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="px-4 pt-4 pb-2" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={v => {
                      // Convert decimal back to American for axis labels
                      const a = v >= 2 ? `+${Math.round((v-1)*100)}` : `-${Math.round(100/(v-1))}`;
                      return a;
                    }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <ReTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs">
                          <div className="text-slate-300 font-medium">{fmtOdds(d.odds)}</div>
                          <div className="text-slate-500">{d.date} · {BOOK_SHORT[d.book] || d.book}</div>
                        </div>
                      );
                    }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="decimal"
                    stroke={trendColor}
                    dot={{ fill: trendColor, r: 3, strokeWidth: 0 }}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Data table */}
            <div className="overflow-y-auto flex-1 px-5 pb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2 font-normal">Date</th>
                    <th className="text-right py-2 font-normal">Best Odds</th>
                    <th className="text-right py-2 font-normal">Implied</th>
                    <th className="text-right py-2 font-normal">Book</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((p, i) => {
                    const prev = history[history.length - 2 - i];
                    const moved = prev && p.bestOdds !== prev.bestOdds;
                    return (
                      <tr key={i} className={`border-b border-slate-800 ${moved ? 'text-slate-200' : 'text-slate-400'}`}>
                        <td className="py-1.5">{fmtDate(p.snapshot_time)}</td>
                        <td className="text-right font-medium">{fmtOdds(p.bestOdds)}</td>
                        <td className="text-right text-slate-500">{impliedPct(p.bestOdds)}%</td>
                        <td className="text-right text-slate-500">{BOOK_SHORT[p.book] || p.book}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Host Citation Chip ────────────────────────────────────────────────────────

const SHOW_EMOJI = {
  'Sharp or Square': '⚔️',
  'Even Money': '💰',
  'BettingPros Podcast': '🎯',
  'The Favorites': '⭐',
  'Action Network Sports Betting': '📡',
};

function HostCitationChip({ citation }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const initials = citation.host.split(' ').map(w => w[0]).join('').slice(0, 2);
  const isBullish = citation.sentiment === 'bullish';
  const chipColor = isBullish
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
    : 'bg-rose-500/15 border-rose-500/40 text-rose-400';
  const dotColor = isBullish ? 'bg-emerald-400' : 'bg-rose-400';
  const pubDate = new Date(citation.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="relative inline-block">
      <button
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium transition-all hover:brightness-125 ${chipColor}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={e => { e.stopPropagation(); setShowTooltip(t => !t); }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {initials}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-xs z-50 shadow-xl">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="font-semibold text-slate-100">{citation.host}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{SHOW_EMOJI[citation.show] || '🎙️'} {citation.show}</span>
          </div>
          <div className="text-slate-300 italic leading-relaxed mb-1.5">
            "{citation.quote.length > 120 ? citation.quote.slice(0, 117) + '...' : citation.quote}"
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>{pubDate}</span>
            <span>·</span>
            <span className={isBullish ? 'text-emerald-400' : 'text-rose-400'}>
              {isBullish ? '👍 Bullish' : '👎 Bearish'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Citation Drawer ──────────────────────────────────────────────────────────

function CitationDrawer({ team, filterMarket = null }) {
  const citations = useMemo(() => {
    const all = getCitationsForTeam(team);
    return filterMarket ? all.filter(c => c.market === filterMarket) : all;
  }, [team, filterMarket]);

  // Group by market slot — must run unconditionally, before the early
  // return below, so this hook's order never changes across renders
  // (react-hooks/rules-of-hooks).
  const grouped = useMemo(() => {
    const map = {};
    for (const c of citations) {
      if (!map[c.market]) map[c.market] = [];
      map[c.market].push(c);
    }
    return map;
  }, [citations]);

  if (citations.length === 0) return null;

  const MARKET_LABELS = {
    superbowl: '🏆 Super Bowl', conference: '🏈 Conference', division: '🎯 Division',
    wins: '📊 Win Total', playoffs: '🎟️ Playoffs', general: '💬 General',
  };

  return (
    <div className="px-4 pb-4">
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg overflow-hidden">
        {Object.entries(grouped).map(([market, cites]) => (
          <div key={market} className="border-b border-slate-700/30 last:border-b-0">
            <div className="px-3 py-1.5 bg-slate-800/80 text-xs font-medium text-slate-400">
              {MARKET_LABELS[market] || market} ({cites.length})
            </div>
            <div className="divide-y divide-slate-800/60">
              {cites.slice(0, 5).map(c => {
                const isBullish = c.sentiment === 'bullish';
                const pubDate = new Date(c.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={c.id} className="px-3 py-2 flex gap-2 items-start">
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isBullish ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-slate-200">{c.host}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">{SHOW_EMOJI[c.show] || '🎙️'} {c.show}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500">{pubDate}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        "{c.quote.length > 150 ? c.quote.slice(0, 147) + '...' : c.quote}"
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${isBullish ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                      {isBullish ? '👍' : '👎'}
                    </span>
                  </div>
                );
              })}
              {cites.length > 5 && (
                <div className="px-3 py-1.5 text-[10px] text-slate-600">
                  +{cites.length - 5} more citations
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Market Consensus Indicator ───────────────────────────────────────────────

function MarketConsensusIndicator({ team, marketSlot }) {
  const consensus = useMemo(() => getMarketConsensus(team, marketSlot), [team, marketSlot]);
  if (consensus.bullishCount === 0 && consensus.bearishCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
      {consensus.bullishCount > 0 && (
        <span className="text-emerald-400" title={`Bullish: ${consensus.bullishHosts.join(', ')}`}>
          👍 {consensus.bullishCount}
        </span>
      )}
      {consensus.bearishCount > 0 && (
        <span className="text-rose-400" title={`Bearish: ${consensus.bearishHosts.join(', ')}`}>
          👎 {consensus.bearishCount}
        </span>
      )}
    </div>
  );
}

// ── Prediction Market Badge ──────────────────────────────────────────────────

function PredictionMarketBadge({ team }) {
  const contracts = useMemo(() => {
    // Resolve abbreviation from full name
    const key = FULL_NAME_TO_KEY[team];
    const abbr = key ? NFL_TEAMS[key]?.abbreviation : null;
    if (!abbr) return [];
    return getContractsForTeam(abbr);
  }, [team]);

  if (contracts.length === 0) return null;

  // Show best contract
  const best = contracts[0];
  const fmtNet = best.net_american_odds >= 0 ? `+${best.net_american_odds}` : `${best.net_american_odds}`;

  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="px-1.5 py-0.5 rounded border bg-violet-500/10 border-violet-500/30 text-violet-400 font-medium">
        {best.exchange === 'kalshi' ? 'Kalshi' : 'Poly'} {fmtNet} ({best.price_cents}¢)
      </span>
    </div>
  );
}

// ── Market card ───────────────────────────────────────────────────────────────

function MarketCard({ team, market, history = [], target, onSetTarget }) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput]     = useState('');
  const [showTimeline, setShowTimeline]   = useState(false);

  const { trend, pctChange, signals, newest } = useMemo(
    () => analyseSignal(history, target),
    [history, target],
  );

  const TrendIcon = trend === 'drifting' ? TrendingUp
    : trend === 'shortening' ? TrendingDown
    : Minus;
  const trendColor = trend === 'drifting' ? 'text-sky-400'
    : trend === 'shortening' ? 'text-amber-400'
    : 'text-slate-500';

  const hasData = history.length > 0;

  const handleTargetSave = () => {
    const val = parseInt(targetInput, 10);
    if (!isNaN(val)) onSetTarget(val);
    setEditingTarget(false);
    setTargetInput('');
  };

  return (
    <>
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">
          {market.emoji} {market.label}
          {market.seasonal && (
            <span className="ml-1 text-slate-500 font-normal">(seasonal)</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {hasData && (
            <button
              onClick={() => setShowTimeline(true)}
              className="text-slate-600 hover:text-[#00d2be] transition-colors"
              title="View price history"
            >
              <CalendarDays size={12} />
            </button>
          )}
          <TrendIcon size={13} className={trendColor} />
        </div>
      </div>

      {/* Current odds */}
      {hasData && newest ? (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-100">{fmtOdds(newest.bestOdds)}</span>
          <span className="text-xs text-slate-500">
            {BOOK_SHORT[newest.book] || newest.book}
          </span>
          <span className="text-xs text-slate-600 ml-auto">
            {impliedPct(newest.bestOdds)}%
          </span>
        </div>
      ) : (
        <div className="text-sm text-slate-600 italic">
          {market.seasonal ? 'Not yet available' : 'No data'}
        </div>
      )}

      {/* % change badge */}
      {hasData && pctChange != null && (
        <div className={`text-xs ${trendColor}`}>
          {pctChange > 0 ? '▲' : pctChange < 0 ? '▼' : '→'}{' '}
          {Math.abs(pctChange * 100).toFixed(1)}% ({history.length} pts)
        </div>
      )}

      {/* Sparkline */}
      <Sparkline history={history} trend={trend} />

      {/* Buy signals */}
      {signals.map(s => (
        <div key={s.type} className={`text-xs px-2 py-1 rounded border ${s.color}`}>
          {s.label}
        </div>
      ))}

      {/* Expert consensus for this market */}
      <MarketConsensusIndicator team={team} marketSlot={market.slot} />

      {/* Price target */}
      <div className="mt-auto pt-1 border-t border-slate-700/40">
        {editingTarget ? (
          <div className="flex gap-1 items-center">
            <span className="text-xs text-slate-400">+</span>
            <input
              type="number"
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-100 w-0"
              placeholder="e.g. 600"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTargetSave(); if (e.key === 'Escape') setEditingTarget(false); }}
              autoFocus
            />
            <button onClick={handleTargetSave} className="text-xs text-emerald-400 hover:text-emerald-300 px-1">✓</button>
            <button onClick={() => setEditingTarget(false)} className="text-xs text-slate-500 hover:text-slate-400 px-1">✕</button>
          </div>
        ) : target != null ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Target: <span className="text-slate-200">{fmtOdds(target)}</span>
            </span>
            <div className="flex gap-1">
              <button onClick={() => { setTargetInput(String(target)); setEditingTarget(true); }}
                className="text-xs text-slate-500 hover:text-slate-300">edit</button>
              <button onClick={() => onSetTarget(null)}
                className="text-xs text-slate-500 hover:text-rose-400">✕</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingTarget(true)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Target size={11} /> Set price target
          </button>
        )}
      </div>
    </div>
    {showTimeline && (
      <TimelineModal
        team={team}
        market={market}
        history={history}
        onClose={() => setShowTimeline(false)}
      />
    )}
    </>
  );
}

// ── Team section ──────────────────────────────────────────────────────────────

function TeamSection({ team, historyByMarket, targets, onSetTarget, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const logo = getTeamLogo(team);

  // Resolve actual Supabase market_type keys for this specific team
  const teamMarkets = useMemo(() => getTeamMarkets(team), [team]);

  const hasAnySignal = MARKET_SLOTS.some(slot => {
    const marketType = teamMarkets[slot.slot];
    const h = historyByMarket?.[marketType] || [];
    const tgt = targets?.[`${team}|${slot.slot}`] ?? null;
    const { signals } = analyseSignal(h, tgt);
    return signals.length > 0;
  });

  // Host citation data
  const sentimentSummary = useMemo(() => getHostSentimentSummary(team), [team]);
  const uniqueHosts = useMemo(() => getUniqueHostTakes(team), [team]);
  const hasCitations = sentimentSummary.total > 0;

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Team header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        {logo && <img src={logo} alt={team} className="w-7 h-7 object-contain" />}
        <span className="font-semibold text-slate-100 flex-1">{team}</span>

        {/* Prediction market badge */}
        <PredictionMarketBadge team={team} />

        {/* Citation count badge */}
        {hasCitations && (
          <button
            onClick={e => { e.stopPropagation(); setShowCitations(c => !c); }}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors mr-1"
            title="Expert citations from podcast deep-dives"
          >
            <MessageCircle size={11} />
            {sentimentSummary.total} take{sentimentSummary.total !== 1 ? 's' : ''}
          </button>
        )}

        {hasAnySignal && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 mr-2">
            signal
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onRemove(team); }}
          className="text-slate-600 hover:text-rose-400 transition-colors mr-2"
          title="Remove from watch list"
        >
          <X size={14} />
        </button>
        {collapsed ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
      </div>

      {/* Host citation chips bar */}
      {!collapsed && uniqueHosts.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-t border-slate-700/30 bg-slate-800/20 flex-wrap">
          <span className="text-[10px] text-slate-600 mr-1">Expert takes:</span>
          {uniqueHosts.slice(0, 8).map(h => (
            <HostCitationChip key={h.host} citation={h} />
          ))}
          {uniqueHosts.length > 8 && (
            <span className="text-[10px] text-slate-600">+{uniqueHosts.length - 8} more</span>
          )}
        </div>
      )}

      {/* Citation drawer */}
      {!collapsed && showCitations && (
        <CitationDrawer team={team} />
      )}

      {/* Market grid */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4 pt-2">
          {MARKET_SLOTS.map(slot => {
            const marketType = teamMarkets[slot.slot];
            return (
              <MarketCard
                key={slot.slot}
                team={team}
                market={slot}
                history={historyByMarket?.[marketType] || []}
                target={targets?.[`${team}|${slot.slot}`] ?? null}
                onSetTarget={val => onSetTarget(team, slot.slot, val)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── NFL-ATLAS-1: Expert Signal panel (piece B) ─────────────────────────────────
// Distinct data source from the podcast CitationDrawer above — real expert
// rationale/stats from research_pick_signals, not podcast sentiment. Neutral
// framing per Andy's 2026-08-23 call: "signals mentioning this pick," not
// agree/disagree — see src/lib/expertSignals.js header for why.

function ExpertSignalPanel({ pin }) {
  const { market, selection, team } = pin;
  const pinKey = `${market}|${selection}|${team || ''}`;
  // `key` tracks which pin the current `result` was fetched for, so `loading`
  // can be derived instead of set synchronously in the effect body (avoids
  // the cascading-render lint warning — setState only ever happens inside the
  // .then callback below, never directly in the effect).
  const [result, setResult] = useState({ key: null, signals: [], sourceLinks: [] });

  useEffect(() => {
    let cancelled = false;
    getExpertSignalsForPin({ market, selection, team }).then(({ signals, sourceLinks }) => {
      if (!cancelled) setResult({ key: pinKey, signals, sourceLinks });
    });
    return () => { cancelled = true; };
  }, [market, selection, team, pinKey]);

  const loading = result.key !== pinKey;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-600">
        <Loader2 size={12} className="animate-spin" /> Checking expert signals…
      </div>
    );
  }

  if (result.signals.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-slate-600">
        No tracked expert signals mention this pick yet.
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-600 mb-1.5 px-0.5">
        📊 Signals mentioning this pick — not an agree/disagree verdict, just what's been said
      </div>
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg divide-y divide-slate-800/60 overflow-hidden">
        {result.signals.map((s, i) => (
          <div key={i} className="px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs mb-0.5">
              <span className="font-medium text-slate-200">{s.author}</span>
              {s.source && <span className="text-slate-600">· {s.source}</span>}
              {s.betType && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">{s.betType}</span>
              )}
              {s.confidence != null && (
                <span className="text-[10px] text-slate-600 ml-auto">conf {Math.round(s.confidence * 100)}%</span>
              )}
            </div>
            {s.rationale && (
              <div className="text-xs text-slate-400 leading-relaxed">{s.rationale}</div>
            )}
          </div>
        ))}
      </div>
      {result.sourceLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1.5 px-0.5">
          {result.sourceLinks.map(l => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink size={9} /> {l.title.length > 40 ? l.title.slice(0, 37) + '...' : l.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NFL-ATLAS-1: Pinned Future card ─────────────────────────────────────────────
// Separate from TeamSection above — pins here can be any market (including
// player/award pins with no team and no price history), not just the 5 fixed
// team-level slots.

function PinnedFutureCard({ pin, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const meta = PIN_MARKET_LABEL[pin.market] || { label: pin.market, emoji: '📌' };
  const logo = pin.team ? getTeamLogo(pin.team) : null;

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {logo && <img src={logo} alt={pin.team} className="w-6 h-6 object-contain" />}
        <span className="text-base">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-100">{pin.label || pin.selection}</span>
          <span className="text-xs text-slate-500 ml-2">{meta.label}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(pin.id); }}
          className="text-slate-600 hover:text-rose-400 transition-colors mr-2"
          title="Unpin"
        >
          <X size={14} />
        </button>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </div>
      {expanded && <ExpertSignalPanel pin={pin} />}
    </div>
  );
}

// ── NFL-ATLAS-1: Add Pin modal ──────────────────────────────────────────────────

function AddPinModal({ onAdd, onClose }) {
  const [market, setMarket] = useState(PIN_MARKETS[0].market);
  const [selection, setSelection] = useState('');
  const [team, setTeam] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (!selection.trim()) return;
    setSaving(true);
    setSaveError('');
    const ok = await onAdd({ market, selection: selection.trim(), team: team || null });
    setSaving(false);
    if (ok) onClose();
    else setSaveError('Could not save the pin — has migration 048_futures_pins.sql been run yet?');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100">Pin a Future</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>

        <label className="block text-xs text-slate-400 mb-1">Market</label>
        <select
          value={market}
          onChange={e => setMarket(e.target.value)}
          className="w-full mb-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
        >
          {PIN_MARKETS.map(m => (
            <option key={m.market} value={m.market}>{m.emoji} {m.label}</option>
          ))}
        </select>

        <label className="block text-xs text-slate-400 mb-1">Selection</label>
        <input
          type="text"
          value={selection}
          onChange={e => setSelection(e.target.value)}
          placeholder="e.g. Josh Allen, Buffalo Bills"
          className="w-full mb-3 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600"
        />

        <label className="block text-xs text-slate-400 mb-1">Team (optional)</label>
        <select
          value={team}
          onChange={e => setTeam(e.target.value)}
          className="w-full mb-4 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
        >
          <option value="">— none —</option>
          {ALL_TEAM_FULL_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {saveError && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {saveError}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!selection.trim() || saving}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#00d2be]/10 border border-[#00d2be]/30 text-sm text-[#00d2be] hover:bg-[#00d2be]/20 transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Pin size={13} />}
          {saving ? 'Saving…' : 'Pin It'}
        </button>
      </div>
    </div>
  );
}

// ── Add Team modal ────────────────────────────────────────────────────────────

function AddTeamModal({ currentTeams, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = ALL_TEAM_FULL_NAMES.filter(
    n => !currentTeams.includes(n) && n.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-80 max-h-[70vh] flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-100">Add Team to Watch List</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <input
          className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500"
          placeholder="Search team…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="overflow-y-auto flex flex-col gap-1">
          {filtered.length === 0 && (
            <div className="text-sm text-slate-600 py-2 text-center">
              {currentTeams.length >= 32 ? 'All teams added' : 'No matches'}
            </div>
          )}
          {filtered.map(name => (
            <button
              key={name}
              onClick={() => { onAdd(name); onClose(); }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-left transition-colors"
            >
              {getTeamLogo(name)
                ? <img src={getTeamLogo(name)} alt={name} className="w-5 h-5 object-contain" />
                : <div className="w-5 h-5" />}
              <span className="text-sm text-slate-200">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FuturesWatchList() {
  const [watchlist, setWatchlist] = useState(() =>
    loadFromStorage(STORAGE_KEY, DEFAULT_WATCHLIST),
  );
  const [historyData, setHistoryData] = useState({});
  const [loading, setLoading]         = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [error, setError]             = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // ── NFL-ATLAS-1: pinned futures (any market, backed by Supabase futures_pins
  // rather than localStorage — see docs/NFL_ATLAS_1_FUTURES_WATCHLIST_DESIGN.md) ──
  const [pins, setPins]               = useState([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [showAddPinModal, setShowAddPinModal] = useState(false);

  const fetchPins = useCallback(async () => {
    setPinsLoading(true);
    const rows = await getFuturesPins();
    setPins(rows);
    setPinsLoading(false);
  }, []);

  useEffect(() => { fetchPins(); }, [fetchPins]);

  const addPin = useCallback(async (pin) => {
    const saved = await addFuturesPin(pin);
    if (saved) {
      setPins(p => [saved, ...p]);
      return true;
    }
    return false;
  }, []);

  const removePin = useCallback(async (id) => {
    // Optimistic remove — futures_pins is a soft-delete (active=false) so a
    // failed request just leaves a stale row Andy can retry unpinning later,
    // not data loss.
    setPins(p => p.filter(pin => pin.id !== id));
    await removeFuturesPin(id);
  }, []);

  // Persist on every change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, watchlist);
  }, [watchlist]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!watchlist.teams.length) return;
    setLoading(true);
    setError('');
    try {
      const data = await getWatchlistOddsHistory(watchlist.teams, [], 60);
      setHistoryData(data);
      setLastFetched(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [watchlist.teams]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addTeam = useCallback((team) => {
    setWatchlist(w => ({ ...w, teams: [...w.teams, team] }));
  }, []);

  const removeTeam = useCallback((team) => {
    setWatchlist(w => {
      const targets = { ...w.targets };
      MARKET_SLOTS.map(s => s.slot).forEach(m => delete targets[`${team}|${m}`]);
      return { ...w, teams: w.teams.filter(t => t !== team), targets };
    });
  }, []);

  const setTarget = useCallback((team, market, value) => {
    const tKey = `${team}|${market}`;
    setWatchlist(w => {
      const targets = { ...w.targets };
      if (value == null) delete targets[tKey];
      else targets[tKey] = value;
      return { ...w, targets };
    });
  }, []);

  // ── Total active signals across all tracked teams/markets ─────────────────
  const totalSignals = useMemo(() => {
    let count = 0;
    for (const team of watchlist.teams) {
      const teamMarkets = getTeamMarkets(team);
      for (const slot of MARKET_SLOTS) {
        const marketType = teamMarkets[slot.slot];
        const h = historyData[team]?.[marketType] || [];
        const tgt = watchlist.targets[`${team}|${slot.slot}`] ?? null;
        count += analyseSignal(h, tgt).signals.length;
      }
    }
    return count;
  }, [watchlist, historyData]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-slate-100">
            Futures Watch List
            {totalSignals > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-normal">
                {totalSignals} signal{totalSignals > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Price history from Supabase — updated nightly by the futures ingest agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Clock size={11} />
              {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAddPinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Pin size={12} /> Pin a Future
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d2be]/10 border border-[#00d2be]/30 text-xs text-[#00d2be] hover:bg-[#00d2be]/20 transition-colors"
          >
            <Plus size={12} /> Add Team
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Buy-signal legend */}
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="px-2 py-0.5 rounded border border-sky-500/30 text-sky-400 bg-sky-500/10">📈 Drifting — odds lengthening (value building)</span>
        <span className="px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10">⚡ Shortening — sharp steam</span>
        <span className="px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">🎯 Target hit</span>
      </div>

      {/* Pinned Futures (NFL-ATLAS-1) — any market, not just the 5 team slots */}
      {pinsLoading ? (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-600">
          <Loader2 size={12} className="animate-spin" /> Loading pinned futures…
        </div>
      ) : pins.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-0.5">
            📌 Pinned Futures
          </h3>
          {pins.map(pin => (
            <PinnedFutureCard key={pin.id} pin={pin} onRemove={removePin} />
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {watchlist.teams.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-600">
          <Bell size={32} />
          <p className="text-sm">No teams on your watch list.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Plus size={14} /> Add a team
          </button>
        </div>
      )}

      {/* Team sections */}
      {watchlist.teams.map(team => (
        <TeamSection
          key={team}
          team={team}
          historyByMarket={historyData[team] || {}}
          targets={watchlist.targets}
          onSetTarget={setTarget}
          onRemove={removeTeam}
        />
      ))}

      {/* Add Team modal */}
      {showAddModal && (
        <AddTeamModal
          currentTeams={watchlist.teams}
          onAdd={addTeam}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Pin a Future modal (NFL-ATLAS-1) */}
      {showAddPinModal && (
        <AddPinModal
          onAdd={addPin}
          onClose={() => setShowAddPinModal(false)}
        />
      )}
    </div>
  );
}
