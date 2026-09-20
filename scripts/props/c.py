#!/usr/bin/env python3
"""Query parsed prop boards.

With --avail, each row is tagged against data/generated/prop-availability.json:
  FREE  nothing live holds this player
  SOFT  player is live on a ticket, but in a different market/line
  HARD  exact same market+line already live -> true duplicate
Regenerate that file with:  node scripts/props/availability.mjs --week <N>

Usage: python3 c.py [--book beo|bkr|both] [--game SUB] [--player SUB] [--market SLUG]
                    [--max-juice -150] [--min-odds N] [--max-odds N] [--limit N] [--w1]
"""
import json, sys, os, re, argparse
PP   = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(PP, "..", ".."))
# Parsed boards and w1 stats live in the repo, not beside the script, so they
# survive the device VM recycling its scratch space between sessions.
DATA = os.environ.get("PROPS_DATA", os.path.join(ROOT, "data", "generated", "props"))

def load(book):
    rows = []
    if book in ("beo","both"):
        for r in json.load(open(f"{DATA}/beo.json")): r["book"]="BEO"; rows.append(r)
    if book in ("bkr","both"):
        for r in json.load(open(f"{DATA}/props.json")): r["book"]="BKR"; rows.append(r)
    return rows

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--book", default="both")
    p.add_argument("--game", default=""); p.add_argument("--player", default="")
    p.add_argument("--market", default=""); p.add_argument("--max-juice", type=int, default=None)
    p.add_argument("--min-odds", type=int, default=None); p.add_argument("--max-odds", type=int, default=None)
    p.add_argument("--limit", type=int, default=60); p.add_argument("--w1", action="store_true")
    p.add_argument("--avail", nargs="?", const="auto", default=None,
                   help="tag rows FREE/SOFT/HARD from prop-availability.json")
    p.add_argument("--free", action="store_true", help="show only FREE rows (implies --avail)")
    a = p.parse_args()
    if a.free and not a.avail: a.avail = "auto"
    rows = load(a.book)
    f = lambda r: (a.game.upper() in r["game"].upper()
        and a.player.lower() in (r["player"] or "").lower()
        and (not a.market or a.market == r["market"])
        and (a.max_juice is None or r["odds"] >= a.max_juice)
        and (a.min_odds is None or r["odds"] >= a.min_odds)
        and (a.max_odds is None or r["odds"] <= a.max_odds))
    rows = [r for r in rows if f(r)]
    rows.sort(key=lambda r: (r["game"], r["player"] or "", r["market"], r["line"] or 0))
    w1 = json.load(open(f"{DATA}/w1.json")) if a.w1 and os.path.exists(f"{DATA}/w1.json") else {}
    def norm(n):
        n = (n or "").lower().strip()
        n = re.sub(r"[.'`]", "", n)
        n = re.sub(r"\s+(jr|sr|ii|iii|iv|v)$", "", n)
        return re.sub(r"\s+", " ", n)
    w1n = {norm(k): v for k, v in w1.items()}
    # --- availability tagging -------------------------------------------------
    # Board markets are slugs; the wagers file uses long names. Board lines are the
    # "N+" rung, wagers store the over line, so they differ by exactly 0.5.
    MKT = {"rec_yds":"receiving_yards","rec":"receptions","rush_yds":"rushing_yards",
           "tackles_assists":"tackles_assists","sacks":"sacks","atd":"anytime_touchdown",
           "pass_td":"passing_tds","pass_int":"pass_interceptions","pass_yds":"passing_yards",
           "carries":"carries","first_td":"anytime_touchdown"}
    avail = None
    if a.avail:
        ap = (os.path.join(ROOT, "data", "generated", "prop-availability.json")
              if a.avail == "auto" else a.avail)
        try:
            avail = json.load(open(os.path.abspath(ap)))
        except FileNotFoundError:
            print(f"!! {os.path.abspath(ap)} not found -- run: node scripts/props/availability.mjs --week <N>",
                  file=sys.stderr)
            avail = None
    availn = {}
    if avail:
        for k, holds in (avail.get("players") or {}).items():
            availn.setdefault(norm(k), []).extend(holds)

    def tier_of(r):
        if not avail: return ("", "")
        holds = availn.get(norm(r["player"]))
        if not holds:
            cand = [v for kk, v in availn.items()
                    if kk.split()[-1:] == norm(r["player"]).split()[-1:]
                    and kk.split()[0][:1] == norm(r["player"]).split()[0][:1]]
            holds = cand[0] if len(cand) == 1 else None
        if not holds: return ("FREE", "")
        want = MKT.get(r["market"], r["market"])
        wline = None if r["line"] is None else round(r["line"] - 0.5, 1)
        for h in holds:
            if h.get("market") == want and (
                (h.get("line") is None and wline is None) or
                (h.get("line") is not None and wline is not None and abs(h["line"] - wline) < 1e-6)):
                return ("HARD", h.get("ticket", "")[-20:])
        return ("SOFT", ", ".join(sorted({h.get("market", "") for h in holds})))

    if avail:
        tagged = [(r, tier_of(r)) for r in rows]
        if a.free: tagged = [(r, t) for r, t in tagged if t[0] == "FREE"]
        rows = [r for r, _ in tagged]
        tiers = {id(r): t for r, t in tagged}

    for r in rows[:a.limit]:
        ln = f"{r['line']:g}+" if r["line"] is not None else "-"
        extra = ""
        if w1:
            k = norm(r["player"])
            hit = w1n.get(k)
            if hit is None:
                cand = [v for kk, v in w1n.items() if kk.split()[-1:] == k.split()[-1:] and kk.split()[0][:1] == k.split()[0][:1]]
                hit = cand[0] if len(cand) == 1 else None
            if hit: extra = "  W1:" + " ".join(f"{m}={v:g}" for m,v in hit.items() if m!="team" and v)
        tg = ""
        if avail:
            t, why = tiers.get(id(r), ("", ""))
            mark = {"FREE": "  ", "SOFT": " ~", "HARD": " !"}.get(t, "  ")
            tg = f"{mark}{t:4}" + (f" ({why})" if why and t != "FREE" else "")
        print(f"{r['book']:3} {r['game']:9} {(r['player'] or '')[:22]:22} {r['market']:16} {ln:7} {r['odds']:+6d}{tg}{extra}")
    print(f"-- {len(rows)} rows ({min(len(rows),a.limit)} shown)", file=sys.stderr)

if __name__ == "__main__":
    main()
