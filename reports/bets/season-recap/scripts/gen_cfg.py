#!/usr/bin/env python3
"""Auto-draft cfg_wN.py + recaps_wN.py for a week that has no hand-built page config yet.

Everything numeric is computed (cash returns, ticket families, season rows, projections, near misses, game recaps from the box
scores); the narrative strings are a plain auto draft marked [auto draft] for Claude/Andy to edit before the page goes anywhere.
Never overwrites an existing cfg unless --force (then backs it up first).
  python3 scripts/gen_cfg.py --week 9 [--force]
"""
import argparse, datetime, json, os, pprint, shutil, sys
D = os.path.dirname(os.path.abspath(__file__)); RECAP = os.path.abspath(os.path.join(D, '..'))
ROOT = os.path.abspath(os.path.join(RECAP, '..', '..', '..'))
sys.path.insert(0, D); sys.path.insert(0, os.path.join(ROOT, 'reports', 'analysis', 'season', 'claude', 'scripts'))
import lib  # noqa: E402
import ai_record  # noqa: E402
import scorecard  # noqa: E402
def to_pt(u):
    """UTC -> US Pacific with DST (2nd Sunday of March to 1st Sunday of November, 2 AM local); no tzdata needed on Windows."""
    y = u.year
    mar = datetime.datetime(y, 3, 8, 10, tzinfo=datetime.timezone.utc); mar += datetime.timedelta(days=(6 - mar.weekday()) % 7)
    nov = datetime.datetime(y, 11, 1, 9, tzinfo=datetime.timezone.utc); nov += datetime.timedelta(days=(6 - nov.weekday()) % 7)
    return u.astimezone(datetime.timezone(datetime.timedelta(hours=-7 if mar <= u < nov else -8)))


def kick(iso):
    try: t = to_pt(datetime.datetime.fromisoformat(iso.replace('Z', '+00:00')))
    except Exception: return ''
    d = t.strftime('%a'); hm = t.strftime('%-I:%M') if os.name != 'nt' else t.strftime('%#I:%M')
    if d == 'Thu': return 'Thu TNF'
    if d == 'Mon': return 'Mon MNF'
    if d == 'Sun' and t.hour >= 17: return 'Sun SNF'
    return f'{d} {hm}'


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--week', type=int, required=True); ap.add_argument('--force', action='store_true')
    a = ap.parse_args(); wk = a.week
    cfg_p = os.path.join(D, f'cfg_w{wk}.py'); rec_p = os.path.join(RECAP, f'recaps_w{wk}.py')
    if os.path.exists(cfg_p) and not a.force: sys.exit(f'{cfg_p} exists (hand-built); use --force to regenerate')
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M')
    for p in (cfg_p, rec_p):
        if os.path.exists(p): shutil.copy2(p, f'{p}.bak-claude-{stamp}')
    L = json.load(open(os.path.join(RECAP, f'w{wk}legs.json'))); GS = json.load(open(os.path.join(RECAP, f'w{wk}gamesum.json')))
    PP = json.load(open(os.path.join(RECAP, f'w{wk}paper.json'))) if os.path.exists(os.path.join(RECAP, f'w{wk}paper.json')) else []
    SC = scorecard.build(wk, os.path.join(RECAP, f'w{wk}legs.json'), os.path.join(RECAP, f'w{wk}paper.json'))
    W = {w['id']: w for w in lib.load_wagers() if w.get('week') == wk}
    PROJ, psrc = scorecard.projections(wk)
    PROJ = {k: tuple(v) for k, v in PROJ.items()}
    RET = {i: round(lib.cash_return(w), 2) for i, w in W.items() if lib.is_cash(w) and lib.cash_return(w) > 0}
    fams = [f for f in lib.FAMILIES if any(lib.family(w) == f for w in W.values() if lib.is_cash(w))]
    totals = [g['score'][0] + g['score'][1] for g in GS]
    tlo = max(0, (min(totals + [40]) - 8) // 5 * 5); thi = (max(totals + [50]) + 12) // 5 * 5
    # leg instances per game + AI legs per game
    per_game = {}
    for l in L['legs']:
        if l['result'] in ('W', 'L'): per_game.setdefault(l['game'], [0, 0])[0 if l['result'] == 'W' else 1] += 1
    ai_game = {}
    for s in ai_record.load_ai(wk):
        ai_game.setdefault(s['game'].replace(' ', ''), []).append(s['label'])
    aig = {}
    for l in L['ai_only'] + [x for x in L['legs'] if x['origin'] == 'agree']:
        aig.setdefault((l['game'] or '').replace(' ', ''), []).append(l['result'])
    R = {}
    for g in GS:
        k = f"{g['away']}@{g['home']}"; A, H = g['away'], g['home']; a, h = g['score']
        win, lose = (A, H) if a > h else (H, A)
        lead = '; '.join(x for x in (g[A].get('qb'), g[H].get('qb'), g[A].get('rb'), g[H].get('rb')) if x)
        pw, pl = per_game.get(k, [0, 0]); ar = aig.get(k, [])
        ai_txt = ', '.join(sorted(set(ai_game.get(k, []))))[:300] or 'No AI legs logged for this game.'
        R[k] = dict(kick=kick(g.get('date') or ''), ai=ai_txt,
                    happened=f"{lead}. {win} {max(a, h)}-{min(a, h)}{' (tie)' if a == h else ''}, total {a + h}.",
                    wrong=f"[auto draft] Placed legs {pw} of {pw + pl}. AI legs on this game {ar.count('W')} of {len([x for x in ar if x in ('W', 'L')])}.",
                    experts='', grade=f"Placed {pw}/{pw + pl}" if pw + pl else 'No placed legs')
    DIV = []
    for p in PP:
        if not p.get('extra'): continue
        ls = p['legs']; hit = sum(l['result'] == 'W' for l in ls)
        DIV.append(('AI', p['name'][:40], ' / '.join(l['label'] for l in ls)[:160], 'see tickets', f'{hit} of {len(ls)} legs hit', 'Pending'))
    NM = [(x['name'][:60] + f" ({x['kind']})", f"{x['legs'] - 1} of {x['legs']}: {x['missed'][:50]} (actual {x['actual']})") for x in SC['near_misses']][:12]
    SEASON = []
    for x in SC['season']:
        hw, hn = x.get('legs_hit') or (None, None)
        if hn is None:
            ls = [l for w in lib.load_wagers() if w.get('week') == x['week'] for l in lib.real_legs(w) if l.get('status') in ('WON', 'LOST')]
            hw, hn = sum(l['status'] == 'WON' for l in ls), len(ls) or 1
        SEASON.append((str(x['week']), x['staked'], x['returned'], hw, hn, ''))
    c = SC['cash']; pr = SC['split']['promo']; ai_n = L.get('ai_record_size') or 0
    TEXT = dict(
        eyebrow=f'Platinum Rose · 2026 Week {wk} · settled · [auto draft]',
        lede=f"[auto draft] Every placed leg re-graded from ESPN box scores. Cash: {c['tickets']} tickets, {c['won']} won, ${c['staked']:.2f} staked, "
             f"${c['returned']:.2f} back, net {scorecard.money(c['net'])}. Promo: {pr['tickets']} tickets, ${pr['credit_staked']:.2f} credit -> ${pr['value_returned']:.2f}.",
        kpis=[(f"${c['staked']:.2f}", f"Cash staked · {c['tickets']} tickets", False), (f"${c['returned']:.2f}", 'Returned', False),
              (scorecard.money(c['net']), 'Net for the week', c['net'] < 0),
              (f"{sum(l['result'] == 'W' for l in L['legs'])}/{sum(l['result'] in ('W', 'L') for l in L['legs'])}", 'Placed leg instances hit', False),
              (f"{c['won']} of {c['tickets']}", 'Cash tickets that cashed', c['won'] == 0)],
        money_sub='[auto draft] Stake and money back by ticket family (lib.py families; cash tickets only).',
        proj_name='Fair line',
        proj_sub=('Open circles are the Master Intel fair-line scores; filled circles are the finals. Home-margin error {M["mae"]:.1f} points on average.'
                  if PROJ else 'No fair-line projection was logged for this week.'),
        proj_callouts=([('Winner picks: {M["winners"]} of ' + str(len(PROJ)), '[auto draft]'), ('Totals', '{M["over_n"]} of ' + str(len(PROJ)) + ' finished over the fair total.')] if PROJ else []),
        cats_sub='Each unique position counts once, even if it sat on several tickets ({M["u"]} graded positions).',
        ai_sub=(f'AI record: {ai_n} distinct legs ({L.get("ai_record_source") or "AI record"}). A placed leg counts as AI-backed when the same proposition is in that record.'
                if ai_n else 'No machine-readable AI record exists for this week, so every placed leg shows as "not in AI record".'),
        ai_note='[auto draft]',
        ai_callouts=[('AI-backed props: {o["Player props"]["agree"][0]} of {o["Player props"]["agree"][1]}',
                      'Other placed props hit {pct(o["Player props"]["andy"])}%; unplaced AI props hit {pct(o["Player props"]["ai_only"])}%.')],
        close_sub='Placed tickets and unplaced AI builds, sorted by how many legs missed. Hover a leg for the actual number.',
        games_sub='Each card shows the final, the fair line, the AI legs on the game and how our placed legs did. Recaps are an auto draft from the box score.',
        method=[f'Leg results come from the ESPN box scores in <span class="mono">reports/bets/season-recap/w{wk}games.json</span>; the two graders were cross-checked first (work/w{wk}/crosscheck_w{wk}.md).',
                f'The AI record is <span class="mono">data/official-picks/ai-proposals/2026-w{wk:02d}.json</span>' + ('' if ai_n else ' (empty for this week)') + '.',
                'Cash returned is the settled payout of cash-funded tickets (lib.py); DraftKings Predictions tickets count as tagged.',
                f'Fair lines: {psrc or "none logged"}.', 'Generated by scripts/postmortem.py (gen_cfg.py auto draft).'])
    with open(rec_p, 'w', encoding='utf-8') as f:
        f.write(f'# Week {wk} game recaps: AUTO DRAFT from w{wk}gamesum.json by scripts/gen_cfg.py ({stamp}). Edit "wrong"/"experts"/"grade" by hand.\nR=')
        f.write(pprint.pformat(R, width=160, sort_dicts=False) + '\n')
    with open(cfg_p, 'w', encoding='utf-8') as f:
        f.write(f'# Week {wk} page config: AUTO DRAFT by scripts/gen_cfg.py ({stamp}). Numbers are computed; strings marked [auto draft] need a human pass.\n')
        f.write(f'from recaps_w{wk} import R\nFORCE_ANDY=()\n')
        f.write('RET=' + pprint.pformat(RET, width=160) + '\n')
        f.write('BUCKETS=' + repr(fams) + '\n')
        f.write('_FAM=' + pprint.pformat({t['id']: t.get('family') for t in L['tickets']}, width=160) + '\n')
        f.write("def bucket(t): return _FAM.get(t['id']) or 'Prop parlay / stack'\n")
        f.write(f'TOT_LO,TOT_HI={int(tlo)},{int(thi)}\n')
        f.write("PROJ_LABEL='Master Intel fair line'\nNOPROJ='— (no fair line logged)'\n")
        f.write("ORIGIN_LABELS=[('agree','In AI record · placed','o-agree'),('andy','Not in AI record','o-andy'),('ai_only','AI rec · not placed','o-aionly')]\n")
        f.write('PROJ=' + pprint.pformat(PROJ, width=160) + '\n')
        f.write('NAMES={}\n')
        f.write('DIV=' + pprint.pformat(DIV, width=200) + '\n')
        f.write('NM=' + pprint.pformat(NM, width=200) + '\n')
        f.write('ORDER=' + repr([f"{g['away']}@{g['home']}" for g in GS]) + '\n')
        f.write('SEASON=' + pprint.pformat(SEASON, width=160) + '\n')
        f.write('TEXT=' + pprint.pformat(TEXT, width=180, sort_dicts=False) + '\n')
    print(f'wrote {os.path.relpath(cfg_p, ROOT)} and {os.path.relpath(rec_p, ROOT)} (auto draft)')


if __name__ == '__main__':
    main()
