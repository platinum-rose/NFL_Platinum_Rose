"""Grade frozen SuperContest sides against saved ESPN box scores."""
import glob
import json
import re
import html
from pathlib import Path
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[2]
ALIASES = {'WSH': 'WAS', 'JAC': 'JAX', 'LVR': 'LV', 'NOS': 'NO', 'LA': 'LAR'}
TEAM_NAMES = {
    'ARI': 'Arizona', 'ATL': 'Atlanta', 'BAL': 'Baltimore', 'BUF': 'Buffalo', 'CAR': 'Carolina',
    'CHI': 'Chicago', 'CIN': 'Cincinnati', 'CLE': 'Cleveland', 'DAL': 'Dallas', 'DEN': 'Denver',
    'DET': 'Detroit', 'GB': 'Green Bay', 'HOU': 'Houston', 'IND': 'Indianapolis', 'JAX': 'Jacksonville',
    'KC': 'Kansas City', 'LV': 'Las Vegas', 'LAC': 'Chargers', 'LAR': 'Rams', 'MIA': 'Miami',
    'MIN': 'Minnesota', 'NE': 'New England', 'NO': 'New Orleans', 'NYG': 'Giants', 'NYJ': 'Jets',
    'PHI': 'Philadelphia', 'PIT': 'Pittsburgh', 'SF': 'San Francisco', 'SEA': 'Seattle', 'TB': 'Tampa Bay',
    'TEN': 'Tennessee', 'WAS': 'Washington',
}


@lru_cache(maxsize=None)
def _boxscore_map(week):
    boxes = {}
    for path in glob.glob(str(ROOT / 'data/fantasy/boxscores/espn-*.json')):
        try:
            data = json.loads(Path(path).read_text(encoding='utf-8'))
            if data['header'].get('week') != int(week):
                continue
            comp = data['header']['competitions'][0]
            if not comp.get('status', {}).get('type', {}).get('completed'):
                continue
            teams = {}
            for item in comp['competitors']:
                abbr = ALIASES.get(item['team']['abbreviation'], item['team']['abbreviation'])
                teams[item['homeAway']] = (abbr, int(item.get('score') or 0))
            for side in ('home', 'away'):
                other = 'away' if side == 'home' else 'home'
                team, opp = teams[side], teams[other]
                boxes[team[0]] = (team[1], opp[0], opp[1], teams)
        except (KeyError, TypeError, ValueError, IndexError):
            continue

    # Week 1's archived post-mortem scorecard preserves the final scores for
    # games whose ESPN boxscore snapshots are no longer in the live boxscore set.
    if int(week) == 1:
        recap_path = ROOT / 'reports/bets/season-recap/w1gamesum.json'
        try:
            recap_games = json.loads(recap_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            recap_games = []
        for game in recap_games if isinstance(recap_games, list) else []:
            try:
                away, home = game['away'], game['home']
                away_score, home_score = int(game['score'][0]), int(game['score'][1])
                teams = {'away': (away, away_score), 'home': (home, home_score)}
                boxes.setdefault(away, (away_score, home, home_score, teams))
                boxes.setdefault(home, (home_score, away, away_score, teams))
            except (KeyError, TypeError, ValueError, IndexError):
                continue

    return boxes


def grade_picks(week, picks):
    """Return pick-level outcomes for dict picks or `TEAM +/-line` strings.

    Missing/incomplete box scores are marked unknown and excluded from scoring.
    """
    boxes = _boxscore_map(int(week))
    out = []
    for item in picks or []:
        if isinstance(item, dict):
            team = item.get('team') or item.get('pickTeam')
            spread = item.get('spread')
            label = item.get('spreadLabel') or item.get('pickLabel') or f'{team} {spread}'
        else:
            match = re.match(r'^\s*([A-Z]{2,3})\s+([+−-]?\d+(?:\.\d+)?)', str(item))
            if not match:
                out.append(dict(pick=str(item), result='?', final='', margin=None))
                continue
            team, line = match.groups()
            spread = float(line.replace('−', '-'))
            label = f'{team} {line}'
        team = ALIASES.get(str(team or '').upper(), str(team or '').upper())
        try:
            spread = float(spread)
        except (TypeError, ValueError):
            out.append(dict(pick=label, result='?', final='', margin=None))
            continue
        if team not in boxes:
            out.append(dict(pick=label, result='?', final='', margin=None))
            continue
        own, opp, opp_score, teams = boxes[team]
        margin = own - opp_score + spread
        result = 'Win' if margin > 0 else ('Push' if margin == 0 else 'Loss')
        final = f"{teams['away'][0]} {teams['away'][1]}–{teams['home'][0]} {teams['home'][1]}"
        note = 'missed by the hook (half point)' if result == 'Loss' and margin >= -0.5 else ('missed by a point or less' if result == 'Loss' and margin >= -1 else '')
        out.append(dict(pick=label, team=team, spread=spread, result=result, final=final, margin=margin, note=note))
    return out


def score_picks(rows):
    wins = sum(r.get('result') == 'Win' for r in rows)
    losses = sum(r.get('result') == 'Loss' for r in rows)
    pushes = sum(r.get('result') == 'Push' for r in rows)
    unknown = sum(r.get('result') not in ('Win', 'Loss', 'Push') for r in rows)
    points = wins + pushes * 0.5
    summary = f'{wins}–{losses}' + (f'–{pushes}' if pushes else '') + f' ({points:g} pts)'
    return dict(wins=wins, losses=losses, pushes=pushes, unknown=unknown, points=points, summary=summary)


def _plain(text):
    text = re.sub(r'<br\s*/?>', ' ', text or '', flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


@lru_cache(maxsize=None)
def _week_games(week):
    path = ROOT / f'reports/bets/season-recap/w{int(week)}gamesum.json'
    try:
        games = json.loads(path.read_text(encoding='utf-8'))
        return games if isinstance(games, list) else []
    except (OSError, json.JSONDecodeError):
        return []


@lru_cache(maxsize=None)
def _legacy_postmortems(week):
    paths = {
        1: ROOT / 'reports/bets/season-recap/week1-post-mortem.html',
        2: ROOT / 'reports/bets/season-recap/week2-post-mortem.html',
        3: ROOT / 'reports/bets/week3-recap/week3-post-mortem.html',
        4: ROOT / 'reports/bets/season-recap/week4-post-mortem.html',
    }
    path = paths.get(int(week))
    if not path or not path.exists():
        return {}
    text = path.read_text(encoding='utf-8')
    out = {}
    for article in re.findall(r'<article class="game".*?</article>', text, re.S | re.I):
        h3 = re.search(r'<h3[^>]*>(.*?)</h3>', article, re.S | re.I)
        heading = _plain(h3.group(1)) if h3 else ''
        match = re.search(r'\b([A-Z]{2,3})\s+\d+\s+@\s+([A-Z]{2,3})\s+\d+', heading)
        if not match:
            continue
        away, home = match.groups()
        fields = {}
        for dt, dd in re.findall(r'<dt[^>]*>(.*?)</dt>\s*<dd[^>]*>(.*?)</dd>', article, re.S | re.I):
            fields[_plain(dt).lower()] = _plain(dd)
        out[frozenset((away, home))] = fields
    return out


def _markdown_section(text, heading):
    match = re.search(r'^###\s+' + re.escape(heading) + r'\s*\n(.*?)(?=^###\s+|\Z)', text, re.M | re.S | re.I)
    return re.sub(r'\s+', ' ', match.group(1)).strip() if match else ''


@lru_cache(maxsize=None)
def _narratives(week):
    path = ROOT / f'reports/intel/master-intel-narratives-2026-w{int(week):02d}.md'
    if not path.exists():
        return {}
    text = path.read_text(encoding='utf-8')
    sections = re.split(r'^##\s+([^\n]+)\s*$', text, flags=re.M)
    out = {}
    for i in range(1, len(sections), 2):
        name, body = sections[i].strip().upper(), sections[i + 1]
        teams = re.fullmatch(r'([A-Z]{2,3})\s*@\s*([A-Z]{2,3})', name)
        if teams:
            out[frozenset(teams.groups())] = {
                'projection': next((ln.split(':', 1)[1].strip() for ln in body.splitlines() if ln.lower().startswith('projection:')), ''),
                'game script': _markdown_section(body, 'Game script'),
                'why the card leans this way': _markdown_section(body, 'Why the card leans this way'),
                'what breaks it': _markdown_section(body, 'What breaks it'),
            }
    return out


def _expert_sides(week, teams):
    """Return archived named side picks, split into the picked and opposing teams."""
    selected = {teams[0]: [], teams[1]: []}
    rows = []
    if int(week) in (2, 3):
        path = ROOT / 'reports/bets/season-recap/expert_sides.json'
        try:
            source = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError):
            source = []
        for row in source:
            if row.get('week') != int(week) or row.get('bet_type') != 'spread':
                continue
            label = str(row.get('label') or '').strip()
            if re.search(r'\b(?:ML|money\s*line|over|under|total|prop)\b', label, re.I):
                continue
            match = re.match(r'^([A-Z]{2,3})\b', label.upper())
            team = ALIASES.get(match.group(1), match.group(1)) if match else None
            if team not in selected:
                continue
            rows.append((team, str(row.get('h') or 'Expert'), label, row.get('tweet')))
    elif int(week) >= 4:
        path = ROOT / f'data/generated/master-intel/w{int(week):02d}-expert-verified.json'
        try:
            source = json.loads(path.read_text(encoding='utf-8')).get('rows', [])
        except (OSError, json.JSONDecodeError, AttributeError):
            source = []
        for row in source:
            if row.get('verdict') != 'verified' or row.get('market') not in ('spread', 'contest'):
                continue
            if row.get('game') not in (f'{teams[0]}@{teams[1]}', f'{teams[1]}@{teams[0]}'):
                continue
            team = ALIASES.get(str(row.get('side') or '').upper(), str(row.get('side') or '').upper())
            if team not in selected:
                continue
            name = ', '.join(row.get('persons') or []) or row.get('outlet') or 'Expert'
            line = row.get('selection') or team
            if re.search(r'\b(?:ML|money\s*line|over|under|total|prop)\b', str(line), re.I):
                continue
            if row.get('line') is not None:
                try:
                    line += f' ({float(row["line"]):+g})'
                except (TypeError, ValueError):
                    line += f' ({row["line"]})'
            rows.append((team, name, line, row.get('url')))
    for team, name, label, url in rows:
        if not any(x['name'] == name for x in selected[team]):
            selected[team].append({'name': name, 'pick': label, 'url': url})
    return selected


def pick_postmortem(week, pick, review_row=None):
    """Build evidence-backed per-game context for a frozen spread pick."""
    team = ALIASES.get(str(pick.get('team') or '').upper(), str(pick.get('team') or '').upper())
    game = next((g for g in _week_games(week) if team in (ALIASES.get(g.get('away'), g.get('away')), ALIASES.get(g.get('home'), g.get('home')))), None)
    if not game:
        return {'assessment': _assessment(pick), 'matchup': team, 'pregame': [], 'experts': {}, 'postmortem': 'No saved game-summary record was found for this selection.'}
    away, home = game['away'], game['home']
    teams = frozenset((away, home))
    legacy = _legacy_postmortems(week).get(teams, {})
    narrative = _narratives(week).get(teams, {})
    pregame = []
    projection = legacy.get('ai model projection') or legacy.get('master intel projection') or legacy.get('our projection') or legacy.get('market-implied score') or narrative.get('projection')
    if projection:
        parsed = {abbr.upper(): value for abbr, value in re.findall(r'\b([A-Z]{2,3})\s+(-?\d+(?:\.\d+)?)', projection, re.I)
                  if abbr.upper() in (away.upper(), home.upper())}
        if away.upper() in parsed and home.upper() in parsed:
            projection = f'{away} {parsed[away.upper()]}, {home} {parsed[home.upper()]}'
            pregame.append(('Saved projected score', projection))
    try:
        contest_spread = float(pick.get('spread'))
        pregame.append(('Frozen contest spread', f'{team} {contest_spread:+g}'))
    except (TypeError, ValueError):
        contest_spread = None
    experts = _expert_sides(week, (away, home))
    opposing = home if team == away else away
    actual_team_margin = None
    if team == away:
        actual_team_margin = int(game['score'][0]) - int(game['score'][1])
    elif team == home:
        actual_team_margin = int(game['score'][1]) - int(game['score'][0])
    projected_scores = {
        abbr.upper(): float(value)
        for abbr, value in re.findall(r'\b([A-Z]{2,3})\s+(-?\d+(?:\.\d+)?)', projection or '', re.I)
        if abbr.upper() in (away.upper(), home.upper())
    }
    evaluation = ''
    opponent = home if team == away else away
    if actual_team_margin is not None and team.upper() in projected_scores and opponent.upper() in projected_scores:
        projected_margin = projected_scores[team.upper()] - projected_scores[opponent.upper()]
        delta = actual_team_margin - projected_margin
        forecast = f'win by {projected_margin:g}' if projected_margin > 0 else f'lose by {abs(projected_margin):g}' if projected_margin < 0 else 'finish tied'
        evaluation = f"Pregame projection had {team} to {forecast}; actual margin was {actual_team_margin:+g}. Margin error versus projection: {delta:+g} points."
    game_recap = ''
    game_review = ''
    if actual_team_margin is not None:
        team_stats = game.get(team, {}) or {}
        opp = home if team == away else away
        opp_stats = game.get(opp, {}) or {}
        stats = []
        for abbr, payload in ((team, team_stats), (opp, opp_stats)):
            facts = [str(payload[k]) for k in ('qb', 'rush', 'to') if payload.get(k) not in (None, '')]
            if facts:
                stats.append(f'{abbr}: ' + '; '.join(facts))
        game_recap = f"Final: {pick.get('final') or ''}. " + (' '.join(stats) if stats else f'{team} finished with an actual margin of {actual_team_margin:+g}.')
    review_notes = []
    return {
        'assessment': _assessment(pick),
        'matchup': f'{away} @ {home}',
        'final': pick.get('final') or '',
        'pregame': pregame,
        'experts': {'picked': experts.get(team, []), 'opposing': experts.get(opposing, [])},
        'projection_check': evaluation,
        'postmortem': game_recap,
        'game_review': game_review,
        'review_notes': review_notes,
        'expert_sources_available': int(week) in (2, 3, 4, 5, 6),
    }


def _assessment(pick):
    result, margin = pick.get('result'), pick.get('margin')
    if result == 'Win':
        return f"Covered by {margin:g} ATS points." if margin is not None else 'Covered.'
    if result == 'Push':
        return 'Push at the contest line.'
    if result != 'Loss' or margin is None:
        return 'Ungraded: no completed final is saved.'
    miss = abs(float(margin))
    if miss <= 3:
        return f'Near miss: missed the cover by {miss:g} ATS points.'
    if miss >= 10:
        return f'Completely off: missed the cover by {miss:g} ATS points.'
    return f'Missed the cover by {miss:g} ATS points; not a near-miss.'


def postmortem_html(week, pick, review_row=None):
    """Render a compact expandable game post-mortem for one graded pick."""
    info = pick_postmortem(week, pick, review_row)
    esc = lambda value: html.escape(str(value or ''), quote=True)
    out = ['<details class="sc-pick-postmortem"><summary>Game post-mortem</summary><div class="sc-pick-postmortem-body">',
           f'<p><b>{esc(info["matchup"])} · {esc(pick.get("pick"))}:</b> {esc(info["assessment"])}</p>']
    if info.get('final'):
        out.append(f'<p><b>Final:</b> {esc(info["final"])}</p>')
    if info.get('pregame'):
        out.append('<h5>Pre-kickoff analysis</h5><ul>')
        out.extend(f'<li><b>{esc(label)}:</b> {esc(text[:900])}</li>' for label, text in info['pregame'])
        out.append('</ul>')
    else:
        out.append('<p class="muted-note">No saved pre-kickoff game analysis was found for this matchup.</p>')
    if info.get('projection_check'):
        out.append(f'<p><b>Outcome vs projection:</b> {esc(info["projection_check"])}</p>')
    if info.get('postmortem'):
        out.append(f'<p><b>Game outcome:</b> {esc(info["postmortem"][:900])}</p>')
    if info.get('game_review'):
        out.append(f'<p><b>Post-mortem:</b> {esc(info["game_review"][:900])}</p>')
    if info.get('review_notes'):
        out.append('<p><b>Pick-specific review notes:</b> ' + ' '.join(esc(x) for x in info['review_notes']) + '</p>')
    experts = info.get('experts') or {}
    out.append('<h5>Archived expert spread picks</h5><ul>')
    for label, key in (('On this side', 'picked'), ('On the other side', 'opposing')):
        picks = experts.get(key, [])
        if picks:
            value = ', '.join(f'{p["name"]} ({p["pick"]})' for p in picks)
        elif not info.get('expert_sources_available'):
            value = 'No named expert-side archive is available for this week.'
        else:
            value = 'No archived picks found for this side and game.'
        if picks:
            out.append(f'<li><b>{label}:</b><ul>')
            for source in picks:
                name = esc(source['name'])
                if source.get('url'):
                    name = f'<a href="{esc(source["url"])}" target="_blank" rel="noopener">{name} ↗</a>'
                out.append(f'<li>{name} — {esc(source["pick"])}</li>')
            out.append('</ul></li>')
        else:
            out.append(f'<li><b>{label}:</b> {esc(value)}</li>')
    out.append('</ul></div></details>')
    return ''.join(out)
