# File manifest

| Original path | Git state | Bytes | sha256 (12) | Purpose | Copy status |
|---|---|---:|---|---|---|
| `data/generated/master-intel/big-money-flags-2026-w08.json` | gitignored | 2522 | 1d993d19bee0 | first-seen lines for big-money signals (line-drift baseline; do not delete mid-week) | copied 2026-10-30 ~6:10 PM PT |
| `data/generated/master-intel/w08-expert-verified.json` | gitignored | 131008 | a47232733f86 | expert pick verification (160 verified / 23 rejected) | copied 2026-10-30 ~6:10 PM PT |
| `data/generated/master-intel/w08-pull.json` | gitignored | 506086 | bd6bee95ad15 | Supabase SELECT pull (signals, notes, expert picks, feeds, podcasts) + AN splits Fri 3:40 PM PT; build.py input | copied 2026-10-30 ~6:10 PM PT |
| `data/generated/master-intel/w08-roster-vet.json` | gitignored | 1355 | ffc9c00346ad | strict roster gate result (PASS) | copied 2026-10-30 ~6:10 PM PT |
| `dist/nfl_week8_master_packet/nfl_week8_master_betting_intelligence_summary.json` | gitignored | 93345 | fdc2dc2b3c9b | Master report structured output (Friday build) | copied 2026-10-30 ~6:10 PM PT (force-added past the dist/logs ignore) |
| `dist/nfl_week8_master_packet/nfl_week8_master_betting_intelligence_summary.pdf` | gitignored | 4138860 | 00b8b1cfd05d | Master report PDF (Friday build, all boxes expanded) | copied locally only (gitignored `dist` pattern; not committed — on Andy's disk) |
| `dist/nfl_week8_master_packet/nfl_week8_supercontest_intelligence_summary.json` | gitignored | 25125 | 851b4bfe8d20 | SC report structured output (gate FAIL: Week 8 post-mortem pending locked five) | copied 2026-10-30 ~6:10 PM PT (force-added past the dist/logs ignore) |
| `dist/nfl_week8_master_packet/nfl_week8_supercontest_intelligence_summary.pdf` | gitignored | 644669 | fb51f142332c | SC report PDF (Friday build) | copied locally only (gitignored `dist` pattern; not committed — on Andy's disk) |
| `logs/cadence-reports/2026-w08-friday.md` | gitignored | 4559 | b5e6ee85b282 | Friday 3 PM Toolbox cadence report (see briefing §4 corrections) | copied 2026-10-30 ~6:10 PM PT (force-added past the dist/logs ignore) |

Not copied (rebuildable, large): `dist/nfl_week8_master_packet/` html/docx/md/`site/` (15 MB) — rebuild with build.py.
