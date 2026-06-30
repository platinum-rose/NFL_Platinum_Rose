# NFL_Dashboard — Session Handoff

> 🏠 **Delegating work while at office?**
> See [.DELEGATION_BOARD.md](../../ATLAS/.DELEGATION_BOARD.md) in ATLAS to track delegations and [.project-delegation.md](.project-delegation.md) for what can be delegated.

> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-06-30
**Branch:** main (HEAD: `5586a56`)
**Tests:** 117 pytest green (L1-L5); 552 JS (unchanged)
**Status:** L4+L5+B3 complete. vault_note.py live, 59 episodes backfilled. Next: B4 vault note citations in agent manifests.

## Persistent Backlogs

> Task lists that survive context compaction. Check at every session start; update at close.
> Add a row when a task list is created for multi-session work. Remove only when all items are `[x]`.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|----------|
| NFL Security & Quality Audit (tri-audit) | `docs/NFL_AUDIT_BACKLOG.md` | **0 / 30 — COMPLETE** | S152 2026-05-23 |
| Obsidian Vault Bridge — Podcast Intel | `docs/LOCAL_PIPELINE_SPEC.md` | **0 / 4 — COMPLETE** | S239 2026-06-30 |

> The tri-audit is fully closed (30/30, all tiers). Receipt: `docs/AUDIT_RECEIPT_2026-05-23.md`.
> No CRITICAL items open — feature work is unblocked.

### Obsidian Vault Bridge — Podcast Intel (S235, open)

Goal: after `podcast-ingest.js` finishes extracting picks + intel for an episode, write a
structured vault note to `NFL/Podcasts/<ShowName>/<YYYY-MM-DD>-E<ep>.md` so that ATLAS agents
can reference specific episode analysis without querying Supabase directly.

Open items:
- [x] **B1** — Vault note schema designed: see `docs/LOCAL_PIPELINE_SPEC.md §8` — frontmatter, picks table, intel bullets, transcript index
- [x] **B2** — `vault_note.py` implemented (`build_vault_note` + `upsert_vault_note`, 32 tests) — S238 `5586a56`
- [x] **B3** — 59 episodes backfilled to `vault_notes` via `backfill_vault_notes.py` — S238 `5586a56`
- [x] **B4** — Wire vault notes into `BETTING` + `FUTURES` agent manifests so agents can cite episode-level sources — S239 `13fb03f`

Constraints:
- Sensitivity tier: `green` (podcast intel is public content)
- Use `vault_notes` Supabase table (already used by futures report) — avoids direct NTFS write
- Note path convention: `NFL/Podcasts/{show}/{YYYY-MM-DD}-E{ep}.md`
- Must include per-pick timestamps if `verbose_json` transcription was used

---

## ✅ Regression Fixed (2026-06-03 — committed)

> **2 tests in `tests/unit/oddsIdempotent.test.js`** (`writeSnapshots` upsert on
> `futures_odds_snapshots`) were failing. **Root cause:** commit `f1e6f19` reverted
> `writeSnapshots` in `agents/futures-odds-ingest.js` from the S152 upsert path
> (`9ca2011`) back to delete-then-insert, but left the tests asserting `.upsert(...)`.
> **Fix:** restored the upsert path with `onConflict: 'market_type,team,book,snapshot_time'`.
> The matching unique constraint (`uq_futures_odds_snapshot`) already exists in
> migration `022_odds_upsert_keys.sql`, so the upsert is valid once 022 is applied
> (still pending production push — see Immediate Next Actions). Full suite back to
> **552/552**. Committed 2026-06-03.

---

## Pick Up Here

> **S240 complete (2026-06-30).** Housekeeping + NTFS recovery session. Phase 7c / 7a / 7b / 7-serving / Phase 8 were all already committed in prior sessions (confirmed via `git log`). This session: (1) diagnosed 10 NTFS-truncated working-tree files (futures-intel-report-v2.js, experts.js, agentTools.js, research-intel-ingest.js, diarize.py, extract.py, prompts.py, vault_note.py, test_extract.py, backfill_vault_notes.py) — restored all from git HEAD objects; (2) added `.gitattributes` (`* text=auto eol=lf`) via git plumbing to prevent CRLF recurrence; (3) committed HANDOFF + memory.json updates. HEAD: `2de8230`. Tests: 64/64 green (m6-podcast-service). **Known index quirk:** `.gitattributes` is in HEAD tree and working tree but not in git index (plumbing bypass); `git diff HEAD` shows it as deleted — cosmetic only, file is committed and present. No open production actions. **Next session:** Phase 8 `/share/*` routes are committed — next feature work is `scripts/render-digests.js` CLI or NFL season prep. Confirm direction at session start.

> **S239 complete (2026-06-30).** All production items closed + B4 shipped. **B4:** `search_episode_vault_notes` added to `PODCAST_INTEL_TOOLS` in `agentTools.js` (auto-propagates into BETTING_TOOLS via spread); `listVaultNotes` import added. `betting.manifest.json`: tool entry added (14 tools). `futures.manifest.json`: `search_episode_vault_notes` + `read_vault_note` added — FUTURES was missing `read_vault_note` entirely; two-step workflow now complete. Commit: `13fb03f`. **Production audit:** migrations 018/019/021/022 confirmed applied (all return "already exists"); stats seed confirmed done (receipts 2026-05-21 + 2026-06-04). API-KEYS: `supabase secrets list` confirmed ANTHROPIC/OPENAI/ODDS keys set; `ai-proxy` was already deployed (v3, 2026-06-04); `odds-proxy` was NEVER deployed — deployed this session; phantom `clever-endpoint` duplicate deleted. **Backlogs:** Vault Bridge B1-B4 fully closed (4/4). Tri-audit 30/30 closed. Zero open production actions. **Next session first action:** Phase 7c — "Top Podcast Picks (24h)" section in `agents/nfl-daily-brief.js`. Spec: `docs/PODCAST_PHASE7C_BRIEF_SPEC.md`. Build kit: `docs/PODCAST_PHASE7C_BUILD_KIT.md`. Additive patch, ~1h, ships same session.

> **S238 complete (2026-06-30).** L4+L5+B3 complete. **L4:** `extract.py` gains `labeled_transcript: str | None = None` — when provided, speaker-labeled text is chunked instead of plain transcript. `prompts.py`: `speaker` field added to per-pick schema + SYSTEM_PROMPT attribution line; first few-shot example uses `[MM:SS] Speaker:` prefix. New test: `test_extract_run_uses_labeled_transcript_for_chunking`. **L5:** `nfl_podcast/vault_note.py` — `build_vault_note()` (path, frontmatter, picks table, intel bullets, transcript index) + `upsert_vault_note()`. Schema fixes vs spec: `source='agent'` (CHECK constraint), `episode_id` in tags not payload (no column). 32 unit tests. **B3:** `packages/m6-podcast-service/scripts/backfill_vault_notes.py` — 59 done episodes written to `vault_notes` (idempotent, `?on_conflict=path`). Stale `E{year}` orphan cleanup built-in. 1 harmless orphan remains: `NFL/Podcasts/Even Money/2026-02-24-E2025.md` (delete manually in Supabase if desired). **Lesson:** Supabase upsert needs BOTH `Prefer: resolution=merge-duplicates` header AND `?on_conflict=<col>` query param — header alone gives 409. Commit: `5586a56`. Tests: 117 green. **Next session first action:** B4 — add `vault_notes` query tool to `agentTools.js` and reference it in `betting.manifest.json` + `futures.manifest.json` so agents can cite episode-level vault note paths as sources (`docs/LOCAL_PIPELINE_SPEC.md §8 B4`).

> **S237 complete (2026-06-30).*