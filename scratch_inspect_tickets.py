from pathlib import Path
from bs4 import BeautifulSoup

txt = Path('dist/nfl_week5_master_packet/Platinum_Rose_NFL_Week5_Intel.html').read_text(encoding='utf-8')
soup = BeautifulSoup(txt, 'html.parser')

def clean(s): return str(s).encode('ascii', errors='replace').decode('ascii')

rp = soup.find('details', id='rec-parlays')
if rp:
    for d in rp.find_all('details'):
        s = d.find('summary')
        print("  Ticket id:", d.get('id'), "| summary:", clean(s.get_text(' ', strip=True)[:70]) if s else "none")
