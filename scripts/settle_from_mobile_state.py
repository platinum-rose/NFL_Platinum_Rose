#!/usr/bin/env python3
"""Settle real tickets that the mobile tracker graded as burnt or cashed.

Reads public/live-tracker-mobile-state.json, written by
scripts/generate-live-tracker-mobile.mjs. For each PENDING ticket whose
outcome is decided, it records the locked leg grades and the ticket result
in data/official-picks/user-placed-wagers-2026.json.

Dry run by default. Pass --apply to write. Pass --only T1,T2 to limit the
run to specific ticket numbers.

Not auto-settled, but reported:
  * cashed parlays with a pushed or void leg (the payout needs per-leg prices)
  * any ticket with a CHECK leg
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
WAGERS = ROOT / "data/official-picks/user-placed-wagers-2026.json"
STATE = ROOT / "public/live-tracker-mobile-state.json"

ap = argparse.ArgumentParser()
ap.add_argument("--apply", action="store_true")
ap.add_argument("--only", default="")
a = ap.parse_args()
only = {s.strip() for s in a.only.split(",") if s.strip()}

raw = WAGERS.read_text(encoding="utf-8")
wagers = json.loads(raw)
state = json.loads(STATE.read_text(encoding="utf-8"))
built = datetime.fromisoformat(state["built_at"].replace("Z", "+00:00"))
built_pt = built.astimezone(ZoneInfo("America/Los_Angeles")).strftime("%Y-%m-%d %H:%M PT")
by_no = {str(w.get("ticket_number")): w for w in wagers}
changed = []

for t in state["tickets"]:
    no = str(t["ticket_number"])
    if only and no not in only:
        continue
    if t["state"] not in ("burnt", "cashed"):
        continue
    w = by_no.get(no)
    if not w or str(w.get("status")).upper() != "PENDING":
        continue
    legs = t["legs"]
    if any(l["status"] == "CHECK" for l in legs):
        print(f"SKIP {no}: has CHECK legs; grade by hand")
        continue
    summ = t["summary"]
    if summ["kind"] == "parlay" and t["state"] == "cashed" and any(l["status"] in ("PUSH", "VOID") for l in legs):
        print(f"SKIP {no}: cashed with a push/void leg; payout needs the reduced price. Settle by hand")
        continue
    if summ["kind"] == "rr" and any(l["status"] in ("LIVE", "PENDING") for l in legs):
        print(f"SKIP {no}: round robin still has combos in play")
        continue

    stake = float(w.get("stake_usd") or 0)
    if summ["kind"] == "rr":
        returned = float(summ.get("returnedUsd") or 0)
        profit = round(returned - stake, 2)
        result = "win" if profit > 0 else "push" if profit == 0 else "loss"
        payout = round(returned, 2)
    elif t["state"] == "burnt":
        profit, result, payout = -stake, "loss", 0
    else:
        profit = float(w.get("potential_profit_usd") or 0)
        result, payout = "win", round(stake + profit, 2)

    # Record locked leg grades (only those decided; live/pending legs of a dead parlay stay PENDING).
    for wl, sl in zip(w.get("legs") or [], legs):
        if sl["status"] in ("WON", "LOST", "PUSH", "VOID") and str(wl.get("status")).upper() == "PENDING":
            wl["status"] = sl["status"]
            if sl.get("value") is not None:
                wl["actual_stat"] = sl["value"]
            elif sl.get("now"):
                wl.setdefault("actual_stat", sl["now"])
            ev = sl.get("eventId")
            wl["grading_note"] = f"{sl.get('now', '')}. ESPN {ev}, mobile-tracker grading {built_pt}".strip()
    lost = [sl["selection"] for sl in legs if sl["status"] == "LOST"]
    note = f"SETTLED {result.upper()} {built_pt} (mobile tracker ESPN grading)"
    if lost:
        note += ": lost leg(s) " + "; ".join(lost)
    w["status"] = "SETTLED"
    w["result"] = result
    w["profit_usd"] = profit
    w["settled_payout_usd"] = payout
    w["graded_at"] = built.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    w["progress_notes"] = (str(w.get("progress_notes") or "") + " " + note).strip()
    changed.append((no, result, profit))
    print(f"{'APPLY' if a.apply else 'DRY  '} {no} {result} {profit:+.2f}  {note}")

if a.apply and changed:
    WAGERS.write_text(json.dumps(wagers, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(changed)} settlement(s) to {WAGERS.relative_to(ROOT)}")
elif not changed:
    print("nothing to settle")
