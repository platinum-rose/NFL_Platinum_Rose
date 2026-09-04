# 🏈 Claude Handoff: Action Network Feed Fix — Committed, Needs Production Validation

> **Date:** September 2, 2026
> **Author:** Claude (Cowork)
> **Target:** Next Claude session, Andy
> **Status:** Fix for Action Network's research-intel feed is committed and pushed to `main` (commit `ffa1ac4`). It has NOT yet been validated against the real GitHub Actions workflow. That's the next step.

---

## What happened this session

This continues `handoffs/2026-09-02-intel-robustness-closeout.md` (the 4-item
intel-robustness audit — all closed). Andy asked to deprioritize THE WINDOW
and focus specifically on getting Action Network's feed working in
production, using this article as a concrete example of currently-missed
content: https://www.actionnetwork.com/nfl/nfc-west-predictions-picks-for-seahawks-rams-49ers-more

### Background (from the prior session)
Action Network's feed had already been routed through `fetchMethod: 'curl'`
in an earlier session to dodge a Node-fetch client-fingerprint block. That
worked from the device's own network but was confirmed **still failing from
GitHub Actions** (`Unsupported content-type: text/html`) via two live
`workflow_dispatch` runs — a distinct, IP-reputation-style block on
GitHub-hosted runner IP ranges, not the original fingerprint issue.

### This session's fix
Routed the feed through the `r.jina.ai` reader proxy (fetches server-side
from its own non-CI IPs, returns the page as text with the actual RSS XML
intact inside it). First attempt at validating this hit an unexplained 403
that contradicted an earlier successful bare-curl test of the identical
proxy URL — chased that down and found the real cause:

**r.jina.ai has its own, separate Cloudflare bot-mitigation.** A curl
request with a browser-like User-Agent (the `fetchViaCurl()` default) trips
r.jina.ai's own JS challenge and returns a 403 `cf-mitigated: challenge`
page. The identical request with **no** `-A` flag at all gets a clean 200
with the real feed body. Confirmed via direct side-by-side curl tests.

**Fix:** added `curlUA: null` to Action Network's FEEDS entry (same pattern
already used for ESPN NFL) so `fetchViaCurl()` omits the User-Agent header
for this feed specifically, plus `bodyOnlyFeedCheck: true` (the proxy always
reports `content-type: text/plain`, so content-type sniffing has to be
skipped and the existing `<rss|<feed|<rdf:RDF>` body-check relied on
instead — that part was already in place from the first fix attempt).

Validated end-to-end against the **exact** `fetchViaCurl()` +
`parseRssItems()` code path (via a standalone harness script, not the real
ingest script — no Supabase writes): `200`, 12 items parsed cleanly,
including the specific article Andy linked, which is live in the feed
right now.

**Committed and pushed** (Andy explicitly authorized both this session):
- Commit `ffa1ac4d7166459cc62dff82c0179a22f378ebdc` on `main`
- `agents/research-intel-ingest.js`, +35/-1 lines
- Pushed clean (`4347efa..ffa1ac4`), no token/workflow-scope issues

Note: a **stale `.git/index.lock`** blocked the normal `git add`/`git
commit` flow (leftover from another in-flight agent/process, not removable
via `rm` due to bridge permission limits). Worked around it using the
documented pattern from project memory: `GIT_INDEX_FILE=/tmp/...`, `git
read-tree HEAD` + `git update-index --add <file>`, `git write-tree`, `git
commit-tree`, then `git update-ref refs/heads/main <sha>` directly. This
bypasses the lock file entirely rather than needing to delete it. Worth
reusing this pattern again if the lock reappears (it's owned by some other
concurrent agent's process, not this session).

---

## Open item for next session: validate in production

The fix is **committed and pushed but not yet exercised against the real
GitHub Actions workflow**. Everything so far was validated via a standalone
test harness mimicking the production code path, not the actual
`research-intel-ingest.js` script run for real (per the standing
no-Supabase-writes-without-authorization guardrail — that script's
`checkFeedHealthAndAlert()` upserts to `feed_health` unconditionally, even
in dry-run).

**Next step:** ask Andy to authorize manually triggering the
`research-intel-ingest.yml` GitHub Actions workflow (same
`workflow_dispatch` REST API pattern used earlier this session for the ESPN
NFL / THE WINDOW validation — `gh` CLI is not installed on this box, use
the GitHub REST API directly with the push token from `.github_push_token`
or `$GITHUB_TOKEN`). Then check `feed_health` in Supabase afterward to
confirm Action Network shows `available` with a fresh timestamp and 0
consecutive fails, and spot-check `research_intel_notes` for newly-ingested
Action Network articles (e.g. the NFC West piece).

If it fails in production again, the two most likely next culprits:
1. r.jina.ai itself rate-limits or blocks the GitHub Actions IP range
   independently (its own Cloudflare protection, separate from Action
   Network's) — would need a different proxy or a retry/backoff strategy.
2. Some other header curl sends by default (Accept, Accept-Encoding) could
   also be tripping r.jina.ai's bot detection beyond just User-Agent — worth
   testing with `-H "Accept: */*"` explicitly if the UA fix alone doesn't
   hold up on GitHub's runners.

## Still deprioritized (not abandoned)
- **THE WINDOW**: `fetchMethod: 'curl'` fix is committed (from the prior
  session, same push) but still fails from GitHub Actions with the same
  IP-reputation pattern as Action Network had. Untouched this session per
  Andy's explicit direction to focus on Action Network first. The same
  r.jina.ai + `curlUA: null` approach would likely apply here too, once
  Action Network's fix is confirmed solid in production.
- **ESPN NFL**: fixed and confirmed working in production last session
  (migrated to ESPN's JSON API). No further action needed.
- **Football Outsiders**: domain is dead (DNS NXDOMAIN). Accepted as
  permanently down, no action needed.

## Still pending from the original audit
- A real `portfolio-synthesize.js` committee pass (paid multi-model API
  calls) has not yet been run — deferred through several rounds of
  freshness-checking (podcasts, then articles, then this feed-fix
  detour). Still needs Andy's **explicit authorization** before running,
  since it's a paid call. This remains the actual destination once feed
  health work wraps up.
- Minor/optional, not yet fixed: `NON_NFL_TITLE_HINTS` filter gap for
  "TOUR Championship" / "BMW Championship" golf events; cosmetic trailing
  " ..." artifact in Action Network title/description text via the jina
  proxy (deliberately left alone to avoid touching the shared `cleanHtml()`
  function used by every other feed).

---

## Standing Constraints & Guardrails (unchanged)

- Preserve the dirty worktree — large pre-existing uncommitted changes
  belong to other in-flight sessions/agents. Do not `git add -A`, stash, or
  revert anything not directly touched this pass.
- No Supabase writes, betting/pick-action/portfolio mutation, or **paid
  model/API calls** (this includes actually running `portfolio-synthesize.js`
  for a real committee pass) without Andy's **explicit, direct**
  authorization.
- No Yahoo Fantasy work.
- Commit/push only with explicit per-instance approval (already given and
  used this session for the Action Network fix).
- If a stale `.git/index.lock` blocks `git add`/`git commit`, use the
  `GIT_INDEX_FILE` + `write-tree` + `commit-tree` + `update-ref` workaround
  rather than trying to `rm` the lock file (bridge permissions block that).

---

## 📋 Resume Prompt

```
Resume NFL Dashboard development from handoff:
`handoffs/2026-09-02-action-network-fix.md`.

Context snapshot:
- Action Network's research-intel feed fix is committed and pushed to main
  (commit ffa1ac4): routes through the r.jina.ai reader proxy with
  curlUA: null (r.jina.ai has its own Cloudflare bot-mitigation that a
  browser User-Agent trips) and bodyOnlyFeedCheck: true. Validated via a
  standalone harness matching the exact production fetchViaCurl() +
  parseRssItems() code path -- 200, 12 items parsed, including live
  articles not yet in Supabase.
- NOT yet validated against the real GitHub Actions workflow -- that's the
  next step. Ask Andy to authorize a manual workflow_dispatch trigger of
  research-intel-ingest.yml, then check feed_health + research_intel_notes
  in Supabase to confirm it holds in production (GitHub Actions runner IPs
  have caused two prior surprises here -- don't assume device-side success
  means production success).
- THE WINDOW's curl fix is also committed but still fails from GitHub
  Actions (same IP-reputation pattern) -- explicitly deprioritized by Andy,
  not abandoned. Likely needs the same r.jina.ai treatment once Action
  Network is confirmed solid.
- ESPN NFL is fixed and confirmed working in production. Football
  Outsiders' domain is dead, accepted as permanently down.
- The real portfolio-synthesize.js committee pass (paid API calls) is still
  pending Andy's explicit authorization -- this is the actual next
  milestone once feed health is settled.

Standing constraints:
- No Supabase writes, betting/portfolio mutation, or paid model/API calls
  without Andy's explicit authorization.
- Preserve the dirty worktree -- large pre-existing uncommitted changes
  belong to other agents/sessions in flight.
- No git add -A, commit, or push without explicit approval.
- Stale .git/index.lock: use GIT_INDEX_FILE + write-tree + commit-tree +
  update-ref workaround, not rm.

Please confirm with Andy on triggering the production validation, or
proceed as directed.
```
