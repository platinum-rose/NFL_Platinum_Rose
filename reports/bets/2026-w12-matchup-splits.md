# W12 matchup splits — all games (runbook §3a, auto)

Built from nflverse PBP through week 11 (163 games) + FTN charting + FTN Stats IQ `data/research-intel/source-evidence/2026-11-24-ftn-stats-iq`. Ranks: 1 = most (yards allowed / blitz / YPC). Proposals only.

**#2 coverage shell now from FTN team-defense/coverage + receiving/coverage-types (shell-fit YPRR = receiver YPRR weighted by opponent man/zone and 1-high/2-high mix; FAVOURED >= +10% vs season, FLAG <= -15%). #1 player alignment still not in any input.**

## GB@LAR
### GB offense vs LAR defense
- #3 no look: LAR blitz rk 19.0/32 (FTN BLZ% 28.0), GB scr rate 0.5%
- #4 no leak: LAR TE yds/g rk 21.0, TE TD rk 29.0
- #5 FADE RUN: GB YPC rk 32.0 vs LAR YPC-allowed rk 29.0 (both bad for run) -> fade RB yds, lean pass + correlated QB/WR
- #1 partial: LAR suppresses WRs (WR yds/g rk 31.0) -> GB WR yds overs flagged against alignment pending slot/outside data
- #2 shell: LAR man 39.8% (rk 9) / zone 59.4%, single-high 49.0% (rk 25) / two-high 45.9%; EPA/db man -0.12 zone -0.121 1-high -0.049 2-high -0.18
- Run: GB YPC 3.171 (vs 8+ box 6.9) | LAR allows 3.48, avg box 6.714
- Pass: GB EPA/db 0.112 (vs blitz 0.07, no blitz 0.138) | LAR EPA/db allowed -0.085, L/M/R -0.083/0.037/-0.081, blitz 0.282 (FTN BLZ% 28.0), WR/TE/RB rec yds/g 108.1/47.1/39.2
- Targets: M.Golden WR 102t (L3 32) aDOT 13.6 YPRR 2.34 EPA/t blitz 0.13 / none 0.24 | shell-fit YPRR 2.55 (+9%, neutral; man 2.65/zone 2.49/1H 2.92/2H 2.15); C.Watson WR 79t (L3 23) aDOT 14.1 YPRR 2.75 EPA/t blitz 0.49 / none 0.49 | shell-fit YPRR 3.0 (+9%, neutral; man 1.39/zone 3.94/1H 2.72/2H 3.49); T.Kraft TE 56t (L3 13) aDOT 6.2 YPRR 1.25 EPA/t blitz 0.22 / none 0.18 | shell-fit YPRR 1.39 (+11%, FAVOURED; man 1.05/zone 1.58/1H 1.54/2H 1.25); M.Lloyd RB 20t (L3 4) aDOT -0.7 YPRR None EPA/t blitz 0.26 / none 0.03 | shell: n/a; S.Williams WR 15t (L3 8) aDOT 7.5 YPRR None EPA/t blitz 0.76 / none 0.62 | shell: n/a; S.Moore WR 14t (L3 0) aDOT 5.1 YPRR None EPA/t blitz -0.81 / none -0.19 | shell: n/a
- #6 backs: M.Lloyd 61c 2.66ypc 2TD L3 7c in10 7 in5 3; K.Johnson 52c 4.12ypc 1TD L3 24c in10 3 in5 3; J.Jacobs 36c 2.22ypc 1TD L3 25c in10 7 in5 3; P.Strong [PS] 25c 2.36ypc 0TD L3 9c in10 2 in5 1
### LAR offense vs GB defense
- #3 no look: GB blitz rk 9.0/32 (FTN BLZ% 34.6), LAR scr rate 1.5%
- #4 no leak: GB TE yds/g rk 31.0, TE TD rk 18.0
- #5 neutral: LAR YPC rk 4.0, GB YPC-allowed rk 18.0
- #2 shell: GB man 24.4% (rk 27) / zone 73.4%, single-high 39.5% (rk 32) / two-high 54.6%; EPA/db man -0.045 zone -0.048 1-high 0.022 2-high -0.072
- Run: LAR YPC 4.805 (vs 8+ box 4.413) | GB allows 4.065, avg box 6.581
- Pass: LAR EPA/db 0.1 (vs blitz 0.02, no blitz 0.135) | GB EPA/db allowed -0.031, L/M/R 0.099/0.094/-0.025, blitz 0.348 (FTN BLZ% 34.6), WR/TE/RB rec yds/g 155.8/41.2/28.9
- Targets: P.Nacua [OUT] WR 93t (L3 31) aDOT 8.0 YPRR 2.73 EPA/t blitz 0.27 / none 0.18 | shell-fit YPRR 3.02 (+11%, FAVOURED; man 2.06/zone 3.26/1H 3.21/2H 2.98); K.Williams RB 51t (L3 10) aDOT 2.2 YPRR 1.20 EPA/t blitz -1.17 / none 0.27 | shell-fit YPRR 1.39 (+16%, FAVOURED; man 1.2/zone 1.34/1H 0.84/2H 1.93); D.Adams [OUT] WR 49t (L3 0) aDOT 15.5 YPRR 2.04 EPA/t blitz 0.42 / none 0.32 | shell-fit YPRR 2.02 (-1%, neutral; man 3.06/zone 1.83/1H 3.2/2H 0.95); T.Higbee TE 43t (L3 11) aDOT 8.0 YPRR 1.28 EPA/t blitz 0.43 / none 0.02 | shell-fit YPRR 1.42 (+10%, FAVOURED; man 0.97/zone 1.49/1H 0.94/2H 1.86); K.Mumpfield WR 27t (L3 8) aDOT 13.5 YPRR None EPA/t blitz -0.36 / none 0.08 | shell: n/a; C.Parkinson TE 25t (L3 6) aDOT 1.8 YPRR 1.07 EPA/t blitz 0.31 / none -0.19 | shell-fit YPRR 1.15 (+8%, neutral; man 0.77/zone 1.35/1H 1.62/2H 0.71)
- #6 backs: K.Williams 139c 4.43ypc 6TD L3 43c in10 16 in5 8; B.Corum 103c 5.31ypc 5TD L3 39c in10 7 in5 5; R.Rivers 20c 5.0ypc 0TD L3 15c in10 0 in5 0; P.Nacua [OUT] 7c 5.86ypc 1TD L3 2c in10 1 in5 1

## CHI@DET
### CHI offense vs DET defense
- #3 no look: DET blitz rk 20.0/32 (FTN BLZ% 27.0), CHI scr rate 6.6%
- #4 LOOK: DET TE leak (TE yds/g rk 3.0, TE TD rk 1.0) -> price CHI TE ATD
- #5 neutral: CHI YPC rk 11.0, DET YPC-allowed rk 23.0
- #2 shell: DET man 38.0% (rk 11) / zone 58.8%, single-high 57.2% (rk 12) / two-high 33.6%; EPA/db man 0.023 zone 0.212 1-high 0.029 2-high 0.37
- Run: CHI YPC 4.251 (vs 8+ box 1.261) | DET allows 3.765, avg box 6.887
- Pass: CHI EPA/db 0.067 (vs blitz 0.035, no blitz 0.09) | DET EPA/db allowed 0.103, L/M/R -0.026/0.556/0.293, blitz 0.273 (FTN BLZ% 27.0), WR/TE/RB rec yds/g 147.5/74.0/31.8
- Targets: L.Burden WR 69t (L3 22) aDOT 7.5 YPRR 2.29 EPA/t blitz -0.23 / none 0.31 | shell-fit YPRR 2.49 (+9%, neutral; man 2.62/zone 2.63/1H 1.81/2H 3.28); C.Loveland TE 60t (L3 18) aDOT 6.7 YPRR 1.33 EPA/t blitz -0.21 / none 0.24 | shell-fit YPRR 1.5 (+13%, FAVOURED; man 1.69/zone 1.33/1H 1.82/2H 1.03); R.Odunze WR 55t (L3 17) aDOT 14.4 YPRR 1.72 EPA/t blitz 0.79 / none 0.14 | shell-fit YPRR 1.79 (+4%, neutral; man 1.22/zone 2.04/1H 1.84/2H 1.91); K.Raymond WR 45t (L3 14) aDOT 7.7 YPRR 1.16 EPA/t blitz 0.1 / none 0.14 | shell-fit YPRR 1.33 (+14%, FAVOURED; man 1.58/zone 1.17/1H 1.37/2H 1.24); D.Swift RB 31t (L3 6) aDOT -1.0 YPRR 1.06 EPA/t blitz 0.32 / none -0.01 | shell-fit YPRR 1.0 (-5%, neutral; man 1.0/zone 1.08/1H 0.34/2H 2.02); C.Kmet [OUT] TE 14t (L3 0) aDOT 6.5 YPRR None EPA/t blitz 0.33 / none 0.47 | shell: n/a
- #6 backs: D.Swift 168c 3.73ypc 10TD L3 52c in10 27 in5 19; K.Monangai 68c 5.03ypc 3TD L3 8c in10 11 in5 6; R.Johnson 29c 3.55ypc 1TD L3 5c in10 4 in5 4; S.Ahmed 11c 5.27ypc 0TD L3 11c in10 1 in5 0
### DET offense vs CHI defense
- #3 no look: CHI blitz rk 10.0/32 (FTN BLZ% 34.3), DET scr rate 1.9%
- #4 no leak: CHI TE yds/g rk 22.0, TE TD rk 18.0
- #5 RUN EDGE: DET YPC rk 5.0 vs CHI allows rk 11.0 -> RB yds/ATD lean
- #2 shell: CHI man 35.4% (rk 14) / zone 63.8%, single-high 54.5% (rk 19) / two-high 41.6%; EPA/db man 0.035 zone -0.081 1-high -0.028 2-high -0.09
- Run: DET YPC 4.727 (vs 8+ box 3.75) | CHI allows 4.206, avg box 6.799
- Pass: DET EPA/db 0.203 (vs blitz 0.248, no blitz 0.179) | CHI EPA/db allowed -0.039, L/M/R -0.001/0.19/0.025, blitz 0.345 (FTN BLZ% 34.3), WR/TE/RB rec yds/g 151.1/46.9/36.1
- Targets: A.St. Brown WR 97t (L3 21) aDOT 8.1 YPRR 2.41 EPA/t blitz 0.4 / none 0.24 | shell-fit YPRR 2.49 (+3%, neutral; man 2.71/zone 2.34/1H 3.15/2H 1.66); S.LaPorta TE 59t (L3 15) aDOT 6.9 YPRR 1.60 EPA/t blitz 0.62 / none 0.26 | shell-fit YPRR 1.65 (+3%, neutral; man 1.49/zone 1.74/1H 1.39/2H 1.97); J.Gibbs RB 58t (L3 14) aDOT 0.4 YPRR 1.89 EPA/t blitz 0.26 / none 0.03 | shell-fit YPRR 1.96 (+3%, neutral; man 2.13/zone 1.91/1H 2.14/2H 1.63); J.Williams WR 57t (L3 13) aDOT 14.8 YPRR 1.88 EPA/t blitz 0.36 / none 0.52 | shell-fit YPRR 1.91 (+1%, neutral; man 1.27/zone 2.21/1H 1.29/2H 2.79); I.TeSlaa WR 31t (L3 10) aDOT 10.4 YPRR None EPA/t blitz 0.24 / none 0.09 | shell: n/a; S.Vaki RB 10t (L3 4) aDOT 2.3 YPRR None EPA/t blitz 0.02 / none 0.52 | shell: n/a
- #6 backs: J.Gibbs 223c 4.92ypc 13TD L3 65c in10 29 in5 21; S.Vaki 37c 4.38ypc 0TD L3 10c in10 1 in5 1; J.Goff 9c 1.22ypc 1TD L3 4c in10 1 in5 1; A.St. Brown 2c 4.5ypc 0TD L3 0c in10 0 in5 0

## PHI@DAL
### PHI offense vs DAL defense
- #3 LOOK: DAL low-blitz (rk 29.0/32) vs PHI scramble rate 6.1% -> QB rush overs
- #4 no leak: DAL TE yds/g rk 19.0, TE TD rk 16.0
- #5 neutral: PHI YPC rk 29.0, DAL YPC-allowed rk 1.0
- #2 shell: DAL man 47.1% (rk 2) / zone 50.7%, single-high 61.5% (rk 9) / two-high 31.6%; EPA/db man 0.249 zone 0.227 1-high 0.203 2-high 0.328
- Run: PHI YPC 3.38 (vs 8+ box 2.286) | DAL allows 5.176, avg box 6.538
- Pass: PHI EPA/db -0.111 (vs blitz -0.092, no blitz -0.121) | DAL EPA/db allowed 0.167, L/M/R 0.239/0.382/0.245, blitz 0.219 (FTN BLZ% 21.6), WR/TE/RB rec yds/g 153.727/49.545/36.727
- Targets: M.Lemon WR 57t (L3 21) aDOT 6.3 YPRR 0.82 EPA/t blitz 0.09 / none -0.02 | shell-fit YPRR 0.97 (+18%, FAVOURED; man 0.98/zone 0.96/1H 0.91/2H 1.1); D.Smith WR 53t (L3 12) aDOT 12.0 YPRR 2.06 EPA/t blitz -0.01 / none -0.09 | shell-fit YPRR 2.28 (+11%, FAVOURED; man 1.98/zone 2.39/1H 2.48/2H 2.17); D.Goedert TE 42t (L3 11) aDOT 6.4 YPRR 1.66 EPA/t blitz 0.42 / none 0.19 | shell-fit YPRR 1.53 (-8%, neutral; man 0.56/zone 2.14/1H 2.01/2H 1.06); D.Cooper WR 37t (L3 19) aDOT 12.1 YPRR None EPA/t blitz 0.22 / none 0.12 | shell: n/a; D.Wicks [OUT] WR 32t (L3 0) aDOT 13.1 YPRR 1.53 EPA/t blitz 0.32 / none 0.45 | shell-fit YPRR 1.66 (+8%, neutral; man 1.36/zone 1.81/1H 1.72/2H 1.73); E.Mitchell RB 14t (L3 10) aDOT -3.4 YPRR None EPA/t blitz -0.76 / none -0.42 | shell: n/a
- #6 backs: S.Barkley 86c 4.31ypc 4TD L3 43c in10 9 in5 6; D.Pierce 37c 2.59ypc 2TD L3 0c in10 6 in5 4; T.Bigsby 28c 3.25ypc 1TD L3 0c in10 3 in5 1; W.Shipley 24c 2.75ypc 1TD L3 4c in10 4 in5 2
### DAL offense vs PHI defense
- #3 no look: PHI blitz rk 26.0/32 (FTN BLZ% 24.0), DAL scr rate 5.0%
- #4 no leak: PHI TE yds/g rk 24.0, TE TD rk 18.0
- #5 neutral: DAL YPC rk 14.0, PHI YPC-allowed rk 20.0
- #1 partial: PHI leaks to WRs (rk 2.0); alignment split manual
- #2 shell: PHI man 40.2% (rk 8) / zone 58.0%, single-high 63.7% (rk 7) / two-high 29.6%; EPA/db man 0.232 zone 0.009 1-high 0.186 2-high -0.063
- Run: DAL YPC 4.122 (vs 8+ box 1.231) | PHI allows 3.889, avg box 6.41
- Pass: DAL EPA/db 0.171 (vs blitz 0.116, no blitz 0.197) | PHI EPA/db allowed 0.089, L/M/R 0.147/0.237/0.108, blitz 0.24 (FTN BLZ% 24.0), WR/TE/RB rec yds/g 175.3/44.7/17.7
- Targets: C.Lamb WR 135t (L3 41) aDOT 10.4 YPRR 2.56 EPA/t blitz 0.06 / none 0.34 | shell-fit YPRR 2.78 (+9%, neutral; man 2.29/zone 3.2/1H 2.41/2H 3.42); G.Pickens WR 92t (L3 30) aDOT 12.6 YPRR 1.99 EPA/t blitz 0.41 / none 0.3 | shell-fit YPRR 2.34 (+18%, FAVOURED; man 1.68/zone 2.41/1H 3.06/2H 1.51); R.Flournoy WR 56t (L3 11) aDOT 7.6 YPRR 1.23 EPA/t blitz 0.45 / none 0.27 | shell-fit YPRR 1.45 (+18%, FAVOURED; man 1.4/zone 1.36/1H 1.67/2H 1.2); J.Williams RB 33t (L3 9) aDOT -1.8 YPRR 0.72 EPA/t blitz 0.16 / none 0.13 | shell-fit YPRR 0.82 (+15%, FAVOURED; man 0.38/zone 1.05/1H 0.93/2H 0.74); J.Ferguson TE 27t (L3 2) aDOT 5.3 YPRR None EPA/t blitz -0.45 / none 0.18 | shell: n/a; B.Spann-Ford TE 26t (L3 8) aDOT 3.5 YPRR None EPA/t blitz 0.36 / none 0.08 | shell: n/a
- #6 backs: J.Williams 188c 4.04ypc 10TD L3 54c in10 29 in5 24; T.Goodson [OUT] 40c 4.08ypc 0TD L3 12c in10 0 in5 0; D.Prescott 8c 1.88ypc 0TD L3 2c in10 2 in5 2; K.Turpin 5c 12.0ypc 2TD L3 3c in10 1 in5 0

## KC@BUF
### KC offense vs BUF defense
- #3 no look: BUF blitz rk 8.0/32 (FTN BLZ% 35.0), KC scr rate 4.6%
- #4 no leak: BUF TE yds/g rk 11.0, TE TD rk 29.0
- #5 neutral: KC YPC rk 1.0, BUF YPC-allowed rk 21.0
- #2 shell: BUF man 29.5% (rk 20) / zone 69.1%, single-high 53.4% (rk 21) / two-high 42.5%; EPA/db man -0.067 zone -0.004 1-high 0.077 2-high -0.164
- Run: KC YPC 5.056 (vs 8+ box 6.111) | BUF allows 3.827, avg box 6.752
- Pass: KC EPA/db 0.19 (vs blitz 0.122, no blitz 0.218) | BUF EPA/db allowed -0.024, L/M/R -0.039/0.128/0.088, blitz 0.351 (FTN BLZ% 35.0), WR/TE/RB rec yds/g 144.4/56.2/36.1
- Targets: T.Kelce TE 57t (L3 15) aDOT 6.9 YPRR 2.12 EPA/t blitz 0.59 / none 0.5 | shell-fit YPRR 2.11 (-0%, neutral; man 2.49/zone 2.07/1H 2.5/2H 1.42); X.Worthy WR 54t (L3 13) aDOT 9.6 YPRR 0.92 EPA/t blitz 0.14 / none -0.04 | shell-fit YPRR 0.96 (+4%, neutral; man 1.35/zone 0.82/1H 0.83/2H 1.08); R.Rice WR 44t (L3 19) aDOT 5.6 YPRR 2.28 EPA/t blitz 0.41 / none 0.24 | shell-fit YPRR 2.56 (+12%, FAVOURED; man 1.07/zone 3.25/1H 2.21/2H 2.9); K.Walker RB 37t (L3 4) aDOT -0.7 YPRR 1.26 EPA/t blitz -0.05 / none 0.18 | shell-fit YPRR 1.31 (+4%, neutral; man 1.13/zone 1.42/1H 1.47/2H 1.09); E.Johnson RB 27t (L3 11) aDOT -2.2 YPRR 3.03 EPA/t blitz 0.35 / none 0.81 | shell-fit YPRR 3.22 (+6%, neutral; man 6.07/zone 2.09/1H 3.82/2H 2.35); N.Gray TE 25t (L3 9) aDOT 4.8 YPRR 1.40 EPA/t blitz 0.33 / none 0.27 | shell-fit YPRR 1.56 (+11%, FAVOURED; man 0.76/zone 1.91/1H 1.57/2H 1.52)
- #6 backs: K.Walker 159c 5.48ypc 7TD L3 18c in10 23 in5 15; E.Johnson 71c 4.46ypc 2TD L3 51c in10 3 in5 1; J.Ott 8c 3.88ypc 0TD L3 8c in10 0 in5 0; N.Carter 3c 3.0ypc 0TD L3 3c in10 0 in5 0
### BUF offense vs KC defense
- #3 no look: KC blitz rk 22.0/32 (FTN BLZ% 26.3), BUF scr rate 5.7%
- #4 no leak: KC TE yds/g rk 6.0, TE TD rk 12.0
- #5 neutral: BUF YPC rk 9.0, KC YPC-allowed rk 28.0
- #1 partial: KC suppresses WRs (WR yds/g rk 29.0) -> BUF WR yds overs flagged against alignment pending slot/outside data
- #2 shell: KC man 41.9% (rk 7) / zone 55.8%, single-high 46.8% (rk 29) / two-high 45.5%; EPA/db man -0.142 zone 0.005 1-high -0.14 2-high 0.057
- Run: BUF YPC 4.528 (vs 8+ box 2.5) | KC allows 3.526, avg box 6.645
- Pass: BUF EPA/db 0.18 (vs blitz 0.023, no blitz 0.268) | KC EPA/db allowed -0.07, L/M/R -0.0/-0.016/-0.07, blitz 0.265 (FTN BLZ% 26.3), WR/TE/RB rec yds/g 119.6/64.6/34.4
- Targets: K.Shakir WR 54t (L3 16) aDOT 6.6 YPRR 1.98 EPA/t blitz 0.44 / none 0.2 | shell-fit YPRR 2.02 (+2%, neutral; man 1.6/zone 2.18/1H 1.69/2H 2.54); D.Moore WR 48t (L3 21) aDOT 14.1 YPRR 2.40 EPA/t blitz -0.08 / none 0.43 | shell-fit YPRR 2.67 (+11%, FAVOURED; man 2.62/zone 2.64/1H 2.73/2H 2.69); D.Kincaid TE 42t (L3 6) aDOT 9.4 YPRR 2.56 EPA/t blitz 0.29 / none 0.56 | shell-fit YPRR 2.65 (+4%, neutral; man 3.19/zone 2.67/1H 3.84/2H 0.93); K.Coleman WR 41t (L3 13) aDOT 14.8 YPRR 1.33 EPA/t blitz 0.07 / none 0.51 | shell-fit YPRR 1.54 (+16%, FAVOURED; man 2.05/zone 1.3/1H 1.9/2H 1.03); T.Johnson RB 26t (L3 11) aDOT 0.1 YPRR 2.66 EPA/t blitz 0.06 / none 1.01 | shell-fit YPRR 2.98 (+12%, FAVOURED; man 2.57/zone 3.09/1H 2.09/2H 4.1); D.Knox TE 23t (L3 11) aDOT 3.7 YPRR None EPA/t blitz -0.09 / none 0.07 | shell: n/a
- #6 backs: J.Cook 209c 5.07ypc 10TD L3 71c in10 21 in5 13; J.Allen 36c 2.53ypc 9TD L3 8c in10 12 in5 11; R.Davis 17c 3.24ypc 0TD L3 6c in10 1 in5 1; T.Johnson 8c 1.62ypc 0TD L3 2c in10 2 in5 2

## DEN@PIT
### DEN offense vs PIT defense
- #3 no look: PIT blitz rk 18.0/32 (FTN BLZ% 28.1), DEN scr rate 2.6%
- #4 no leak: PIT TE yds/g rk 17.0, TE TD rk 18.0
- #5 FADE RUN: DEN YPC rk 25.0 vs PIT YPC-allowed rk 30.0 (both bad for run) -> fade RB yds, lean pass + correlated QB/WR
- #2 shell: PIT man 19.6% (rk 32) / zone 79.4%, single-high 54.9% (rk 16) / two-high 40.2%; EPA/db man 0.208 zone -0.015 1-high 0.098 2-high -0.077
- Run: DEN YPC 3.668 (vs 8+ box 3.533) | PIT allows 3.469, avg box 6.611
- Pass: DEN EPA/db 0.027 (vs blitz -0.134, no blitz 0.097) | PIT EPA/db allowed 0.017, L/M/R 0.141/0.179/0.007, blitz 0.282 (FTN BLZ% 28.1), WR/TE/RB rec yds/g 152.8/52.2/26.8
- Targets: J.Waddle WR 60t (L3 14) aDOT 10.9 YPRR 1.42 EPA/t blitz -0.24 / none 0.28 | shell-fit YPRR 1.77 (+25%, FAVOURED; man 1.63/zone 1.77/1H 1.91/2H 1.65); C.Sutton WR 49t (L3 16) aDOT 11.1 YPRR 0.86 EPA/t blitz -0.27 / none -0.08 | shell-fit YPRR 0.98 (+14%, FAVOURED; man 0.79/zone 1.05/1H 1.04/2H 0.88); E.Engram TE 38t (L3 16) aDOT 6.0 YPRR 1.08 EPA/t blitz -0.13 / none 0.23 | shell-fit YPRR 1.33 (+23%, FAVOURED; man 0.63/zone 1.49/1H 0.78/2H 2.09); R.Harvey [OUT] RB 28t (L3 0) aDOT -2.8 YPRR 2.41 EPA/t blitz 0.78 / none -0.03 | shell-fit YPRR 2.77 (+15%, FAVOURED; man 1.85/zone 3.0/1H 2.56/2H 3.05); P.Bryant [OUT] WR 22t (L3 9) aDOT 7.2 YPRR None EPA/t blitz -0.07 / none 1.35 | shell: n/a; J.Coleman RB 19t (L3 14) aDOT -1.9 YPRR None EPA/t blitz 1.39 / none 0.12 | shell: n/a
- #6 backs: J.Dobbins 99c 3.27ypc 3TD L3 12c in10 10 in5 8; J.Coleman 71c 4.25ypc 6TD L3 52c in10 13 in5 8; R.Harvey [OUT] 24c 3.62ypc 1TD L3 0c in10 1 in5 1; B.Nix 23c 1.57ypc 1TD L3 8c in10 6 in5 5
### PIT offense vs DEN defense
- #3 no look: DEN blitz rk 11.0/32 (FTN BLZ% 33.7), PIT scr rate 2.2%
- #4 LOOK: DEN TE leak (TE yds/g rk 4.0, TE TD rk 5.0) -> price PIT TE ATD
- #5 RUN EDGE: PIT YPC rk 2.0 vs DEN allows rk 6.0 -> RB yds/ATD lean
- #1 partial: DEN suppresses WRs (WR yds/g rk 28.0) -> PIT WR yds overs flagged against alignment pending slot/outside data
- #2 shell: DEN man 43.4% (rk 5) / zone 54.7%, single-high 62.1% (rk 8) / two-high 32.1%; EPA/db man 0.068 zone -0.066 1-high -0.052 2-high 0.075
- Run: PIT YPC 4.922 (vs 8+ box 2.333) | DEN allows 4.498, avg box 6.607
- Pass: PIT EPA/db -0.071 (vs blitz -0.172, no blitz -0.037) | DEN EPA/db allowed 0.007, L/M/R 0.001/0.185/0.127, blitz 0.342 (FTN BLZ% 33.7), WR/TE/RB rec yds/g 122.5/70.2/46.0
- Targets: D.Metcalf WR 75t (L3 17) aDOT 13.7 YPRR 1.01 EPA/t blitz 0.01 / none 0.03 | shell-fit YPRR 1.25 (+24%, FAVOURED; man 1.34/zone 1.13/1H 1.53/2H 0.8); G.Bernard WR 55t (L3 18) aDOT 6.3 YPRR 1.04 EPA/t blitz 0.03 / none -0.12 | shell-fit YPRR 1.21 (+17%, FAVOURED; man 1.12/zone 1.29/1H 1.52/2H 0.63); J.Warren RB 46t (L3 11) aDOT -1.6 YPRR 1.43 EPA/t blitz -0.11 / none 0.08 | shell-fit YPRR 1.63 (+14%, FAVOURED; man 1.3/zone 1.91/1H 1.83/2H 1.25); P.Freiermuth TE 43t (L3 10) aDOT 8.1 YPRR 1.14 EPA/t blitz 0.42 / none 0.25 | shell-fit YPRR 1.25 (+10%, neutral; man 1.0/zone 1.54/1H 1.11/2H 1.36); D.Washington TE 34t (L3 11) aDOT 5.3 YPRR 1.81 EPA/t blitz 0.2 / none 0.16 | shell-fit YPRR 1.91 (+5%, neutral; man 2.89/zone 1.04/1H 2.48/2H 0.92); R.Wilson WR 31t (L3 6) aDOT 15.2 YPRR None EPA/t blitz -0.89 / none 0.18 | shell: n/a
- #6 backs: J.Warren 135c 5.53ypc 2TD L3 33c in10 3 in5 3; R.Dowdle 56c 3.84ypc 1TD L3 25c in10 3 in5 1; L.Nichols 8c 6.12ypc 0TD L3 6c in10 1 in5 0; T.Homer 6c 2.5ypc 0TD L3 1c in10 1 in5 0

## NO@CIN
### NO offense vs CIN defense
- #3 no look: CIN blitz rk 32.0/32 (FTN BLZ% 16.5), NO scr rate 5.0%
- #4 LOOK: CIN TE leak (TE yds/g rk 2.0, TE TD rk 26.0) -> price NO TE ATD
- #5 neutral: NO YPC rk 31.0, CIN YPC-allowed rk 8.0
- #2 shell: CIN man 44.3% (rk 3) / zone 53.5%, single-high 59.9% (rk 10) / two-high 33.9%; EPA/db man -0.017 zone 0.079 1-high 0.206 2-high -0.191
- Run: NO YPC 3.241 (vs 8+ box 0.562) | CIN allows 4.457, avg box 6.462
- Pass: NO EPA/db 0.004 (vs blitz -0.073, no blitz 0.037) | CIN EPA/db allowed 0.025, L/M/R 0.095/0.288/0.071, blitz 0.167 (FTN BLZ% 16.5), WR/TE/RB rec yds/g 133.5/75.1/32.0
- Targets: C.Olave WR 102t (L3 31) aDOT 13.0 YPRR 2.08 EPA/t blitz 0.25 / none 0.37 | shell-fit YPRR 2.25 (+8%, neutral; man 2.39/zone 2.14/1H 2.47/2H 1.82); D.Vele WR 61t (L3 13) aDOT 9.7 YPRR 1.11 EPA/t blitz 0.22 / none 0.42 | shell-fit YPRR 1.25 (+13%, FAVOURED; man 1.36/zone 1.08/1H 1.58/2H 0.78); J.Johnson TE 43t (L3 6) aDOT 5.7 YPRR 1.09 EPA/t blitz 0.14 / none 0.3 | shell-fit YPRR 1.17 (+7%, neutral; man 1.26/zone 1.12/1H 1.16/2H 1.13); A.Kamara RB 37t (L3 10) aDOT 1.0 YPRR 1.34 EPA/t blitz -0.07 / none 0.07 | shell-fit YPRR 1.26 (-6%, neutral; man 0.34/zone 1.84/1H 1.18/2H 1.67); B.Lance WR 25t (L3 2) aDOT 12.5 YPRR None EPA/t blitz -0.1 / none -0.46 | shell: n/a; N.Fant TE 24t (L3 8) aDOT 5.0 YPRR None EPA/t blitz -0.75 / none 0.05 | shell: n/a
- #6 backs: K.Miller [check-roster] 57c 2.79ypc 2TD L3 0c in10 9 in5 5; T.Etienne 53c 4.15ypc 0TD L3 22c in10 5 in5 4; A.Kamara 50c 3.24ypc 3TD L3 9c in10 3 in5 3; A.Estime 22c 3.55ypc 1TD L3 22c in10 2 in5 2
### CIN offense vs NO defense
- #3 no look: NO blitz rk 5.0/32 (FTN BLZ% 36.3), CIN scr rate 2.7%
- #4 LOOK: NO TE leak (TE yds/g rk 7.0, TE TD rk 8.0) -> price CIN TE ATD
- #5 neutral: CIN YPC rk 24.0, NO YPC-allowed rk 10.0
- #2 shell: NO man 39.0% (rk 10) / zone 57.5%, single-high 67.7% (rk 2) / two-high 25.0%; EPA/db man -0.027 zone 0.161 1-high 0.177 2-high -0.051
- Run: CIN YPC 3.763 (vs 8+ box 2.0) | NO allows 4.386, avg box 6.602
- Pass: CIN EPA/db 0.246 (vs blitz 0.187, no blitz 0.278) | NO EPA/db allowed 0.057, L/M/R 0.162/0.138/0.191, blitz 0.37 (FTN BLZ% 36.3), WR/TE/RB rec yds/g 139.5/64.1/38.3
- Targets: J.Chase WR 96t (L3 35) aDOT 10.2 YPRR 2.35 EPA/t blitz 0.66 / none 0.51 | shell-fit YPRR 3.01 (+28%, FAVOURED; man 3.7/zone 2.54/1H 3.22/2H 2.43); T.Higgins WR 77t (L3 15) aDOT 12.8 YPRR 2.50 EPA/t blitz 0.7 / none 0.67 | shell-fit YPRR 2.87 (+15%, FAVOURED; man 2.78/zone 2.65/1H 3.48/2H 1.8); C.Brown HB 62t (L3 20) aDOT -0.6 YPRR 1.12 EPA/t blitz -0.19 / none -0.16 | shell-fit YPRR 1.16 (+4%, neutral; man 1.12/zone 1.21/1H 1.12/2H 1.23); M.Gesicki TE 34t (L3 10) aDOT 10.6 YPRR 1.20 EPA/t blitz 0.1 / none 0.77 | shell-fit YPRR 1.32 (+10%, neutral; man 0.7/zone 1.53/1H 1.71/2H 0.74); D.Meyers WR 30t (L3 7) aDOT 6.1 YPRR 1.17 EPA/t blitz 0.51 / none 0.11 | shell-fit YPRR 1.29 (+11%, FAVOURED; man 0.95/zone 1.39/1H 1.49/2H 1.08); S.Perine HB 19t (L3 8) aDOT 1.2 YPRR None EPA/t blitz 0.09 / none 0.29 | shell: n/a
- #6 backs: C.Brown 119c 3.76ypc 1TD L3 25c in10 9 in5 6; S.Perine 58c 3.78ypc 2TD L3 23c in10 6 in5 3; J.Burrow 9c 2.22ypc 2TD L3 2c in10 3 in5 3; T.Brooks 6c 3.0ypc 0TD L3 3c in10 0 in5 0

## LV@CLE
### LV offense vs CLE defense
- #3 no look: CLE blitz rk 21.0/32 (FTN BLZ% 27.1), LV scr rate 2.8%
- #4 no leak: CLE TE yds/g rk 16.0, TE TD rk 8.0
- #5 neutral: LV YPC rk 30.0, CLE YPC-allowed rk 5.0
- #2 shell: CLE man 53.7% (rk 1) / zone 45.0%, single-high 70.8% (rk 1) / two-high 25.3%; EPA/db man 0.081 zone -0.134 1-high 0.022 2-high -0.172
- Run: LV YPC 3.278 (vs 8+ box 2.95) | CLE allows 4.512, avg box 6.425
- Pass: LV EPA/db 0.068 (vs blitz 0.043, no blitz 0.078) | CLE EPA/db allowed -0.007, L/M/R -0.052/0.388/0.049, blitz 0.272 (FTN BLZ% 27.1), WR/TE/RB rec yds/g 143.3/53.1/18.9
- Targets: B.Bowers TE 72t (L3 10) aDOT 9.7 YPRR 2.46 EPA/t blitz 0.4 / none 0.52 | shell-fit YPRR 2.9 (+18%, FAVOURED; man 2.02/zone 3.16/1H 3.81/2H 1.68); A.Jeanty RB 68t (L3 19) aDOT 1.3 YPRR 1.89 EPA/t blitz 0.4 / none 0.07 | shell-fit YPRR 2.16 (+14%, FAVOURED; man 2.34/zone 1.9/1H 2.42/2H 1.46); T.Tucker WR 68t (L3 20) aDOT 14.1 YPRR 1.64 EPA/t blitz -0.25 / none 0.18 | shell-fit YPRR 1.7 (+4%, neutral; man 1.46/zone 1.92/1H 1.58/2H 2.15); M.Mayer TE 53t (L3 10) aDOT 5.1 YPRR 1.32 EPA/t blitz 0.37 / none 0.0 | shell-fit YPRR 1.28 (-3%, neutral; man 0.88/zone 1.66/1H 1.19/2H 1.68); J.Nailor WR 38t (L3 13) aDOT 11.6 YPRR None EPA/t blitz -0.57 / none -0.11 | shell: n/a; J.Bech WR 24t (L3 18) aDOT 8.0 YPRR None EPA/t blitz -0.24 / none 0.4 | shell: n/a
- #6 backs: A.Jeanty 134c 3.43ypc 1TD L3 26c in10 14 in5 10; M.Washington 88c 3.86ypc 1TD L3 23c in10 10 in5 7; K.Cousins [check-roster] 7c 0.57ypc 2TD L3 2c in10 3 in5 3; D.Laube 5c 1.8ypc 1TD L3 0c in10 1 in5 1
### CLE offense vs LV defense
- #3 no look: LV blitz rk 17.0/32 (FTN BLZ% 28.3), CLE scr rate 8.3%
- #4 LOOK: LV TE leak (TE yds/g rk 13.0, TE TD rk 3.0) -> price CLE TE ATD
- #5 neutral: CLE YPC rk 27.0, LV YPC-allowed rk 2.0
- #1 partial: LV leaks to WRs (rk 6.0); alignment split manual
- #2 shell: LV man 32.6% (rk 15) / zone 67.1%, single-high 55.1% (rk 15) / two-high 37.4%; EPA/db man 0.304 zone 0.164 1-high 0.222 2-high 0.227
- Run: CLE YPC 3.514 (vs 8+ box 2.125) | LV allows 4.967, avg box 6.508
- Pass: CLE EPA/db -0.006 (vs blitz -0.036, no blitz 0.01) | LV EPA/db allowed 0.163, L/M/R 0.311/0.419/0.178, blitz 0.285 (FTN BLZ% 28.3), WR/TE/RB rec yds/g 162.636/54.636/27.364
- Targets: D.Boston WR 64t (L3 21) aDOT 14.3 YPRR 1.43 EPA/t blitz -0.26 / none 0.29 | shell-fit YPRR 1.6 (+12%, FAVOURED; man 0.69/zone 2.0/1H 0.89/2H 2.7); K.Concepcion WR 63t (L3 18) aDOT 8.5 YPRR 1.43 EPA/t blitz 0.36 / none -0.02 | shell-fit YPRR 1.48 (+4%, neutral; man 2.39/zone 1.06/1H 1.56/2H 1.36); H.Fannin TE 62t (L3 23) aDOT 5.9 YPRR 1.68 EPA/t blitz 0.36 / none 0.35 | shell-fit YPRR 1.79 (+6%, neutral; man 1.37/zone 1.98/1H 1.9/2H 1.66); J.Jeudy WR 32t (L3 9) aDOT 11.3 YPRR 0.94 EPA/t blitz -0.59 / none 0.37 | shell-fit YPRR 1.04 (+11%, FAVOURED; man 0.54/zone 1.28/1H 0.96/2H 1.15); Q.Judkins RB 29t (L3 8) aDOT -2.3 YPRR 1.76 EPA/t blitz 0.43 / none -0.0 | shell-fit YPRR 1.91 (+8%, neutral; man 0.27/zone 2.61/1H 1.83/2H 2.17); D.Sampson RB 23t (L3 20) aDOT -0.2 YPRR None EPA/t blitz -0.47 / none 0.24 | shell: n/a
- #6 backs: Q.Judkins 126c 3.36ypc 4TD L3 36c in10 13 in5 9; D.Watson 25c 2.64ypc 2TD L3 6c in10 3 in5 0; D.Sampson 19c 4.16ypc 0TD L3 13c in10 0 in5 0; J.McLaughlin 11c 6.55ypc 1TD L3 0c in10 0 in5 0

## NYG@IND
### NYG offense vs IND defense
- #3 no look: IND blitz rk 31.0/32 (FTN BLZ% 21.0), NYG scr rate 4.4%
- #4 LOOK: IND TE leak (TE yds/g rk 23.0, TE TD rk 5.0) -> price NYG TE ATD
- #5 neutral: NYG YPC rk 26.0, IND YPC-allowed rk 3.0
- #2 shell: IND man 43.6% (rk 4) / zone 54.8%, single-high 55.9% (rk 13) / two-high 34.9%; EPA/db man 0.14 zone 0.035 1-high 0.07 2-high 0.185
- Run: NYG YPC 3.603 (vs 8+ box 3.156) | IND allows 4.63, avg box 6.743
- Pass: NYG EPA/db 0.058 (vs blitz 0.013, no blitz 0.082) | IND EPA/db allowed 0.074, L/M/R 0.218/0.178/0.151, blitz 0.21 (FTN BLZ% 21.0), WR/TE/RB rec yds/g 146.909/45.455/39.182
- Targets: M.Nabers WR 98t (L3 27) aDOT 11.4 YPRR 2.06 EPA/t blitz -0.0 / none 0.11 | shell-fit YPRR 2.22 (+8%, neutral; man 2.37/zone 2.04/1H 2.37/2H 2.06); I.Likely TE 84t (L3 20) aDOT 7.3 YPRR 1.82 EPA/t blitz 0.55 / none 0.16 | shell-fit YPRR 1.89 (+4%, neutral; man 1.45/zone 2.19/1H 1.93/2H 1.89); M.Fields WR 44t (L3 14) aDOT 14.2 YPRR 1.24 EPA/t blitz -0.19 / none 0.43 | shell-fit YPRR 1.31 (+6%, neutral; man 0.48/zone 1.82/1H 1.0/2H 2.02); D.Mooney WR 36t (L3 14) aDOT 15.8 YPRR None EPA/t blitz 0.1 / none -0.03 | shell: n/a; C.Skattebo RB 24t (L3 11) aDOT 1.2 YPRR None EPA/t blitz 0.05 / none -0.08 | shell: n/a; T.Johnson TE 13t (L3 4) aDOT 10.2 YPRR None EPA/t blitz -0.21 / none 0.47 | shell: n/a
- #6 backs: C.Skattebo 130c 4.08ypc 4TD L3 32c in10 8 in5 5; D.Singletary 41c 2.9ypc 1TD L3 23c in10 1 in5 1; N.Harris [check-roster] 32c 3.16ypc 0TD L3 0c in10 4 in5 3; T.Tracy 19c 2.89ypc 2TD L3 0c in10 3 in5 2
### IND offense vs NYG defense
- #3 no look: NYG blitz rk 4.0/32 (FTN BLZ% 38.5), IND scr rate 4.0%
- #4 no leak: NYG TE yds/g rk 26.0, TE TD rk 18.0
- #5 neutral: IND YPC rk 13.0, NYG YPC-allowed rk 14.0
- #1 partial: NYG suppresses WRs (WR yds/g rk 26.0) -> IND WR yds overs flagged against alignment pending slot/outside data
- #2 shell: NYG man 42.4% (rk 6) / zone 57.1%, single-high 53.7% (rk 20) / two-high 36.4%; EPA/db man -0.176 zone 0.114 1-high -0.08 2-high 0.17
- Run: IND YPC 4.209 (vs 8+ box 3.412) | NYG allows 4.149, avg box 6.768
- Pass: IND EPA/db -0.207 (vs blitz -0.204, no blitz -0.208) | NYG EPA/db allowed 0.006, L/M/R -0.223/0.408/0.128, blitz 0.387 (FTN BLZ% 38.5), WR/TE/RB rec yds/g 127.9/44.5/22.7
- Targets: T.Warren TE 61t (L3 15) aDOT 4.9 YPRR 1.09 EPA/t blitz -0.14 / none -0.24 | shell-fit YPRR 1.14 (+4%, neutral; man 0.89/zone 1.24/1H 1.46/2H 0.76); K.Allen [check-roster] WR 58t (L3 8) aDOT 8.0 YPRR None EPA/t blitz 0.42 / none -0.02 | shell: n/a; J.Downs [check-roster] WR 57t (L3 6) aDOT 9.6 YPRR None EPA/t blitz 0.59 / none 0.03 | shell: n/a; J.Taylor RB 45t (L3 14) aDOT -1.4 YPRR 0.98 EPA/t blitz 0.15 / none -0.26 | shell-fit YPRR 1.0 (+2%, neutral; man 1.27/zone 0.93/1H 1.1/2H 0.69); L.Treadwell WR 33t (L3 5) aDOT 11.2 YPRR None EPA/t blitz 0.23 / none -0.05 | shell: n/a; A.Dulin WR 15t (L3 8) aDOT 11.8 YPRR None EPA/t blitz -0.86 / none 0.16 | shell: n/a
- #6 backs: J.Taylor 188c 4.04ypc 8TD L3 40c in10 20 in5 16; S.McGowan 58c 5.03ypc 2TD L3 21c in10 4 in5 2; D.Jones [check-roster] 14c 1.79ypc 1TD L3 2c in10 3 in5 2; D.Giddens 7c 6.86ypc 0TD L3 1c in10 0 in5 0

## NYJ@MIA
### NYJ offense vs MIA defense
- #3 no look: MIA blitz rk 30.0/32 (FTN BLZ% 21.5), NYJ scr rate 4.2%
- #4 LOOK: MIA TE leak (TE yds/g rk 10.0, TE TD rk 8.0) -> price NYJ TE ATD
- #5 RUN EDGE: NYJ YPC rk 10.0 vs MIA allows rk 12.0 -> RB yds/ATD lean
- #1 partial: MIA suppresses WRs (WR yds/g rk 25.0) -> NYJ WR yds overs flagged against alignment pending slot/outside data
- #2 shell: MIA man 23.1% (rk 29) / zone 76.0%, single-high 52.3% (rk 22) / two-high 42.7%; EPA/db man 0.437 zone 0.044 1-high 0.284 2-high -0.03
- Run: NYJ YPC 4.257 (vs 8+ box 4.0) | MIA allows 4.19, avg box 6.631
- Pass: NYJ EPA/db 0.051 (vs blitz -0.005, no blitz 0.072) | MIA EPA/db allowed 0.142, L/M/R 0.252/0.253/0.178, blitz 0.215 (FTN BLZ% 21.5), WR/TE/RB rec yds/g 128.2/58.2/31.7
- Targets: G.Wilson WR 83t (L3 19) aDOT 11.0 YPRR 1.96 EPA/t blitz 0.25 / none 0.1 | shell-fit YPRR 2.06 (+5%, neutral; man 2.51/zone 1.92/1H 2.28/2H 1.81); A.Mitchell WR 45t (L3 18) aDOT 17.6 YPRR 1.72 EPA/t blitz 0.32 / none 0.19 | shell-fit YPRR 1.92 (+11%, FAVOURED; man 0.63/zone 2.38/1H 2.2/2H 1.45); K.Sadiq TE 36t (L3 9) aDOT 4.9 YPRR 1.51 EPA/t blitz -0.46 / none 0.14 | shell-fit YPRR 1.75 (+16%, FAVOURED; man 0.15/zone 2.34/1H 1.63/2H 1.71); M.Taylor TE 32t (L3 8) aDOT 8.2 YPRR 1.04 EPA/t blitz 0.74 / none -0.04 | shell-fit YPRR 1.11 (+7%, neutral; man 1.1/zone 1.1/1H 0.94/2H 1.34); B.Allen RB 26t (L3 4) aDOT -0.1 YPRR 0.62 EPA/t blitz -0.04 / none -0.13 | shell-fit YPRR 0.67 (+8%, neutral; man 0.14/zone 0.88/1H 0.58/2H 0.7); O.Cooper WR 24t (L3 11) aDOT 6.9 YPRR None EPA/t blitz 0.93 / none 0.51 | shell: n/a
- #6 backs: B.Allen 144c 4.95ypc 3TD L3 32c in10 4 in5 4; B.Hall 97c 3.62ypc 1TD L3 46c in10 7 in5 4; I.Davis 15c 2.93ypc 0TD L3 0c in10 0 in5 0; G.Smith 5c 0.8ypc 0TD L3 0c in10 0 in5 0
### MIA offense vs NYJ defense
- #3 no look: NYJ blitz rk 6.0/32 (FTN BLZ% 36.6), MIA scr rate 8.1%
- #4 no leak: NYJ TE yds/g rk 8.0, TE TD rk 18.0
- #5 neutral: MIA YPC rk 20.0, NYJ YPC-allowed rk 7.0
- #1 partial: NYJ suppresses WRs (WR yds/g rk 30.0) -> MIA WR yds overs flagged against alignment pending slot/outside data
- #2 shell: NYJ man 37.4% (rk 13) / zone 61.5%, single-high 48.9% (rk 26) / two-high 46.4%; EPA/db man 0.008 zone 0.246 1-high -0.033 2-high 0.336
- Run: MIA YPC 3.871 (vs 8+ box 2.038) | NYJ allows 4.469, avg box 6.675
- Pass: MIA EPA/db -0.074 (vs blitz -0.076, no blitz -0.072) | NYJ EPA/db allowed 0.136, L/M/R 0.115/0.325/0.301, blitz 0.366 (FTN BLZ% 36.6), WR/TE/RB rec yds/g 117.0/60.091/26.182
- Targets: M.Washington WR 57t (L3 12) aDOT 10.5 YPRR 1.44 EPA/t blitz 0.36 / none 0.02 | shell-fit YPRR 1.56 (+8%, neutral; man 1.71/zone 1.51/1H 1.55/2H 1.5); C.Douglas WR 45t (L3 26) aDOT 13.4 YPRR 1.96 EPA/t blitz 0.11 / none 0.24 | shell-fit YPRR 2.21 (+13%, FAVOURED; man 2.21/zone 2.19/1H 2.34/2H 2.09); G.Dulcich TE 43t (L3 14) aDOT 6.8 YPRR 1.28 EPA/t blitz 0.11 / none -0.02 | shell-fit YPRR 1.46 (+14%, FAVOURED; man 0.76/zone 1.73/1H 1.03/2H 2.11); C.Bell WR 29t (L3 5) aDOT 13.4 YPRR None EPA/t blitz -0.08 / none -0.23 | shell: n/a; K.Coleman WR 28t (L3 7) aDOT 12.7 YPRR None EPA/t blitz -0.41 / none -0.36 | shell: n/a; O.Gordon RB 18t (L3 9) aDOT -1.4 YPRR None EPA/t blitz -0.12 / none -0.19 | shell: n/a
- #6 backs: O.Gordon 138c 4.41ypc 4TD L3 47c in10 11 in5 10; D.Achane [OUT] 34c 3.74ypc 0TD L3 0c in10 3 in5 1; J.Wright 30c 1.63ypc 0TD L3 8c in10 2 in5 0; M.Willis [OUT] 12c 1.92ypc 1TD L3 0c in10 2 in5 2

## ATL@MIN
### ATL offense vs MIN defense
- #3 no look: MIN blitz rk 1.0/32 (FTN BLZ% 72.1), ATL scr rate 4.2%
- #4 no leak: MIN TE yds/g rk 28.0, TE TD rk 18.0
- #5 neutral: ATL YPC rk 6.0, MIN YPC-allowed rk 13.0
- #1 partial: MIN suppresses WRs (WR yds/g rk 27.0) -> ATL WR yds overs flagged against alignment pending slot/outside data
- #2 shell: MIN man 24.0% (rk 28) / zone 75.7%, single-high 42.4% (rk 30) / two-high 55.2%; EPA/db man -0.209 zone -0.078 1-high -0.182 2-high -0.069
- Run: ATL YPC 4.716 (vs 8+ box 5.077) | MIN allows 4.185, avg box 6.594
- Pass: ATL EPA/db -0.141 (vs blitz -0.116, no blitz -0.154) | MIN EPA/db allowed -0.081, L/M/R 0.084/0.13/-0.004, blitz 0.723 (FTN BLZ% 72.1), WR/TE/RB rec yds/g 127.4/43.6/21.3
- Targets: D.London WR 80t (L3 23) aDOT 10.1 YPRR 2.58 EPA/t blitz 0.13 / none 0.43 | shell-fit YPRR 2.88 (+12%, FAVOURED; man 2.19/zone 3.12/1H 3.26/2H 2.55); K.Pitts [check-roster] TE 42t (L3 15) aDOT 5.3 YPRR None EPA/t blitz -0.04 / none -0.17 | shell: n/a; J.Dotson WR 38t (L3 13) aDOT 15.6 YPRR None EPA/t blitz 1.04 / none -0.6 | shell: n/a; Bi.Robinson [check-roster] ? 33t (L3 1) aDOT -1.3 YPRR None EPA/t blitz -0.3 / none -0.26 | shell: n/a; O.Zaccheaus WR 20t (L3 9) aDOT 7.0 YPRR None EPA/t blitz -1.1 / none -0.55 | shell: n/a; Z.Branch WR 13t (L3 0) aDOT 2.5 YPRR None EPA/t blitz -0.69 / none 0.38 | shell: n/a
- #6 backs: Bi.Robinson [check-roster] 150c 5.2ypc 4TD L3 19c in10 10 in5 7; Br.Robinson [check-roster] 53c 3.98ypc 4TD L3 0c in10 3 in5 1; B.Robinson [OUT] 35c 4.89ypc 2TD L3 35c in10 2 in5 2; K.Herbert 7c 4.0ypc 0TD L3 5c in10 0 in5 0
### MIN offense vs ATL defense
- #3 no look: ATL blitz rk 24.0/32 (FTN BLZ% 25.5), MIN scr rate 5.8%
- #4 no leak: ATL TE yds/g rk 18.0, TE TD rk 16.0
- #5 neutral: MIN YPC rk 21.0, ATL YPC-allowed rk 4.0
- #1 partial: ATL leaks to WRs (rk 5.0); alignment split manual
- #2 shell: ATL man 38.0% (rk 11) / zone 60.9%, single-high 67.7% (rk 2) / two-high 29.9%; EPA/db man 0.03 zone 0.113 1-high -0.017 2-high 0.298
- Run: MIN YPC 3.857 (vs 8+ box 3.696) | ATL allows 4.605, avg box 6.518
- Pass: MIN EPA/db -0.075 (vs blitz -0.148, no blitz -0.039) | ATL EPA/db allowed 0.076, L/M/R 0.183/0.187/0.117, blitz 0.256 (FTN BLZ% 25.5), WR/TE/RB rec yds/g 162.7/51.0/31.9
- Targets: J.Jefferson WR 74t (L3 33) aDOT 9.9 YPRR 2.03 EPA/t blitz 0.18 / none 0.06 | shell-fit YPRR 2.2 (+8%, neutral; man 1.92/zone 2.34/1H 2.27/2H 2.11); T.Hockenson TE 51t (L3 14) aDOT 7.2 YPRR 1.90 EPA/t blitz 0.66 / none 0.27 | shell-fit YPRR 2.06 (+8%, neutral; man 3.0/zone 1.59/1H 1.87/2H 2.26); J.Addison [OUT] WR 37t (L3 3) aDOT 14.9 YPRR None EPA/t blitz -0.48 / none 0.08 | shell: n/a; T.Felton WR 24t (L3 17) aDOT 8.8 YPRR None EPA/t blitz -0.67 / none -0.19 | shell: n/a; A.Jones [check-roster] RB 24t (L3 3) aDOT -0.1 YPRR None EPA/t blitz -0.02 / none -0.03 | shell: n/a; M.Price WR 17t (L3 10) aDOT 6.2 YPRR None EPA/t blitz -1.64 / none 0.52 | shell: n/a
- #6 backs: A.Jones [check-roster] 134c 4.11ypc 4TD L3 24c in10 8 in5 3; J.Mason 71c 3.93ypc 1TD L3 33c in10 3 in5 1; D.Claiborne [OUT] 6c 2.17ypc 0TD L3 0c in10 0 in5 0; C.Wentz 4c 0.75ypc 0TD L3 1c in10 0 in5 0

## BAL@HOU
### BAL offense vs HOU defense
- #3 no look: HOU blitz rk 28.0/32 (FTN BLZ% 23.7), BAL scr rate 5.5%
- #4 no leak: HOU TE yds/g rk 20.0, TE TD rk 29.0
- #5 neutral: BAL YPC rk 8.0, HOU YPC-allowed rk 22.0
- #1 partial: HOU leaks to WRs (rk 3.0); alignment split manual
- #2 shell: HOU man 32.1% (rk 16) / zone 67.2%, single-high 57.3% (rk 11) / two-high 38.4%; EPA/db man 0.069 zone -0.012 1-high 0.022 2-high 0.017
- Run: BAL YPC 4.545 (vs 8+ box 1.833) | HOU allows 3.774, avg box 6.816
- Pass: BAL EPA/db 0.021 (vs blitz 0.044, no blitz 0.011) | HOU EPA/db allowed 0.001, L/M/R 0.031/0.272/0.165, blitz 0.237 (FTN BLZ% 23.7), WR/TE/RB rec yds/g 175.1/48.3/24.8
- Targets: Z.Flowers WR 82t (L3 24) aDOT 7.2 YPRR 2.44 EPA/t blitz 0.7 / none 0.02 | shell-fit YPRR 2.71 (+11%, FAVOURED; man 3.62/zone 2.25/1H 2.73/2H 2.72); M.Andrews TE 55t (L3 13) aDOT 6.8 YPRR 1.24 EPA/t blitz 0.2 / none -0.09 | shell-fit YPRR 1.4 (+13%, FAVOURED; man 0.75/zone 1.66/1H 1.01/2H 2.06); R.Bateman WR 42t (L3 13) aDOT 14.0 YPRR 1.31 EPA/t blitz 0.97 / none 0.26 | shell-fit YPRR 1.39 (+6%, neutral; man 1.69/zone 1.26/1H 1.82/2H 0.69); J.Hill RB 40t (L3 15) aDOT -1.4 YPRR 0.81 EPA/t blitz -0.38 / none -0.18 | shell-fit YPRR 0.82 (+2%, neutral; man 0.52/zone 1.05/1H 0.74/2H 0.82); J.Lane WR 25t (L3 11) aDOT 15.4 YPRR None EPA/t blitz -0.81 / none 0.13 | shell: n/a; D.Henry RB 24t (L3 10) aDOT -2.2 YPRR 0.85 EPA/t blitz 0.05 / none -0.18 | shell-fit YPRR 0.89 (+4%, neutral; man 0.69/zone 0.97/1H 1.2/2H 0.43)
- #6 backs: D.Henry 199c 3.99ypc 11TD L3 40c in10 29 in5 20; J.Hill 42c 7.45ypc 2TD L3 18c in10 0 in5 0; Z.Flowers 7c 5.43ypc 0TD L3 4c in10 0 in5 0; R.Ali 6c 4.0ypc 0TD L3 0c in10 0 in5 0
### HOU offense vs BAL defense
- #3 no look: BAL blitz rk 13.0/32 (FTN BLZ% 33.4), HOU scr rate 4.5%
- #4 no leak: BAL TE yds/g rk 15.0, TE TD rk 7.0
- #5 FADE RUN: HOU YPC rk 28.0 vs BAL YPC-allowed rk 24.0 (both bad for run) -> fade RB yds, lean pass + correlated QB/WR
- #1 partial: BAL leaks to WRs (rk 7.0); alignment split manual
- #2 shell: BAL man 30.6% (rk 19) / zone 69.4%, single-high 48.8% (rk 27) / two-high 42.7%; EPA/db man 0.022 zone 0.107 1-high 0.066 2-high 0.13
- Run: HOU YPC 3.483 (vs 8+ box 2.861) | BAL allows 3.674, avg box 6.474
- Pass: HOU EPA/db 0.144 (vs blitz 0.256, no blitz 0.103) | BAL EPA/db allowed 0.055, L/M/R 0.117/0.184/0.142, blitz 0.334 (FTN BLZ% 33.4), WR/TE/RB rec yds/g 162.455/54.273/11.364
- Targets: N.Collins WR 60t (L3 25) aDOT 12.0 YPRR 2.01 EPA/t blitz 0.15 / none 0.58 | shell-fit YPRR 2.22 (+10%, FAVOURED; man 2.18/zone 2.23/1H 2.54/2H 1.88); X.Hutchinson WR 57t (L3 17) aDOT 11.3 YPRR 1.37 EPA/t blitz 0.42 / none -0.17 | shell-fit YPRR 1.4 (+2%, neutral; man 2.25/zone 0.91/1H 1.7/2H 1.22); D.Schultz TE 50t (L3 7) aDOT 6.7 YPRR 1.61 EPA/t blitz 0.0 / none 0.3 | shell-fit YPRR 1.79 (+11%, FAVOURED; man 0.99/zone 2.18/1H 1.21/2H 2.39); K.Boutte WR 31t (L3 8) aDOT 14.4 YPRR 1.58 EPA/t blitz 0.9 / none 0.35 | shell-fit YPRR 1.71 (+8%, neutral; man 1.81/zone 1.59/1H 1.93/2H 1.57); J.Noel WR 23t (L3 0) aDOT 9.8 YPRR 2.25 EPA/t blitz 0.34 / none 0.83 | shell-fit YPRR 2.46 (+10%, neutral; man 2.84/zone 2.2/1H 3.47/2H 1.46); W.Marks RB 22t (L3 5) aDOT 1.1 YPRR None EPA/t blitz 0.33 / none -0.08 | shell: n/a
- #6 backs: W.Marks 107c 3.65ypc 2TD L3 30c in10 8 in5 3; D.Montgomery 78c 3.14ypc 2TD L3 26c in10 5 in5 3; E.Demercado 18c 3.61ypc 0TD L3 18c in10 0 in5 0; C.Stroud 10c 1.0ypc 1TD L3 2c in10 1 in5 1

## TEN@JAX
### TEN offense vs JAX defense
- #3 no look: JAX blitz rk 14.0/32 (FTN BLZ% 31.4), TEN scr rate 5.9%
- #4 no leak: JAX TE yds/g rk 32.0, TE TD rk 12.0
- #5 neutral: TEN YPC rk 12.0, JAX YPC-allowed rk 25.0
- #1 partial: JAX leaks to WRs (rk 8.0); alignment split manual
- #2 shell: JAX man 25.5% (rk 25) / zone 74.2%, single-high 55.3% (rk 14) / two-high 38.8%; EPA/db man -0.308 zone 0.011 1-high -0.008 2-high -0.104
- Run: TEN YPC 4.244 (vs 8+ box 1.929) | JAX allows 3.62, avg box 6.938
- Pass: TEN EPA/db -0.065 (vs blitz -0.008, no blitz -0.081) | JAX EPA/db allowed -0.074, L/M/R -0.166/0.125/0.016, blitz 0.316 (FTN BLZ% 31.4), WR/TE/RB rec yds/g 162.2/34.3/27.3
- Targets: C.Tate WR 56t (L3 5) aDOT 12.3 YPRR 1.85 EPA/t blitz -0.02 / none 0.26 | shell-fit YPRR 2.23 (+21%, FAVOURED; man 1.58/zone 2.52/1H 2.56/2H 1.66); W.Robinson [OUT] WR 54t (L3 11) aDOT 6.3 YPRR 0.89 EPA/t blitz 0.13 / none -0.13 | shell-fit YPRR 1.1 (+23%, FAVOURED; man 1.33/zone 1.01/1H 1.19/2H 0.96); E.Ayomanor WR 39t (L3 18) aDOT 9.9 YPRR 1.25 EPA/t blitz -0.21 / none 0.21 | shell-fit YPRR 1.35 (+8%, neutral; man 0.76/zone 1.6/1H 1.25/2H 1.42); G.Helm TE 35t (L3 17) aDOT 5.3 YPRR 0.89 EPA/t blitz 0.28 / none -0.02 | shell-fit YPRR 0.86 (-3%, neutral; man 1.27/zone 0.75/1H 1.01/2H 0.6); T.Pollard RB 31t (L3 15) aDOT 1.1 YPRR 0.98 EPA/t blitz 0.02 / none -0.43 | shell-fit YPRR 1.17 (+19%, FAVOURED; man 0.71/zone 1.32/1H 0.88/2H 1.61); C.Dike WR 23t (L3 16) aDOT 9.7 YPRR 1.41 EPA/t blitz 0.6 / none 0.26 | shell-fit YPRR 1.79 (+27%, FAVOURED; man 1.53/zone 1.97/1H 2.14/2H 1.13)
- #6 backs: T.Pollard 163c 4.53ypc 6TD L3 51c in10 20 in5 11; T.Spears [OUT] 22c 4.27ypc 0TD L3 4c in10 0 in5 0; C.Ward 10c 3.1ypc 2TD L3 5c in10 5 in5 4; M.Carter 7c 2.29ypc 0TD L3 4c in10 2 in5 0
### JAX offense vs TEN defense
- #3 no look: TEN blitz rk 23.0/32 (FTN BLZ% 25.5), JAX scr rate 3.3%
- #4 no leak: TEN TE yds/g rk 30.0, TE TD rk 8.0
- #5 neutral: JAX YPC rk 16.0, TEN YPC-allowed rk 17.0
- #1 partial: TEN leaks to WRs (rk 1.0); alignment split manual
- #2 shell: TEN man 29.4% (rk 21) / zone 69.6%, single-high 54.9% (rk 16) / two-high 38.6%; EPA/db man 0.441 zone 0.236 1-high 0.428 2-high 0.139
- Run: JAX YPC 4.038 (vs 8+ box 3.207) | TEN allows 4.094, avg box 6.504
- Pass: JAX EPA/db 0.202 (vs blitz 0.087, no blitz 0.248) | TEN EPA/db allowed 0.227, L/M/R 0.385/0.434/0.181, blitz 0.256 (FTN BLZ% 25.5), WR/TE/RB rec yds/g 207.3/42.3/27.9
- Targets: P.Washington WR 81t (L3 33) aDOT 13.3 YPRR 2.42 EPA/t blitz 0.39 / none 0.33 | shell-fit YPRR 2.67 (+10%, FAVOURED; man 2.96/zone 2.6/1H 2.3/2H 3.1); J.Meyers WR 53t (L3 22) aDOT 11.4 YPRR 1.75 EPA/t blitz 0.42 / none 0.08 | shell-fit YPRR 1.9 (+9%, neutral; man 1.09/zone 2.23/1H 2.06/2H 1.71); B.Strange TE 43t (L3 8) aDOT 7.9 YPRR 1.54 EPA/t blitz -0.04 / none 0.55 | shell-fit YPRR 1.7 (+10%, FAVOURED; man 2.3/zone 1.39/1H 2.24/2H 1.02); Bri.Thomas [check-roster] ? 29t (L3 7) aDOT 12.3 YPRR None EPA/t blitz -0.44 / none 0.37 | shell: n/a; J.Cameron WR 25t (L3 12) aDOT 10.1 YPRR None EPA/t blitz 0.25 / none 0.7 | shell: n/a; B.Tuten RB 23t (L3 7) aDOT -2.7 YPRR 1.65 EPA/t blitz 0.27 / none 0.65 | shell-fit YPRR 1.71 (+4%, neutral; man 1.1/zone 1.96/1H 2.35/2H 0.84)
- #6 backs: B.Tuten 158c 4.06ypc 5TD L3 48c in10 14 in5 8; C.Rodriguez 63c 4.14ypc 4TD L3 18c in10 9 in5 6; A.Abdullah 23c 3.83ypc 0TD L3 7c in10 1 in5 0; T.Lawrence 12c 3.58ypc 0TD L3 4c in10 1 in5 0

## WAS@ARI
### WAS offense vs ARI defense
- #3 no look: ARI blitz rk 12.0/32 (FTN BLZ% 33.6), WAS scr rate 9.7%
- #4 LOOK: ARI TE leak (TE yds/g rk 14.0, TE TD rk 2.0) -> price WAS TE ATD
- #5 neutral: WAS YPC rk 23.0, ARI YPC-allowed rk 19.0
- #2 shell: ARI man 26.9% (rk 23) / zone 71.7%, single-high 50.6% (rk 24) / two-high 45.3%; EPA/db man 0.303 zone 0.306 1-high 0.241 2-high 0.381
- Run: WAS YPC 3.787 (vs 8+ box 1.778) | ARI allows 4.0, avg box 6.658
- Pass: WAS EPA/db 0.028 (vs blitz 0.038, no blitz 0.014) | ARI EPA/db allowed 0.261, L/M/R 0.32/0.441/0.298, blitz 0.336 (FTN BLZ% 33.6), WR/TE/RB rec yds/g 145.636/54.364/33.455
- Targets: S.Diggs WR 65t (L3 21) aDOT 8.3 YPRR 1.60 EPA/t blitz 0.34 / none 0.04 | shell-fit YPRR 1.69 (+5%, neutral; man 1.89/zone 1.68/1H 1.73/2H 1.51); A.Williams WR 52t (L3 19) aDOT 10.3 YPRR 1.29 EPA/t blitz 0.58 / none 0.16 | shell-fit YPRR 1.42 (+10%, neutral; man 1.49/zone 1.37/1H 1.58/2H 1.27); C.Okonkwo TE 44t (L3 20) aDOT 6.7 YPRR 1.28 EPA/t blitz -0.25 / none -0.17 | shell-fit YPRR 1.48 (+16%, FAVOURED; man 1.01/zone 1.63/1H 1.18/2H 1.85); T.Burks WR 28t (L3 6) aDOT 17.4 YPRR None EPA/t blitz 0.1 / none 0.45 | shell: n/a; T.McLaurin [OUT] WR 28t (L3 0) aDOT 12.9 YPRR None EPA/t blitz 0.64 / none 0.32 | shell: n/a; R.White RB 23t (L3 5) aDOT 0.2 YPRR 1.01 EPA/t blitz 0.16 / none -0.09 | shell-fit YPRR 1.2 (+19%, FAVOURED; man 0.57/zone 1.4/1H 0.86/2H 1.64)
- #6 backs: J.Croskey-Merritt 80c 3.66ypc 3TD L3 13c in10 3 in5 2; R.White 65c 4.23ypc 1TD L3 18c in10 5 in5 3; A.Ekeler 41c 3.71ypc 0TD L3 24c in10 3 in5 1; K.Allen [check-roster] 12c 3.42ypc 0TD L3 0c in10 2 in5 1
### ARI offense vs WAS defense
- #3 no look: WAS blitz rk 3.0/32 (FTN BLZ% 42.2), ARI scr rate 2.7%
- #4 LOOK: WAS TE leak (TE yds/g rk 1.0, TE TD rk 3.0) -> price ARI TE ATD
- #5 neutral: ARI YPC rk 18.0, WAS YPC-allowed rk 27.0
- #2 shell: WAS man 20.3% (rk 31) / zone 78.6%, single-high 39.8% (rk 31) / two-high 54.8%; EPA/db man 0.137 zone 0.04 1-high 0.05 2-high 0.102
- Run: ARI YPC 3.992 (vs 8+ box 2.5) | WAS allows 3.607, avg box 6.641
- Pass: ARI EPA/db -0.059 (vs blitz -0.18, no blitz -0.016) | WAS EPA/db allowed 0.08, L/M/R -0.025/0.469/0.079, blitz 0.424 (FTN BLZ% 42.2), WR/TE/RB rec yds/g 142.3/80.4/28.3
- Targets: T.McBride TE 113t (L3 27) aDOT 5.6 YPRR 1.64 EPA/t blitz -0.12 / none 0.26 | shell-fit YPRR 1.89 (+15%, FAVOURED; man 1.45/zone 2.03/1H 1.59/2H 2.06); Mi.Wilson [check-roster] ? 88t (L3 7) aDOT 10.8 YPRR None EPA/t blitz -0.26 / none 0.13 | shell: n/a; K.Bourne [OUT] WR 38t (L3 0) aDOT 5.7 YPRR 1.17 EPA/t blitz 0.4 / none 0.08 | shell-fit YPRR 1.15 (-2%, neutral; man 1.45/zone 0.93/1H 0.92/2H 1.49); T.Allgeier RB 26t (L3 4) aDOT -1.6 YPRR 0.72 EPA/t blitz -0.1 / none -0.19 | shell-fit YPRR 0.72 (+0%, neutral; man 0.85/zone 0.69/1H 0.91/2H 0.58); E.Higgins TE 21t (L3 3) aDOT 2.4 YPRR None EPA/t blitz 0.6 / none -0.14 | shell: n/a; J.Brooks WR 17t (L3 0) aDOT 14.8 YPRR None EPA/t blitz -0.44 / none -0.01 | shell: n/a
- #6 backs: T.Allgeier 101c 4.02ypc 2TD L3 29c in10 8 in5 4; J.Love [OUT] 76c 3.53ypc 1TD L3 0c in10 6 in5 2; Z.Knight [check-roster] 40c 5.55ypc 0TD L3 12c in10 5 in5 2; J.Brissett [check-roster] 17c 1.71ypc 1TD L3 0c in10 4 in5 3

## SEA@SF
### SEA offense vs SF defense
- #3 no look: SF blitz rk 16.0/32 (FTN BLZ% 28.5), SEA scr rate 3.8%
- #4 no leak: SF TE yds/g rk 12.0, TE TD rk 18.0
- #5 FADE RUN: SEA YPC rk 22.0 vs SF YPC-allowed rk 31.0 (both bad for run) -> fade RB yds, lean pass + correlated QB/WR
- #2 shell: SF man 26.6% (rk 24) / zone 71.0%, single-high 64.0% (rk 6) / two-high 32.3%; EPA/db man 0.074 zone -0.037 1-high 0.065 2-high -0.174
- Run: SEA YPC 3.856 (vs 8+ box 2.154) | SF allows 3.46, avg box 6.576
- Pass: SEA EPA/db 0.082 (vs blitz 0.088, no blitz 0.078) | SF EPA/db allowed 0.003, L/M/R 0.229/-0.089/-0.025, blitz 0.288 (FTN BLZ% 28.5), WR/TE/RB rec yds/g 137.2/55.1/30.0
- Targets: J.Smith-Njigba WR 109t (L3 31) aDOT 10.4 YPRR 3.66 EPA/t blitz 0.69 / none 0.48 | shell-fit YPRR 3.84 (+5%, neutral; man 3.76/zone 4.0/1H 3.45/2H 4.35); A.Barner TE 41t (L3 12) aDOT 2.4 YPRR 0.85 EPA/t blitz 0.16 / none -0.85 | shell-fit YPRR 0.94 (+10%, FAVOURED; man 0.57/zone 1.08/1H 0.95/2H 0.89); C.Kupp WR 35t (L3 8) aDOT 8.8 YPRR 1.01 EPA/t blitz 0.52 / none 0.28 | shell-fit YPRR 1.02 (+0%, neutral; man 1.76/zone 0.66/1H 1.08/2H 1.06); R.Shaheed WR 33t (L3 2) aDOT 10.8 YPRR None EPA/t blitz -0.47 / none -0.31 | shell: n/a; T.Horton WR 20t (L3 10) aDOT 8.6 YPRR None EPA/t blitz 0.65 / none 0.08 | shell: n/a; J.Price RB 16t (L3 9) aDOT 3.7 YPRR None EPA/t blitz 0.28 / none 0.0 | shell: n/a
- #6 backs: E.Wilson 111c 3.63ypc 3TD L3 0c in10 12 in5 7; J.Price 56c 3.71ypc 1TD L3 28c in10 2 in5 1; Z.Charbonnet 42c 4.62ypc 0TD L3 42c in10 1 in5 0; G.Holani 37c 3.16ypc 1TD L3 1c in10 5 in5 5
### SF offense vs SEA defense
- #3 LOOK: SEA low-blitz (rk 25.0/32) vs SF scramble rate 6.4% -> QB rush overs
- #4 no leak: SEA TE yds/g rk 29.0, TE TD rk 26.0
- #5 neutral: SF YPC rk 7.0, SEA YPC-allowed rk 32.0
- #1 partial: SEA suppresses WRs (WR yds/g rk 32.0) -> SF WR yds overs flagged against alignment pending slot/outside data
- #2 shell: SEA man 21.5% (rk 30) / zone 76.5%, single-high 48.0% (rk 28) / two-high 48.3%; EPA/db man -0.183 zone -0.092 1-high -0.123 2-high -0.097
- Run: SF YPC 4.705 (vs 8+ box 0.778) | SEA allows 3.282, avg box 6.454
- Pass: SF EPA/db 0.333 (vs blitz 0.473, no blitz 0.266) | SEA EPA/db allowed -0.079, L/M/R -0.009/0.155/-0.069, blitz 0.24 (FTN BLZ% 24.0), WR/TE/RB rec yds/g 85.8/42.6/29.4
- Targets: G.Kittle TE 65t (L3 19) aDOT 7.9 YPRR 2.29 EPA/t blitz 0.95 / none -0.03 | shell-fit YPRR 2.3 (+0%, neutral; man 2.66/zone 2.22/1H 2.32/2H 2.24); C.McCaffrey RB 53t (L3 11) aDOT 2.9 YPRR 1.97 EPA/t blitz 0.38 / none 0.33 | shell-fit YPRR 1.9 (-4%, neutral; man 3.58/zone 1.56/1H 1.89/2H 1.69); M.Evans WR 47t (L3 7) aDOT 14.3 YPRR 4.26 EPA/t blitz 1.63 / none 0.61 | shell-fit YPRR 4.47 (+5%, neutral; man 4.18/zone 4.57/1H 5.28/2H 3.65); D.Samuel [check-roster] WR 27t (L3 7) aDOT 1.6 YPRR None EPA/t blitz 0.14 / none 0.45 | shell: n/a; J.Watkins WR 17t (L3 8) aDOT 16.5 YPRR None EPA/t blitz 1.35 / none 0.59 | shell: n/a; K.Juszczyk FB 13t (L3 2) aDOT 7.2 YPRR None EPA/t blitz 0.83 / none -0.04 | shell: n/a
- #6 backs: C.McCaffrey 127c 4.47ypc 11TD L3 43c in10 19 in5 14; K.Black 85c 4.28ypc 2TD L3 28c in10 4 in5 3; B.Purdy 15c 1.67ypc 0TD L3 3c in10 2 in5 1; D.Samuel [check-roster] 14c 13.07ypc 1TD L3 5c in10 0 in5 0

## NE@LAC
### NE offense vs LAC defense
- #3 LOOK: LAC low-blitz (rk 27.0/32) vs NE scramble rate 8.5% -> QB rush overs
- #4 no leak: LAC TE yds/g rk 9.0, TE TD rk 29.0
- #5 neutral: NE YPC rk 19.0, LAC YPC-allowed rk 15.0
- #2 shell: LAC man 31.6% (rk 17) / zone 67.8%, single-high 54.7% (rk 18) / two-high 39.8%; EPA/db man 0.013 zone 0.136 1-high -0.028 2-high 0.26
- Run: NE YPC 3.877 (vs 8+ box 2.306) | LAC allows 4.112, avg box 6.558
- Pass: NE EPA/db 0.084 (vs blitz -0.001, no blitz 0.121) | LAC EPA/db allowed 0.085, L/M/R 0.146/0.048/0.218, blitz 0.238 (FTN BLZ% 23.7), WR/TE/RB rec yds/g 148.2/58.3/23.9
- Targets: D.Douglas WR 49t (L3 15) aDOT 10.8 YPRR 1.59 EPA/t blitz 0.06 / none 0.46 | shell-fit YPRR 1.77 (+12%, FAVOURED; man 1.67/zone 1.8/1H 1.92/2H 1.62); H.Henry TE 40t (L3 9) aDOT 6.4 YPRR 1.69 EPA/t blitz 0.37 / none 0.57 | shell-fit YPRR 1.86 (+10%, FAVOURED; man 1.0/zone 2.28/1H 1.58/2H 2.22); R.Stevenson RB 33t (L3 8) aDOT 1.1 YPRR 1.35 EPA/t blitz 0.64 / none 0.0 | shell-fit YPRR 1.48 (+9%, neutral; man 0.63/zone 1.85/1H 1.65/2H 1.26); M.Hollins WR 32t (L3 12) aDOT 13.5 YPRR 1.85 EPA/t blitz 0.49 / none 0.01 | shell-fit YPRR 2.01 (+9%, neutral; man 0.87/zone 2.56/1H 1.89/2H 2.16); E.Raridon TE 27t (L3 11) aDOT 7.5 YPRR None EPA/t blitz -0.0 / none 0.07 | shell: n/a; A.Brown WR 26t (L3 6) aDOT 12.8 YPRR None EPA/t blitz -0.23 / none -0.14 | shell: n/a
- #6 backs: R.Stevenson 108c 3.73ypc 2TD L3 31c in10 8 in5 3; C.Kiner 60c 4.48ypc 1TD L3 25c in10 3 in5 1; T.Henderson [OUT] 52c 3.9ypc 1TD L3 0c in10 1 in5 0; D.Maye 10c 2.2ypc 2TD L3 3c in10 4 in5 4
### LAC offense vs NE defense
- #3 no look: NE blitz rk 7.0/32 (FTN BLZ% 35.2), LAC scr rate 9.9%
- #4 no leak: NE TE yds/g rk 24.0, TE TD rk 26.0
- #5 neutral: LAC YPC rk 17.0, NE YPC-allowed rk 16.0
- #1 partial: NE leaks to WRs (rk 4.0); alignment split manual
- #2 shell: NE man 30.7% (rk 18) / zone 66.5%, single-high 52.2% (rk 23) / two-high 40.2%; EPA/db man -0.007 zone 0.222 1-high 0.191 2-high 0.177
- Run: LAC YPC 4.016 (vs 8+ box 2.947) | NE allows 4.111, avg box 6.63
- Pass: LAC EPA/db -0.154 (vs blitz -0.073, no blitz -0.18) | NE EPA/db allowed 0.116, L/M/R 0.254/0.292/0.213, blitz 0.353 (FTN BLZ% 35.2), WR/TE/RB rec yds/g 173.6/44.7/35.5
- Targets: T.Harris WR 42t (L3 14) aDOT 10.9 YPRR 1.66 EPA/t blitz 0.57 / none 0.05 | shell-fit YPRR 1.77 (+7%, neutral; man 1.98/zone 1.67/1H 1.54/2H 2.09); Q.Johnston WR 33t (L3 7) aDOT 13.4 YPRR None EPA/t blitz 0.6 / none 0.12 | shell: n/a; L.McConkey WR 32t (L3 8) aDOT 11.5 YPRR 2.02 EPA/t blitz -0.06 / none 0.44 | shell-fit YPRR 2.28 (+13%, FAVOURED; man 2.94/zone 1.86/1H 2.73/2H 1.85); O.Gadsden TE 31t (L3 5) aDOT 7.1 YPRR 1.07 EPA/t blitz -0.76 / none -0.03 | shell-fit YPRR 1.21 (+13%, FAVOURED; man 1.43/zone 1.08/1H 1.47/2H 0.91); C.Kolar TE 24t (L3 7) aDOT 5.1 YPRR None EPA/t blitz 0.49 / none -0.54 | shell: n/a; K.Mitchell RB 24t (L3 6) aDOT 0.1 YPRR 1.09 EPA/t blitz 0.82 / none -0.0 | shell-fit YPRR 1.34 (+23%, FAVOURED; man 1.2/zone 1.27/1H 1.93/2H 0.77)
- #6 backs: O.Hampton 138c 4.08ypc 4TD L3 49c in10 13 in5 5; K.Mitchell 49c 3.71ypc 0TD L3 10c in10 1 in5 0; K.Vidal 45c 4.4ypc 1TD L3 16c in10 1 in5 0; J.Herbert 14c 3.93ypc 1TD L3 3c in10 4 in5 2

## CAR@TB
### CAR offense vs TB defense
- #3 no look: TB blitz rk 2.0/32 (FTN BLZ% 42.8), CAR scr rate 2.4%
- #4 LOOK: TB TE leak (TE yds/g rk 5.0, TE TD rk 12.0) -> price CAR TE ATD
- #5 neutral: CAR YPC rk 15.0, TB YPC-allowed rk 26.0
- #2 shell: TB man 29.4% (rk 21) / zone 69.8%, single-high 64.6% (rk 5) / two-high 30.5%; EPA/db man -0.26 zone -0.061 1-high -0.212 2-high 0.039
- Run: CAR YPC 4.046 (vs 8+ box 3.364) | TB allows 3.617, avg box 6.825
- Pass: CAR EPA/db 0.052 (vs blitz -0.15, no blitz 0.133) | TB EPA/db allowed -0.093, L/M/R -0.028/0.069/-0.153, blitz 0.43 (FTN BLZ% 42.8), WR/TE/RB rec yds/g 138.2/64.8/23.7
- Targets: T.McMillan WR 88t (L3 22) aDOT 11.0 YPRR 1.92 EPA/t blitz 0.01 / none 0.34 | shell-fit YPRR 2.01 (+5%, neutral; man 2.02/zone 2.04/1H 1.83/2H 2.35); J.Coker WR 60t (L3 16) aDOT 9.7 YPRR 1.48 EPA/t blitz -0.27 / none 0.19 | shell-fit YPRR 1.61 (+9%, neutral; man 1.54/zone 1.59/1H 1.71/2H 1.51); D.Waller TE 42t (L3 17) aDOT 10.4 YPRR 1.46 EPA/t blitz 0.48 / none 0.33 | shell-fit YPRR 1.63 (+12%, FAVOURED; man 1.33/zone 1.75/1H 2.02/2H 0.83); T.Tremble TE 36t (L3 12) aDOT 3.8 YPRR 1.41 EPA/t blitz -0.42 / none 0.5 | shell-fit YPRR 1.27 (-10%, neutral; man 2.07/zone 0.85/1H 1.72/2H 0.51); C.Hubbard RB 36t (L3 10) aDOT -1.0 YPRR 1.00 EPA/t blitz 0.63 / none 0.4 | shell-fit YPRR 1.06 (+6%, neutral; man 1.23/zone 0.96/1H 1.06/2H 1.11); J.Metchie WR 27t (L3 6) aDOT 7.5 YPRR None EPA/t blitz -0.13 / none 0.32 | shell: n/a
- #6 backs: C.Hubbard 190c 4.38ypc 9TD L3 71c in10 22 in5 15; T.Etienne 19c 2.37ypc 0TD L3 11c in10 1 in5 0; A.Dillon 17c 2.53ypc 0TD L3 0c in10 0 in5 0; J.Brooks [OUT] 9c 3.33ypc 0TD L3 0c in10 1 in5 0
### TB offense vs CAR defense
- #3 no look: CAR blitz rk 15.0/32 (FTN BLZ% 29.4), TB scr rate 9.6%
- #4 no leak: CAR TE yds/g rk 27.0, TE TD rk 12.0
- #5 RUN EDGE: TB YPC rk 3.0 vs CAR allows rk 9.0 -> RB yds/ATD lean
- #2 shell: CAR man 24.5% (rk 26) / zone 75.2%, single-high 67.1% (rk 4) / two-high 29.4%; EPA/db man 0.09 zone 0.079 1-high 0.07 2-high 0.017
- Run: TB YPC 4.853 (vs 8+ box 1.4) | CAR allows 4.432, avg box 6.428
- Pass: TB EPA/db -0.125 (vs blitz -0.178, no blitz -0.1) | CAR EPA/db allowed 0.045, L/M/R 0.209/0.181/-0.046, blitz 0.31 (FTN BLZ% 29.4), WR/TE/RB rec yds/g 147.1/44.1/27.5
- Targets: E.Egbuka WR 59t (L3 10) aDOT 10.4 YPRR 1.06 EPA/t blitz -0.32 / none -0.11 | shell-fit YPRR 1.08 (+2%, neutral; man 1.14/zone 1.17/1H 0.85/2H 1.36); C.Otton TE 41t (L3 11) aDOT 7.2 YPRR 0.78 EPA/t blitz 0.26 / none -0.23 | shell-fit YPRR 0.93 (+19%, FAVOURED; man 0.6/zone 0.98/1H 1.05/2H 0.74); C.Godwin WR 41t (L3 7) aDOT 3.9 YPRR 0.90 EPA/t blitz 0.15 / none 0.16 | shell-fit YPRR 1.05 (+17%, FAVOURED; man 0.75/zone 1.05/1H 1.31/2H 0.67); B.Irving RB 32t (L3 9) aDOT -1.0 YPRR 0.80 EPA/t blitz 0.11 / none -0.12 | shell-fit YPRR 0.84 (+6%, neutral; man 1.45/zone 0.71/1H 0.62/2H 1.22); T.Hurst WR 32t (L3 9) aDOT 14.2 YPRR None EPA/t blitz 0.06 / none 0.23 | shell: n/a; K.Gainwell RB 26t (L3 9) aDOT -0.5 YPRR 1.43 EPA/t blitz 0.44 / none -0.13 | shell-fit YPRR 1.77 (+24%, FAVOURED; man 0.16/zone 2.51/1H 1.59/2H 1.66)
- #6 backs: B.Irving 185c 4.83ypc 8TD L3 65c in10 18 in5 9; K.Gainwell 67c 4.79ypc 0TD L3 34c in10 2 in5 1; S.Tucker 15c 5.33ypc 2TD L3 0c in10 3 in5 3; B.Mayfield 6c 3.0ypc 0TD L3 4c in10 2 in5 2
