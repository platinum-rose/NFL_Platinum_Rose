# Contested Data Points — youtube-qoCm4G2Jmng ("Sharp or Square," Top 10 QBs)

Source: `data/shadow-harness/recovery/youtube-qoCm4G2Jmng-local-recovery.json`
Episode: https://www.youtube.com/watch?v=qoCm4G2Jmng (2026-07-28)
Status: `local_recovery_context_only` — recovery pipeline marked `usable_for_frontier_synthesis: false`

Everything below comes from segments the recovery report itself flagged as lower-confidence (`possible_repeated_intro`) or that contain apparent name/entity swaps in the audio. Timestamps are shown as min:sec (link still jumps to the exact second). Watch/listen at each timestamp and mark Confirm or Deny. Nothing here should be treated as evidence until reviewed.

## Roster cross-check pass (2026-07-31)

Per Andy's note that AJ Brown was traded to New England, several of the "parody-swap" flags the extraction raised look like the extraction model reasoning from a stale (pre-trade) roster rather than an actual audio dub. Cross-checked against `data/vault-seed/nflverse/rosters_weekly.csv` (2026 week-1 snapshot) and current Bears coaching-staff data:

- **AJ Brown → NE** (confirmed; no longer on PHI's roster in this file)
- **Jalen Hurts → PHI** (unchanged)
- **Drake Maye → NE** (unchanged) — so AJ Brown and Drake Maye are now teammates
- **Chicago Bears 2026 staff**: Head Coach = Ben Johnson (`team-coaching-tendency-snapshots-2025-w18.json`); Offensive Coordinator = Shane Waldron (`training-camp/2026/all-32-camp-notes-2026-07-31.json`, dated today) — both are real, current names, not a swap of one fictional/wrong name for another

This resolved B1 and B2 below without needing to watch the video. It doesn't resolve B3, since both "Ben Johnson" and "Shane Waldron" are legitimately real 2026 Bears staff — that one is a title/role question, not a stale-roster question. C4/C5 are historical claims ("last year's" rankings) that a current roster can't verify either.

If it'd be useful, I can turn this into a small script that checks every contested note for a team/teammate implication and flags roster-inconsistent ones automatically — this pass was done by hand for the specific conflicts already documented here.

---

## A. Full ranked lists (segment 35:00–42:00, flagged `possible_repeated_intro`)

### A1. Chad Millman's Top 10 QBs — [40:43](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2443s)
1. Josh Allen (BUF)
2. Lamar Jackson (BAL)
3. Patrick Mahomes (KC)
4. Joe Burrow (CIN)
5. Drake Maye (NE)
6. Matthew Stafford (LAR)
7. Jordan Love (GB)
8. Dak Prescott (DAL)
9. Justin Herbert (LAC)
10. Caleb Williams (CHI)

- [ ] Confirm  [ ] Deny  Notes: ______

### A2. Simon Hunter's Top 10 QBs — [40:43](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2443s)
1. Patrick Mahomes (KC)
2. Matthew Stafford (LAR)
3. Jalen Hurts (PHI)
4. Josh Allen (BUF)
5. Lamar Jackson (BAL)
6. Joe Burrow (CIN)
7. Dak Prescott (DAL)
8. Baker Mayfield (TB)
9. Justin Herbert (LAC)
10. Caleb Williams (CHI)

- [ ] Confirm  [ ] Deny  Notes: ______

### A3. Rich Hribar's "Corrected" Top 10 QBs — [40:03](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2403s)
1. Josh Allen (BUF)
2. Joe Burrow (CIN)
3. Lamar Jackson (BAL)
4. Justin Herbert (LAC)
5. Patrick Mahomes (KC)
6. Matthew Stafford (LAR)
7. Drake Maye (NE)
8. Dak Prescott (DAL)
9. Jalen Hurts (PHI)
10. Brock Purdy (SF)

- [ ] Confirm  [ ] Deny  Notes: ______
- Recovery note claims Hribar says he "accidentally overlooked Drake Maye on his initial sheet" and corrects live — worth confirming this correction actually happens on air. See D1 below for his earlier partial list.

---

## B. Apparent name-swap / dub flags (called out by the extraction itself)

These are the most suspect — the recovery notes explicitly flag the audio as possibly referring to one player while a different name is written down.

### B1. Chad Millman — Rank #5 — [20:21](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=1221s) — ✅ RESOLVED
- Recovered as: "Chad ranks Jalen Hurts (parodied/referred to as Drake Maye in the audio) at #5, mentioning that AJ Brown could make him better."
- Resolution: AJ Brown is on NE with Drake Maye, not PHI with Jalen Hurts (roster trade). "AJ Brown could make him better" only makes sense for Maye. Also consistent with A1, where Chad's full list already has Drake Maye at #5 and Jalen Hurts doesn't appear anywhere else in his top 10.
- [x] Confirm (roster-consistent)  [ ] Deny  Notes: extraction's parody-swap guess was likely reasoning from a pre-trade roster

### B2. Rich Hribar — Rank #7 — [20:57](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=1257s) — ✅ RESOLVED
- Recovered as: "Rich ranks Drake Maye (likely referencing Jalen Hurts or another parody-swapped name) at #7."
- Resolution: Rich's own list already places Jalen Hurts separately at #9 ("Rich's QBs - Rank 9: Jalen Hurts... loses AJ Brown" — also roster-consistent, since Hurts stayed on PHI and did lose AJ Brown). A QB can't be ranked twice in the same list, so #7 has to genuinely be Drake Maye, not a duplicate/swap of Hurts. Matches A3's "corrected" list, which has both Maye (#7) and Hurts (#9) as distinct entries.
- [x] Confirm (roster-consistent)  [ ] Deny  Notes: internally consistent with rest of Rich's list, no swap needed

### B3. Caleb Williams' offensive coordinator — [20:00](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=1200s), [41:14](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2474s), [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s) — still needs a listen
- Recovery notes repeatedly say Chad references "Ben Johnson" as Caleb Williams' OC and separately flag this as "a parody/swapped coaching name" for Shane Waldron, and once describe Johnson as "the dog coordinator who won't let him regress."
- Roster check: unlike B1/B2, this one doesn't auto-resolve — both names are real 2026 Bears staff (Ben Johnson = head coach, Shane Waldron = offensive coordinator, per `data/generated/team-profiles/team-coaching-tendency-snapshots-2025-w18.json` and `data/training-camp/2026/all-32-camp-notes-2026-07-31.json`). So this is a title/role question (did Chad correctly credit the OC, or mix up HC/OC), not a stale-roster name swap.
- [ ] Confirm  [ ] Deny  Notes: ______

---

## C. Restated claims (segment 42:00–49:00, also flagged `possible_repeated_intro`)

### C1. Caleb Williams ranked #10 by Chad Millman (restated) — [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s)
- [ ] Confirm  [ ] Deny  Notes: ______

### C2. Brock Purdy left off Chad's top 10, "narrowly at #11" — [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s)
- Claim: Chad left Purdy off despite top-4 EPA/dropback and success rate, citing injury/talent-around-him concerns.
- [ ] Confirm  [ ] Deny  Notes: ______

### C3. Justin Herbert #9, called a "consensus pick on all three hosts' lists" — [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s)
- [ ] Confirm  [ ] Deny  Notes: ______

### C4. Matthew Stafford MVP-controversy callback — [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s)
- Claim: "last year" Simon ranked Stafford #5 and Chad left him off entirely, before Stafford won NFL MVP.
- [ ] Confirm  [ ] Deny  Notes: ______

### C5. Dak Prescott "consensus" claim — [48:39](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=2919s)
- Claim: Simon was the only host to place Dak Prescott on his 2025 list.
- [ ] Confirm  [ ] Deny  Notes: ______

---

## D. Cross-check: Rich Hribar's earlier partial reveal vs. his "corrected" list

### D1. Partial list at [20:35](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=1235s)–[20:57](https://www.youtube.com/watch?v=qoCm4G2Jmng&t=1257s) (segment 14:00–21:00, not flagged) vs. full "corrected" list at 40:03 (segment 35:00–42:00, flagged) — mostly resolved
- Partial reveal order recovered: #10 Brock Purdy, #9 Jalen Hurts, #8 Dak Prescott, #7 "Drake Maye" (see B2 above).
- "Corrected" list (A3) has: #7 Drake Maye, #8 Dak Prescott, #9 Jalen Hurts, #10 Brock Purdy — same players, reordered.
- Roster check: player values themselves are consistent (see B2) — both lists agree Maye is #7 and Hurts is #9. What's still unconfirmed is the narrative: whether Hribar actually says on air that he "overlooked Drake Maye" and corrects live, or whether that framing is an extraction artifact from stitching two segments together.
- [ ] Confirm  [ ] Deny  Notes: ______

---

## Not yet recoverable

`youtube-OAxHvrVUPpw` (NFC South) has no local recovery file yet — nothing to review there until a recovery pass is run.
