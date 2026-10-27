# Yahoo Fantasy API: how Platinum Rose accesses it (briefing for Codex)

> Written 2026-10-26 by the Claude team at Andy's request. Inspection only; nothing in the integration,
> its permissions or the Yahoo account was changed. **No credential values appear in this file.**

## 1. Mechanism: a script integration, not an MCP server

There is **no Yahoo MCP server**. The repo has no `.mcp.json` and `.claude/settings.json` holds only hooks,
and the Claude session has no Yahoo tool either. Yahoo is reached by a small native Node client:

| Piece | Path | Role |
|---|---|---|
| OAuth2 + HTTP client | `agents/lib/yahoo.js` | Authorization-code + refresh-token flow, `yget(path)` GET helper, JSON readers |
| One-time consent | `scripts/yahoo-auth.js` | Prints the consent URL, takes the pasted `code`, saves tokens |
| Setup doc | `docs/YAHOO_INTEGRATION_SETUP.md` | App registration and first-run steps |

- **Runs as:** plain Node scripts on Andy's Windows machine (`E:\dev\projects\NFL_Dashboard`), launched by hand,
  npm scripts or Windows Scheduled Tasks.
- **Transport:** outbound HTTPS only, to `api.login.yahoo.com/oauth2/*` (tokens) and
  `fantasysports.yahooapis.com/fantasy/v2/*` (data). Every call is a GET with `?format=json`; there are no write calls.
- **Auth:** OAuth2 authorization code. The client authenticates to the token endpoint with HTTP Basic
  (client ID and secret), then sends `Authorization: Bearer <access token>` on data calls. Access tokens
  auto-refresh 60 s before expiry and again on any 401. The refresh token is reused when Yahoo omits it.
- **Shareable endpoint:** none. Nothing listens on a port.

## 2. Where credentials live (names only)

| Setting | Where | Notes |
|---|---|---|
| `YAHOO_CLIENT_ID` | `.env` (gitignored) | Yahoo app "ATLAS NFL Dashboard" |
| `YAHOO_CLIENT_SECRET` | `.env` (gitignored) | Used only for Basic auth to the token endpoint |
| `YAHOO_REDIRECT_URI` | `.env` | Defaults to `https://localhost` |
| `YAHOO_SCOPE` | optional, unset | Do **not** set it. Passing `scope=fspt-r` makes Yahoo return `invalid_scope` |
| Token store | `.nfl/yahoo/tokens.json` (gitignored, never tracked) | Fields: `access_token`, `refresh_token`, `token_type`, `expires_at` |

Authorization happens once, interactively, through `node scripts/yahoo-auth.js`: Andy signs in to Yahoo in a browser and
pastes back the `code`. After that the token file refreshes itself.

## 3. Current status: working

The 2026-09-03 `additional_authorization_required` block is resolved. Evidence:
- League, pool and roster archives exist under `data/archive/2026/week-01` … `week-06`.
- The `NFL_Dashboard_Yahoo_Survivor_Sync` task last ran 2026-10-26 18:00 PT with result 0, refreshing the token file.
- `NFL_Dashboard_Weekly_Archive` (which includes the Yahoo archive) last succeeded 2026-10-22.

The account shows **5 fantasy leagues** (game 470: `470.l.117200`, `.351555`, `.735815`, `.735870`, `.772245`).
It also has Yahoo Pro Football Pick'em (game 472, group `472.g.4087`), Survival Football (game 476) and a
non-NFL bracket game.

## 4. Scope and data coverage

Access comes from the Yahoo app's **API Permission: Fantasy Sports → Read** (`docs/YAHOO_INTEGRATION_SETUP.md`),
not from an OAuth `scope` parameter. Read only: no add/drop, trades or lineup changes. The permission level on
Yahoo's app dashboard was not re-checked in this inspection.

| Data | Covered | Endpoint used in the repo | Used by |
|---|---|---|---|
| Leagues on the account | Yes | `users;use_login=1/games;game_keys=nfl/leagues` and `.../teams` | `yahoo-league-settings.js`, `yahoo-week-archive.mjs` |
| League settings / scoring | Yes | `league/{lk}/settings` | same |
| Standings | Yes | `league/{lk}/standings` | `yahoo-season-ingest.js`, archive |
| Schedule / matchups | Yes, per week | `league/{lk}/scoreboard;week={n}` (iterate the weeks; there is no single schedule call) | `sync-yahoo-fantasy.mjs`, archive |
| Rosters (all teams, with weekly stats) | Yes | `league/{lk}/teams`, `team/{tk}/roster;week={n}/players/stats;type=week;week={n}` | archive |
| Player stats | Yes | `league/{lk}/players;player_keys=…/stats;type=week;week={n}` | `sync-yahoo-fantasy.mjs` |
| Transactions | Yes | `league/{lk}/transactions` | archive |
| Free agents | Partly | Player search `league/{lk}/players;position=K;sort=OR;…` plus `…/ownership`. The direct `players;status=FA` filter is **not used anywhere yet** but falls under the same read permission (unverified) | `sync-yahoo-fantasy.mjs` |
| Draft results | Yes | via `scripts/archive/yahoo-draft-results.mjs` (`--history N` seasons) | backfill |
| Consensus ADP | Yes | `game/{gk}/players;…/draft_analysis` | `yahoo-adp-ingest.js` |
| Pick'em / Survival groups | Yes (standings, teams) | `group/{gk}/standings`, `group/{gk}/teams` | archive, `sync-yahoo-survivor.mjs` |
| Pick'em individual picks | **No** | `team/{tk}/picks;week=n` returns HTTP 400 | archive logs a warning |

## 5. How Codex can use it

**A. Codex on Andy's machine (simplest; no MCP needed).** Codex runs the same scripts from the repo root and
inherits `.env` plus the token file. Read-only entry points:

```text
npm run fantasy:sync                                          # scripts/sync-yahoo-fantasy.mjs
node scripts/archive/yahoo-week-archive.mjs --week <N>       # full league snapshot for a week
node agents/yahoo-league-settings.js                          # settings + scoring bucket
node agents/yahoo-season-ingest.js                            # standings / scoreboard / my roster
```

For ad-hoc reads, import the client: `import { yget } from './agents/lib/yahoo.js'; await yget('league/<lk>/standings')`.
Run from the repo root, because the token path resolves against `process.cwd()`.

**B. Codex through MCP.** This needs a small wrapper that doesn't exist yet. To expose these reads as MCP tools:
- **Server:** a Node stdio MCP server (for example `scripts/mcp/yahoo-fantasy-mcp.mjs`, using `@modelcontextprotocol/sdk`)
  that imports `agents/lib/yahoo.js` and offers **GET-only** tools:
  `list_leagues`, `get_league_settings(league_key)`, `get_standings(league_key)`, `get_scoreboard(league_key, week)`,
  `get_team_roster(team_key, week?)`, `get_transactions(league_key)`,
  `search_players(league_key, status=FA|A|T, position?, start?, count?)`, `get_draft_results(league_key)`.
  Each returns the parsed `fantasy_content` JSON, optionally flattened with `deepCollect`.
- **Transport:** **stdio**, launched by Codex on the same machine, with `cwd` set to the repo root so it finds `.env` and the tokens.
- **Codex config (redacted example)**, in `~/.codex/config.toml`:

```toml
[mcp_servers.yahoo_fantasy]
command = "node"
args = ["E:/dev/projects/NFL_Dashboard/scripts/mcp/yahoo-fantasy-mcp.mjs"]
cwd = "E:/dev/projects/NFL_Dashboard"     # .env + .nfl/yahoo/tokens.json are read from here
# no secrets in this file; the server reads YAHOO_CLIENT_ID / YAHOO_CLIENT_SECRET from the repo .env
```

- **Hosting:** none needed for stdio on the same machine. Codex in the cloud (not on Andy's PC) would need either
  a hosted HTTPS MCP server holding its own token store and authenticated callers, or a tunnel. A tunnel would expose
  a live Yahoo token holder, so prefer running Codex locally.

**C. Codex with its own authorization.** Reuse the existing Yahoo app. A new app would need Yahoo's separate
Fantasy Sports approval again, which took weeks last time. The steps:
1. Put the same three `YAHOO_*` names in Codex's `.env`, with values supplied by Andy out of band.
2. Run `node scripts/yahoo-auth.js`. Andy approves in a browser and pastes back the `code`.
3. Keep that token file separate. If two copies share one token file, they can overwrite each other's refreshes;
   separate grants avoid that.

## 6. Cautions

- Never print, log or commit `.env` values or `.nfl/yahoo/tokens.json`. Never pass `YAHOO_SCOPE`.
- **Secret rotation:** the client secret was exposed in chat on 2026-08-18 and recorded as not rotated (AUDIT-CX-014,
  last noted 2026-09-03). Confirm it has been rotated before giving another agent access. After a rotation, update `.env`;
  existing tokens keep refreshing because the refresh call sends the current secret.
- Keep Yahoo calls on a schedule (the Survivor sync and Weekly Archive tasks), not polling loops. Yahoo rate limits aren't documented.
