# Antigravity request: Week 9 Pass 2 podcast sweep (run Thu night after TNF, or Sat by 5 PM PT)

Paste the code block as the first message to Antigravity. Written by Claude 2026-11-04 after the Pass 1 veracity check
(`reports/intel/w09-podcast-veracity-2026-11-04.md`): about 80% of Pass 1 was accurate, but it had systematic errors. This pass fixes them first.

```text
Platinum Rose, Week 9 (2026), Pass 2 podcast sweep. Repo: E:\dev\projects\NFL_Dashboard.
Sunday early kickoff is 10:00 AM PST. TNF JAX@BAL is final by the time you run this: drop its picks with --final JAX@BAL.
PIT and TEN are on bye. BAL QB Fagnano; PHI QB McKee (Hurts IR); NYG Dart IR. Flag any rationale that assumes otherwise.

READ FIRST
- reports/intel/w09-podcast-veracity-2026-11-04.md  (what went wrong in Pass 1; the rules below come from it)
- data/podcasts/youtube-extracted-picks-2026-w09.claude-verified.json  (per-pick verdicts: missed_picks, dropped_leans)
- agents/dev/ANTIGRAVITY_W08_SATURDAY_PODCAST_SWEEP.md  (schema; unchanged except the fields below)

GUARDRAILS (unchanged): $0 spend (no Gemini API / --run-gemini / AssemblyAI / OpenAI); no Supabase writes, promotion or git commits;
team null for props; extract each episode once (note audio and short URLs).

NEW HARD RULES (Pass 1 broke each of these)
1. price: null unless a price is SPOKEN. Never fill -110.
2. units: record them whenever spoken ("two units", "1u", "best bet"). Put "best bet" in a best_bet: true field.
3. line: the number the SPEAKER says, not public/schedule.json. If no number is spoken, line null and note it.
4. speaker: a name only if the transcript itself names the speaker at that turn (self-intro, direct address, "Chad just said").
   Auto-captions have no speaker labels and drop ">>" markers, so you can't infer speakers from turn parity.
   If both hosts endorse ("I agree on both"), speaker = "<show> (both hosts)". Otherwise "<show> (speaker not attributable)".
   Never claim "on-screen identifiers": you are reading captions.
5. Picks vs leans: "lean", "gravitating", "not a big position", "if you made me pick", survivor-segment opinions -> put them
   in a separate leans[] array, NOT extracted_picks.
6. quote: a verbatim substring of the captions. Paraphrase goes in rationale.

STEP 0: correct the 4 Pass 1 staging files (youtube-kq21OfxY1Mk, -WbYwN5iWNGY, -KjbSWUbYkeI, -OtB_TD5uMgE)
   Apply every non-"verified" verdict in the .claude-verified.json companion to the staging JSONs (the digest rebuilds from staging):
   - OtB_TD5uMgE @1478 DEN@CAR spread: side CAR, line +3 (was DEN -3.5: WRONG SIDE).
   - Wrong lines: OtB @1740 NYG -2.5; OtB @1805 HOU@LAC Under 41.5; OtB @2610 TB@CHI Under 47.5.
   - Move to leans[]: WbYwN5iWNGY @580 (JAX) and @4020 (MIN +3.5); KjbSWUbYkeI @726 (KC -10); OtB @217 (JAX -8.5; delete the invented quote); OtB @2971 (BUF@MIN U).
   - Speakers: WbYwN5iWNGY @3314 SEA -10.5 = "Simon Hunter + Chad Millman (joint)"; OtB picks = show-level per rule 4 except @2174 GB@NE (Erickson, addressed by name).
   - Add the missed picks: KjbSWUbYkeI ~@1179 Fitzmaurice DAL@IND Under 51.5; OtB ~@810 LAR@WAS Under 47.5; OtB ~@1010 CLE@NO Under.
   - Add units from the companion (Even Money: every pick) and price null everywhere.

STEP 1: discovery (since Tue 11/03 noon PT)
   `npm run youtube:sweep:capped -- --lookback-days 3` (no --run-gemini) plus direct channel checks. Expected new Week 9 betting episodes:
   Sharp or Square Thursday (bets + Sharp Calls), Ross Tucker "Week 9 PICKS" (Wed), Even Money Thursday line-move episode,
   Warren Sharp Matchups (Thu) and Best Bets (Fri), Action Network Sunday/Big Bets, BettingPros best-bets and props shows, VSiN.
   The cadence queue also lists Action Futures Watch (futures: extract as futures), 2x Move the Sticks and The Athletic MNF (likely
   no picks; flag rather than skip silently). Sharp or Square: Tue/Thu episodes only, never Sunday.

STEP 2: extract (same schema + the fields above). Coverage >= 90% of runtime, otherwise "partial".

STEP 3: verify before building the digest:
   python scripts/master-intel/verify_staging_quotes.py youtube-<id> [...]   -> zero "quote MISS" lines allowed.
   Spot-read 3 picks per episode at their timestamps and confirm side, line and speaker.

STEP 4: digest: copy data/podcasts/youtube-extracted-picks-2026-w09.json to .bak-<YYYYMMDD>-pre-pass2, then
   python scripts/master-intel/youtube_digest_from_staging.py --week 9 --final JAX@BAL
   Don't hand-edit the output. If the script drops units, best_bet or leans[], report that and STOP (don't patch the script).

OUTPUTS: corrected and new staging JSONs (+ .captions.txt); rebuilt digest (+ .bak);
reports/intel/antigravity-w09-pass2-podcast-sweep.md with: the Step 0 correction log, an episode table, picks by game (units and best bets),
leans by game, line moves of >= 1 point vs public/schedule.json, show-level/unattributed speakers, the verifier output, $0 spend.
Finish with a summary of 10 lines or fewer.
```
