# Session Handoff — Frontier-Synthesis Rev-23-Followup4 Close-Out, Retroactive Portfolio Run, and Week 1 Intel/Betting Card Build

**Session date:** 2026-09-13 (Claude, cloud session linked to `E:\dev\projects\NFL_Dashboard` via device bridge)
**Status:** Three threads in flight, none committed/pushed. Handing off to a fresh session for a Week 1 intel refresh pass before betting-card synthesis resumes.

---

## Thread 1 — Frontier-synthesis rev-23-followup4: CLOSED, ready for Codex

All 9 numbered Codex findings from rev-23-followup4 are fixed and verified (170/170 focused tests green, eslint clean, `node --check` clean on all 10 touched files). Full detail in `codex_rev23_followup4_review_packet.md` (delivered to Andy, not yet re-read from disk this session -- exists in the prior session's scratch output, should be re-attached to a fresh Codex thread).

Finding #3 (`assertDossierProvenanceApproved()`) was the one open dependency -- Andy has since supplied the real approved-dossier-contract for `dossier-2026-09-09.json`:
```json
{
  "resolved_path": "E:\\dev\\projects\\NFL_Dashboard\\.nfl\\portfolio\\dossier-2026-09-09.json",
  "sha256": "ce212980f8e2050a5b7cb8a1b98c4b949248ba17f53c624d4ab600305747271e",
  "generated_at": "2026-09-09T14:38:29.650Z",
  "kickoff_at": "2026-09-10T00:20:00Z"
}
```
`kickoff_at` is Week 1's real first kickoff (NE @ SEA); `generated_at` genuinely predates it -- no fabrication needed despite Andy's own "fake it" framing for what he called a retroactive baseline run.

A follow-up status update (`codex_rev23_followup4_status_update.md`, delivered to Andy) was drafted and sent to the Codex team, declaring `READY_FOR_CODEX_REVIEW` and disclosing the operational run described in Thread 2 below (including the `--allow-unsafe-preflight` override) for full transparency. **Next session: check whether Codex has responded** to this status update.

## Thread 2 — Retroactive portfolio-synthesize.js run: LIVE, likely finished by next session

Andy ran a real, paid, live synthesis (`agents/portfolio-synthesize.js`) against `dossier-2026-09-09.json` as a retroactive Week 1 baseline (deadline was missed; this is explicitly a "we have to fake the pre-season timing, not the data" run per Andy). He worked through five layered preflight gates in his own terminal, each explained before an override was supplied:

1. Startup invariant (empty watchlist / in-scope promotions) -- cleared.
2. Dossier provenance approval (finding #3's new gate) -- cleared via the contract above.
3. Intel-source integrity audit -- BLOCKED, overridden with `--allow-blocked-intel`.
4. Dossier freshness preflight (4 stale lanes, 5 expired lanes) -- overridden with the applicable `--allow-stale-dossier` / `--allow-missing-evidence-lanes` / `--allow-unknown-dossier-freshness` / `--allow-expired-evidence-lanes` combination.
5. Full preflight (`safe_to_run_paid_synthesis: false`, 6 BLOCK reasons) -- Andy gave explicit standalone authorization: **"override with `--allow-unsafe-preflight`"** -- this flag is documented in the standing engagement rules as "not authorized" as a default action, so it was withheld until Andy said so directly.

Andy confirmed via pasted terminal output that Stage 1 (`claude-opus-5` + `claude-fable-5-1`) had begun executing -- a real paid model run, not a dry run. `--no-persist` was used, which only suppresses the Supabase/ledger write; local `.raw.json`/HTML/MD report files under `.nfl/portfolio/` are written regardless.

**Next session: check whether this run completed**, read its output report, and confirm with Andy whether/how it should be persisted (it currently is not, per `--no-persist` -- any Supabase write still needs separate explicit authorization per the standing rule).

## Thread 3 — Week 1 betting card + intel inventory: IN PROGRESS, this is where the next session should start

### What's built so far
A 13-game Week 1 Sunday/Monday-minus-Monday card (the 13 remaining games after NE@SEA and SF@LAR, which are already final) was built and then substantially revised as more sources were pulled in. Unit size confirmed: **$10/unit**. Scope confirmed: the **13-game Sunday slate only** (not Monday's DEN@KC).

Podcast sources reviewed and cross-referenced (all dated Sept 8-9, 2026, pulled from `scratch/*_master_100percent_exhaustive.md` and their `*_summary.md` companions where available):
- **Action Network** (Raybon/Stuckey ep.) -- Stuckey, Doug Kazarian, Evan Abrams. Covers all 13 games.
- **BettingPros** (ep1051/1052) -- Perrault, Fitzmaurice, Roberts, Bogman. Only covers NE@SEA/SF@LAR (both played) + survivor notes + brief slate notes on TB/CIN, CLE/JAX, MIA/LV.
- **Even Money** -- Ross Tucker, Steve Fezzik. Covers most of the 13 games with real picks, several explicit consensus best bets.
- **Sharp or Square** -- Chad Millman, Simon Hunter. Covers most of the 13 games, including explicit "pass" calls that reversed earlier reads.
- **VSiN T-Shoe Index** -- Tyler Shoemaker's proprietary quantitative power-ratings model (TSI). Has a projected spread/total for every Week 1 game including all 13 of ours -- this is the first genuine "model" signal (vs. discretionary expert opinion) available this session, and it disagrees with the podcast consensus on at least two games (see Conflicts below).
- **The Favorites** -- Kravitz, Middleton, Abrams. Reviewed, no coverage of the live 13-game slate (only NE@SEA/SF@LAR + season-long futures).
- **BettingPros ep1013** ("Sharp Picks") -- reviewed and **excluded**: dated July 1, predates the schedule release, has factually wrong opponents for the games it covers.

Player props: a dedicated dossier exists at `docs/player-props-intel/player-props-intel-latest.md` (generated 2026-09-12, the freshest artifact found this session) with 43 extracted props, but only **9 apply to the live 13-game slate**, across only **6 of the 13 games** (ARI@LAC, BAL@IND, BUF@HOU, CLE@JAX, NYJ@TEN, TB@CIN). The other 34 props are for NE@SEA/SF@LAR (played). **7 of the 13 games have zero player-prop coverage anywhere in the repo**: ATL@PIT, CAR@CHI, DAL@NYG, GB@MIN, LV@MIA, NO@DET, PHI@WSH.

Twitter: verified as genuinely active for the **personal** account (@andrewlrose) -- spot-checked two of the claims in `docs/player-props-intel/platinum-rose-parlays-and-twitter-audit.md` directly against raw `research_intel_notes` rows in Supabase and confirmed they're real ingested tweets (Joe Holka's Zay Flowers/Omarion Hampton props, John Ewing's BetMGM most-bet-props data), not fabricated. Two of the 9 live-slate props trace to this Twitter pipeline. The **Platinum Rose account (@PlatinumRo24334) bookmark pull is not yet built** -- `agents/twitter-bookmarks-agent.js` only supports one identity per run today (env-var fallback chain `PLATINUM_ROSE_TWITTER_*` -> `PERSONAL_TWITTER_*`, not simultaneous dual-account ingestion). This was identified as a next-step extension (see Thread 4) but not yet started.

Articles: `data/research-intel/review/article-intel-review-latest.json` (generated 2026-09-09) reviewed. Its own status field says explicitly this is not vetted: "Article-derived leads require human review before promotion." Only 2 of 44 pick-oriented records are `actual_pick`-tier; 37 remain unresolved. Mostly corroborates the podcast reads already collected. One prop-tier lean (Geno Smith 1+ INT) looks like a data-quality bug -- it's tagged across 11 unrelated teams, suggesting mistagging, not a real signal.

### Real cross-source conflicts identified (not yet resolved -- resolve before finalizing any picks)
1. **NYJ @ TEN**: VSiN's TSI model has Tennessee as a true -4.5 favorite (vs. market -1.5), directly contradicting the 3-show podcast pile-on backing Jets +1.5. Largest model-vs-crowd disagreement on the board.
2. **NO @ DET**: TSI model actually favors Detroit more than the market does, contradicting every podcast's "pass on laying Detroit -7" read.
3. **WAS @ PHI total**: Ross Tucker (Even Money) bet the Under 44.5; VSiN's model leans Over. Direct split.
4. **MIA @ LV total**: Action Network + BettingPros lean Over; Steve Fezzik (Even Money) and VSiN's model both lean Under. Genuine 2-2 split.
5. **ARI @ LAC**: The value both Even Money and the double-digit-dog system identified was at ARI +10, which no longer exists -- Sharp or Square explicitly passed at today's +9.5, saying the edge evaporated. VSiN's model still shows a smaller surviving edge at the current number, worth a second look.

### What Andy asked for at handoff time (verbatim intent)
Before any recommendations get finalized, Andy wants a **Week 1 intel refresh** run next session, specifically:
1. **BettingPros podcast transcription/ingestion status** -- Andy's expectation is that Antigravity's tooling should have already transcribed and ingested more recent BettingPros episodes than what this session found (only ep1051/1052/1013 exist in `scratch/`, and 1013 is stale/wrong). Check `docs/antigravity/source-inventory-and-freshness-latest.md` (last touched 2026-08-29, itself stale relative to the 104 master reports now in `scratch/`) and consider directly asking Antigravity to run a fresh BettingPros discovery/transcription pass per the refresh-request template in `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md`.
2. **Recent Twitter bookmarks** -- re-check `agents/twitter-bookmarks-agent.js`'s actual last-run recency (the audit doc claims "100% synchronization" as of Sept 9, 17:35 PDT, but that claim should be re-verified live, not just trusted -- this session only spot-checked two individual tweets, not the pipeline's current-moment freshness). Also this is the natural place to pick up Thread 4 (dual-identity extension) if Andy wants it done before more Twitter intel is pulled.
3. **Article ingestion freshness** -- take a closer look at whether `data/podcasts/actionable_betting_recommendations_2026.json` (still stale since Aug 27, despite 40+ newer master reports existing in `scratch/` since then -- a `master_extracted_not_structured` gap per the pipeline's own taxonomy) can be brought current, or whether Antigravity needs to be asked to run the promotion step.

## Thread 4 — Twitter dual-identity extension: IDENTIFIED, NOT STARTED

Andy asked to mimic how "the Antigravity team" processes bookmarks for both his personal account (@andrewlrose) and the NFL-proprietary account (@PlatinumRo24334). Investigation found:
- `agents/twitter-bookmarks-agent.js` already does personal-account bookmark ingestion via cookie-replay against X's internal GraphQL endpoints (not the paid API) -- a 2026-09-01 Antigravity contribution, explicitly flagged in the code's own header comment as outside X's ToS for those endpoints (real account-suspension risk, "Andy's call, not a technical constraint").
- It also supports a curated "tracked accounts" mode (`--tracked-accounts`, reading `config/twitter-tracked-accounts.json`) that pulls full timelines, not just bookmarks, for a list of sharp handles.
- Env vars already have a naming convention for a second identity (`PLATINUM_ROSE_TWITTER_AUTH_TOKEN`/`CT0`), but today they're a fallback override, not simultaneous dual-account ingestion -- only one identity's cookies are used per run.
- `config/sharp-accounts.json` has a stale note calling Platinum Rose bookmark ingestion a "future option requiring the paid X API" -- no longer true given the cookie-replay method already exists for the personal account.

**Two implementation options were presented to Andy, not yet chosen between:**
1. Extend the script to hold two cookie pairs and loop over both identities in one run, tagging each account's ingested tweets with a distinct source label.
2. Use Chrome (browser automation) to read each account's bookmarks page live while Andy is logged in, avoiding the cookie-replay/GraphQL ToS exposure entirely, at the cost of being manual/session-triggered rather than automatable.

Andy chose option 1 ("extend the automated script to run both identities") but this was deferred, not started -- the frontier-synthesis Codex status update and the Week 1 card work took priority. This is the next concrete coding task once the intel refresh is done, if Andy still wants it.

## Standing constraints carried into the next session
- No commits/push without Andy's explicit, separate approval.
- No Supabase writes/migrations without per-change authorization.
- No paid model/committee synthesis runs without explicit authorization (Thread 2's run already has it).
- `--allow-unsafe-preflight` and equivalent "unsafe" overrides are not authorized by default -- always ask Andy directly, as was done in Thread 2.
- Every Codex finding gets independently re-verified against live code/git/data before being accepted or acted on.
- "Positive template" prompt design discipline for any frontier-synthesis prompt work: forbidden concepts stay structurally absent, never mentioned even negatively.
- Nothing in this session was committed or staged; `git status --short` continues to show a very large, shared, dirty working tree (per earlier sessions' own notes) -- do not run broad `git add -A` -- any future commit must be scoped to exactly the files a specific authorized change touched.
