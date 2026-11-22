# Week 11 late-week sweep: Claude verification of Antigravity's output (2026-11-21 ~00:45 PT)

Checked against the local Parakeet transcripts (word timestamps), the ingested article text (`data/research-intel/review/article-intel-review-latest.json`), and tweet-ID dates. Antigravity's files are untouched; corrected copies sit beside them as `*.verified.json`. Everything stays `pending_andy_review`.

## Verdict by channel

| Channel | Antigravity claim | Verified | Action |
|---|---|---|---|
| Even Money Thursday (`q7Bwxdeqfzg`) | 7 picks + 4Q parlay lean | All real (Fezzik's contest top 5 with "best bet, 2x" on Jets +3.5; Tucker ARI +16.5 and Under 41.5). Fezzik's timestamps were ~490 s early | Timestamps corrected |
| Sharp or Square Thursday (`nwQL_hMwIf0`) | 6 picks | Real (Hunter: TB, TEN, NYJ, "brass balls" NYG; Millman: PIT -4.5, Bears 1H Discord grouper) | Verbatim quotes, timestamps fixed |
| The Favorites Friday (`6jkl37eXZf8`) | 5-pick contest card by Kravitz | Card is real: TEN +8.5, JAX -5.5, SF -3.5, TB +6.5, CHI -11.5 at 4186 s. Quotes were paraphrased, timestamps ~6 min off, speaker not attributable | Show-card quote; speaker null |
| Same episode: "John Jastremski" CAR ML lean | lean | **Not real.** "Jastremski" never appears; the segment says "Baltimore or nothing" / "can't play Carolina here" | Dropped |
| Sharp Football (`4aZsGj1ZLd8`) | Mason U12.5 longest rush; Gibbs JAX lean | Real (lean at 1845 s, not 1045 s) | Timestamps fixed |
| Ross Tucker Picks (`atjK1T3Frfs`) | 12 straight-up picks with "Confidence #1–12" | Directions real, but **every quote was invented**, timestamps were placeholders 120 s apart, and **no confidence ranks were given**. He picks straight up with predicted scores (e.g. Ravens: "I probably don't feel great about it") | Quotes/timestamps replaced; ranks removed |
| BettingPros early lines (`SKxJJ-nFhmk`) | 12 picks in the report | **Not real at the cited times** (350 s is IND@HOU talk; 1940 s is NYJ@LAC "no interest"). Not in the addendum file | Excluded |
| Simon Hunter "Ravens fade / Panthers" update | supersede | Overstated. Humphrey news is real on the show ("sent him home… inactive"), but no Carolina bet; host took PIT -4.5 instead | Rewritten; Humphrey status needs the official injury report |
| Articles (13) | Makinen ×5, Tuley ×6, Shepardson ×2 | All quotes found verbatim. **URLs were wrong** (made-up slugs) and published times missing | URLs/times corrected from the ingested records |
| B2 rejected-row fixes | 4 remapped, 7 confirmed | Tuley teaser legs and Shepardson team totals check out (team totals are out of scope for Gun to my head) | Accept |
| X (8 rows) | Prop Guru ×3, Sal Vetri ×4 parlay legs, xEP ×1 | Genuine Friday 11/20 posts on active games. The CSV packs game and time into the rationale column (not the 9-column format) | Accept; reformat on merge. Players still need the strict roster vet |

## Process notes for Antigravity
- Two pass-fail problems: invented quotes, timestamps and ranks (Ross Tucker), and a report listing picks that were never written to file and are not in the audio (SKxJJ). Future runs must copy quotes straight from the transcript JSON with the word's start time.
- Wrong article URLs: use the ingested record's `url`, never a constructed slug.

## Files
- `data/podcasts/youtube-extracted-picks-2026-w11-late-addendum.verified.json`: 31 picks, 2 leans, 2 dropped, 3 supersedes.
- `data/intel/articles/2026-w11/late-week-article-picks-addendum.verified.json`: 13 picks, corrected URLs and published times.
- Build script (outside the repo): `E:\dev\projects\_intel_verify_w11\build_verified.py`.
