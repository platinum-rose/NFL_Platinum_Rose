# NFL_Dashboard Handoff - Fresh NFL Dev + Writers Room Voice Seed

Generated: 2026-09-04T11:23:32-07:00
Workspace: `E:\dev\projects\NFL_Dashboard`

## Pick Up Here

Start by reconciling live state, not this prose alone:

```powershell
git status --short --branch
git log -n 8 --oneline --decorate
git branch -vv
```

Current live Git from this handoff:

- Branch: `main`
- HEAD: `65d47e3 fix(futures): repair data-correctness, prompt-assembly, and fail-loud gaps in the portfolio pipeline`
- Remote: `origin/main` at `2c9334a feat(futures): add scale-in entry pattern to Risk/Editor stage`
- Alignment: local `main` is ahead of `origin/main` by 1 commit.
- Worktree: heavily dirty; preserve it.

Do not assume older notes saying `main` is aligned at `2c9334a` are still true. That was true earlier in the broader orientation, but live Git now has one local commit on top.

## What Changed In This Codex Session

1. Reconciled prior final-roster state:
   - Antigravity had already ingested Honey Badgers and Rose Bowl final roster snapshots.
   - Existing snapshots:
     - `data/fantasy/honey_badgers_final_rosters_2026.csv`
     - `data/fantasy/rose_bowl_final_rosters_2026.csv`
   - Both were previously verified as 204 rows, 12 teams, 17 players/team.
   - Do not regenerate those unless Andy explicitly asks.
   - `nfl_dashboard_final_roster_compilation.md` was not found by exact repo/memory search.

2. Scanned ATLAS task state for Writers Room/NFL pending work:
   - `E:\dev\ATLAS\.atlas\domain\projects\tasks.json` contains the pending NFL Writers Room task.
   - That file is ignored by `.gitignore` via `.atlas/domain/`, by design, because it is raw local domain state.
   - Gap identified: the ignored task registry needs a tracked sanitized projection or export if ATLAS should surface this reliably in future workflows.

3. Ingested the NFL comedy voice sample:
   - Source email: `E:\dev\projects\Writers_Room\docs\Fw_ this just in.eml`
   - Source status: untracked in `Writers_Room`
   - Output folder: `docs/writers-room/nfl-comedy-voice/`
   - Created:
     - `docs/writers-room/nfl-comedy-voice/ingest-nfl-comedy-sample.mjs`
     - `docs/writers-room/nfl-comedy-voice/nfl_comedy_voice_sample_2008_fat_lazy_americans.json`
     - `docs/writers-room/nfl-comedy-voice/nfl_comedy_voice_corpus_2026-09-04.jsonl`
     - `docs/writers-room/nfl-comedy-voice/nfl_comedy_voice_profile_seed_2026-09-04.md`
   - Extracted only the old forwarded parody article, not email headers/contact metadata.
   - Generated article body hash: `98a04c2f447f368b9ab7407794e8481e0600f477fa288716af7c53eb7142836f`
   - Cleaned article word count: 557.

4. Updated local ignored ATLAS task breadcrumb:
   - `E:\dev\ATLAS\.atlas\domain\projects\tasks.json`
   - JSON validated after edit.
   - This remains ignored; do not treat it as committed/shared state.

## Writers Room Voice Notes

Keep the NFL comedy-report voice separate from Abracadickface.

The ingested sample is a fake wire-service/fantasy-football parody voice:

- straight-faced AP/NBC-style sports reporting
- exaggerated coach and league-office quotes
- fantasy-football franchise mythology
- rivalry callbacks and fake institutional history
- adult, abrasive, trash-talk-friendly edge
- absurd escalation under a serious news-desk surface

This is source prep only. NFL_Dashboard still lacks Writers Room adoption in `.atlas-bridge\manifest.json`; do not assume narrative tooling can run here until adoption/config work is explicitly approved.

## Dirty / Untracked State To Preserve

The worktree is broad and concurrent. Grouped from live `git status --short --branch`:

- Rolling handoff/session docs modified by this and prior coordination:
  - `HANDOFF.md`
  - `HANDOFF_PROMPT.md`
  - `WORKING-CONTEXT.md`
  - `handoffs/2026-09-03-final-roster-reconciliation-handoff.md`
  - this handoff

- Portfolio/futures/data pipeline work:
  - local ahead commit `65d47e3`
  - modified `agents/portfolio-preflight.js`, `agents/research-intel-ingest.js`, `agents/signal-normalize.js`, `package.json`, `scripts/overnight.js`, related generated bankroll/card seed files
  - untracked odds/import/audit material including `agents/vegas-web-odds-ingest.js`, `data/futures-imports/betonline-2026-09-03.json`, `docs/FUTURES_ODDS_BETONLINE_2026-09-03_MANUAL_REVIEW.md`

- Official-pick/proposal state:
  - deleted active proposal files:
    - `data/official-picks/proposals/active/candidate-prop-stack-twitter-bm-kc-rice.json`
    - `data/official-picks/proposals/active/candidate-supercontest-week1-bills.json`
  - untracked rejected copies and inbox candidates also exist.
  - Do not mutate, restore, move, stage, or clean these without explicit approval.

- Fantasy/final-roster/draft artifacts:
  - Honey Badgers and Rose Bowl final roster CSVs are untracked.
  - Many fantasy dossier/ranking/report files are modified or untracked.
  - Antigravity reportedly handled Rose Bowl and Honey Badgers final roster/draft ingestion already.

- Writers Room seed from this session:
  - `docs/writers-room/nfl-comedy-voice/`

- Twitter/harvester/dev-service work:
  - modified `infra/systemd/nfl-twitter-bookmarks.service`
  - untracked Windows launch/stop scripts and Twitter config/cron files.

- Scratch/probe/test residue:
  - many `_tmp`, `audit*_tmp`, `scratch/*`, and `scripts/_tmp_*` files exist.
  - Do not clean them without an explicit cleanup scope and approval.

## Suggested Next Action

For the fresh NFL dev session, begin with live reconciliation and then choose one explicit work lane. Highest-signal first lane:

1. Inspect the local-ahead commit `65d47e3`.
2. Inspect scoped diffs for portfolio/futures files before editing, especially `agents/portfolio-preflight.js`, `agents/research-intel-ingest.js`, `agents/signal-normalize.js`, and any generated bankroll/card seed files.
3. Decide whether the next dev task is:
   - verify/stabilize the portfolio-pipeline fixes now represented by `65d47e3`, or
   - continue the article-evidence / Bookmaker-BetUS capture integrity lane from Claude's 2026-09-03 handoff, or
   - implement Writers Room adoption for NFL_Dashboard as a separate approved lane.

Do not start by compiling Honey Badgers/Rose Bowl rosters; those have already been ingested unless live files contradict that.

## Guardrails

- Do not clean, reset, stash, revert, delete, broad-stage, commit, or push without explicit approval.
- Do not run `agents/portfolio-synthesize.js` against paid models/API without explicit approval.
- Do not perform Supabase writes without explicit per-write approval.
- Do not mutate betting picks, official picks, portfolios, parlays, or open proposal slots without explicit approval.
- No Yahoo Fantasy work unless explicitly directed.
- Treat all handoff prose as useful but subordinate to live Git/files.
- Preserve unrelated dirty work; inspect scoped diffs before touching shared files.

## Validation Run This Session

```powershell
node docs/writers-room/nfl-comedy-voice/ingest-nfl-comedy-sample.mjs
node -e "JSON.parse(require('fs').readFileSync('E:/dev/projects/NFL_Dashboard/docs/writers-room/nfl-comedy-voice/nfl_comedy_voice_sample_2008_fat_lazy_americans.json','utf8')); for (const line of require('fs').readFileSync('E:/dev/projects/NFL_Dashboard/docs/writers-room/nfl-comedy-voice/nfl_comedy_voice_corpus_2026-09-04.jsonl','utf8').trim().split(/\n/)) JSON.parse(line); console.log('json ok');"
node -e "JSON.parse(require('fs').readFileSync('E:/dev/ATLAS/.atlas/domain/projects/tasks.json','utf8')); console.log('tasks json ok')"
git check-ignore -v "E:\dev\ATLAS\.atlas\domain\projects\tasks.json"
```

Results:

- Comedy ingest succeeded.
- Generated JSON/JSONL parsed successfully.
- ATLAS task registry parsed successfully after breadcrumb edit.
- `tasks.json` confirmed ignored by `.gitignore:92:.atlas/domain/`.

No commit or push was performed.
