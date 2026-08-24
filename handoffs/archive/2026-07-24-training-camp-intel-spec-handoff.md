# 2026-07-24 Handoff - Training Camp Intel Spec

## Standing Guardrails

- Do not make live model/API calls without explicit approval.
- Do not write to Supabase without explicit approval.
- Do not persist production betting recommendations.
- Do not modify open parlay slots.
- Do not generate official real AI proposals until the full futures synthesis is approved.
- Exacta plays remain on hold until BetOnline secondary markets appear for price shopping.
- Use `npm.cmd` on Windows PowerShell.
- Repo is dirty with many unrelated changes. Do not revert user/unrelated work.

## User Decisions Captured

- Training camp intel should use free/manual sources for now.
- Preferred sources: RotoWire, team sites, ESPN beat writers, PFF, The Athletic when manually pasted, local beat reporters, and official media.
- No paid feed integration yet.
- No specific beat reporter list yet.
- Build all 32 teams from day one.
- Manually pasted notes/articles must be first-class inputs alongside RSS/API data.
- The system is decision support; the user wants to make final betting decisions.
- Platinum Rose AI can be tracked as an expert with fake official paper picks, but human approval locks/rejects those picks.

## New Spec

Read:

- `docs/TRAINING_CAMP_INTEL_SPEC_2026.md`

Task board:

- `TASK_BOARD.md` now has `F-30 | Training camp intel snapshots | P1`.

## Current Project State Relevant To This Work

- `agents/research-intel-ingest.js` already has free RSS feeds and offseason terms such as training camp, OTA, minicamp, depth chart, preseason, head coach, offensive coordinator, and defensive coordinator.
- Existing feeds include Action Network, BettingPros, ESPN NFL, VSiN, Sharp Football, Pro Football Talk, PFF, RotoWire NFL, and Football Outsiders.
- `config/sharp-accounts.json` says X/sharp-account ingestion is dormant until RSSHub is self-hosted on M6; do not reactivate it casually.
- `data/vault-seed/README.md` already supports manual Markdown drops and DVOA/nflverse source files, but training camp intel should get its own local snapshot layer first.
- `agents/portfolio-dossier.js` already has `team_profiles` with `analytics`, `dvoa`, `coaching_profile`, `schedule_context`, `clv_signal`, `roster_churn`, and `injuries`.
- `agents/portfolio-synthesize.js` already tells the model that team profiles are compact team-level context and must remain source-aware.

## Recommended First Build

Implement Phase 1 from the spec:

1. Add `config/training-camp-sources.json`.
2. Add local manual drop folders under `data/training-camp/2026/`.
3. Add a local-only script that reads manual Markdown/text/JSON notes and produces:
   - `data/training-camp/2026/training-camp-intel-YYYY-MM-DD.json`
   - `data/training-camp/2026/latest.json`
   - `.nfl/training-camp/training-camp-intel-YYYY-MM-DD.md`
   - `.nfl/training-camp/training-camp-intel-YYYY-MM-DD.html`
4. Guarantee all 32 teams appear in snapshot/report output, even with zero items.
5. Add a fixture/test command for manual-note ingestion and 32-team coverage.

Do not start Phase 2 live RSS fetching until explicitly approved.

## Suggested Interfaces To Build

These do not necessarily exist yet:

```powershell
npm.cmd run training-camp:build -- --season 2026 --from-manual --no-persist
npm.cmd run training-camp:report -- --season 2026
npm.cmd run test:training-camp-intel
```

## Acceptance Criteria For First Implementation

- All 32 teams appear in every local snapshot/report.
- Manual notes are parsed as first-class source records.
- Source, URL, published time, captured time, source type, raw excerpt, summary, and betting relevance are preserved when available.
- Signals are deterministically classified into injury, depth chart, role usage, coach quote, beat consensus, roster move, preseason usage, scheme, market move, or other.
- Bills/Packers anchor relevance is visible, but all teams are covered.
- Output is local-only and explicitly labeled as intel, not picks.
- No Supabase write, no live model/API call, no official pick generation.

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, WORKING-CONTEXT.md, docs\TRAINING_CAMP_INTEL_SPEC_2026.md, and handoffs\2026-07-24-training-camp-intel-spec-handoff.md first. Current task: implement F-30 Training camp intel snapshots, starting with local-only Phase 1. User decisions: free/manual sources for now; preferred sources are RotoWire, team sites, ESPN beat writers, PFF, The Athletic/manual, local beat reporters, and official media; no paid feed yet; build all 32 teams from day one; manual pasted notes/articles are first-class inputs. Guardrails: do not make live model/API calls, write to Supabase, persist production recommendations, generate official real AI proposals, or modify open parlay slots without explicit approval. Recommended next: build the local schema/manual importer/snapshot writer/report generator and a fixture test proving 32-team coverage, with outputs under data\training-camp\2026\ and .nfl\training-camp\.
```
