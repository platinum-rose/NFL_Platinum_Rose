# Tweet Intel Drop Folder

Drop files here, then run `npm run ingest-tweets`.
The agent processes everything, writes to Supabase `research_intel_notes`, and archives the files.

---

## Supported formats

### Images (.png / .jpg / .webp)
Screenshot a tweet — the whole tweet card, or even a screenshot of multiple tweets,
a chart, or a stats image. Claude vision extracts the handle, text, URL, and date.
One image can contain multiple tweets.

```
data/tweet-drops/vsin-kc-line-movement.png
data/tweet-drops/action-network-picks-sept-10.jpg
data/tweet-drops/pff-grades-screenshot.png
```

### Text files (.txt)
Paste one or more tweets. Separate multiple tweets with `---`.

```
@VSiN
Sharp money on KC -3.5 vs BAL. Line moving from -3 to -3.5. Books adjusting fast.
https://x.com/VSiN/status/1234567890123456789

---

@ActionNetworkHQ
65% public on Eagles. Sharp at Pinnacle hitting Cowboys +6.5. Steam move.
https://x.com/ActionNetworkHQ/status/9876543210987654321
```

### JSON files (.json)
For bulk or programmatic drops.

```json
[
  {
    "handle": "@VSiN",
    "text": "Sharp money on KC -3.5 vs BAL.",
    "url": "https://x.com/VSiN/status/...",
    "date": "2026-09-10"
  },
  {
    "handle": "@FantasyDouche",
    "text": "Tyreek Hill target share is going to explode this week.",
    "url": null,
    "date": null
  }
]
```

---

## Commands

```bash
npm run ingest-tweets        # process drop folder → Supabase → archive files
npm run ingest-tweets:dry    # preview extraction without writing or archiving
```

---

## Notes

- Processed files move to `data/tweet-drops/processed/YYYY-MM-DD/` automatically.
- Dedup is by content — re-dropping the same tweet does nothing (no duplicate rows).
- Image extraction requires at least one vision API key in your `.env`:
  - `ANTHROPIC_API_KEY` — Claude (primary)
  - `GEMINI_API_KEY` — Gemini 2.0 Flash (first fallback)
  - `OPENAI_API_KEY` — GPT-4o (second fallback)
  The agent tries each in order and uses the first that succeeds.
- Text/JSON files work without any API key.
- Extracted intel lands in `research_intel_notes` (source_type: 'tweet', confidence: 0.75).
  The BETTING agent can pull this context during game-day sessions.
