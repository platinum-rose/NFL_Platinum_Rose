# NFL Dashboard User Guide

## Local App

Use `npm.cmd` in PowerShell.

```powershell
npm.cmd run dev
npm.cmd run build:test
```

The recovered local dashboard session has used:

```text
http://localhost:5174/platinum-rose-app/
```

If the dev server is restarted on a different port, use the URL printed by Vite.

## Readiness Checks

```powershell
npm.cmd run smoke:season -- --require-services --dev-base http://localhost:5174/platinum-rose-app
npm.cmd run intel:source-audit
```

Readiness and source-audit output are local QA artifacts. They do not approve bets,
persist recommendations, or authorize Supabase writes.

## Fantasy Value Board

```powershell
npm.cmd run seed:adp -- --csv data/fantasy/adp-YYYY-MM-DD.csv --source manual --scoring ppr --as-of YYYY-MM-DD --dry-run
npm.cmd run report:fantasy
```

The value board is Phase A decision support only. It scores QB/RB/WR/TE from
prior-season production against ADP, then writes:

- `docs/fantasy/value-board-YYYY-MM-DD.json`
- `docs/fantasy/value-board-YYYY-MM-DD.md`
- `docs/fantasy/value-board-YYYY-MM-DD.html`
- `public/fantasy-value-board.json`

Kickers, IDP, and team defense are not modeled yet.

## Training Camp Intel

```powershell
npm.cmd run training-camp:build
npm.cmd run training-camp:scout
npm.cmd run training-camp:scout:live -- --dry-run
```

`training-camp:scout` does not fetch the network by default. Live RSS scouting
requires the `--live` path and should be treated as review/highlight context, not
as official-pick or recommendation authority.

## Overnight Pipeline

```powershell
npm.cmd run overnight -- --dry-run
```

The overnight runner keeps live additions opt-in:

- `--live-research-intel` lets the research-intel step run live instead of dry-run mode.
- `--live-camp-scout` lets the training-camp scout fetch RSS feeds.
- `--send-daily-brief` sends the daily brief email.

Example with explicit opt-ins:

```powershell
npm.cmd run overnight -- --live-research-intel --live-camp-scout --send-daily-brief
```

Do not add paid/frontier model calls, Supabase writes, official-pick approvals,
production recommendation persistence, or open-parlay changes to automation
without explicit approval.

## Official Picks

```powershell
npm.cmd run official:picks:inbox
npm.cmd run official:picks:validate
npm.cmd run official:picks:summary
```

Approving, rejecting, promoting, or creating official-pick proposals is a human
approval workflow. Do not automate those actions without explicit approval.
