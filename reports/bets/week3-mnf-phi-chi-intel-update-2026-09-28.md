# Week 3 MNF PHI @ CHI — article + podcast intel sweep (Claude Team 2, Mon 2026-09-28 ~15:00 PT)

Supplements `week3-mnf-phi-chi-prop-stacks-2026-09-28.md`. Sources: Supabase `podcast_transcripts` + `research_pick_signals` (read-only, last 72h) and 4 MNF articles re-read in full via Firecrawl. Nothing placed.

## Market now
PHI −3.5 (−110/−115), ML PHI −192/−210 / CHI +160/+172, total 41.5 (opened 43.5). The master RR #739361263 leg is PHI −3, still a half point better than the market.

## Status
- Keenum starts; Bagent (concussion cleared) is active as backup and could come in if Keenum struggles (Action Network).
- Saquon active, wearing a "cowboy collar" for the stinger (ESPN). Podcasts (BettingPros): stingers usually don't cost a week, "not going to baby him".
- Caleb Williams OUT (Grade 2 hamstring, maybe a month). PHI OUT: Goedert, Hollywood Brown, T Fred Johnson. CHI OUT: LB Noah Sewell, DT Shemar Turner.

## Picks by source (new today unless dated)
| Source | Pick | Price |
|---|---|---|
| Action Network — Lanfranca | PHI −3.5 | −110 |
| Action Network — Stuckey | CHI +3.5 | −105 |
| Action Network — Billy Ward | Over 41.5 | −105 |
| Action Network — Chris Prince | Luther Burden o32.5 rec yds | −106 |
| Action Network — Neiffer | Jalen Hurts ATD | ~38% |
| Action Network — Mahserejian SGP | Saquon ATD −105 · Burden 4+ rec −110 · Swift 3+ rec +137 | |
| ESPN — Liz Loza | Under 41.5; Kalif Raymond o24.5 rec yds | −110 |
| Podcast — BettingPros MNF Ep. 1077 (9/26) | PHI −4.5; U40.5; DeVonta Smith 6+ rec (both hosts); D. Smith ATD +190; Saquon o13.5 rec yds −113; Lemon 3+ rec (5-star); proj 27–10 PHI | |
| Podcast — "Early Week Mistakes … MNF Preview" (9/28) | U41.5; **Case Keenum 1+ INT −129** | |
| Podcast — NFL Touchdown Show (9/25) | Hurts ATD +150 · Burden ATD +295 · Odunze ATD +400 | |
| Podcast — Betting Playground (9/25) | CHI +5 / +4.5 | |

Twitter (earlier today): Sal Bets, Cody Brown, NoExpertFS, BetMGM money, MattyChucks — see the stacks card.

## Consensus read
- **Kalif Raymond:** 3 sources (Cody 3+ rec; ESPN Loza o24.5 yds; BetMGM money o23.5 yds), with a 5.0 aDOT safety-valve role for Keenum. Strongest CHI prop.
- **Wicks:** 3 (Cody, Sal, NoExpert). **Swift volume:** 4+ (Sal, NoExpert, Matty, BetMGM) plus Swift 3+ rec +137 (Action).
- **Burden:** 3 (Action ×2, BetMGM money). This is a trailing-script receiving prop, and our W1–3 rule wants the team projected for 35+ pass attempts. Keenum at 38 is unlikely to throw 35+ unless CHI trails big, so it's a hypothesis leg: keep it out of core tickets.
- **Hurts ATD:** 3 (Action, TD Show, Novig plan). **Saquon:** split. ATD (Action, Matty) vs U17.5 carries (Sal).
- **Total:** Under 3 (ESPN, 2 podcasts) vs Over 1 (Action). **Side:** split, PHI −3.5 (Action, BettingPros) vs CHI +3.5/+4.5 (Stuckey, Playground, sharp money).
- **Keenum INT:** 1 podcast at −129. It's in the QB INT-yes market ($1.41 per $1 on n=8 in W1–3, a hypothesis) and fits the "3rd-string QB vs PHI defense" read.

## Changes to tonight's card
- Ticket A unchanged (Swift 14+ car / Raymond 3+ rec / Wicks 42+ yds). The Raymond leg gained two more sources.
- New option **Ticket C — Keenum 1+ INT single, $10 (~−129)**, in the QB-market singles slot.
- Keep Burden, Odunze and Loveland out of core tickets. Burden 4+ rec is the best of the CHI trailing-script legs if you want one.

## Pipeline status (for the record)
- Podcast transcription is current: 6 episodes processed in the last 24h, the latest at 14:37 PT.
- **Pick extraction has not promoted picks since 9/25.** No 9/26–9/28 transcript has `picks_promoted_at`, so `user_picks` is stale. The Pick Extraction Agent run writes to Supabase, so it needs Andy's OK.
- The Sharp Football "Week 3 Takeaways and MNF Best Bets" (9/28) transcript is truncated at 24.7k chars. The MNF segment with Curtis is missing and 0 picks were extracted, so it needs a re-transcribe.
- The article extractor stores titles and odds fragments as "leans" for Action Network/ESPN (e.g. "Over 3.5", "Philadelphia is a -210"). The actual picks above came from re-reading the articles.

## MNF intel update (Mon PM, part 2) — Claude Team 3, ~16:25 PT
Read-only. No Supabase writes, nothing placed.

### Inactives (posted ~15:45 PT)
- **CHI OUT:** QB Caleb Williams, **LT Ozzy Trapilo**, OG Jordan McFadden, DE Jamree Kromah, DT Jayden Loving. **Keenum starts**; Bagent active as QB2.
- **PHI OUT:** TE Goedert, WR Hollywood Brown (Elijah Moore dresses), T Fred Johnson, QB McKee (emergency), QB Payton, EDGE Epenesa.
- **PHI active:** Saquon (no designation, two full practices Fri/Sat — reports now say standard workload), **Greenard active (Eagles debut)**, **Zach Ertz elevated from practice squad** (roster gate should now read ACTIVE; still no Ertz props).
- Net read: CHI playing a backup LT with a 3rd-string QB vs PHI pass rush with Greenard added → more pressure on Keenum.

### New sources since 15:00
| Source | Pick | Price |
|---|---|---|
| CBS Sports expert best bets | PHI −3.5 · **Keenum o0.5 INT** · **Wicks o41.5 rec yds** · Saquon ATD · Swift ATD | INT −127, Wicks +126 |
| FanDuel Research (9/28) | PHI −3.5 (−115) · **Wicks o41.5 rec yds (−113)** · Keenum o5.5 rush yds (−120) | |

### Pipeline (dry runs)
- `pick-extraction.js` (PICK_WEEK=3, DRY_RUN): 10 transcripts in window, 85 picks would upsert, 0 errors. MNF picks in it are ones already in part 1 (U41.5, Keenum INT, Hurts/Odunze/Burden ATD). Real run is bookkeeping for grading, not new intel — run with Andy's OK.
- `podcast-ingest.js` (DRY_RUN): **0 new episodes** across feeds.
- `research-intel-ingest.js --dry-run`: produced no output within 150s (hung after start). Not re-run.
- Sharp Football MNF transcript: `podcast-reextract.js` only re-extracts from the stored (truncated) transcript and uses OpenAI gpt-4o (account has no credits), so it can't recover the MNF segment. Needs a re-transcribe; deferred.
- Twitter bookmarks: none newer than the thepropdealer file.

### Changes to the card
- **Ticket A (Swift 14+ car / Raymond 3+ rec / Wicks 42+ yds): unchanged.** Wicks o41.5 now has 5 sources (Cody, Sal, NoExpert, CBS, FanDuel).
- **Ticket B: drop Saquon U17.5 carries.** The stinger-limited premise is gone (no designation, full practices, standard workload expected). Replace with **B′ — Hurts 2+ pass TD / Keenum 1+ INT, $10 SGP** (both ride a PHI-leads script; Trapilo out + Greenard in helps the INT).
- **Ticket C (Keenum 1+ INT single, ~−127/−129):** now 2 sources + pressure matchup. Play C **or** B′, not both, to keep Keenum-INT exposure to one ticket — prefer C if you want the single, B′ if you want the price.
- **Novig credit #2:** still prefer the confidence alternative (Swift 14+ car / Wicks 42+ yds, ± Raymond 3+ rec) over the 65x TE plan. Ertz's elevation adds another PHI TE mouth but doesn't change CHI's Loveland/Kmet problem.
