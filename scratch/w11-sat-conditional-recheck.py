"""Recheck the 27 conditional public-source picks against Saturday BetOnline rows (exact player/stat/side/threshold) and ESPN availability.
Writes reports/intel/w11-conditional-picks-recheck-2026-11-21.md. Research only; no endorsement."""
import json, re
d = json.load(open('data/research-intel/review/2026-w11-public-source-picks.json', encoding='utf-8'))
cp = [r for r in d['decisions'] if r.get('decision') == 'conditional_pick']
bol = json.load(open('data/generated/props/betonline-live-2026-11-21-week11.json', encoding='utf-8'))
av = json.load(open('data/player-availability/latest.json', encoding='utf-8'))
status = {}
for e in av['events']:
    if e.get('source') != 'ESPN injuries API': continue
    k = e['player_name']
    if k not in status or (e.get('published_at') or '') > status[k][1]:
        status[k] = (e.get('status_raw') or '', e.get('published_at') or '')
STAT = {'receiving yards': 'rec_yds', 'rushing yards': 'rush_yds', 'rushing and receiving yards': 'rush_rec_yds', 'receptions': 'rec',
        'passing attempts': 'pass_att', 'passing touchdowns': 'pass_td', 'anytime touchdown': 'atd_1_plus', 'longest rush': 'longest_rush'}
def stat_of(sel):
    s = sel.lower()
    for k in sorted(STAT, key=len, reverse=True):
        if k in s: return STAT[k]
    return None
def norm(n): return re.sub(r'[^a-z]', '', (n or '').lower().replace(' jr', '').replace(' ii', ''))
SAT = {'TEN@DAL': {'spread_TEN': (9, -125)}, 'PIT@PHI': {'total': (37.5, -113)}, 'MIA@BUF': {'total': (44.5, -108)}}
out = ['# Week 11 conditional public-source picks: Saturday recheck', '',
       f"As of {d['as_of']}. **No Platinum Rose endorsement** on any row. Compared against BetOnline Sat 11:33 am PT (`betonline-live-2026-11-21-week11.json`) on exact player, stat, side and threshold, and against the ESPN injury feed (Sat 11:08 am PT). Bookmaker is Thursday's (not recaptured).", '',
       '| # | Game | Pick | Saturday quote (exact) | Availability | Saturday status |', '|---:|---|---|---|---|---|']
for i, r in enumerate(cp, 1):
    g, sel, pl = r['game'], r['selection'], r.get('player')
    quote, st_txt, verdict = '—', '—', ''
    if pl:
        s = stat_of(sel); side = r.get('side'); line = r.get('line')
        hits = [x for x in bol['rows'] if norm(x.get('player')) == norm(pl) and x.get('market') == s]
        exact = [x for x in hits if (s == 'atd_1_plus') or (x.get('line') is not None and float(x['line']) == float(line) and str(x.get('side', '')).lower().startswith(str(side)[:2]))]
        if exact:
            quote = f"{exact[0].get('side') or 'Yes'} {exact[0].get('line') or ''} ({exact[0].get('odds')})".strip()
        elif hits:
            quote = 'different threshold: ' + ', '.join(sorted({f"{x.get('side')} {x.get('line')} ({x.get('odds')})" for x in hits})[:3])
        else:
            quote = 'not on Saturday BetOnline board'
        stt = status.get(pl)
        st_txt = f"{stt[0]} ({stt[1][:10]})" if stt else 'no designation'
        bad = stt and any(k in stt[0].lower() for k in ('out', 'doubt', 'reserve'))
        q = stt and 'quest' in stt[0].lower()
        verdict = 'DROP: player unavailable' if bad else ('HOLD conditional: player must be active' if q else ('Supported: exact line quoted' if exact else 'Conditional: needs exact quote'))
    else:
        if g == 'TEN@DAL':
            quote = 'TEN +9 (-125)'; verdict = 'Supported: +8 or better available (price -125)'
        elif g == 'PIT@PHI':
            quote = 'Under 37.5 (-113)'; verdict = 'Conditional: 38.5 not available; Under 38.5 only'
        elif g == 'MIA@BUF':
            quote = 'Under 44.5 (-108)'; verdict = 'Supported: exact line quoted'
    if g == 'TB@DET': verdict += '; Mayfield status open; no TB@DET board at BetOnline'
    if g == 'ARI@KC': verdict += '; no ARI@KC game line at BetOnline'
    out.append(f"| {i} | {g} | {sel}{' — ' + pl if pl and pl not in sel else ''} | {quote} | {st_txt} | {verdict} |")
open('reports/intel/w11-conditional-picks-recheck-2026-11-21.md', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('\n'.join(out))
