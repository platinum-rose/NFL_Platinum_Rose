# Session Handoff — June 4, 2026

> **Branch:** main | **HEAD:** `51ac195` | **Tests:** 64/64 (m6-podcast-service)
> **Next session goal:** ATLAS project consolidation — integrate all projects, unify Supabase accounts, GitHub org, credential registry

---

## What shipped this session

### Phase 7a — Static Digest Renderer (m6-podcast-service)
`packages/m6-podcast-service/render/` — 4 new files:
- `writeFile.js` — atomicWrite (*.tmp → rename) + ensureDir
- `aggregate.js` — slugify, weekTagFor, seasonWeekFromDate, groupByExpert, weeklyConsensus, detectSlugCollisions
- `templates.js` — esc() XSS choke point, layout(), pickCard(), intelList()
- `index.js` — buildRenderer({supabase,cfg}): renderAll, renderForEpisode, renderEpisode, renderExpert, renderExpertWeek, renderWeekly
- `scripts/render-digests.js` — CLI: all | episode --id | week --tag
- `src/runRegistry.js` — onRunComplete hook (fail-soft, fire-and-forget after done)
- `src/server.js` — shared Supabase client for renderer + Phase 8 guard
- **10/10 tests** in `test/render.test.js`

### Phase 7-serving — /digest/* Fastify routes
`packages/m6-podcast-service/src/digest.js` — new:
- resolveDigestPath() — param validation + containment assertion (traversal defense)
- sendDigestFile() — atomic read, ETag conditional GET, response headers
- registerDigestRoutes() — 4 Tailscale-only routes (no app auth)
- `src/app.js` — replaced 501 stubs with registerDigestRoutes; added opts.cfg
- **14/14 tests** in `test/digest.test.js`

### Phase 7b — Podcasts SPA Tab
- `src/components/podcasts/PodcastDigestTab.jsx` — new full tab: episode list, Open digest (tailnet), Copy share link (Phase 8), Import picks (category fix + 0-1 confidence fix)
- `src/lib/apiConfig.js` — added M6 = { BASE, FUNNEL_BASE }
- `src/App.jsx` — 'podcasts' in VALID_TABS + lazy import + render slot
- `src/components/layout/Header.jsx` — Radio icon + Podcasts NavTab

### Phase 8 — /share/* Partner Surface
`packages/m6-podcast-service/src/share.js` — new:
- shareGuard() — per-instance TTL cache, opaque 403 for all rejections
- recordView() — fire-and-forget audit, IP /24 or /48 truncation
- registerShareRoutes() — 4 public Funnel routes reusing digest.js resolver
- mintToken / revokeToken / listTokens — service-role CLI helpers
- `scripts/share-token.js` — mint | list --active | revoke --token CLI
- `src/app.js` — registerShareRoutes wired; opts.supabase added
- **10/10 tests** in `test/share.test.js`

### Agent Provider Fallback
- `src/lib/anthropicClient.js` — isCreditError() + auto-fallback to GPT-4o in runAgentTurn()
- `supabase/functions/ai-proxy/index.ts` — updated to Deno.serve() (fixed CORS), added Gemini route
- `src/components/agent/AgentChat.jsx` — activeModelLabel state + onStep provider_fallback handler + "Asking Claude/GPT-4o..." loading label
- `src/components/agent/FuturesAgentChat.jsx` — same pattern

### Ops completed
- Supabase migrations 019 + 023 applied to prod (share_tokens + share_views now live)
- stats-to-vault-sync run: 96 team-season rows → 35 vault notes (32 teams + 3 reference pages, 2023-2025)
- ai-proxy Edge Function deployed with --no-verify-jwt (was never deployed before)
- Supabase CLI re-linked to andrewlrose@hotmail.com account (NFL Dashboard project)

---

## State of the podcast pipeline

All phases complete:

| Phase | Status |
|-------|--------|
| 1–6  | Full ingest pipeline | ✅ |
| 7c   | Top Podcast Picks in nfl-daily-brief | ✅ |
| 7a   | Static digest renderer | ✅ |
| 7-serving | /digest/* Fastify routes | ✅ |
| 7b   | PodcastDigestTab SPA | ✅ |
| 8    | /share/* partner surface | ✅ |

### Remaining podcast ops (non-blocking)
- Apply migration 023 to prod → DONE ✅
- Mint share tokens for Patrick/Amanda: `node scripts/share-token.js mint --partner "Patrick"`
- Set VITE_M6_BASE in .env (+ rebuild) to enable "Open digest" links in the tab

---

## Pending ops backlog
- Rotate Anthropic / OpenAI / Odds API keys + redeploy Edge Functions
- Top up Anthropic API credits (GPT-4o fallback working in the meantime)
- Add GEMINI_API_KEY to Supabase secrets if Gemini fallback tier wanted
- Run supabase CLI update: `supabase update` (v2.101.0 → v2.105.0)

---

## Next session: ATLAS consolidation

**Goal:** Unify all projects under ATLAS so ATLAS and Rosie have full operational access everywhere.

**The 4 problems to solve:**

1. **Split Supabase accounts** — NFL Dashboard under `andrewlrose@hotmail.com`, ROSIE under `rosietherobotrose@gmail.com`. Fix: invite `andrewlrose@gmail.com` as Owner on every project from the dashboard.

2. **No GitHub org** — 17 repos under personal account. Fix: create GitHub org (e.g. `andrewlrose-dev`), transfer repos, issue one org-scoped PAT for ATLAS/Rosie automation.

3. **No credential registry** — each project's keys siloed in separate .env files. Fix: store all service credentials in ATLAS vault with domain partitions.

4. **No formal project registry** — ATLAS nightly runner has hardcoded paths. Fix: `E:\dev\ATLAS\.atlas\projects.json` with structured metadata per project (owner, Supabase ref, GitHub URL, language, status).

**Start here:**
1. Read `.atlas/memory.json` + `HANDOFF.md` for current ATLAS state
2. Read `/memories/repo/security-action-items.md` (GitHub Org Consolidation items)
3. Begin with Supabase account consolidation (simplest, highest impact, enables CLI use)

---

## Resume command
```
Resume NFL Dashboard / ATLAS consolidation. HEAD = 51ac195 (main). NFL podcast pipeline complete (Phases 1-8). 
Next session: ATLAS project consolidation — unify Supabase accounts, GitHub org, credential registry.
Read docs/SESSION_HANDOFF_2026-06-04.md (NFL) and E:\dev\ATLAS\HANDOFF.md before starting.
```
