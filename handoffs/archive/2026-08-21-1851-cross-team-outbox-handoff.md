# Cross-Team Outbox Handoff - NFL_Dashboard / APS

Date: 2026-08-21 18:51 PT
Author: Codex
Audience: Claude, Antigravity, and any fresh Codex session

## What Was Sent Out

### NFL_Dashboard

The NFL Checkpoint 2 review handoff has been sent to the Claude team. Andy
reported that Claude has started on Checkpoint 3.

Important boundary:

- This session did not verify new Checkpoint 3 files. Treat "Claude has started
  Checkpoint 3" as human-reported current status. The next agent must recheck
  live Git state and any newest Claude artifacts before relying on it.
- During final verification, `git status` showed additional dirty/untracked
  files that were not in the earlier Checkpoint 2 handoff, including
  `package.json`, `src/components/agent/PersistentAgentSidebar.jsx`, and
  `scripts/check-bundle-budget.js`. These may be Claude Checkpoint 3 work, but
  this session did not inspect or validate them.

Current NFL artifacts to read:

- `handoffs/2026-08-21-1817-aps-to-nfl-checkpoint2-review-handoff.md`
- `HANDOFF.md`
- `HANDOFF_PROMPT.md`
- `WORKING-CONTEXT.md`
- `docs/audits/2026-08-21-codex-independent/CODEX_CHECKPOINT_1_FIX_PASS_2_REVIEW.md`
- `docs/audits/2026-08-21-codex-independent/CHECKPOINT_2_SUMMARY.md`
- `docs/audits/2026-08-21-codex-independent/UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md`

Known NFL status before Claude's Checkpoint 3 work:

- `main` and `origin/main` were both observed at `7840966`.
- Worktree was substantially dirty/untracked.
- Checkpoint 1 was Codex-approved.
- Checkpoint 2 was implemented by Claude and queued for independent Codex
  review.
- Yahoo Fantasy client-secret rotation remained unconfirmed.
- `_to_delete/` remained present and untouched.
- Production build verification for Checkpoint 2 remained incomplete because
  Claude's reported `npx vite build` transformed successfully but hit an `EPERM`
  unlink during final output write.

### APS / BSM

The APS / BSM crew workflow questionnaire has been emailed to the team. We are
now waiting for responses.

Live artifacts:

- Responder form:
  `https://docs.google.com/forms/d/e/1FAIpQLSeZXAqjlX6uI7hrTIJgqSQbtZ66M4cw9NJs5KNYWME8djld2w/viewform`
- Form editor:
  `https://docs.google.com/forms/d/1Nw8Rh8vU8aGuVHl5DsmFhyKS8ew3H5ntM43mJ2y0NjE/edit`
- Response Sheet:
  `https://docs.google.com/spreadsheets/d/10DclSL--UNTHG-fXAf-P-4PzPAI75HlSKAF2Zl6NRZ8/edit?resourcekey=&gid=471207480#gid=471207480`

Current APS posture:

- Pause custom APS coding unless Andy redirects.
- Wait for questionnaire responses before refining the BSM customization ask.
- If responses are slow or thin, do a short follow-up call with Ary/Ramses
  instead of assigning them more homework.
- Carry forward BSM questions about WhatsApp/text ingestion, materials-cart
  generation, granular Planner tasks, simple field mobile UX, and one-button
  walkthrough transcription.

Important transcript correction:

- If Zoom or AI summaries say "Sarah" in the accounting/QuickBooks lane,
  convert it to **Cera**. There is no Sarah at APS; Cera is Sean's wife and
  handles accounting tasks.

APS source files:

- `E:\dev\projects\Advanced_Property_Services\HANDOFF.md`
- `E:\dev\projects\Advanced_Property_Services\docs\APS_NFL_Cross_Team_Outbox_Handoff_2026-08-21.md`
- `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_to_NFL_Dashboard_Handoff_2026-08-21.md`
- `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_Crew_Workflow_Google_Form_Blueprint_2026-08-21.md`
- `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_Adoption_Roadmap_and_Handoff_Plan_2026-08-20.md`

## Antigravity Catch-Up Path

Antigravity has been on the sidelines for several days. It should not start from
only the latest rolling handoff. Recommended catch-up order:

1. APS current state:
   - `E:\dev\projects\Advanced_Property_Services\HANDOFF.md`
   - `E:\dev\projects\Advanced_Property_Services\docs\APS_NFL_Cross_Team_Outbox_Handoff_2026-08-21.md`
   - `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_to_NFL_Dashboard_Handoff_2026-08-21.md`
   - `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_Adoption_Roadmap_and_Handoff_Plan_2026-08-20.md`
   - `E:\dev\projects\Advanced_Property_Services\docs\APS_BSM_Crew_Workflow_Google_Form_Blueprint_2026-08-21.md`
2. NFL current gate:
   - `E:\dev\projects\NFL_Dashboard\HANDOFF.md`
   - `E:\dev\projects\NFL_Dashboard\HANDOFF_PROMPT.md`
   - `E:\dev\projects\NFL_Dashboard\handoffs\2026-08-21-1817-aps-to-nfl-checkpoint2-review-handoff.md`
   - `E:\dev\projects\NFL_Dashboard\handoffs\2026-08-21-1851-cross-team-outbox-handoff.md`
3. NFL audit sequence:
   - `E:\dev\projects\NFL_Dashboard\docs\audits\2026-08-21-codex-independent\UNIFIED_REPAIR_PLAN_FOR_CLAUDE.md`
   - `E:\dev\projects\NFL_Dashboard\docs\audits\2026-08-21-codex-independent\CODEX_CHECKPOINT_1_FIX_PASS_2_REVIEW.md`
   - `E:\dev\projects\NFL_Dashboard\docs\audits\2026-08-21-codex-independent\CHECKPOINT_2_SUMMARY.md`
4. Then inspect any newer Claude Checkpoint 3 files, current `git status`, and
   the latest modified/untracked files before planning.
   - At minimum, review the late-observed `package.json`,
     `src/components/agent/PersistentAgentSidebar.jsx`, and
     `scripts/check-bundle-budget.js` changes as possible Checkpoint 3 work.

## Preserve These Boundaries

NFL:

- Do not clean `_to_delete/` without explicit approval.
- Do not stage broadly, commit, push, or overwrite Claude's Checkpoint work.
- Keep Yahoo work paused until secret rotation is confirmed externally, tokens
  are refreshed, and dry-read checks are rerun.
- No Supabase writes, betting, official picks, portfolio/parlay mutation,
  recommendation persistence, paid model/API calls, fresh synthesis, or external
  service work without Andy's explicit approval.

APS:

- Do not delete/stage/overwrite `.aps/` Camp 4 materials.
- Do not delete/stage/overwrite August BSM docs, meeting agenda, questionnaire
  blueprint, audits, screenshots, emails, `.eml`, reference docs, or backend
  changes.
- W1-003 Twilio SMS is mostly implemented but needs validation.
- W1-004 remains open for true PostGIS geometry routing; current code is
  DB-backed zip-code routing.

## Resume Prompt

```text
Resume cross-team coordination from E:\dev\projects.

NFL status: the Checkpoint 2 review handoff was sent to Claude, and Andy reports
Claude has started Checkpoint 3. This session did not verify new Checkpoint 3
files, so recheck live Git status/log and newest Claude artifacts first. Read
E:\dev\projects\NFL_Dashboard\HANDOFF.md, HANDOFF_PROMPT.md,
handoffs\2026-08-21-1817-aps-to-nfl-checkpoint2-review-handoff.md,
handoffs\2026-08-21-1851-cross-team-outbox-handoff.md, and the 2026-08-21 audit
folder before planning.

APS / BSM status: the crew workflow questionnaire has been emailed and we are
waiting for responses. Read E:\dev\projects\Advanced_Property_Services\HANDOFF.md,
docs\APS_NFL_Cross_Team_Outbox_Handoff_2026-08-21.md, and
docs\APS_BSM_to_NFL_Dashboard_Handoff_2026-08-21.md before touching APS. Do not
resume custom APS coding unless Andy redirects.

Antigravity catch-up: read the APS current handoffs first, then the NFL rolling
handoffs, then the 2026-08-21 NFL audit sequence, then any newer Claude
Checkpoint 3 artifacts. Treat live Git/current files as authority over stale
rolling prose.

Guardrails: preserve dirty/untracked work in both repos. No cleanup, broad
staging, commit, push, Supabase writes, betting/picks/portfolio changes, Yahoo
work, paid API/model calls, fresh synthesis, or external service work without
Andy explicitly approving it.
```
