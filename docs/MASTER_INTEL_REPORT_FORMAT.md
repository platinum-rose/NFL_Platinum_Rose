# Master Intel Report: Locked Format (Template v2)

**Status:** locked template v2, approved by Andy on 2026-10-02 (Week 4); v1 was approved 2026-09-26 (Week 3). Use it **every Saturday night before the Sunday slate** until user feedback asks for changes. Don't redesign it; propose changes to Andy first and log any that he approves at the bottom of this file.
**Reference build:** Week 3, 2026 (`dist/nfl_week3_master_packet/`, commit `d1af19f` and later). If you aren't sure how something should look, open that report.
**How to build it:** `docs/MASTER_INTEL_REPORT_RUNBOOK.md`. **The builder is the template:** `scripts/master-intel/build.py` + `scripts/master-intel/convert_summary.py`. Change the format there, never by hand-editing an output file.

---

## 1. Who it's for and how it reads

The reader is a casual, all-Sunday couch bettor, not an analyst. Every part of the report follows these rules:

1. **Plain English.** Every term a casual bettor wouldn't know gets a hover definition on its column header and a plain explanation in the section. Don't use shorthand: write "Action Network", not "AN"; "Sharp or Square", not "SoS"; "Round Robin", not "RR"; "Anytime TD", not "ATD"; "passing offense vs defense", not "O vs D". The builder expands the common ones (`ABBR` in build.py, `ticket_display()`). If a new abbreviation shows up, add it there.
2. **No internal codes.** Don't show slot numbers ("Slot 3"), template codes ("7a"), rule numbers ("rule 2"), the "§" sign or the word "naive". The builder translates the known ones. Card files may keep them internally.
3. **Recommendations first.** The reader should find what to bet without scrolling past analysis.
4. **Everything collapses.** Each numbered section is an open box. Every box *inside* a section starts **closed**. The Slate Status stays open.
5. **Everything links.** Game names jump to the game write-up. Expert names jump to that expert's pick in the registry. Props jump to the props pool. Tickets jump to their legs.
6. **Team logos** (20px, `data/team-logos/`, embedded once as CSS) sit next to every game label.
7. **Honest numbers.** Stars rank our picks against each other; they are not win percentages. Projections are written estimates, not model output (the quant model failed validation and is never used to pick or size bets). When a projection disagrees with a card lean (for example a dog moneyline that is a price bet), the text says so.
8. **Disclaimer at the very bottom:** entertainment only, not advice, every wager is the reader's own risk, no liability on the author or Platinum Rose, 1-800-GAMBLER.

## 2. Page layout (top to bottom): Template v2, picks first

Locked by Andy on 2026-10-02 (Week 4). Three parts: **A. What to bet → B. Why we like them → C. Reference.** `reorder_sections()` in build.py produces this order; the side menu and the contents grid show the part labels.

| Block | What it shows | Notes |
|---|---|---|
| Header | Title; plain subtitle ("What to bet this week, why we like it, and what every expert and betting market is saying"); build time and Bookmaker capture time in 12-hour PT; "recommendations only, nothing bet" line | No jargon, no ISO timestamps |
| 🧾 Data inputs & freshness | What the report was built from (closed box) | — |
| 🚨 Slate Status | Plain definition, then games played, QB changes, big-money signals **at their line** ("not available yet" when there are no splits), players pulled from the Bookmaker menu (a game whose whole prop menu is unpriced shows as one line, not a player list), known gaps in plain words (no file paths) | Open by default |
| Controls + Table of Contents | Expand/Collapse All buttons; contents grid grouped under Part A / B / C | Same titles as the side menu |
| Side menu | Fixed on wide screens, "☰ Contents" drawer on narrow ones, with Part A / B / C labels | `PLAIN` / `SHORT_TIP` in build.py |
| **Part A: What to bet** | | |
| ⭐ Our Picks This Week | Straight bets grouped by game (filter Side/Total; sort by strength, kickoff or A–Z) · Parlays & round robins · Player prop stacks · SuperContest 5 · Passes & why | Tickets open inline with a one-line "what it is and why", payout, every leg, and the night-game hedge table where it applies |
| 1. Every Bet, Ranked | Every lean ranked by stars (filter Side/Total/Prop) + the same plays grouped by bet type, with "How the stars work" | Old v1 §1 + §4 ranked tables |
| 2. Player Props | Build-your-own props pool (per-game closed boxes, jump links, filter by prop type) + prop boards (article tier-1, tackles + assists, 2+ passing TDs) | Old v1 §1 props pool + §8 boards |
| 3. Teaser Bets | Plain teaser explanation + Wong-eligible lines | — |
| 4. The Underdog Upset Ticket | How the dog round robin pays (needs 3+ winners), per-dog table, per-dog reasoning with linked sources | — |
| 5. Survivor Pool Picks | Plain explanation; your entries' status; win chance, pick share, value score, save-for-later notes, QB news, next 3 opponents | `data/survivor/pick-intel-<season>-w<NN>.json` |
| **Part B: Why we like them** | | |
| 📌 The Week at a Glance | Top matchup-data reads (explained, linked), one-sided consensus, clashes, big-money signals, QB watch | — |
| 6. Game-by-Game Breakdowns | Per game: projected final, line movement, **Game script / Why the card leans this way / What breaks it**, experts cited, actionable props; the old v1 §2 odds-and-money box (lines, win chance, implied vs projected score, bets-vs-money bars, big-money signal with first-seen line and drift) folded into each game; closed boxes for Key context, Sides, Totals, Player props | Written narratives (see §3). Signals persist in `data/generated/master-intel/big-money-flags-<season>-w<NN>.json` |
| 7. What the Experts Say | Plain intro + how-to-read box; ranking ordered **by strength first** (Near-unanimous > Majority > Clash > Split), then margin | — |
| **Part C: Reference** | | |
| 8. Expert Pick Registry | Every named expert pick by game (the citation targets the write-ups link to) | — |
| 9. Betting Trends | "Trends are history, not a forecast" note; trends tied to a game and side (filter by type); trend articles grouped by game | — |
| 10. How the Card Was Built | Ticket list and season build rules | — |
| 11. Sources & Data Notes | Source counts, feed health, Known Gaps (full text, with file paths) | — |
| ⚖️ Disclaimer | Entertainment-only / no-liability text | — |

## 3. What a person (or agent) writes each week

The builder does everything else from data. These four inputs are written by hand each Saturday, and they carry the voice of the report:

| Input | File | Format |
|---|---|---|
| Game write-ups + projected scores | `reports/intel/master-intel-narratives-<season>-w<NN>.md` | `## AWAY@HOME`, `projection: TEAM pts, TEAM pts`, then `### Game script`, `### Why the card leans this way`, `### What breaks it` |
| Ticket one-liners | same file, `## TICKETS` block | `- <card ticket name>: <what it is and why, for a casual bettor>` |
| SuperContest reasons | same file, `## SUPERCONTEST` block | `- <TEAM>: <plain reason>` |
| Survivor pick intel | `data/survivor/pick-intel-<season>-w<NN>.json` | `teams.<AB>.pick_pct / ev / note` + `sources` (SurvivorGrid pick share and value; Covers or similar save-for-later notes). Cite the URLs |

Writing rules for these:
- Cite only evidence that is in the dossier (lines, splits, secondary tiers, injuries, named expert picks). Name the expert as they appear in the registry, so the builder can link the name.
- Projection = the market-implied score, moved only for evidence named in the text. Say it when the projection disagrees with a card lean.
- Honest ticket lines: say when a ticket needs most of its legs to profit, or when it's a long shot or a template moonshot.

**Game narrative minimum (Andy, 2026-10-01). The Week 3 file (`reports/intel/master-intel-narratives-2026-w03.md`) is the reference; LAC@BUF is the model block.** Every remaining game must meet all of these before the build, roughly 200–300 words per game:
1. **When:** write narratives only on Saturday (or Sunday-morning rewrites), **after** the card, the Action Network splits, the expert pick registry, injuries and the secondary-matchup tiers exist for the week. Never write market-only placeholder narratives earlier in the week; a game with no narrative shows up under Known gaps, which is the honest state.
2. **Game script:** a concrete path to the projected final, naming the players who drive it (QB, lead back, the receivers on the matchup) and at least one price or stat from the dossier (e.g. an anytime-TD price, a scoring split, a matchup tier). End with how the final margin lands relative to the spread.
3. **Why the card leans this way:** the expert split **with names on each side** (e.g. "4–4: Sharp or Square and Wes Reynolds on LAC; BettingPros, ESPN, VSiN on BUF"); the bets-vs-money split and whether there is a sharp gap; which card ticket(s) touch the game by ticket number or name, or why the card passes; how the projected total compares with the total line.
4. **What breaks it:** a specific failure path tied to named players or events (questionable players by name, turnovers, a QB change), and how it would change the margin.
5. **Roster-clean:** every capitalized name is a 2026 roster player or a listed non-player name; never write a player's team from memory (the build's roster gate blocks otherwise).
6. **No boilerplate:** no "No card is present" / "no ticket yet" filler. If something genuinely doesn't exist yet, the narrative isn't ready to be written.

## 4. Card templates the report depends on

The report explains the card; it doesn't build it (that's `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` + `docs/NFL_WEEKLY_CARD_PROCESS.md`). Two templates must hold because the report explains them:

- **Morning Parlay:** the morning window's best plays + a couple of afternoon heavy favorites, **capped by the Sunday-night favorite moneyline**.
- **Afternoon Parlay:** 2–3 morning heavy favorites + the afternoon's highest-confidence plays, **capped by the Sunday-night favorite moneyline**.
- The night-game moneyline is a **placeholder hedge anchor**, not a pick we need to win. If the day legs all hit, the reader bets the underdog to lock a profit, or takes the underdog plus the points to try for a middle where both tickets pay. The builder detects any parlay capped with a night-game moneyline (`night_cap()`), adds the explainer box, and prints a hedge table (stake to lock profit, profit locked, middle payout) from the build's prices.

## 5. Exports (archive set)

Every build writes the same five files to `dist/nfl_week<N>_master_packet/` under `nfl_week<N>_master_betting_intelligence_summary.*`:

| Format | Made by | Use |
|---|---|---|
| `.html` | build.py → convert_summary.py | The interactive report: send this to clients |
| `.md` | build.py | Source text; diffable |
| `.docx` | convert_summary.py | Word / Google Docs |
| `.json` | build.py (`schema: master_intel_report_v1`) | Structured data: recommendations, tickets + legs + hedge options, ranked plays, consensus, per-game lines/splits/signals/write-ups/props, survivor, trends, gaps |
| `.pdf` | `python3 scripts/master-intel/export_pdf.py <html>` | Print/archive copy, every box expanded. Needs Playwright + Chromium |
| `site/` (multi-page) | build.py → `scripts/master-intel/build_site.py` (needs `beautifulsoup4`) | **The client version.** One page per section (Our Picks home, Every Bet Ranked, Player Props, Teasers, Underdogs, Survivor, Week at a Glance, Game-by-Game hub + one page per game, Experts, Registry, Trends, Card build, Sources), shared `assets/report.css` / `assets/report.js`, side menu + previous/next on every page, all `#` links rewritten across pages. `site/_artifact_index.html` is the home page without the document skeleton, used for the hosted Artifact |

**Hosted client link (Week 4, 2026):** https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6 (private until Andy shares it). Republish to the same URL after every rebuild: Artifact publish with `url` = that link, `file_path` = `site/_artifact_index.html`, and every other `site/*.html` + `site/assets/*` in `files`. Change the look only in build.py / convert_summary.py / build_site.py, never in the hosted copy.

Archive the five files to Andy's Google Drive after every Saturday build (a folder per week, e.g. `Platinum Rose / Master Intel / 2026 / Week 03`).

## 6. Instructions for agent teams

**All agents (Claude, Codex, Antigravity, Copilot):**
1. Read this file, then the runbook. Follow the runbook's steps in order; the only creative work is §3 above.
2. Change the report's look only in `build.py` / `convert_summary.py`, and only with Andy's approval. Don't hand-edit outputs.
3. Guardrails: read-only on sportsbooks (never click odds or a bet slip), SELECT-only Supabase pulls, no bet placement, no `git add -A`, stage files by explicit path.
4. Before you hand the report over: open the html; check that sections collapse, the filters work, links resolve, logos show and the disclaimer is at the bottom; confirm all five exports exist; then summarize in 15 lines or fewer (top plays, big-money signals, pulled players, known gaps).

**Claude (Cowork / Claude Code):** use the device shell for repo work, and the cloud container for PDF export if the local machine has no Chromium. Publish the html as a private artifact only for Andy's review; sharing with clients is Andy's call.

**Antigravity:** the skill `.agents/skills/master-intel-report/SKILL.md` wraps this file. Use Antigravity's browser only for the read-only Bookmaker capture (runbook §2). Gemini extraction output must be cleaned per the runbook before it reaches the report.

**Codex:** same steps; Codex has no browser, so it starts from an existing BKR capture file and Andy-saved DK pages.

## 8. Companion: the SuperContest report

Every build also writes `nfl_week<N>_supercontest_intelligence_summary.{html,md,docx,json}` (+ pdf via export_pdf.py) from the same data, when `data/supercontest/week-<NN>-lines.json` (the locked contest lines) exists. It is for Andy & Amanda's contest review, not for clients.
- **Sections:** How the contest works · Contest status (season record, played games, contest-vs-market value, key-number watch) · **Our Five** (each pick: contest vs market line, projected room, experts, big money, stars, the case, what breaks it, key-number warning) · **Pick sheet** (checkboxes pre-filled with our five, counter, Copy / Reset; saved in the browser only) · 1. Every side ranked (filter favorites/underdogs) · 2. Contest vs market · 3. Expert panel · 4. Game-by-game · 5. Season review (graded from `data/supercontest/locked-card-week-<N>.json` + box scores) and rules of thumb · Disclaimer.
- **Contest score** (ranks sides; not a win chance): room vs contest line (capped at 7) + 1.5 × line value + 0.5 per net expert (±3) ± 0.5 big money ± 0.5 key number gained/lost.
- **Inputs:** the SuperContest 5 line in the card (`## SuperContest` block) and `## SUPERCONTEST` reasons in the narratives file. Save the final joint five to `data/supercontest/locked-card-week-<N>.json` after it's locked, so next week's review grades it.

## 7. Change log

| Date | Change | Approved by |
|---|---|---|
| 2026-09-26 | Template v1 locked (Week 3 build) | Andy |
| 2026-09-26 | SuperContest companion report added | Andy |
| 2026-10-01 | **Template v2 order (review build; approved 2026-10-02):** Part A What to bet (⭐ Our Picks · 1 Every Bet, Ranked (old §1 + §4 ranked tables) · 2 Player Props (old §1 props pool + §8 boards) · 3 Teasers · 4 Underdog ticket · 5 Survivor) → Part B Why we like them (📌 Week at a Glance · 6 Game-by-Game, with old §2's per-game odds/money box folded into each game · 7 What the Experts Say) → Part C Reference (8 Expert Pick Registry · 9 Trends · 10 How the Card Was Built · 11 Sources, with the data-inputs box). `reorder_sections()` in build.py; `scripts/master-intel/rebuild_review.py` re-lays out a past week's md. Week 3 review copy: `dist/nfl_week3_master_packet_v2/`. | Andy (locked 2026-10-02) |
| 2026-10-01 | Game narrative minimum checklist added to §3 (Week 3 LAC@BUF as the model; Saturday-only, no market-only placeholders) | Andy |
| 2026-10-02 | **Template v2 locked** (§2 rewritten to the v2 order). Plain header: plain-English subtitle, 12-hour PT build and capture times. Slate Status: "not available yet" for big money when there are no splits, whole-menu-unpriced games collapsed to one line, gaps without file paths | Andy |
| 2026-10-02 | Multi-page client site (`build_site.py`, auto-run by build.py) + hosted Artifact link for client review | Andy |
| 2026-10-03 | **Opening lines from Action Network**, persistent for the season. The line-movement baseline is `data/odds/actionnetwork-openers-<season>-w<NN>.json` (`scripts/master-intel/actionnetwork_openers.py`, runbook step 8a): the first AN "Open" line after the previous Sunday 5 PM PT. It falls back per game to the earliest BKR paste. The source is labelled in each game's line-movement box ("opening line: Action Network open, Sun 9/27 5:00 PM PT → Bookmaker now") and in the Data inputs table | Andy |
