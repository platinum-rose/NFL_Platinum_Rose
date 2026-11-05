# Week 9 podcast digest review (Claude, 2026-11-04 ~8:00 AM PT)

Reviewed `data/podcasts/youtube-extracted-picks-2026-w09.json` (50 picks, 4 episodes, status pending_andy_review) against the saved
`.captions.txt` files. The digest itself was not edited (protocol). Checker: `scripts/master-intel/verify_staging_quotes.py` (new, read-only).

## Verdict: substance mostly right; three integrity problems. Don't promote as-is.

1. **Prices filled in.** 48 of 50 picks carry `price: -110` (the 2 survivor picks are null). In the captions I checked, no price was stated.
   Per protocol, price should be null unless stated. Grade Week 9 at -110 *because unstated*, not because a -110 was quoted.
2. **Quotes paraphrased or invented.** 5 of 9 `quote_timestamps` don't appear in the captions near their timestamp.
   Chad's Jets, Fitzmaurice's 49ers and the BettingPros HOU pick are fair paraphrases. **The BettingPros JAX -8.5 quote
   ("We're going to go Jacksonville minus eight and a half... grab it while you can") isn't in the transcript at all.**
3. **Speakers not verifiable in BettingPros `OtB_TD5uMgE`.** 16 of 17 picks are credited to Andrew Erickson, and the report claims
   "on-screen identifiers", but extraction worked from auto-captions, which have no speaker labels and drop some `>>` turn markers.
   Self-intros prove only who's on the show (Wormeli hosts, with Erickson), not who said each pick. The JAX -8.5 passage (2:22-3:39)
   is the line-reading host, who calls himself the Ravens fan, i.e. **Wormeli**; Erickson answers with a projection ("10 and a half,
   11 and a half"). Treat this episode's speakers as unknown pending a recheck.
   Sharp or Square and Even Money attributions check out where they matter (Ross says "Steve" right after Fezzik's pick;
   at 9:04 the speaker says "Chad just said", so it's Hunter).

## TNF JAX @ BAL: corrected read

| Source | Stated | What the captions support | Line then -> now |
|---|---|---|---|
| Steve Fezzik (Even Money) | Under 42.5, **2u best bet** | Verified @14:34 | 42.5 -> **40.5** |
| Ross Tucker (Even Money) | Under 42.5, 2u best bet | Verified @15:03; he also **leans BAL +9.5** (not extracted) | 9.5 -> 10 |
| Simon Hunter (Sharp or Square) | "JAX -9.5" | **Lean only**: "not going to take a big position... probably on the Jaguars in a couple different bets" | 9.5 -> 10 |
| BettingPros show (speaker unverified) | JAX -8.5 | Host lean ("how could you not like the Jags... under double digits"); Erickson projects 10.5-11.5 | 8.5 -> 10 |
| BettingPros show (speaker unverified) | Under 43.5 | "I like the under a lot here, too. 43 and a half" | 43.5 -> 40.5 |

**Read:** the experts lean Under, and the market has already gone their way (42.5-43.5 to 40.5, 2-3 points). The side is split:
soft JAX leans at 8.5-9.5 against Tucker's BAL lean, with the line now 10. Neither has a firm position at today's number.
Nobody assumed Lamar plays (Antigravity's "0 flags" holds).

## Fixes for the Sunday Pass 2 prompt
- `price`: null unless spoken. `speaker`: "unknown_<n>" unless the transcript itself names them (self-intro, direct address) at that turn.
- `quote`: must be a verbatim caption substring. Run `python scripts/master-intel/verify_staging_quotes.py youtube-<id>` before the digest; zero MISS lines allowed.
- Log leans as `lean` (not picks), e.g. Tucker BAL +9.5, Hunter JAX.
