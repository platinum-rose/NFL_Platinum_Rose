#!/usr/bin/env python3
"""Playoff hedge planner for Andy's Super Bowl futures portfolio.

Local and read-only: reads the futures ledger (and optionally local price files),
prints a markdown plan. No Supabase, no sportsbook/account access, no ledger writes.

Modes
  sb        Super Bowl set: net result each way, and the 0/50/100% hedge.
  conf      Both conference championship games set: maximin hedge across the four
            possible Super Bowls, with an optional cash budget.
  reserve   Reserve sizing: for every possible Super Bowl pairing, the stake needed
            to equalize it, weighted by current no-vig conference probabilities.
            Includes a seeding-aware price column (--favored / --underdog teams).
  middle    One playoff game: moneyline vs spread hedge (and a mix), with the
            "middle" where the protected favorite advances and the dog covers.
            Branch values can be given in dollars or as auto:TEAM (expected
            portfolio value if TEAM reaches the Super Bowl). Optional --parlay
            equity shows an open-spot alternative that needs no cash.
  selftest  Checks portfolio math against the Week 8 futures review table.

Conventions
  * Matchup ("exacta") tickets pay when the two named teams are the finalists,
    regardless of the Super Bowl winner (confirmed by Andy, 2026-10-28).
  * Promo-funded stakes are assumed returned with winnings (UNVERIFIED);
    --promo-stake-not-returned flips it.
  * Regular-season bets (win totals, make playoffs) and unverified open parlays are
    excluded; they are not hedge funding.
  * Net values are relative to all open Super Bowl stakes (sunk).
"""
import argparse, json, re, sys
from math import erf, sqrt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "data/futures-imports/andy-portfolio-ledger-2026.json"
CIRCA = ROOT / "data/futures-imports/circa-2026-10-28.json"
BKR_MD = ROOT / "reports/bets/2026-w08-missing-exacta-composite.md"

TEAMS = {
    "BUF": ("Buffalo Bills", "AFC"), "MIA": ("Miami Dolphins", "AFC"), "NE": ("New England Patriots", "AFC"),
    "NYJ": ("New York Jets", "AFC"), "BAL": ("Baltimore Ravens", "AFC"), "CIN": ("Cincinnati Bengals", "AFC"),
    "CLE": ("Cleveland Browns", "AFC"), "PIT": ("Pittsburgh Steelers", "AFC"), "HOU": ("Houston Texans", "AFC"),
    "IND": ("Indianapolis Colts", "AFC"), "JAX": ("Jacksonville Jaguars", "AFC"), "TEN": ("Tennessee Titans", "AFC"),
    "DEN": ("Denver Broncos", "AFC"), "KC": ("Kansas City Chiefs", "AFC"), "LV": ("Las Vegas Raiders", "AFC"),
    "LAC": ("Los Angeles Chargers", "AFC"),
    "DAL": ("Dallas Cowboys", "NFC"), "NYG": ("New York Giants", "NFC"), "PHI": ("Philadelphia Eagles", "NFC"),
    "WAS": ("Washington Commanders", "NFC"), "CHI": ("Chicago Bears", "NFC"), "DET": ("Detroit Lions", "NFC"),
    "GB": ("Green Bay Packers", "NFC"), "MIN": ("Minnesota Vikings", "NFC"), "ATL": ("Atlanta Falcons", "NFC"),
    "CAR": ("Carolina Panthers", "NFC"), "NO": ("New Orleans Saints", "NFC"), "TB": ("Tampa Bay Buccaneers", "NFC"),
    "ARI": ("Arizona Cardinals", "NFC"), "LAR": ("Los Angeles Rams", "NFC"), "SF": ("San Francisco 49ers", "NFC"),
    "SEA": ("Seattle Seahawks", "NFC"),
}
FULL = {v[0]: k for k, v in TEAMS.items()}
AFC = [k for k, v in TEAMS.items() if v[1] == "AFC"]
NFC = [k for k, v in TEAMS.items() if v[1] == "NFC"]


def team(x):
    x = x.strip()
    if x.upper() in TEAMS:
        return x.upper()
    if x in FULL:
        return FULL[x]
    raise SystemExit(f"Unknown team: {x!r} (use abbreviations like GB, BUF)")


def dec(american):
    a = float(american)
    if -100 < a < 100:
        raise SystemExit(f"Bad American odds: {american}")
    return 1 + a / 100 if a > 0 else 1 + 100 / abs(a)


def fmt(x):
    return f"-${abs(x):,.2f}" if x < 0 else f"${x:,.2f}"


def ml(a):
    a = float(a)
    return f"+{a:g}" if a > 0 else f"{a:g}"


def am(d):
    return f"+{round((d - 1) * 100)}" if d >= 2 else f"{round(-100 / (d - 1))}"


# ---------------------------------------------------------------- portfolio
class Portfolio:
    def __init__(self, ledger=LEDGER, promo_stake_returned=True, max_date=None):
        """max_date (YYYY-MM-DD): ignore tickets accepted after it (for reproducing dated reviews)."""
        d = json.load(open(ledger))
        self.as_of = d.get("as_of")
        self.sb, self.matchups, self.total_stake = [], [], 0.0
        for p in d["positions"]:
            if p.get("status") != "open":
                continue
            if p["market"] == "superbowl":
                t_ = team(p["selection"])
                for t in p.get("tickets", []):
                    if t.get("result_status", "pending") != "pending":
                        continue
                    if max_date and str(t.get("accepted_date", "")) > max_date:
                        continue
                    self._add(self.sb, t_, t, p["id"], promo_stake_returned)
            elif p["market"] == "superbowl_matchup":
                n, a = [team(x) for x in p["selection"].split(" vs ")]
                if TEAMS[n][1] == "AFC":
                    n, a = a, n
                assert TEAMS[n][1] == "NFC" and TEAMS[a][1] == "AFC", p["selection"]
                if p.get("result_status", "pending") != "pending":
                    continue
                if max_date and str(p.get("accepted_date", "")) > max_date:
                    continue
                self._add(self.matchups, (n, a), p, p["id"], promo_stake_returned)

    def _add(self, bucket, key, t, pid, promo_ret):
        stake, win = float(t["stake_usd"]), float(t["to_win_usd"])
        promo = any(s in str(t.get("funding", "")) for s in ("promo", "free_money"))
        ret = win + (stake if (promo_ret or not promo) else 0.0)
        bucket.append(dict(key=key, stake=stake, ret=ret, id=pid, ticket=t.get("ticket_number"), promo=promo))
        self.total_stake += stake

    def net(self, afc, nfc, winner):
        r = sum(t["ret"] for t in self.sb if t["key"] == winner)
        r += sum(t["ret"] for t in self.matchups if t["key"] == (nfc, afc))
        return r - self.total_stake


# ---------------------------------------------------------------- SB hedge
def sb_plan(pf, afc, nfc, afc_ml, nfc_ml, budget=None):
    wa, wn = pf.net(afc, nfc, afc), pf.net(afc, nfc, nfc)
    da, dn = dec(afc_ml), dec(nfc_ml)
    pa = (1 / da) / (1 / da + 1 / dn)
    side, d, p_side = (nfc, dn, 1 - pa) if wa >= wn else (afc, da, pa)
    full = abs(wa - wn) / d
    rows = []
    for label, h in (("No hedge", 0.0), ("50% hedge", full / 2), ("Full hedge (equalize)", full)):
        if budget is not None and h > budget:
            h, label = budget, label + f" (capped at budget {fmt(budget)})"
        out_a = wa + (h * (d - 1) if side == afc else -h)
        out_n = wn + (h * (d - 1) if side == nfc else -h)
        ev = pa * out_a + (1 - pa) * out_n
        rows.append(dict(label=label, stake=h, out_a=out_a, out_n=out_n, ev=ev, cost=h * (1 - p_side * d)))
    return dict(afc=afc, nfc=nfc, wa=wa, wn=wn, side=side, d=d, pa=pa, full=full, rows=rows)


def print_sb(r, afc_ml, nfc_ml):
    a, n = r["afc"], r["nfc"]
    print(f"## Super Bowl: {TEAMS[n][0]} vs {TEAMS[a][0]}\n")
    print(f"Lines used: {a} {ml(afc_ml)} / {n} {ml(nfc_ml)}; no-vig {a} {r['pa']*100:.1f}% / {n} {(1-r['pa'])*100:.1f}%.\n")
    print(f"Portfolio net with no hedge: {a} wins {fmt(r['wa'])}; {n} wins {fmt(r['wn'])}. Hedge side: **{r['side']}** at {am(r['d'])}.\n")
    print(f"| Plan | Hedge stake on {r['side']} | {a} wins | {n} wins | Expected (no-vig) | Expected cost of hedge |")
    print("|---|---:|---:|---:|---:|---:|")
    for x in r["rows"]:
        print(f"| {x['label']} | {fmt(x['stake'])} | {fmt(x['out_a'])} | {fmt(x['out_n'])} | {fmt(x['ev'])} | {fmt(x['cost'])} |")
    print()


# ---------------------------------------------------------------- conference hedge (maximin LP)
def _solve3(A, b):
    def det(m):
        return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
                + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))
    D = det(A)
    if abs(D) < 1e-12:
        return None
    out = []
    for i in range(3):
        m = [row[:] for row in A]
        for r in range(3):
            m[r][i] = b[r]
        out.append(det(m) / D)
    return out


def maximin(V, cA, cN, budget):
    """max t s.t. t <= V_s + cA_s*x + cN_s*y, x,y >= 0, x + y <= budget. Exact vertex enumeration."""
    rows = [([-cA[s], -cN[s], 1.0], V[s]) for s in range(len(V))]  # t - cA x - cN y <= V
    rows += [([-1.0, 0, 0], 0.0), ([0, -1.0, 0], 0.0), ([1.0, 1.0, 0], budget)]
    best = None
    n = len(rows)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                sol = _solve3([rows[i][0], rows[j][0], rows[k][0]], [rows[i][1], rows[j][1], rows[k][1]])
                if sol is None:
                    continue
                if all(sum(c * v for c, v in zip(r[0], sol)) <= r[1] + 1e-7 for r in rows):
                    key = (round(sol[2], 6), -(sol[0] + sol[1]))
                    if best is None or key > best[0]:
                        best = (key, sol)
    return best[1]


def conf_plan(pf, afc_game, nfc_game, sb_lines, default_sb, budget, sb_value):
    (a1, ma1), (a2, ma2) = afc_game
    (n1, mn1), (n2, mn2) = nfc_game
    dA = {a1: dec(ma1), a2: dec(ma2)}
    dN = {n1: dec(mn1), n2: dec(mn2)}
    pA = {a1: (1 / dA[a1]) / (1 / dA[a1] + 1 / dA[a2])}; pA[a2] = 1 - pA[a1]
    pN = {n1: (1 / dN[n1]) / (1 / dN[n1] + 1 / dN[n2])}; pN[n2] = 1 - pN[n1]
    states, V, sbinfo = [], [], {}
    for a in (a1, a2):
        for n in (n1, n2):
            nml, aml = sb_lines.get((n, a), default_sb)
            r = sb_plan(pf, a, n, aml, nml)
            full = r["rows"][2]
            v = full["out_a"] if sb_value == "lock" else r["rows"][0]["ev"]
            states.append((a, n)); V.append(v)
            sbinfo[(a, n)] = dict(wa=r["wa"], wn=r["wn"], lock=full["out_a"], sb_hedge=full["stake"],
                                  side=r["side"], lines=(nml, aml), ev=r["rows"][0]["ev"])
    best = None
    for sa in (a1, a2):
        for sn in (n1, n2):
            cA = [dA[sa] - 1 if a == sa else -1.0 for a, _ in states]
            cN = [dN[sn] - 1 if n == sn else -1.0 for _, n in states]
            x, y, t = maximin(V, cA, cN, budget)
            key = (round(t, 6), -(x + y))
            if best is None or key > best[0]:
                best = (key, dict(sa=sa, sn=sn, x=x, y=y, t=t, cA=cA, cN=cN))
    b = best[1]
    res = []
    for i, (a, n) in enumerate(states):
        out = V[i] + b["cA"][i] * b["x"] + b["cN"][i] * b["y"]
        conf_ret = (b["x"] * dA[b["sa"]] if a == b["sa"] else 0) + (b["y"] * dN[b["sn"]] if n == b["sn"] else 0)
        sbh = sbinfo[(a, n)]["sb_hedge"] if sb_value == "lock" else 0.0
        outlay = b["x"] + b["y"] + max(0.0, sbh - conf_ret)
        res.append(dict(a=a, n=n, p=pA[a] * pN[n], v=V[i], out=out, outlay=outlay, **sbinfo[(a, n)]))
    ev0 = sum(r["p"] * r["v"] for r in res)
    ev1 = sum(r["p"] * r["out"] for r in res)
    return dict(best=b, res=res, ev0=ev0, ev1=ev1, dA=dA, dN=dN, pA=pA, pN=pN)


def print_conf(c, sb_value, budget, default_sb):
    b = c["best"]
    print("## Conference championship hedge (maximin)\n")
    print("Each Super Bowl state is valued at " + ("its fully equalized SB-hedge lock value at the SB lookahead line" if sb_value == "lock"
          else "its no-vig expected value with no SB hedge") + f". States without a given SB line use {ml(default_sb[0])}/{ml(default_sb[1])} (NFC/AFC), a placeholder.\n")
    print(f"Plan: stake **{fmt(b['x'])} on {b['sa']}** at {am(c['dA'][b['sa']])} and **{fmt(b['y'])} on {b['sn']}** at {am(c['dN'][b['sn']])}"
          + (f" (budget {fmt(budget)})" if budget < 1e6 else " (no budget cap)") + f". Worst case after hedge: {fmt(b['t'])}.\n")
    print("| Super Bowl | No-vig prob | SB value, no conf hedge | After conf hedge | SB hedge then (side, stake) | Peak cash outlay |")
    print("|---|---:|---:|---:|---|---:|")
    for r in sorted(c["res"], key=lambda r: -r["p"]):
        sbh = f"{r['side']} {fmt(r['sb_hedge'])}" if sb_value == "lock" else "—"
        print(f"| {r['n']} vs {r['a']} | {r['p']*100:.1f}% | {fmt(r['v'])} | {fmt(r['out'])} | {sbh} | {fmt(r['outlay'])} |")
    print(f"\nExpected value (no-vig): {fmt(c['ev0'])} unhedged → {fmt(c['ev1'])} hedged; the difference is the vig paid for the floor.\n")


# ---------------------------------------------------------------- reserve sizing
def conf_probs():
    """Blend of Circa 10/28 and Bookmaker 10/28 no-vig conference probabilities."""
    books = []
    if CIRCA.exists():
        books.append({team(r["team"]): r["odds"] for r in json.load(open(CIRCA))})
    if BKR_MD.exists():
        bk = {}
        for line in open(BKR_MD):
            m = re.match(r"\| (AFC|NFC) \| ([^|]+?) \| \+([\d,]+) \|", line)
            if m:
                bk[team(m[2])] = int(m[3].replace(",", ""))
        if len(bk) == 32:
            books.append(bk)
    if not books:
        return None
    out = {}
    for conf in (AFC, NFC):
        for t in conf:
            vals = []
            for bk in books:
                s = sum(1 / dec(bk[x]) for x in conf)
                vals.append((1 / dec(bk[t])) / s)
            out[t] = sum(vals) / len(vals)
    return out


def reserve(pf, min_prob, seeding=None):
    P = conf_probs()
    rows = []
    for a in AFC:
        for n in NFC:
            wa, wn = pf.net(a, n, a), pf.net(a, n, n)
            hi, lo = max(wa, wn), min(wa, wn)
            gap = hi - lo
            side = n if wa >= wn else a
            opp = a if side == n else n
            sp = seeded_price(side, opp, seeding)
            rows.append(dict(a=a, n=n, wa=wa, wn=wn, gap=gap, side=side, p=P[a] * P[n] if P else None,
                             h_even=gap / 2, h_fav=gap / dec(-150), h_dog=gap / dec(130), lock_even=hi - gap / 2,
                             seed_price=sp, h_seed=gap / dec(sp)))
    return rows, P


def seeded_price(side, opp, seeding):
    """Hedge-side price under seeding assumptions: betting against an expected underdog
    (e.g. GB as a wild card) means betting a favorite; betting against an expected high
    seed (e.g. BUF) means betting an underdog. Otherwise even money."""
    if seeding is None:
        return 100.0
    if opp in seeding["underdog"]:
        return seeding["vs_underdog"]
    if opp in seeding["favored"]:
        return seeding["vs_favored"]
    return 100.0


def print_reserve(rows, P, min_prob, total_stake):
    print("## Reserve sizing: Super Bowl equalizing hedges\n")
    print("Stake to fully equalize each possible Super Bowl, betting the side whose win pays you less. "
          "Shown at even money, with the hedge side as a -150 favorite, and as a +130 underdog. "
          "Probabilities: blend of Circa (10/28 7:18 PM) and Bookmaker (10/28 9:21 AM) no-vig conference prices, independence assumed.\n")
    big = sorted([r for r in rows if r["gap"] >= 100], key=lambda r: -(r["p"] or 0) * r["gap"])
    print("| Super Bowl | Prob | You net if AFC wins | if NFC wins | Hedge side | Stake @ +100 | @ -150 | @ +130 | Seeded price | Stake @ seeded | Locked @ +100 |")
    print("|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|")
    shown = [r for r in big if (r["p"] or 0) >= min_prob]
    for r in shown:
        print(f"| {r['n']} vs {r['a']} | {r['p']*100:.2f}% | {fmt(r['wa'])} | {fmt(r['wn'])} | {r['side']} | {fmt(r['h_even'])} | {fmt(r['h_fav'])} | {fmt(r['h_dog'])} | {ml(r['seed_price'])} | {fmt(r['h_seed'])} | {fmt(r['lock_even'])} |")
    if P:
        tot = sum(r["p"] for r in rows)
        def pr(f):
            return sum(r["p"] for r in rows if f(r)) / tot
        print(f"\nShown: pairings with a gap of at least $100 and probability ≥ {min_prob*100:.2f}%, ordered by probability × gap.\n")
        print("Distribution of the even-money equalizing stake across all 256 pairings (probability-weighted):\n")
        for lim in (100, 300, 1000, 1500):
            print(f"- Hedge stake > {fmt(lim)}: {pr(lambda r: r['h_even'] > lim)*100:.1f}% of Super Bowls")
        print(f"- Total-loss pairings (−{fmt(total_stake)[1:]} either way, nothing to hedge): {pr(lambda r: r['wa'] <= -total_stake + 0.01 and r['wn'] <= -total_stake + 0.01)*100:.1f}%")
        ev = sum(r["p"] * r["h_even"] for r in rows) / tot
        print(f"- Probability-weighted average even-money stake: {fmt(ev)}")
    print()



# ---------------------------------------------------------------- one-game hedge: moneyline vs spread (middles)
def ncdf(x):
    return 0.5 * (1 + erf(x / sqrt(2)))


def mean_margin(p_win, sd):
    """Mean of a normal margin with P(margin > 0) = p_win (bisection)."""
    lo, hi = -60.0, 60.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if 1 - ncdf(-mid / sd) < p_win:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def branch_value(pf, t, p_sb_win, P):
    """Expected portfolio net if team t reaches the Super Bowl: probability-weighted over the
    other conference's field (no-vig blend), with t winning the Super Bowl at p_sb_win."""
    other = NFC if TEAMS[t][1] == "AFC" else AFC
    tot = sum(P[o] for o in other)
    v = 0.0
    for o in other:
        a, n = (t, o) if TEAMS[t][1] == "AFC" else (o, t)
        v += P[o] / tot * (p_sb_win * pf.net(a, n, t) + (1 - p_sb_win) * pf.net(a, n, o))
    return v


def middle_plan(prot, opp, prot_ml, opp_ml, line, spread_price, adv, out, sd=13.5, parlay=None):
    """prot = team you need to advance; line = prot's spread (e.g. -7 favored, +3 underdog).
    Hedges go on the opponent: moneyline (m) and/or spread at -line (s).
    margin M = prot score - opp score. Opp covers when M < -line."""
    dp, do, ds = dec(prot_ml), dec(opp_ml), dec(spread_price)
    p_prot = (1 / dp) / (1 / dp + 1 / do)
    mu = mean_margin(p_prot, sd)
    k = -line  # opp covers if M < k
    P_adv = 1 - ncdf(-mu / sd)
    if k > 0:   # protected favorite: middle region 0 < M < k
        regions = [("advance, dog does not cover", 1 - ncdf((k - mu) / sd), True, False),
                   ("MIDDLE: advance and dog covers", ncdf((k - mu) / sd) - ncdf(-mu / sd), True, True),
                   ("eliminated (dog wins)", ncdf(-mu / sd), False, True)]
    else:       # protected underdog: no middle; region k < M < 0 = eliminated but spread hedge loses
        regions = [("advance", P_adv, True, False),
                   ("eliminated, favorite does not cover", ncdf(-mu / sd) - ncdf((k - mu) / sd), False, False),
                   ("eliminated, favorite covers", ncdf((k - mu) / sd), False, True)]
    gap = adv - out
    plans = [("No hedge", 0.0, 0.0), (f"Moneyline only (equalize)", gap / do, 0.0),
             ("Spread only (equalize advance vs eliminated-and-covered)", 0.0, gap / ds),
             ("Mix: half the protection from each", gap / do / 2, gap / ds / 2)]
    res = []
    for name, m, sp in plans:
        vals = []
        for _, pr, advanced, covers in regions:
            v = (adv if advanced else out) + (-m if advanced else m * (do - 1)) + (sp * (ds - 1) if covers else -sp)
            vals.append(v)
        ev = sum(pr * v for (_, pr, _, _), v in zip(regions, vals))
        res.append(dict(name=name, cash=m + sp, vals=vals, ev=ev))
    if parlay:
        for name, mult, idx in ((f"Parlay spot: {fmt(parlay)} equity on {opp} moneyline (no new cash)", do, "ml"),
                                (f"Parlay spot: {fmt(parlay)} equity on {opp} {ml(-line) if -line < 0 else '+' + format(-line, 'g')} (no new cash)", ds, "sp")):
            vals = []
            for _, pr, advanced, covers in regions:
                base = adv if advanced else out
                hit = (not advanced) if idx == "ml" else covers
                # The spot's equity is spent either way (it has value even if unused), so count it like a stake.
                vals.append(base - parlay + (parlay * mult if hit else 0.0))
            ev = sum(pr * v for (_, pr, _, _), v in zip(regions, vals))
            res.append(dict(name=name, cash=0.0, vals=vals, ev=ev, parlay=True))
    return dict(prot=prot, opp=opp, line=line, p_prot=p_prot, mu=mu, sd=sd, regions=regions, res=res,
                adv=adv, out=out, dp=dp, do=do, ds=ds)


def print_middle(r):
    pr, op = r["prot"], r["opp"]
    print(f"## One-game hedge: protecting {pr} vs {op} ({pr} {ml(r['line']) if r['line'] < 0 else '+' + format(r['line'], 'g')})\n")
    print(f"Lines: {pr} {am(r['dp'])}, {op} {am(r['do'])}; spread price {am(r['ds'])}. No-vig {pr} win {r['p_prot']*100:.1f}%. "
          f"Margin model: normal, mean {r['mu']:+.1f}, SD {r['sd']:g} (approximation; ignores key numbers 3 and 7).\n")
    print(f"Portfolio value if {pr} advances: {fmt(r['adv'])}; if eliminated: {fmt(r['out'])}. "
          "Parlay rows treat the spot's equity like a stake (it is worth that much unused), so they compare directly with cash rows.\n")
    head = " | ".join(f"{name} ({p*100:.1f}%)" for name, p, _, _ in r["regions"])
    print(f"| Plan | Cash staked | {head} | Expected |")
    print("|---|---:|" + "---:|" * len(r["regions"]) + "---:|")
    for x in r["res"]:
        print(f"| {x['name']} | {fmt(x['cash'])} | " + " | ".join(fmt(v) for v in x["vals"]) + f" | {fmt(x['ev'])} |")
    print()

# ---------------------------------------------------------------- selftest
def selftest():
    pf = Portfolio(max_date="2026-10-22")  # the Week 8 review matrix is as of the Oct 22 ledger
    checks = [
        (("BUF", "GB", "GB"), 8800.29), (("BUF", "GB", "BUF"), 6454.70),
        (("BUF", "SEA", "SEA"), 617.97), (("BUF", "SEA", "BUF"), 1263.42),
        (("BUF", "DET", "DET"), -10.75), (("BUF", "DET", "BUF"), 634.70),
        (("KC", "CHI", "CHI"), 719.25), (("KC", "CHI", "KC"), 719.25),
        (("KC", "GB", "GB"), 6953.29), (("KC", "GB", "KC"), 3962.25),
        (("BUF", "MIN", "BUF"), 244.70), (("JAX", "GB", "GB"), 2590.29), (("JAX", "SF", "SF"), -400.75),
    ]
    ok = True
    assert abs(pf.total_stake - 400.75) < 0.005, pf.total_stake
    for (a, n, w), want in checks:
        got = pf.net(a, n, w)
        flag = abs(got - want) < 0.006
        ok &= flag
        print(f"{'ok ' if flag else 'BAD'} {n} vs {a}, {w} wins: {got:.2f} (review {want:.2f})")
    r = sb_plan(pf, "JAX", "GB", 100, 100)  # even money: (2590.29 + 400.75) / 2
    flag = abs(r["full"] - 1495.52) < 0.01 and abs(r["rows"][2]["out_a"] - r["rows"][2]["out_n"]) < 1e-6
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} SB equalize GB vs JAX even money: stake {r['full']:.2f}")
    x, y, t = maximin([10.0, 0.0], [1.0, -1.0], [0.0, 0.0], 1e6)  # bet x on state0-side at even money
    flag = abs(x) < 1e-9 and abs(t) < 1e-9
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} maximin does not bet into the better state: x={x:.4f}, t={t:.4f}")
    x, y, t = maximin([0.0, 10.0], [1.0, -1.0], [0.0, 0.0], 1e6)
    flag = abs(x - 5) < 1e-9 and abs(t - 5) < 1e-9
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} maximin equalizes a two-state gap: x={x:.4f}, t={t:.4f}")
    x, y, t = maximin([0.0, 10.0], [1.0, -1.0], [0.0, 0.0], 2.0)
    flag = abs(x - 2) < 1e-9 and abs(t - 2) < 1e-9
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} maximin respects budget: x={x:.4f}, t={t:.4f}")
    mu = mean_margin(0.75, 13.5)
    flag = abs((1 - ncdf(-mu / 13.5)) - 0.75) < 1e-9
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} margin model hits target win probability: mean {mu:.2f}")
    r = middle_plan("BUF", "MIN", -200, 170, -6.5, -110, 244.70, -400.75)
    tot = sum(p for _, p, _, _ in r["regions"])
    ml_only = r["res"][1]["vals"]
    flag = abs(tot - 1) < 1e-9 and abs(ml_only[0] - ml_only[2]) < 1e-6 and abs(ml_only[0] - ml_only[1]) < 1e-6
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} middle: regions sum to 1, moneyline hedge equalizes all regions")
    sp_only = r["res"][2]["vals"]
    flag = abs(sp_only[0] - sp_only[2]) < 1e-6 and sp_only[1] > sp_only[0]
    ok &= flag; print(f"{'ok ' if flag else 'BAD'} middle: spread hedge equalizes ends and pays extra in the middle")
    print("SELFTEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


# ---------------------------------------------------------------- CLI
def pair(s):
    t, ml = s.split(":")
    return team(t), float(ml)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ledger", default=str(LEDGER))
    ap.add_argument("--promo-stake-not-returned", action="store_true")
    sub = ap.add_subparsers(dest="mode", required=True)
    s = sub.add_parser("sb", help="Super Bowl set")
    s.add_argument("--afc", type=pair, required=True, help="e.g. BUF:-120")
    s.add_argument("--nfc", type=pair, required=True, help="e.g. GB:+100")
    s.add_argument("--budget", type=float)
    c = sub.add_parser("conf", help="Both conference championship games set")
    c.add_argument("--afc", type=pair, nargs=2, required=True, help="e.g. BUF:-150 KC:+130")
    c.add_argument("--nfc", type=pair, nargs=2, required=True, help="e.g. GB:+200 SF:-240")
    c.add_argument("--sb-line", action="append", default=[], help="Lookahead SB line NFC:ml,AFC:ml e.g. GB:+105,BUF:-125")
    c.add_argument("--default-sb", default="-110,-110", help="Placeholder SB line NFC,AFC for pairings without --sb-line")
    c.add_argument("--sb-value", choices=("lock", "ev"), default="lock")
    c.add_argument("--budget", type=float, default=1e7)
    r = sub.add_parser("reserve", help="Reserve sizing across all possible Super Bowls")
    r.add_argument("--min-prob", type=float, default=0.005)
    r.add_argument("--favored", default="BUF", help="Teams expected to be high seeds / favorites (comma list)")
    r.add_argument("--underdog", default="GB", help="Teams expected to be wild cards / underdogs (comma list)")
    r.add_argument("--vs-favored", type=float, default=175, help="Hedge price when betting against a favored team")
    r.add_argument("--vs-underdog", type=float, default=-250, help="Hedge price when betting against an underdog team")
    m = sub.add_parser("middle", help="One game: moneyline vs spread hedge, with middles")
    m.add_argument("--protect", type=pair, required=True, help="Team you need to advance and its moneyline, e.g. BUF:-300")
    m.add_argument("--opp", type=pair, required=True, help="Opponent and moneyline, e.g. HOU:+240")
    m.add_argument("--line", type=float, required=True, help="Protected team's spread, e.g. -7 (favored) or +3 (underdog)")
    m.add_argument("--spread-price", type=float, default=-110)
    m.add_argument("--adv", required=True, help="Portfolio value if protected team advances: dollars or auto:TEAM")
    m.add_argument("--out", required=True, help="Value if eliminated: dollars or auto:TEAM (the team that advances instead)")
    m.add_argument("--sb-win-prob", type=float, default=0.5, help="SB win probability used by auto:TEAM (default 0.5)")
    m.add_argument("--sd", type=float, default=13.5)
    m.add_argument("--parlay", type=float, help="Open-spot equity to show as a no-cash alternative")
    sub.add_parser("selftest")
    a = ap.parse_args(argv)
    if a.mode == "selftest":
        return selftest()
    pf = Portfolio(a.ledger, promo_stake_returned=not a.promo_stake_not_returned)
    print(f"_Ledger as of {pf.as_of} (not reconciled with accounts); open Super Bowl stakes {fmt(pf.total_stake)}; "
          f"promo stake {'not ' if a.promo_stake_not_returned else ''}returned (assumption). Planning output only — not a quote or a placed bet._\n")
    if a.mode == "sb":
        (at, aml), (nt, nml) = a.afc, a.nfc
        print_sb(sb_plan(pf, at, nt, aml, nml, a.budget), aml, nml)
    elif a.mode == "conf":
        lines = {}
        for spec in a.sb_line:
            (n, nml), (at, aml) = [pair(x) for x in spec.split(",")]
            lines[(n, at)] = (nml, aml)
        d = tuple(float(x) for x in a.default_sb.split(","))
        print_conf(conf_plan(pf, a.afc, a.nfc, lines, d, a.budget, a.sb_value), a.sb_value, a.budget, d)
    elif a.mode == "middle":
        P = conf_probs()
        def val(v):
            if v.startswith("auto:"):
                t = team(v[5:])
                print(f"_{v}: expected net if {t} reaches the Super Bowl, over the no-vig field, SB win prob {a.sb_win_prob:g}: {fmt(branch_value(pf, t, a.sb_win_prob, P))}._\n")
                return branch_value(pf, t, a.sb_win_prob, P)
            return float(v)
        (pt, pml), (ot, oml) = a.protect, a.opp
        print_middle(middle_plan(pt, ot, pml, oml, a.line, a.spread_price, val(a.adv), val(a.out), a.sd, a.parlay))
    else:
        seeding = dict(favored={team(x) for x in a.favored.split(",") if x}, underdog={team(x) for x in a.underdog.split(",") if x},
                       vs_favored=a.vs_favored, vs_underdog=a.vs_underdog)
        print(f"_Seeded price column: betting against {', '.join(sorted(seeding['favored']))} at {ml(a.vs_favored)}; "
              f"against {', '.join(sorted(seeding['underdog']))} at {ml(a.vs_underdog)}; otherwise +100. Assumptions, not quotes._\n")
        rows, P = reserve(pf, a.min_prob, seeding)
        print_reserve(rows, P, a.min_prob, pf.total_stake)
    return 0


if __name__ == "__main__":
    sys.exit(main())
