// agents/lib/vaultRebuilderRenderers.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure renderers for vault-rebuilder.js (Phase 5). Each function takes plain
// JS data and returns a string body suitable for replaceSection() — no I/O,
// no Supabase, no time-of-day side effects. The orchestrator passes a
// fixed `now` ISO date into renderers so output is fully deterministic for
// tests.
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_VERSION = 'vault-rebuilder/v1';
export { SECTION_VERSION };

function trunc(text, n = 200) {
  if (!text) return '';
  return text.length <= n ? text : text.slice(0, n - 1) + '…';
}

function fmtAmerican(odds) {
  if (odds == null || odds === '') return '';
  const n = Number(odds);
  if (Number.isNaN(n)) return String(odds);
  return n > 0 ? `+${n}` : `${n}`;
}

function fmtLine(line) {
  if (line == null || line === '') return '';
  const n = Number(line);
  if (Number.isNaN(n)) return String(line);
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Compose the one-line description of a podcast pick for any list view.
 * @param {object} p   pick row (shape from spec §4)
 */
export function pickOneLiner(p) {
  const cat = p.category || 'pick';
  const subj = p.subject || '?';
  const sel = p.selection ? ` ${p.selection}` : '';
  const line = p.line != null ? ` ${fmtLine(p.line)}` : '';
  const odds = p.odds_american != null ? ` (${fmtAmerican(p.odds_american)})` : '';
  const units = p.units != null ? ` ${p.units}u` : '';
  const conf = p.confidence != null ? ` conf=${Number(p.confidence).toFixed(2)}` : '';
  const review = p.needs_review ? ' ⚠ needs review' : '';
  return `[${cat}] ${subj}${sel}${line}${odds}${units}${conf}${review}`;
}

function attribution(p) {
  const parts = [];
  if (p.expert_name) parts.push(p.expert_name);
  if (p.episode_title) parts.push(`*${trunc(p.episode_title, 60)}*`);
  if (p.episode_published_at) parts.push(p.episode_published_at.slice(0, 10));
  return parts.join(' · ');
}

// ─── Teams ────────────────────────────────────────────────────────────────

/**
 * Render the "## Podcast Intel" auto-section body for a team.
 *
 * @param {object} args
 * @param {string} args.abbr           e.g. 'KC'
 * @param {Array<object>} args.picks   picks where the team is involved (newest first)
 * @param {string} args.now            ISO date string (deterministic stamp)
 * @param {number} [args.maxItems]     cap (default 15)
 */
export function renderTeamPodcastIntel({ abbr, picks, now, maxItems = 15 }) {
  const usable = (picks || []).filter((p) => !p.needs_review).slice(0, maxItems);
  const lines = [
    `_Auto-updated: ${now} · source: podcast pipeline_`,
    '',
  ];
  if (usable.length === 0) {
    lines.push(`_No recent podcast picks involving **${abbr}**._`);
    return lines.join('\n');
  }
  // Bucket by category for readability.
  const buckets = { spread: [], total: [], moneyline: [], future: [], prop: [] };
  for (const p of usable) {
    const k = buckets[p.category] ? p.category : 'spread';
    buckets[k].push(p);
  }
  const labels = {
    spread: 'Spread',
    total: 'Total',
    moneyline: 'Moneyline',
    future: 'Futures',
    prop: 'Props',
  };
  for (const key of Object.keys(buckets)) {
    if (buckets[key].length === 0) continue;
    lines.push(`### ${labels[key]}`);
    for (const p of buckets[key]) {
      const att = attribution(p);
      const line = `- ${pickOneLiner(p)}` + (att ? ` — ${att}` : '');
      lines.push(line);
      if (p.summary) lines.push(`  - ${trunc(p.summary, 200)}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/**
 * Render a season-trend section (ATS / situational summary).
 *
 * @param {object} args
 * @param {string} args.abbr
 * @param {object} args.trend  pre-aggregated stats: {ats_record, su_record, ou_record, home, away}
 * @param {string} args.now
 */
export function renderTeamSeasonTrend({ abbr, trend, now }) {
  const lines = [`_Auto-updated: ${now}_`, ''];
  if (!trend || trend.empty === true) {
    lines.push(`_No season data yet for **${abbr}**._`);
    return lines.join('\n');
  }
  const fmtR = (r) => (r ? `${r.w}-${r.l}${r.t ? `-${r.t}` : ''}` : '-');
  lines.push('| Split | Record |');
  lines.push('|------|--------|');
  if (trend.su_record)   lines.push(`| Straight-Up | ${fmtR(trend.su_record)} |`);
  if (trend.ats_record)  lines.push(`| ATS | ${fmtR(trend.ats_record)} |`);
  if (trend.ou_record)   lines.push(`| O/U | ${fmtR(trend.ou_record)} |`);
  if (trend.home_record) lines.push(`| Home | ${fmtR(trend.home_record)} |`);
  if (trend.away_record) lines.push(`| Away | ${fmtR(trend.away_record)} |`);
  if (trend.fav_record)  lines.push(`| As favorite | ${fmtR(trend.fav_record)} |`);
  if (trend.dog_record)  lines.push(`| As dog | ${fmtR(trend.dog_record)} |`);
  return lines.join('\n').trimEnd();
}

// ─── Experts ──────────────────────────────────────────────────────────────

/**
 * Render an expert's full season ledger (auto body of Experts/<slug>.md).
 *
 * @param {object} args
 * @param {object} args.expert    {slug, name, podcast?}
 * @param {object} args.ledger    aggregated stats {graded, wins, losses, pushes, units, roi, clv_avg, hot_categories: []}
 * @param {Array}  args.picks     all picks (graded + ungraded), newest first
 * @param {string} args.now
 * @param {number} [args.maxRecent] cap for the recent-picks table (default 50)
 */
export function renderExpertLedger({ expert, ledger, picks, now, maxRecent = 50 }) {
  const lines = [`_Auto-updated: ${now}_`, ''];
  if (expert.podcast) lines.push(`**Podcast:** ${expert.podcast}`);
  lines.push('');

  // Headline stats
  const l = ledger || {};
  const wlt = `${l.wins ?? 0}-${l.losses ?? 0}${l.pushes ? `-${l.pushes}` : ''}`;
  const roi = l.roi != null ? `${(Number(l.roi) * 100).toFixed(1)}%` : '–';
  const units = l.units != null ? `${Number(l.units).toFixed(2)}u` : '–';
  const clv = l.clv_avg != null ? `${(Number(l.clv_avg) * 100).toFixed(1)}%` : '–';
  const graded = l.graded ?? (picks ? picks.filter((p) => p.result).length : 0);

  lines.push('### Season Ledger');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|------|------|');
  lines.push(`| Graded picks | ${graded} |`);
  lines.push(`| Record | ${wlt} |`);
  lines.push(`| Units P&L | ${units} |`);
  lines.push(`| ROI | ${roi} |`);
  lines.push(`| Avg CLV | ${clv} |`);
  if (l.hot_categories && l.hot_categories.length > 0) {
    lines.push(`| Hot categories | ${l.hot_categories.join(', ')} |`);
  }
  lines.push('');

  lines.push('### Recent Picks');
  lines.push('');
  const usable = (picks || []).filter((p) => !p.needs_review).slice(0, maxRecent);
  if (usable.length === 0) {
    lines.push('_No graded or pending picks yet._');
    return lines.join('\n').trimEnd();
  }
  lines.push('| Date | Pick | Units | Result |');
  lines.push('|------|------|------|------|');
  for (const p of usable) {
    const date = (p.episode_published_at || p.captured_at || '').slice(0, 10);
    const result = p.result || (p.graded === false ? 'pending' : '–');
    const u = p.units != null ? `${p.units}u` : '–';
    lines.push(`| ${date} | ${pickOneLiner(p).replace(/\|/g, '\\|')} | ${u} | ${result} |`);
  }
  return lines.join('\n').trimEnd();
}

/**
 * Build the full Reference/ExpertLeaderboard.md auto body.
 *
 * @param {object} args
 * @param {Array<object>} args.experts  pre-aggregated rows (already sorted)
 * @param {string} args.now
 */
export function renderExpertLeaderboard({ experts, now }) {
  const lines = [
    `_Auto-updated: ${now}_`,
    '',
    '| Rank | Expert | Graded | Record | Units | ROI | CLV |',
    '|------|------|------|------|------|------|------|',
  ];
  if (!experts || experts.length === 0) {
    lines.push('_No graded experts yet._');
    return lines.join('\n').trimEnd();
  }
  experts.forEach((e, i) => {
    const wlt = `${e.wins ?? 0}-${e.losses ?? 0}${e.pushes ? `-${e.pushes}` : ''}`;
    const roi = e.roi != null ? `${(Number(e.roi) * 100).toFixed(1)}%` : '–';
    const units = e.units != null ? `${Number(e.units).toFixed(2)}u` : '–';
    const clv = e.clv_avg != null ? `${(Number(e.clv_avg) * 100).toFixed(1)}%` : '–';
    const link = e.slug ? `[${e.name}](../Experts/${e.slug}.md)` : e.name;
    lines.push(`| ${i + 1} | ${link} | ${e.graded ?? 0} | ${wlt} | ${units} | ${roi} | ${clv} |`);
  });
  return lines.join('\n').trimEnd();
}

// ─── Weekly ───────────────────────────────────────────────────────────────

/**
 * Render the cross-expert consensus body for a single week.
 *
 * @param {object} args
 * @param {object} args.week   {season, week}
 * @param {Array}  args.games  [{game_id, home, away, kickoff_at, picks: [...]}, ...]
 * @param {string} args.now
 */
export function renderWeeklyConsensus({ week, games, now }) {
  const lines = [
    `_Auto-updated: ${now}_`,
    `_Season ${week.season} · Week ${week.week}_`,
    '',
  ];
  if (!games || games.length === 0) {
    lines.push('_No games or picks logged for this week yet._');
    return lines.join('\n').trimEnd();
  }
  for (const g of games) {
    const date = (g.kickoff_at || '').slice(0, 10);
    lines.push(`### ${g.away} @ ${g.home}${date ? `  *(${date})*` : ''}`);
    if (!g.picks || g.picks.length === 0) {
      lines.push('_No picks._');
      lines.push('');
      continue;
    }
    // Tally side counts for each ATS / O/U direction.
    const tally = {};
    for (const p of g.picks) {
      const k = `${p.category}|${p.selection ?? ''}|${p.line ?? ''}`;
      tally[k] = (tally[k] || 0) + 1;
    }
    lines.push('**Consensus:**');
    Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, count]) => {
        const [cat, sel, line] = k.split('|');
        const lbl = `${cat} ${sel}${line ? ` ${fmtLine(line)}` : ''}`.trim();
        lines.push(`- ${lbl} — ${count} expert${count === 1 ? '' : 's'}`);
      });
    lines.push('');
    lines.push('**Picks:**');
    for (const p of g.picks) {
      const att = attribution(p);
      lines.push(`- ${pickOneLiner(p)}${att ? ` — ${att}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

// ─── Futures ──────────────────────────────────────────────────────────────

/**
 * Render the Futures/<Market>.md body — running tally of expert calls + line
 * history table.
 *
 * @param {object} args
 * @param {string} args.market
 * @param {Array} args.picks       newest first
 * @param {Array} args.lineHistory [{captured_at, selection, odds_american}]
 * @param {string} args.now
 */
export function renderFuturesMarket({ market, picks, lineHistory, now }) {
  const lines = [
    `_Auto-updated: ${now}_`,
    `_Market: **${market}**_`,
    '',
    '### Expert Calls',
    '',
  ];
  if (!picks || picks.length === 0) {
    lines.push('_No futures picks logged._');
  } else {
    for (const p of picks) {
      const att = attribution(p);
      lines.push(`- ${pickOneLiner(p)}${att ? ` — ${att}` : ''}`);
      if (p.summary) lines.push(`  - ${trunc(p.summary, 220)}`);
    }
  }
  lines.push('');
  lines.push('### Line History');
  lines.push('');
  if (!lineHistory || lineHistory.length === 0) {
    lines.push('_No line snapshots yet._');
    return lines.join('\n').trimEnd();
  }
  lines.push('| Captured | Selection | Odds |');
  lines.push('|------|------|------|');
  for (const h of lineHistory) {
    const d = (h.captured_at || '').slice(0, 16).replace('T', ' ');
    lines.push(`| ${d} | ${h.selection ?? ''} | ${fmtAmerican(h.odds_american)} |`);
  }
  return lines.join('\n').trimEnd();
}

// ─── Props ────────────────────────────────────────────────────────────────

/**
 * @param {object} args
 * @param {string} args.player
 * @param {string} args.prop
 * @param {Array}  args.picks
 * @param {string} args.now
 */
export function renderPlayerProp({ player, prop, picks, now }) {
  const lines = [
    `_Auto-updated: ${now}_`,
    `_Player: **${player}** · Prop: **${prop}**_`,
    '',
    '### Picks Timeline',
    '',
  ];
  if (!picks || picks.length === 0) {
    lines.push('_No prop picks logged._');
    return lines.join('\n').trimEnd();
  }
  for (const p of picks) {
    const att = attribution(p);
    lines.push(`- ${pickOneLiner(p)}${att ? ` — ${att}` : ''}`);
    if (p.summary) lines.push(`  - ${trunc(p.summary, 220)}`);
  }
  return lines.join('\n').trimEnd();
}
