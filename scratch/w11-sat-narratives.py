import re
p = 'reports/intel/master-intel-narratives-2026-w11.md'
s = open(p, encoding='utf-8').read()
LINES = {'MIA@BUF': (-16, 44.5), 'NO@CHI': (-11.5, 48), 'TEN@DAL': (-7, 55), 'TB@DET': (-3.5, 47), 'ARI@KC': (-16, 41), 'PIT@PHI': (4, 37.5),
         'BAL@CAR': (-3, 43.5), 'NYJ@LAC': (-3, 42), 'LV@DEN': (-10.5, 40.5), 'JAX@NYG': (5.5, 46), 'MIN@SF': (-3.5, 46.5), 'CIN@WAS': (6, 54)}
SAT = {
 'MIA@BUF': 'Saturday update: pass on both. Bookmaker moved to BUF -16 (44.5); the fair line is BUF -15.8, so the side carries almost no edge. Kyle McCord starts with Malik Willis on IR. Andrew Erickson and Kendra Middleton both backed Miami +16.5, which is why MIA +16.5 is a SuperContest pitch on the contest number rather than a straight bet.',
 'NO@CHI': 'Saturday update: Under 48 is a lean; New Orleans is a pass. Three Saints offensive-line starters are out (Erik McCoy, Taliese Fuaga, Asim Richards). Rain chances run 85-94% with gusts to 26 mph at Soldier Field. BetOnline Under 48.5 is the better number. The fair total is 48.0, so the lean rests on conditions, not the model.',
 'TEN@DAL': 'Saturday update: pass at Bookmaker TEN +7. Take Tennessee only at +8 or better: BetOnline still had +9 at -125 at 5:46 pm, and the SuperContest number is +8. Tyjae Spears went to IR, which concentrates the backfield on Tony Pollard. Dallas is missing DaRon Bland, Jake Ferguson and P.J. Locke.',
 'TB@DET': 'Saturday update: pass on the side and total. CAVEAT: Mayfield Questionable. Bookmaker moved from DET -6 to -3.5 (total 47), so the market expects Baker Mayfield to start; the fair line is DET -4.6. The value sits in the SuperContest TB +7 (3.5 points over market), backed by Doug Kezirian and sharp action at +7 and +6.5.',
 'ARI@KC': 'Saturday update: no recommendation. CAVEAT: Josh Johnson preparing to start (Beck Q). Bookmaker holds KC -16 and 41. Wind gusts near 25 mph and a backup quarterback support the Under that Andrew Erickson and Skooshi backed, but the fair total is 43.2, so the Under stays research only. Arizona and Kansas City player-prop boards are thin at both books.',
 'PIT@PHI': 'Saturday update: Pittsburgh -4 is a lean, flipped from the Friday Philadelphia lean. The fair line makes Philadelphia only a 6.2-point underdog (2.2 points of edge to Pittsburgh), and Andrew Erickson backed PIT -4.5. Nick Herbig is out for Pittsburgh. Joe Milton makes his second start. The total is a pass, with the Under priced at -124.',
 'BAL@CAR': 'Saturday update: pass on both. Bookmaker moved onto CAR -3 (43.5) and the fair line is CAR -2.9. Jacoby Brissett starts for Baltimore with Lamar Jackson on IR. The SuperContest CAR -2.5 is an alternate because the contest number wins on a field-goal margin.',
 'NYJ@LAC': 'Saturday update: NYJ +3 (-103) is the one Platinum Rose pick. The fair line is LAC +0.2, the largest gap on the slate. The Chargers are missing S Kendall Williamson and CB Rodney Shelley, and Geno Smith was cleared from his ankle issue. NYJ +3.5 is also a SuperContest pitch.',
 'LV@DEN': 'Saturday update: pass on the side. Experts split: Doug Kezirian and Lock & Cash on Denver, Kendra Middleton on Las Vegas, and the fair line DEN -8.9 sides with the Raiders at +10.5. The fair total of 44.2 flags the Over 40.5, but no pick. DEN -10 is a SuperContest alternate on the half point.',
 'JAX@NYG': 'Saturday update: JAX -5.5 is a lean, flipped from the Friday Giants lean. The fair line makes the Giants an 8-point underdog (2.5 points of edge to Jacksonville), matching the verified Lock & Cash call. Bookmaker -5.5 beats BetOnline -6. The total is a pass in the rain.',
 'MIN@SF': 'Saturday update: Under 46.5 is a lean; the side is SF only at -3. Kirk Cousins starts at quarterback in Mexico City (altitude, 61% rain at kickoff). The fair total is 44.9. Bookmaker has SF -3.5, so the -3 lean lives in the SuperContest pitch SF -3. The fair line is SF -5.',
 'CIN@WAS': 'Saturday update: CIN -6 is a lean, flipped from the Friday Washington lean. Washington lost OT Laremy Tunsil and RB Jacory Croskey-Merritt to IR, and the fair line makes the Commanders an 8.1-point underdog. Bookmaker -6 beats BetOnline -6.5. The total is a pass; the Over is now -117. Recheck both rosters Monday.',
}
s = s.replace('Friday provisional research. Scores are Bookmaker-implied baselines from the saved capture.',
              'Saturday provisional research (Andy approved the synthesis ~6:10 pm PT, Nov 21). Scores are Bookmaker-implied baselines from the 5:43 pm PT capture. Friday text is retained below each Saturday update.')
def fmt(x): return ('%g' % x)
for g, (h, t) in LINES.items():
    a, hm = g.split('@')
    hp, ap = (t - h) / 2, (t + h) / 2
    s, n = re.subn(rf'(## {re.escape(g)}\nprojection: )[^\n]*', rf'\g<1>{a} {fmt(ap)}, {hm} {fmt(hp)}', s); assert n == 1, g
    blk = re.search(rf'## {re.escape(g)}\n.*?(?=\n## |\Z)', s, re.S)
    b = blk.group(0)
    b2 = re.sub(r"Bookmaker's saved spread and scoring line imply [^\n]*", f"Bookmaker's 5:43 pm PT spread and total imply {a} {fmt(ap)}, {hm} {fmt(hp)}.", b)
    b2 = b2.replace('### Why the card leans this way\n', f'### Why the card leans this way\n{SAT[g]}\n\n', 1)
    assert b2 != b
    s = s.replace(b, b2)
tail = '''## TICKETS

Saturday research produced one Platinum Rose straight pick: NYJ +3 (-103). Leans (not elevated): JAX -5.5, PIT -4, CIN -6, MIN@SF Under 46.5, NO@CHI Under 48. Multi-leg tickets and standalone props stay on hold. Any TB or ARI item carries the QB caveat tags.

## SUPERCONTEST

- TB: Saturday pitch. +7 is 3.5 points better than Bookmaker's +3.5. CAVEAT: Mayfield Questionable.
- TEN: Saturday pitch. +8 runs a full point through 7 against Bookmaker's +7.
- NYJ: Saturday pitch. +3.5 runs through 3; the fair line makes it a 3.7-point edge.
- SF: Saturday pitch. -3 wins on a field-goal margin that Bookmaker's -3.5 loses; the fair line is SF -5.
- MIA: Saturday pitch. +16.5 sits 0.7 points past the fair line, with three named experts on Miami.
- CAR: Saturday alternate. -2.5 wins on a field-goal margin against Bookmaker's -3.
- DEN: Saturday alternate. -10 is half a point better than Bookmaker's -10.5; the fair line favors Las Vegas, so it stays an alternate.

## GAPS

- PROVISIONAL: the Saturday final gate is RED on S2 only. Player-prop boards for TB@DET and ARI@KC are thin at both Bookmaker and BetOnline (expected to post near kickoff). Recapture Sunday and rebuild before final use; no PDF or publication.
- QB caveats (Andy, 11/21): TB "Mayfield Questionable"; ARI "Josh Johnson preparing to start (Beck Q)". The ESPN depth chart still lists Beck. Confirm both at Sunday inactives.
- Prop Dealer is a temporary no-card exception; he publishes Sunday morning.
- Four X image posts from the 3:45 pm bookmark pass were not read (Chrome disconnected): two parlays and two streak sheets.
- Action Network splits are 9+ hours old and carry no weight. DraftKings Predictions quotes are from Thursday.
- Gemini extraction remains unavailable (billing depleted). Podcast evidence comes from transcripts reviewed by Antigravity and the saved digests.
- The November 20 SuperContest standings snapshot includes overall and quarterly scores. Payout amounts are unavailable.
'''
s = re.sub(r'## TICKETS\n.*\Z', tail, s, flags=re.S)
open(p, 'w', encoding='utf-8').write(s)
print('narratives updated', s.count('Saturday update:'))
