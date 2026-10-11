#!/usr/bin/env python3
"""Machine check for a per-game Week 5 synthesis JSON against its packet. Zero cost, read-only.

Usage:
  python3 scripts/intel/validate-game-output.py --model opus --game CHI@GB
  python3 scripts/intel/validate-game-output.py --model opus --all
Exit code 1 if any FAIL.
"""
import argparse, glob, json, os, subprocess, sys

PK = 'data/research-intel/game-packets/2026-w05'
OUT = os.environ.get('W05_OUT_DIR', 'data/research-intel/proposed/games')
DISPOSITIONS = {'quantitative candidate', 'qualitative candidate', 'conflicted', 'price moved', 'unavailable', 'pass'}
TIERS = {'2', '2-', 'skip', 'research_only'}
PAIR = {'quantitative candidate': {'2', '2-'}, 'qualitative candidate': {'2', '2-'}, 'conflicted': {'2-', 'skip', 'research_only'}, 'price moved': {'2-', 'skip', 'research_only'}, 'unavailable': {'research_only'}, 'pass': {'skip', 'research_only'}}
FORBIDDEN = {'ticket', 'stake', 'wager_amount', 'bet_slip', 'payout'}
SOFT_CAP, HARD_CAP, TOL = 2.0, 3.0, 0.005
fails = warns = 0


def emit(level, msg):
    global fails, warns
    if level == 'FAIL':
        fails += 1
    if level == 'WARN':
        warns += 1
    print('[%s] %s' % (level, msg))


def walk_keys(o):
    if isinstance(o, dict):
        for k, v in o.items():
            yield k
            for x in walk_keys(v):
                yield x
    elif isinstance(o, list):
        for v in o:
            for x in walk_keys(v):
                yield x


def sim(home_line, total, m, t):
    p = subprocess.run(['node', 'scripts/intel/margin-simulator.mjs', '--home-line', str(home_line), '--total', str(total), '--margin-adj', str(m), '--total-adj', str(t)], capture_output=True, text=True, timeout=60)
    return json.loads(p.stdout)


def check(model, game):
    gk = game.replace('@', '_at_')
    pp, op = '%s/%s.json' % (PK, gk), '%s/2026-w05-%s-%s.json' % (OUT, model, gk)
    print('\n== %s (%s)' % (game, model))
    if not os.path.exists(pp):
        emit('FAIL', 'no packet ' + pp); return
    if not os.path.exists(op):
        emit('FAIL', 'no output ' + op); return
    pk, o = json.load(open(pp, encoding='utf-8')), json.load(open(op, encoding='utf-8'))
    rows = {r['row']: r for r in pk['source_rows']['rows']}
    for k in ('schema', 'game', 'model', 'generated_at', 'market', 'disposition', 'tier', 'edge_hypothesis', 'simulator', 'cited_rows', 'invalidators', 'gaps'):
        if k not in o:
            emit('FAIL', 'missing key ' + k)
    if o.get('game') != game: emit('FAIL', 'game field %r != %r' % (o.get('game'), game))
    if o.get('model') != model: emit('FAIL', 'model field %r != %r' % (o.get('model'), model))
    bad = FORBIDDEN & {str(k).lower() for k in walk_keys(o)}
    emit('FAIL' if bad else 'PASS', 'forbidden ticket/stake fields: %s' % sorted(bad) if bad else 'no ticket/stake fields')
    if o.get('disposition') not in DISPOSITIONS: emit('FAIL', 'disposition %r not in %s' % (o.get('disposition'), sorted(DISPOSITIONS)))
    if o.get('tier') not in TIERS: emit('FAIL', 'tier %r not in %s (tier 1 is only decided at slate merge, if ever)' % (o.get('tier'), sorted(TIERS)))
    if o.get('disposition') in PAIR and o.get('tier') not in PAIR[o['disposition']]:
        emit('FAIL', 'disposition %r cannot carry tier %r (allowed: %s)' % (o['disposition'], o.get('tier'), sorted(PAIR[o['disposition']])))
    # market must equal packet BKR
    bk = pk['market']['BKR']['lines']
    hl = next((x['line'] for x in bk['spread'] if x['side'] == pk['home']['name']), None)
    tot = next((x['line'] for x in bk['total'] if x.get('line') is not None), None)
    m = o.get('market', {})
    if m.get('home_line') != hl or m.get('total') != tot:
        emit('FAIL', 'market home_line/total %s/%s != packet BKR %s/%s' % (m.get('home_line'), m.get('total'), hl, tot))
    else:
        emit('PASS', 'market matches packet BKR (home %s, total %s)' % (hl, tot))
    if m.get('captured_at') != pk['market']['BKR']['captured_at']:
        emit('FAIL', 'market.captured_at %s != packet %s' % (m.get('captured_at'), pk['market']['BKR']['captured_at']))
    # edge cap
    e = o.get('edge_hypothesis', {})
    em, et = float(e.get('home_margin_pts') or 0), float(e.get('total_pts') or 0)
    for nm, v in (('home_margin_pts', em), ('total_pts', et)):
        if abs(v) > HARD_CAP: emit('FAIL', '%s %.2f exceeds hard cap %.1f' % (nm, v, HARD_CAP))
        elif abs(v) > SOFT_CAP and not e.get('cap_exception'): emit('FAIL', '%s %.2f exceeds %.1f without cap_exception text' % (nm, v, SOFT_CAP))
    if not e.get('basis'): emit('FAIL', 'edge_hypothesis.basis is empty (name the inputs that justify the edge)')
    # simulator
    if hl is not None and tot is not None and 'simulator' in o:
        try:
            s = sim(hl, tot, em, et)
            for k_out, k_sim in (('home_cover', 'home_cover'), ('away_cover', 'away_cover'), ('over', 'over'), ('under', 'under')):
                if o['simulator'].get(k_out) is None or abs(o['simulator'][k_out] - s[k_sim]) > TOL:
                    emit('FAIL', 'simulator.%s %s != recomputed %.4f' % (k_out, o['simulator'].get(k_out), s[k_sim]))
            emit('PASS', 'simulator probabilities recomputed for edge %+.2f / %+.2f' % (em, et))
        except Exception as ex:  # noqa
            emit('FAIL', 'simulator run failed: %s' % ex)
    # citations
    elig_outlets = set()
    for c in o.get('cited_rows', []):
        r = rows.get(c.get('row'))
        if not r: emit('FAIL', 'cited row not in this game packet: %s' % c.get('row')); continue
        if r['tier_eligible']: elig_outlets.add(r['outlet'])
        if c.get('quote') and r.get('quote') and c['quote'] != r['quote']:
            emit('FAIL', 'quote for %s is not verbatim from the packet' % c['row'])
        if c.get('supports_tier') and not r['tier_eligible']:
            emit('FAIL', '%s is not tier-eligible but is marked supports_tier' % c['row'])
    if o.get('tier') == '2' and len(elig_outlets) < 2:
        emit('FAIL', 'tier 2 needs >= 2 independent tier-eligible outlets; found %s' % sorted(elig_outlets))
    if not o.get('invalidators'): emit('FAIL', 'invalidators is empty')
    # freshness
    if not pk['market']['BKR']['fresh_at_build']:
        emit('WARN', 'packet BKR capture was already stale at build time; output must be research_only')
    if o.get('tier') in ('2', '2-') and pk['market'].get('book_conflict'):
        emit('WARN', 'book conflict in packet (%s) but tier is %s; confirm the output addresses it' % (pk['market']['book_conflict'], o.get('tier')))
    for pr in o.get('props', []):
        for k in ('player', 'market', 'side', 'line', 'price', 'book', 'captured_at', 'status'):
            if k not in pr: emit('FAIL', 'prop row missing %s: %s' % (k, json.dumps(pr)[:80]))
        if 'probability' in pr or 'edge' in pr: emit('FAIL', 'prop rows must not carry model probability/edge')
    print('   ok' if not fails else '   has failures')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True, choices=['astra', 'opus', 'sonnet'])
    ap.add_argument('--game')
    ap.add_argument('--all', action='store_true')
    a = ap.parse_args()
    games = [json.load(open(p, encoding='utf-8'))['game'] for p in sorted(glob.glob(PK + '/*_at_*.json'))] if a.all else [a.game]
    for g in games:
        check(a.model, g)
    print('\nSUMMARY: %d fail, %d warn' % (fails, warns))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
