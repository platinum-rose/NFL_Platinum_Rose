# Session Handoff — Podcast Pipeline Phase 7 + 8 Specs

> **Date:** 2026-06-03 | **Author:** PM agent | **Branch:** main
> **Purpose:** Resume building in a fresh session. This is the single source of truth for
> what happened this session and exactly where to start. Read this, then `docs/PODCAST_PHASE7C_BUILD_KIT.md`.

---

## TL;DR

This session **specced the entire remaining podcast pipeline** (Phase 7a → 7-serving → 7b → 7c
→ Phase 8) by tracing each piece against the *actual* code rather than the original plan. Two
of those traces overturned the plan's assumptions. **No production code was written** — this
was a spec/planning session. The lowest-risk, ship-today item (**7c**) now has a concrete,
copy-paste build kit. Start there.

**Where to start building:** `docs/PODCAST_PHASE7C_BUILD_KIT.md` → one file, additive, ~1 hour.

---

## What shipped this session (docs only)

| File | What it is | Status |
|------|-----------|--------|
| `docs/PODCAST_PHASE7_SERVING_SPEC.md` | `src/digest.js` Fastify serving layer (the `/digest/*` routes M6 exposes over Tailscale) | New spec |
| `docs/PODCAST_PHASE7A_RENDER_SPEC.md` | Static digest HTML renderer under `packages/m6-podcast-service/render/` | New spec |
| `docs/PODCAST_PHASE7B_SPA_SPEC.md` | `PodcastDigestTab.jsx` + `?tab=podcasts` SPA tab | New spec |
| `docs/PODCAST_PHASE7C_BRIEF_SPEC.md` | "Top Podcast Picks (24h)" block in `agents/nfl-daily-brief.js` | New spec |
| `docs/PODCAST_PHASE7C_BUILD_KIT.md` | **Concrete patch sequence for 7c** (this is your build starting point) | New |
| `docs/PODCAST_PHASE8_SHARE_SPEC.md` | Signed `/share/*` partner surface (token-gated, audit-logged) | New spec |
| `docs/PODCAST_PIPELINE_PM_HANDOFF.md` | Rewrote the 7c section, fixed a duplicated `### 7c` header, replaced the impossible M6-ping guardrail; added Phase 8 summary; reconciled the `cd` path | Edited |
| `TASK_BOARD.md` | Refined `P7c` with the now-defined contract; logged the regression fix + an `F-15` ID-collision note; date reconciled to HEAD | Edited |
| `agents/futures-odds-ingest.js` | (Pre-session, uncommitted) restored the `.upsert()` path reverted by `f1e6f19` — fixes 2 `oddsIdempotent` tests → 552/552 | Edited |

---

## The two findings that changed the plan

These are the load-bearing discoveries. If you only remember two things, remember these.

### Finding 1 — the brief already has a podcast section, and already fetches the picks it then discards

`agents/nfl-daily-brief.js:231` `fetchPodcastIntel` already `.select(... picks ...)` (line 235)
but `renderPodcastIntel` (line 611) only renders the `intel` strings — **the picks are fetched
and thrown away.** So 7c is *not* "add podcast support to the brief." It is "surface picks that
are already in hand." The build kit adds a **parallel** `fetchTopPodcastPicks` (windowed,
confidence-sorted) rather than touching the working intel section. This is why 7c is the
lowest-risk item.

### Finding 2 — the original 7c guardrail was architecturally impossible

The PM handoff said: *"If M6 is unavailable, degrade to a plain 'M6 unavailable' note."* That
assumes the brief can talk to M6. **It cannot.** I read `.github/workflows/nfl-daily-brief.yml`:
the brief runs in **GitHub Actions on `ubuntu-latest`**, off-tailnet, with
`SUPABASE_SERVICE_ROLE_KEY` as its only data secret and **no Tailscale credentials**. M6's
`/digest/*` is Tailscale-serve, **tailnet-only**. So a "ping M6, degrade if down" HEAD check
would **fail every single run** and risk the 10-minute job timeout.

**Corrected architecture (now in spec §7 + handoff):** content comes from **Supabase** (always,
same as every other section); the M6/dashboard URL is a **pure string built from env**, never a
live check. Degradation is the normal Supabase-empty → section-hides path. The direct M6 deep
link appears per-pick **only when `M6_DIGEST_BASE` is set** (it won't be in GHA), and the
always-reachable fallback is the dashboard `?tab=podcasts` link.

---

## Cross-cutting contracts (apply to 7a/7b/7c — verified against code)

- **Pick shape (migration 023 v2):** `{ category, subject, selection, line, summary, units,
  confidence (0-1), quality_score, needs_review, week?, season? }`. **Read `pick.category`, never
  the legacy `pick.type`.** `confidence` is **0-1**, multiply by 100 only for display.
- **Two env mechanisms, do not cross them:** the **agent** (Node) uses
  `process.env.M6_DIGEST_BASE`; the **SPA** (7b, browser) uses `import.meta.env.VITE_M6_BASE`.
  Same concept, different runtime. Reusing a `VITE_*` key in the agent is a trap.
- **Audience distinction:** the brief is **private** to the operator → it *shows* `confidence`
  and `units`. The Phase 8 public partner cards (7a §10) **omit** raw confidence (avoid
  over-precision to partners). Not an inconsistency — deliberate.
- **Degrade-don't-break links:** dashboard `?tab=podcasts` is always reachable (GitHub Pages);
  direct M6 digest links resolve only on tailnet and are always optional.

---

## State of the tree (what you'll pull)

- **Branch:** `main`, will be pushed to `origin/main` this session.
- **HEAD before this session:** `df020a4` (Phase 6e).
- **Tests:** 552 / 552 (the `oddsIdempotent` regression was fixed via the `futures-odds-ingest.js`
  upsert restore — committed this session).
- **Phases 1–6 of the podcast pipeline: DONE.** Phase 7 + 8: **fully specced, not built.**
- **No source/feature code changed this session** except the pre-existing upsert regression fix.

---

## Recommended build order (fresh session)

1. **7c — `docs/PODCAST_PHASE7C_BUILD_KIT.md`** ← start here. One file, additive, ships today.
   Hard dep (picks in Supabase) already met; both link targets degrade gracefully if 7a/7b
   aren't live yet.
2. **7a — render layer** (`PODCAST_PHASE7A_RENDER_SPEC.md`). The true critical-path blocker:
   produces the HTML that 7-serving exposes and 7b/Phase 8 link to.
3. **7-serving — `src/digest.js`** (`PODCAST_PHASE7_SERVING_SPEC.md`). Exposes 7a's files over Tailscale.
4. **7b — SPA tab** (`PODCAST_PHASE7B_SPA_SPEC.md`). Lights up the `?tab=podcasts` link 7c points at.
5. **Phase 8 — `/share/*`** (`PODCAST_PHASE8_SHARE_SPEC.md`). Reuses the 7a resolver + the
   `share_tokens`/`share_views` tables already in migration 023.

> Dependency note: 7c links *target* 7a/7b but do **not** depend on them to function — the links
> just 404 harmlessly until those ship. That's why 7c is safe to build first.

---

## Still-pending manual production actions (unchanged, carry forward)

These are not code — they're ops steps that gate full production behaviour:
- `supabase db push` migrations `018`, `019`, `021`, `022` (the `022` unique constraint is what
  makes the `futures-odds-ingest` upsert valid in prod); create owner auth user.
- Rotate Anthropic / OpenAI / Odds API keys + redeploy Edge Functions.
- Run `node agents/stats-to-vault-sync.js --seasons 2023,2024,2025` once to seed the vault.
- Migration `023` (podcast picks + `share_tokens`/`share_views`) must be applied before Phase 8.

---

## Open gaps / watch-outs

- `agents/nfl-daily-brief.js` has **no unit-test harness** today. The 7c build kit adds the first
  one and requires guarding `main()` behind an `argv` check so the module is importable — the one
  structural (non-additive) change in 7c. Called out in the kit's §3.
- `futures.manifest.json` lists 3 spec tools under `deferredTools` that don't exist in
  `agentTools.js` yet (`analyze_futures_hedge`, `project_division_paths`, `track_award_race`).
- `F-15` is used for two distinct work items in the repo — disambiguate by commit hash (noted in
  TASK_BOARD).

---

*Resume order: this file → `docs/PODCAST_PHASE7C_BUILD_KIT.md` → build. The full "why" for each
phase is its `PODCAST_PHASE7*_SPEC.md`.*
