# NFL Dashboard Formal Audit Report

Ultrathink

Audit subject: NFL Dashboard / NFL Platinum Rose  
Repository: `D:\DEV\github\NFL_Platinum_Rose`  
Audit date: May 21, 2026  
Reviewed revision: branch `main`, commit `3fc8694`  
Audit posture: external security, reliability, maintainability, and production-readiness review

## 1. Executive Summary

NFL Platinum Rose has a substantial working product surface rather than a thin dashboard prototype. The reviewed repository contains a Vite/React frontend, local personal betting workflows, browser AI chat tools, Supabase-backed datasets and sync tables, scheduled GitHub Actions ingest agents, Supabase migrations, a small unit test suite, and Playwright smoke coverage. The project shows useful modularization in its hooks, data libraries, components, background agents, and migration history. The production build and current unit suite complete successfully.

The critical risk is that the trust boundary is not production-grade. Public GitHub Pages deployment injects `VITE_` provider keys into a browser bundle, and the browser directly calls AI and odds providers. The Supabase schema grants anonymous full access to personal picks and bankroll-bet tables, and the vault-notes migration grants an unrestricted `for all` write policy despite naming it as a service write policy. These conditions can expose paid API credentials, permit confidentiality and integrity loss for personal betting records, and allow vault note or agent-context poisoning.

The project is also not currently quality-gate clean. `npm run lint` fails broadly, coverage across `src/lib` is low, one smoke-test path fails after Playwright is installed, the Python requirements set cannot be resolved by `pip-audit`, and dependency audits report known Node advisories. There are functional accuracy risks around hardcoded 2026 season assumptions, injury data access mismatches, and a fire-and-forget cloud sync strategy without conflict resolution.

Production-readiness verdict: not ready for public, multi-user, or paid-key deployment until the High-priority access-control and secret-handling issues are remediated. It can remain a controlled personal prototype only if the owner accepts that browser-bundled keys, anonymous cloud writes, local browser storage, and limited auditability are explicit risks.

## 2. Scope & Methodology

### Scope

Included components:

| Area | Reviewed surfaces |
| --- | --- |
| Frontend application | `src/App.jsx`, hooks, dashboard and odds views, betting and props agent chat, storage, bankroll, picks, Supabase and vault clients |
| Deployment and environment | Vite config, GitHub Pages deploy workflow, smoke workflow, `.env.example`, project scripts |
| Data layer | Supabase migrations `001` through `017`, RLS policies, localStorage catalog, hydration and sync flows |
| AI-enhanced workflows | Browser Anthropic/OpenAI agent clients, transcript analysis path, agent tools, vault data injection |
| Background automation | Node ingest and grading agents under `agents/`, GitHub Actions workflows, Python requirements |
| Quality evidence | README and docs, unit tests, Playwright smoke tests, lint, coverage, build, dependency scans, targeted secret scan |

Not included:

1. Live penetration testing against the deployed GitHub Pages site or live Supabase project.
2. Validation of cloud console configuration, branch protection, GitHub secret settings, Supabase grants outside migrations, provider billing limits, or production logs.
3. Verification of live third-party source accuracy from ESPN, The Odds API, Action Network, RSS feeds, OpenAI, Anthropic, or Obsidian.
4. Formal legal certification against a named regulatory regime.

### Methods

| Method | Activities performed |
| --- | --- |
| Code review | Read architecture docs, app entry points, storage and sync libraries, AI clients, selected agent flows, migrations, workflows, test config, and dependency manifests. Searched for raw storage access, network calls, service-role usage, RLS policy patterns, and key handling. |
| Functional testing | Installed Node dependencies from the lockfile; ran unit tests, coverage, production build, and Playwright smoke tests. Installed the missing Playwright Chromium runtime and reran smoke tests to reach application behavior. |
| Data validation | Compared Supabase migrations and RLS comments with browser query paths and sync/hydration logic. Reviewed personal data fields, data source fallback paths, and seasonal defaults. |
| Security assessment | Reviewed browser key exposure, anonymous access paths, localStorage handling, direct provider calls, service-role usage, vault writes, migration policies, dependency advisories, and repository secret scanning evidence. |
| Performance profiling | Used the production build output and chunk sizing as a static bundle baseline. Reviewed lazy loading and synchronous app boot/data loading structure. No live load test was performed. |
| Compliance check | Assessed authentication, authorization, audit trails, actor attribution, retention/documentation signals, and ability to reconstruct data changes. |

### Verification Evidence

| Check | Result |
| --- | --- |
| `npm ci` | Completed. NPM reported 6 advisories after install. |
| `npm test` | Passed: 5 unit test files, 84 tests. |
| `npm run test:coverage` | Passed but reported 8.11% statement coverage, 4.09% branch coverage, and 8.69% line coverage across configured `src/lib/**/*.js`. |
| `npm run build` | Passed. Build output included a 460.89 kB main JS chunk, 388.58 kB Recharts vendor chunk, and 204.09 kB AgentChat chunk before gzip. |
| `npm run lint` | Failed: 395 errors and 16 warnings across frontend, Node agents, hooks/scripts, config, and bundled skill asset paths. |
| `npm run test:smoke` | Initial run could not launch Chromium because the local Playwright browser was absent. After `npx playwright install chromium`, 8 smoke checks passed and the tab-navigation check failed because the active `The Board` tab was outside the viewport during Playwright click. |
| `npm audit --omit=dev --json` | Reported 1 Moderate production dependency advisory for transitive `ws`. |
| `npm audit --json` | Reported 6 total advisories: 3 High and 3 Moderate, including Vite and other development dependency paths. |
| Python audit | `python -m pip_audit -r requirements.txt --format json` could not complete because the pinned requirements set is resolver-conflicting around `numpy==2.4.0` and packages at requirements lines 14, 36, and 39. |
| Secret scan | Repository secret hook completed without findings; targeted pattern search found environment-variable references but no committed live provider key material in the reviewed paths. |

## 3. Detailed Findings by Area

### a. Architecture & Environment

Strengths:

1. The frontend separates application state, hooks, shared libraries, features, tests, background agents, and SQL migrations into recognizable modules.
2. Scheduled GitHub Actions agents move ingest and grading work out of the browser for many Supabase-written datasets.
3. The app uses a production build path, code splitting for several heavy tabs, Supabase migration history, and a Playwright smoke workflow.

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| ARCH-01 | High | The public deployment architecture has no server trust boundary for paid provider credentials. | `.github/workflows/deploy.yml:33-39` injects `VITE_ODDS_API_KEY` and `VITE_OPENAI_API_KEY` into the Vite Pages build. `src/lib/apiConfig.js:7-11`, `src/lib/openai.js`, `src/lib/oddsApi.js`, and `src/lib/anthropicClient.js` consume browser-visible keys and make direct provider requests. Vite intentionally exposes `VITE_` variables to client code, so these secrets must be treated as public once deployed. |
| ARCH-02 | Medium | The deployment workflow itself does not establish a release quality gate. | `.github/workflows/deploy.yml` installs and builds on `main` push but does not run lint, unit, smoke, audit, or migration checks in the deploy job. A separate smoke workflow exists, but branch protection and required checks were outside scope. |
| ARCH-03 | Low | Repository onboarding documentation is not aligned with the system that exists. | `README.md:1-16` remains the generic React + Vite template while real operational guidance is scattered across `CLAUDE.md`, `docs/`, agents, and workflows. This raises onboarding and incident-response friction. |

### b. Code Quality & Maintainability

Strengths:

1. Core betting math, bankroll, futures, and tool logic have a focused unit-test foothold.
2. Storage and architecture docs record several known anti-patterns and operational gotchas.

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| QUAL-01 | Medium | Linting is not an effective quality gate in the current repository shape. | `npm run lint` fails with 395 errors and 16 warnings. `eslint.config.js` applies browser globals to all `**/*.{js,jsx}`, so Node agents and scripts report `process`, `require`, and `__dirname` errors; the scan also includes `.claude` hooks and bundled skill assets. Frontend lint errors remain as well. New defects can hide inside an already-failing signal. |
| QUAL-02 | Medium | Automated coverage is materially below the risk surface. | Coverage is configured only for `src/lib/**/*.js` in `vitest.config.js`, and the run reported 8.11% statements and 8.69% lines overall. High-risk modules such as `supabase.js`, `vaultClient.js`, `storage.js`, `openai.js`, `anthropicClient.js`, `picksDatabase.js`, and many parsers reported 0% in the coverage run. |
| QUAL-03 | Medium | The storage abstraction is documented as mandatory but is bypassed in multiple runtime files. | `src/lib/storage.js:2-15`, `CLAUDE.md:75-78`, and `docs/ANTI_PATTERNS.md:31` require centralized helpers. Direct raw access remains in examples including `src/components/modals/AudioUploadModal.jsx:13-42`, `src/components/odds/LiveOddsDashboard.jsx:35-79`, `src/components/odds/BetValueComparison.jsx:190-197`, `src/lib/enhancedOddsApi.js:173-174`, and `src/lib/outcomesMerger.js:46-53`. This weakens key cataloging, error handling, migration discipline, and storage security review. |

### c. Data Integrity & Functional Accuracy

Strengths:

1. The app has explicit migrations for most cloud datasets and a documented localStorage backup/restore flow.
2. Picks and bankroll sync are deliberately non-blocking so local workflows remain responsive when Supabase is unavailable.

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| DATA-01 | High | Cloud sync lacks authenticated ownership and can be externally modified. | `src/lib/supabase.js:448-628` syncs picks and bankroll bets from the browser. `supabase/migrations/004_user_data.sql:43-47` and `82-86` allow anonymous `for all` access. Data integrity is not protected against row injection, overwrite, deletion, or cross-device corruption by an untrusted client. |
| DATA-02 | Medium | Hydration only adds missing records and does not reconcile conflicting versions. | `src/App.jsx:90-125` merges cloud records by missing ID into localStorage. Existing local records are not compared with newer cloud updates, no user ownership or revision token is present, and sync is fire-and-forget. Multi-device edits can diverge silently. |
| DATA-03 | Medium | The betting agent injury context queries a table that migrations intentionally hide from anon clients. | `src/lib/supabase.js:726-752` queries `player_injuries` from the browser Supabase client. `supabase/migrations/016_player_injuries.sql:50-52` enables RLS with no anon/authenticated policies. The query path should therefore degrade to empty results even when ingest data exists. The dashboard has a separate ESPN fetch path, so the defect is specifically in the Supabase-backed agent context path. |
| DATA-04 | Medium | Week and season logic is hardcoded around the 2026 season. | `src/lib/constants.js:4-33` derives phase/week from a fixed 2026 start date. `src/lib/supabase.js:763` and `803` default cloud odds/splits paths to season 2026. This will become stale after the 2026 season and can mislabel phase, week, and requested datasets without a seasonal configuration update. |

### d. Security Assessment

Strengths:

1. Reviewed Node agents obtain service-role credentials from process environment rather than committed constants.
2. The repository includes a secret-check script and reviewed scans did not reveal committed live provider keys.
3. Some public read-only datasets have explicit RLS policies instead of relying on unprotected SQL defaults.

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| SEC-01 | High | Public browser builds expose provider API keys and perform direct AI provider calls. | `VITE_` keys in `.github/workflows/deploy.yml:36-39` flow to `src/lib/apiConfig.js:7-11`. Browser-direct calls occur in `src/lib/anthropicClient.js:1-12`, `src/lib/openai.js`, and the transcript modal path. A copied key can create unauthorized spend and provider-side data exposure. |
| SEC-02 | High | Personal picks and bankroll bet tables are anonymously readable and writable. | `supabase/migrations/004_user_data.sql` defines bet fields including ticket number, legs, wager amount, odds, potential win, and profit, then grants anon `for all` access. This is not least privilege for a public client. |
| SEC-03 | High | Vault notes are publicly writable despite the policy name implying service-only writes. | `supabase/migrations/012_vault_notes.sql:71-81` creates `public_read_vault_notes` and `service_write_vault_notes`, but the `for all using (true) with check (true)` write policy has no `to service_role` restriction. `src/lib/vaultClient.js:145-156` writes vault notes through the browser Supabase client when the Supabase backend is active. This can alter stored notes and inject malicious context into AI workflows. |
| SEC-04 | Medium | Dependency advisories are present in the current Node graph and the Python graph is not auditable as pinned. | `npm audit --omit=dev` reports a production Moderate `ws` advisory. Full NPM audit reports High advisories on development paths including Vite. The Python audit cannot complete until requirements resolve. |
| SEC-05 | Medium | Personal data and user-provided API material are stored in browser localStorage. | `src/lib/storage.js:21-113` marks picks, bankroll, futures, and other data as critical browser storage. `src/components/modals/AudioUploadModal.jsx:13-42` persists `PR_OPENAI_KEY` in localStorage. localStorage has no at-rest protection against same-origin script compromise, shared-browser access, or local profile theft. |

Reference basis: official Vite documentation states that `VITE_`-prefixed variables are exposed to client source; official OpenAI key-safety guidance warns against exposing API keys in client-side environments; official Supabase RLS documentation states exposed tables require correct row-level policies and recommends explicit roles in policies. See the official references section below.

### e. Performance & Reliability

Strengths:

1. The build succeeds, several feature tabs are lazy-loaded, and public-data fetches commonly degrade gracefully.
2. Supabase utility code includes a timeout wrapper for some query paths and background data jobs avoid large browser ingest work.

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| PERF-01 | Medium | Browser smoke coverage is not fully green. | After Playwright Chromium was installed, `npm run test:smoke` passed 8 checks and failed the tab-navigation sweep because Playwright could not click the active `The Board` button outside the viewport. This may be a smoke-selector/layout issue, a horizontal navigation ergonomics issue, or both; either way the UI regression signal is red. |
| PERF-02 | Medium | Main bundle and chart/agent chunks deserve a performance budget. | The production build reported 460.89 kB for the main JavaScript asset, 388.58 kB for the Recharts vendor chunk, and 204.09 kB for AgentChat before gzip. This is not a load-test failure by itself, but it is large enough to warrant route-level budgets, device testing, and measured web-vitals baselines. |
| PERF-03 | Low | Reliability depends on several best-effort external data paths with limited end-to-end validation. | The app combines local JSON, GitHub raw data, browser ESPN/Open-Meteo requests, Supabase datasets, AI providers, Obsidian, RSS ingest, and scheduled agents. Unit tests are mostly local logic tests and smoke coverage is shallow, so source outage behavior and stale-data behavior are not comprehensively verified. |

### f. Compliance & Audit Trails

Findings:

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| COMP-01 | High | User and agent writes lack a production audit trail with actor attribution. | Picks and bankroll records are anonymous browser writes; vault notes can be publicly written; localStorage edits are inherently unaudited. Timestamps such as `created_at` and `updated_at` are present in tables, but there is no authenticated actor, immutable event log, approval trail, or tamper-evident history in the reviewed surfaces. |
| COMP-02 | Medium | Data classification, retention, incident response, and operational ownership are under-documented for a system storing betting and AI-context data. | Root README is template text. Reviewed docs explain development and agent flows, but the audit did not find a production privacy statement, retention policy, access review process, restoration runbook, provider key rotation procedure, or explicit audit-log retention design. |

The reviewed repository is therefore not audit-ready for a controlled production environment that expects traceable access to personal financial-style records or AI context stores.

## 4. Recommendations & Remediation Plan

| Priority | Area | Recommendation | Target outcome |
| --- | --- | --- | --- |
| High | Security / Architecture | Remove `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, and any paid odds key from public deployment. Route paid provider calls through a controlled serverless/backend proxy with authentication, quotas, allowlisted operations, logging, and secret storage. If a pure personal-browser mode is retained, require the user to enter their own key and label that mode as non-production. | No deploy-time paid secret is recoverable from browser assets. |
| High | Security / Data | Replace anonymous `for all` policies on `user_picks` and `user_bankroll_bets`. Add user identity and `user_id` ownership, migrate data, enforce `to authenticated` RLS policies, and restrict delete/update to row owners. | Betting records have confidentiality and integrity controls. |
| High | Security / AI data | Fix `vault_notes` RLS. Restrict public reads if notes contain sensitive strategy or session content; restrict writes to service role or authenticated owners with explicit `to` roles. Add validation and provenance fields for agent-written notes. | Vault content cannot be anonymously poisoned. |
| High | Compliance | Add audit events for cloud writes and AI-context mutations: actor, source, action, record type/id, before/after digest or patch, timestamp, correlation id, and retention policy. | Engineering can reconstruct material data changes. |
| Medium | Quality | Split ESLint configuration by runtime boundary; ignore generated/bundled skill paths as appropriate; make frontend, Node-agent, script, and config lint modes explicit; reduce lint debt until CI can fail on new lint regressions. | Lint becomes a usable release signal. |
| Medium | Testing | Add tests around Supabase RLS expectations, hydration conflict behavior, storage abstraction use, key handling, vault writes, season rollover, injuries, and AI tool confirmation paths. Set coverage thresholds only after risk-focused tests exist. | Tests protect trust boundaries and data integrity. |
| Medium | Functional Accuracy | Make NFL season/week derivation data-driven or configuration-driven; remove hardcoded 2026 defaults from odds/splits query helpers; test preseason, regular season, playoffs, offseason, and season rollover. | Seasonal data requests remain accurate beyond 2026. |
| Medium | Data | Align the injury access model: either provide a safe public read view/RLS policy with only required fields or move the injury-context query behind a backend that can use service-role access. | Betting agent injury context matches ingested data. |
| Medium | Dependencies | Patch NPM advisories, especially production `ws`; update dev-tool advisories on a schedule. Reconcile the Python requirements set so it resolves reproducibly and `pip-audit` can complete. | Dependency risk is measurable and updatable. |
| Medium | Reliability / UX | Fix the failing tab-navigation smoke path and verify horizontal nav behavior at desktop and mobile widths. Ensure deploy-required checks include build, unit, smoke, and the chosen lint subset. | Browser regression signal is green before release. |
| Low | Performance | Establish bundle and web-vitals budgets; inspect why large modal and chart code remains on the main path; keep lazy loading for infrequently used AI, analytics, odds, and chart-heavy features. | Performance changes become measurable. |
| Low | Documentation | Replace the root template README with architecture, setup, secrets model, deployment mode, data classification, test commands, and owner/runbook links. | Engineers can operate the repo without tribal knowledge. |

Suggested remediation sequence:

1. Stop public key exposure and close anonymous write paths first.
2. Decide the product mode: single-user local prototype, authenticated hosted product, or a split of both.
3. Implement identity, RLS, vault provenance, and audit logging before expanding AI write capabilities.
4. Restore dependable verification by fixing lint scope, smoke failures, dependency resolution, and tests for the trust boundaries.
5. Then optimize seasonal configuration, performance budgets, and documentation.

## 5. Conclusion

NFL Platinum Rose is a capable and actively evolving AI-enhanced productivity dashboard with useful modular work already in place. Its biggest gaps are not visual polish or missing features; they are boundary control, data ownership, auditability, and verification discipline.

Until public keys are removed from browser deployment, Supabase write policies are restricted, vault writes are protected, and quality/dependency signals are brought back to a dependable state, the project should not be treated as production-ready for public hosting or multi-user use. After those controls are in place, the current structure gives Engineering a workable base for a hardened production design.

## Official References

1. [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode/)
2. [OpenAI Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
3. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
