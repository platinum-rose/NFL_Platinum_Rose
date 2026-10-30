# Claude handoff — Week 8 Master Intel + SuperContest Intel built (Friday build), October 30, 2026 ~3:55 PM PT

## Resume
1. Read `HANDOFF.md`, reconcile live Git. Branch `claude/w5-prop-cards-2026-10-11`; this session's commit sits on `402f68b`. **Not pushed** (Andy pushes). Use `git -c core.fsmonitor=false`.
2. The VM cannot delete files: stale git locks renamed to `.git/stale-*-lock-claude-*` (Andy can delete them).
3. Dirty tree = scheduled-job outputs plus Codex's uncommitted atomic-write repairs. Preserve.
4. **Python:** `build.py` needs Python 3.12+ (f-string backslashes). The VM's system python is 3.10; this session made `$HOME/pyenv312` with uv (bs4, python-docx). Run builds with `export PATH=$HOME/pyenv312/bin:$PATH NODE_USE_ENV_PROXY=1` (Node 22 ignores the proxy without that flag, so `pull.mjs` fails with "fetch failed").
5. **Action Network is blocked** from the VM and the cloud container (proxy 403). Openers and splits were read through the Claude built-in browser on actionnetwork.com (same endpoints/logic as `actionnetwork_openers.py` / `betting-splits-ingest.js`) and saved to `reports/engineering/week8-an-browser-pull-2026-10-30/raw.json`; splits were written into the local `w08-pull.json`. Claude in Chrome was not connected.

## Built
- Output: `dist/nfl_week8_master_packet/` (gitignored): Master md/html/docx/json/pdf + `site/` (29 pages, 14 game pages) + `Platinum_Rose_NFL_Week8_Intel.html` single-file; SuperContest md/html/docx/json/pdf. PDFs made in the cloud container (export_pdf.py).
- Lines: Bookmaker Thu 10/29 4 PM PT capture (`--date 2026-10-29`); props for only 7 of 13 Sunday/Monday games. Splits/current consensus: Action Network Fri ~3:40 PM PT. Openers: AN Sun 10/25 5 PM PT cutoff.
- Inputs written this session: `scratch/w08-synthesis-digest-sat.md` (Friday digest, saved under the Sat name so build reads it), `reports/bets/2026-w08-card.md` (weekend card; Thursday TNF draft archived at `scratch/2026-w08-card.tnf-draft-1028.bak.md`), `reports/intel/master-intel-narratives-2026-w08.md` (13 games + TICKETS + SUPERCONTEST), `reports/intel/master-pitches-2026-w08.json`, `reports/intel/supercontest-pitches-2026-w08.json` (generator `scratch/w08_write_pitches.py`), `data/survivor/pick-intel-2026-w08.json`, `reports/intel/w08-model/` (fair-line blend + simulator outputs), `data/odds/actionnetwork-openers-2026-w08.json`, expert verification (160 verified / 23 rejected).
- **Model caveat:** no per-game deep syntheses this week. Fair line = AN consensus moved 35% toward an SRS + 1.5 HFA baseline; total = consensus moved 35% toward PF/PA baseline; simulator for cover %. The baseline ignores injuries.
- Roster gate: PASS (strict, ESPN 2026-10-30 20:44Z).

## Card (proposals; nothing placed)
- **Platinum Rose recommendation (1):** MIN +3.5 (fair DET -0.4, sim 58.1%, Sharp or Square on MIN). Single $20 proposed. Note BKR parlay 740984963 carries DET ML.
- Leans (9): CIN -12.5, LAR -6.5, PHI +6, CHI +3, BAL +3, KC/DEN Under 40.5, ATL/TB Under 43.5, CLE +3.5, MIA +7.
- Big-money flags: BAL +3, BAL/BUF Over, ARI ML, ATL/TB Under, ATL ML, PHI ML, CHI ML.
- Both live BKR weekend parlays (740983886, 740984963) are on the card with the WSH SNF-cap hedge tables.
- SuperContest AI five: CIN -10.5, JAX -9.5, MIN +3.5, DAL -6.5, BAL +3.5; alternates CHI +3, PHI +5.5, LAR -6.5.

## SuperContest gate: FAIL (5) — all need Andy inputs, not pitch text
- Standings after Week 7 are missing → add `data/supercontest/standings-week-08-<YYYY-MM-DD>.md` (same format as `standings-week-07-2026-10-24.md`; Andy supplies them). Fixes overall/quarterly standings, 5th-place gap and Amanda rows.
- Week 8 post-mortem block appears once `data/supercontest/locked-card-week-8.json` exists (Andy & Amanda's official five).
- Pitch/Pushback, spread-only and layout checks otherwise pass.

## Not done / open for Andy
1. Saturday: BKR prop capture (needs Claude in Chrome connected), rewrite narratives for line/injury changes, prop stacks, then rebuild (`--date` = capture file date).
2. Publish/share: nothing published, no Drive archive, no artifact (needs Andy's OK). Hosted client link per format doc: https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6.
3. Expert narratives file and cleaned YouTube digest are known gaps.
4. Builder quirk (pre-existing, also in Week 7): `#experts-<game>` links have no target in the single-page html.
5. Carry-over from 15:30 handoff: log the 5 FDP tickets; OCR team-tag fix in Supabase; DK defensive rerun Saturday; Sunday pool entries.

## Guardrails
- No wager, account, Supabase write, paid call or publication without Andy's per-action OK.
- No player-named output without a current strict roster gate.
- Stage narrowly; never `git add -A`.

Resume prompt:
```
Resume Platinum Rose NFL. Branch claude/w5-prop-cards-2026-10-11 (Week 8 Master + SC Friday build committed locally, not pushed). Next: Saturday BKR prop capture, narrative refresh and rebuild; SC needs Andy's post-Week-7 standings and the locked five. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-30-1555-claude-week8-master-intel-sc-built.md.
```
