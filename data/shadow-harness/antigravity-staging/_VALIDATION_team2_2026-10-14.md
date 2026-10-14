# Team 2 validation of Antigravity staging (2026-10-14) — NOT ingested, nothing committed

Scope: 3 extracted files (EC4r_E6mc0E, Di8EC4Nu_XE, 0XtOHyz2LRs). The 3 no_transcript files have no content.

## Structural
- All 44 picks have the schema fields, int source_timestamp, week=6, a quote. coverage_check.reached_end_of_video=true on all 3.
- `speaker_segments` is EMPTY in all 3 files (schema requires it), so quotes CANNOT be verified as verbatim against a transcript from these files. Quotes come from auto-captions (garbled: "Falcons plus 32 units" = +3, 2 units; "Denver 1916" = 19-16; "2420", "3424", "3127" = 24-20, 34-24, 31-27). Need the raw caption text to verify.
- No player-award markets; no price on any pick (price null everywhere, incl. spreads).
- `side` is null on every spread pick, so dog/favorite is only implied by line sign, and lines are stored positive (e.g. CLE 4.5, NYJ 7.5). Teaser lines are post-tease numbers (KC -2.5, SF -1.5 are negative).

## Weak or unsupported picks
- HOU 3.0 (EC4r ts 956): quote "Still two units Texans." contains no line; the 3.0 is not in the quote.
- CAR +1.5 (0Xt ts 72): quote "I already bet the Panthers" — a passing remark, line not in quote.
- NYJ (Simon, 0Xt ts 1869): quote "so am I" — agreement, not a stated line.
- ARI +13.5 (Simon, 0Xt ts 2820): quote is a rhetorical question ("Aren't we supposed to just blindly bet the Cardinals here?"). Could be sarcasm; verify.

## Lines vs BKR board (BKR_current_lines_1014_0020, 14 games)
Match: DEN teaser 8.5, TEN +7, ATL +3, NYJ +7.5, ARI +13.5, NO u45.5, DAL teaser 7.5, KC teaser -2.5, SF teaser -1.5.
Differ (podcast-time line vs current board — likely line moves, not errors, but do not treat as current prices):
- HOU +3 vs board HOU +2.5
- TB +3 vs board TB +2.5
- CLE +4.5 (both shows) vs board CLE +5
- LV +5.5 vs board LV +4
- CAR +1.5 (and CAR teaser 7.5) vs board CAR -1 (2.5-pt swing; Panthers now slight favorite at PHI)
- NO teaser 7.5 (implies NO +1.5) vs board NO -1
Pickem file: 14/14 W6 games covered; DEN, NYG, ATL etc. are plain winner picks with predicted scores, no lines.

## Not done
Roster gate on names in analysis_notes (e.g. Alaric Jackson, Lamar Jackson); not run.
Next: need raw caption text (or Andy's retry) to verify quotes; Andy go-ahead to wrap as `antigravity-transcript` observations.
