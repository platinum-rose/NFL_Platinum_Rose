# START HERE — Token burn investigation (next session)

Written Sun 11/22 1:20 AM PT by Claude after the Week 11 Saturday session. Andy: "In the next session, I need to find out how we are bleeding so many tokens so quickly in this project."
State: everything from the W11 Saturday session is committed and pushed (`0cbcdb1d` on `claude/w5-prop-cards-2026-10-11`). Sunday W11 finalization steps are in `handoffs/2026-11-21-2315-w11-sat-gtmh-props-fixes-START-HERE.md` and are separate from this task.

## Goal
Find where tokens go in this project's sessions (claude.ai project "dev" + the device_bash bridge into `E:\dev\projects\NFL_Dashboard`, plus Claude Code CLI sessions in the repo), size each source, and propose concrete cuts Andy can approve. Measure first; don't change anything until Andy approves.

## Facts measured tonight (Sun 11/22 ~1:15 AM)
- Repo instruction files likely auto-loaded into every Claude Code turn: `CLAUDE.md` 27.9 KB (371 lines), `AGENTS.md` 14.4 KB, `.claude/rules/*` 19.9 KB (6 files). That's ~62 KB (~15-16k tokens) before any work, re-sent on every turn of a CLI session.
- `.claude/settings.json` hooks: SessionStart (`session-start.js`), Stop (check-console-log, check-secrets, session-end, build-handoff), PreToolUse Bash (`commit-quality.js`), Write/Edit (`protect-hot-files.js`), and PostToolUse. Check whether any of them print into the model context on every turn or every tool call.
- `handoffs/`: 247 files, 3.0 MB. Recent START-HERE files are 12-13 KB each, and every session reads 2 of them first.
- claude.ai project "dev": 62 project docs (mostly handoffs). Per-turn context in these chats also carries the project memory listing, the large `areas/nfl-dashboard.md` memory file (22 KB, read when NFL work starts), the full tool list (hundreds of deferred tool names), the skills list and the MCP server instructions.
- Tonight's session ran ~150 tool calls: three full `build.py` runs (~100 s each), many site rebuilds, Chrome screenshots, several large dumps (the W10 card section, the full GTMH prop list, a 22 KB memory file, `git status` on a 2,513-path dirty tree). Every later call re-sends all of it, so long sessions grow roughly quadratically.

## Hypotheses to test, in order of likely size
1. **Session length × context size.** One session doing intel + build + QA + card building + git. Every tool call re-sends the whole conversation. Test: compare token use per tool call early vs late in a long session; check whether the context is being compacted or just growing.
2. **Fixed per-turn overhead.** CLAUDE.md + AGENTS.md + rules (~62 KB) in CLI sessions; in claude.ai project chats, the system prompt + tool schemas + memory snapshot + 62-doc project listing. Test: run the `explain-usage` skill at the start of a fresh session and again after ~20 calls.
3. **Prompt-cache misses.** Anything that changes the prefix busts the cache for every later turn: project doc writes (the Projects tool warns that changing a doc busts the cache for every chat in the project), memory writes (the snapshot is replaced when the store changes), and hook output that varies per turn. Check how often project docs and memory are rewritten per session (handoffs are written to project docs several times a day).
4. **Verbose tool output.** Build logs (GAP lines, roster-vet tables), full file reads, uncapped grep/find. Test: grep tonight's transcript-equivalent for the largest tool results; add `| tail`, `--quiet` flags or summary-only modes to the noisiest scripts (build.py GAP block, roster vet, w11-site-diag).
5. **Re-reading the same material each session.** Two 12-13 KB handoffs, HANDOFF.md, memory files, specs; the same lessons re-derived. Consider one short "current state" file (< 3 KB) and archiving old handoffs out of the project docs.
6. **Parallel teams and agents.** Codex, Antigravity, Claude sessions and any background/scheduled runs (GitHub Actions podcast/twitter ingest that call Claude/Gemini APIs). Separate the Claude token bill from the API-key spend (Gemini was depleted again tonight; OpenAI credits earlier).
7. **Screenshots and large HTML.** Chrome screenshots and 5 MB single-file HTML (never read whole) — confirm none are being pulled into context.

## Suggested first steps
1. Ask Andy where he sees the burn (claude.ai plan limits? Claude Code /cost? API console?) and over what window. The fix differs by surface.
2. In a fresh session, run `explain-usage` early; record the fixed overhead. Then do a fixed small task (e.g. one site rebuild + link check) and run it again.
3. Size `CLAUDE.md`, `AGENTS.md` and `.claude/rules` by section; propose a trimmed core (< 8 KB) with the rest linked, not loaded.
4. Run each hook script by hand and see what it prints; check `hooks/scripts/session-start.js` output size.
5. Count project docs and memory writes per day; propose moving handoffs out of project docs (keep the latest 1-2 there).
6. Draft a "lean session" rule set for Andy to approve: one goal per session, handoff at ~60-80 calls, quiet commands, no full-file dumps, scripts that print summaries.

## Constraints
No paid services, no Supabase writes, no wagers or ledger edits. Don't change CLAUDE.md, hooks, project docs or memory until Andy approves the proposal.
