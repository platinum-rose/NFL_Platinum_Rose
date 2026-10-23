from pathlib import Path
from bs4 import BeautifulSoup
import re

txt = Path('dist/nfl_week5_master_packet/Platinum_Rose_NFL_Week5_Intel.html').read_text(encoding='utf-8')
soup = BeautifulSoup(txt, 'html.parser')

print("=== Checking where users look for Add to Card buttons ===")

# 1. At-a-glance picks bar
pills_bar = soup.find('div', class_='at-a-glance-bar')
print("At-a-glance bar found:", bool(pills_bar))
if pills_bar:
    for pill in pills_bar.find_all('a', class_='at-glance-pill')[:5]:
        print("  Pill text:", pill.get_text(' ', strip=True), "| html:", str(pill)[:100])

# 2. Straight bets summary / game boxes
rec_straight = soup.find('details', id='rec-straight')
if rec_straight:
    game_boxes = rec_straight.find_all('details', recursive=False)
    print(f"rec-straight game boxes: {len(game_boxes)}")
    for gb in game_boxes[:3]:
        s = gb.find('summary')
        print("  Game summary:", s.get_text(' ', strip=True) if s else "")

# 3. Super Contest section (sc.html / #sc)
sc_sec = soup.find('section', {'data-page': 'sc'})
if sc_sec:
    tiles = sc_sec.find_all('a', class_='sc-tile')
    print(f"SuperContest tiles in #/sc: {len(tiles)}")
    for t in tiles[:3]:
        print("  SC Tile:", t.get_text(' ', strip=True))
        print("    has button?", bool(t.find('button')))
    picks = sc_sec.find_all('article', class_='sc-pick')
    print(f"SuperContest article cards: {len(picks)}")
    for p in picks[:2]:
        print("    SC Article:", p.find('h3').get_text(' ', strip=True) if p.find('h3') else "")
        print("    has button?", bool(p.find('button')))

# 4. Props Lab section (#/props)
props_sec = soup.find('section', {'data-page': 'props'})
if props_sec:
    legs = props_sec.find_all('details', class_='leg')
    print(f"Props Lab legs: {len(legs)}")
    for l in legs[:2]:
        s = l.find('summary')
        print("  Leg summary:", s.get_text(' ', strip=True) if s else "")
        print("    has button?", bool(l.find('button')))

# 5. Matchups section (#/games and game-*)
games_sec = soup.find('section', {'data-page': 'games'})
if games_sec:
    game_cards = games_sec.find_all('a', class_='game-card')
    print(f"Matchup game cards: {len(game_cards)}")
