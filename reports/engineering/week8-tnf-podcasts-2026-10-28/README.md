# Week 8 TNF podcast extraction — October 28, 2026

Andy approved paid Gemini transcription and extraction for these two episodes. One model request was made for each. Raw results and logs are saved in this directory; neither result was published or written to Supabase.

| Episode | Public runtime | Gemini result | Independent source check |
|---|---:|---|---|
| [Ross Tucker: 2026 NFL Week 8 PICKS!](https://www.youtube.com/watch?v=M58KQ9kZGBw) | 28:15 | 41 segments; 18 extend past the actual video end, with the last at 46:55 | **HOLD Gemini timestamps:** result is internally inconsistent. YouTube has no captions. The existing local Parakeet ASR independently transcribed the retained audio through 28:15; its wording still needs a human audio spot-check. |
| [Sharp or Square: Week 8 Betting Spotlight](https://www.youtube.com/watch?v=NG-2BbFS3nU) | 11:24–11:25 | 7 summary segments, 2 candidate picks | A separately retained YouTube automatic-caption transcript covers the episode. Captions support the Carolina +3.5 lean and the short-week context. Auto-caption wording and speaker attribution still need human review. |

The Gemini runner incorrectly reported the Ross Tucker extraction as complete: its coverage check accepts a final timestamp past the runtime. Its summaries, picks and quoted text are **not verified source evidence** and must not be promoted. The model's claimed `coverage_check` is not proof of actual coverage. Local Parakeet ASR indicates that around 9:33 the host gives a 24–23 Green Bay straight-up prediction, not an against-the-spread pick. This is an automated transcription, not a human-verified quotation; its timestamp differs materially from Gemini's 15:42. Files: `ross-tucker-local.json`, `ross-tucker-local.txt`, and the retained audio. The Sharp or Square Gemini output contains summaries rather than a verbatim transcript; the independent captions are `sharp-or-square-youtube-auto-captions.txt`, SHA-256 `cb7035293c486985b5d08db3dc305115f1a9fd8388b37c21c556df796e889200`.

The retained caption transcript begins with the displayed Carolina +3.5 line and records Chad identifying Carolina as his choice around 0:33–1:14. The show's cited historical system is a host assertion, not an independently validated statistic. A previously saved Wednesday price is not a current or executable quote.

The separately authorized read-only Supabase query found zero promoted podcast rows created since October 27 at 12:00 AM Pacific. That is a scoped query result, not proof that no older-created episode was promoted later. Receipt: `../week8-promoted-podcast-read-2026-10-28.json`.

Model response counts and the runner's estimated costs are retained inside the raw JSON; the runner uses hard-coded rate assumptions, so those figures are **not a verified bill**. No repeat paid request has been made.
