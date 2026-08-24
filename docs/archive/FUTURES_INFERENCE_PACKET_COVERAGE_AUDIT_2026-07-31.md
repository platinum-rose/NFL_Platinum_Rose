# Futures Inference Packet Coverage Audit - 2026-07-31

Purpose: verify which local artifacts are reachable by LLM futures synthesis tasks, identify high-signal files that could be missed, and record the new expert-dossier context lane.

Status: local/read-only audit. No model/API call, Supabase write, official-pick action, production recommendation persistence, or open-parlay mutation was made.

Latest source-audit result: `npm.cmd run intel:source-audit` wrote `.nfl/source-audit/nfl-intel-source-audit-2026-07-31T18-51-51-486Z.json` and returned `BLOCKED` because the normalized July 29 primary-book exports for BetOnline, BetUS, and Bookmaker/BKR are now stale under the audit's freshness rules. The expert-dossier row is present as context: 13 dossiers, 3 local-recovery signals, 0 missing dossier files.

## Newly Wired Context

| Artifact | Status | Inference use |
|---|---|---|
| `data/expert-dossiers/latest.json` | Built from local host citations plus local recovery artifacts | Compact index of expert profiles. Loaded automatically by `agents/portfolio-synthesize.js` when present. |
| `data/expert-dossiers/chad-millman.json` | Built | Analyst-prior/tendency context only. Includes host citation profile plus local-recovery QB rankings. |
| `data/expert-dossiers/simon-hunter.json` | Built | Analyst-prior/tendency context only. Includes host citation profile plus local-recovery QB rankings. |
| `data/expert-dossiers/rich-hribar.json` | Built | Analyst-prior/tendency context only. Has no host-citation history yet; includes local-recovery QB rankings. |
| `docs/antigravity/expert-dossiers/*.md` and `*.html` | Built | Human review copies of the same structured profiles. |

Synthesis runner behavior:

- `agents/portfolio-synthesize.js` now loads expert dossiers from `data/expert-dossiers/latest.json` by default.
- Override path: `--expert-dossiers <path>`.
- Prompt block label: `EXPERT DOSSIER CONTEXT`.
- `scripts/build-intel-source-audit-report.js` now includes an Expert dossiers row under Expert and Podcast Intel.
- Guardrail: expert dossiers can interpret named analyst tendencies and possible blind spots, but they are not price evidence, not official-pick support, and `local_recovery_context_only` signals require manual review.

## Current Manual Packet Coverage

`docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md` now names the expert-dossier lane and the automatic `portfolio-synthesize.js` loader.

Already covered in that packet:

| Category | Covered artifacts |
|---|---|
| Current placeable prices | BetUS July 29, Bookmaker/BKR July 29, BetOnline July 29 normalized import and manual review |
| Portfolio state | bankroll/unit/cap policy, Bills/Packers anchors, open parlays, watchlist targets |
| YouTube accepted intel | promoted local futures export plus review status |
| Podcast deep dives | `docs/podcast-transcript-deep-dives/index.json` |
| Articles | `data/research-intel/review/article-intel-review-latest.json` |
| Training camp | `data/training-camp/2026/latest.json`, `training-camp-intel-2026-07-30.json` |
| Player availability | `data/player-availability/latest.json` |
| Product/source readiness | source audit and season readiness smoke |

## High-Signal Artifacts At Risk Of Being Missed

These files were created or updated after the original July 30 packet framing and should be explicitly considered before a paid/frontier synthesis run.

| Artifact | Current risk | Recommended inference status |
|---|---|---|
| `docs/projected-starters/projected-starters-latest.md` | Not named in the July 30 packet resume section after it was added later in the sprint | Include as estimated starters context; label manual depth-chart rows as missing when absent. |
| `docs/player-availability/starter-impact-digest-latest.md` | More synthesis-ready than raw availability but not in the July 30 packet table | Include alongside raw availability as compact starter-impact context. |
| `docs/training-camp/training-camp-coverage-fill-latest.md` | All-32 local context exists, but true source-stamped camp/manual confirmation remains incomplete | Include as coverage map; do not treat non-source-stamped filler as strong evidence. |
| `docs/prediction-markets/prediction-market-context-latest.md` | Prediction markets were added after the original packet; July 30 packet mostly describes sportsbook prices | Include for mapped Kalshi/Polymarket context, with mapping/liquidity caveats. |
| `docs/prediction-markets/cross-market-coherence-latest.md` | Useful for sportsbook-vs-prediction-market mismatch triage | Include as watch/validation context, not standalone pick authority. |
| `data/prediction-markets/team-market-map-latest.json` | Many unmapped contracts remain | Include mapped rows only; surface unmapped count as gap. |
| `data/generated/team-profiles/team-power-ratings-2025.json` | New generated baseline may not be in older dossier prompt | Include as 2026 projection baseline context if the fresh dossier loader has not already embedded it. |
| `data/generated/team-profiles/team-regression-snapshots-2025-w18.json` | New generated baseline may not be in older dossier prompt | Include as regression baseline context; avoid treating null fields as negative signals. |
| `docs/antigravity/podcast-youtube-freshness-latest.md` | July 24-30 freshness reconciliation caught discovery gaps | Include as source-freshness/gap context; do not use candidates as accepted intel until reviewed. |
| `docs/antigravity/recovery/youtube-qoCm4G2Jmng-local-recovery.html` and `.md` | Rich analyst tendency nuggets exist but extraction failed | Use only through expert dossiers or manual review; not accepted picks or clean transcript evidence. |
| `data/shadow-harness/recovery/*.json` | Recovery artifacts are easy to over-weight | Keep as `local_recovery_context_only`; do not feed directly as betting evidence. |

## Existing Context Lanes

| Lane | Artifact | Notes |
|---|---|---|
| Host citation index | `data/generated/host-citations-latest.json` | Generated index; do not append hand-curated signals directly because rebuilds overwrite it. |
| Podcast host summaries | `podcast_host_summaries` / Obsidian `NFL/Podcasts/<show>/<host>/...` | Per-episode host notes, not cross-episode expert dossiers. Requires Supabase/vault state for fresh runs. |
| Local YouTube review | `data/shadow-harness/review/youtube-futures-intel-review-status.json` | Human review gate for local YouTube intel. Reprocess-required observations are excluded. |
| Expert dossiers | `data/expert-dossiers/` | New durable local context lane for analyst priors/bias signals. |

## Recommended Frontier Input Checklist

Before any paid/frontier model call:

1. Rebuild expert dossiers:
   - `npm.cmd run expert-dossiers:build`
2. Refresh local review summaries if YouTube/recovery artifacts changed:
   - `npm.cmd run youtube:review-futures`
3. Confirm source audit remains PASSABLE:
   - `npm.cmd run intel:source-audit`
4. Ensure the synthesis packet or resume prompt names the latest projected-starters, starter-impact digest, prediction-market context, cross-market coherence, training-camp coverage fill, and expert dossiers.
5. Do not include reprocess-required YouTube observations as accepted intel. Route them only through `local_recovery_context_only` expert-dossier signals after human review.

## Open Gaps

- Expert dossiers are local files, not Supabase records.
- The portfolio dossier builder (`agents/portfolio-dossier.js`) does not yet embed `expert_dossiers` in its JSON output; the synthesis runner loads them as a sidecar prompt block.
- Rich Hribar currently has local-recovery context but no generated host-citation history.
- The July 29 normalized primary-book exports must be refreshed or explicitly waived before a final paid/frontier run.
- The July 30 frontier packet should be superseded by a dated July 31 packet before a final paid/frontier run.
