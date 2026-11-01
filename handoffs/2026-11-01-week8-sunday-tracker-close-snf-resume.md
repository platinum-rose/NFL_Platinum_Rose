# Week 8 Sunday tracker close → SNF Island stacks

Date: November 1, 2026 (America/Los_Angeles).
Verified source checkpoint: `dff182a` on `claude/w5-prop-cards-2026-10-11`.
The subsequent handoff-only commit advances HEAD; reconcile live Git first.

## CRITICAL — pickup and boundaries

1. Read root `HANDOFF.md`, reconcile branch/HEAD/index/worktree, then read only this
   dated handoff for this lane. Reuse this checkout: important private inputs are
   deliberately local and cannot be recovered from a fresh public clone.
2. Next task: build and discuss **Week 8 PHI@WAS SNF Island stacks**, proposals only.
   The saved schedule has kickoff `2026-11-02T01:20:00Z`, **Sunday November 1,
   5:20 PM Pacific**. Reconfirm game state; stop if it has started or is final.
3. Read `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`,
   `docs/NFL_WEEKLY_CARD_PROCESS.md` slot 9, and
   `docs/antigravity/CANONICAL_EXTRACTION_PIPELINE.md` before synthesis. The prior
   TNF construction in `reports/bets/2026-w08-tnf-island-ladder-2026-10-29.md` is a
   shape/rule reference, not a reusable current line/roster source.
4. Run `node scripts/weekly-synthesis-preflight.mjs --week 8 --no-fetch` first.
   `--no-fetch` also prevents the Gemini billing probe, which can make a paid call.
   Refresh free ESPN roster evidence with the approved roster workflow and run a
   strict vet against the explicit SNF candidate card/digest before naming players.
   Do not bypass a blocker or silently reuse stale required evidence.
5. No wager placement, sportsbook account access, paid calls/synthesis, Supabase
   writes, publication, push or tracker rebuild without Andy's current per-action
   authorization. The closeout push authorization was for this reviewed closeout;
   it is not standing approval for later publication or external writes.

## IMPORTANT — Island template and evidence

- Tier 1: $10 at +600–1000. Tier 2: $5 at +1800–3000. Tier 3: $5 at
  +6500–20000. Diversify legs; no shared anchor across tiers. Flag player overlap
  across different markets. These are template amounts/targets, not placed wagers.
- Use player props for the Island ladder; preserve the no-full-game-spread/total
  rule from the prior Island work. No prop round robins. Apply the -350 leg barrier
  and flag more than two legs shorter than -200. BKR SGPs do not accept INT legs.
- Check any BEO primetime insurance terms before assigning a promotion to Tier 3.
- Capture or request fresh, timestamped, placeable SNF prices. A Friday reference
  product or a named market heading is not an accepted combo quote. Keep raw,
  private/account and paid access boundaries intact.
- Reconcile current official exposure and ownership from the **local** canonical
  wager ledger before proposing another SNF stack. Never treat an explored ML RR,
  a paper ticket or a proposal as placed. Never add mutually exclusive profits.

## IMPORTANT — local data and tracker state

- Canonical local placed-wager ledger: `data/official-picks/user-placed-wagers-2026.json`.
  It contains the Sunday official-ticket intake, explicit two-way/three-way shares,
  individual plays, and a solo owner. It was intentionally NOT included in the
  public closeout commit. Preserve its working bytes.
- The tracker generators read that local ledger directly; do not run the Supabase
  bankroll sync merely to regenerate HTML. Explicit non-Andy solo ownership still
  needs owner-aware handling before any separately approved personal-bankroll sync;
  the legacy normalizer currently does not enforce the new ownership exclusion.
- Local desktop outputs: `public/live-tracker-sunday.html` and
  `docs/tracked-wagers/live-tracker-sunday.html`. Local phone output:
  `public/live-tracker-mobile.html`; its grading state is
  `public/live-tracker-mobile-state.json`. These personal generated pages remain
  local. The phone file is a snapshot, not a polling feed.
- Downloadable versions are under `E:/data/exports/PlatinumRose/`. Last verified
  ticket-intake snapshot was November 1 at 1:16 PM Pacific. Do not call it current
  game status without a newly authorized refresh.
- Eight recorded FanDuel Predicts tickets were reconciled against both generators:
  two cash qualifiers and six bonus slips. All eight are in the desktop HTML.
  Mobile intentionally lists active real slips only and hides cashed/burnt ones.
  Desktop Cash versus Promo Credits filters can also explain apparently missing
  tickets. One recorded FD bonus slip lacks an order number; its legs are present.
- Week 8 has 19 imaginary slips: three prior Pick 6 entries plus 16 historical
  main-card structures (four singles, ten parlays, two RRs; 77 restored leg
  instances). They preserve the frozen Friday lines/prices and disclose that they
  were logged after kickoff. Two historical inactive-player legs are flagged for
  review rather than assigned an automatic loss/void. Three first-TD paper legs
  also retain manual review. Settled paper cards can be expanded to inspect legs.
- Paper stakes stay outside real-money totals. Unknown Pick 6 payouts are excluded
  from known paper P&L. Current price arithmetic is reference-only for historical
  templates, never a claim of a current executable offer.

## BLOCKERS / unfinished work

- The closeout no-fetch preflight at `2026-11-01T22:29Z` was not green: full ESPN
  rosters were about 25h old (24h maximum); usage about 125h old (72h maximum);
  prediction-market/coherence and Alpha snapshots were stale; promoted podcast
  intelligence had zero promoted episodes/picks; the legacy Week 8 board check
  found zero board files. The broad roster vet also blocked on an inactive player
  in old card/digest material. Refresh required SNF inputs and vet the actual SNF
  scope; do not present that old card as current readiness.
- Full unit suite is not green: **2,094/2,114**, 20 failures in ten files. Focused
  tracker/cadence checks are **34/34** across seven files; Python importer checks
  are **4/4**; production build passed. See
  `reports/engineering/week8-sunday-closeout-2026-11-01.md` for failure categories.
  In particular, unresolved futures execution-classification assertions are not
  execution proof; futures are outside this SNF task.
- Git auto-GC encountered two pre-existing empty/broken stale remote-ref lock
  artifacts. The commit and ordinary branch push succeeded. No refs were removed
  and no global Git settings changed. For another closeout commit, per-command
  `-c gc.auto=0` avoids the unrelated auto-GC failure; repair the stale metadata only
  as a separate, backed-up task if needed.
- Checkout remains intentionally dirty: private financial/ownership records,
  personal generated trackers, account material, survivor state, raw mail/media,
  source captures, backups and scratch work were preserved locally. Never clean,
  reset, stash or broad-stage them. No merge to `main` was performed.

## Verification and local recovery

The public repository is `https://github.com/platinum-rose/NFL_Platinum_Rose`.
Andy explicitly requested private/raw files stay local after visibility review.
Only explicit reviewed paths were staged. The public credential scan and staged
whitespace check passed. Production build passed with bundle/browser-data
advisories. Tests used writable temporary storage, permitted loopback networking,
blocked external fetches, and cleared paid-provider keys for the test process.

Private inventory, retained-file classifications, original index patch, complete
test logs/JSON and the no-fetch preflight are under
`E:/data/exports/PlatinumRose/git-closeout-2026-11-01/`.
Local ticket-intake/source-preservation/browser audits are in
`data/generated/tracker-qa/`. These are local recovery material, not public files.

## Resume prompt (source checkpoint; reconcile the handoff-only tip)

```text
Resume Platinum Rose NFL. Source checkpoint HEAD = dff182a
(claude/w5-prop-cards-2026-10-11); the subsequent handoff-only commit advances HEAD.
Suite: 34/34 focused JS + 4/4 Python; full suite 2094/2114, 20 unresolved.
Next: Week 8 PHI@WAS SNF Island stacks, proposals only.
Repo: E:\dev\projects\NFL_Dashboard.
Read HANDOFF.md, reconcile live Git, then read only
handoffs/2026-11-01-week8-sunday-tracker-close-snf-resume.md.
Load the weekly synthesis prompt and slot 9 Island template. Run the current
no-fetch preflight, refresh required SNF evidence, and pass a scoped strict roster
gate before naming candidates. Kickoff is Sunday Nov 1, 5:20 PM PT; reverify state.
Preserve the dirty private ledgers/trackers and reconcile local official exposure
and ownership. No wagers, accounts, paid calls, Supabase writes, publication, push
or tracker rebuild without current per-action approval. Do not republish the
private/raw files retained during the public closeout.
```
