#!/usr/bin/env python3
"""Parse Bookmaker.eu (BKR) Week-N prop board dumps into JSON.
Usage: python3 parse.py <board_dir> <out.json>
Header form: "<Away> vs <Home>: <Player> <Market>" then SGP then "<Player> <N>+" / odds.
"""
import sys, os, re, json

MARKETS = ["Passing Yards","Passing TDs","Passing Touchdowns","Rushing Yards",
           "Receiving Yards","Receptions","Rushing + Receiving Yards",
           "Tackles + Assists","Sacks","Anytime Touchdown","Total Receptions"]
SLUG = {"Passing Yards":"pass_yds","Passing TDs":"pass_td","Passing Touchdowns":"pass_td",
        "Rushing Yards":"rush_yds","Receiving Yards":"rec_yds","Receptions":"rec",
        "Rushing + Receiving Yards":"rush_rec_yds","Tackles + Assists":"tackles_assists",
        "Sacks":"sacks","Anytime Touchdown":"atd","Total Receptions":"rec"}
ODDS_RE = re.compile(r'^[+-]\d{3,5}$')
HDR_RE  = re.compile(r'^(.+?):\s*(.+)$')
SEL_RE  = re.compile(r'^(.*?)\s+(\d+(?:\.\d+)?)\+$')

def parse_file(path):
    game = os.path.basename(path).split("Week")[-1]
    game = re.sub(r'^\d+_', '', game)
    lines = [l.strip() for l in open(path, encoding="utf-8", errors="replace")]
    lines = [l for l in lines if l and l != "SGP"]
    out, cur = [], None
    for i, l in enumerate(lines):
        m = HDR_RE.match(l)
        if m:
            tail = m.group(2)
            hit = next((mk for mk in sorted(MARKETS, key=len, reverse=True) if tail.endswith(mk)), None)
            if hit:
                cur = (tail[:-len(hit)].strip() or None, SLUG[hit])
                continue
            cur = None
            continue
        if cur and ODDS_RE.match(l) and i > 0:
            sm = SEL_RE.match(lines[i-1])
            if sm:
                player = sm.group(1).strip() or cur[0]
                out.append({"game": game, "market": cur[1], "player": player,
                            "team": None, "line": float(sm.group(2)), "odds": int(l)})
            elif cur[1] == "atd":
                out.append({"game": game, "market": "atd", "player": lines[i-1].strip(),
                            "team": None, "line": None, "odds": int(l)})
    return out

def main():
    d, outp = sys.argv[1], sys.argv[2]
    rows = []
    for fn in sorted(os.listdir(d)):
        if not fn.startswith("BKR_"): continue
        r = parse_file(os.path.join(d, fn)); rows += r
        print(f"{fn}: {len(r)} rows", file=sys.stderr)
    json.dump(rows, open(outp, "w"), indent=0)
    print(f"TOTAL {len(rows)} -> {outp}", file=sys.stderr)

if __name__ == "__main__":
    main()
