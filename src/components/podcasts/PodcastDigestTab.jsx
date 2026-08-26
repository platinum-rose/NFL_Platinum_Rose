// src/components/podcasts/PodcastDigestTab.jsx
// Phase 7b -- full Podcasts tab. Lists processed episodes from Supabase,
// opens M6 digest pages (tailnet), copies share links (Phase 8), imports picks.
//
// Key fixes vs PodcastIngestModal:
//   - pick.category  (not pick.type)  -- v2 shape (migration 023)
//   - confidence is 0-1; displayed as Math.round(conf*100)%
//   - quality_score shown in preference to raw confidence

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic, RefreshCw, ChevronDown, ChevronRight, CheckCircle2,
  Radio, AlertTriangle, Download, Zap, BookOpen, Clock,
  ExternalLink, Link2, Copy
} from 'lucide-react';
import { getPodcastEpisodes } from '../../lib/supabase';
import { addPick } from '../../lib/picksDatabase';
import { M6 } from '../../lib/apiConfig';
import { getNFLWeekInfo } from '../../lib/constants';

// Slugify matching 7a aggregate.js and Phase 8 ^[a-z0-9-]{1,64}$ contract.
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'unknown';
}

// URL builders
const digestUrl  = (id)       => `${M6.BASE}/digest/episodes/${id}.html`;
const expertUrl  = (expert)   => `${M6.BASE}/digest/experts/${slugify(expert)}.html`;
const weeklyUrl  = (season, week) => `${M6.BASE}/digest/weekly/${season}-W${week}.html`;

function shareUrl(kind, ...parts) {
  // Phase 8 -- share token is injected at runtime, never in the bundle.
  const token = window.__NFL_SHARE_TOKEN__;
  if (!M6.FUNNEL_BASE || !token) return null;
  return `${M6.FUNNEL_BASE}/share/${token}/${kind}/${parts.join('/')}`;
}

// Helpers
const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
};

const fmtDuration = (secs) => {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const categoryChip = (cat) => {
  const map = {
    spread:    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    moneyline: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    total:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    future:    'bg-violet-500/20 text-violet-400 border-violet-500/30',
    prop:      'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return map[(cat || '').toLowerCase()] || 'bg-slate-700/40 text-slate-400 border-slate-600/30';
};

const sourceColor = (expert) => {
  const map = {
    'Sharp or Square': 'text-cyan-400',
    'Even Money':      'text-emerald-400',
    'Action Network':  'text-orange-400',
    'Warren Sharp':    'text-purple-400',
  };
  return map[expert] || 'text-slate-300';
};

// ---- EpisodeCard ----

function EpisodeCard({ episode, isTargeted, onImport }) {
  const [expanded,  setExpanded]  = useState(Boolean(isTargeted));
  const cardRef = React.useRef(null);

  useEffect(() => {
    if (isTargeted) {
      setExpanded(true);
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isTargeted]);
  const [imported,  setImported]  = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied,    setCopied]    = useState(false);

  const picks   = episode.podcast_transcripts?.picks ?? [];
  const intel   = episode.podcast_transcripts?.intel ?? [];
  const expert  = episode.podcast_feeds?.expert ?? 'Podcast';
  const feedName = episode.podcast_feeds?.name  ?? 'Podcast';

  const canOpen  = Boolean(M6.BASE);
  const shareLnk = shareUrl('episodes', episode.id);

  const handleOpen = (e) => {
    e.stopPropagation();
    window.open(digestUrl(episode.id), '_blank', 'noopener');
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!shareLnk) return;
    try {
      await navigator.clipboard.writeText(shareLnk);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  };

  const handleImport = async (e) => {
    e.stopPropagation();
    if (importing || imported || picks.length === 0) return;
    setImporting(true);
    try {
      let count = 0;
      for (const pick of picks) {
        const cat = (pick.category ?? 'spread').toLowerCase();
        const pickType = cat.includes('total') ? 'total'
          : cat.includes('money') ? 'moneyline'
          : 'spread';
        addPick({
          source:      'EXPERT',
          gameId:      null,
          pickType,
          selection:   pick.selection ?? '',
          line:        pick.line ?? 0,
          edge:        0,
          // confidence stored 0-1; picksDatabase expects 0-100 int
          confidence:  pick.quality_score != null
            ? Math.round(pick.quality_score * 100)
            : Math.round((pick.confidence ?? 0.65) * 100),
          home:        pick.team1 ?? '',
          visitor:     pick.team2 ?? '',
          gameDate:    pick.game_date ?? '',
          gameTime:    '',
          commenceTime: null,
          isHomeTeam:  false,
          expertName:  expert,
          rationale:   pick.summary ?? '',
        });
        count++;
      }
      setImported(true);
      onImport?.(count);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div ref={cardRef} className={`bg-slate-900 border ${isTargeted ? 'border-[#00d2be] ring-2 ring-[#00d2be]/30' : 'border-slate-800'} rounded-xl overflow-hidden transition-all hover:border-slate-700`}>
      {/* Header row */}
      <div className="flex items-start gap-0">
        {/* Expand toggle */}
        <button
          className="flex-1 text-left p-4 flex items-start gap-3 min-w-0"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="mt-0.5 text-slate-500 shrink-0">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-bold ${sourceColor(expert)}`}>{feedName}</span>
              {episode.is_partial && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  PARTIAL
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white truncate pr-2">{episode.title}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              {episode.pub_date && <span>{fmtDate(episode.pub_date)}</span>}
              {fmtDuration(episode.duration_secs) && (
                <span className="flex items-center gap-1"><Clock size={10} />{fmtDuration(episode.duration_secs)}</span>
              )}
              <span className="text-emerald-400 font-medium">{picks.length} pick{picks.length !== 1 ? 's' : ''}</span>
              {intel.length > 0 && <span className="text-slate-400">{intel.length} intel</span>}
            </div>
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 p-3 shrink-0">
          {/* Open digest */}
          <button
            onClick={handleOpen}
            disabled={!canOpen}
            title={canOpen ? `Open digest on M6` : 'Set VITE_M6_BASE to enable digest links'}
            className={`p-1.5 rounded-lg text-xs border transition-all flex items-center gap-1 ${
              canOpen
                ? 'bg-[#00d2be]/10 text-[#00d2be] border-[#00d2be]/30 hover:bg-[#00d2be]/20'
                : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
            }`}
          >
            <ExternalLink size={13} />
          </button>

          {/* Copy share link */}
          <button
            onClick={handleCopy}
            disabled={!shareLnk}
            title={shareLnk ? 'Copy share link' : 'Configure a share token on M6 to enable sharing.'}
            className={`p-1.5 rounded-lg text-xs border transition-all flex items-center gap-1 ${
              shareLnk
                ? copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
            }`}
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          </button>

          {/* Import picks */}
          {picks.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || imported}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                imported
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-default'
                  : 'bg-[#00d2be]/10 text-[#00d2be] border-[#00d2be]/30 hover:bg-[#00d2be]/20'
              } disabled:opacity-60`}
            >
              {imported
                ? <><CheckCircle2 size={12} /> Done</>
                : importing
                ? <><RefreshCw size={12} className="animate-spin" /> …</>
                : <><Download size={12} /> {picks.length}</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {picks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap size={11} className="text-emerald-400" /> Picks
              </h4>
              <div className="space-y-2">
                {picks.map((pick, i) => {
                  const cat = (pick.category ?? 'pick').toLowerCase();
                  const confPct = pick.quality_score != null
                    ? Math.round(pick.quality_score * 100)
                    : pick.confidence != null
                    ? Math.round(pick.confidence * 100)
                    : null;
                  return (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${categoryChip(cat)}`}>
                        {cat.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">
                          {pick.selection}{pick.line != null ? ` ${pick.line > 0 ? '+' : ''}${pick.line}` : ''}
                        </div>
                        {pick.summary && (
                          <div className="text-xs text-slate-400 mt-0.5">{pick.summary}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                          {pick.team1 && pick.team2 && <span>{pick.team2} @ {pick.team1}</span>}
                          {confPct != null && <span>{confPct}% conf</span>}
                          {pick.units != null && <span>{pick.units}u</span>}
                          {pick.week && pick.season && <span>W{pick.week} {pick.season}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {intel.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={11} className="text-[#00d2be]" /> Intel Notes
              </h4>
              <div className="space-y-1.5">
                {intel.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-[#00d2be] mt-0.5 shrink-0">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {picks.length === 0 && intel.length === 0 && (
            <p className="text-xs text-slate-600 italic">No picks or intel extracted from this episode.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main Tab ----

export default function PodcastDigestTab() {
  const [episodes, setEpisodes] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [importMsg, setImportMsg] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const targetEpId = urlParams.get('episode') || urlParams.get('ep') || urlParams.get('episodeId');

  const weekInfo = getNFLWeekInfo();
  const canOpen  = Boolean(M6.BASE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPodcastEpisodes(30);
      setEpisodes(data ?? []);
    } catch (e) {
      setError(e.message ?? 'Failed to load podcast episodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleImport = (count) => {
    setImportMsg(`+${count} pick${count !== 1 ? 's' : ''} added to Picks Tracker`);
    setTimeout(() => setImportMsg(''), 4000);
  };

  // Group by feed name (same as modal)
  const grouped = episodes.reduce((acc, ep) => {
    const key = ep.podcast_feeds?.name ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ep);
    return acc;
  }, {});

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-6 pb-8">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00d2be]/10 rounded-lg">
            <Mic size={20} className="text-[#00d2be]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Podcast Intel</h2>
            <p className="text-xs text-slate-400">Expert picks auto-extracted from podcast episodes</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Quick links row (only when M6 is configured) */}
      {canOpen && weekInfo.week > 0 && (
        <div className="flex gap-3 flex-wrap">
          <a
            href={weeklyUrl(weekInfo.season, weekInfo.week)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#00d2be] bg-[#00d2be]/10 border border-[#00d2be]/30 px-3 py-1.5 rounded-lg hover:bg-[#00d2be]/20 transition-all"
          >
            <Link2 size={12} />
            {weekInfo.label} Consensus
          </a>
        </div>
      )}

      {/* M6 offline notice */}
      {!canOpen && (
        <div className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          Digests are served privately from M6 (tailnet). Set <code className="text-slate-400">VITE_M6_BASE</code> in your .env to enable digest links. Off-tailnet? Use Copy Share Link once Phase 8 is configured.
        </div>
      )}

      {/* Import success toast */}
      {importMsg && (
        <div className="px-4 py-2.5 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 size={14} /> {importMsg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading podcast episodes...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 py-6 text-rose-400 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && episodes.length === 0 && (
        <div className="text-center py-20">
          <Mic size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 font-bold">No Episodes Yet</p>
          <p className="text-slate-600 text-sm mt-2 max-w-xs mx-auto">
            The podcast agent runs every 6 hours on GitHub Actions. Check back after the next scheduled run.
          </p>
        </div>
      )}

      {/* Episode groups */}
      {!loading && !error && Object.entries(grouped).map(([feedName, eps]) => {
        const expertId = eps[0]?.podcast_feeds?.expert;
        return (
          <div key={feedName}>
            {/* Group header */}
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3 ${sourceColor(expertId)}`}>
              <Radio size={11} />
              <span>{feedName}</span>
              <span className="text-slate-600 normal-case font-normal tracking-normal">
                {eps.length} episode{eps.length !== 1 ? 's' : ''}
              </span>
              {/* Link to expert digest page */}
              {canOpen && expertId && (
                <a
                  href={expertUrl(expertId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                  title={`Open ${feedName} expert digest`}
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div className="space-y-3">
              {eps.map(ep => (
                <EpisodeCard key={ep.id} episode={ep} isTargeted={targetEpId === ep.id} onImport={handleImport} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
