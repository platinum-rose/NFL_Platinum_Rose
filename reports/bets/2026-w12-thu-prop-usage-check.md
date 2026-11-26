# W12 Thursday prop usage check (Claude Team 2, 2026-11-25 ~9 PM PT)
nflverse PBP W1-11, team-scoped names; DKP 11-25 3 AM prices. hit = season hit rate at the line, hitL5 = last 5; edge = avg(hit,hitL5) - DKP implied.
```
         g           player        mkt           line   am imp  n  hit hitL5                                  L5 edge
 kc-at-buf       James Cook atd_1_plus     James Cook -104 51% 10  90%  100%                     [1, 1, 1, 1, 1] +44%
chi-at-det     Brock Wright        rec           Over -163 62%  6 100%  100%                     [2, 1, 1, 2, 2] +38%
chi-at-det     Jahmyr Gibbs    carries           Over -113 53% 10  80%  100%                [29, 23, 20, 22, 23] +37%
phi-at-dal   Dallas Goedert    rec_yds            30+ -133 57%  8  88%  100%      [61.0, 48.0, 30.0, 50.0, 38.0] +37%
 kc-at-buf      Rashee Rice        rec             5+ -108 52%  7  71%  100%                     [7, 7, 5, 5, 6] +34%
chi-at-det        Sam Roush        rec             1+ -212 68%  5 100%  100%                     [1, 1, 1, 2, 1] +32%
 kc-at-buf       James Cook   rush_yds            80+ -144 59% 10  80%  100%    [95.0, 80.0, 107.0, 157.0, 89.0] +31%
 kc-at-buf  Patrick Mahomes    pass_td           Over -108 52% 10  80%   80%                     [0, 3, 2, 5, 3] +28%
 kc-at-buf      Rashee Rice    rec_yds            40+ -186 65%  7  86%  100%      [88.0, 53.0, 49.0, 82.0, 53.0] +28%
chi-at-det      Rome Odunze        rec             3+ -223 69% 10  90%  100%                     [3, 4, 4, 4, 4] +26%
phi-at-dal   Dallas Goedert        rec             4+ -108 52%  8  75%   80%                     [6, 5, 4, 5, 1] +26%
chi-at-det      Rome Odunze    rec_yds            30+ -300 75% 10 100%  100%      [39.0, 69.0, 87.0, 60.0, 45.0] +25%
chi-at-det    Kyle Monangai    carries           Over -122 55%  5  80%   80%                 [10, 10, 10, 30, 8] +25%
 kc-at-buf       Josh Allen   pass_yds           230+ -108 52% 10  70%   80% [255.0, 289.0, 234.0, 196.0, 304.0] +23%
chi-at-det       Sione Vaki        rec             1+ -144 59% 10  80%   80%                     [0, 1, 2, 1, 1] +21%
chi-at-det    Zavion Thomas        rec             1+ -376 79%  6 100%  100%                     [1, 3, 1, 1, 2] +21%
 kc-at-buf  Patrick Mahomes   pass_yds           240+ -117 54% 10  70%   80% [165.0, 321.0, 242.0, 348.0, 324.0] +21%
chi-at-det    D'Andre Swift   rush_yds            30+ -400 80% 10 100%  100%      [44.0, 78.0, 69.0, 31.0, 51.0] +20%
chi-at-det    Kyle Monangai   rush_yds            30+ -156 61%  5  80%   80%    [100.0, 47.0, 31.0, 146.0, 18.0] +19%
phi-at-dal   Saquon Barkley atd_1_plus Saquon Barkley  117 46%  8  50%   80%                     [0, 1, 1, 1, 1] +19%
 kc-at-buf     Travis Kelce    rec_yds            30+ -317 76% 10  90%  100%      [44.0, 67.0, 72.0, 30.0, 74.0] +19%
phi-at-dal    DeVonta Smith    rec_yds            40+ -426 81%  5 100%  100%     [53.0, 117.0, 65.0, 75.0, 41.0] +19%
chi-at-det Jameson Williams        rec             4+ -133 57% 10  70%   80%                     [5, 4, 1, 4, 4] +18%
 kc-at-buf    Xavier Worthy        rec           Over  113 47% 10  70%   60%                     [3, 3, 6, 0, 2] +18%
phi-at-dal    Ryan Flournoy    rec_yds            30+ -117 54% 11  64%   80%      [70.0, 38.0, 53.0, 71.0, 11.0] +18%
chi-at-det     Jahmyr Gibbs   rush_yds            90+ -138 58% 10  70%   80%   [116.0, 153.0, 74.0, 153.0, 98.0] +17%
chi-at-det    D'Andre Swift atd_1_plus  D'Andre Swift -117 54% 10  60%   80%                     [2, 1, 3, 0, 1] +16%
 kc-at-buf    Khalil Shakir        rec             4+ -117 54% 10  60%   80%                     [4, 5, 4, 2, 5] +16%
 kc-at-buf       Ty Johnson    rec_yds            20+  117 46%  8  62%   60%       [24.0, 19.0, 36.0, 4.0, 55.0] +15%
chi-at-det Jameson Williams    rec_yds            30+ -567 85% 10 100%  100%      [91.0, 70.0, 31.0, 50.0, 93.0] +15%
 kc-at-buf       James Cook    carries           Over -150 60% 10  70%   80%                [22, 21, 31, 18, 22] +15%
chi-at-det    D'Andre Swift    carries           Over  100 50% 10  70%   60%                [16, 22, 27, 12, 13] +15%
chi-at-det     Jahmyr Gibbs atd_1_plus   Jahmyr Gibbs -245 71% 10  90%   80%                     [0, 1, 1, 2, 2] +14%
phi-at-dal   George Pickens        rec             6+  113 47% 10  60%   60%                    [6, 4, 2, 11, 7] +13%
phi-at-dal      CeeDee Lamb atd_1_plus    CeeDee Lamb -144 59% 11  64%   80%                     [2, 0, 1, 1, 1] +13%
 kc-at-buf       Ty Johnson        rec             2+ -245 71%  8  88%   80%                     [2, 3, 2, 1, 7] +13%
phi-at-dal      CeeDee Lamb        rec             7+ -178 64% 11  73%   80%                   [5, 7, 10, 7, 11] +12%
phi-at-dal      Makai Lemon        rec             3+ -223 69% 10  80%   80%                     [3, 7, 6, 6, 1] +11%
phi-at-dal   George Pickens    rec_yds            40+ -525 84% 10  90%  100%    [73.0, 57.0, 48.0, 145.0, 102.0] +11%
phi-at-dal    DeVonta Smith        rec             5+ -233 70%  5  80%   80%                    [3, 10, 6, 7, 5] +10%
--- worst (fade candidates)
         g          player      mkt line   am  imp      hit  hitL5                            L5
 kc-at-buf      Josh Allen rush_yds  20+ -488 0.83 0.500000    0.2     [1.0, 30.0, 15.0, 5.0, 0]
chi-at-det  Caleb Williams rush_yds  20+ -163 0.62 0.285714    0.0  [3.0, 18.0, 1.0, 16.0, 11.0]
 kc-at-buf     Rashee Rice      rec  11+  117 0.46 0.000000    0.0               [7, 7, 5, 5, 6]
phi-at-dal  Saquon Barkley  carries Over -150 0.60 0.125000    0.2            [2, 7, 13, 13, 17]
phi-at-dal  Saquon Barkley rush_yds  40+ -669 0.87 0.500000    0.4 [8.0, 62.0, 30.0, 22.0, 75.0]
 kc-at-buf      Josh Allen rush_yds  30+ -194 0.66 0.300000    0.2     [1.0, 30.0, 15.0, 5.0, 0]
 kc-at-buf Patrick Mahomes  carries Over  104 0.49 0.200000    0.0               [2, 2, 2, 2, 0]
 kc-at-buf      Josh Allen rush_yds  40+  104 0.49 0.200000    0.0     [1.0, 30.0, 15.0, 5.0, 0]
chi-at-det    Isaac TeSlaa  rec_yds Over -122 0.55 0.333333    0.0       [0, 10.0, 9.0, 19.0, 0]
chi-at-det    Isaac TeSlaa  rec_yds  20+ -113 0.53 0.333333    0.0       [0, 10.0, 9.0, 19.0, 0]
--- specific checks
         g            player        mkt              line    am imp  n hit hitL5                                  L5
chi-at-det Amon-Ra St. Brown atd_1_plus Amon-Ra St. Brown  -138 58% 10 50%   40%                     [0, 0, 0, 2, 1]
chi-at-det Amon-Ra St. Brown        rec                5+  -809 89% 10 80%   80%                     [9, 7, 8, 4, 5]
chi-at-det Amon-Ra St. Brown        rec                6+  -355 78% 10 70%   60%                     [9, 7, 8, 4, 5]
chi-at-det Amon-Ra St. Brown        rec                7+  -170 63% 10 60%   60%                     [9, 7, 8, 4, 5]
chi-at-det Amon-Ra St. Brown        rec                8+   104 49% 10 50%   40%                     [9, 7, 8, 4, 5]
chi-at-det Amon-Ra St. Brown    rec_yds               50+  -733 88% 10 70%   60%     [153.0, 46.0, 86.0, 98.0, 37.0]
chi-at-det Amon-Ra St. Brown    rec_yds               60+  -376 79% 10 70%   60%     [153.0, 46.0, 86.0, 98.0, 37.0]
chi-at-det Amon-Ra St. Brown    rec_yds               70+  -233 70% 10 50%   60%     [153.0, 46.0, 86.0, 98.0, 37.0]
chi-at-det Amon-Ra St. Brown    rec_yds               80+  -150 60% 10 40%   60%     [153.0, 46.0, 86.0, 98.0, 37.0]
chi-at-det Amon-Ra St. Brown    rec_yds               90+  -104 51% 10 30%   40%     [153.0, 46.0, 86.0, 98.0, 37.0]
chi-at-det Amon-Ra St. Brown    rec_yds              100+   138 42% 10 20%   20%     [153.0, 46.0, 86.0, 98.0, 37.0]
phi-at-dal       CeeDee Lamb atd_1_plus       CeeDee Lamb  -144 59% 11 64%   80%                     [2, 0, 1, 1, 1]
phi-at-dal       CeeDee Lamb        rec                5+  -809 89% 11 91%  100%                   [5, 7, 10, 7, 11]
phi-at-dal       CeeDee Lamb        rec                6+  -355 78% 11 73%   80%                   [5, 7, 10, 7, 11]
phi-at-dal       CeeDee Lamb        rec                7+  -178 64% 11 73%   80%                   [5, 7, 10, 7, 11]
phi-at-dal       CeeDee Lamb        rec              Over   104 49% 11 45%   40%                   [5, 7, 10, 7, 11]
phi-at-dal       CeeDee Lamb        rec                8+   104 49% 11 45%   40%                   [5, 7, 10, 7, 11]
phi-at-dal       CeeDee Lamb    rec_yds               50+  -809 89% 11 82%  100%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds               60+  -426 81% 11 73%   80%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds               70+  -257 72% 11 73%   80%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds               80+  -156 61% 11 45%   40%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds              Over  -122 55% 11 45%   40%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds               90+  -113 53% 11 45%   40%    [74.0, 58.0, 195.0, 72.0, 132.0]
phi-at-dal       CeeDee Lamb    rec_yds              100+   127 44% 11 45%   40%    [74.0, 58.0, 195.0, 72.0, 132.0]
chi-at-det  Colston Loveland atd_1_plus  Colston Loveland   138 42% 10 30%   60%                     [1, 1, 0, 0, 1]
chi-at-det  Colston Loveland        rec                4+  -456 82% 10 60%   80%                     [6, 7, 7, 4, 3]
chi-at-det  Colston Loveland        rec                5+  -194 66% 10 40%   60%                     [6, 7, 7, 4, 3]
chi-at-det  Colston Loveland        rec              Over  -104 51% 10 40%   60%                     [6, 7, 7, 4, 3]
chi-at-det  Colston Loveland        rec                6+   113 47% 10 40%   60%                     [6, 7, 7, 4, 3]
chi-at-det  Colston Loveland    rec_yds               30+  -525 84% 10 60%   80%      [65.0, 69.0, 65.0, 54.0, 29.0]
chi-at-det  Colston Loveland    rec_yds               40+  -270 73% 10 50%   80%      [65.0, 69.0, 65.0, 54.0, 29.0]
chi-at-det  Colston Loveland    rec_yds               50+  -150 60% 10 50%   80%      [65.0, 69.0, 65.0, 54.0, 29.0]
chi-at-det  Colston Loveland    rec_yds               60+   117 46% 10 30%   60%      [65.0, 69.0, 65.0, 54.0, 29.0]
phi-at-dal      Dak Prescott   pass_yds              200+  -669 87% 11 82%   80% [212.0, 195.0, 335.0, 343.0, 325.0]
phi-at-dal      Dak Prescott   pass_yds              250+  -156 61% 11 73%   60% [212.0, 195.0, 335.0, 343.0, 325.0]
phi-at-dal      Dak Prescott   pass_yds              260+  -113 53% 11 64%   60% [212.0, 195.0, 335.0, 343.0, 325.0]
phi-at-dal      Dak Prescott   pass_yds              Over  -113 53% 11 64%   60% [212.0, 195.0, 335.0, 343.0, 325.0]
phi-at-dal      Dak Prescott   rush_yds              Over  -113 53% 11 36%   20%          [8.0, 20.0, 1.0, 7.0, 9.0]
 kc-at-buf    Dalton Kincaid        rec                3+  -285 74%  9 56%   60%                     [1, 7, 4, 3, 2]
 kc-at-buf    Dalton Kincaid        rec                4+   100 50%  9 44%   40%                     [1, 7, 4, 3, 2]
 kc-at-buf    Dalton Kincaid    rec_yds               20+  -614 86%  9 78%   80%       [7.0, 38.0, 86.0, 28.0, 58.0]
 kc-at-buf    Dalton Kincaid    rec_yds               30+  -257 72%  9 67%   60%       [7.0, 38.0, 86.0, 28.0, 58.0]
 kc-at-buf    Dalton Kincaid    rec_yds               40+  -144 59%  9 44%   40%       [7.0, 38.0, 86.0, 28.0, 58.0]
 kc-at-buf    Dalton Kincaid    rec_yds               50+   122 45%  9 44%   40%       [7.0, 38.0, 86.0, 28.0, 58.0]
 kc-at-buf    Emmett Johnson atd_1_plus    Emmett Johnson  -138 58% 10 40%   80%                     [0, 1, 1, 2, 1]
phi-at-dal    George Pickens atd_1_plus    George Pickens   104 49% 10 40%   60%                     [0, 1, 0, 3, 1]
phi-at-dal    George Pickens        rec                4+  -426 81% 10 70%   80%                    [6, 4, 2, 11, 7]
phi-at-dal    George Pickens        rec                5+  -186 65% 10 60%   60%                    [6, 4, 2, 11, 7]
phi-at-dal    George Pickens        rec              Over   108 48% 10 60%   60%                    [6, 4, 2, 11, 7]
phi-at-dal    George Pickens        rec                6+   113 47% 10 60%   60%                    [6, 4, 2, 11, 7]
phi-at-dal    George Pickens    rec_yds               30+ -1150 92% 10 90%  100%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds               40+  -525 84% 10 90%  100%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds               50+  -300 75% 10 70%   80%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds               60+  -186 65% 10 60%   60%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds              Over  -122 55% 10 60%   60%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds               70+  -117 54% 10 60%   60%    [73.0, 57.0, 48.0, 145.0, 102.0]
phi-at-dal    George Pickens    rec_yds               80+   117 46% 10 40%   40%    [73.0, 57.0, 48.0, 145.0, 102.0]
chi-at-det      Jahmyr Gibbs atd_1_plus      Jahmyr Gibbs  -245 71% 10 90%   80%                     [0, 1, 1, 2, 2]
chi-at-det      Jahmyr Gibbs    carries              Over  -113 53% 10 80%  100%                [29, 23, 20, 22, 23]
chi-at-det      Jahmyr Gibbs        rec                3+  -669 87% 10 80%   60%                     [5, 2, 0, 7, 4]
chi-at-det      Jahmyr Gibbs        rec                4+  -245 71% 10 80%   60%                     [5, 2, 0, 7, 4]
chi-at-det      Jahmyr Gibbs        rec              Over  -117 54% 10 60%   40%                     [5, 2, 0, 7, 4]
chi-at-det      Jahmyr Gibbs        rec                5+  -108 52% 10 60%   40%                     [5, 2, 0, 7, 4]
chi-at-det      Jahmyr Gibbs        rec               11+   127 44% 10  0%    0%                     [5, 2, 0, 7, 4]
chi-at-det      Jahmyr Gibbs    rec_yds               20+  -488 83% 10 80%   60%         [27.0, 15.0, 0, 99.0, 20.0]
chi-at-det      Jahmyr Gibbs    rec_yds               30+  -178 64% 10 50%   20%         [27.0, 15.0, 0, 99.0, 20.0]
chi-at-det      Jahmyr Gibbs    rec_yds               40+   108 48% 10 40%   20%         [27.0, 15.0, 0, 99.0, 20.0]
chi-at-det      Jahmyr Gibbs   rush_yds               50+ -1150 92% 10 90%  100%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds               60+  -567 85% 10 80%  100%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds               70+  -317 76% 10 80%  100%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds               80+  -203 67% 10 70%   80%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds               90+  -138 58% 10 70%   80%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds              100+   108 48% 10 50%   60%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det      Jahmyr Gibbs   rush_yds              110+   150 40% 10 50%   60%   [116.0, 153.0, 74.0, 153.0, 98.0]
chi-at-det        Jared Goff    pass_td              Over  -223 69% 10 70%   60%                     [2, 1, 0, 3, 2]
chi-at-det        Jared Goff   pass_yds              200+ -1150 92% 10 80%   60% [303.0, 176.0, 170.0, 303.0, 279.0]
chi-at-det        Jared Goff   pass_yds              250+  -245 71% 10 70%   60% [303.0, 176.0, 170.0, 303.0, 279.0]
chi-at-det        Jared Goff   pass_yds              280+  -122 55% 10 40%   40% [303.0, 176.0, 170.0, 303.0, 279.0]
chi-at-det        Jared Goff   pass_yds              300+   127 44% 10 40%   40% [303.0, 176.0, 170.0, 303.0, 279.0]
phi-at-dal  Javonte Williams atd_1_plus  Javonte Williams  -178 64% 11 73%   60%                     [1, 0, 1, 0, 2]
phi-at-dal  Javonte Williams    carries              Over  -122 55% 11 45%   60%                [25, 24, 20, 16, 18]
phi-at-dal  Javonte Williams        rec                1+  -809 89% 11 91%   80%                     [0, 1, 4, 1, 3]
phi-at-dal  Javonte Williams        rec              Over  -156 61% 11 73%   40%                     [0, 1, 4, 1, 3]
phi-at-dal  Javonte Williams        rec                2+  -150 60% 11 73%   40%                     [0, 1, 4, 1, 3]
phi-at-dal  Javonte Williams    rec_yds              Over  -117 54% 11 64%   40%           [0, 1.0, 23.0, 4.0, 24.0]
phi-at-dal  Javonte Williams   rush_yds               40+ -1150 92% 11 91%  100%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds               50+  -525 84% 11 64%  100%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds               60+  -285 74% 11 55%   80%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds               70+  -163 62% 11 27%   40%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds              Over  -122 55% 11 27%   40%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds               80+   100 50% 11 27%   40%    [155.0, 56.0, 101.0, 63.0, 67.0]
phi-at-dal  Javonte Williams   rush_yds               90+   150 40% 11 27%   40%    [155.0, 56.0, 101.0, 63.0, 67.0]
 kc-at-buf        Josh Allen atd_1_plus        Josh Allen  -117 54% 10 70%   40%                     [0, 1, 0, 2, 0]
 kc-at-buf        Josh Allen    pass_td              Over   113 47% 10 40%   40%                     [2, 2, 1, 1, 1]
 kc-at-buf        Josh Allen   pass_yds              200+  -223 69% 10 90%   80% [255.0, 289.0, 234.0, 196.0, 304.0]
 kc-at-buf        Josh Allen   pass_yds              230+  -108 52% 10 70%   80% [255.0, 289.0, 234.0, 196.0, 304.0]
 kc-at-buf        Josh Allen   pass_yds              240+   108 48% 10 60%   60% [255.0, 289.0, 234.0, 196.0, 304.0]
 kc-at-buf        Josh Allen   rush_yds               20+  -488 83% 10 50%   20%           [1.0, 30.0, 15.0, 5.0, 0]
 kc-at-buf        Josh Allen   rush_yds               30+  -194 66% 10 30%   20%           [1.0, 30.0, 15.0, 5.0, 0]
 kc-at-buf        Josh Allen   rush_yds               40+   104 49% 10 20%    0%           [1.0, 30.0, 15.0, 5.0, 0]
```
