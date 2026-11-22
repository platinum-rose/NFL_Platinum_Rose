# NFL Dashboard handoff, 2026-10-21 ~13:00 PT: W6 closed, W7 collection underway, TNF draft held

Statistical context only. Repo: E:\dev\projects\NFL_Dashboard (device_bash path $HOME/mnt/dev/projects/NFL_Dashboard). Branch claude/w5-prop-cards-2026-10-11. **Origin = 6d62b76** (pushed 2026-10-21 00:28 PT). Working tree has uncommitted leftovers listed below.

## Standing guardrails (Andy)
No Gemini/AssemblyAI/OpenAI/TheOddsAPI spend; never touch data/official-picks/ or ledger files without explicit approval; never `git add -A` or full `git status`; commit/push only when Andy says so, path-limited. Andy's stated facts are authoritative; player teams come from the roster gate/live data, not memory.

## Slow Windows mount + git notes
Use `git add -- <paths>` then `git commit --only -F msgfile -- <paths>` inside one call with `timeout`. After commit/push, move any leftover `.git/*.lock` to `.git/stale-*` (deletion not permitted). nohup jobs die when the call ends; poll inside one call. Commit trailers: Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> and Claude-Session line.

## Week 6: closed
All four post-mortem gaps closed (see claude/w06-postmortem-gaps-closeout-2026-10-20.md). Done since the last handoff: MNF island recorded as D37 (paper), single-grader check on 32 legs (all consistent), 4 `LOSS` statuses normalized to `LOST`, Warren team label fixed, ticket 740512242 retagged to W7 (legs 1-2 WON). Commits pushed: 4fd33e0, ef9bd45, 84421dc, f89b92c, 6d62b76.
**Pending Andy approval:** hit-rate correction 72-66 (138) to 70-66 (136) after the retag; sides 16-4, totals 8-5; no money change. Update ledger summary line, postmortem data section 3 and narrative once approved.

## Week 7: what exists
- Slate: 14 games, byes BUF/JAX/LAC/WAS; draft slate still needs Andy's confirmation. TNF is NE @ CHI Thursday 10/22, 5:15 PM PT.
- Committed: secondary matchups (28, no Woods), prediction markets (4,608 contracts, 566 mapped, 339 actionable, 0 execution-eligible), DraftKings Predictions/Bookmaker SGP captures, BetOnline futures 10/20 (733 rows; all 256 Exacta pairs present, 204 repriced; Andy's open Exacta book 20 tickets $242.54). SB winner board 10/20: SF 600, BUF 750, KC 800, BAL 1100, LAR 1200.
- Uncommitted by design until Friday rebuild: alpha packet, player-props intel (0 props), article intel review (rebuilt by Wednesday cadence: 179 records, 11 explicit selections, 3 unresolved pick-oriented), w07-pull.json (gitignored).
- Wednesday cadence ran 10/21 (Andy): 5 new YouTube candidates (1 futures-eligible, Gemini not run), 0 research-intel inserts, 0 bookmarks ingested (all stale or already in vault).

## TNF plan (Andy: HOLD the draft until all expert, data and analytics reports are verified)
1. Thursday morning/early afternoon: recapture props (`npm run bolp`, `bkrp`, `dkp`). The Tuesday BetOnline props capture failed its gate (244 rows, needs >= 500 and all 14 games).
2. Verify expert, data and analytics reports; check final inactives for NE and CHI.
3. Rebuild weekly pull/alpha packet, then draft the TNF island card on the locked 3-tier template.

## Open items
- Bookmaker futures capture (10/13 board stale; needs Claude in Chrome or a paste).
- Patch `|| 50` fallbacks in src/lib/predictionMarkets.js, predictionMarketStore.js and the sample fallback (placeholder contracts read as 50%). Code change; only on request.
- W7 QB confirmations (Andy provides late week).
- Bookmaker SGP script does not exit on its own (needs Ctrl-C).
- `expert:registry` fails on a hard-coded file:///E:/ import; run in PowerShell.
- Roster map stale (~105h at last check); availability event count moved 1,244 to 947 to 948 unexplained; 224 W7 dossier validation errors (availability fields, roster_gate).
- Uncommitted leftovers from other sessions: 2026-w06 dossier regeneration, postmortem/, team-dvoa-snapshots, coaching-tendency-w2, .bak files, receiver-roles-2026.json, operator-status-overrides.json, roster-map-latest.json, espn-full-rosters archives. Review with Andy; do not bulk-commit.
- Parakeet transcription test runs in another session (see claude/parakeet-transcription-evaluation-2026-10-19.md).
