# Handoff to Codex: Platinum Rose Week 7, Sat 2026-10-24 ~2:45 PM PT
## Re-check the first-pass intel and card against Saturday's markets and news, then build the final card

**From:** Claude team (Cowork session, Fri 10/23 1 PM → Sat 10/24 2:45 PM PT). **To:** Codex team. **Owner:** Andy.
Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. **Last pushed commit: `ca1b7f4`** (Fri night). Everything listed under "Files" below that is newer than Fri 6:40 PM is **uncommitted** working-tree state: read it from disk, don't expect it on origin.

---

## 1. Your task
1. Read the first-pass outputs (section 3) and the Saturday changes (section 4).
2. For each of the 13 remaining games, re-check every first-pass recommendation (side, total, ML, SuperContest, props) against the **current** prices and news. Mark each: KEEP / RE-PRICE / UPGRADE / DOWNGRADE / DROP, with the reason (line moved past "playable-to", injury, book pulled the market).
3. Build the final card in `reports/bets/2026-w07-card.md` from `reports/bets/2026-w07-card-skeleton-fri.md` (read its "Saturday 1:30 PM updates" section first) plus the 13 props reports. **STOP and present it to Andy before anything is placed.** Andy decides the open questions in section 6.
4. Refresh `reports/intel/master-intel-narratives-2026-w07.md` ("Why the card leans this way" with the real tickets, `## TICKETS`, `## SUPERCONTEST`) and `reports/intel/expert-narratives-2026-w07.md` "Moved:" lines to the current numbers.
5. Rebuild Master Intel + SuperContest (section 7), export, and hand Andy a summary of 15 lines or fewer.

## 2. Guardrails (Andy's standing rules)
- Proposals only: no bet placement, no sportsbook clicks, no Supabase writes, no paid model/API calls (Gemini, OpenAI, AssemblyAI, TheOddsAPI). No edits to `data/official-picks/*`, wagers, bankroll or futures files.
- Never state a player's team/role/status from memory. Use `data/nfl-rosters/espn-full-rosters-latest.json` and the roster gate; if a player is missing from ESPN rosters, do a quick web search (if you can't search, flag it).
- A failed gate is **noted, never a stop** (Andy's rule for synthesis runs). The exception is the roster gate inside `build.py`, which must PASS before the report is built (reword narrative false positives: e.g. "Every Bucs", coach names like "Steve Spagnuolo" trip it).
- Card rules: `docs/NFL_WEEKLY_CARD_PROCESS.md` + `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` §5-7. Key ones: leg barrier -350 (flag stacks with >2 legs shorter than -200); no -120..-100 connector legs without a named-expert/matchup source; ML ≤ -290 flagged, max one per ticket; one leg per game per ticket; **no exact duplicate legs across live tickets** (section 5); SNF cap = KC@SEA favorite ML, last-resolving leg, no Monday legs on capped tickets; BKR props same-game only, multi-game prop stacks on BetOnline with ≤2 legs per game; no prop round robins; always carry 7e Anytime-TD 7-leg and 8a First-TD candidates; highest-margin reads also go out as singles.
- Andy's one-opinion rule: the same pick from the same person/show caught by two pipelines counts once (no consensus boost).
- Commit only named files, never `git add -A`; exclude `scratch/`, `*.bak*`, `.nfl/gmail-summaries`, files > 3 MB. Commit trailer per the repo's convention. Andy asks before pushes.

## 3. First-pass outputs (read these)
| What | Path |
|---|---|
| Per-game syntheses, **sides/totals** (Opus, Fri 6:30 PM packets) | `reports/intel/games/2026-w07-game-<AWAY>_at_<HOME>-sides.md` + `data/research-intel/proposed/games-w07/*-sides.json` |
| Per-game syntheses, **props** (Opus, Sat 2:40 PM packets) | `reports/intel/games/2026-w07-game-<AWAY>_at_<HOME>-props.md` + `data/research-intel/proposed/games-w07/*-props.json` |
| Run log | `reports/intel/games/2026-w07-game-RUNLOG.md` |
| Lean digest (build input) | `scratch/w07-synthesis-digest.md` |
| Game narratives (13 + TICKETS + SUPERCONTEST) | `reports/intel/master-intel-narratives-2026-w07.md` |
| Expert narratives (27 experts; rendered in report section 4) | `reports/intel/expert-narratives-2026-w07.md` |
| Card skeleton (sides/totals, STOP B) | `reports/bets/2026-w07-card-skeleton-fri.md` |
| Pool picks (BUK BUK + confidence pools, re-ranked Sat) | `reports/bets/2026-w07-pool-picks-fri.md` |
| QB / injury notes | `scratch/w07-qb-confirmations-1023.md` (Sat 1:30 PM update at the bottom) |
| Survivor intel | `data/survivor/pick-intel-2026-w07.json` |
| Built reports (Fri 9:20 PM state) | `dist/nfl_week7_master_packet/` (`Platinum_Rose_NFL_Week7_Intel.html`, `nfl_week7_master_betting_intelligence_summary.*`, `nfl_week7_supercontest_intelligence_summary.*`) |
| HTML review copies of everything | `dist/nfl_week7_master_packet/review-html/index.html` (regenerate: `python3 scratch/md2html_review.py`) |
| Synthesis prompt / queue builder | `agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md`, `scripts/intel/build-game-synthesis-queue.py --week 7 --pass sides|props --date YYYY-MM-DD --qb-notes <file>` |

## 4. What changed Saturday (verify, then apply)
**News**
- **Lamar Jackson RULED OUT** (downgraded Sat; Baltimore Banner 4:01 PM ET). Tyler Huntley starts (3rd straight). Per the CIN@BAL props agent (Sat): BKR now **CIN -2 -125, ML CIN -160, total 47.5** → spread PASS (fair -2.5), **ML PASS** (fair ~-135; drop the CIN ML single and the CIN Hybrid leg from the skeleton), **Under 47.5 = B**, **SuperContest CIN +2.5 = A-**. No player props posted at BKR/BEO for CIN@BAL: Sunday-morning recapture needed.
- **Eagles OUT:** DeVonta Smith, Dontayvion Wicks, Nolan Smith, Michael Carter; Barkley QUESTIONABLE (expected to play); Goedert status unconfirmed (missed Thu/Fri). McKee starts. DAL@PHI props agent: BKR **DAL -4** → PHI spread PASS at +4 (C at +4.5 at most), **Under 44 upgraded to B** (fair 41.5).
- **Nacua:** questionable, decision Sunday (McVay). BKR pulled all Rams passing/TD props.
- **Mayfield:** questionable, expected to start. BKR pulled Mayfield and TB receiver props (book hedge). TB@CAR Over is conditional on 8:30 AM PT inactives.
- **Giants:** Theo Johnson and Jevon Holland downgraded to OUT (Sat).
- **Broncos:** RB Jonah Coleman activated from IR (may cut Dobbins/Harvey snaps).
- **49ers/Falcons:** Christian Kirk activated (questionable tag removed); A.J. Terrell activated from IR, likely plays.
- **Paris wind (PIT@NO):** re-pulled Sat: 25-28 km/h, gusts 53-57 km/h; Stade de France is open-air. Paris inactives ~5:00 AM PT.

**Markets (sources: `data/odds/BOL_game_lines_1024_0515.md`, BKR Sat ~1:25 PM board inside `data/generated/props/bookmaker-live-2026-10-24-*.json`, agents' notes)**
- CIN@BAL: BAL -1 (Fri) → CIN -2 -125 (Sat BKR).
- CLE@TEN: BKR still CLE -2.5; **BetOnline CLE -1** (sharp TEN money). Books disagree.
- KC@SEA: BKR **KC +3 -115**, total 42 → sides synthesis upgrades **KC +3 to tier B**. Contest line stays KC +2.5.
- NYG@HOU: BKR **NYG +10 -103** → meets the sides synthesis upgrade to B ("+10 -110 or better"). Re-check.
- GB@DET: BetOnline **GB +3.5 -107** (contest number bettable straight); BKR DET -3.5 -112.
- DEN@ARI: BKR DEN -4.5 -108, total 43 (ARI +4.5 back).
- MIA@NYJ: BKR NYJ -4 -108 / total 39 (BetOnline 39.5).
- SF@ATL: BKR SF -2 / 49 (BetOnline 50).
- TB@CAR: BKR CAR -3 +102 / total 44.5.
- LAR@LV: BKR total 48.
- IND@MIN: BKR MIN ML -266.
- The "Final pre-Sunday CLV check" in Andy's Saturday cadence used a Supabase odds snapshot from **Fri noon** (19.6 h old): don't rely on `data/supercontest/live-market-comparison.json` for current prices.

**Pipelines**
- BetOnline parser fix: `scripts/props/betonline-prop-dump-parse.mjs` line 34 now accepts BetOnline's typo "Iterceptions" (it had made the zero-bad-row gate fail). `bolp` then passed: **1014 rows, 13/13 games**, but full player props only for **PIT@NO, GB@DET, KC@SEA**. Backup: `scratch/betonline-prop-dump-parse.mjs.bak-20261024`.
- BKR capture Sat ~2:30 PM: props for 12 games; **CIN@BAL 64 rows (no props)**; no TD-scorer board for MIA@NYJ and DAL@PHI.
- Queue builder now falls back to the newest gamelines / DKP files when the capture date has none.

## 5. Open tickets (no exact duplicate legs)
- **740512242** (BKR Flex SGP, $15 → $353.39): 4 of 6 won; live legs **KC +3.5**, **MIN ML**.
- **740506458** (BKR 3-team teaser, $30 → $45): SF -1 won; live **MIN -0.5**, **KC +8**.
- **740636102** (BKR 10-team, $5) and **740636092** (BKR 9-team, $20.74): MIN -6, GB/DET o51.5, DEN/SF/CAR/DAL/HOU/NYJ ML, KC/SEA o40.5, (+ PIT/NO u46.5 on 102).
- No Bills free bet this week (BUF bye; Andy saves it for BUF's next game).

## 6. Decisions Andy owes (ask; don't assume)
1. Cut the **CLE** ML leg from the Afternoon parlay and swap **CLE** out of the SuperContest five? (contest CLE -1.5 now has no value at BetOnline; BKR still -2.5)
2. Swap **PHI** out of the SuperContest five and the dog RR (alternates ATL +3.5 / NO +3.5), and add **KC +3** (B) as a single or into the dog RR?
3. Final **SuperContest five** (Andy + Amanda). Proposed Fri: CIN +2.5, GB +3.5, CLE -1.5, PHI +4.5, LV +4. CIN is now A-.
4. The value Andy gave **CHI on Thursday** in each confidence pool (the pool sheet assumes the lowest slot).

## 7. Build + export (how this machine works)
- **`build.py` must run with Windows Python 3.14** (`python` in PowerShell from the repo root); the Linux VM's Python 3.10 can't compile it (f-string backslashes). `$env:PYTHONIOENCODING='utf-8'; python scripts/master-intel/build.py --week 7 --date 2026-10-24`. python-docx is installed on Windows.
- `build.py` reads card tickets with this heading format (one per ticket): `### <ticket name> — <BOOK> — **$<stake>** — <structure/price> — <what it pays>` followed by its leg table. See `reports/bets/2026-w06-card.md` for examples.
- Roster gate runs inside the build; if it blocks, fix the wording and rebuild.
- **PDF:** Windows has no Playwright. Claude exported PDFs in its cloud container with `scripts/master-intel/export_pdf.py`. If Codex has no Chromium, leave the PDF to Andy/Claude and say so.
- `build.py` was changed this session: W7 flat YouTube-pick schema normalizer, an expert-narratives section (section 4, one collapsible per `###` block), and `EXPERT_SHOW` additions. Backups: `scratch/build.py.bak-20261023-ytschema`, `scratch/build.py.bak-20261023-xnarr`.
- Archive the final html/pdf/docx/md/json + SuperContest report to Drive `Platinum Rose / Master Intel / 2026 / Week 07` (Andy or a session with Drive access).

## 8. Per-game props headlines (from the Sat props agents; reports have full tables)
- **PIT@NO:** Rodgers o21.5 completions -125 BEO (B), Rodgers o1.5 pass TD +100 BEO (B) → BEO 2-leg; Freiermuth ATD +218 BKR (B). Dowdle Q; BKR pulled Warren/Dowdle rush and Washington receiving markets.
- **TB@CAR:** Young o1.5 pass TD -129, Young o233.5 yds -174, McMillan o4.5 rec -181, McMillan ATD +130 (all B, BKR). No TB passing props (Mayfield hedge).
- **MIA@NYJ:** Willis u0.5 pass TD +148 (B). First TD bettable at BKR: Wilson +719, Allen +469 (if Hall out). Hall Q.
- **CLE@TEN:** Watson o19.5 rush yds -253 (B); Boston ATD +199 (B-). TEN called up a WR and RB from the practice squad (Ridley/Spears hedge).
- **NYG@HOU:** Stroud 2+ TD -188, McCarthy 1+ TD -234, Marks 55+ rush -213 (B); Marks ATD -147 anchor. First-TD only on DKP (reference).
- **SF@ATL:** Purdy o1.5 TD -129, Kittle ATD -105 (was +130 at expert post), CMC o5.5 rec -112 (B).
- **IND@MIN:** D. Jones u0.5 pass TD +167 (B); Hockenson ATD +219; First TD Jefferson +614 / Taylor +425. Mason inactive → Aaron Jones o9.5 carries.
- **CIN@BAL:** no book props; DKP reference only (Henry ATD -186, Chase +117). Recapture Sunday 7:30-9:30 AM PT.
- **DEN@ARI:** Brissett o22.5 completions -117 (B); McBride ATD +140 BEO (B); McBride o6.5 rec (B but breaks the expected-winner rule: Andy's call).
- **GB@DET:** Love o1.5 TD -177, St. Brown o6.5 rec -202, Watson o67.5 -213 (B); Gibbs ATD -325 BEO; Kraft ATD +170. Redman ATD value gone (+1850 → +722).
- **LAR@LV:** Cousins o1.5 TD +101 (B), Bowers 61+ -200 (B); Nacua-in / Nacua-out add-on sets; Sharp's Corum rec-yds best bet is now 12.5 (pass) → Corum 2+ rec.
- **KC@SEA (SNF island):** JSN o92.5 yds -109, Mahomes o1.5 TD +150 BEO, Darnold o0.5 INT -115 BEO single (B). **SNF ladder:** T1 BKR ~+676, T2 BEO ~+2954, T3 BKR ~+10,200; 7c DK 4/6/8-pick combos. KC +3 now B.
- **DAL@PHI (MNF island, prelim):** J. Williams u63.5 rush, Lamb o6.5 rec, Dak o23.5 completions (B); Under 44 now B. Prelim ladder T1 ~+780 / T2 ~+2520 / T3 ~+13,100; reprice Monday.
- No book posted tackles+assists for any game (Andy's best category). If they post Sunday, the agents named candidates in each report.

## 9. Known gaps / not done
- Twitter video picks: Antigravity prompt `agents/dev/ANTIGRAVITY_TWITTER_VIDEO_QUEUE_AUTOMATION.md` issued; nothing returned yet (61 pending in `data/research-intel/twitter-video-queue.json`).
- Sharp or Square voiceprints: clip + draft ready for Andy to label at `scratch/parakeet-w07-tue/clips/sharp-or-square__2026-10-22__0ea628f0__010800-011800.reference-draft-v2.txt` (not blocking).
- YouTube speaker credits were checked against voiceprint audio for Even Money and BettingPros: all correct. Antigravity's addendum (`data/podcasts/youtube-extracted-picks-2026-w07-addendum.json`) is all duplicates: **not merged**.
- Upstream data fixes found by agents (not done): ATL/ARI dossiers list old head coaches; projected-starters still shows Dart (NYG) / Daniels (TB) / Lamar (BAL); some expert rows mis-tagged to the wrong game.
- Splits are from Fri 12:40 PM PT (Andy runs the splits ingest; it writes Supabase).
- Spelling: **Matt Perrault, Doug Kezirian, Stuckey** (Andy-confirmed). Show names: Hunter + Millman = Sharp or Square; Lotzia, Kravitz, Middleton = The Favorites; Brandon Anderson = "Brandon's Playground".

## 10. Sunday morning checklist (whoever is on)
5:00 AM PT Paris inactives + wind; 7:30-9:30 AM CIN@BAL props recapture (BKR/BEO) and any tackles markets; 8:30 AM inactives (Mayfield, Hall, Mason, Ridley/Spears, Kirk); ~11:55 AM inactives (Nacua, Bowers, Jacobs, Branch); 3:50 PM SNF inactives (Darnold, KC LT); Mon 3:45 PM MNF inactives (Barkley, Goedert).
