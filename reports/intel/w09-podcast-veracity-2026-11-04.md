# Week 9 podcast intel: veracity check (Claude, 2026-11-04 ~12:45 PM PT)

Every one of the 50 picks in `data/podcasts/youtube-extracted-picks-2026-w09.json` was read against its caption window in
`data/shadow-harness/antigravity-staging/*.captions.txt`. The pre/post windows of each segment were also scanned for missed picks.
The original digest is untouched. The corrected companion is `data/podcasts/youtube-extracted-picks-2026-w09.claude-verified.json`
(per-pick `verification` block, `missed_picks`, `dropped_leans`; prices set to null).

## Scorecard

| Verdict | Count | Notes |
|---|---:|---|
| Verified (speaker, side and line as spoken) | 29 | All 19 Even Money picks; 7 of 8 BettingPros Best Bets/Survivor; 2 Sharp or Square; Erickson GB/NE Under |
| Verified at show level (speaker not attributable) | 10 | BettingPros lines show: auto-captions can't tell Erickson from Wormeli. Most picks are endorsed by both hosts |
| **Wrong side** | **1** | BettingPros DEN/CAR staged **DEN -3.5**; the show took **Carolina +3** ("I like Carolina just at home. I'll take them"; co-host: "same direction"). The staged rationale isn't in the transcript |
| **Wrong line** | **3** | NYG **-2.5** (staged -3.5); HOU/LAC Under **41.5** (staged 40.5); TB/CHI Under **47.5** (staged 46.5). Lines appear copied from the schedule, not the audio |
| Lean, not a pick | 5 | Hunter JAX ("not a big position"); Hunter/Chad MIN +3.5 ("gravitating"); Perrault KC -10 (survivor chat); BettingPros JAX -8.5 (host lean, **quote invented**); Wormeli BUF/MIN Under ("not touching it") |
| Speaker fixed | 1 | Sharp or Square SEA -10.5 is joint (Simon: "me and Chad"), not Chad alone |
| Soft pick | 1 | Hunter LAR -5.5 ("I'll grab it now... leaning heavily"); speaker probable, not named at the turn |
| **Missed firm picks** | **3** | Fitzmaurice **DAL/IND Under 51.5**; BettingPros show LAR/WAS Under 47.5 and CLE/NO Under |
| Dropped leans | 15 | Incl. Tucker BAL +9.5, Fezzik LV/SF Over ("strong lean"), both lean HOU, Chad wants MIA at +7.5 |

**System-wide:** prices filled in as -110 on 48 of 50 picks (none spoken); **units never recorded** although Even Money states them
on every pick; 5 of 9 stored quotes not verbatim. The sweep summary's "0 unknown speakers via on-screen identifiers" is false for
the BettingPros lines show (extraction used captions only).

**Bottom line:** about 80% of the digest is accurate. The errors are not random: they lean toward over-promoting leans into picks
and taking lines from the market instead of the speaker. One side is reversed.

## Corrected consensus by game (firm picks only; units where stated)

| Game | Positions |
|---|---|
| JAX @ BAL (TNF) | **Under** x3: Fezzik 2u and Tucker 2u at 42.5, BettingPros show at 43.5. No firm side (Tucker leans BAL +9.5; Hunter and BettingPros lean JAX) |
| DEN @ CAR | **Carolina** x5: Hunter +2.5 (Simon Says), BettingPros show +3, Fezzik and Tucker (2u) CAR teaser to 8.5; **vs** Perrault DEN -2.5. The original digest showed this as split |
| DET @ MIA | **Dolphins +7**: Tucker 2u (best bet), Fezzik 1u. Works against Andy's open DET ML leg |
| CIN @ ATL | **Falcons +3** x3 (Fitzmaurice, BettingPros show, Tucker 1u); BettingPros show Over 51.5 |
| BUF @ MIN | **Vikings +3.5**: Fezzik 2u and Tucker 2u (both best bets); BettingPros show BUF -3.5; Perrault 1H Under |
| ARI @ SEA | **Seattle -10.5**: Perrault, Hunter + Millman jointly; Tucker ARI +10.5 1u; BettingPros show Under 45 |
| LAR @ WAS | WAS +5.5 (Tucker 2u, BettingPros show) vs Hunter LAR -5.5 (soft); BettingPros show Under 47.5 (missed in digest) |
| HOU @ LAC | **Under**: Fezzik 2u at 40.5, BettingPros show at 41.5 (favorite of the card); BettingPros show HOU -4.5 |
| CLE @ NO | CLE teaser to 8.5 (Fezzik, Tucker 2u) vs BettingPros show NO -3.5 and Under |
| GB @ NE | Split total: Fezzik Over 46.5 2u vs Erickson Under 47.5; Tucker GB teaser 8.5 |
| NYJ @ KC | Chad Jets +9.5 (Chad's Choice); Fezzik Over 46.5 1u. Perrault's "KC blowout" was survivor talk, not a bet |
| NYG @ PHI | BettingPros show NYG -2.5 vs Fezzik PHI +3.5 1u |
| LV @ SF | Tucker LV +10 1u; BettingPros show Over 51.5 (Fezzik leans Over) |
| TB @ CHI | Fitzmaurice TB +5.5; BettingPros show Under 47.5 |
| DAL @ IND | Fitzmaurice Under 51.5 (missed in digest) |

## For grading and the Sunday sweep
- Grade Week 9 from the `.claude-verified.json` companion (price null -> -110 by rule; leans excluded from records; units kept).
- Antigravity Pass 2: price null unless spoken; units when spoken; speaker "unknown"/show-level unless named at the turn;
  lines as spoken (not from the schedule); leans in a separate list; run `scripts/master-intel/verify_staging_quotes.py` with zero MISS.
