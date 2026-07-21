# NFL Dashboard (Platinum Rose) — Project Overview & Recommendations Summary

*Companion to the full [NFL Dashboard Audit Report](./NFL_Dashboard_Audit_Report.md) — read this first.*

## What this project is

Platinum Rose is your NFL betting analytics hub — a web dashboard that pulls live odds from eight sportsbooks, tracks expert picks and how they actually perform, grades bets automatically after games, runs Monte Carlo simulations in a "Dev Lab," manages bankroll, and produces intel reports from podcasts, sharp Twitter accounts, and research notes. A crew of automated agents on GitHub's servers keeps the data fresh around the clock, especially on game days.

## What it's trying to achieve

An edge: one place where line movements, expert consensus, injuries, and your own betting record come together so decisions are made on evidence instead of vibes — shared with betting partners via a public dashboard. "Working well" means odds are current within the hour on game days, picks get graded automatically and correctly, the intel reports actually surface signal, and your season-long record is trustworthy and never lost.

## How well it's currently achieving that

The machinery genuinely works — 19 automated workflows keep odds, injuries, splits, transcripts, and grading flowing, and the engineering hygiene is real (this project already found and properly fixed the classic "secret keys visible in a public website" problem with a server-side proxy). Three things keep it short of its own standard. First, the vault-to-cloud copier doesn't check privacy labels before sharing notes with betting partners — probably harmless today, but it's the one guardrail this family of projects treats as sacred. Second, your hand-entered picks — data the code itself labels "must never be lost" — live in the browser's local storage, one "clear browsing data" click from oblivion. Third, everything automated depends on GitHub's building: hosting, scheduling, and secrets in one rented basket. Functionality: strong. Custody: needs work.

## Recommendations summary

1. **Teach the vault-to-cloud copier to read privacy labels** — and treat unlabeled notes as private, per the house rule. *(See Audit Report → Finding 1)*
2. **Move your hand-entered picks into the database** (already running) instead of browser storage. *(Finding 4)*
3. **Fix the instruction manual** that still documents the old, insecure way to store API keys. *(Finding 3)*
4. **Give the automation a home option** — systemd timers on M6 so the robots aren't GitHub-only. *(Finding 2, `[Local-First]`)*
5. **Start nightly database backups** — one habit, shared with Rosie's identical need. *(Roadmap item 5, `[Data-Ownership]`)*
6. **Local podcast transcription** is the one AI job current hardware can already take over — do it when convenient. *(Roadmap item 6, `[Local-First]`)*
7. **Sweep the dead files** (superseded v1 report agent, one-off test script) and add the auth-bypass tripwire. *(Findings 5–6)*

No code was changed during this audit; the reasoning is in the Audit Report's Change list.
