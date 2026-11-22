import glob, json, os, time
def info(pat):
    fs = sorted(glob.glob(pat), key=os.path.getmtime)
    if not fs: return 'MISSING'
    f = fs[-1]; return f"{time.strftime('%m-%d %H:%M', time.localtime(os.path.getmtime(f)))}  {os.path.basename(f)}" + (f'  (+{len(fs)-1} more)' if len(fs) > 1 else '')
P = {
 'BKR live': 'data/generated/props/bookmaker-live-2026-11-21-week11.json', 'BOL live': 'data/generated/props/betonline-live-*week11.json',
 'DK predictions': 'data/generated/props/draftkings-predictions-feed-*week11.json', 'AN openers': 'data/odds/actionnetwork-openers-2026-w11.json',
 'contest lines': 'data/supercontest/week-11-lines.json', 'schedule': 'public/schedule.json',
 'injuries': 'data/player-availability/latest.json', 'secondary matchups': 'data/secondary-matchups/latest.json', 'rosters': 'data/nfl-rosters/espn-full-rosters-latest.json',
 'article pull': 'data/generated/master-intel/w11-pull.json', 'expert verified': 'data/generated/master-intel/w11-expert-verified.json', 'big money': 'data/generated/master-intel/big-money-flags-2026-w11.json',
 'email props': 'data/generated/master-intel/w11-email-props-*.json', 'youtube picks': 'data/podcasts/youtube-extracted-picks-2026-w11.json',
 'twitter video picks': 'data/twitter/twitter-video-picks-2026-w11.json', 'grok csv': 'data/vault-seed/manual/grok-week11-threads/*.csv', 'chrome article picks': 'data/intel/extracted/2026-w11-chrome-article-picks.json',
 'expert review': 'reports/intel/expert-review-2026-w11.json', 'expert narratives': 'reports/intel/expert-narratives-2026-w11.md', 'player-props intel': 'data/research-intel/review/player-props-intel-latest.json',
 'game packets (proposed)': 'data/research-intel/proposed/games-w11/*', 'game sides/props files': 'reports/intel/games/2026-w11-game-*.md',
 'survivor intel': 'data/survivor/pick-intel-2026-w11.json',
 '-- NOT read by build --': '', 'reviewed podcast picks': 'data/intel/articles/2026-w11/reviewed-podcast-picks.json', 'bookmark digest': 'data/intel/articles/2026-w11/bookmark-text-intelligence-digest.md',
 'fair lines': 'reports/intel/w11-model/fair-lines-w11.json', 'margin sim': 'reports/intel/w11-model/sim-w11-sat.json', 'weather': 'data/research-intel/review/2026-w11-weather-venue.json',
 'QB starters': 'data/projected-starters/2026/manual/qb-starters-2026-w11.json', 'public source picks': 'data/research-intel/review/2026-w11-public-source-picks.json', 'prediction markets': 'data/prediction-markets/*',
}
for k, v in P.items(): print(f'{k:26} {info(v) if v else ""}')
# Are Antigravity's reviewed podcast experts in any file the build reads?
names = ['Kezirian', 'Hribar', 'Middleton', 'Erickson', 'Ed Feng', 'Holka', 'Gartenberg', 'Cody Brown']
srcs = {k: P[k] for k in ['youtube picks', 'twitter video picks', 'chrome article picks', 'expert verified', 'article pull']}
for n in names:
    hit = [k for k, pat in srcs.items() for f in glob.glob(pat) if n in open(f, encoding='utf-8', errors='ignore').read()]
    hit += ['grok csv'] if any(n in open(f, encoding='utf-8', errors='ignore').read() for f in glob.glob(P['grok csv'])) else []
    print(f'  {n:12} -> {hit or "NOT in any build input"}')
