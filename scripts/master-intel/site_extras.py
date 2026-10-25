#!/usr/bin/env python3
"""Extra site pages and blocks for the Master Intel client site (called by build_site.py).

  sc_page(ctx)        Super Contest tab: the five, five alternates, reasoning, then expert sides (ATS only) with citations
  props_lab(ctx)      Props Lab: recommended legs per game from every intel source, with the best price across BKR / BEO / DK
  teaser_extras(ctx)  Teaser Board: named experts per Wong leg, expert teaser calls, teaser / round-robin math
  BOOKMARKS_*         bookmark page body, script and styles (localStorage, per viewer)

Everything is read from files already on disk (read-only): the card, the narratives, the verified expert rows,
the podcast episode links (scripts/master-intel/podcast_links.mjs), the BKR / BEO / DK price captures and the
master packet json that build.py writes. Nothing here changes a pick; it only presents what the card and the
intel already say.
"""
import glob, html, json, math, re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
import sc_review

ROOT = Path(__file__).resolve().parents[2]
E = lambda s: html.escape(str(s if s is not None else ''), quote=True)

TEAMS = {
    'ARI': 'Cardinals', 'ATL': 'Falcons', 'BAL': 'Ravens', 'BUF': 'Bills', 'CAR': 'Panthers', 'CHI': 'Bears',
    'CIN': 'Bengals', 'CLE': 'Browns', 'DAL': 'Cowboys', 'DEN': 'Broncos', 'DET': 'Lions', 'GB': 'Packers',
    'HOU': 'Texans', 'IND': 'Colts', 'JAX': 'Jaguars', 'KC': 'Chiefs', 'LV': 'Raiders', 'LAC': 'Chargers',
    'LAR': 'Rams', 'MIA': 'Dolphins', 'MIN': 'Vikings', 'NE': 'Patriots', 'NO': 'Saints', 'NYG': 'Giants',
    'NYJ': 'Jets', 'PHI': 'Eagles', 'PIT': 'Steelers', 'SF': '49ers', 'SEA': 'Seahawks', 'TB': 'Buccaneers',
    'TEN': 'Titans', 'WAS': 'Commanders'}
NICK = {v.lower(): k for k, v in TEAMS.items()}
BEO_CODE = {'LVR': 'LV', 'NOS': 'NO', 'WSH': 'WAS', 'JAC': 'JAX', 'TBB': 'TB', 'GBP': 'GB', 'KCC': 'KC', 'NEP': 'NE', 'SFO': 'SF', 'LA': 'LAR'}


def slug(s): return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-')
def gpage(gid): return f'game-{slug(gid)}.html'
def am(o):
    try: o = int(round(float(o)))
    except (TypeError, ValueError): return ''
    return f'{o:+d}'.replace('-', '−')
def dec(o):
    o = float(o); return 1 + (o / 100 if o > 0 else 100 / -o)
def ln(x):
    return ('+' if x > 0 else '') + (f'{x:g}'.replace('-', '−'))
def J(p, d=None):
    try: return json.loads(Path(p).read_text(encoding='utf-8'))
    except Exception: return d


# ---------------------------------------------------------------- context
def load(week, date):
    W = f'{int(week):02d}'
    pk = ROOT / f'dist/nfl_week{int(week)}_master_packet/nfl_week{int(week)}_master_betting_intelligence_summary.json'
    M = J(pk, {}) or {}
    games = {g['game']: g for g in M.get('games', [])}
    order = sorted(games, key=lambda k: games[k].get('kickoff_utc', ''))
    ver = J(ROOT / f'data/generated/master-intel/w{W}-expert-verified.json', {}) or {}
    vrows = [r for r in ver.get('rows', []) if r.get('verdict') == 'verified' and r.get('game') in games]
    pods = J(ROOT / f'data/generated/master-intel/w{W}-podcast-links.json', {}) or {}
    card = (ROOT / f'reports/bets/{date[:4]}-w{W}-card.md')
    card = card.read_text(encoding='utf-8') if card.exists() else ''
    narr = ROOT / f'reports/intel/master-intel-narratives-{date[:4]}-w{W}.md'
    narr = narr.read_text(encoding='utf-8') if narr.exists() else ''
    standings_path = ROOT / f'data/supercontest/standings-week-{W}-{date}.md'
    standings = standings_path.read_text(encoding='utf-8') if standings_path.exists() else ''
    digest = ROOT / f'scratch/w{W}-synthesis-digest-sat.md'
    digest = digest.read_text(encoding='utf-8') if digest.exists() else ''
    team_game = {}
    for gid, g in games.items():
        team_game[g['away']] = gid; team_game[g['home']] = gid
    return dict(week=int(week), date=date, M=M, games=games, order=order, vrows=vrows, pods=pods, card=card,
                narr=narr, digest=digest, standings=standings, team_game=team_game, W=W)


def block(txt, name):
    m = re.search(r'^## ' + re.escape(name) + r'\n(.*?)(?=^## |\Z)', txt, re.M | re.S)
    out = {}
    for l in (m.group(1).splitlines() if m else []):
        mm = re.match(r'^- (.+?): (.+)$', l.strip())
        if mm: out[mm.group(1).strip()] = mm.group(2).strip()
    return out


def standings_html(markdown_text):
    if not markdown_text.strip(): return ''
    lines = markdown_text.strip().splitlines()
    note = lines[0].removeprefix('Source: ').strip() if lines and lines[0].startswith('Source: ') else ''
    parts = re.split(r'^###\s+', '\n'.join(lines[1:] if note else lines), flags=re.M)
    sections = []
    for part in parts[1:]:
        title, _, body = part.partition('\n')
        rows = []
        for line in body.splitlines():
            if not line.startswith('|'): continue
            cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
            if not cells or all(re.fullmatch(r'[-: ]+', cell or ' ') for cell in cells): continue
            rows.append(cells)
        if not rows: continue
        head, data = rows[0], rows[1:]
        sections.append((title.strip(), head, data))

    def score(row, col):
        try: return float(row[col].replace(',', ''))
        except (IndexError, ValueError): return None

    overall = next((x for x in sections if 'overall' in x[0].lower()), None)
    quarterly = next((x for x in sections if 'quarter' in x[0].lower()), None)
    def entry_and_leader(section, column):
        if not section: return None, None, None, []
        head, data = section[1], section[2]
        player_col = next((i for i, h in enumerate(head) if h.lower() == 'player'), 0)
        entry = next((r for r in data if len(r) > player_col and r[player_col].strip().lower() == 'amanda rose'), None)
        vals = [(score(r, column), r) for r in data]
        vals = [(v, r) for v, r in vals if v is not None]
        leader = max((v for v, _ in vals), default=None)
        cutoff = sorted((v for v, _ in vals), reverse=True)[4] if len(vals) >= 5 else None
        return entry, leader, cutoff, data

    ov_col = next((i for i, h in enumerate(overall[1]) if h.lower() == 'total score'), 1) if overall else 1
    q_col = next((i for i, h in enumerate(quarterly[1]) if h.lower() in ('qtrly score', 'quarterly score')), 1) if quarterly else 1
    ov_entry, ov_leader, ov_cutoff, _ = entry_and_leader(overall, ov_col)
    q_entry, q_leader, _, _ = entry_and_leader(quarterly, q_col)
    metrics = ['<div class="sc-standings-summary">']
    ov_score = None
    if ov_entry:
        ov_score = score(ov_entry, ov_col)
        behind = ov_leader - ov_score if ov_leader is not None and ov_score is not None else None
        cutoff_gap = ov_cutoff - ov_score if ov_cutoff is not None and ov_score is not None else None
        metrics.append(f'<div class="sc-standing-metric"><b>Overall · Amanda Rose</b><span>{ov_score:g} points</span><span>GB: {behind:g}</span><span>{cutoff_gap:g} points to current 5th-place payout score</span></div>')
    if q_entry:
        q_score = score(q_entry, q_col)
        behind = q_leader - q_score if q_leader is not None and q_score is not None else None
        metrics.append(f'<div class="sc-standing-metric"><b>Quarterly · Amanda Rose</b><span>GB: {behind:g}</span><span>{q_score:g} points</span><span>Quarter ends after Week 8</span></div>')
    metrics.append('</div>')
    review = J(ROOT / 'data/supercontest/dashboard-ai-review-2026.json', {}) or {}
    comparable = [r for r in review.get('weeks', []) if r.get('status') == 'graded']
    ai_points = sum(float(r.get('ai_score', 0)) for r in comparable)
    amanda_points = sum(float(r.get('official_score', 0)) for r in comparable)
    metrics.append(f'<p class="sc-dashboard-score"><b>Dashboard AI total:</b> {ai_points:g}/{5 * len(comparable)} points.</p>')
    out = metrics
    for idx, (title, head, data) in enumerate(sections):
        ident = 'sc-overall-standings' if 'overall' in title.lower() else ('sc-quarterly-standings' if 'quarter' in title.lower() else f'sc-standings-{idx+1}')
        out += [f'<details class="rollup-box sc-standings-table" id="{ident}"><summary><span class="sum-text">{E(title)}</span></summary><div class="rollup-content"><div class="table-responsive"><table><thead><tr>' + ''.join(f'<th>{E(x)}</th>' for x in head) + '</tr></thead><tbody>']
        for row in data:
            is_ours = any(x.strip().lower() == 'amanda rose' for x in row)
            out.append('<tr class="sc-our-entry">' if is_ours else '<tr>')
            out.append(''.join(f'<td>{E(x)}</td>' for x in row) + '</tr>')
        out.append('</tbody></table></div></div></details>')
    out.insert(0, '<style>.sc-standings-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:12px 0}.sc-standing-metric{display:flex;flex-direction:column;gap:4px;padding:12px;border:1px solid #f2c14e;border-radius:10px;background:rgba(242,193,78,.10)}.sc-standing-metric b{color:#f2c14e}.sc-dashboard-score{padding:10px 12px;border-left:3px solid #f2c14e;background:rgba(242,193,78,.07)}.sc-standings-footnote{margin-top:30px;padding-top:10px;border-top:1px solid var(--border);font-size:.82em;color:var(--muted)}.sc-review-why{padding:10px 12px;border-left:3px solid var(--accent);background:var(--raised)}.sc-pick-postmortem{min-width:150px}.sc-pick-postmortem>summary{cursor:pointer;color:var(--accent);font-weight:750}.sc-pick-postmortem-body{min-width:min(680px,80vw);max-width:760px;padding:12px 14px;margin-top:8px;border:1px solid var(--border);border-radius:10px;background:var(--raised);white-space:normal}.sc-pick-postmortem-body h5{margin:10px 0 4px}.sc-pick-postmortem-body p{margin:6px 0}.sc-pick-postmortem-body ul{margin:4px 0 8px;padding-left:20px}.sc-our-entry{background:rgba(242,193,78,.18)!important;outline:1px solid rgba(242,193,78,.5);font-weight:700}.sc-our-entry td:first-child:before{content:"★ ";color:#f2c14e}</style>')
    return ''.join(out)


def standings_footnote_html(markdown_text):
    lines = markdown_text.strip().splitlines()
    note = lines[0].removeprefix('Source: ').strip() if lines and lines[0].startswith('Source: ') else ''
    caveat = '“Games behind” is expressed as a contest-points gap because this snapshot does not include win-loss records. The fifth-place score is a current cutoff reference; final ties follow contest rules.'
    return '<p class="sc-standings-footnote"><em>' + E(caveat) + '</em><br>' + E('Source: ' + note if note else '') + '</p>'


def dashboard_review_html():
    """Render weekly pick-by-pick reviews for Amanda's official five and Dashboard AI."""
    path = ROOT / 'data/supercontest/dashboard-ai-review-2026.json'
    review = J(path, {}) or {}
    weeks = review.get('weeks', [])
    graded = [r for r in weeks if r.get('status') == 'graded']
    if not weeks:
        return ''
    ai_score = sum(float(r.get('ai_score', 0)) for r in graded)
    official_score = sum(float(r.get('official_score', 0)) for r in graded)
    denom = 5 * len(graded)
    out = [
        '<details class="rollup-box" id="sc-card-record"><summary><span class="sum-text">📉 Platinum Rose card record — weekly review</span></summary><div class="rollup-content">',
        f'<p class="muted-note">Dashboard AI total: <b>{ai_score:g}/{denom}</b> points. Pick assessment: near-miss is 3 or fewer ATS points short; completely off is 10 or more points short.</p>'
    ]
    for row in weeks:
        week_num = int(row.get('week', 0) or 0)
        week = E(week_num)
        official_path = ROOT / f'data/supercontest/locked-card-week-{week_num}.json'
        official_picks = J(official_path, []) or []
        if official_picks:
            amanda_rows = sc_review.grade_picks(week_num, official_picks)
            amanda_score = sc_review.score_picks(amanda_rows)
        else:
            amanda_rows = sc_review.grade_picks(week_num, row.get('official_picks', []))
            amanda_score = sc_review.score_picks(amanda_rows)
        ai_rows = sc_review.grade_picks(week_num, row.get('ai_picks', []))
        ai_result = sc_review.score_picks(ai_rows)
        amanda_title = amanda_score['summary'] if official_picks or row.get('official_picks') else 'card not frozen'
        if amanda_score['unknown']:
            amanda_title += f" · {amanda_score['unknown']} ungraded"
        ai_title = ai_result['summary'] if row.get('ai_picks') else 'not comparable'
        review_title = f'📉 Week {week_num}: Amanda {amanda_title} · Dashboard AI {ai_title}'
        out.append(f'<details class="rollup-box sc-week-review" id="sc-review-week-{week_num}"><summary><span class="sum-text">{E(review_title)}</span></summary><div class="rollup-content">')

        def card_html(title, rows, score, no_picks=''):
            h = [f'<h4>{E(title)} — {E(score["summary"])}</h4>']
            if not rows:
                h.append(f'<p class="muted-note">{E(no_picks)}</p>')
            else:
                h.append('<div class="table-responsive"><table><thead><tr><th>Pick</th><th>Result</th><th>Final</th><th>Margin vs line</th><th>Pick assessment</th><th>Game post-mortem</th></tr></thead><tbody>')
                for pick in rows:
                    icon = '✅' if pick.get('result') == 'Win' else ('➖' if pick.get('result') == 'Push' else ('❌' if pick.get('result') == 'Loss' else '—'))
                    margin = f'{pick["margin"]:+g}' if pick.get('margin') is not None else '—'
                    assessment = sc_review.pick_postmortem(week_num, pick, row).get('assessment', '')
                    postmortem = sc_review.postmortem_html(week_num, pick, row)
                    h.append(f'<tr><td>{E(pick.get("pick", ""))}</td><td>{icon} {E(pick.get("result", "?"))}</td><td>{E(pick.get("final", "—"))}</td><td>{E(margin)}</td><td>{E(assessment)}</td><td>{postmortem}</td></tr>')
                h.append('</tbody></table></div>')
                if score['unknown']:
                    h.append(f'<p class="muted-note">{score["unknown"]} pick(s) have no saved completed result and are excluded from the score.</p>')
            return ''.join(h)

        out.append(card_html('Amanda — official contest five', amanda_rows, amanda_score,
                             'No frozen Amanda card is saved for this week.'))
        if row.get('ai_picks'):
            out.append(card_html('Dashboard AI frozen five', ai_rows, ai_result,
                                 'No Dashboard AI picks are available.'))
        elif row.get('status') == 'pending':
            out.append('<h4>Dashboard AI proposal</h4><p class="muted-note">Results are pending. The Dashboard AI proposal is tracked separately from Andy and Amanda’s official contest five.</p>')
        else:
            out.append(f'<h4>Dashboard AI — not comparable</h4><p class="muted-note">No complete frozen five-pick recommendation set was preserved, so this week is excluded from the side-by-side five-pick score.</p><p class="sc-review-why"><b>Broader AI review:</b> {E(row.get("dashboard_why") or row.get("note", ""))}</p>')
        out.append('</div></details>')
    out += [
        '<p class="muted-note">This is a sides-only contest benchmark, separate from placed wagers, totals and player props. Results and margins are recomputed from the saved contest lines and ESPN box scores; explanatory notes distinguish game outcomes from any flaws in the original reasoning.</p>',
        '</div></details>'
    ]
    return ''.join(out)


def fmt_date(s):
    try: return datetime.fromisoformat(str(s).replace('Z', '+00:00')).strftime('%b %-d')
    except Exception: return ''


def who_of(r):
    p = ', '.join(r.get('persons') or [])
    if r.get('kind') == 'podcast':
        return p or 'podcast host'
    return p or r.get('outlet') or 'expert'


def source_html(r, ctx):
    """Citation: outlet / show, date and a public link when one exists."""
    d = fmt_date(r.get('published'))
    if r.get('kind') == 'podcast':
        t = r.get('source_title') or r.get('outlet') or ''
        lk = ctx['pods'].get(t) or ctx['pods'].get(html.unescape(t)) or {}
        links = []
        if lk.get('youtube_url'): links.append(f'<a href="{E(lk["youtube_url"])}" target="_blank" rel="noopener">▶ YouTube episode</a> (auto-transcript on YouTube)')
        if lk.get('audio_url'): links.append(f'<a href="{E(html.unescape(lk["audio_url"]))}" target="_blank" rel="noopener">audio</a>')
        return f'podcast · <em>{E(html.unescape(t))}</em> · {d}' + (' · ' + ' · '.join(links) if links else ' · no public link found')
    if r.get('url'):
        host = urlparse(r['url']).netloc.replace('www.', '')
        title = r.get('source_title') or host
        return f'{E(r.get("outlet") or host)} · {d} · <a href="{E(r["url"])}" target="_blank" rel="noopener">{E(title[:70])} ↗</a>'
    return f'{E(r.get("outlet") or "")} · {d} · expert pick feed (no public link stored)'


def game_label(ctx, gid):
    g = ctx['games'].get(gid) or {}
    return f'{g.get("away", "")} @ {g.get("home", "")}', g.get('kickoff_pt', '')


def tl(ab):
    t_clean = str(ab or '').strip().upper()
    if t_clean in BEO_CODE: t_clean = BEO_CODE[t_clean]
    return f'<span class="tl tl-{t_clean.lower()}" title="{E(TEAMS.get(t_clean, t_clean))}"></span>' if t_clean in TEAMS else ''


# ---------------------------------------------------------------- Super Contest
def sc_rows(ctx):
    card = ctx['card']
    m = re.search(r'^## SuperContest[^\n]*\n(.*?)(?=^## |\Z)', card, re.M | re.S)
    five, alts, cur = [], [], None
    if not m: return five, alts, ''
    body = m.group(1)
    hdr = None
    for l in body.splitlines():
        if not l.startswith('|'): continue
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if hdr is None: hdr = [h.lower() for h in c]; cur = five; continue
        if re.match(r'^[\s:-]*$', ''.join(c)): continue
        if 'alternates' in c[0].lower(): cur = alts; continue
        cur.append(dict(zip(hdr, c)))
    note = next((l for l in body.splitlines() if l.lower().startswith('middle check')), '')
    if not five:
        for l in body.splitlines():
            bm = re.match(r'^[*-]\s+([A-Z]{2,3})\s+([+−-]?\d+(?:\.\d+)?)', l.strip())
            if bm:
                team, line = bm.group(1), bm.group(2)
                gid = ctx['team_game'].get(team, '')
                five.append({
                    'pick': team,
                    'contest line': line,
                    'book now (bkr)': line,
                    'projection': '',
                    'margin vs contest line': '',
                    'support': f"Accepted simulation blend score in {gid}"
                })
        m_alt = re.search(r'Alternates:\s*(.*?)(?=\n\n|\n## |\Z)', body, re.I)
        if m_alt:
            for team, line in re.findall(r'([A-Z]{2,3})\s+([+−-]?\d+(?:\.\d+)?)', m_alt.group(1)):
                gid = ctx['team_game'].get(team, '')
                alts.append({
                    'pick': team,
                    'contest line': line,
                    'book now (bkr)': line,
                    'projection': '',
                    'margin vs contest line': '',
                    'support': f"Accepted alternate in {gid}"
                })
    return five, alts, note


def sc_page(ctx):
    five, alts, note = sc_rows(ctx)
    r5 = block(ctx['narr'], 'SUPERCONTEST'); ralt = block(ctx['narr'], 'SUPERCONTEST ALTERNATES')
    rank = block(ctx['narr'], 'SUPERCONTEST RANKING')
    stars = {}
    for x in (ctx['M'].get('ranked_plays') or []):
        if x.get('type') == 'Side' and x.get('lean') and x['lean'] not in stars:
            stars[x['lean']] = (x.get('stars'), x.get('tier'))
    def aid(team, alt): return f'sc-{"alt" if alt else "pick"}-{slug(team)}'
    def tile(i, r, alt):
        team = r.get('pick', ''); gid = ctx['team_game'].get(team, '')
        g = ctx['games'].get(gid) or {}
        away = g.get('away', ''); home = g.get('home', '')
        ko = g.get('kickoff_pt', '')
        st, tr = stars.get(team, (None, None))
        conf = f'{st:g}★ · tier {tr}' if st is not None else 'no card lean'
        line_val = r.get('contest line', '')
        pick_str = f"{team} {line_val}".strip()
        room = r.get('margin vs contest line', '')
        room_html = f'<span class="sct-room">Room {E(room)}</span>' if room else ''

        mu_html = (f'<div class="sct-matchup">'
                   f'{tl(away)}<span class="mu-tm">{away}</span> '
                   f'<span class="mu-at">@</span> '
                   f'{tl(home)}<span class="mu-tm">{home}</span></div>') if (away and home) else ''

        return (f'<div class="sc-tile-wrap">'
                f'<a class="sc-tile{" sc-tile-alt" if alt else ""}" href="#{aid(team, alt)}">'
                f'<div class="sct-header">'
                f'  <span class="sct-rank">{"ALT " if alt else "#"}{i}</span>'
                f'  <span class="sct-conf">{E(conf)}</span>'
                f'</div>'
                f'<div class="sct-pick">{tl(team)}<span class="sct-pick-text">{E(team)} <b>{E(line_val)}</b></span></div>'
                f'{mu_html}'
                f'<div class="sct-meta">'
                f'  <span class="sct-game">{E(ko)} PT</span>'
                f'  {room_html}'
                f'</div>'
                f'<span class="sct-go">Breakdown ↓</span></a>'
                f'<button class="bm-btn sc-tile-btn" type="button" data-pick="{E(pick_str)}" data-ctx="SuperContest {"Alt " if alt else "#"}{i}" data-page="sc" title="Add {E(team)} to card"><span class="bm-icon">☆</span><span class="bm-text">+ Card</span></button>'
                f'</div>')
    def card_html(i, r, reason, alt=False):
        team = r.get('pick', ''); gid = ctx['team_game'].get(team, '')
        g = ctx['games'].get(gid) or {}
        away = g.get('away', ''); home = g.get('home', '')
        ko = g.get('kickoff_pt', '')
        chips = [('Contest line', r.get('contest line')), ('Book now (BKR)', r.get('book now (bkr)')),
                 ('Our projection', r.get('projection')), ('Room vs contest line', r.get('margin vs contest line'))]
        st, tr = stars.get(team, (None, None))
        if st is not None: chips.append(('Card confidence', f'{st:g}★ · tier {tr}'))
        ch = ''.join(f'<span class="sc-chip"><b>{E(k)}</b> {E(v)}</span>' for k, v in chips if v)
        pos = f'alternate {i}' if alt else f'#{i} of the five'
        how = rank.get(team)
        pick_str = f"{team} {r.get('contest line', '')}".strip()
        mu_str = f'{tl(away)} {away} @ {tl(home)} {home}' if away and home else f'{team} matchup'
        return (f'<article class="sc-pick bm-item{" sc-alt" if alt else ""}" id="{aid(team, alt)}">'
                f'<div class="sc-rank">{"ALT " if alt else ""}{i}</div><div class="sc-body">'
                f'<h3 class="sc-title"><span class="sc-title-pick">{tl(team)} <b>{E(team)} {E(r.get("contest line", ""))}</b></span>'
                f'<button class="bm-btn sc-pick-btn" type="button" data-pick="{E(pick_str)}" data-ctx="SuperContest {"Alt " if alt else "#"}{i}" data-page="sc" title="Add {E(team)} to card"><span class="bm-icon">☆</span><span class="bm-text">+ Card</span></button>'
                f' <span class="sc-game">{mu_str} · {E(ko)} PT · <a href="{gpage(gid)}">matchup →</a></span></h3>'
                f'<div class="sc-chips">{ch}</div>'
                + (f'<p class="sc-how"><b>How it got to {E(pos)}:</b> {E(how)}</p>' if how else '')
                + f'<p class="sc-why"><b>Why:</b> {E(reason or "")}</p>'
                f'<p class="sc-support"><b>Evidence:</b> {E(r.get("support", ""))} · <a href="#sc-exp-{slug(gid)}">experts on this game ↓</a> · <a href="#sc-strip">back to the top ↑</a></p></div></article>')
    h = ['<div class="sc-shell" id="sc-page">',
         '<h2 class="page-h">🏆 Super Contest — Dashboard AI proposal</h2>',
         '<p class="dashboard-intro">This is the Dashboard AI’s proposed five-slot card against the contest\'s fixed spread lines: '
         '<b>sides only</b> — no totals, moneylines, props or teasers on this page. The proposal ranks sides by how much room '
         'our projection leaves against the contest line, then by the evidence. These picks are tracked as the Dashboard AI record, not as Andy and Amanda\'s official card; they will declare their official five separately. Tap a pick for its breakdown; tap + Card to build your weekend card.</p>',
         '<div class="sc-strip" id="sc-strip">',
         '  <div class="sc-strip-group sc-primary-group">',
         f'    <div class="sc-strip-label">⭐ Dashboard AI proposal — {len(five)} proposed sides</div>',
         '    <div class="sc-tiles">']
    h += [tile(i + 1, r, False) for i, r in enumerate(five)]
    if len(five) < 5:
        h.append('<div class="sc-tile sc-tile-pending" role="status" style="border-top-color:#64748b;border-style:dashed;opacity:.82"><div class="sct-header"><span class="sct-rank">#5</span><span class="sct-conf">No AI pick</span></div><div class="sct-pick"><span class="sct-pick-text"><b>No Dashboard AI recommendation</b></span></div><div class="sct-meta"><span class="sct-game">Official five declared separately by Andy and Amanda</span></div></div>')
    h += ['    </div>',
          '  </div>',
          '  <div class="sc-strip-group sc-alt-group">',
          '    <div class="sc-strip-label">🔁 Dashboard AI alternates — Next five in line</div>',
          '    <div class="sc-tiles">']
    h += [tile(i + 1, r, True) for i, r in enumerate(alts)]
    h += ['    </div>',
          '  </div>',
          '</div>']
    if note: h.append(f'<p class="muted-note">{E(note)}</p>')
    if ctx.get('standings'): h.append(standings_html(ctx['standings']))
    h.append(dashboard_review_html())
    h += ['<h3 id="sc-top5">Dashboard AI proposal: breakdowns</h3><div class="sc-list">']
    h += [card_html(i + 1, r, r5.get(r.get('pick', ''))) for i, r in enumerate(five)]
    h += ['</div>', '<h3 id="sc-alternates">Dashboard AI alternates: breakdowns</h3>',
          '<p class="muted-note">The next-best sides beyond the proposal, best first, with what would make each worth swapping in.</p>',
          '<div class="sc-list">']
    h += [card_html(i + 1, r, ralt.get(r.get('pick', '')), alt=True) for i, r in enumerate(alts)]
    h += ['</div>']
    # ---- expert sides, grouped by game ----
    picks = {r.get('pick') for r in five}; altp = {r.get('pick') for r in alts}
    by = defaultdict(list)
    for r in ctx['vrows']:
        if r.get('market') in ('spread', 'contest') and r.get('side'):
            by[r['game']].append(r)
    h += ['<h3 id="sc-experts">What the experts picked against the spread</h3>',
          '<p class="muted-note">Every verified side (spread and contest picks) from this week\'s expert feed, articles and podcasts, '
          'grouped by game. Contest picks are marked 🏆. Podcast picks link to the YouTube episode, where YouTube shows the transcript '
          '(⋯ → Show transcript); article picks link to the article. Rows marked "expert pick feed" came from the pick registry, '
          'which stores no public link.</p>',
          '<div class="rollup-controls"><button class="btn-toggle" onclick="toggleRollups(\'sc-exp\', true)">Open all games</button>'
          '<button class="btn-toggle" onclick="toggleRollups(\'sc-exp\', false)">Close all games</button></div>']
    panel_votes = defaultdict(set)
    for gid, rows in by.items():
        expert_sides = defaultdict(set)
        for r in rows: expert_sides[who_of(r)].add(r['side'])
        for who, sides in expert_sides.items():
            if len(sides) == 1:
                side = next(iter(sides)); panel_votes[(gid, side)].add(who)
    panel_rows = sorted(panel_votes, key=lambda k: (-len(panel_votes[k]), k[1], k[0]))
    summary = ['<div class="sc-expert-summary"><h4>Pick Summary — most-declared sides</h4>',
               '<p class="muted-note">Each named expert counts once per game on one side; experts split between both teams are omitted. BKR spread is the current reference quote.</p>',
               '<div class="table-responsive"><table><thead><tr><th>Rank</th><th>Side</th><th>Experts</th><th>Current BKR spread</th><th>Game</th><th>Names</th></tr></thead><tbody>']
    for i, (gid, side) in enumerate(panel_rows, 1):
        g = ctx['games'].get(gid) or {}; quote = (((g.get('lines') or {}).get('spread') or {}).get(side) or {})
        current = f"{side} {quote['line']:+g} ({quote['price']:+d})" if quote.get('line') is not None and quote.get('price') is not None else (f"{side} {quote['line']:+g}" if quote.get('line') is not None else '—')
        names = ', '.join(sorted(panel_votes[(gid, side)]))
        summary.append(f'<tr><td>{i}</td><td><b>{tl(side)}{E(side)}</b></td><td>{len(panel_votes[(gid, side)])}</td><td>{E(current)}</td><td>{E(g.get("away", ""))} @ {E(g.get("home", ""))}</td><td>{E(names)}</td></tr>')
    if not panel_rows: summary.append('<tr><td colspan="6">No verified side picks this week.</td></tr>')
    summary.append('</tbody></table></div></div>')
    expert_intro_idx = next(i for i, item in enumerate(h) if item.startswith('<p class="muted-note">Every verified side'))
    h.insert(expert_intro_idx + 1, ''.join(summary))
    for gid in ctx['order']:
        rows = by.get(gid, [])
        if not rows: continue
        g = ctx['games'][gid]
        cnt = defaultdict(set)
        for r in rows: cnt[r['side']].add(who_of(r))
        tally = ' · '.join(f'{t} {len(cnt.get(t, ()))}' for t in (g['away'], g['home']))
        ours = [t for t in (g['away'], g['home']) if t in picks] or [t for t in (g['away'], g['home']) if t in altp]
        tag = (' · our pick: ' + ours[0]) if ours and ours[0] in picks else (' · alternate: ' + ours[0]) if ours else ''
        rows.sort(key=lambda r: (r['side'] != g['away'], r.get('market') != 'contest', who_of(r)))
        h += [f'<details class="rollup-box sc-exp" id="sc-exp-{slug(gid)}"><summary><span class="sum-text">'
              f'{E(g["away"])} @ {E(g["home"])} — {E(g.get("kickoff_pt", ""))} PT — experts {E(tally)}{E(tag)}</span></summary>'
              '<div class="rollup-content"><div class="table-responsive"><table><thead><tr>'
              '<th>Side</th><th>Expert</th><th>Line</th><th>Reasoning</th><th>Source</th></tr></thead><tbody>']
        for r in rows:
            line = r.get('line')
            lns = ln(float(line)) if isinstance(line, (int, float)) else ''
            q = re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')
            h.append(f'<tr><td><b>{E(r["side"])}</b>{" 🏆" if r.get("market") == "contest" else ""}</td>'
                     f'<td>{E(who_of(r))}</td><td>{E(lns)}</td><td>{E(q[:260])}</td><td>{source_html(r, ctx)}</td></tr>')
        h += ['</tbody></table></div>', f'<p><a href="{gpage(gid)}">Full matchup →</a></p></div></details>']
    if ctx.get('standings'): h.append(standings_footnote_html(ctx['standings']))
    h.append('</div>')
    return ''.join(h)


# ---------------------------------------------------------------- props
MKEYS = [
    (r'field[ _]?goal', 'fg_made'),
    (r'kicking', 'kick_pts'),
    (r'tackle|\bsacks?\b|defensive', 'defense'),
    (r'longest[ _]rush', 'long_rush'),
    (r'longest[ _](?:reception|rec)', 'long_rec'),
    (r'longest[ _](?:completion|pass)', 'long_pass'),
    (r'total[ _]yards|rush\s*\+\s*rec|scrimmage', 'rr_yds'),
    (r'team[ _]total', 'team_total'),
    (r'first[ _]?(?:td|touchdown)', 'first_td'),
    (r'pass(?:ing)?[ _]?(?:td|touchdown)', 'pass_td'),
    (r'2\+ ?td|2_touchdowns|two touchdowns', 'td2'),
    (r'anytime|\batd\b', 'atd'),
    (r'interception|\bints?\b|pass_int', 'pass_int'),
    (r'pass(?:ing)?[ _]?att|pass attempts', 'pass_att'),
    (r'completion|pass_cmp', 'pass_cmp'),
    (r'pass(?:ing)?[ _]?yard', 'pass_yds'),
    (r'rush(?:ing)?[ _]?att|carries', 'carries'),
    (r'rush(?:ing)?[ _]?yard', 'rush_yds'),
    (r'reception', 'rec'),
    (r'rec(?:eiving)?[ _]?yard', 'rec_yds'),
]
MNAME = {'first_td': 'first TD', 'pass_td': 'pass TDs', 'td2': '2+ TDs', 'atd': 'anytime TD', 'pass_int': 'interceptions',
         'pass_att': 'pass attempts', 'pass_cmp': 'completions', 'pass_yds': 'pass yds', 'carries': 'carries',
         'rush_yds': 'rush yds', 'rec': 'receptions', 'rec_yds': 'rec yds', 'other': '',
         'fg_made': 'field goals made', 'kick_pts': 'kicking points', 'defense': 'tackles / sacks', 'long_rush': 'longest rush',
         'long_rec': 'longest reception', 'long_pass': 'longest completion', 'rr_yds': 'rush + rec yds', 'team_total': 'team total points'}
MKIND = {'first_td': 'TD scorer', 'td2': 'TD scorer', 'atd': 'TD scorer', 'pass_td': 'Passing', 'pass_int': 'Passing',
         'pass_att': 'Passing', 'pass_cmp': 'Passing', 'pass_yds': 'Passing', 'carries': 'Rushing', 'rush_yds': 'Rushing',
         'rec': 'Receiving', 'rec_yds': 'Receiving', 'other': 'Other',
         'fg_made': 'Kicking', 'kick_pts': 'Kicking', 'defense': 'Defense', 'long_rush': 'Rushing', 'long_rec': 'Receiving',
         'long_pass': 'Passing', 'rr_yds': 'Rushing', 'team_total': 'Game props'}
YES = ('atd', 'first_td', 'td2')


def nkey(name):
    t = re.sub(r"[.'’]", '', str(name).lower()).replace('-', ' ').split()
    t = [x for x in t if x not in ('jr', 'sr', 'ii', 'iii', 'iv')]
    if not t: return ('', '')
    return (t[-1], t[0][0] if len(t) > 1 else '')


def parse_leg(text, player=None):
    """'Jacoby Brissett 2+ pass TD' / 'X season_receiving_yards OVER 71.5' / 'X 40+ receiving yards' -> leg dict."""
    t = re.sub(r'^[^:]{3,40}:\s*', '', str(text))           # 'Name: Name - passing_yards OVER 254.5'
    low = t.lower()
    mk = next((k for p, k in MKEYS if re.search(p, low)), None) or 'other'
    side, line = ('yes', None) if mk in YES else (None, None)
    if mk not in YES:
        m = re.search(r'(\d+(?:\.\d+)?)\+', low)
        if m: side, line = 'over', float(m.group(1)) - 0.5
        m = re.search(r'\b(over|under|o|u)\s?(\d+(?:\.\d+)?)', low)
        if m:
            side = 'over' if m.group(1).startswith('o') else 'under'; line = float(m.group(2))
            if line == int(line) and side == 'over': line -= 0.5         # ladder rung 'OVER 300' = 300+
        if mk == 'pass_td' and line is None and re.search(r'2\+', low): side, line = 'over', 1.5
        if side is None:
            side = 'over' if 'over' in low else 'under' if 'under' in low else None
    if not player:
        player = re.split(r'\s+(?:atd\b|\d|o\d|u\d|over\b|under\b|anytime|first|season_|player_|rushing|receiving|passing|pass\b|rush\b|receptions|longest|total|2\+|2_|anytime_|first_|over_under|field|kicking|tackles|sacks)', t, maxsplit=1, flags=re.I)[0]
        player = player.strip(' -:')
    return dict(player=player.strip(), mkey=mk, side=side, line=line)


def price_books(ctx):
    """Index BKR / BEO / DK player prices: (gid, last, mkey, side) -> {book: [(line, odds, first_initial)]}."""
    idx = defaultdict(lambda: defaultdict(list))
    full2abbr = {}
    for a, n in TEAMS.items(): full2abbr[n.lower()] = a
    def gid_from_names(a, h):
        return next((g for g, x in ctx['games'].items() if x['away'] == a and x['home'] == h), None)
    # BKR (latest capture for the date)
    bk = J(ROOT / f'data/generated/props/bookmaker-live-{ctx["date"]}-week{ctx["week"]}.json', {}) or {}
    BMAP = {'rec_yds': 'rec_yds', 'rec': 'rec', 'rush_yds': 'rush_yds', 'carries': 'carries', 'pass_yds': 'pass_yds',
            'pass_cmp': 'pass_cmp', 'pass_td': 'pass_td', 'atd_1_plus': 'atd', 'first_td': 'first_td', 'td_2_plus': 'td2',
            'fg_made': 'fg_made', 'field_goal_made': 'fg_made', 'kick_pts': 'kick_pts', 'kicking_points': 'kick_pts',
            'defense': 'defense', 'tackles_assists': 'defense', 'tackles+assists': 'defense', 'sacks': 'defense', 'def_int': 'defense'}
    for r in bk.get('rows', []):
        mk = BMAP.get(r.get('market'))
        if not mk or not r.get('player') or r.get('odds') is None or r.get('available') is False: continue
        ev = r.get('event', '').split(' @ ')
        if len(ev) != 2: continue
        a = full2abbr.get(ev[0].split()[-1].lower()); hh = full2abbr.get(ev[1].split()[-1].lower())
        gid = gid_from_names(a, hh)
        if not gid: continue
        side = 'yes' if mk in YES else str(r.get('side', '')).lower()
        l_, f_ = nkey(r['player'])
        idx[(gid, l_, mk, side)]['BKR'].append((r.get('line') if mk not in YES else None, int(r['odds']), f_))
    # BEO ladders: line N = N+ (over N-0.5); atd line 2 = 2+ TDs
    for r in J(ROOT / f'data/generated/props/beo-w{ctx["W"]}.json', []) or []:
        a, hh = [BEO_CODE.get(x, x) for x in str(r.get('game', '')).split('_')[:2]] + [None] * (2 - len(str(r.get('game', '')).split('_')[:2]))
        gid = gid_from_names(a, hh)
        if not gid or r.get('odds') is None: continue
        m = r.get('market'); lv = r.get('line')
        if m == 'atd': mk = 'atd' if (lv or 1) == 1 else 'td2' if lv == 2 else None
        elif m == 'first_td': mk = 'first_td'
        else: mk = m if m in MNAME else None
        if not mk: continue
        l_, f_ = nkey(r.get('player'))
        line = None if mk in YES else float(lv) - 0.5
        idx[(gid, l_, mk, 'yes' if mk in YES else 'over')]['BEO'].append((line, int(r['odds']), f_))
    # DK Predictions (contract prices, gross of fees)
    DMAP = {'atd_1_plus': 'atd', 'first_td': 'first_td', 'td_2_plus': 'td2', 'two_plus_td': 'td2', 'rec_yds': 'rec_yds', 'rush_yds': 'rush_yds', 'pass_yds': 'pass_yds'}
    for f in sorted(glob.glob(str(ROOT / 'data/generated/props/*predictions-*-*-at-*.json'))):
        mm = re.search(r'predictions-.*-(\d{4}-\d{2}-\d{2})-([a-z0-9]+)-at-([a-z0-9]+)\.json$', f)
        if not mm or mm.group(1) < ctx['date'][:8] + '01': continue
        gid = gid_from_names(NICK.get(mm.group(2)), NICK.get(mm.group(3)))
        if not gid: continue
        d = J(f, {}) or {}
        for r in d.get('rows', []):
            mk = DMAP.get(r.get('market'))
            odd_val = r.get('american_gross') if r.get('american_gross') is not None else r.get('odds')
            if not mk or odd_val is None: continue
            pl = r.get('player') or r.get('side') or ''
            pl = re.sub(r'\s+\d+\+$', '', pl)
            l_, f_ = nkey(pl)
            line = None if mk in YES else (float(r['line']) - 0.5 if r.get('line') is not None else None)
            idx[(gid, l_, mk, 'yes' if mk in YES else 'over')]['DK'].append((line, int(odd_val), f_))
    return idx


def best_prices(idx, gid, leg):
    l_, f_ = nkey(leg['player'])
    got = idx.get((gid, l_, leg['mkey'], leg['side'] or 'over')) or {}
    out = {}
    for book, opts in got.items():
        opts = [o for o in opts if not f_ or not o[2] or o[2] == f_]
        if not opts: continue
        if leg['mkey'] in YES or leg['line'] is None:
            exact = opts
        else:
            exact = [o for o in opts if o[0] is not None and abs(o[0] - leg['line']) < 0.01]
        if exact:
            o = max(exact, key=lambda z: dec(z[1])); out[book] = dict(line=o[0], odds=o[1], exact=True)
        elif leg['line'] is not None:
            near = [o for o in opts if o[0] is not None]
            if near:
                o = min(near, key=lambda z: (abs(z[0] - leg['line']), -dec(z[1]))); out[book] = dict(line=o[0], odds=o[1], exact=False)
    return out


def injury_status(ctx, gid, player):
    l_, f_ = nkey(player)
    for x in (ctx['games'].get(gid) or {}).get('injuries_skill') or []:
        l2, f2 = nkey(x.get('player'))
        if l2 == l_ and (not f_ or not f2 or f_ == f2):
            return str(x.get('status', '')).lower()
    return ''


def card_prop_legs(ctx):
    out = []
    for m in re.finditer(r'^### (.+?) — (\w+) — \*\*\$[\d.]+\*\*.*?\n(.*?)(?=^### |^## |\Z)', ctx['card'], re.M | re.S):
        name, body = m.group(1).strip(), m.group(3)
        hdr = None
        for l in body.splitlines():
            if not l.startswith('|'): continue
            c = [x.strip() for x in l.strip().strip('|').split('|')]
            if hdr is None: hdr = [h.lower() for h in c]; continue
            if re.match(r'^[\s:-]*$', ''.join(c)): continue
            d = dict(zip(hdr, c))
            leg = parse_leg(d.get('market & line', ''))
            if leg and leg['mkey'] != 'other' and d.get('game') in ctx['games']:
                out.append(dict(gid=d['game'], leg=leg, ticket=name, price=d.get('price'), book=d.get('book'), why=d.get('why', ''), tier=d.get('tier', '')))
    return out


def digest_prop_legs(ctx):
    out = []
    for l in ctx['digest'].splitlines():
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if len(c) < 5: continue
        gid = c[0].split(' ')[0]
        if gid not in ctx['games']: continue
        leg = parse_leg(c[1])
        if not leg or leg['mkey'] == 'other': continue
        if not re.search(r'TD|yds|rec|rush|pass|interception', c[1], re.I): continue
        out.append(dict(gid=gid, leg=leg, lean=c[2], why=c[3], tier=c[4]))
    return out


def props_lab(ctx):
    idx = price_books(ctx)
    clusters = {}
    def add(gid, leg, src):
        if not leg or not leg['player']: return
        l_, f_ = nkey(leg['player'])
        k = (gid, l_, leg['mkey'], leg['side'])
        c = clusters.setdefault(k, dict(gid=gid, player=leg['player'], mkey=leg['mkey'], side=leg['side'], lines=[], src=[], card=None, lean=None, raw=leg.get('raw')))
        if len(leg['player']) > len(c['player']): c['player'] = leg['player']
        if leg['line'] is not None: c['lines'].append(leg['line'])
        src.setdefault('line', leg['line'])
        row = src.get('row') or {}
        who_key = re.sub(r'\s+', ' ', str(src.get('who') or '').strip().lower())
        if src.get('kind') in ('card', 'lean'):
            src_key = (src.get('kind'), who_key, str(src.get('what') or ''), str(src.get('line')))
        elif leg['mkey'] in YES:
            src_key = ('opinion', who_key)
        else:
            # The same speaker's same player/market/side is one opinion, even if it
            # arrived through article, transcript, or review pipelines more than once.
            src_key = ('opinion', who_key, str(src.get('line')), str(row.get('selection') or '').strip().lower())
        seen_keys = c.setdefault('_source_keys', set())
        if src_key not in seen_keys:
            seen_keys.add(src_key)
            c['src'].append(src)
        return c
    for x in card_prop_legs(ctx):
        c = add(x['gid'], x['leg'], dict(kind='card', who='Platinum Rose card', what=x['ticket'], price=x['price'], book=x['book'], tier=x.get('tier'), why=x['why']))
        if c: c['card'] = x['ticket']; c['card_line'] = x['leg']['line']
    for x in digest_prop_legs(ctx):
        skip = 'skip' in x['tier'].lower()
        c = add(x['gid'], x['leg'], dict(kind='lean', who='Platinum Rose synthesis', what=('skip' if skip else 'tier ' + x['tier']), tier=x['tier'], why=x['why']))
        if c: c['lean'] = 'skip' if skip else x['tier']
    for r in ctx['vrows']:
        if r.get('market') != 'prop': continue
        pl = (r.get('players') or [None])[0]
        leg = parse_leg(r.get('selection') or '', None)
        if leg and pl: leg['player'] = pl.title() if pl.islower() else pl
        if leg and leg['line'] is None and isinstance(r.get('line'), (int, float)) and leg['mkey'] not in YES:
            leg['line'] = float(r['line'])
        if leg and leg['mkey'] == 'other':
            leg['raw'] = re.sub(r'^[^:]{3,40}:\s*', '', r.get('selection') or '').replace('_', ' ')
        add(r['game'], leg, dict(kind=r.get('kind'), who=who_of(r), row=r, price=r.get('price'), why=re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')))
    # game props the intel calls out (team totals inside a total pick, e.g. 'Lions team total over')
    for r in ctx['vrows']:
        txt = f"{r.get('selection') or ''} {r.get('quote') or ''}"
        if r.get('market') != 'total' or not re.search(r'team total', txt, re.I): continue
        m_ = re.search(r'(\w+)\s+team total', txt, re.I)
        tm = NICK.get((m_.group(1) if m_ else '').lower())
        if not tm: continue
        side = 'over' if re.search(r'\bover\b', txt, re.I) else 'under'
        leg = dict(player=TEAMS[tm], mkey='team_total', side=side, line=float(r['line']) if isinstance(r.get('line'), (int, float)) else None, team=tm)
        add(r['game'], leg, dict(kind=r.get('kind'), who=who_of(r), row=r, price=r.get('price'), why=re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')))
    # player -> team (BetOnline boards carry the team), for the game-context line on every leg
    teamof = {}
    for r in J(ROOT / f'data/generated/props/beo-w{ctx["W"]}.json', []) or []:
        a_, h_ = [BEO_CODE.get(x, x) for x in (str(r.get('game', '')).split('_') + ['', ''])[:2]]
        gid_ = next((g for g, x in ctx['games'].items() if x['away'] == a_ and x['home'] == h_), None)
        tm = NICK.get(str(r.get('team', '')).split()[-1].lower()) if r.get('team') else None
        if gid_ and tm: teamof.setdefault((gid_, nkey(r.get('player'))[0]), tm)
    for r in ctx['vrows']:
        if r.get('team_tag') and r.get('players'):
            teamof.setdefault((r['game'], nkey(r['players'][0])[0]), r['team_tag'])
    def context(c):
        g = ctx['games'].get(c['gid']) or {}
        tm = c.get('team') or (TEAMS and next((t for t, n in TEAMS.items() if n == c['player']), None)) or teamof.get((c['gid'], nkey(c['player'])[0]))
        pj = g.get('projection') or {}
        if not tm or tm not in pj: return ''
        opp = g['home'] if tm == g['away'] else g['away']
        d = pj[tm] - pj.get(opp, 0)
        res = f'projected to win by {d}' if d > 0 else (f'projected to lose by {-d}' if d < 0 else 'projected even')
        return f'{tm} {res} ({tm} {pj[tm]} – {opp} {pj.get(opp, "?")}, our projection)'
    # score, line, prices
    for k, c in clusters.items():
        people = {s['who'] for s in c['src'] if s['kind'] not in ('card', 'lean')}
        score = (3 if c['card'] else 0) + (0 if c['lean'] in (None, 'skip') else 2 if str(c['lean']).startswith('1') else 1.5) + len(people)
        if c.get('card_line') is not None: line = c['card_line']
        elif c['lines']:
            cnt = defaultdict(int)
            for v in c['lines']: cnt[v] += 1
            line = sorted(cnt, key=lambda v: (-cnt[v], v if c['side'] == 'over' else -v))[0]
        else: line = None
        leg = dict(player=c['player'], mkey=c['mkey'], side=c['side'], line=line)
        c.update(score=score, line=line, people=sorted(people),
                prices=best_prices(idx, c['gid'], leg) if c['mkey'] in MNAME and c['mkey'] not in ('other', 'long_rush', 'long_rec', 'long_pass', 'rr_yds', 'team_total') else {},
                 ctx_line=context(c), status=injury_status(ctx, c['gid'], c['player']))
        if c['status'] in ('out', 'doubtful', 'injured reserve', 'ir'): c['score'] -= 10
        if c['lean'] == 'skip' and not c['card']: c['score'] -= 1

    CATEGORIES = [
        ('tds', 'Touchdowns (TDs)', '🏈', {'atd', 'first_td', 'td2', 'td3'}),
        ('passing', 'Passing Props', '🎯', {'pass_yds', 'pass_td', 'pass_cmp', 'pass_att', 'pass_int', 'long_pass'}),
        ('rushing', 'Rushing Props', '🏃', {'rush_yds', 'carries', 'long_rush', 'rr_yds'}),
        ('receiving', 'Receiving Props', '👐', {'rec_yds', 'rec', 'targets', 'long_rec'}),
        ('defense', 'Defense Props', '🛡️', {'defense', 'sacks', 'def_int'}),
        ('kicking', 'Kicking Props', '🦵', {'fg_made', 'kick_pts'}),
        ('game', 'Game & Team Props', '🎮', {'team_total', 'other'})
    ]

    def cat_for_mkey(mk):
        for cid, title, icon, keys in CATEGORIES:
            if mk in keys: return cid
        return 'game'

    items_by_cat = defaultdict(list)
    td_players = defaultdict(lambda: dict(src=[], lines=[], card=None, lean=None, sub_clusters=[]))
    for k, c in clusters.items():
        cat = cat_for_mkey(c['mkey'])
        if cat == 'tds':
            key = (c['gid'], nkey(c['player'])[0])
            tdp = td_players[key]
            tdp['gid'] = c['gid']
            tdp['player'] = c['player']
            tdp['mkey'] = 'atd'
            tdp['side'] = 'yes'
            tdp['sub_clusters'].append(c)
            tdp['src'].extend(c['src'])
            if c['card']: tdp['card'] = c['card']
            if c['lean'] and (not tdp['lean'] or str(c['lean']).startswith('1')): tdp['lean'] = c['lean']
            if not tdp.get('status'): tdp['status'] = c.get('status', '')
            if not tdp.get('ctx_line'): tdp['ctx_line'] = c.get('ctx_line', '')
            tdp['score'] = max(tdp.get('score', 0), c.get('score', 0))
        else:
            items_by_cat[cat].append(c)

    for key, tdp in td_players.items():
        unique_src = {}
        for s in tdp['src']:
            row = s.get('row') or {}
            who = re.sub(r'\s+', ' ', str(s.get('who') or '').strip().lower())
            if s.get('kind') in ('card', 'lean'):
                ksrc = (s.get('kind'), who, str(s.get('what') or ''), str(s.get('line')))
            elif s.get('row') and str(s['row'].get('selection') or '').lower().find('anytime') >= 0:
                ksrc = ('opinion', who)
            else:
                ksrc = ('opinion', who, str(s.get('line')), str(row.get('selection') or '').strip().lower())
            unique_src.setdefault(ksrc, s)
        tdp['src'] = list(unique_src.values())
        tdp['people'] = sorted({s['who'] for s in tdp['src'] if s['kind'] not in ('card', 'lean')})
        pr_comb = {}
        for sc in tdp['sub_clusters']:
            for b, v in (sc.get('prices') or {}).items():
                if b not in pr_comb or dec(v['odds']) > dec(pr_comb[b]['odds']):
                    pr_comb[b] = v
        tdp['prices'] = pr_comb
        items_by_cat['tds'].append(tdp)

    def get_ladder_rungs(c):
        gid, player = c['gid'], c['player']
        l_, f_ = nkey(player)
        rungs = []
        if 'sub_clusters' in c:
            # TD category
            base_mk = 'atd'
            for sc in c['sub_clusters']:
                if sc.get('card') or (sc.get('lean') and sc['lean'] != 'skip'):
                    base_mk = sc['mkey']
                    break
            td_order = [('atd', 'Anytime TD'), ('td2', '2+ TDs'), ('td3', '3+ TDs'), ('first_td', 'First TD')]
            for mk, lbl in td_order:
                got = idx.get((gid, l_, mk, 'yes')) or {}
                best = None
                for b, opts in got.items():
                    for line, odds, fi in opts:
                        if f_ and fi and fi != f_: continue
                        if best is None or dec(odds) > dec(best['odds']):
                            best = dict(label=lbl, line=None, odds=odds, book=b, mk=mk, side='yes')
                if best:
                    is_base = (mk == base_mk)
                    rungs.append((best, is_base))
        else:
            mkey, side = c['mkey'], c['side']
            sd = side or 'over'
            got = idx.get((gid, l_, mkey, sd)) or {}
            by_line = {}
            for b, opts in got.items():
                for line, odds, fi in opts:
                    if f_ and fi and fi != f_: continue
                    if line is None: continue
                    k = round(float(line), 1)
                    if k not in by_line or dec(odds) > dec(by_line[k]['odds']):
                        by_line[k] = dict(line=k, odds=odds, book=b, mk=mkey, side=sd)
            sorted_keys = sorted(by_line.keys(), key=lambda x: (x if sd == 'over' else -x))
            for k in sorted_keys:
                r = by_line[k]
                lbl = f"{k:g}+" if sd == 'over' else f"u{k:g}"
                r['label'] = lbl
                is_base = (c.get('card_line') is not None and abs(c['card_line'] - k) < 0.2) or (c.get('line') is not None and abs(c['line'] - k) < 0.2)
                rungs.append((r, is_base))

        if not rungs:
            pr = c.get('prices') or {}
            exact = {b: v for b, v in pr.items() if v.get('exact')}
            best = max(exact.items(), key=lambda kv: dec(kv[1]['odds'])) if exact else None
            if best:
                lbl = f"{c['line']:g}+" if c.get('line') is not None and c.get('side') == 'over' else (f"u{c['line']:g}" if c.get('line') is not None else MNAME.get(c.get('mkey'), c.get('mkey')))
                rungs.append((dict(label=lbl, line=c.get('line'), odds=best[1]['odds'], book=best[0], mk=c.get('mkey'), side=c.get('side')), True))
            elif c.get('card_line') is not None or c.get('line') is not None:
                lv = c.get('card_line') if c.get('card_line') is not None else c.get('line')
                lbl = f"{lv:g}+" if c.get('side') == 'over' else f"u{lv:g}"
                rungs.append((dict(label=lbl, line=lv, odds=None, book='', mk=c.get('mkey'), side=c.get('side')), True))

        return rungs

    total_props = sum(len(items_by_cat[cid]) for cid, _, _, _ in CATEGORIES)

    # Top Filters Bar
    h = ['<div class="props-lab" id="props-lab-legs">',
         '<h3 id="props-recommended">🎯 Props Pool & Ladder Board — Grouped by Category</h3>',
         f'<p class="dashboard-intro">{total_props} actionable prop plays grouped across {len(CATEGORIES)} market categories, with full interactive '
         'horizontal ladder rows for yardage, carries, receptions, and touchdowns. Tap any ladder rung to select your amount and place '
         'it directly on your weekend card. Empty categories stay visible and say when no priced market was captured; a game script that expects field goals is not itself a kicker line. Touchdown stars summarize source tier or distinct source support, not scoring probability.</p>',
         '<div class="legs-filter no-bm" id="legs-filter">',
         '<div class="lf-row"><span class="lf-label">Category</span>',
         f'<button type="button" class="btn-toggle lf-kind btn-primary" data-kind="All">All <small>{total_props}</small></button>']

    for cid, title, icon, _ in CATEGORIES:
        cnt = len(items_by_cat[cid])
        h.append(f'<button type="button" class="btn-toggle lf-kind" data-kind="{E(title)}"{" disabled" if not cnt else ""}>{icon} {E(title)} <small>{cnt}</small></button>')

    h += ['</div>',
          '<div class="lf-row">',
          '<label class="lf-check"><input type="checkbox" id="lf-card"> Card legs only</label>',
          '<label class="lf-check"><input type="checkbox" id="lf-multi"> 2+ supporters</label>',
          '<label class="lf-check"><input type="checkbox" id="lf-priced" checked> Hide out / doubtful</label>',
          '<input type="search" id="lf-q" placeholder="Search player or team..." aria-label="Search player or team">',
          '<span class="lf-count" id="lf-count"></span>',
          '</div>',
          '<div class="lf-row">',
          '<button type="button" class="btn-toggle" id="lf-open">Open all categories</button>',
          '<button type="button" class="btn-toggle" id="lf-close">Close all categories</button>',
          '<button type="button" class="btn-toggle" id="lf-games-open">Open all matchups</button>',
          '<button type="button" class="btn-toggle" id="lf-games-close">Collapse all matchups</button>',
          '<button type="button" class="btn-toggle" id="lf-expand">Expand all legs</button>',
          '<button type="button" class="btn-toggle" id="lf-collapse">Collapse all legs</button>',
          '</div></div>']

    # Jump to Game filter bar
    games_with_props = [gid for gid in ctx['order'] if any(c['gid'] == gid for c in clusters.values())]
    game_pills = ['<a href="#" class="lf-game-link active" data-game="All">All Games</a>']
    for gid in games_with_props:
        g = ctx['games'].get(gid) or {}
        n_g = sum(1 for c in clusters.values() if c['gid'] == gid)
        game_pills.append(f'<a href="#" class="lf-game-link" data-game="{E(gid)}">{E(g.get("away",""))}@{E(g.get("home",""))} ({n_g})</a>')
    h.append(f'<div class="jump-to-game-bar" style="margin: 10px 0 18px 0; font-size: 12.5px; line-height: 1.8;"><strong>Filter by game:</strong> {" · ".join(game_pills)}</div>')

    # Categories Content
    for cid, title, icon, _ in CATEGORIES:
        items = items_by_cat[cid]
        if not items:
            empty_note = ('No defender tackles, sacks, or interception lines were present in the captured prop sources.' if cid == 'defense'
                          else 'No kicker field-goal or kicking-points lines were present in the captured prop sources.' if cid == 'kicking'
                          else 'No actionable props were present in the captured sources.')
            h.append(f'<details class="rollup-box section-pool prop-category-group" data-cat="{E(title)}" id="cat-{cid}" open><summary><span class="sum-text">{icon} {E(title)} — <span class="cat-count">0</span> props</span></summary><div class="rollup-content"><p class="muted-note prop-empty">{E(empty_note)} No odds were inferred.</p></div></details>')
            continue
        _ord = {g_: i_ for i_, g_ in enumerate(ctx['order'])}
        items_sorted = sorted(items, key=lambda x: (_ord.get(x['gid'], 99), -x.get('score', 0), x.get('player', '')))
        _last_gid = None
        h.append(f'<details class="rollup-box section-pool prop-category-group" data-cat="{E(title)}" id="cat-{cid}" open>')
        h.append(f'<summary><span class="sum-text">{icon} {E(title)} — <span class="cat-count">{len(items)}</span> props</span></summary>')
        h.append('<div class="rollup-content"><div class="props-cat-list">')

        for c in items_sorted:
            player = c['player']
            gid = c['gid']
            if gid != _last_gid:
                if _last_gid is not None: h.append('</div></details>')
                _last_gid = gid
                _g0 = ctx['games'].get(gid) or {}
                _n0 = sum(1 for x_ in items_sorted if x_['gid'] == gid)
                h.append(f'<details class="cat-game-head" data-game="{E(gid)}"><summary>{E(_g0.get("away",""))} @ {E(_g0.get("home",""))} <small>{E(_g0.get("kickoff_pt",""))}</small> <span class="cg-count">{_n0}</span></summary><div class="props-game-list">')
            g = ctx['games'].get(gid) or {}
            away = g.get('away', '')
            home = g.get('home', '')
            ko = g.get('kickoff_pt', '')
            l_, f_ = nkey(player)
            tm = c.get('team') or (TEAMS and next((t for t, n in TEAMS.items() if n == player), None)) or teamof.get((gid, l_)) or (away if home else '')
            mkey = c.get('mkey', 'other')
            side = c.get('side', 'over')
            score = c.get('score', 0)
            status = c.get('status', '')
            card = c.get('card')
            lean = c.get('lean')
            ctx_line = c.get('ctx_line', '')
            people = c.get('people', [])
            src = c.get('src', [])
            nsup = len(people) + (1 if card else 0) + (1 if lean not in (None, 'skip') else 0)
            bad = status in ('out', 'doubtful', 'injured reserve', 'ir')

            flags = []
            if card: flags.append(f'<span class="leg-tag tag-card">card stack</span>')
            if lean and lean != 'skip': flags.append(f'<span class="leg-tag">lean {E(lean)}</span>')
            if lean == 'skip': flags.append('<span class="leg-tag tag-warn">synthesis skip</span>')
            if status: flags.append(f'<span class="leg-tag tag-warn">⚠ {E(status)}</span>')

            mkt_label = MNAME.get(mkey, mkey.replace('_', ' ').title())
            if cid == 'tds': mkt_label = 'Touchdown Scorer'
            elif mkey == 'other' and c.get('raw'): mkt_label = c['raw']

            if cid == 'tds':
                base_desc = 'Anytime TD'
                for sc in c.get('sub_clusters', []):
                    if sc.get('card') or (sc.get('lean') and sc['lean'] != 'skip'):
                        base_desc = MNAME.get(sc['mkey'], sc['mkey'])
                        break
            else:
                sd_txt = 'Over' if side == 'over' else ('Under' if side == 'under' else '')
                line_val = c.get('card_line') if c.get('card_line') is not None else c.get('line')
                base_desc = f"{sd_txt} {line_val:g} {MNAME.get(mkey, mkey)}".strip() if line_val is not None else (c.get('raw') or MNAME.get(mkey, mkey))

            pr = c.get('prices') or {}
            exact = {b: v for b, v in pr.items() if v.get('exact')}
            best = max(exact.items(), key=lambda kv: dec(kv[1]['odds'])) if exact else None
            price_span = f'<b>{am(best[1]["odds"])}</b> <span class="lg-book">{best[0]}</span>' if best else ''

            confidence_html = ''
            if cid == 'tds':
                tier_text = next((str(s.get('tier') or '').strip() for s in src if str(s.get('tier') or '').strip()), '')
                if not tier_text and lean and lean != 'skip':
                    tier_text = re.sub(r'^tier\s+', '', str(lean), flags=re.I)
                tier_match = re.match(r'^([A-D])([+-]?)', tier_text.upper()) if tier_text else None
                tier_values = {'A+': 5.0, 'A': 4.5, 'A-': 4.0, 'B+': 4.0, 'B': 3.5, 'B-': 3.0,
                               'C+': 3.0, 'C': 2.5, 'C-': 2.0, 'D+': 2.0, 'D': 1.5, 'D-': 1.0}
                tier_key = (tier_match.group(1) + tier_match.group(2)) if tier_match else ''
                rating = tier_values.get(tier_key)
                rating_note = tier_key + ' tier' if rating is not None else ''
                if rating is None:
                    rating = float(min(5, max(1, len(people))))
                    rating_note = f'{len(people)} distinct source' + ('s' if len(people) != 1 else '')
                fill = max(1, min(5, int(rating + 0.5)))
                confidence_html = (f'<span class="prop-confidence" title="Evidence confidence from the named tier or distinct supporting sources">'
                                   f'{"★" * fill}{"☆" * (5 - fill)} <small>{rating:.1f}/5{(" · " + E(rating_note)) if rating_note else ""}</small></span>')

            rungs = get_ladder_rungs(c)
            rungs_html = []
            for r, is_base in rungs:
                odds_str = am(r['odds']) if r.get('odds') is not None else ''
                book_str = f'<span class="rung-book">{r["book"]}</span>' if r.get('book') else ''
                star_str = '<span class="rung-star" title="Consensus card pick">★</span>' if is_base else ''
                mkt_str = MNAME.get(r.get('mk'), r.get('mk') or '')
                pick_txt = f"{player} {r['label']} {mkt_str} ({odds_str} {r.get('book','')})".strip()
                rungs_html.append(
                    f'<button class="bm-btn ladder-rung{" rung-baseline" if is_base else ""}" type="button" '
                    f'data-pick="{E(pick_txt)}" data-ctx="{E(away)} @ {E(home)}" data-page="props" '
                    f'title="Add {E(pick_txt)} to card">'
                    f'<span class="rung-val">{E(r["label"])}</span>'
                    f'{f"<span class=\'rung-odds\'>{E(odds_str)}</span>" if odds_str else ""}'
                    f'{book_str}'
                    f'{star_str}'
                    f'<span class="bm-icon">☆</span>'
                    f'</button>'
                )

            def cell(b):
                v = pr.get(b)
                if not v: return f'<div class="lp-cell"><span class="lp-b">{b}</span><span class="px-none">—</span></div>'
                cls = 'px-best' if best and best[0] == b else ('px-alt' if not v.get('exact') else '')
                lab = am(v['odds']) if v.get('exact') else f'{("o" if side == "over" else "")}{v["line"]:g} {am(v["odds"])} (alt line)'
                return f'<div class="lp-cell"><span class="lp-b">{b}</span><span class="{cls}">{E(lab)}</span></div>'

            whos = []
            if ctx_line: whos.append(f'<li class="leg-ctx">📌 <b>Game context:</b> {E(ctx_line)}</li>')
            for s in src:
                wy = (s.get('why') or '')[:220]
                if s['kind'] in ('card', 'lean'):
                    whos.append(f'<li><b>{E(s["who"])}</b> ({E(s.get("what", ""))}): {E(wy)}</li>')
                else:
                    r = s['row']; q = f' {am(s["price"])}' if s.get('price') not in (None, '') else ''
                    lq = f' at {s["line"]:g}' if s.get('line') is not None and mkey not in YES else ''
                    if not wy.strip() or wy.strip().lower() == (r.get('selection') or '').strip().lower():
                        wy = 'called this leg (no written reason stored; see the source)'
                    whos.append(f'<li><b>{E(s["who"])}</b>{E(lq)}{E(q)}: {E(wy)} <span class="src">— {source_html(r, ctx)}</span></li>')

            card_id = f"prop-{slug(player)}-{slug(mkey)}-{slug(side)}"
            dat = (f'data-kind="{E(title)}" data-game="{E(gid)}" data-card="{1 if card else 0}" '
                   f'data-sup="{nsup}" data-bad="{1 if bad else 0}" data-player="{E(player.lower())}" '
                   f'data-team="{E(tm.lower() if tm else "")}"')

            h.append(
                f'<details class="prop-card leg bm-item" id="{card_id}" {dat}>'
                f'<summary class="prop-card-summary">'
                f'  <div class="prop-sum-left">'
                f'    {tl(tm)}'
                f'    <div class="prop-player-meta">'
                f'      <span class="prop-player-name">{E(player)}</span>'
                f'      <span class="prop-matchup-chip">{E(tm)} · {E(away)} @ {E(home)}</span>'
                f'    </div>'
                f'    <span class="prop-mkt-tag">{E(mkt_label)}</span>'
                f'    {" ".join(flags)}'
                f'  </div>'
                f'  <div class="prop-sum-right">'
                f'    <span class="prop-sum-rec"><b>{E(base_desc)}</b> {price_span}</span>'
                f'    <span class="prop-sup-tag" title="support score">▲ {score:g} <small>{nsup} src</small></span>'
                f'    {confidence_html}'
                f'    <span class="prop-expand-indicator">▼</span>'
                f'  </div>'
                f'</summary>'
                f'<div class="prop-card-body">'
                f'  <div class="prop-baseline-bar">'
                f'    <span class="prop-baseline-label">Recommendation:</span>'
                f'    <span class="prop-baseline-val"><b>{E(base_desc)}</b> {price_span}</span>'
                f'    {f"<span class=\'prop-ctx-note\'>📌 {E(ctx_line)}</span>" if ctx_line else ""}'
                f'  </div>'
                f'  <div class="prop-ladder-wrap">'
                f'    <div class="prop-ladder-header">'
                f'      <span class="ladder-title">Pick your amount (tap to add to card):</span>'
                f'      <span class="ladder-hint">← horizontal ladder →</span>'
                f'    </div>'
                f'    <div class="prop-ladder-row">'
                f'      {"".join(rungs_html)}'
                f'    </div>'
                f'  </div>'
                f'  <div class="prop-card-intel">'
                f'    <div class="intel-header" style="font-size:12px;font-weight:750;color:var(--primary);margin-bottom:6px;">Intel, expert quotes ({len(src)}) & book prices:</div>'
                f'    <div class="lp-row">{cell("BKR")}{cell("BEO")}{cell("DK")}</div>'
                f'    <ul class="leg-src">{"".join(whos)}</ul>'
                f'    <p class="prop-game-link"><a href="{gpage(gid)}" class="table-link">Full {E(away)} @ {E(home)} game write-up →</a></p>'
                f'  </div>'
                f'</div>'
                f'</details>'
            )

        if _last_gid is not None: h.append('</div></details>')
        h.append('</div><p class="cat-none muted-note" hidden>No props match the active filters in this category.</p></div></details>')

    h.append('</div>')
    return ''.join(h)


# ---------------------------------------------------------------- teasers
def experts_of(r):
    """Returns a list of individual expert names from a verified pick row."""
    persons = r.get('persons')
    if persons:
        return [p.strip() for p in persons if p and p.strip()]
    if r.get('kind') == 'podcast':
        return ['podcast host']
    return [r.get('outlet') or 'expert']


def get_bkr_teaser_intel(ctx, gid, side):
    """Assess whether (gid, side) is a Wong candidate strictly using live BKR prices."""
    g = (ctx.get('games') or {}).get(gid) or {}
    sp_dict = g.get('lines', {}).get('spread', {})
    side_sp = sp_dict.get(side) or {}
    bkr_ln = side_sp.get('line')
    bkr_odds = side_sp.get('price')

    if bkr_ln is None:
        return {
            'bkr_ln': None,
            'bkr_odds': None,
            'teased_ln': None,
            'is_wong': False,
            'bkr_text': '—',
            'teased_text': '—',
            'status_html': '<span class="badge badge-nonwong">No live line</span>',
            'desc': 'No live spread available at BKR'
        }

    teased_ln = bkr_ln + 6
    odds_str = f" ({am(bkr_odds)})" if bkr_odds else ""
    bkr_text = f"{bkr_ln:+g}{odds_str}"
    teased_text = f"{teased_ln:+g}"

    # Wong criteria:
    # Favorites: -8.5 <= line <= -7.5 (teased down to -2.5 to -1.5, crosses 7 & 3)
    # Underdogs: +1.5 <= line <= +2.5 (teased up to +7.5 to +8.5, crosses 3 & 7)
    if -8.5 <= bkr_ln <= -7.5:
        is_wong = True
        desc = f"Wong Favorite: live {bkr_ln:+g} teased down to {teased_ln:+g} (crosses 7 & 3)"
        status_html = f'<span class="badge badge-wong" title="{desc}">✓ Wong Candidate</span>'
    elif 1.5 <= bkr_ln <= 2.5:
        is_wong = True
        desc = f"Wong Underdog: live {bkr_ln:+g} teased up to {teased_ln:+g} (crosses 3 & 7)"
        status_html = f'<span class="badge badge-wong" title="{desc}">✓ Wong Candidate</span>'
    else:
        is_wong = False
        if abs(bkr_ln) == 3:
            why = f"starts on 3 ({bkr_ln:+g}), push risk / does not cross 3"
        elif bkr_ln > 2.5:
            why = f"dog {bkr_ln:+g} does not cross 3"
        elif -7.5 < bkr_ln < 0:
            why = f"fav {bkr_ln:+g} does not cross 7"
        else:
            why = f"line is {bkr_ln:+g}"
        desc = f"Not Wong at live BKR: {why}"
        status_html = f'<span class="badge badge-nonwong" title="{desc}">✗ Not Wong ({bkr_ln:+g} BKR)</span>'

    return {
        'bkr_ln': bkr_ln,
        'bkr_odds': bkr_odds,
        'teased_ln': teased_ln,
        'is_wong': is_wong,
        'bkr_text': bkr_text,
        'teased_text': teased_text,
        'status_html': status_html,
        'desc': desc
    }


def teaser_extras(ctx, legs):
    """legs: [(gid, team)] from the Wong table. Returns (experts_cell_html_by_leg, calls_html, math_html)."""
    cells = {}
    for gid, team in legs:
        ppl = defaultdict(list)
        for r in ctx['vrows']:
            if r.get('game') == gid and r.get('side') == team and r.get('market') in ('spread', 'contest', 'teaser', 'moneyline'):
                for p in experts_of(r):
                    ppl[p].append(r)
        items = []
        for w, rs in sorted(ppl.items(), key=lambda kv: (not any(x['market'] == 'teaser' for x in kv[1]), kv[0])):
            r = next((x for x in rs if x['market'] == 'teaser'), rs[0])
            lk = ''
            if r.get('url'): lk = f' <a href="{E(r["url"])}" target="_blank" rel="noopener">↗</a>'
            elif r.get('kind') == 'podcast':
                p_pod = ctx['pods'].get(r.get('source_title') or '') or {}
                if p_pod.get('youtube_url'): lk = f' <a href="{E(p_pod["youtube_url"])}" target="_blank" rel="noopener">▶</a>'
            mk = {'teaser': 'teaser', 'contest': 'contest', 'moneyline': 'ML', 'spread': 'spread'}.get(r['market'], r['market'])
            qt = re.sub(r'^\[[^\]]*\]\s*', '', r.get('quote') or '')[:200]
            items.append(f'<span class="exp-chip" title="{E(qt)}">{E(w)} <i>{mk}</i>{lk}</span>')
        cells[(gid, team)] = (len(ppl), ' '.join(items) or '—')

    # Deduplicate teaser calls by (gid, side, expert)
    calls_grouped = defaultdict(list)
    for r in ctx['vrows']:
        if r.get('market') == 'teaser':
            gid = r.get('game')
            side = r.get('side')
            for p in experts_of(r):
                calls_grouped[(gid, side, p)].append(r)

    processed_calls = []
    wong_calls_count = 0
    for (gid, side, p), rows in calls_grouped.items():
        intel = get_bkr_teaser_intel(ctx, gid, side)
        if intel['is_wong']:
            wong_calls_count += 1

        clean_quotes = []
        for r in rows:
            raw_q = r.get('quote') or ''
            q = re.sub(r'^\[TEASER\s*—\s*[^\]]*\]\s*', '', raw_q).strip()
            if q and q not in clean_quotes:
                clean_quotes.append(q)

        quote_html = ' <span class="muted-note">/</span> '.join(f'"{E(q)}"' for q in clean_quotes) if clean_quotes else '—'

        src_items = []
        for r in rows:
            s_html = source_html(r, ctx)
            if s_html not in src_items:
                src_items.append(s_html)
        src_html_out = '<br>'.join(src_items)

        order_idx = ctx['order'].index(gid) if gid in ctx['order'] else 99
        processed_calls.append({
            'is_wong': intel['is_wong'],
            'order_idx': order_idx,
            'gid': gid,
            'side': side,
            'expert': p,
            'intel': intel,
            'quote_html': quote_html,
            'src_html': src_html_out
        })

    # Sort: Wong candidates first, then game order, side, expert
    processed_calls.sort(key=lambda x: (not x['is_wong'], x['order_idx'], x['side'], x['expert']))

    ch = [
        '<h3 id="teaser-calls">Expert teaser calls this week</h3>',
        '<p class="muted-note" style="margin-top:2px;margin-bottom:12px;">Wong candidacy is assessed strictly using <strong>live Bookmaker (BKR) lines</strong>. '
        'A 6-point teaser only qualifies as a Wong candidate if the 6 points cross both 3 and 7: favorites of −7.5 to −8.5 (teased down to −1.5 / −2.5) '
        'and underdogs of +1.5 to +2.5 (teased up to +7.5 / +8.5). Calls where the market moved off Wong eligibility are clearly indicated below.</p>',
        '<div class="teaser-filter-bar">',
        '  <span style="font-size:12px;font-weight:750;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Filter:</span>',
        f'  <button type="button" class="btn-toggle active" id="tf-all">All Expert Calls ({len(processed_calls)})</button>',
        f'  <button type="button" class="btn-toggle" id="tf-wong">Live BKR Wong Only ({wong_calls_count})</button>',
        '</div>',
        '<div class="table-responsive"><table><thead><tr>'
        '<th>Game</th><th>Leg & Live BKR Line</th><th>Wong Status (Live BKR)</th><th>Expert</th><th>What they said</th><th>Source</th>'
        '</tr></thead><tbody>'
    ]

    for c in processed_calls:
        wong_attr = '1' if c['is_wong'] else '0'
        intel = c['intel']
        ch.append(
            f'<tr class="tc-row" data-wong="{wong_attr}">'
            f'<td><a href="{gpage(c["gid"])}">{E(c["gid"])}</a></td>'
            f'<td><b>{E(c["side"])} {E(intel["teased_text"])}</b>'
            f'<div class="bkr-price">BKR live: {E(intel["bkr_text"])} → {E(intel["teased_text"])}</div></td>'
            f'<td>{intel["status_html"]}</td>'
            f'<td><b>{E(c["expert"])}</b></td>'
            f'<td style="max-width:320px;line-height:1.45;">{c["quote_html"]}</td>'
            f'<td style="font-size:12.5px;line-height:1.4;">{c["src_html"]}</td>'
            f'</tr>'
        )

    ch.append('</tbody></table></div>')
    # math
    pays = [('2-team', 2, -120), ('3-team', 3, 160), ('4-team', 4, 260)]
    ps = [0.70, 0.72, 0.74, 0.76]
    def ev(n, odds, p): return p ** n * dec(odds) - 1
    rows = ''.join(f'<tr><td><b>{nm}</b> ({am(o)})</td><td>{(1 / dec(o)) ** (1 / n) * 100:.1f}%</td>' +
                   ''.join(f'<td class="{"ev-pos" if ev(n, o, p) > 0 else "ev-neg"}">{ev(n, o, p) * 100:+.1f}%</td>' for p in ps) + '</tr>' for nm, n, o in pays)
    def rr(nlegs, size, odds, p):
        """round robin of all size-team teasers from nlegs legs, $1 each: EV per $ and chance of a profit."""
        combos = math.comb(nlegs, size); evs = 0; pprofit = 0
        for k in range(nlegs + 1):
            pk = math.comb(nlegs, k) * p ** k * (1 - p) ** (nlegs - k)
            ret = math.comb(k, size) * dec(odds) if k >= size else 0
            evs += pk * ret
            if ret > combos: pprofit += pk
        return evs / combos - 1, pprofit, combos
    rr_rows = []
    for nm, nl, sz, o in [('3 legs by 2s', 3, 2, -120), ('4 legs by 2s', 4, 2, -120), ('4 legs by 3s', 4, 3, 160), ('4-team straight', 4, 4, 260), ('3-team straight', 3, 3, 160)]:
        e, pp, cb = rr(nl, sz, o, 0.74)
        rr_rows.append(f'<tr><td><b>{nm}</b></td><td>{cb}</td><td class="{"ev-pos" if e > 0 else "ev-neg"}">{e * 100:+.1f}%</td><td>{pp * 100:.0f}%</td></tr>')
    mh = ['<h3 id="teaser-math">Teaser math: 2, 3 and 4 legs, and round robins</h3>',
          '<p class="muted-note">Prices are the usual 6-point payouts (2-team −120, 3-team +160, 4-team +260); confirm BKR\'s on the slip. '
          '"Break-even per leg" is how often each leg must cover for the ticket to break even. Historically, Wong legs have covered '
          'roughly 72–75% of the time, but that is a long-run average, not a promise for this week\'s legs.</p>',
          '<div class="table-responsive"><table class="no-bm"><thead><tr><th>Ticket</th><th>Break-even per leg</th>' +
          ''.join(f'<th>EV if legs cover {p * 100:.0f}%</th>' for p in ps) + f'</tr></thead><tbody>{rows}</tbody></table></div>',
          '<p><b>What the table says:</b> the edge per leg compounds. If the legs really cover 74% or better, bigger teasers return more per dollar; '
          'at 72% the 2-team loses and the 3- and 4-team are near break-even; at 70% all of them lose, the 4-team most. A round robin does not '
          'change the expected return per dollar of a single ticket of the same size; it trades some upside for a better chance of getting something back.</p>',
          '<div class="table-responsive"><table class="no-bm"><thead><tr><th>Structure ($1 per ticket, legs at 74%)</th><th>Tickets</th><th>EV per $</th><th>Chance of a profit</th></tr></thead>'
          f'<tbody>{"".join(rr_rows)}</tbody></table></div>',
          '<div class="teaser-calc no-bm" id="teaser-calc"><h4>Try your own numbers</h4>'
          '<label>Leg cover rate % <input type="number" id="tc-p" value="74" min="50" max="95" step="0.5"></label> '
          '<label>2-team <input type="number" id="tc-2" value="-120"></label> <label>3-team <input type="number" id="tc-3" value="160"></label> '
          '<label>4-team <input type="number" id="tc-4" value="260"></label><div id="tc-out" class="table-responsive"></div></div>']
    return cells, ''.join(ch), ''.join(mh)


# ---------------------------------------------------------------- bookmarks
BOOKMARKS_PAGE = (
    '<div class="bm-page"><h2 class="page-h" id="bookmarks">☆ Bookmarks</h2>'
    '<p class="dashboard-intro">Picks, legs, sides and totals you starred anywhere in this report. They are saved in this browser only '
    '(not on other devices, and cleared if you clear site data). Tap a bookmark to jump back to it.</p>'
    '<div class="rollup-controls"><button class="btn-toggle" id="bm-copy">Copy list as text</button>'
    '<button class="btn-toggle" id="bm-clear">Remove all</button></div><div id="bm-list"><p class="muted-note">No bookmarks yet. Tap ☆ next to any pick, leg or table row.</p></div></div>')

BOOKMARKS_CSS = r"""
/* ---- bookmarks + extras (site_extras.py) ---- */
.bm-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:24px;padding:3px 9px;border:1.5px solid var(--accent);background:rgba(0,210,190,0.12);color:var(--accent);border-radius:999px;font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;cursor:pointer;white-space:nowrap;vertical-align:middle;line-height:1;transition:all .15s ease;-webkit-user-select:none;user-select:none}
.bm-btn:hover{background:var(--accent);color:var(--on-accent);border-color:var(--accent);transform:translateY(-1px)}
.bm-btn.on{background:#facc15;color:#0f172a;border-color:#facc15;font-weight:850;box-shadow:0 0 10px rgba(250,204,21,0.35)}
.bm-btn.on:hover{background:#fde047;border-color:#fde047}
.bm-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.bm-btn .bm-icon{font-size:13px;line-height:1}
.bm-btn .bm-text{font-size:11px;font-weight:800;line-height:1}
.at-glance-item{display:inline-flex;align-items:center;gap:4px;background:var(--card);border:1px solid var(--border);border-radius:999px;padding:2px 6px 2px 2px}
.at-glance-item .at-glance-pill{border:none;background:transparent;padding:4px 6px 4px 8px}
.at-glance-item .pill-bm-btn{padding:3px 8px;min-height:22px;font-size:10.5px}
.at-glance-pill small{font-size:10px;font-weight:800;color:var(--muted);margin:0 2px}
.prop-confidence{display:inline-flex;align-items:center;gap:4px;color:#facc15;font-size:12px;font-weight:850;white-space:nowrap}
.prop-confidence small{font-size:10px;color:var(--muted);font-weight:700}
.prop-empty{margin:6px 0;padding:10px 12px;border:1px dashed var(--border);border-radius:8px}
.gp-bm-btn{margin:0 5px;padding:2px 7px;min-height:21px;font-size:10px}
.sc-tile-wrap{display:flex;flex-direction:column;gap:5px}
.sc-tile-wrap .sc-tile{flex:1}
.sc-tile-btn{width:100%;justify-content:center;padding:6px 8px;font-size:11.5px;border-radius:8px}
.sc-pick-btn{margin-left:8px;padding:3px 10px;font-size:11.5px}
.leg-bm-btn{padding:3px 8px;min-height:22px;font-size:10.5px}
.bm-flash{animation:bmflash 2.4s ease-out 1}@keyframes bmflash{0%{background:rgba(250,204,21,.35)}100%{background:transparent}}
.bm-count{display:inline-block;min-width:18px;margin-left:5px;padding:0 5px;border-radius:999px;background:#facc15;color:#0f172a;font-size:11px;line-height:18px;text-align:center}.bm-count:empty{display:none}
.bm-group{margin:16px 0}.bm-group h3{margin:0 0 8px;font-size:15px}.bm-row{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--card);margin:6px 0}
.bm-row a{color:var(--text);text-decoration:none;flex:1;min-width:0;overflow-wrap:anywhere}.bm-row a:hover{color:var(--primary)}.bm-row .bm-ctx{display:block;color:var(--muted);font-size:12px}
.site-ref-nav{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:0 0 10px;font-size:12.5px}
.site-ref-nav .ref-label{color:var(--muted);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:10.5px}
.site-ref-nav a{color:var(--body);text-decoration:none;font-weight:650}.site-ref-nav a:hover{color:var(--primary)}.site-ref-nav a.current{color:var(--primary);text-decoration:underline;text-underline-offset:3px}
.sc-list{display:grid;gap:10px;margin:10px 0 18px}
.sc-pick{display:flex;gap:14px;padding:14px 16px;border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:12px;background:var(--card)}
.sc-pick.sc-alt{border-left-color:var(--border)}
.sc-rank{flex:0 0 auto;min-width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--raised,var(--highlight));color:var(--text);font-weight:800;font-size:15px}
.sc-alt .sc-rank{font-size:11.5px}
.sc-body{min-width:0;flex:1}.sc-title{margin:0 0 6px;font-size:18px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px}
.sc-game{font-size:12.5px;font-weight:600;color:var(--muted)}.sc-game a{color:var(--primary)}
.sc-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.sc-chip{font-size:12px;padding:3px 9px;border:1px solid var(--border);border-radius:999px;color:var(--body)}.sc-chip b{color:var(--muted);font-weight:700;margin-right:3px}
.sc-why,.sc-support{margin:4px 0;font-size:14px;line-height:1.5}.sc-support{color:var(--muted);font-size:13px}
.muted-note{color:var(--muted);font-size:13px;line-height:1.5}
.leg-tag{display:inline-block;margin:3px 4px 0 0;padding:1px 7px;border-radius:999px;border:1px solid var(--border);font-size:11px;color:var(--muted)}
.leg-tag.tag-card{border-color:var(--accent);color:var(--accent)}.leg-tag.tag-warn{border-color:#f59e0b;color:#f59e0b}
.px-best{color:#22c55e;font-weight:800}.px-alt{color:var(--muted);font-size:12px}.px-none{color:var(--muted)}.px-best-cell{font-weight:800;white-space:nowrap}
.leg-src{margin:0;padding-left:16px;font-size:12.5px;line-height:1.45}.leg-src .src{color:var(--muted)}
.legs-table td{vertical-align:top}
.exp-chip{display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px;white-space:nowrap}.exp-chip i{color:var(--muted);font-style:normal;font-size:11px}
.ev-pos{color:#22c55e;font-weight:700}.ev-neg{color:#f87171}
.teaser-calc{margin:14px 0;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--card)}.teaser-calc h4{margin:0 0 8px}
.teaser-calc label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0;font-size:13px;color:var(--muted)}
.teaser-calc input{width:74px;padding:5px 7px;border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--text)}
.badge-wong{display:inline-block;padding:3px 9px;border-radius:6px;font-size:11.5px;font-weight:750;background:#059669;color:#ffffff;white-space:nowrap;letter-spacing:.02em}
.badge-nonwong{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11.5px;font-weight:650;background:rgba(255,255,255,0.06);color:var(--muted);border:1px solid var(--border);white-space:nowrap}
.bkr-price{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:2px}
.teaser-filter-bar{margin:12px 0 14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.teaser-filter-bar .btn-toggle.active{background:var(--accent);color:var(--on-accent);font-weight:800}
.gc-popup-badge{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 10px;border-radius:6px;font-size:11.5px;font-weight:750;color:var(--accent);background:rgba(0,210,190,.1);border:1px solid rgba(0,210,190,.25);width:fit-content;transition:all .15s ease}
.game-card:hover .gc-popup-badge{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.splits-top{margin:0 0 16px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--card)}.splits-top h3{margin:0 0 6px;font-size:15px}
.mi-pointer{margin:16px 0;padding:10px 14px;border-left:3px solid var(--accent);border-radius:7px;background:var(--card);font-size:13.5px}
.sc-strip{display:flex;flex-direction:column;gap:20px;margin:12px 0 24px}
.sc-strip-group{min-width:0;width:100%}
.sc-strip-label{font-size:12px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 10px;display:flex;align-items:center;gap:6px}
.sc-alt-group .sc-strip-label{color:var(--muted)}
.sc-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.sc-tile-wrap{display:flex;flex-direction:column;gap:6px;min-width:0}
.sc-tile{display:flex;flex-direction:column;gap:6px;min-width:0;padding:12px 12px 10px;border:1px solid var(--border);border-top:3px solid var(--accent);border-radius:12px;background:var(--card);color:var(--text);text-decoration:none;transition:all .15s ease;flex:1}
.sc-tile:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.35)}
.sc-tile:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sc-tile.sc-tile-alt{border-top-color:#64748b}
.sct-header{display:flex;align-items:center;justify-content:space-between;gap:6px}
.sct-rank{font-size:11px;font-weight:850;color:var(--accent);background:rgba(0,210,190,.12);padding:2px 7px;border-radius:6px}
.sc-tile-alt .sct-rank{color:var(--muted);background:rgba(148,163,184,.1)}
.sct-conf{font-size:11px;font-weight:700;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sct-pick{display:flex;align-items:center;gap:8px;font-size:17.5px;font-weight:850;color:var(--text);margin:2px 0;white-space:nowrap}
.sct-pick .tl{width:26px;height:26px;flex-shrink:0;vertical-align:middle;margin:0}
.sct-pick-text{font-weight:850}
.sct-pick-text b{color:var(--accent)}
.sc-tile-alt .sct-pick-text b{color:#cbd5e1}
.sct-matchup{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:6px;background:rgba(15,23,42,.65);border:1px solid rgba(255,255,255,.06);font-size:12px;font-weight:750;color:var(--body);white-space:nowrap}
.sct-matchup .tl{width:18px;height:18px;flex-shrink:0;vertical-align:middle;margin:0}
.sct-matchup .mu-at{color:var(--muted);font-size:10.5px;font-weight:600;margin:0 1px}
.sct-meta{display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:11.5px;color:var(--muted);margin-top:auto;padding-top:4px;border-top:1px solid rgba(255,255,255,.06)}
.sct-game{font-size:11.5px;color:var(--muted);line-height:1.35}
.sct-room{font-size:11.5px;font-weight:750;color:#22c55e}
.sct-go{font-size:11px;font-weight:800;color:var(--accent);text-align:right;margin-top:2px}
.sc-tile:hover .sct-go{text-decoration:underline}
.sc-title-pick{display:inline-flex;align-items:center;gap:8px;font-size:18px;font-weight:850}
.sc-title-pick .tl{width:26px;height:26px;vertical-align:middle;margin:0}
.sc-game .tl{width:18px;height:18px;vertical-align:middle;margin:0 2px}
.sc-how{margin:4px 0 6px;font-size:14px;line-height:1.5;padding:8px 10px;border-radius:8px;background:var(--raised,var(--highlight))}
.sc-pick{scroll-margin-top:150px}
@media (max-width:960px){.sc-tiles{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;padding-bottom:8px}.sc-tile-wrap{flex:0 0 195px;scroll-snap-align:start}}
.legs-filter{margin:10px 0 12px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.lf-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:3px 0}.lf-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.lf-check{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--body);margin-right:8px}
#lf-q{flex:1;min-width:140px;max-width:240px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text)}
.lf-count{margin-left:auto;font-size:12px;color:var(--muted)}
.leg-list{display:grid;gap:6px}
.leg{border:1px solid var(--border);border-radius:10px;background:var(--bg)}
.leg[open]{border-color:var(--accent)}
.leg-list .leg>summary{display:grid !important;grid-template-columns:auto minmax(0,1fr) 92px 120px 86px;justify-content:stretch;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;list-style:none}
.leg>summary::-webkit-details-marker{display:none}
.leg>summary .bm-btn{grid-column:1}
.lg-main{min-width:0}.lg-name{display:block;font-weight:750;font-size:14.5px;color:var(--text)}.lg-tags .leg-tag{margin-top:2px}
.lg-kind{font-size:12px;color:var(--muted)}.lg-price{font-size:14px;white-space:nowrap}.lg-book{font-size:11px;color:var(--muted);margin-left:3px}
.lg-sup{font-weight:800;font-size:13px;color:var(--accent);text-align:right;white-space:nowrap}.lg-sup small{display:block;font-weight:600;font-size:10.5px;color:var(--muted)}
.leg-body{padding:2px 14px 12px 14px;border-top:1px solid var(--border)}
.lp-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.lp-cell{display:flex;flex-direction:column;min-width:96px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13.5px}.lp-b{font-size:10.5px;font-weight:800;letter-spacing:.06em;color:var(--muted)}
@media (max-width:640px){.leg-list .leg>summary{grid-template-columns:auto minmax(0,1fr) auto;gap:4px 8px}.lg-kind{display:none}.lg-sup{grid-column:2/4;text-align:left}.lg-sup small{display:inline;margin-left:6px}.lg-price{grid-column:3;grid-row:1}}
.rec-filter{display:inline-flex;flex-wrap:wrap;gap:6px;margin-right:6px}
.rp:not([hidden])~.rp:not([hidden])::before{content:' · '}
.rp[hidden]{display:none}
.mu-jump{position:static;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 14px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.mu-jump-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:2px}
.mu-jump-link{padding:5px 11px;border:1px solid var(--border);border-radius:999px;color:var(--text);text-decoration:none;font-size:12.5px;font-weight:700;white-space:nowrap}
.mu-jump-link:hover{border-color:var(--accent);color:var(--primary)}
.mu-jump .mu-all{margin-left:auto}.mu-jump .mu-all+.mu-all{margin-left:0}
.mu-card{scroll-margin-top:110px}
.mu-badge{display:inline-block;margin-left:8px;padding:1px 9px;border-radius:999px;background:#facc15;color:#0f172a;font-size:12px;font-weight:800}.mu-badge.lean{background:transparent;color:#f59e0b;border:1px solid #f59e0b}
.split-alert{margin:4px 0 12px;padding:10px 14px;border:1px solid #facc15;border-left:4px solid #facc15;border-radius:10px;background:rgba(250,204,21,.08)}
.split-alert ul{margin:6px 0;padding-left:18px}.split-alert li{margin:3px 0;font-size:14px}
tr.split-big td{background:rgba(250,204,21,.12)}tr.split-lean td{background:rgba(245,158,11,.07)}
@media (max-width:640px){.mu-jump{position:static}.mu-card{scroll-margin-top:80px}}
@media (max-width:640px){.sc-pick{padding:12px;gap:10px}.sc-rank{min-width:34px;height:34px}.sc-title{font-size:16px}}

/* ---- Props Lab: Categories & Ladders ---- */
.prop-category-group{margin:16px 0 24px;border:1px solid var(--border);border-radius:12px;background:var(--card)}
.prop-category-group summary{padding:12px 16px;font-size:15px;font-weight:800;cursor:pointer}
.props-cat-list{display:grid;gap:10px;padding:12px 16px 16px}
.cat-game-head{border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:8px;background:var(--raised)}.cat-game-head>summary{cursor:pointer;padding:8px 12px;font-size:14px;font-weight:800;list-style:none}.cat-game-head>summary::-webkit-details-marker{display:none}.cat-game-head>summary::before{content:"▸ ";color:var(--muted)}.cat-game-head[open]>summary::before{content:"▾ "}.cat-game-head small{font-weight:600;color:var(--muted);margin-left:6px}.cg-count{float:right;font-size:12px;font-weight:800;padding:1px 9px;border-radius:999px;border:1px solid var(--border)}.cat-game-head[hidden]{display:none}.props-game-list{display:grid;gap:10px;padding:4px 10px 12px}
.prop-card{border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:10px;background:var(--bg);transition:all .15s ease;overflow:hidden}
.prop-card:hover{border-color:var(--accent);box-shadow:0 3px 12px rgba(0,0,0,.2)}
.prop-card[open]{border-color:var(--accent);box-shadow:0 4px 16px rgba(0,0,0,.25)}
.prop-card-summary{display:flex !important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;padding:10px 14px;cursor:pointer;list-style:none;user-select:none;background:var(--card)}
.prop-card-summary::-webkit-details-marker{display:none}
.prop-card-summary:hover{background:var(--raised)}
.prop-sum-left{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0}
.prop-sum-left .tl{width:24px;height:24px;flex-shrink:0;vertical-align:middle;margin:0}
.prop-player-meta{display:flex;flex-direction:column;gap:1px}
.prop-player-name{font-size:15px;font-weight:850;color:var(--text)}
.prop-matchup-chip{font-size:11.5px;font-weight:600;color:var(--muted)}
.prop-mkt-tag{font-size:11px;font-weight:750;padding:2px 7px;border-radius:5px;background:rgba(255,255,255,.07);color:var(--body)}
.prop-sum-right{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-left:auto}
.prop-sum-rec{font-size:13px;font-weight:750;color:var(--text)}
.prop-sum-rec b{color:var(--accent)}
.prop-sup-tag{font-size:11.5px;font-weight:800;color:var(--accent);background:rgba(0,210,190,.12);padding:2px 7px;border-radius:6px;white-space:nowrap}
.prop-expand-indicator{font-size:11px;color:var(--muted);transition:transform .2s ease;margin-left:4px}
.prop-card[open] .prop-expand-indicator{transform:rotate(180deg);color:var(--accent)}
.prop-card-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border)}
.prop-baseline-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:7px 12px;border-radius:8px;background:var(--card);border:1px solid var(--border);font-size:12.5px;color:var(--body)}
.prop-baseline-label{color:var(--muted);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.prop-baseline-val b{color:var(--accent)}
.prop-ctx-note{font-size:12px;color:var(--muted)}
.prop-ladder-wrap{display:flex;flex-direction:column;gap:6px;margin-top:2px}
.prop-ladder-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ladder-title{font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.08em;color:var(--accent)}
.ladder-hint{font-size:11px;color:var(--muted);font-weight:600}
.prop-ladder-row{display:flex;align-items:center;gap:8px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:thin;scroll-snap-type:x proximity}
.prop-ladder-row::-webkit-scrollbar{height:6px}
.prop-ladder-row::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:999px}
.ladder-rung{flex:0 0 auto;scroll-snap-align:start;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;min-height:32px;border-radius:8px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:12.5px;cursor:pointer;transition:all .15s ease;user-select:none}
.ladder-rung:hover{border-color:var(--accent);background:var(--raised);transform:translateY(-1px)}
.ladder-rung.rung-baseline{border-color:var(--accent);background:rgba(0,210,190,.12)}
.ladder-rung.on{border-color:#facc15;background:#facc15;color:#0f172a !important;font-weight:850;box-shadow:0 0 12px rgba(250,204,21,.4)}
.ladder-rung.on .rung-val,.ladder-rung.on .rung-odds,.ladder-rung.on .rung-book,.ladder-rung.on .rung-star{color:#0f172a !important}
.rung-val{font-weight:850;font-size:13px}
.rung-odds{font-weight:800;color:var(--accent);font-size:12px}
.rung-book{font-size:10.5px;font-weight:700;color:var(--muted);opacity:.85}
.rung-star{color:#facc15;font-size:12px}
.ladder-rung .bm-icon{font-size:12px;margin-left:2px}
.prop-card-intel{border-top:1px solid rgba(255,255,255,.06);padding-top:6px}
.prop-game-link a{color:var(--primary);font-size:12.5px;font-weight:700;text-decoration:none}
.prop-game-link a:hover{text-decoration:underline}
.lf-game-link{cursor:pointer;text-decoration:none;padding:2px 6px;border-radius:4px;color:var(--body);font-weight:650}
.lf-game-link:hover{color:var(--accent)}
.lf-game-link.active{background:var(--accent);color:var(--on-accent);font-weight:800}
@media (max-width:640px){.prop-card-summary{flex-direction:column;align-items:flex-start}.prop-sum-right{width:100%;justify-content:space-between;margin-left:0}}
"""

BOOKMARKS_JS = r"""
/* ---- bookmarks, teaser calculator (site_extras.py) ---- */
(function(){
  var wk = document.body.getAttribute('data-week') || '';
  var KEY = 'pr-bookmarks-w' + wk;
  function load(){ try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; } }
  function save(a){ try { localStorage.setItem(KEY, JSON.stringify(a)); } catch(e){} }
  function hash(s){ var x = 5381; for (var i = 0; i < s.length; i++){ x = ((x << 5) + x + s.charCodeAt(i)) | 0; } return (x >>> 0).toString(36); }
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page.indexOf('.html') < 0) page = 'index.html';
  function clean(t){ return (t || '').replace(/\s+/g, ' ').trim(); }
  // single-file edition: every page is a <section data-page> in one document
  var SINGLE = !!document.querySelector('[data-page]');
  function pageOf(el){ var s = el.closest && el.closest('[data-page]'); return s ? s.getAttribute('data-page') : page; }
  function hrefOf(b){ return SINGLE ? '#/' + b.page.replace(/\.html$/, '') + '/' + b.id : b.page + '#' + b.id; }
  function ctxOf(el){
    var d = el.closest('details'); var s = d && d.querySelector('summary');
    if (s) return clean(s.textContent).slice(0, 90);
    var h = document.querySelector('.container h2'); return h ? clean(h.textContent).slice(0, 90) : document.title;
  }
  function count(){ var n = load().length; document.querySelectorAll('.bm-count').forEach(function(c){ c.textContent = n ? String(n) : ''; }); }
  function setup(){
    var marks = {}; load().forEach(function(b){ marks[b.id] = 1; });
    var els = document.querySelectorAll('.container table tbody tr, .container .bm-item, .container details.leg, .container details.section-tickets');
    els.forEach(function(el){
      if (el.closest('.no-bm') || el.closest('#bm-list') || el.closest('#drawer-bm-list') || el.querySelector('.bm-btn') || el.dataset.bmReady) return;
      el.dataset.bmReady = '1';
      var text = clean(el.textContent);
      if (!text || text.length < 3) return;
      var host = el.matches('tr') ? el.querySelector('td') : (el.querySelector('.bm-host') || el.querySelector('.sc-title') || el);
      if (!host) return;
      var pg = pageOf(el);
      if (!el.id) el.id = 'bm-' + hash(pg + '|' + text.slice(0, 200));
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bm-btn' + (marks[el.id] ? ' on' : '');
      b.setAttribute('aria-label', 'Add pick to card'); b.setAttribute('aria-pressed', marks[el.id] ? 'true' : 'false');
      b.title = 'Add pick to card';
      b.innerHTML = '<span class="bm-icon">' + (marks[el.id] ? '★' : '☆') + '</span><span class="bm-text">' + (marks[el.id] ? 'On Card' : '+ Card') + '</span>';
      b.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var a = load(), i = -1;
        for (var k = 0; k < a.length; k++){ if (a[k].id === el.id && (a[k].page === pg || !a[k].page)){ i = k; break; } }
        if (i >= 0){ a.splice(i, 1); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); b.innerHTML = '<span class="bm-icon">☆</span><span class="bm-text">+ Card</span>'; }
        else { var sec = SINGLE && el.closest('[data-page]'); a.push({id: el.id, page: pg, text: text.slice(0, 220), ctx: ctxOf(el), title: sec ? (sec.getAttribute('data-title') || pg) : document.title.replace(/ · Week.*$/, ''), t: Date.now()});
               b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); b.innerHTML = '<span class="bm-icon">★</span><span class="bm-text">On Card</span>'; }
        save(a); count();
        var lst = document.getElementById('bm-list'); if (lst) render(lst);
        var drw = document.getElementById('drawer-bm-list'); if (drw && window.renderCardDrawer) window.renderCardDrawer();
      });
      host.insertBefore(b, host.firstChild);
    });
    count();
    if (location.hash.length > 1){
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t){ if (t.tagName === 'DETAILS') t.open = true; var p = t.parentElement; while (p){ if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
              t.scrollIntoView({block: 'center'}); t.classList.add('bm-flash'); }
    }
    var list = document.getElementById('bm-list');
    if (list) render(list);
  }
  function render(list){
    var a = load();
    if (!a.length){ list.innerHTML = '<p class="muted-note">No bookmarks yet. Tap ☆ next to any pick, leg or table row.</p>'; return; }
    var groups = {}, orderG = [];
    a.forEach(function(b){
      var pgKey = b.page ? b.page.replace(/\.html$/, '') : (b.ctx || 'Starred Picks');
      if (!groups[pgKey]){ groups[pgKey] = []; orderG.push(pgKey); }
      groups[pgKey].push(b);
    });
    list.innerHTML = '';
    orderG.forEach(function(pg){
      var g = document.createElement('div'); g.className = 'bm-group';
      var h = document.createElement('h3'); h.textContent = groups[pg][0].title || groups[pg][0].ctx || pg; g.appendChild(h);
      groups[pg].forEach(function(b){
        var r = document.createElement('div'); r.className = 'bm-row';
        var l = document.createElement('a'); l.href = hrefOf(b); l.textContent = b.text;
        var c = document.createElement('span'); c.className = 'bm-ctx'; c.textContent = b.ctx || ''; l.appendChild(c);
        var x = document.createElement('button'); x.type = 'button'; x.className = 'btn-toggle'; x.textContent = 'Remove';
        x.addEventListener('click', function(){ save(load().filter(function(z){ return !(z.id === b.id && z.page === b.page); })); count(); render(list); });
        r.appendChild(l); r.appendChild(x); g.appendChild(r);
      });
      list.appendChild(g);
    });
  }
  function wire(){
    var c = document.getElementById('bm-clear'), cp = document.getElementById('bm-copy'), list = document.getElementById('bm-list');
    if (c) c.addEventListener('click', function(){ save([]); count(); if (list) render(list); });
    if (cp) cp.addEventListener('click', function(){
      var txt = load().map(function(b){ return '- ' + b.text + ' (' + (b.title || b.page) + ')'; }).join('\n');
      try { navigator.clipboard.writeText(txt); cp.textContent = 'Copied'; } catch(e){ cp.textContent = 'Copy failed'; }
      setTimeout(function(){ cp.textContent = 'Copy list as text'; }, 1600);
    });
  }
  function calc(){
    var box = document.getElementById('teaser-calc'); if (!box) return;
    function dec(o){ o = +o; return o > 0 ? 1 + o / 100 : 1 + 100 / -o; }
    function comb(n, k){ if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    function run(){
      var p = (+document.getElementById('tc-p').value || 74) / 100;
      var o2 = document.getElementById('tc-2').value, o3 = document.getElementById('tc-3').value, o4 = document.getElementById('tc-4').value;
      var rows = [['2-team', 2, 2, o2], ['3-team', 3, 3, o3], ['4-team', 4, 4, o4], ['3 legs by 2s', 3, 2, o2], ['4 legs by 2s', 4, 2, o2], ['4 legs by 3s', 4, 3, o3]];
      var h = '<table class="no-bm"><thead><tr><th>Ticket</th><th>Break-even per leg</th><th>EV per $</th><th>Chance of a profit</th></tr></thead><tbody>';
      rows.forEach(function(r){
        var n = r[1], s = r[2], d = dec(r[3]), cb = comb(n, s), ev = 0, pp = 0;
        for (var k = 0; k <= n; k++){ var pk = comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); var ret = k >= s ? comb(k, s) * d : 0; ev += pk * ret; if (ret > cb) pp += pk; }
        ev = ev / cb - 1;
        var be = Math.pow(1 / d, 1 / s) * 100;
        h += '<tr><td><b>' + r[0] + '</b></td><td>' + be.toFixed(1) + '%</td><td class="' + (ev > 0 ? 'ev-pos' : 'ev-neg') + '">' + (ev >= 0 ? '+' : '') + (ev * 100).toFixed(1) + '%</td><td>' + (pp * 100).toFixed(0) + '%</td></tr>';
      });
      document.getElementById('tc-out').innerHTML = h + '</tbody></table>';
    }
    box.querySelectorAll('input').forEach(function(i){ i.addEventListener('input', run); });
    run();
  }
  function legs(){
    var f = document.getElementById('legs-filter'); if (!f) return;
    var kind = 'All';
    var selectedGame = 'All';
    var q = document.getElementById('lf-q'), card = document.getElementById('lf-card'), multi = document.getElementById('lf-multi'), priced = document.getElementById('lf-priced');
    function apply(){
      var term = (q.value || '').trim().toLowerCase(), shown = 0;
      document.querySelectorAll('.prop-category-group').forEach(function(catGrp){
        var catName = catGrp.getAttribute('data-cat') || '';
        var isCatMatch = (kind === 'All' || catName === kind);
        var n = 0;
        catGrp.querySelectorAll('.prop-card').forEach(function(l){
          var ok = isCatMatch
            && (selectedGame === 'All' || l.getAttribute('data-game') === selectedGame)
            && (!card.checked || l.getAttribute('data-card') === '1')
            && (!multi.checked || +l.getAttribute('data-sup') >= 2)
            && (!priced.checked || l.getAttribute('data-bad') !== '1')
            && (!term || l.getAttribute('data-player').indexOf(term) >= 0 || (l.getAttribute('data-team') || '').indexOf(term) >= 0);
          l.hidden = !ok;
          if (ok) n++;
        });
        catGrp.querySelectorAll('.cat-game-head').forEach(function(hd){
          var m = hd.querySelectorAll('.prop-card:not([hidden])').length;
          hd.hidden = (m === 0);
          var cc = hd.querySelector('.cg-count'); if (cc) cc.textContent = m;
          if (term && m) hd.open = true;
        });
        var c = catGrp.querySelector('.cat-count'); if (c) c.textContent = n;
        var none = catGrp.querySelector('.cat-none'); if (none) none.hidden = n > 0;
        catGrp.hidden = (n === 0);
        shown += n;
      });
      document.querySelectorAll('.legs-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('.leg').forEach(function(l){
          var ok = (kind === 'All' || l.getAttribute('data-kind') === kind)
            && (!card.checked || l.getAttribute('data-card') === '1')
            && (!multi.checked || +l.getAttribute('data-sup') >= 2)
            && (!priced.checked || l.getAttribute('data-bad') !== '1')
            && (!term || l.getAttribute('data-player').indexOf(term) >= 0);
          l.hidden = !ok; if (ok) n++;
        });
        var c = g.querySelector('.lg-n'); if (c) c.textContent = n;
        var none = g.querySelector('.lg-none'); if (none) none.hidden = n > 0;
        g.hidden = n === 0; if (n) shown += n;
      });
      var out = document.getElementById('lf-count');
      if (out) out.textContent = shown + ' props shown';
    }
    f.querySelectorAll('.lf-kind').forEach(function(b){
      b.addEventListener('click', function(){
        kind = b.getAttribute('data-kind');
        f.querySelectorAll('.lf-kind').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
        apply();
      });
    });
    [card, multi, priced].forEach(function(x){ x.addEventListener('change', apply); });
    if (q) q.addEventListener('input', function(){
      apply();
      if (q.value.trim()){
        document.querySelectorAll('.prop-category-group:not([hidden]), .legs-game:not([hidden])').forEach(function(g){ g.open = true; });
      }
    });
    document.querySelectorAll('.lf-game-link').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        selectedGame = a.getAttribute('data-game') || 'All';
        document.querySelectorAll('.lf-game-link').forEach(function(x){ x.classList.toggle('active', x === a); });
        apply();
      });
    });
    function setAll(sel, v){ document.querySelectorAll(sel).forEach(function(d){ if (!d.hidden) d.open = v; }); }
    var btnOpen = document.getElementById('lf-open'); if (btnOpen) btnOpen.addEventListener('click', function(){ setAll('.prop-category-group, .legs-game', true); });
    var btnGO = document.getElementById('lf-games-open'); if (btnGO) btnGO.addEventListener('click', function(){ document.querySelectorAll('.cat-game-head').forEach(function(d){ d.open = true; }); });
    var btnGC = document.getElementById('lf-games-close'); if (btnGC) btnGC.addEventListener('click', function(){ document.querySelectorAll('.cat-game-head').forEach(function(d){ d.open = false; }); });
    var btnClose = document.getElementById('lf-close'); if (btnClose) btnClose.addEventListener('click', function(){ setAll('.prop-category-group, .legs-game', false); });
    var btnExpand = document.getElementById('lf-expand'); if (btnExpand) btnExpand.addEventListener('click', function(){ setAll('.prop-category-group, .legs-game', true); setAll('.prop-card, .prop-card-intel, .leg', true); });
    var btnCollapse = document.getElementById('lf-collapse'); if (btnCollapse) btnCollapse.addEventListener('click', function(){ setAll('.prop-card, .prop-card-intel, .leg', false); });
    apply();
  }
  function recFilter(){
    var bar = document.getElementById('rec-filter'); if (!bar) return;
    bar.querySelectorAll('button[data-t]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-t');
      bar.querySelectorAll('button[data-t]').forEach(function(x){ x.classList.toggle('btn-primary', x === b); });
      document.querySelectorAll('.rec-game').forEach(function(g){
        var n = 0;
        g.querySelectorAll('tbody tr[data-t]').forEach(function(tr){
          var ok = k === 'all' || tr.getAttribute('data-t').split(' ').indexOf(k) >= 0; tr.style.display = ok ? '' : 'none'; if (ok) n++; });
        g.querySelectorAll('.rp[data-t]').forEach(function(sp){
          sp.hidden = !(k === 'all' || sp.getAttribute('data-t').split(' ').indexOf(k) >= 0); });
        g.style.display = n ? '' : 'none';
      });
    }); });
  }
  function muJump(){
    document.querySelectorAll('.mu-jump-link').forEach(function(a){ a.addEventListener('click', function(){
      var h = a.getAttribute('href'); if (h.charAt(0) !== '#') return;
      var t = document.getElementById(h.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }); });
    document.querySelectorAll('.mu-all').forEach(function(b){ b.addEventListener('click', function(){
      var v = b.getAttribute('data-open') === '1'; document.querySelectorAll('.mu-card').forEach(function(d){ d.open = v; }); }); });
  }
  function teaserFilter(){
    var tfAll = document.getElementById('tf-all');
    var tfWong = document.getElementById('tf-wong');
    if (!tfAll || !tfWong) return;
    tfAll.addEventListener('click', function(){
      tfAll.classList.add('active'); tfWong.classList.remove('active');
      document.querySelectorAll('.tc-row').forEach(function(r){ r.style.display = ''; });
    });
    tfWong.addEventListener('click', function(){
      tfWong.classList.add('active'); tfAll.classList.remove('active');
      document.querySelectorAll('.tc-row').forEach(function(r){ r.style.display = r.getAttribute('data-wong') === '1' ? '' : 'none'; });
    });
  }
  function go(){ setup(); wire(); calc(); legs(); recFilter(); muJump(); teaserFilter(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
"""
