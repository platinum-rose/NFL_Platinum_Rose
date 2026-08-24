# Podcast Pipeline — Phase 7c: Daily-Brief "Top Podcast Picks" Block

> **Status:** Specced (not built) | **Author:** PM | **Date:** 2026-06-03
> **Depends on:** Phase 7a (picks rendered) — *soft*; Phase 4 (picks in Supabase) — *hard*
> **Touches:** `agents/nfl-daily-brief.js` only (one agent, no new files)
> **Spec source:** `/memories/repo/nfl-podcast-pipeline-spec.md` §3 Phase 7c

---

## 1. Purpose

Add a **"Top Podcast Picks (Last 24h)"** section to the daily email brief: the
highest-confidence *picks* extracted from podcasts in the last 24 hours, each
linking back to where the operator can read the full digest.

This is the smallest piece of Phase 7. It is **content surfacing**, not
infrastructure — one new fetcher + one new renderer in an agent that already
sends podcast data.

---

## 2. What Already Exists (do not rebuild)

The brief **already has a podcast section** — this is the single most important
fact for scoping 7c.

| Asset | Location | State |
|-------|----------|-------|
| `fetchPodcastIntel(supabase)` | `agents/nfl-daily-brief.js:231` | Selects `id, intel, **picks**, processed_at` — **already pulls `picks`** but discards them. `limit(5)`, ordered by `processed_at`, **no time window**, NFL-relevance filtered. |
| `renderPodcastIntel(episodes)` | `:611` | Renders the `intel` string bullets only. Picks are never rendered. |
| Plain-text podcast block | `buildPlainText` `:764` | Mirrors the intel section in text/plain. |
| `confClass(conf)` | `:475` | Maps `conf` (0-1) → `conf-high/med/low` CSS class. **Already 0-1 aware.** |
| `.podcast-intel`, `.conf-*`, `.intel-*` CSS | `CSS` const `:454` | Reusable styles. |
| `isNFLRelevant(text)` | `:92` | Some feeds cover all sports — reused to filter. |
| `dashLink(tab, label)` | `:57` | Builds `${DASHBOARD_URL}/?tab=<tab>` links (already used by the intel section → `dashLink('picks', ...)`). |
| `escapeHtml(str)` | `:698` | Mandatory on every dynamic value. |

### The pick shape (Phase 4 / migration 023 v2 — identical to 7a §2)

```jsonc
{
  "category": "spread|total|moneyline|future|prop",   // NOT pick.type
  "subject": "KC",
  "selection": "KC" | "UNDER",
  "line": -3.5,
  "summary": "Mahomes home; LV pass rush hurt",
  "units": 2,
  "confidence": 0.78,            // 0-1, NOT 0-100
  "quality_score": 0.74,         // set by quality_gate
  "needs_review": false,         // set by quality_gate
  "week": 5, "season": 2026      // optional
}
```

> Same `category` / `confidence ∈ [0,1]` contract 7b must honor. `confClass()`
> in this agent is already 0-1 correct — but the new code must read
> `pick.category`, never the legacy `pick.type`.

---

## 3. Design Decisions

### 3.1 The brief reads Supabase, never M6 — so "degrade if M6 down" is the wrong frame

The brief runs in **GitHub Actions on `ubuntu-latest`** (`.github/workflows/nfl-daily-brief.yml`),
with `SUPABASE_SERVICE_ROLE_KEY` as its only data secret and **no Tailscale
credentials**. M6's `/digest/*` is **Tailscale-serve, tailnet-only** (Phase 7
serving §8). Therefore:

- **The GHA runner can never reach M6.** A "ping M6, degrade if unavailable"
  guardrail (as the handoff originally framed it) would HEAD-check a host the
  runner cannot route to and **fail the section on every single run.**
- **The picks already live in Supabase** (`podcast_transcripts.picks`). That is
  the source of truth the brief reads — the same place every other section
  reads. M6 contributes **nothing** to the brief's *content*.

**Correct frame:** content comes from Supabase; the M6/dashboard URL is a pure
**string built from env**, never a live check. The section degrades on a
*Supabase* miss (returns `[]` → section auto-hides, like every other `fetchX`),
not on M6 reachability. This corrects the handoff guardrail (§7 below).

### 3.2 Link target: dashboard tab (always reachable), M6 digest optional

The email is read off-tailnet by the operator. Two link options:

1. **Dashboard `?tab=podcasts`** (the 7b tab) — hosted on GitHub Pages, **always
   reachable** from any device. From there the operator clicks "Open digest"
   (which itself handles the tailnet hop). This is the **default** and matches
   the existing intel section's `dashLink('picks', ...)` pattern.
2. **Direct M6 digest** `${M6_DIGEST_BASE}/digest/episodes/<id>.html` — only
   resolves on a tailnet device. Included **per-episode only if `M6_DIGEST_BASE`
   env is set**, labelled as tailnet. If the env is unset (the default, since
   GHA won't have it), it is simply omitted — no broken link, no error.

So: **the picks always render with a working dashboard link; the direct M6 link
is a bonus that appears only when configured.** Never a hard dependency.

### 3.3 A new dedicated section, not a rewrite of `renderPodcastIntel`

The existing "Podcast Intel" section serves a different job (narrative `intel`
bullets, top-5 by recency, no window). 7c's block is **picks**, **24h-windowed**,
**confidence-sorted**. Merging them would muddy both and risk regressing a
working section. 7c adds a **parallel** `fetchTopPodcastPicks` +
`renderTopPodcastPicks`, placed **directly after** the Podcast Intel section so
they read as one "podcast" area. The existing intel section is untouched.

### 3.4 Operator-private brief → may show `confidence`

7a §10 omits raw `confidence` from the **public** Phase 8 digest cards (avoids
over-precision to partners). The brief is a **private** email to the operator —
showing `confidence` (via the existing `confClass`) and `units` is appropriate
and useful here. This is a deliberate audience distinction, not an inconsistency.

### 3.5 Quality gate respected

Only surface picks worth the operator's attention:
- Drop `needs_review === true`.
- Sort by `confidence` desc (tiebreak `quality_score` desc).
- Cap at **8** picks total across all episodes (matches the intel section's
  `slice(0, 8)` density).

---

## 4. New Fetcher — `fetchTopPodcastPicks(supabase)`

Add alongside `fetchPodcastIntel` (~`:231`). Reuses the same join shape.

```js
const PODCAST_PICKS_HOURS = Number(process.env.PODCAST_PICKS_LOOKBACK_HOURS || 24);

async function fetchTopPodcastPicks(supabase) {
  const since = hoursAgo(PODCAST_PICKS_HOURS);
  const { data, error } = await supabase
    .from('podcast_transcripts')
    .select(`
      id, picks, processed_at,
      podcast_episodes ( id, title, pub_date, podcast_feeds ( name, expert ) )
    `)
    .gte('processed_at', since)
    .order('processed_at', { ascending: false })
    .limit(40);                       // episodes; flattened to picks below

  if (error) { console.warn(`fetchTopPodcastPicks: ${error.message}`); return []; }

  // Flatten episode → picks, attach episode context, filter + sort.
  const flat = [];
  for (const ep of data || []) {
    const epInfo  = ep.podcast_episodes;
    const title   = epInfo?.title || '';
    if (!Array.isArray(ep.picks)) continue;
    // Episode-level NFL relevance (some feeds are multi-sport).
    const nflEp = isNFLRelevant(title)
      || ep.picks.some(p => isNFLRelevant(p.summary) || isNFLRelevant(p.subject));
    if (!nflEp) continue;

    for (const p of ep.picks) {
      if (p?.needs_review === true) continue;          // quality gate
      flat.push({
        ...p,
        episodeId: epInfo?.id ?? ep.id,
        episodeTitle: title || 'Untitled Episode',
        feedName: epInfo?.podcast_feeds?.name || 'Podcast',
        expert: epInfo?.podcast_feeds?.expert || null,
      });
    }
  }

  return flat
    .sort((a, b) =>
      (b.confidence ?? 0) - (a.confidence ?? 0)
      || (b.quality_score ?? 0) - (a.quality_score ?? 0))
    .slice(0, 8);
}
```

- `hoursAgo` / `isNFLRelevant` / `console.warn`-then-`[]` are all existing
  patterns in this file — no new helpers.
- Returns a **flat list of enriched picks**, already filtered/sorted/capped, so
  the renderer is presentation-only.

---

## 5. New Renderer — `renderTopPodcastPicks(picks)`

Add alongside `renderPodcastIntel` (~`:611`). Returns `''` when empty so the
section auto-hides (same convention as `renderInjuries`/`renderGames`).

```js
const CATEGORY_LABEL = {
  spread: 'Spread', total: 'Total', moneyline: 'ML', future: 'Future', prop: 'Prop',
};

function digestLinkFor(episodeId) {
  const base = process.env.M6_DIGEST_BASE;            // unset in GHA → no direct link
  if (!base || !episodeId) return '';
  const url = `${base.replace(/\/$/, '')}/digest/episodes/${episodeId}.html`;
  return ` · <a href="${url}" style="color:#555;">digest (tailnet) →</a>`;
}

function renderTopPodcastPicks(picks) {
  if (!picks.length) return '';

  const rows = picks.map(p => {
    const cat   = CATEGORY_LABEL[p.category] || escapeHtml(p.category || '—');
    const sel   = escapeHtml(p.selection || p.subject || '');
    const line  = p.line != null ? ` ${p.line > 0 ? '+' : ''}${p.line}` : '';
    const conf  = p.confidence != null
      ? `<span class="${confClass(p.confidence)}">${Math.round(p.confidence * 100)}%</span>`
      : '—';
    const units = p.units != null ? ` · ${p.units}u` : '';
    const why   = p.summary ? `<div class="intel-summary">${escapeHtml(p.summary)}</div>` : '';
    return `<div class="intel-item">
      <div class="intel-title">
        <strong>${cat}:</strong> ${sel}${escapeHtml(line)} ${conf}${units}
      </div>
      ${why}
      <div class="intel-meta">🎙 ${escapeHtml(p.feedName)}${digestLinkFor(p.episodeId)}</div>
    </div>`;
  }).join('');

  return `<div class="section">
    <div class="section-title">🎯 Top Podcast Picks (last ${PODCAST_PICKS_HOURS}h)</div>
    ${rows}
    ${dashLink('podcasts', 'Podcast Digest Tab →')}
  </div>`;
}
```

- `confClass` / `escapeHtml` / `dashLink` reused as-is.
- `dashLink('podcasts', ...)` points at the **7b tab** (the always-reachable
  landing). Until 7b ships, `?tab=podcasts` simply 404s to the default tab — a
  cosmetic-only degrade, not a break.
- `digestLinkFor` appends the direct M6 link **only** when `M6_DIGEST_BASE` is
  set (matches the 7a `.html` suffix contract). Default GHA run: omitted.

### Plain-text mirror (do not forget `buildPlainText`)

The brief has a **text/plain** body too (`buildPlainText` `:735`). Add a block
there, and thread the new picks array through `main()` → `buildPlainText(...)`:

```js
if (topPicks.length) {
  lines.push(`TOP PODCAST PICKS (last ${PODCAST_PICKS_HOURS}h)`, '─'.repeat(40));
  topPicks.forEach(p => {
    const conf = p.confidence != null ? ` (${Math.round(p.confidence * 100)}%)` : '';
    lines.push(`• [${(p.category || '?').toUpperCase()}] ${p.selection || p.subject}${conf} — ${p.feedName}`);
    if (p.summary) lines.push(`    ${p.summary}`);
  });
  lines.push('');
}
```

---

## 6. Wiring into `main()`

Three small edits in `main()` (`:827`):

1. Add `fetchTopPodcastPicks(supabase)` to the `Promise.all([...])` (`:835`) and
   destructure `topPicks`.
2. Add `renderTopPodcastPicks(topPicks)` to the `sections` array (`:868`) —
   **immediately after** `renderPodcastIntel(podcastEps)` so the two podcast
   blocks sit together.
3. Pass `topPicks` into `buildPlainText(...)` (`:878`) and add the param +
   block (§5).

Optionally add `top_podcast_picks: topPicks.length` to the receipt `stats`
(`:909`) and a console count line (`:860`), mirroring the existing logging.

No other section, helper, or the email shell changes.

---

## 7. Corrected Guardrail (supersedes the handoff's original)

> ~~"If M6 is unavailable, degrade to a plain 'M6 unavailable' note rather than
> failing the brief."~~

This is replaced by the architecturally-correct rule:

- **Content never depends on M6.** The picks come from Supabase. On a Supabase
  error the fetcher returns `[]` and the section hides itself — identical to
  every other section's failure mode. There is no "M6 unavailable" state to show
  because the brief never contacts M6.
- **The direct M6 digest link is optional and link-only.** It appears per
  episode only when `M6_DIGEST_BASE` is configured; otherwise it is silently
  omitted. **No HEAD check, no ping** — the GHA runner can't reach the tailnet,
  so any liveness probe would be a guaranteed false-negative + a 10-minute
  timeout risk.
- **Always-reachable fallback link** is the dashboard `?tab=podcasts` (GitHub
  Pages), present unconditionally.

---

## 8. Config

| Env | Where | Default | Purpose |
|-----|-------|---------|---------|
| `PODCAST_PICKS_LOOKBACK_HOURS` | GHA env / local | `24` | Window for the block (matches the "Last 24h" title; tunable like `TWEET_LOOKBACK_HOURS`). |
| `M6_DIGEST_BASE` | **optional** | unset | Tailnet base for the direct digest link, e.g. `http://m6-box:8088`. Unset in GHA ⇒ direct link omitted (dashboard link still shown). |

`M6_DIGEST_BASE` is the **Node-agent** counterpart to 7b's SPA `VITE_M6_BASE` —
**different mechanism** (`process.env`, not `import.meta.env`), so do **not**
reuse a `VITE_*` key here. Add it to `.github/workflows/nfl-daily-brief.yml`
`env:` **only if** the operator wants tailnet deep-links in the email; otherwise
leave it out and the block works via the dashboard link.

---

## 9. Tests

`agents/nfl-daily-brief.js` has **no existing unit-test harness** — it is
verified today via the GHA `workflow_dispatch` **dry-run** (prints HTML + text,
saves `preview/newsletter_live_preview.html`). 7c keeps that as the primary
verification and adds focused assertions on the two **pure** new functions only:

1. **Filter/sort/cap:** given mixed picks, `fetchTopPodcastPicks` (fed a fake
   Supabase returning canned rows) drops `needs_review`, sorts by `confidence`
   desc, caps at 8.
2. **Window:** an episode with `processed_at` older than the lookback is excluded
   (assert the `.gte('processed_at', …)` arg, or test the flatten given pre-filtered rows).
3. **Multi-sport filter:** a non-NFL episode's picks are excluded by `isNFLRelevant`.
4. **XSS:** a pick `summary` of `"<script>"` renders escaped via `renderTopPodcastPicks`.
5. **`category` not `type`:** a pick with only `category` set renders its label;
   a stray legacy `type` field is ignored (regression guard for the 7b/7c bug class).
6. **Link logic:** `M6_DIGEST_BASE` unset ⇒ no `/digest/` link in output;
   set ⇒ exactly one `/digest/episodes/<id>.html` link per pick.
7. **Empty ⇒ `''`:** `renderTopPodcastPicks([])` returns empty string (section hides).

Manual gate before merge: `node agents/nfl-daily-brief.js --dry-run` and eyeball
the new section in `preview/newsletter_live_preview.html`.

---

## 10. Out of Scope (explicit)

- Touching the existing **Podcast Intel** section (stays intel-only). 7c is
  additive.
- Any M6 HTTP call from the brief (see §7 — impossible from GHA, unnecessary).
- Per-pick grading/result status (that's the auto-grade pipeline; the brief
  shows the *pick*, not its outcome).
- A new table or migration — `podcast_transcripts.picks` already holds everything.
- Backfilling old episodes — the 24h window is forward-looking by design.

---

## 11. Sequencing

```
Phase 4 (picks in Supabase) ──→ 7c (this block)        ← hard dep, already met
Phase 7a (rendered pages)   ──→ 7c direct digest link  ← soft: link target only
Phase 7b (?tab=podcasts)    ──→ 7c dashboard link      ← soft: cosmetic until 7b ships
```

- **7c can ship today.** Its hard dependency (picks in Supabase) is already met;
  both link targets degrade gracefully if 7a/7b aren't live yet.
- It is the **lowest-risk** Phase 7 item: one file, additive, no new
  infrastructure, no new dependency unless the operator opts into `M6_DIGEST_BASE`.
