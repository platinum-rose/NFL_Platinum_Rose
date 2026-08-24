# Podcast Pipeline — Phase 7b: SPA Podcast Digest Tab

> **Status:** Specced (not built) | **Author:** PM | **Date:** 2026-06-03
> **Depends on:** 7a (files), 7 serving (`/digest/*`), Phase 8 §8 (Share contract)
> **Spec source:** `/memories/repo/nfl-podcast-pipeline-spec.md` §3 Phase 7
> **SPA component:** `src/components/podcasts/PodcastDigestTab.jsx`

---

## 1. Purpose

Add a first-class **Podcasts** tab (`?tab=podcasts`) to the dashboard SPA that:

1. **Lists** processed episodes (from Supabase anon — works with or without M6).
2. **Opens** the rendered digest pages on M6 (`/digest/*`, tailnet — operator).
3. **Shares** a public partner link (`/share/*`, Funnel — Phase 8 §8 contract).
4. **Imports** an episode's picks into the Picks Tracker (carried from the modal).

7b is the surface that makes 7a/7-serving visible. The episode list is fully
decoupled from M6 (Supabase-only), so the tab is **never blank when M6 is down** —
only the open/share affordances depend on M6.

---

## 2. What Already Exists (do not rebuild)

| Asset | Location | State / Reuse |
|-------|----------|---------------|
| Episode query | `getPodcastEpisodes(limit)` in `src/lib/supabase.js:510` | ✅ reuse as-is (anon, `status=done`, joins feed+transcript) |
| Episode/pick card UI | `src/components/modals/PodcastIngestModal.jsx` | ✅ **port the card/grouping markup**; fix the pick-shape bug (§3.4) |
| Import-to-Picks | `addPick()` from `src/lib/picksDatabase.js` (used in the modal) | ✅ reuse |
| Tab registry | `App.jsx:57-60` `VALID_TABS` Set | **add `'podcasts'`** |
| Tab → URL sync | `App.jsx:76-84` `useEffect` `replaceState` | ✅ already generic; no change |
| Lazy tab pattern | `App.jsx:43-51` `const X = lazy(() => import(...))` | ✅ follow it |
| Tab render slot | `App.jsx:192-204` `{activeTab === '...' && <... />}` | **add a `podcasts` block** |
| Nav button | `Header.jsx` `NavTab` (line 127-139) + mobile nav (151-158) | **add `<NavTab id="podcasts" .../>`** |
| Config convention | `import.meta.env.VITE_*` centralized in `src/lib/apiConfig.js` | **add M6 base (§3.3)** |

### Pick shape the tab consumes (migration 023 v2 — authoritative)

```jsonc
{ "category":"spread|total|moneyline|future|prop", "subject":"KC", "selection":"KC|UNDER",
  "team1":"KC", "team2":"LV", "line":-3.5, "summary":"…", "units":2,
  "confidence":0.78, "quality_score":0.74, "needs_review":false, "week":5, "season":2026 }
```

---

## 3. Design Decisions

### 3.1 A tab, not another modal — and the modal is superseded

The existing `PodcastIngestModal` (opened from the Picks tab) is a cramped surface
for what is now a full content area (episode browse + digest open + share). 7b
builds the canonical **tab**. The modal is **flagged for deprecation** (hand to
UX_EXPERT) once the tab reaches parity — 7b does **not** delete it (it stays
reachable from `PicksTracker.onOpenPodcastModal` until UX signs off), to avoid a
regression in the same change.

### 3.2 Two M6 surfaces, two buttons, two audiences

| Action | URL | Network | Audience | Enabled when |
|--------|-----|---------|----------|--------------|
| **Open digest** | `${M6_BASE}/digest/episodes/<id>.html` | Tailscale **serve** (tailnet) | operator (on tailnet) | `VITE_M6_BASE` set |
| **Copy share link** | `${FUNNEL_BASE}/share/<token>/episodes/<id>` | Tailscale **funnel** (public) | partners (off-tailnet) | base **and** token set |

These are intentionally distinct. "Open" navigates the operator straight to the
private page; "Share" copies a tokened public link for a partner. Both target the
same Fastify host (Tailscale serve + funnel share one hostname), so in practice
`VITE_M6_BASE` and `VITE_M6_FUNNEL_BASE` may hold the **same** value — but they
stay separate keys because their reachability and trust differ (§3.3).

### 3.3 Config — add M6 bases to `apiConfig.js` (the one real new dep)

No `VITE_M6_*` exists in the repo today. Add, following the existing pattern:

```js
// src/lib/apiConfig.js
export const M6 = {
  // Tailnet host for opening private /digest/* pages (operator).
  BASE:        (import.meta.env.VITE_M6_BASE || '').replace(/\/$/, ''),
  // Public Funnel host for /share/* links (Phase 8 §8). Often === BASE.
  FUNNEL_BASE: (import.meta.env.VITE_M6_FUNNEL_BASE || import.meta.env.VITE_M6_BASE || '').replace(/\/$/, ''),
};
```

The **share token** is *not* an env var — per Phase 8 §8 it is a runtime-injected
`window.__NFL_SHARE_TOKEN__` (never committed, never in the JS bundle). 7b reads
it at click time only.

### 3.4 Use `category`, not `type` — and `confidence` is 0-1 (bug the modal has)

The existing modal reads `pick.type` and renders `{pick.confidence}% conf`. The v2
data has **`pick.category`** and **`confidence ∈ [0,1]`**. The ported card MUST:

- switch on `pick.category` (`spread|total|moneyline|future|prop`),
- render confidence as `Math.round(confidence * 100)`% (and prefer `quality_score`),
- key the import `pickType` off `category`, not `type`.

This is called out so 7b ships correct cards instead of inheriting silent
mislabeling. (A separate fix to the legacy modal is a BUG_FIXER follow-up.)

### 3.5 Graceful degradation when M6 is unreachable

- The **list always renders** (Supabase anon). M6 being down never blanks the tab.
- "Open digest" is a `window.open` to a tailnet host; if the operator is
  off-tailnet it fails in the new tab. Mitigation: a one-line helper under the
  list — *"Digests are served privately from M6 (tailnet). Off-tailnet? Use Copy
  Share Link."* — and disable "Open" entirely if `VITE_M6_BASE` is unset.
- **Optional** best-effort M6 status dot: a short-timeout `fetch(M6_BASE + '/health')`.
  Note this is **cross-origin** and M6 sets no CORS headers today, so treat it as
  opportunistic (`no-cors` opaque / catch→unknown); do **not** gate any UI on it.
  Recommend deferring unless trivial.

---

## 4. Component Layout

```
src/components/podcasts/
└── PodcastDigestTab.jsx     # default export; lazy-loaded in App.jsx

(reuses) src/lib/supabase.js  getPodcastEpisodes
(reuses) src/lib/picksDatabase.js  addPick
(reuses) src/lib/apiConfig.js  M6  (new export, §3.3)
```

Optional later: extract the shared `EpisodeCard` out of the modal into
`src/components/podcasts/EpisodeCard.jsx` so tab + modal share one card — flag for
CODE_QUALITY, **not** in 7b's critical path.

---

## 5. Component Behavior (`PodcastDigestTab.jsx`)

```jsx
export default function PodcastDigestTab() {
  // load: getPodcastEpisodes(30) → group by podcast_feeds.name (same as modal §256)
  // per-episode actions: Open digest | Copy share link | Import N picks
}
```

### 5.1 URL builders

```js
import { M6 } from '../../lib/apiConfig';

const digestUrl = (id) => `${M6.BASE}/digest/episodes/${id}.html`;

function shareUrl(kind, ...parts) {                 // Phase 8 §8 contract
  const token = window.__NFL_SHARE_TOKEN__;
  if (!M6.FUNNEL_BASE || !token) return null;       // → control disabled
  return `${M6.FUNNEL_BASE}/share/${token}/${kind}/${parts.join('/')}`;
}
// episode: shareUrl('episodes', ep.id)
// expert:  shareUrl('experts', slugify(expert))
// week:    shareUrl('weekly', `${season}-W${week}`)
```

`slugify(expert)` MUST match 7a §5 / Phase 8 §5.2 `^[a-z0-9-]{1,64}$`, or the
share link won't resolve against the rendered file. Import the same helper or
mirror it exactly.

### 5.2 Per-episode controls

- **Open digest** → `window.open(digestUrl(ep.id), '_blank', 'noopener')`. Disabled
  (greyed, tooltip) when `M6.BASE` is empty.
- **Copy share link** → `navigator.clipboard.writeText(shareUrl('episodes', ep.id))`;
  brief "Copied ✓" state. Disabled with the Phase 8 §8 tooltip
  (*"Configure a share token on M6 to enable sharing."*) when `shareUrl` returns null.
  **Never display the token** — it only ever goes into the clipboard string.
- **Import N picks** → reuse the modal's `addPick` loop, fixed to read `category`.

### 5.3 Rollup links (light v1)

Above the list, two optional link rows when data supports them:
- **This week's consensus** → open `/digest/weekly/<season>-W<week>.html` (derive
  current week from `getNFLWeekInfo()` already used by `Header.jsx`).
- Per expert group header → open `/digest/experts/<slug>.html`.

Keep these as plain "Open" links (same tailnet caveat). No new data fetch — slugs
and the current week are derivable from data already on the page.

---

## 6. Wiring Edits (exact points)

1. `App.jsx:57` — add `'podcasts'` to `VALID_TABS`.
2. `App.jsx` (near line 51) — `const PodcastDigestTab = lazy(() => import('./components/podcasts/PodcastDigestTab'));`
3. `App.jsx` (in the render slot ~204) —
   `{activeTab === 'podcasts' && <div className="animate-in fade-in zoom-in duration-300"><PodcastDigestTab /></div>}`
4. `Header.jsx` (NavTab row ~138) — `<NavTab id="podcasts" label="Podcasts" icon={Radio} />`
   (`Radio`/`Mic2` already imported from `lucide-react`). Optionally add to mobile nav.

No change to the `App.jsx:76-84` URL-sync effect — it already handles any tab id.

---

## 7. Styling

Match the dark theme already in the modal: `#00d2be` accent, slate palette,
`lucide-react` icons, rounded cards, `animate-in fade-in` on mount. Port the
modal's grouped-by-feed layout and `EpisodeCard` expansion. Full-width tab
container (`max-w-7xl` via the existing `<main>`), not a modal shell.

---

## 8. Tests (`src/components/podcasts/PodcastDigestTab.test.jsx`, RTL — TEST_ENGINEER scope)

Mock `getPodcastEpisodes` (canned 2-feed payload), `apiConfig.M6`, and
`window.__NFL_SHARE_TOKEN__`.

1. Renders grouped episode list from the mocked query; M6 unset → list still shows.
2. Pick card reads **`category`** (not `type`) and renders confidence as a %
   from a 0-1 value (e.g. `0.78` → `78%`). Regression guard for §3.4.
3. "Open digest" with `M6.BASE` set → calls `window.open` with
   `…/digest/episodes/<id>.html`; with `M6.BASE` empty → control disabled.
4. "Copy share link": no token → disabled with the §8 tooltip; token present →
   `clipboard.writeText` receives `${FUNNEL_BASE}/share/<token>/episodes/<id>`,
   and the token is **never** rendered to the DOM.
5. `slugify` output matches `^[a-z0-9-]{1,64}$` (shared assertion with 7a/Phase 8).
6. Import → `addPick` called once per pick with `pickType` derived from `category`.
7. Empty vault → friendly empty state, no throw.
8. (App routing) `?tab=podcasts` mounts the tab — extend the existing tab test if one exists.

---

## 9. Sequencing & Dependencies

```
7a (files) → 7 serving (/digest/*) ─┐
Phase 8 §8 (share contract) ────────┼─→ 7b (this) → 7b Share button activates when Phase 8 + token land
apiConfig M6 base (new) ────────────┘
```

- **Builds now, regardless of M6:** the list + import work against Supabase anon
  immediately. Open/Share light up as their config/deps land (Phase 8 §8 designed
  this exact "ships disabled" path — no 7b rework needed later).
- **Hard dep (new):** `VITE_M6_BASE` defined for the operator's build to enable
  "Open digest". Without it, the tab still lists + imports; Open is disabled.
- **Soft dep:** Phase 8 + a minted token to enable "Copy share link".
- **Open question to confirm at build:** whether the operator's SPA build runs on
  the tailnet (so `/digest/*` opens resolve). If the SPA is hosted off-tailnet,
  "Open digest" only works for users who are themselves on the tailnet — document
  in README. Does not block the list/import surface.

---

## 10. Out of Scope (explicit)

- Token minting / management — operator CLI (Phase 8 §6); SPA never mints.
- Rendering or serving digests — 7a / 7-serving.
- Deleting `PodcastIngestModal` — UX_EXPERT deprecation follow-up after parity.
- Fixing the legacy modal's `type`/`confidence` bug — BUG_FIXER follow-up (7b just
  doesn't reproduce it).
- A search/filter bar over episodes — v2 enhancement; v1 is browse + open + share.
- Embedding digest HTML inline (iframe) — v1 uses `window.open`; revisit if the
  tailnet/CORS story makes inline preview worthwhile.
