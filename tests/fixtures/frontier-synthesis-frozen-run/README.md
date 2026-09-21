# frontier-synthesis-frozen-run fixtures

Durable, clearly-named EMPTY fixtures for a suppressed
(`--suppress-scenario-structures`) frozen pre-kickoff test/dev run of
`agents/portfolio-synthesize.js`, so a frozen/suppressed run never touches
real production data under `data/futures-imports/` or `data/expert-dossiers/`
by accident (those are the CLI's default `--ledger`/`--watchlist`/
`--official-config`/`--promotions`/`--expert-dossiers` paths).

None of these replace or modify any live data file -- they are new,
isolated, additive fixtures only.

- `watchlist.empty.json` -- pass as `--watchlist`. An exactly-empty `items`
  array, which is also what `checkStartupInvariant()` in
  `agents/lib/scope-enforcement.js` requires under suppression.
- `promotions.empty.json` -- pass as `--promotions`. An exactly-empty
  `promotions` array (trivially in-scope, since there is nothing to check).
- `ledger.empty.json` -- pass as `--ledger`. `loadLedger()` does no shape
  validation beyond `JSON.parse`, so `{}` is a safe empty ledger.
- `official-config.empty.json` -- pass as `--official-config`. Same as the
  ledger: `loadOfficialConfig()` does no shape validation beyond
  `JSON.parse`.
- `expert-index.empty.json` -- pass as `--expert-dossiers`. An empty
  `dossiers` array, matching the shape `loadExpertDossiers()` expects
  (`index.dossiers`).
- `approved-dossier-contract.TEMPLATE.json` -- **template only, not a real
  contract**. Shows the exact shape
  `agents/lib/dossier-provenance.js`'s `assertDossierProvenanceApproved()`
  requires for `--approved-dossier-contract` (Codex rev-23-followup4
  finding #3). Every value inside is a placeholder; Andy must supply the
  real resolved path / SHA-256 / `generated_at` / `kickoff_at` of the
  dossier he has actually reviewed and approved before any suppressed run
  can pass this check. This tool does not and must not invent those
  values.

Example invocation using all five data fixtures (still requires a real
`--dossier` and a real `--approved-dossier-contract` -- neither can be
faked):

```
node agents/portfolio-synthesize.js \
  --dossier data/futures-imports/dossier-YYYY-MM-DD.json \
  --suppress-scenario-structures --no-persist --disable-live-context-bridges \
  --watchlist tests/fixtures/frontier-synthesis-frozen-run/watchlist.empty.json \
  --promotions tests/fixtures/frontier-synthesis-frozen-run/promotions.empty.json \
  --ledger tests/fixtures/frontier-synthesis-frozen-run/ledger.empty.json \
  --official-config tests/fixtures/frontier-synthesis-frozen-run/official-config.empty.json \
  --expert-dossiers tests/fixtures/frontier-synthesis-frozen-run/expert-index.empty.json \
  --approved-dossier-contract <a real, filled-in contract file>
```
