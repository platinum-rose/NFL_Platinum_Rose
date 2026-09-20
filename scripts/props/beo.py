#!/usr/bin/env python3
"""Parse BetOnline (BEO) Week-N prop board dumps into JSON.
Usage: python3 beo.py <board_dir> <out.json>
Board files named BEO_Week<N>_<AWAY>_<HOME> (or any BEO_* prefix).
"""
import sys, os, re, json

# EVERY player-market header BEO emits. An unlisted header used to be invisible
# to the parser, so its rows silently continued the PREVIOUS market -- that is
# how "Pass Attempts 32+" surfaced as a passing-TD line and "Carries" bled into
# rushing yards. Keep this list exhaustive; unknown headers are hard-stopped
# below rather than absorbed.
LADDER_MARKETS = {
    "Passing Yards": "pass_yds",
    "Passing TDs": "pass_td",
    "Pass Attempts": "pass_att",
    "Pass Completions": "pass_cmp",
    "Pass Interceptions": "pass_int",
    "Rushing Yards": "rush_yds",
    "Carries": "carries",
    "Receiving Yards": "rec_yds",
    "Receptions": "rec",
    "Tackles + Assists": "tackles_assists",
    "Sacks": "sacks",
    "Interceptions": "def_int",
    "Touchdowns": "atd",
}
SCORER_MARKETS = {
    "First Touchdown Scorer": "first_td",
    "Anytime Touchdown Scorer": "atd",
    "Anytime Touchdown": "atd",
}
# BEO also publishes "<market> (Bands)" and "<market> (Exact)" sections whose
# rungs are bare counts (0, 1, 2 ... "≤ 1") rather than cumulative "N+" lines.
# Those are a different bet than the ladders we build from, and left unhandled
# they bleed into the preceding market as bogus rows. Recognise and skip them,
# and treat ANY unrecognised section header as a hard stop rather than letting
# the previous market absorb whatever follows.
SKIP_SECTION_RE = re.compile(r'^[a-z][a-z /+]*\((?:bands|exact)\)$', re.I)
SECTION_HINT_RE = re.compile(r'^[A-Za-z][A-Za-z /+.\'-]*(?:\(.*\))?$')
ODDS_RE = re.compile(r'^[+-]\d{3,5}$')
LINE_RE = re.compile(r'^(\d+(?:\.\d+)?)\+$')

def parse_file(path):
    game = os.path.basename(path).split("Week")[-1]
    game = re.sub(r'^\d+_', '', game)
    game = re.sub(r'_v\d+$', '', game, flags=re.I)
    raw = [l.strip() for l in open(path, encoding="utf-8", errors="replace")]
    lines = [l for l in raw if l]
    out = []
    i = 0
    market = None
    mode = None
    while i < len(lines):
        l = lines[i]
        if l in LADDER_MARKETS:
            market, mode = LADDER_MARKETS[l], "ladder"; i += 1; continue
        if l in SCORER_MARKETS:
            market, mode = SCORER_MARKETS[l], "scorer"; i += 1; continue
        if SKIP_SECTION_RE.match(l):
            market, mode = None, None; i += 1; continue
        if mode == "scorer":
            # Name then odds
            if i + 1 < len(lines) and ODDS_RE.match(lines[i+1]) and not ODDS_RE.match(l):
                out.append({"game": game, "market": market, "player": l,
                            "team": None, "line": None, "odds": int(lines[i+1])})
                i += 2; continue
            if l in LADDER_MARKETS or l in SCORER_MARKETS:
                continue
            mode = None; i += 1; continue
        if mode == "ladder":
            # player, team, then (line, odds)*
            if ODDS_RE.match(l) or LINE_RE.match(l):
                i += 1; continue
            if i + 1 < len(lines):
                player, team = l, lines[i+1]
                j = i + 2
                rungs = []
                while j + 1 < len(lines) and LINE_RE.match(lines[j]) and ODDS_RE.match(lines[j+1]):
                    rungs.append((float(LINE_RE.match(lines[j]).group(1)), int(lines[j+1])))
                    j += 2
                if rungs:
                    for ln, od in rungs:
                        out.append({"game": game, "market": market, "player": player,
                                    "team": team, "line": ln, "odds": od})
                    i = j; continue
            i += 1; continue
        i += 1
    return out

def main():
    d, outp = sys.argv[1], sys.argv[2]
    all_rows = []
    # A board re-pulled during the day lands as <name>_v2, _v3 ... alongside the
    # original. Keep only the highest revision per game so a refresh replaces the
    # stale board instead of doubling it.
    newest = {}
    for fn in sorted(os.listdir(d)):
        if not fn.startswith("BEO_"): continue
        m = re.search(r'_v(\d+)$', fn, flags=re.I)
        base = fn[:m.start()] if m else fn
        ver = int(m.group(1)) if m else 1
        if base not in newest or ver > newest[base][0]:
            newest[base] = (ver, fn)
    for base in sorted(newest):
        ver, fn = newest[base]
        rows = parse_file(os.path.join(d, fn))
        all_rows += rows
        print(f"{fn}: {len(rows)} rows", file=sys.stderr)
    json.dump(all_rows, open(outp, "w"), indent=0)
    print(f"TOTAL {len(all_rows)} -> {outp}", file=sys.stderr)

if __name__ == "__main__":
    main()
