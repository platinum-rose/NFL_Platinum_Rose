# Week 11 TNF IND @ HOU: Island stacks (Wed 11/18 ~3:45 PM PT)

**Proposals only; nothing placed or logged.** Template: docs/NFL_WEEKLY_CARD_PROCESS.md slot 9, under the W11 rules: **Island cash only at +400 to +1500 (S21); Tiers 2-3 promo only**; DKP up to 6 legs (S1); max 2 tickets per player on the slate (S5); core-four first, 3-4 legs at +300 to +600 (S16); props PLAY at 4+ pts over no-vig with probabilities shrunk halfway to market (S20); Unders first, core-four Overs exempt (S20/#15).
Checked: `python scripts/cards/check_overlap.py --week 11 --date 2026-11-19 --candidates data/official-picks/candidates-w11-tnf.json` -> no break on the candidate.

## Tonight: DKP Tier 1 with the 20% combo profit boost (expires today)
| Leg | DKP (Tue 5:30 PM feed) | History 2026 (W1-10) | Shrunk prob | Market (no-vig) | Edge |
|---|---|---|---|---|---|
| Daniel Jones 1+ INT | -156 | INT in 9 of 10 games (2 in W10) | 74% | ~59% (DKP) | +15 |
| Daniel Jones 1+ pass TD | -150 | TD in 7 of 10 | 63% | 55% (BKR -136/+116 today) | +8 |
| Xavier Hutchinson 3+ rec | -170 | 3+ in 8 of 9 (4 on 9 tgts W10) | 73% | 57% (DKP 2.5 -163/+117) | +16 |

Price: **+334 base, about +401 with the 20% profit boost.** Stake per template: **$10** (DKP is off the official bankroll).
Narrative: HOU (-13 BKR, -12.5 DKP) controls; Jones is chasing all night against a defense that picks him off (10 INT in 9 games, 2 more in W10) but gets a garbage-time TD; with Higgins and Noel on IR, Hutchinson stays a volume piece behind Collins (Dell is back: 4 and 3 catches in W9-10, Hutchinson still 3 and 4).
**Price gate:** place only if the slip shows **+334 or better before the boost** (keeps the boosted price inside the +400 Island cash band). Each player (Jones, Hutchinson) now has 1 of 2 slate tickets used (S5).
Dropped after the W10 refresh: Stroud U2.5 pass TD (3 TD in W10; 6 of 9 under, no edge vs DKP -223) and Tyler Warren 4+ rec (2 catches in W10; 6 of 8, no edge at -335). Mallory (TE) is OUT, which helps Warren's volume, but not enough at that price.

## Tomorrow (Thu 11/19, kickoff 5:15 PM PT): remaining stacks
Before building: Andy runs `.\runbolprops.cmd` and `npm run props:dkp:cron` in the morning (BOL props failed the size gate Tuesday; DKP leg prices are from Tue 5:30 PM). Inactives ~3:45 PM PT.
- **T1 #2 (cash, +400 to +1500, BKR or BOL):** candidate theme "Texans volume": Nico Collins receptions (16 targets / 9 catches in W10; Higgins and Noel on IR), Jonathan Taylor rushing one notch below his main line (16 carries in W10), HOU kicker/IND kicker FG legs if priced. No Jones/Hutchinson unless that player's 2nd and last slate ticket.
- **T2 (promo only, +1800-3000):** "Stroud shootout": Stroud 3+ pass TD (+161 BKR; 3 TD in W10), Collins yards milestone, Dell/Schultz catches.
- **T3 (promo only, +6500-20000):** "Colts backdoor": Jones 2+ pass TD (+284 BKR), Taylor ATD (+133 DKP), Gould/Treadwell catches, IND covers +13 (side legs need a PLAY from the game synthesis, so promo only).
Each of these gets live prices, the 4+ pt edge check, and the overlap check before it goes on the card.

## Intel status (Wed 3:45 PM PT)
- Captured today: BKR game lines + props (2:01 PM, IND@HOU board 204 rows), BOL main board (2:10 PM), DKP game lines (2:20 PM), injuries + projected starters (3:00 PM), Action Network openers/history (9 AM), article review (126 records). nflverse play-by-play refreshed to W10 for this check only (repo copy still ends at W9: run `node scripts/fetch-nflverse.mjs`).
- **Gemini is out of prepaid credits (HTTP 402):** Twitter OCR/pick extraction and the podcast pipeline are stalled (3 episodes in error, 8 pending, incl. Sharp or Square W11 and PFF MIN-SF). Top up in AI Studio.
- Not built yet: W11 fair lines, synthesis queue, TNF game synthesis (no side/total PLAY exists, so no side/total legs on cash tickets).
- TNF injuries: IND CB Charvarius Ward and TE Will Mallory OUT, WR Anthony Gould Q, WR Alec Pierce IR. HOU LB Azeez Al-Shaair IR; WRs Jayden Higgins and Jaylin Noel IR; Woody Marks missing practice, David Montgomery full practice.

## Higher-payout options for tonight (added Wed 4:10 PM PT; candidates-w11-tnf-20to1.json)
Pick ONE for the boost (it is one combo). Legs priced from the Tue DKP feed; BOL 3:31 PM confirms Jones INT/TD and Hutchinson.
- **8-1, cash OK:** Jones 1+ INT / Jones 1+ pass TD / Hutchinson 3+ rec / Schultz 30+ rec yds (-113; 7 of 9, main line 29.5). +718 base, ~+862 boosted.
- **21-1, promo only under S21 (or Andy overrides):** the 8-1 plus Jonathan Taylor 60+ rush yds (+138; 7 of 10, but DKP main line is 50.5 and in his one 10+ point underdog game, W8 @ JAX, he had 8 carries for 23 yds). +1848 base, ~+2218 boosted. Taylor is the weak leg.
Either one puts Jones, Hutchinson and Schultz at their 2-ticket TNF cap if the 3-leg ticket is also placed (S5).
**Update 4:10 PM PT (Andy):** DKP combos are promo tickets, funded from the DKP winnings balance ($413 on 11/18) until it runs out. The 21-1 is therefore a promo ticket and S21 does not block it. Log DKP tickets with funding_type `promo_dkp_winnings_balance` while that balance lasts.
**Repriced Wed 4:11 PM PT (fresh DKP feed):** Jones 1+ INT -170, Jones 1+ TD -138, Hutchinson 3+ rec -163, Schultz 30+ rec yds +104 (was -113), Taylor 60+ rush +138 (main line 51.5). 3-leg +341 / ~+410 boosted; 4-leg +801 / ~+961; 5-leg +2045 / ~+2454 boosted.

## Thursday build (11/19 ~1:40 PM PT) — supersedes the Wednesday options
Prices: BOL main board 10:11 AM; DKP event feed 1:01 PM (boosts posted: 20% on an IND vs HOU trade; 20% combo profit boost). nflverse PBP + snap counts through W10.
Candidates: data/official-picks/candidates-w11-tnf-final.json; check_overlap: no break (S16 note on A; Hutchinson at the 2-ticket cap).
- **A, cash Tier 1, BetOnline ($10):** Jones o0.5 INT -180 (9/10) / Jones o0.5 pass TD -150 (7/10) / Hutchinson o2.5 rec -180 (8/9) / Schultz o29.5 rec yds -115 (7/9). ~+655.
- **B, DKP promo Tier 2 (boosted):** Taylor 60+ rush +144 (7/10; 23 yds in his one 10+ pt dog game) / Calen Bullock 3+ tackles -122 (7/9, six straight) / Kamari Lassiter 4+ tackles +127 (6/9) / Hutchinson 3+ rec -170. +1501 base, ~+1801 boosted.
Dropped: Foster Moreau (0 catches in his last 3 games; earlier screen counted only games with a catch).
Gates: inactives ~3:45 PM; A slip at +550 or better; B at +1350 or better before the boost.
