# NFL Dashboard — Feature & Architecture Backlog

> Persistent across sessions. Read at session start via HANDOFF_PROMPT.md Persistent Backlogs.
> Mark `[ ]` → `[x]` only when committed to `main` and verified.
> Add new items at the bottom of the appropriate section.

---

## Data Ingestion

### [ ] X/Twitter Sharp-Account Intel — manual drop workflow
**Added:** 2026-06-06
**Updated:** 2026-06-07 (RSSHub requires X API credentials; $100/mo X API rejected)
**Priority:** Medium (offseason — needed before in-season)
**Effort:** Done (infrastructure); ongoing (manual curation)

**Background:**
`agents/x-sharp-ingest.js` (F-13) was built to fetch tweets from curated sharp NFL accounts
via RSSHub. Self-hosted RSSHub was attempted on M6 but requires real Twitter API credentials
even for self-hosted instances — X killed unauthenticated scraping. X API Basic tier is
$100/month, which is not worth it for this data.

All RSS-backed accounts (SharpFootball, PFF, PFT, Rotowire, Football Outsiders, ESPN) have
been moved to `research-intel-ingest.js` where they belong. `x-sharp-ingest.js` remains
DORMANT — it only activates if free X access becomes available again.

**Chosen path: manual tweet drops via `data/vault-seed/manual/`**

The vault-seed agent already processes `.md` files from this directory and writes them to
`vault_notes` (path: `NFL/Reference/<filename>.md`), where the BETTING agent can find them.

**Workflow:**
1. See an interesting tweet from a sharp account (VSiN, ActionNetworkHQ, FantasyDouche, etc.)
2. Copy the tweet text + URL into a dated markdown file (see template below)
3. Save as `data/vault-seed/manual/sharp-intel-YYYY-MM-DD.md`
4. Run `npm run seed:vault:manual` — done

**File format** (`data/vault-seed/manual/sharp-intel-YYYY-MM-DD.md`):
```markdown
# Sharp Intel — YYYY-MM-DD

## @VSiN — YYYY-MM-DD
Sharp money on KC -3.5 vs BAL. Line moving from -3 to -3.5. Books adjusting fast.
https://x.com/VSiN/status/...

## @ActionNetworkHQ — YYYY-MM-DD
65% public on Eagles. Sharp money hitting Cowboys +6.5 at Pinnacle. Steam move.
https://x.com/ActionNetworkHQ/status/...
```

A `TEMPLATE.md` is in `data/vault-seed/manual/` — copy, rename with today's date, fill in tweets.

**Implementation steps:**
- [x] `data/vault-seed/manual/` directory exists
- [x] `vault-seed.js` processes `.md` files from manual/ → vault_notes
- [x] `npm run seed:vault:manual` script added to package.json
- [x] `data/vault-seed/manual/TEMPLATE.md` created
- [ ] (Optional) Extend research-intel-ingest to also read from a local `data/manual-intel/` dir
      and write to `research_intel_notes` with proper dedup — only if vault_notes path proves
      insufficient for BETTING agent context retrieval

**Target sharp accounts to watch manually:**
- `@VSiN` — sharp money, line movement, bookmaker intel
- `@ActionNetworkHQ` — picks, public money, steam moves
- `@FantasyDouche` (Adam Levitan) — DFS, props, targets, air yards
- `@MattEchols` (SIS) — EPA, situational, run-pass analytics
- `@bettingpros` — consensus, best bets

---

## Agent / UI Features

*(add items here as they come up)*

---

## Infrastructure

*(add items here as they come up)*

---

## Progress Tracker

| Section | Total | Open | Done |
|---------|-------|------|------|
| Data Ingestion | 1 | 1 | 0 |
| Agent / UI Features | 0 | 0 | 0 |
| Infrastructure | 0 | 0 | 0 |
| **Total** | **1** | **1** | **0** |
