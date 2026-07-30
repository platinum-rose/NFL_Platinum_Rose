---
name: nfl-project-guide
description: Master project guide covering architecture, file structure, service endpoints, and key guardrails.
---

# NFL Platinum Rose - Project Guide

**When to Activate:** Read this skill when starting a session, navigating the codebase, checking project architecture, adding environment variables, or debugging issues related to local storage and APIs.

## Architecture & Project Overview
- **Type**: NFL betting analytics and line shopping dashboard (React + Vite + Tailwind CSS).
- **Workspace**: `E:\dev\projects\NFL_Dashboard`
- **Dev URL**: `http://localhost:5173/platinum-rose-app/`
- **Vite Config**: 
  - Base path: `/platinum-rose-app/`
  - Alias: `@` -> `./src`
  - *Public files*: NEVER use hardcoded `/filename.json`. Always fetch as relative `./filename.json`.

## Orchestration Directives
1. **Agent-first**: Route work to the specialist agent (see `nfl-agent-routing`).
2. **Context check**: Read `WORKING-CONTEXT.md` at session start.
3. **Rules are laws**: Read `RULES.md` and `docs/ANTI_PATTERNS.md` before touching dates, team names, or storage keys.
4. **Quality gates**: Run tests, lint, and check for stray `console.log` before committing.
5. **Hot files require PM lock**: `App.jsx`, `storage.js`, `picksDatabase.js`, `CLAUDE.md`, `AGENT_LOCK.json` - claim explicit scope before editing.

## File Structure Conventions
- Components: `src/components/{category}/{ComponentName}.jsx`
- Utils/libs: `src/lib/{utilName}.js`
- Data files: `public/*.json`
- Modals: `src/components/modals/{ModalName}Modal.jsx`
- Python scripts: `scripts/*.py`

## Environment Variables
- Safe to bundle (public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Centralized in `src/lib/apiConfig.js`.
- **CRITICAL**: Never reintroduce `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, or `VITE_ODDS_API_KEY`. These live as Supabase Edge Function secrets and are accessed server-side.

## LocalStorage Protocol
- **Single Source of Truth**: All keys are catalogued in `PR_STORAGE_KEYS` in `src/lib/storage.js`. Use `loadFromStorage`/`saveToStorage`/`clearStorage`. Never call `localStorage` directly.
- **Critical Keys**: `nfl_expert_consensus`, `pr_picks_v1`, `nfl_bankroll_data_v1`, `nfl_futures_portfolio_v1`, `nfl_props_picks_v1`.
- **Migration Rule**: NEVER change localStorage key names without a migration helper. Old data becomes invisible.

## Key API Integrations
- **TheOddsAPI**: Live odds. Free plan = 500 req/month. Auto-refresh and startup fetch are DISABLED to prevent quota burning.
- **OpenAI**: GPT-4o transcript extraction.
- **Supabase**: Persistent storage.
- **ESPN**: Injury reports.

## Custom Commands
- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm run test`: Test suite
- `/handoff`: Produce session summary and update `HANDOFF_PROMPT.md`
