# Week 10 Pass 1 podcast veracity check (Tue 11/10 ~7:15 PM PT, Claude Team 2)

Digest: `data/podcasts/youtube-extracted-picks-2026-w10.json` (30 picks, 27 leans, 4 episodes). Antigravity report: `reports/intel/antigravity-w10-tuesday-podcast-sweep.md`.

## Checks
- `verify_staging_quotes.py` re-run on all 4 staging files: 0 quote MISS (matches Antigravity's report).
- Prices: null on every single-game pick (rule 1 OK). Units and best_bet present for Even Money (rule 2 OK).
- Spot-read against captions:
  1. Fezzik WAS teaser 2u @931: correct; the turn follows "All right, Steve" (rule 4 OK). His Under 41.5 is correctly a lean.
  2. Fezzik MIA@IND Under 40.5 2u @1297: correct.
  3. Simon Hunter SEA -3 @3286: correct; a later "like Chad said" in the same turn rules out Millman.
  4. Millman NYG -1.5 @361: pick and line are correct ("I bet the Giants at minus one and a half"), but the transcript does not name the speaker at that turn. Per rule 4 it should be "Sharp or Square (speaker not attributable)". **Correct in Pass 2.**
  5. BettingPros SEA @1116 ("pressure Kirk Cousins up the gut"): recorded before the Cousins trade; correctly a lean.

## Issues
- **"Jonathan Taylor traded" is speculation, not news.** Fezzik @1271-1287 says he *anticipates* Taylor gets traded. The Colts told Taylor he won't be traded (Pelissero, ESPN feed 11/10 20:21Z). Fezzik's MIA teaser / Under rationale leans partly on a trade that didn't happen.
- **Three futures are filed under games:** David Bailey DROY (BUF@NYJ), LV win total Under 7.5 (SEA@LV), BAL division finish (LAC@BAL). Harmless in the digest, but they looked like side votes. `fair_lines_w10.py` now counts only spread/moneyline picks as votes.
- Stale lines: BettingPros LAR -7.5 and SF -7 / Over 54.5 were spoken before the market settled (DK LAR -9.5, SF -4.5 / 55.5). Graded at the spoken line.

## What the podcasts say (sides, one vote per speaker)
- **TNF WAS@NYG:** Fezzik and Tucker both tease WAS to +8.5 (2u each); one NYG -1.5 bet (Sharp or Square, bought early); Fezzik lean Under 41.5.
- **JAX@TEN:** Fezzik and Tucker both TEN +10.5, **best bet, 2u**. Our fair line says JAX (TEN +13.1). 2 votes against, below the 3-vote dissent flag. Worth a look before using JAX.
- **PIT@CIN:** three PIT +3.5 votes (Tucker 2u, Millman best bet, Kravitz). Fair line has no side (CIN -3.8 vs -3.5).
- **LAR@ARI Under 40.5:** Fezzik 2u and Tucker best bet 2u. It's already 38.5 at BEO.
- Teaser legs: CAR (both), MIA (both), BUF -2.5 (Tucker), WAS (both).
