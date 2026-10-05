# NFL_Dashboard - Current Handoff

> Start here, then reconcile live Git state. This file is intentionally a short
> current-state index, not a rolling archive. Historical detail belongs in
> `handoffs/` and `handoffs/archive/`.

**Last governance trim:** 2026-09-22 by Antigravity & Codex
**Last verified HEAD:** `6887ca8` = origin/main (2026-10-05 13:00 PT, Claude H2C2 handoff). Previously: 10/03 14:15 Claude commit (full-text article pass + context lanes) on top of `94a5193`; run `git log -3 --oneline` to confirm.
**Last verified branch:** `main` — **the only working branch.** `wip/yahoo-sync` is retired (archived as tag `archive/wip-yahoo-sync-2026-09-23`; remote branch deleted after a clean automation week). Commit to `main`.
**Workspace state:** very dirty/shared; run `git status -sb` before trusting any
handoff prose. A full copy of the pre-trim rolling handoff was archived at
`handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`.

## Current Pick Up Here

**▶ PICK UP HERE (2026-10-05 13:00 PT, cross-team H2C2 handoff to Claude Team 2):** `handoffs/2026-10-05-1300-claude-h2c2-team2-briefing-week4-fri-mon.md`. It supersedes every "LATEST" pointer below. It covers Fri 10/02 → Mon 10/05 (Week 4 card, tickets, settlement −$208.42 on $353.51, SuperContest 4–1, Live/phone tracker, Master Intel v2 dark site, Week 5 BKR openers, futures/promos, the MNF ATL@NO prop planner) and has a resume prompt in §9. Support files, including copies of gitignored inputs, a ticket ledger, a file manifest and a 26-handoff digest, are in `reports/handoff-snapshots/2026-10-05-h2c2-week4-fri-mon/`. Newer session handoffs not listed below: `handoffs/2026-10-05-1235-claude-week4-closeout-futures-w5-lines-mnf-planner-handoff.md`, `handoffs/2026-10-04-1054-claude-week4-card-tracker-handoff.md`.

Older active handoff sources (superseded by the briefing above, kept for history):
- `handoffs/2026-10-04-0300-claude-pickem-w04-podcast-screen-rules-handoff.md` (**LATEST.** W4 pick'em plans (TNF PIT locked x3); podcast props screen + normalizer; betting rules pruned per Andy (see §5/§7.2 of the synthesis prompt); Slot 3 must be rebuilt to the morning template; "no unders in parlays" was never a rule. Next: Sunday card in a fresh session.)
- `handoffs/2026-10-03-2045-claude-synthesis-w04-card-built-intel-filled-handoff.md` (**LATEST.** Week 4 digest + card built (14 tickets, $175, nothing placed), TICKETS/SUPERCONTEST blocks + per-game ticket notes in the narratives, survivor pick intel, Master Intel rebuilt and filled; review artifact v3. SC five proposed + 5 alternates; Bills credits x2 pending Andy. Next: SUN mode — inactives, re-price, island ladders, ledger.)
- `handoffs/2026-10-03-1415-claude-week4-fulltext-ingestion-handoff.md` (**LATEST.** Local full-text archive of the week's articles (604), Abrams primer feed (systems/trends), 118 hand-extracted article picks verified, trends/news lanes in build.py, all 15 narratives updated; NE@BUF lean flipped to NE +7. Open: ingestion caps/scheduling tickets, coaching file, card.)
- `handoffs/2026-10-03-1300-claude-week4-expert-verification-best-bets-handoff.md` ( New `scripts/master-intel/verify_expert_rows.py` checks every expert/podcast/article pick against the actual matchup (257 verified / 83 rejected for W4); build.py now counts consensus from verified picks only and adds an "Every expert's picks this week" block; every narrative has a "What the experts are saying" section. Open: expert season records, coaching-staff file, coaching trends for Week 5, the card.)
- `handoffs/2026-10-03-1225-claude-week4-narratives-written-card-next-handoff.md` (**PREVIOUS. Week 4 narratives written for all 15 games; roster gate PASS.** Andy chose: write leans now, add card tickets once the card exists; build on BKR date **2026-10-03** (new `scripts/master-intel/bkr_live_from_rendered.py` made `bookmaker-live-2026-10-03-week4.json` from the 10:46 board + 10/03 rendered pages). build.py expert-link fix (no more split names). Leans table for the card builder; caveats: IND Keenan Allen out (availability file stale), MIN QB market missing at BKR, CHI Bagent vs Keenum. **Next: the card (Andy's go-ahead), then ticket names + TICKETS/SUPERCONTEST blocks.** Contains the resume prompt.)
- `handoffs/2026-10-03-1200-claude-week4-evidence-ready-narratives-next-handoff.md` (PREVIOUS. Week 4 evidence complete; the narratives start in a fresh session (Andy authorized).** Covers current BKR lines (10:46 PT board), the 14-game BKR prop-page index, refreshed ESPN injury designations and weather, and expert/podcast positions re-priced. QB changes: WAS Mariota, CHI Bagent, TB Jalon Daniels, NYG Winston. **New for the season: Action Network opening lines are the line-movement baseline** (`scripts/master-intel/actionnetwork_openers.py --week <N>`, runbook step 8a; `build.py` labels the source). Still open: card/digest/survivor file, the choice of BKR `--date` for the build, game-day inactives and weather. Contains the resume prompt.)
- `handoffs/2026-10-02-2145-claude-week4-multipage-intel-site-team2-codex-handoff.md` (**LATEST. Handoff to Claude Team 2 + Codex.** Full recap 10/1 20:05 → 10/2 21:45. Template v2 LOCKED. Week 4 report is now a **multi-page client site** (`scripts/master-intel/build_site.py`, auto-run by build.py; needs `pip install beautifulsoup4` on Windows) hosted privately at https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6 — republish to the same URL after every rebuild. Intel still open: Antigravity YouTube run in progress, 13 audio episodes pending, pick extraction + master re-pull on Windows, 0 Week 4 splits (Codex: fix betting-splits-ingest), survivor popularity file. **Working tree reconciled 22:15 (§1.4): per-ticket futures ledger committed (Andy's call); 9/29 boards + 9/30 handoff restored; every referenced gitignored file is snapshotted in `reports/handoff-snapshots/2026-10-02-week4/` (packet + site, inputs, W4 boards, wagers ledger). Still open: 8 old handoffs flip the team-power-ratings rule, so confirm with Andy.** No synthesis/card/narratives until Andy says intel is complete. Contains separate resume prompts for Claude Team 2 and Codex.)
- `handoffs/2026-10-02-2050-claude-week4-intel-gather-youtube-queue-futures-handoff.md` (PREVIOUS. Week 4 intel audit; 11 `podcast_episodes.youtube_url` links + standalone YouTube queue in `data/podcasts/youtube-manual-urls-2026-w04.json`; Antigravity fixed Gemini billing + Windows tasks (see their 10-02 1915/2000 findings) and is running YouTube extraction; futures boards BKR/BetUS/BEO 10/2 parsed + `reports/futures/futures-line-movement-2026-10-02.md`; Jay's Lock Box $100 promo logged (excluded from bankroll). **Next: rerun the master pull + pick extraction on Windows, then the Week 4 Master Intel report formatting session.** Contains the resume prompt.)
- `handoffs/2026-10-02-1640-claude-week4-tnf-graded-v2-template-dk-rungs-handoff.md` (PREVIOUS. TNF graded into the local wagers ledger (Graham leg `injury_exit`). Live Tracker keeps an injured leg Out when it is burnt and flags injury bad beats. Master Intel template v2 (picks first) built and **awaiting Andy's approval**. SuperContest W4 lines saved; the dashboard shows the current week only. BKR/BEO/DK Week 4 boards parsed, including DK highlighted yardage rungs for 289 players. W4 narratives held until Saturday. Podcasts blocked on Gemini/OpenAI credits. Contains the resume prompt.)
- `handoffs/2026-10-01-2005-claude-week4-merge-tickets-analytical-parser-handoff.md` (PREVIOUS. main @ 3524656 pushed. M6 Week 4 branch + Codex 5622e15 merged into the main checkout (stale index fixed; backups `backup/main-*-2026-10-01`). Week 4 intel refreshed; 5 official Week 4 tickets logged ($51.37; 4 ride TNF PIT@CLE) — grade TNF next. Analytical feeds (PFT/Sharp/PFF/Rotowire/Walter) now yield picks via `agents/lib/analytical-picks.js`; Walter deprioritized (paywall); 21 Week 4 signals backfilled (200 total). Live Tracker grades kicking points. Contains the resume prompt.)
- `handoffs/2026-09-30-0110-claude-team2-w1-3-deep-analysis-continue-handoff.md` (**LATEST (analysis lane).** Claude Team 2 → fresh Claude session: continue the Weeks 1–3 deep analysis. Codex C1/C4 have landed (0 mismatches vs the ledger). Next: make C1 the canonical leg table, turn the post-game findings (35+ pass attempts, team TDs, losing team) into pre-game rules using the W1–3 ESPN spreads/totals, grade the recovered pre-rebuild ledger (P-D1…P-D15), fix the provenance split, board-price unpriced props. Master RR #739361263 payout still unconfirmed ($0 recorded). Contains the resume prompt.)
- `handoffs/2026-09-30-0050-claude-futures-exactas-placed-week4-intel-resume-handoff.md` (**LATEST (futures lane).** Andy placed seven BetOnline Packers exacta tickets 9/30 (ledger `data/futures-imports/andy-portfolio-ledger-2026.json` updated, $278.51 staked; **exactas are mutually exclusive, never sum `to_win` across them**). Fresh 9/29 BetOnline/BetUS/DraftKings/Kalshi boards in `docs/futures-odds-20260929/`; BetOnline exacta board = product of its conference prices (~17% overround). Open: DraftKings credit payout confirmation, Circa exacta board. **M6 main checkout is behind origin/main and blocked by 18 local files (see §5 of that handoff).** Next: Week 4 intel per the 9/29 Codex handoff.)
- `handoffs/2026-09-28-2050-claude-team2-mnf-graded-w3-closed-weekly-analysis-handoff.md` (**LATEST.** Claude Team 2: MNF graded (CHI 27, PHI 7; every MNF ticket lost) and **Week 3 closed** in the wagers file — W3 −$459.20 on $498.41; **season −$1,046.96 on $1,297.97**. Master RR #739361263 recorded at $0 (derived; **Andy to confirm**). Ledger updated + the lost pre-rebuild D1–D12 history recovered from the DEV project (`…-pre-rebuild.md`). All three post-mortems updated. W1–3 analysis re-run with MNF (Basket Review republished). **New repeatable end-of-week analysis** in `reports/analysis/season/claude/` + "Platinum Rose Season Review" artifact + runbook in `docs/NFL_WEEKLY_CARD_PROCESS.md`. ESPN API blocked from both machines tonight. Still local only — no Supabase/Bankroll sync. Contains the resume prompt for the Week 4 build.)
- `handoffs/2026-09-28-1910-claude-team3-mnf-placed-w1-3-settled-weekly-analysis-handoff.md` (PREVIOUS. Claude Team 3: MNF inactives + part-2 intel sweep; Andy placed 5 BetOnline MNF prop parlays ($31.86) + Novig credit #2 (5-leg 24.01x) — all logged and in the Live Tracker. **Weeks 1 and 2 fully settled** in the wagers file (match post-mortems to the cent); Week 3 settled except the 8 MNF-dependent tickets. **NEXT (Claude Team 2, partner team):** grade MNF + close Week 3, update the Week 3 post-mortem, build the repeatable end-of-week analysis. DEV-project docs fully mirrored in docs/claude-project-dev/ (ledger D12–D13 = MNF). Local only — no Supabase/Bankroll sync yet. Contains the resume prompt.)
- `handoffs/2026-09-28-1515-claude-team2-w1-3-deep-analysis-mnf-intel-handoff.md` (PREVIOUS. Claude Team 2 finished the W1–3 deep analysis: `reports/analysis/w1-3-deep/claude/` (SUMMARY, Week 4 build checklist, basket review report and artifact). Fixed 14 wagers-file grading errors (no payouts changed). Added @thepropdealer to tracked experts. MNF prop stacks drafted (`reports/bets/week3-mnf-phi-chi-prop-stacks-2026-09-28.md`), plus a read-only article and podcast sweep (`…-intel-update-2026-09-28.md`, adds Keenum INT). **NEXT:** finish the extraction protocols (pick promotion stale since 9/25, truncated Sharp Football MNF transcript, anything after 15:00, inactives) before 5:15 PT kickoff (§4), then grade master RR #739361263 + Novig credits and settle Week 3. Novig #2 is unplaced and expires Tue 9/29 5 PM ET. Contains the resume prompt.)
- `handoffs/2026-09-28-1300-claude-team2-pivot-weekend-briefing-deep-analysis-handoff.md` (PREVIOUS — **TEAM PIVOT.** Claude Team 1 stands down; Claude Team 2 + Codex take over. Full weekend briefing (9/24–9/28), index of every generated doc (DEV-project docs now mirrored in `docs/claude-project-dev/`; all working files in `reports/bets/season-recap/work/`), W1–3 findings, and separate resume prompts for Claude Team 2 and Codex deep-analysis runs (outputs in `reports/analysis/w1-3-deep/`). MNF PHI @ CHI still to grade; Novig credits expire Tue 9/29 5 PM ET.)
- `handoffs/2026-09-28-1200-claude-week1-3-post-mortems-burn-report-expert-scorecard-handoff.md` (PREVIOUS: Weeks 1–3 post-mortems, Week 4 playbook, Week 3 burn report + Twitter expert prop scorecard in `reports/bets/season-recap/` and `reports/bets/week3-recap/`. Prop RRs permanently out. MNF PHI @ CHI still ungraded; Novig credits expire Tue 9/29 5 PM ET. Contains the resume prompt.)
- `handoffs/2026-09-27-2130-claude-week3-sunday-graded-mnf-prep-handoff.md` (PREVIOUS: Week 3 Sunday fully graded — only the dog-ML RR won; master RR alive on PHI −3; SNF ladder + moonshots lost (DEN 30–26). SuperContest Week 3 card locked + tracker fix `fbed7cc`. Next: MNF PHI @ CHI — Twitter intel, Novig trade credit #2 (pending 4-pick SGP, credits expire Tue 9/29 5 PM ET), BKR MNF ladder; then grade + settle Week 3. Contains the resume prompt.)
- `handoffs/2026-09-27-1010-claude-week3-sunday-props-placed-tracker-supercontest-handoff.md` (PREVIOUS: all Week 3 official tickets (BEO props + BKR game tickets incl. SuperContest five #739360142) loaded into the wagers file + Live Tracker; no prop RRs; SuperContest split stake from Week 4; 739211245 still has 2 open spots. Contains the resume prompt.)
- `handoffs/2026-09-27-0315-claude-week3-sunday-props-card-handoff.md` (PREVIOUS — Sunday prop card v2 (stack templates 7a/7b/7d/7e/8a/8b; no prop RRs per Andy) at `reports/bets/2026-w03-sunday-props-2026-09-27.md` on Saturday-captured prices (confirm on slip); strict roster vet PASS; SNF ladder held; nothing placed.)
- `handoffs/2026-09-27-0245-codex-week3-game-parlays-placed-props-handoff.md` (LATEST — game-parlay closeout recorded: official Platinum Rose four-leg paper recommendation was disregarded; placed tickets #739361263, #739361262, and #739361521 are review-only and pending grading. Resume with player-prop stacks only.)
- `handoffs/2026-09-27-0125-codex-week3-full-template-synthesis-handoff.md` (LATEST — all established weekend parlay/prop templates evaluated in conditional `SUNDAY v5`; roster gate PASS after live availability refresh. Saturday BKR/BEO prices are explicitly re-price pending; fresh manual boards + inactives are next. No bets changed.)
- `handoffs/2026-09-27-0100-claude-week3-roster-gate-intel-fix-codex-sunday-handoff.md` (LATEST — Week 3 intel sheet roster-corrected (A.J. Brown/Evans/White/Hopkins/Aguilar; matchup seeds rebuilt on 2026 ESPN rosters; dedupe fix). **New mandatory ROSTER GATE** (`scripts/nfl-rosters/roster_vet.py`, in preflight + build.py). Sunday card build handed to **Codex** — the full Codex prompt is at the bottom of that file. Step 6 ticket re-check not done yet.)
- `handoffs/2026-09-27-0012-claude-week3-sunday-cards-reprice-intel-errors-handoff.md` (PREVIOUS — ⛔ STOP (now fixed, see LATEST): Andy found **major errors in the Week 3 intel sheet**; fix before any more bets. Placed Dog-ML RR BKR #739358766 ($25, TEN/NYJ/IND/LV/CLE). Sunday cards re-priced on 22:59 BKR / 23:06 BEO lines (card v4), unplaced. Uncommitted session files listed inside. Contains the resume prompt.)
- `handoffs/2026-09-26-2215-claude-master-intel-template-supercontest-handoff.md` (PREVIOUS: Master Intel Report template v1 LOCKED — builder + format spec + runbook + Antigravity/Claude skill, 5-format export; SuperContest companion report shipped; Week 3 card morning/afternoon parlays rebuilt to template; Kalshi gate (option a) shipped. NEXT: design the weekly SuperContest cadence with the new report; save Week 3's joint five to `data/supercontest/locked-card-week-3.json`. Contains the resume prompt.)
- `handoffs/2026-09-26-1202-claude-week3-metabet-execvenues-git-merge-handoff.md` (PREVIOUS: metabet-futures-ingest wired into Toolbox Diagnostics; DraftKings/FanDuel moved to placeable in src/lib/executionVenues.js (Kalshi deliberately NOT moved — needs Andy's decision on the never-built bid/ask/fee-aware prediction-market execution check, PRIMARY next-session task); backfilled+pushed 2 unprocessed BKR/BetUS text futures batches; resolved+merged the fc1b7b2 sibling-commit git fork with origin/main and pushed. Fanatics ingestion deferred to next week per Andy. Contains context for the next session.)
- `handoffs/2026-09-26-1057-claude-week3-saturday-intel-health-handoff.md` (PREVIOUS: 739211245 still has 2 open spots — PHI ML/BAL ML recommended, unconfirmed; confirmed no other Week 3 weekend tickets placed; rebuilt the recommendation ledger from scratch — it lives in claude.ai Project "DEV" at `claude/recommendation-ledger-2026.md`, not a repo file; Friday cadence ran clean, found a stale-game bug in player-props-intel.)
- `handoffs/2026-09-24-2110-claude-week3-tnf-graded-tracker-fixes-handoff.md` (PREVIOUS: TNF graded ATL 35-14, −$96.48, only 739211245 alive; Live Tracker fixes `c717932`/`fc1b7b2` — first-TD, QB INTs, completions, Unders; ledger D13–D15 IRRELEVANT; next = Friday items. Contains the resume prompt.)
- `handoffs/2026-09-24-1805-claude-week3-tnf-night-favorites-parlay-late-adds-handoff.md` (PREVIOUS: favorites longshot 9-leg placed at BKR +9098; three late BKR tickets (8-team open, 1st-TD SGP, GB −4/BUF −6.5 open); wagers JSON 68 entries; Live Tracker regenerated; ledger D14/D15; next = grade TNF. Contains the resume prompt.)
- `handoffs/2026-09-24-1435-claude-week3-tnf-props-odds-single-source-pickem-handoff.md` (PREVIOUS: TheOddsAPI single-source + quota guard (`040318f`); pick'em/confidence tools (`db7acec`); TNF island ladder placed (3 tickets); favorites longshot parlay pending Codex's fresh BEO/BKR lines before TNF kickoff. Contains the resume prompt.)
- `handoffs/2026-09-24-1100-claude-week3-reprice-branch-consolidation-handoff.md` (LATEST: re-enable the 12 scheduled tasks first; Week 3 card re-priced on BKR 9/23 18:39 after PM Refresh, QBs resolved, STOP B sent — awaiting Andy's go; THU mode next (TNF ATL@GB); main is the only branch; CI-GREEN + props-intel WIP open. Contains the resume prompt.)
- `handoffs/2026-09-23-1630-claude-branch-consolidation-inventory.md` + `handoffs/2026-09-23-1831-codex-consolidation-merge-report.md` (BRANCH-CONSOLIDATE-MAIN: wip merged into main `e8d1279`, pushed 2026-09-23; checkout switched to main via `E:\dev\projects\switch-to-main.ps1`. Open: CI-GREEN, B-props-intel-rewrite-wip, governance docs pass)
- `handoffs/2026-09-23-1420-claude-week3-intel-health-pick-extraction-prelim-card-handoff.md` (LATEST: intel fixes (AN revisions, CFB filter, cleanup), 64 Week 3 expert picks via fixed extractor on main, toolbox PM Refresh, Circa sheet fair prices, preliminary game-parlay card `reports/bets/2026-w03-card.md`; next = PM Refresh after practice reports, Bills credit, TNF)
- `handoffs/2026-09-23-0055-claude-week3-futures-circa-plan-pick-extraction-handoff.md` ( preflight 2/21 stale, pick-extraction week-scope/teaser/dedupe fixes, futures audit, Circa run plan for Wed 9/23 — reconvene when proxy sends live Circa odds)
- `handoffs/2026-09-22-2300-claude-preflight-fix-bkr-manual-capture-week3-resume.md` (preflight regex fix, manual BKR futures capture, Week 3 synthesis still at STOP A)
- `handoffs/2026-09-22-1130-antigravity-scheduled-tasks-and-grok-scanner-handoff.md` (Antigravity automation & scheduled tasks closeout)
- `handoffs/2026-09-22-1110-codex-governance-weekly-synthesis-review-handoff.md` (Codex governance review)

Current state:

1. Governance/context cleanup is closed for now. `CLAUDE.md`, `AGENTS.md`, PM routing,
   `HANDOFF.md`, `HANDOFF_PROMPT.md`, and `WORKING-CONTEXT.md` now align around the
   short root handoff + dated handoff model.
2. Week 2 closed and reconciled. Every Week 2 ticket now has a ticket number in the local
   wagers JSON; the $10 IND@KC 6-leg SGP was corrected to BetOnline. The Supabase sync of
   those changes is **pending Andy's OK**.
3. Weekly card/prop/futures sessions now start from
   `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` (AGENTS.md #16). The old
   `WEEKLY_BETTING_ANALYST_PROMPT.md` is reference-only. Run
   `node scripts/weekly-synthesis-preflight.mjs` first.
4. Next: Week 3 intel gathering in TUE-WED mode. 10 of 21 local inputs were stale at
   01:00 PT Tue. Podcasts were blocked on the AssemblyAI balance for the 5 diarized
   (multi-host) shows — fixed 2026-09-22, see item 7.
7. Diarized-show podcast transcription now defaults to Gemini (native diarization),
   falling back to AssemblyAI only if Gemini fails or its key is unset. Before this,
   diarized shows were AssemblyAI-only with no fallback at all, which is why every
   Week 3 episode for those 5 shows was erroring. Verified end-to-end on a real
   episode (71 diarized turns, 14 picks extracted). Single-host shows are unaffected
   (still free Groq). See
   `handoffs/2026-09-22-1900-claude-gemini-podcast-diarization-fix-handoff.md`.
8. Podcast queue cleaned (27 stale Week 1/2 episodes marked `skipped_stale`,
   non-destructive). One real Gemini failure on the largest file yet (88.6MB)
   traced to a swallowed `fetch failed` on the generateContent call -- fixed
   with a retry + err.cause logging (commit `53af810`). Separately, ran the
   long-dormant YouTube/Gemini intel pipeline (`agents/podcast-gemini-intel.js`)
   end-to-end for the first time ever -- host-attributed picks/notes (something
   the main audio pipeline can't do), promoted to the Obsidian vault
   successfully. Still a one-episode proof of concept, not automated. See
   `handoffs/2026-09-22-2130-claude-gemini-podcast-hardening-and-youtube-intel-promotion.md`.
9. Week 3 TUE-WED synthesis session (`agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`)
   resumed and advanced its STOP A freshness pass: fixed a preflight regex bug that
   was misreporting fresh BEO/BKR futures-board captures as stale (only matched the
   old bare-date filename convention), refreshed prediction-markets and
   secondary-matchups for Week 3, and manually captured BKR's (BookMaker) Super Bowl
   LXI + AFC/NFC futures from the live "Odds to Win" page after Claude in Chrome
   would not connect (Andy read the board and pasted the odds directly). Preflight
   now shows 5 stale of 21 (down from 6): roster map, BKR current lines (separate
   from the futures board), alpha packet, a long-stale legacy podcast-recs file, and
   Week 3 prop boards (0 files found). Phase 2 (evidence digest) not yet started --
   still sitting at STOP A. See
   `handoffs/2026-09-22-2300-claude-preflight-fix-bkr-manual-capture-week3-resume.md`.
5. Active rules: leg barrier `-350` (flag >2 legs shorter than -200); QB rushing/INT props
   need a stated matchup fit; a player missing from the final box score = lost leg; BKR props
   same-game only.
6. Automation: Grok Thread Scanner & Windows Scheduled Tasks suite (13 tasks) are active
   in hidden mode. Week 3 rollover active; grok thread prompt generated in
   `data/research-intel/grok-thread-prompt-latest.md`.

## Needs Andy / Stop Conditions

- **BRANCH-CONSOLIDATE-MAIN (P1):** main and wip/yahoo-sync have diverged both ways; GitHub automation runs main. Fresh-session task to merge, make main current and retire wip: `handoffs/2026-09-23-1455-claude-task-branch-consolidation-main.md` (Codex may assist).

- Confirm whether a reusable `bookmaker-live-parser.mjs` CLI should be built or
  reviewed next; see
  `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`.
- Approve (or not) the Supabase sync: 19 Week 2 ticket numbers + 1 book fix.
- Top up AssemblyAI when convenient — no longer blocking (diarized shows default to
  Gemini now), but AssemblyAI is still the fallback if Gemini ever fails.
- Bills-win free-bet credit lands Wed 9/23 by 7pm ET. Choose the play.
- Retry eslint on `scripts/generate-live-tracker.mjs` when the device bridge is
  reliable.
- Paper AI Master RR remains pending in `paper-wagers-2026.json`.
- Any Supabase write, paid synthesis, betting/account mutation, official-pick
  promotion, or real wager settlement requires explicit current scope.
- If live Git status contradicts this file, live Git wins and the mismatch
  should be reported before edits.

## Active Guardrails

- Preserve the dirty checkout. Do not clean, reset, stash, broad-stage, or
  delete unrelated files.
- Do not use `git add -A`; stage narrow, reviewed file sets only.
- The old blanket "no commit/push without Andy approval" guardrail was recorded
  as repealed on 2026-09-15, but commits still need normal scoped judgment,
  clean evidence, and no unrelated dirty work.
- Supabase writes still need explicit per-change authorization.
- Paid model/committee synthesis still needs explicit authorization.
- Betting/account/official-pick/portfolio state must not be mutated unless the
  user explicitly authorizes that exact lane.
- Roster surprises must be verified against live/current data before calling
  them contamination.

## Detailed Handoffs

- Gemini podcast hardening + first YouTube-intel promotion (latest):
  `handoffs/2026-09-22-2130-claude-gemini-podcast-hardening-and-youtube-intel-promotion.md`
- Gemini podcast diarization fix:
  `handoffs/2026-09-22-1900-claude-gemini-podcast-diarization-fix-handoff.md`
- Antigravity scheduled tasks + Grok scanner closeout:
  `handoffs/2026-09-22-1130-antigravity-scheduled-tasks-and-grok-scanner-handoff.md`
- Codex governance + weekly synthesis review closeout:
  `handoffs/2026-09-22-1110-codex-governance-weekly-synthesis-review-handoff.md`
- Week 3 Tuesday setup + synthesis prompt (latest):
  `handoffs/2026-09-22-0120-claude-week3-tuesday-setup-synthesis-prompt-handoff.md`
- Latest Week 2 close-out:
  `handoffs/2026-09-21-2310-claude-week2-closeout-handoff.md`
- Full current orientation:
  `handoffs/2026-09-22-0240-claude-to-claude-full-project-handoff.md`
- Bookmaker parser request:
  `handoffs/2026-09-21-1810-claude-codex-request-bookmaker-live-parser-cli.md`
- BetOnline ATD collision review:
  `handoffs/2026-09-21-2011-claude-codex-review-prompt-betonline-atd-collision.md`
- Week 2 Sunday props tooling:
  `handoffs/2026-09-20-1440-claude-week2-sunday-props-tooling-handoff.md`
- Friday pipeline / podcast overhaul:
  `handoffs/2026-09-19-1040-claude-friday-pipeline-podcast-overhaul-handoff.md`
- Lessons-learned token handoff:
  `handoffs/2026-09-18-0110-claude-lessons-learned-token-handoff.md`
- TNF close / price watch handoff:
  `handoffs/2026-09-17-2130-claude-tnf-close-price-watch-handoff.md`
- Legacy rolling handoff before this trim:
  `handoffs/archive/2026-09-22-legacy-rolling-HANDOFF-before-governance-trim.md`

## Historical Notes

Older Week 1 / query-dialect / fantasy / Alpha / Antigravity content is no
longer active root context. Load it only when the task asks for that lane or a
linked dated handoff points to it.

## Maintenance Rule

Keep this file short. Add only current pickup, current guardrails, open
decisions, and links to dated handoffs. Archive completed or superseded detail in
`handoffs/` instead of appending another full session transcript here.
