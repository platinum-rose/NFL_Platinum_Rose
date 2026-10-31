# Week 8 synthesis digest — Saturday delta build

Built 2026-10-31 ~4:15 PM PT. STAGE=saturday. Supersedes the Friday review build (kept at scratch/w08-synthesis-digest-sat.fri-build.md).

PROPOSALS ONLY. Nothing placed, logged to a wager ledger, promoted, published or written to Supabase. All 13 sides syntheses were RE-RUN Saturday (one independent agent per game, 2026-10-31 3:20-3:30 PM PT; RUNLOG lines appended); Friday copies in reports/intel/games/_friday-w08/. Props syntheses are carried from Friday (Saturday BetOnline re-scrape skipped by Andy for an early send). Model: reports/intel/w08-model/fair-lines-w08-synth.json (Saturday BKR lines + Saturday judgment adjustments, soft cap 2.0; Friday copy fair-lines-w08-synth.fri.json). These are judgment-adjusted simulation estimates, not calibrated forecasts.

Tier 1=matchup/role;2=named expert;3=market;4=price-only. Letter grades from the per-game syntheses. Repeat audio/YouTube from the same speaker is one opinion. Action Network PRO Systems rows are systems, not experts.

## A. Freshness and source disposition

| Input | Status | Scope |
|---|---|---|
| Saturday Final Gate | Sides queue PASS; props queue RED only for thin BetOnline Sunday boards (re-scrape skipped by Andy) | reports/intel/gates/w08-final-gate-saturday.md |
| BKR lines/props | Saturday 2:26-2:31 PM PT, capture date 2026-10-31 | 13 games; CHI@SEA Monday menu thin; Friday copies in data/generated/props/_friday-20261031/ |
| AN splits | Saturday 2:23 PM PT | reports/engineering/week8-an-browser-pull-2026-10-31-sat/raw.json |
| Articles (auto ingest) | through ~2:33 PM PT Saturday | VSiN, PFT, AN, ESPN, Rotowire, Sharp Football; BettingPros auto feed through 7:54 AM |
| Articles (Chrome) | Saturday ~3:05 PM PT | AN hub (Kolodziej PRO Systems piece; primer feeds unchanged), BettingPros 5 new articles; data/intel/extracted/2026-w08-chrome-article-picks.json |
| Podcasts/YouTube | Antigravity zero-cost caption sweep, Saturday | 177 picks / 22 episodes (68 new from 9 Saturday episodes); digest week filter fixed (Antigravity's 297-row rebuild included 120 Week 6/7 picks) |
| X bookmarks | sync 2:45-2:51 PM PT Saturday | 28 new posts; pull 425 signals; 4 videos queued (untranscribed) |
| Injuries / starters | Saturday 2:33 / 2:45 PM PT | FantasyPros feed (ESPN feed skipped); per-game agents checked official reports by web |
| BEO player props | Saturday 2:14 PM PT pre-gate board (972 rows, thin) | parser fix for 2 new market titles; Sunday props largely unposted |
| Weather | Friday 6:02 PM PT forecast (not refreshed; device cannot reach Open-Meteo) | under recs in IND@JAX / NE@MIA / ATL@TB lean on wind |

## B. Slate and quantitative baseline (Saturday)

| Game | BKR home spread | BKR total | Fair home spread | Fair total |
|---|---:|---:|---:|---:|
| ARI@DAL | -7 | 54.5 | -6.4 | 52.5 |
| ATL@TB | -2.5 | 43.5 | -3 | 42.5 |
| BAL@BUF | -3 | 55 | -2.5 | 56 |
| CHI@SEA | -3 | 46 | -2.25 | 45 |
| CLE@PIT | -3.5 | 38.5 | -2.5 | 38.5 |
| IND@JAX | -10 | 46 | -10.5 | 44.5 |
| KC@DEN | +1 | 40 | +1.4 | 39.4 |
| LAC@LAR | -6.5 | 45 | -5.5 | 44.5 |
| LV@NYJ | -1.5 | 45.5 | -1.75 | 45.5 |
| MIN@DET | -3 | 45.5 | -2.7 | 45 |
| NE@MIA | +7 | 43.5 | +6 | 41.5 |
| PHI@WAS | -6 | 40.5 | -5 | 42 |
| TEN@CIN | -13 | 46 | -12.5 | 46.25 |

Line moves since Friday 6:52 PM: CIN -11.5 -> -13; NYJ -1 -> -1.5; MIN@DET total 46 -> 45.5; KC@DEN total 40.5 -> 40. CAR@GB FINAL (GB 27, CAR 19), excluded. Sunday early kickoff 10 AM PST after DST ends; SNF 5:20 PM PST; Monday 5:15 PM PST.

## C. Sides and totals: Platinum Rose recommendations

| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| ARI@DAL | total | Under | conf 56.1%; fair 52.5; pace-neutral; ARI patched line and field-goal red zone; Betting Pros Under 52.5; Torbert under trend; Saturday splits 40/40 (over money edge gone). Source: reports/intel/games/2026-w08-game-ARI_at_DAL-sides.md | 1+2 (B) | Under 54.5 (-108). Risk: both defenses bottom five by EPA; BKR team totals sum to 54; Pickens/Froholdt still Q, roof undecided. Playable to: Under 53.5 -110; pass at 53. |
| BAL@BUF | total | Over | conf 53.1%; fair 56; BUF offense #1 EPA, defense #31; Lamar expected to start (PFT/ESPN 10/30); Saturday over money 82% on 56% bets (gap 26); Betting Pros Over 53.5. Source: reports/intel/games/2026-w08-game-BAL_at_BUF-sides.md | 1+2 (B) | Over 55 (-101). Risk: sharps bought 52.5-53.5, 55 has less room (edge 1.0); Lamar first game back and not confirmed by Andy; Wk7+ totals 53+ went 33-44-1 to the over. Playable to: Over 55 -110; C at 55.5; pass at 56. |
| IND@JAX | total | Under | conf 54.7%; fair 44.5; IND #26 offense after Nelson/Buckner trades; JAX rush DVOA -31.1%; Betting Pros Under 46.5; two Bet Labs under systems; AN PRO High Winds + Divisional Unders systems (not double-counted); Saturday forecast post 15 mph, gusts 25. Source: reports/intel/games/2026-w08-game-IND_at_JAX-sides.md | 1+2 (B) | Under 46 (-103). Risk: IND turnovers can hand JAX 30+; Jonathan Taylor trade talk (ESPN Sat) — if traded/inactive the under strengthens; JAX FTN through W6. Playable to: Under 45.5 -110; pass at 45. |
| NE@MIA | total | Under | conf 56.0%; fair 41.5; Friday forecast ~20 mph wind/80% rain; MIA 56.5 plays and 29.5 sec/play; Patriots ruled out A.J. Brown, TreVeyon Henderson and T Marcus Bryant (official, Sat); AN PRO High Winds system. Source: reports/intel/games/2026-w08-game-NE_at_MIA-sides.md | 1 (B) | Under 43.5 (-111). Risk: weather-driven; forecast ~44 h old; if Sunday wind under 12 mph downgrade to C and pass at 43; MIA #30 defense. Playable to: Under 42.5 -115; pass at 42. |

All four recs carry sourced Pitch/Pushback entries in reports/intel/master-pitches-2026-w08.json (Saturday evidence added). No side or moneyline is elevated. Note: BAL@BUF Over clears the bar on matchup + sharp-money + expert support but its point edge (1.0) is below the ~1.5 guideline; kept elevated as on Friday, flagged for Andy.

## L. Leans: not elevated

| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| ATL@TB | total | Under | Fair 42.5; 53.0% under; Over 73% bets / 53% money (sharp-under flag); AN PRO High Winds (overlaps wind already counted). Source: reports/intel/games/2026-w08-game-ATL_at_TB-sides.md | 1+2 flag (C) | Under 43.5 (-112). Not elevated: only 1 pt edge; weather data Friday. |
| CHI@SEA | spread | CHI | Fair SEA-2.25; 52.1% ex-push at +102; new SEA expert picks (Abrams, Youmans, Bogman); Charles Cross Doubtful (stale). Source: reports/intel/games/2026-w08-game-CHI_at_SEA-sides.md | 1+2 (C) | CHI +3 (+102). Not elevated; B only at +3.5. |
| CHI@SEA | total | Under | Fair 45.0; 83% of over money with total holding at 46; BEO 46.5 better number. Source: reports/intel/games/2026-w08-game-CHI_at_SEA-sides.md | 1 (C) | Under 46 (-106). Not elevated. |
| CLE@PIT | spread | CLE | Fair PIT-2.5; 52.7% vs 53.05% breakeven at -113; Tytus Howard Q (concussion). Source: reports/intel/games/2026-w08-game-CLE_at_PIT-sides.md | 1+2 (C) | CLE +3.5 (-113). Not elevated; playable only -110 or better. |
| KC@DEN | total | Under | NEW Saturday: total 40.5 -> 40 against 76% over tickets; fair 39.4; 51.9% vs 50.7%; Youmans (VSiN) Under 40.5. Source: reports/intel/games/2026-w08-game-KC_at_DEN-sides.md | 1+2 (C) | Under 40 (-103). Not elevated: 0.6 pt edge; pass at 39.5 or -110. |
| KC@DEN | moneyline | KC | Fair KC -121 (54.7%); 4 starters Q (KC CBs Sneed/Delane, DEN Allen/Jones). Source: reports/intel/games/2026-w08-game-KC_at_DEN-sides.md | 1 (C) | KC ML (-112). Not elevated; pass at -120. |
| LAC@LAR | total | Under | Fair 44.5; new 11-pt sharp flag on the OVER (80% money / 69% bets); adjustment trimmed. Source: reports/intel/games/2026-w08-game-LAC_at_LAR-sides.md | 1 (C) | Under 45 (+101). Not elevated; pass at -110 or 44.5. |
| MIN@DET | spread | MIN | Fair DET-2.7; +105 at the key number; Pulver MIN +3/ML; Servodidio DET ML + Hockenson ATD is a hedged combo (Hockenson is MIN). Source: reports/intel/games/2026-w08-game-MIN_at_DET-sides.md | 1+2 (C) | MIN +3 (+105). Not elevated; pass at +2.5. |
| ARI@DAL | moneyline | ARI | 29.5% win vs 28.4% breakeven; DAL ML 90% bets / 34% money (sharp flag on ARI). Source: reports/intel/games/2026-w08-game-ARI_at_DAL-sides.md | 2 flag (C) | ARI ML (+252). Not elevated; thin upset-only lean. |
| PHI@WAS | spread | PHI | NEW Saturday: price -113 -> -107; fair WAS-5.0; 52.8% vs 51.7%; Payne (WAS DT) out for season. Source: reports/intel/games/2026-w08-game-PHI_at_WAS-sides.md | 1 (C) | PHI +6 (-107). Not elevated; pass at +5.5 or -113. Same thesis as PHI ML: do not stack. |
| PHI@WAS | total | Over | Fair 42; 54.5%; 87% of money on the over with total stuck at 40.5 (BEO 40). Source: reports/intel/games/2026-w08-game-PHI_at_WAS-sides.md | 1 (C) | Over 40.5 (-108). Not elevated; pass at 41.5. |
| PHI@WAS | moneyline | PHI | Fair +195; WAS ML 83% tickets / 43% money (gap narrowed from 50 to 40). Source: reports/intel/games/2026-w08-game-PHI_at_WAS-sides.md | 1+2 flag (C) | PHI ML (+232). Not elevated; playable to +205. |

Dropped from Friday's lean list: BAL +3 (price -105 -> -108, now PASS) and LAC +6.5 (price -109 -> -113, now PASS).

## D. Passed sides and totals

No forcing a selection: LV@NYJ all markets pass (NYJ -1.5 lean only; every new Saturday pick is on LV); TEN@CIN spread/total/ML pass (lean flipped to TEN +13 after the move to -13); BAL@BUF spread/ML pass; LAC@LAR spread/ML pass; IND@JAX spread/ML pass; NE@MIA spread/ML pass (MIA +7 -117 fails price); MIN@DET total/ML pass; ATL@TB spread/ML pass; CLE@PIT total/ML pass; ARI +7 -116 fails price; KC@DEN spread pass.

## E. Prop pool and stack construction

| Game | Candidate | Friday BKR ref | Grade | Evidence / counter |
|---|---|---:|---|---|
| TEN@CIN | Cam Ward UNDER 191.5 passing yards | -107 | B | 1/7 above 191.5; Tate OUT; CIN 31.8% pressure. Counter: Tennessee trailing volume and a single explosive play. Source: reports/intel/games/2026-w08-game-TEN_at_CIN-props.md |
| IND@JAX | Jonathan Taylor UNDER 57.5 rushing yards | -113 | B | JAX rush DVOA-31.1%,72 rushyd/g; Nelson traded; JAX lead. Counter: Taylor breaks a long run; best IND engine retained. Source: reports/intel/games/2026-w08-game-IND_at_JAX-props.md |
| CLE@PIT | Jaylen Warren OVER 24.5 receiving yards | -104 | B | 7/7 above 24.5; median 34; CLE 23.6% blitz drives checkdowns. Counter: CLE man coverage takes away back outlets; Pittsburgh leads on ground. Source: reports/intel/games/2026-w08-game-CLE_at_PIT-props.md |
| BAL@BUF | Lamar Jackson OVER 1.5 passing TD | -102 | B | 6 TD in 3.5 starts; BUF 15 pass TD allowed/6 g; Over 55 script. Counter: First game back; rushing TD s or limited mobility; shares QB exposure with team total. Source: reports/intel/games/2026-w08-game-BAL_at_BUF-props.md |
| MIN@DET | Amon-Ra St. Brown OVER 7.5 receptions | +119 | B | 11.3 targets/g;8+catches 4/6; MIN blitz invites slot throws. Counter: Murray slows pace; Gibbs ground scores;8 target floor is not guaranteed. Source: reports/intel/games/2026-w08-game-MIN_at_DET-props.md |
| ATL@TB | Bijan Robinson UNDER 80.5 rushing yards | -108 | B | TB 3.4 YPC/74 rushing yards allowed per game; Bijan 61/63 lasttwo; no opponent team above 106 rushing yards. Counter: Brian Robinson OUT gives more carries; sustained rain shifts ATL to run. Source: reports/intel/games/2026-w08-game-ATL_at_TB-props.md |
| ARI@DAL | Michael Wilson UNDER 57.5 receiving yards | -104 | C | 5/7 under; median 55; fits U 54.5 and quick-game emphasis on McBride. Counter: DAL pass DVOA 40.9%;40+attempts can lift all receivers. Source: reports/intel/games/2026-w08-game-ARI_at_DAL-props.md |
| LV@NYJ | Kirk Cousins OVER 239.5 passing yards | -107 | B | 6/7 over;268 yd/g and 36.7 att/g; NYJ edge injuries (Bailey doubtful, not OUT). Counter: LV run revival or Bowers limitation cuts efficiency; Jets milk clock. Source: reports/intel/games/2026-w08-game-LV_at_NYJ-props.md |
| LAC@LAR | Blake Corum OVER 47.5 rushing yards | -109 | B | W7 17-93;5 YPC; LAC 124 rushing yards allowed per game; Rams lead/run lean. Counter: Kyren takes the work; Corum season 9.1 carries/g cannot guarantee 17. Source: reports/intel/games/2026-w08-game-LAC_at_LAR-props.md |
| NE@MIA | Malik Willis UNDER 16.5 completions | -106 | B | 5/6 under; wind/rain/run-first 56.5 plays/g; Proctor OUT. Counter: NE builds large lead and forces passing volume; rain forecast fades. Source: reports/intel/games/2026-w08-game-NE_at_MIA-props.md |
| KC@DEN | Bo Nix UNDER 15.5 rushing yards | -107 | B | 6/7 under; median 9; KC 3%sackrate means fewer pressure scrambles. Counter: Week 7 75 yards shows mobility ceiling; few third-down scrambles decide it. Source: reports/intel/games/2026-w08-game-KC_at_DEN-props.md |
| PHI@WAS | Chig Okonkwo OVER 3.5 receptions | +116 | B | 4/7 rec in Daniels last 2 starts; PHI seam weakness and defensive absences. Counter: Only two recent starts; White/other TEs compete for middle targets. Source: reports/intel/games/2026-w08-game-PHI_at_WAS-props.md |
| CHI@SEA | Jaxon Smith-Njigba OVER 7.5 receptions | +105 | B | 11.1 targets/g;36.1%share;80.8%first-read; SEA expectedwinner. Counter: CHI plays bracket coverage or run game carries SEA; Shaheed active redistributes volume. Source: reports/intel/games/2026-w08-game-CHI_at_SEA-props.md |

Thirteen per-game analyst review files live in `scratch/w08-prop-agent/`. Probabilities/fair odds/edge are null because this pass lacks a validated prop probability model; no implied bookmaker probability is relabeled as a forecast. ARI uses Wilson under instead of a receptions over on the projected loser. Receptions overs in the pool are DET/WAS/SEA, the saved SU choices.

One game per leg in every cross-game prop template. BEO only; BKR SGPs stay within one game and exclude QB INT. No prop round robins. Templates are alternatives, not a cumulative card; repeated legs across alternative templates share exposure. No current K/IDP/sack/INT board exists in the combined Friday BKR capture: Pressure/Field-goal tickets await named lines and prices; none invented. Gibbs ATD-371 fails the-350 barrier and is excluded. Conditional Bowers/Pickens/Hall legs are left out of core stacks.

## F. Availability, deltas and rec-affecting ambiguity

- NE: A.J. Brown (knee + high ankle), TreVeyon Henderson (illness) and T Marcus Bryant OUT (patriots.com / TSN, Sat). A "career ending" / trade-talk tweet is UNVERIFIED and unused. Weather is the main under input; forecast ~44 h old.
- IND: Jonathan Taylor trade talk (ESPN Sat); BKR pulled backup RB Seth McGowan's market and cut Taylor's rush line 61.5 -> 49.5 since Thursday (inference: holding for trade news). Gould/Walley/A. Johnson OUT; Ogletree/Boettcher/Meyers Q.
- BAL: Lamar expected to start (10/30 reports); Saturday packet has no Andy-confirmed QB notes. Inactives ~8:30 AM PT; if Lamar is out, lean BUF -3 and the Under.
- ARI@DAL: Pickens and Froholdt still Q; roof undecided. If Pickens sits, fair ~DAL -5.5 and the under holds.
- PHI@WAS: Barkley status at SNF inactives (~3:50 PM PT); Payne out for season; McKee starts (Hurts IR).
- CHI@SEA: Shaheed OUT; Charles Cross listed Doubtful (stale); Nelson starts at LG for SEA.
- KC@DEN: Sneed, Delane, Zach Allen, Brandon Jones Q; Waddle status unresolved; RJ Harvey IR.
- ATL@TB: Bucs RT Luke Goedeke unresolved (Q Friday); Falcons LB Divine Deablo OUT.
- CLE@PIT: Tytus Howard Q (concussion, neurologist clearance).
- Saturday packets had empty qb_operator_notes; agents took QBs from projected starters / AN primer / team sites.
- Expert noise excluded: Week 6/7 YouTube rows removed by the digest week filter; teaser legs (DEN +7.5, LV +7.5) not compared to full-game lines.

## G. Saturday gate advisory warnings and remaining actions

- S2 props queue: BetOnline Sunday boards thin (NE@MIA 26, CHI@SEA 36, PHI@WAS 38 rows); Andy skipped the Saturday re-scrape for an early send — prop stacks use BKR boards and the Saturday 2:14 PM BEO board.
- L7 DraftKings Predictions props stale (needs Andy's login). L8 prediction-market coherence 22 h old.
- E5 Gemini audio diarization: prepay credits depleted (HTTP 402); podcasts covered by Antigravity's zero-cost caption pipeline.
- Expert source review (reports/intel/expert-review-2026-w08.json) hash no longer matches the rebuilt YouTube picks file; its exclusions are not applied (Known Gaps).
- Four X videos queued, untranscribed (xEP TD spots, Simon Charles, The Herd, MySpariEdge).
- Weather not refreshed since Friday 6:02 PM PT.
- Sunday morning: inactives ~8:30 AM PT (early window), BKR/BEO recapture optional.

## H. SuperContest

AI proposal unchanged: CIN -10.5 (tier A Saturday: market moved to -13, 2-pt edge), BAL +3.5 (B), CLE +3.5 (C), LAC +6.5 (thin; first to swap), CHI +3 (weakest; swap for any B alternative). Alternates: MIN +3.5 (C), MIA +7 (C), JAX -9.5 (lean only). Spread-only, distinct from the four straight total recommendations and any official locked card.

## I. Existing placed exposure

Historical existing tickets 740983886 and 740984963 remain as previously recorded in the card's reference section; no wager ledger or amount was changed. Their Washington cap is contingent, not spare hedge bankroll. New templates do not assert placement or booked prices.
