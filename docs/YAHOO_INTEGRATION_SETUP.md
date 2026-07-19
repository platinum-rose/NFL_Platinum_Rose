# Yahoo Fantasy Integration — Setup

Connects your Yahoo fantasy leagues to NFL_Dashboard via Yahoo's official Fantasy
Sports API (OAuth2). It pulls two things:

1. **Yahoo consensus ADP** (`average_pick` across Yahoo drafts + mock drafts) → the
   `fantasy_adp` table with `source='yahoo'`. This is the most relevant ADP for a
   Yahoo-hosted league, because it reflects how Yahoo drafters actually draft.
2. **Your league scoring settings** (per-stat point values) → a JSON file per
   league, plus the inferred `--scoring` bucket (ppr | half | standard) so the
   value board runs in *your* league's format.

No third-party service or connector is involved — it's a small native client in
this repo (`src/lib/yahoo.js`).

---

## Step 1 — Register a Yahoo developer app (one time, ~5 min)

You have to create the app under **your** Yahoo account (it's tied to your login).

1. Go to <https://developer.yahoo.com/apps/> and sign in with your Yahoo account.
2. Click **Create an App** and fill in:
   - **Application Name:** e.g. `ATLAS NFL Dashboard`
   - **Application Type:** `Web Application`
   - **Redirect URI(s)** (a.k.a. Callback Domain): `https://localhost`
     Yahoo requires an `https` URI. `https://localhost` is fine — the browser will
     just fail to load the page after you approve, and you copy the `code` out of
     the address bar. (If Yahoo rejects it, use any `https://` URL you control.)
   - **API Permissions:** check **Fantasy Sports** → **Read** (Read/Write also works
     but Read is all this integration needs).
3. Click **Create App**. Yahoo shows you a **Client ID (Consumer Key)** and a
   **Client Secret (Consumer Secret)**.

## Step 2 — Add the credentials to `.env`

`.env` already has placeholders (appended by the integration). Fill them in:

```
YAHOO_CLIENT_ID=<your Client ID>
YAHOO_CLIENT_SECRET=<your Client Secret>
YAHOO_REDIRECT_URI=https://localhost
```

`.env` is gitignored; tokens live in `.nfl/yahoo/` which is also gitignored.

## Step 3 — Authorize (one time)

```
node scripts/yahoo-auth.js
```

It prints a consent URL. Open it, sign in, click **Agree**. Your browser redirects
to `https://localhost/?code=XXXX...` (the page won't load — expected). Copy the
`code` value from the address bar (or paste the whole redirected URL) back into the
prompt. Tokens are saved to `.nfl/yahoo/tokens.json` and **auto-refresh** after this
— you won't need to repeat this unless you revoke access.

## Step 4 — Pull ADP and scoring

```
# Yahoo consensus ADP → fantasy_adp (source='yahoo'); dry-run writes only a CSV snapshot
node agents/yahoo-adp-ingest.js --dry-run
node agents/yahoo-adp-ingest.js                 # live upsert into fantasy_adp

# Your league scoring settings → data/fantasy/yahoo-league-<key>-scoring.json
node agents/yahoo-league-settings.js
```

`yahoo-league-settings.js` prints the inferred scoring bucket per league, e.g.:

```
✅ Family Dynasty: bucket=ppr (rec 1pt) · 22 scoring rules → data/fantasy/yahoo-league-...-scoring.json
   → value board: node agents/fantasy-value-report.js --scoring ppr
```

## Step 5 — Run the value board on Yahoo data

```
node agents/fantasy-value-report.js --scoring <bucket>
```

With no `--adp` flag it reads the latest `fantasy_adp` (now Yahoo's). Output lands in
`docs/fantasy/value-board-<date>.{json,md,html}`.

---

## Notes & caveats

- **Offseason ADP:** in the deep offseason Yahoo may publish little or no
  `draft_analysis`. `yahoo-adp-ingest.js` exits with a clear message if none is
  returned. The FantasyFootballCalculator stopgap seed
  (`data/fantasy/adp-2026-07-15.csv`, `source='fantasyfootballcalculator'`) covers
  the board until Yahoo's ADP fills in closer to draft season.
- **Your league's own draft ADP** only exists *after* your league drafts. Until then
  this uses Yahoo's game-level consensus, which is what you want for draft prep.
- **Player-name join:** Yahoo player IDs differ from nflverse gsis IDs, so ADP rows
  store `player_id=null` and the value report name-joins to `player_season_stats`
  (same as the CSV seed).
- **Token security:** never commit `.nfl/yahoo/tokens.json` or your Client Secret.
  Both are gitignored. If a secret leaks, regenerate it in the Yahoo app dashboard.
- **Custom scoring:** v1 maps your league to the coarse `--scoring` bucket. The full
  per-stat modifiers are saved in the league JSON for a future exact-scoring
  projection (a follow-up, mirroring how the futures spec grew).
