from pathlib import Path
from bs4 import BeautifulSoup

txt = Path('dist/nfl_week5_master_packet/Platinum_Rose_NFL_Week5_Intel.html').read_text(encoding='utf-8')
soup = BeautifulSoup(txt, 'html.parser')

def clean(s):
    return str(s).encode('ascii', errors='replace').decode('ascii')

index_sec = soup.find('section', {'data-page': 'index'})
print("=== Section [data-page=index] ===")
pills = index_sec.find_all('a', class_='at-glance-pill')
print(f"Pills in Section 1: {len(pills)}")
for p in pills[:3]:
    print("  Pill:", clean(p)[:120])

details = index_sec.find_all('details')
print(f"Details in Section 1: {len(details)}")
for d in details[:10]:
    s = d.find('summary')
    print("  Details id:", d.get('id'), "| summary:", clean(s.get_text(' ', strip=True)[:70]) if s else "none")

# Check what elements have .bm-item across all sections
bm_items = soup.find_all(class_='bm-item')
print(f"Total elements with .bm-item in HTML: {len(bm_items)}")
for b in bm_items[:5]:
    print("  bm-item:", b.name, b.get('class'), b.get('id'), clean(b.get_text(' ', strip=True)[:60]))

# Check tables in index section
tables = index_sec.find_all('table')
print(f"Total tables in index section: {len(tables)}")
for i, t in enumerate(tables):
    rows = t.find_all('tr')
    print(f"  Table {i}: {len(rows)} rows, header: {clean(rows[0].get_text(' ', strip=True)[:60])}")
